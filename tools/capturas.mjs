/**
 * Capturas y medidas por CDP para la paridad visual contra baseline/html/.
 *
 *   node tools/capturas.mjs antes|despues [base]     cabecera abierta/cerrada (375+1440)
 *   node tools/capturas.mjs full  <url> <ancho> <salida.png>
 *   node tools/capturas.mjs recorte <url> <ancho> <selector>=<salida.png> ...
 *   node tools/capturas.mjs medir <url> <ancho> [salida.json]
 *   node tools/capturas.mjs diff  <a.json> <b.json>
 *
 * Chrome headless por CDP y no Puppeteer: no se anade una dependencia de JS al
 * proyecto solo para hacer capturas. `--screenshot` a secas no vale porque el
 * estado "abierto" hay que provocarlo con un click.
 *
 * `medir` es el instrumento de la FASE 3: vuelca rect + computed styles de TODO
 * elemento con clase, indexado por la clase y no por la posicion en el arbol.
 * El baseline y el port no tienen el mismo numero de nodos (falta la seccion de
 * equipo, sobran los labels de formulario...), asi que cualquier clave posicional
 * desalinea el diff a la primera diferencia y lo vuelve ilegible. Las clases de
 * Webflow son verbatim en los dos lados, o sea que son la clave estable.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { setTimeout as espera } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Puerto y perfil salen del entorno porque la auditoria corre SEIS agentes a la
// vez: con el 9222 y el perfil fijos, el segundo Chrome se adjunta al primero y
// las medidas se mezclan entre rutas sin dar ningun error. Cada agente pide los
// suyos. En uso manual no hace falta tocar nada.
const PUERTO = Number(process.env.AMS_PUERTO ?? 9222);
const PERFIL = process.env.AMS_PERFIL ?? "/tmp/ams-capturas";
const DESTINO = "baseline/diseno";
const [comando = "antes", ...args] = process.argv.slice(2);

/** Propiedades que deciden si dos renders son el mismo diseno. */
const PROPS = [
  "display", "position", "width", "height",
  "font-family", "font-weight", "font-size", "font-style", "line-height", "letter-spacing",
  "text-transform", "text-decoration-line", "color", "background-color",
  "padding", "margin", "border-radius", "object-fit", "opacity",
  "grid-template-columns", "column-count", "gap", "flex-flow",
  "clip-path", "list-style-type", "aspect-ratio",
];

// ---------------------------------------------------------------- diff (sin Chrome)
if (comando === "diff") {
  const [a, b] = args.map((f) => JSON.parse(readFileSync(f, "utf8")));
  const clave = (m) => `${m.sel}[${m.i}]`;
  const mapa = (o) => new Map(o.nodos.map((m) => [clave(m), m]));
  const A = mapa(a), B = mapa(b);
  let n = 0;

  for (const [k, x] of A) {
    const y = B.get(k);
    if (!y) { console.log(`FALTA   ${k}`); n++; continue; }
    const dif = [];
    // Se compara el computed y NO getBoundingClientRect: el baseline ejecuta
    // webflow.js, y las interacciones IX2 dejan `transform`/`opacity` a medio
    // animar. El rect los incluye (medi .wrapper-top-bar en 1221 de 1250 solo
    // por una escala en curso) y el computed no. `opacity` se ignora por lo
    // mismo: bajo el pliegue el baseline se queda en 0 a la espera del scroll.
    // `aspect-ratio` diverge en TODA imagen a proposito: sale de los atributos
    // width/height que el port anade para reservar el hueco y produccion no
    // tenia. No cambia la caja pintada — eso ya lo dicen width/height — asi que
    // dejarlo dentro solo tapaba el resto del diff.
    for (const p of PROPS) {
      if (p === "opacity" || p === "aspect-ratio") continue;
      // `list-style-type` se hereda, asi que un <ul class="w-list-unstyled">
      // tine de `none` a todo su subarbol aunque nadie pinte una vinneta. Solo
      // importa donde hay marcador, o sea en `display:list-item`.
      if (p === "list-style-type" && x.css.display !== "list-item" && y.css.display !== "list-item") continue;
      if (x.css[p] !== y.css[p]) dif.push(`${p}: ${x.css[p]} -> ${y.css[p]}`);
    }
    if (dif.length) { console.log(`${k}\n    ${dif.join("\n    ")}`); n++; }
  }
  for (const k of B.keys()) if (!A.has(k)) { console.log(`SOBRA   ${k}`); n++; }
  console.log(`\n${n} divergencias · ${A.size} nodos en A, ${B.size} en B`);
  process.exit(0);
}

// ---------------------------------------------------------------- Chrome
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PUERTO}`,
  "--hide-scrollbars",
  "--no-first-run",
  `--user-data-dir=${PERFIL}`,
  "about:blank",
]);

/** Sondea el puerto en vez de dormir a ciegas. */
async function objetivo() {
  for (let i = 0; i < 80; i++) {
    await espera(250);
    try {
      const t = (await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()).find(
        (x) => x.type === "page",
      );
      if (t?.webSocketDebuggerUrl) return t;
    } catch {}
  }
  throw new Error("Chrome no expuso el puerto de depuracion.");
}

try {
  const ws = new WebSocket((await objetivo()).webSocketDebuggerUrl);
  await new Promise((ok, mal) => ((ws.onopen = ok), (ws.onerror = mal)));

  let n = 0;
  const pendientes = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    pendientes.get(m.id)?.(m.result ?? {});
    pendientes.delete(m.id);
  };
  const cdp = (method, params = {}) =>
    new Promise((ok) => (pendientes.set(++n, ok), ws.send(JSON.stringify({ id: n, method, params }))));

  const evaluar = async (expr) =>
    (await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))
      .result?.value;

  const escribir = (ruta, buf) => {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, buf);
    console.log(`  ${ruta}`);
  };

  await cdp("Page.enable");
  await cdp("Runtime.enable");

  // CLS. Va por `addScriptToEvaluateOnNewDocument` y no por un evaluate despues
  // de cargar porque `layout-shift` NO se puede recuperar a posteriori: las
  // entradas anteriores al alta del observador se pierden, y justo las que
  // importan (las que provoca una imagen sin hueco reservado) ocurren durante la
  // carga. `buffered:true` tampoco basta: el buffer arranca con el documento, y
  // aqui el documento aun no existe cuando se registra esto.
  // Se descartan las entradas con `hadRecentInput` porque el barrido de scroll
  // de `ir()` es interaccion sintetica y sus desplazamientos no son CLS real.
  await cdp("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__cls = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    `,
  });

  const viewport = (ancho, alto, escala = 2) =>
    cdp("Emulation.setDeviceMetricsOverride", {
      width: ancho, height: alto, deviceScaleFactor: escala, mobile: ancho < 992,
    });

  /** Navega y no vuelve hasta que las webfonts estan resueltas. */
  const ir = async (url) => {
    // about:blank primero: navegar dos veces a la misma URL no siempre recarga,
    // y la vista anterior se queda con el menu abierto.
    await cdp("Page.navigate", { url: "about:blank" });
    await espera(200);
    await cdp("Page.navigate", { url });
    for (let i = 0; i < 60; i++) {
      await espera(200);
      if (await evaluar(`document.readyState === "complete"`)) break;
    }
    await evaluar(`document.fonts.ready.then(() => true)`);
    // Foto del CLS ANTES del barrido de scroll de abajo. `hadRecentInput` no
    // protege de ese barrido: esa marca solo la pone input real del usuario, o
    // sea que un `scrollTo()` programatico no la activa y todo lo que se mueva al
    // entrar en viewport se cuenta. `clsCarga` es el numero comparable con CrUX;
    // el `cls` a secas incluye el barrido y solo vale como antes/despues contra
    // otra medida tomada con este mismo procedimiento.
    await evaluar(`window.__clsCarga = window.__cls`);
    // Recorrer la pagina entera y volver: en el baseline las interacciones IX2
    // son de entrada por scroll, asi que sin esto todo lo que hay bajo el
    // pliegue se mide con su estado INICIAL (opacity 0, transform a medias) y
    // el diff se llena de falsos positivos.
    await evaluar(`(async () => {
      const paso = innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += paso) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      scrollTo(0, 0);
      return true;
    })()`);
    await espera(1200); // que terminen las transiciones disparadas al volver
  };

  const captura = async (ruta) => {
    const { data } = await cdp("Page.captureScreenshot", { format: "png" });
    escribir(ruta, Buffer.from(data, "base64"));
  };

  // ------------------------------------------------------------ full
  if (comando === "full") {
    const [url, ancho = "1440", salida] = args;
    await viewport(+ancho, 800, 1);
    await ir(url);
    // Altura del documento y NO captureBeyondViewport: con esa opcion Chrome
    // devolvia fotogramas repetidos (capturas byte a byte identicas antes y
    // despues de un cambio de estado). Escala 1 porque la portada mide 11 613px
    // y a 2x se pasa del limite de textura de Chrome.
    const alto = await evaluar(`document.documentElement.scrollHeight`);
    await viewport(+ancho, alto, 1);
    await espera(400);
    await captura(salida ?? `${DESTINO}/full-${ancho}.png`);
  }

  // ------------------------------------------------------------ recorte
  // Captura UNA seccion, no la pagina. Sin esto lo unico disponible es `full`, y
  // la portada mide 11 613px de alto: mirar si un titulo se mete bajo el corte
  // diagonal en una imagen asi no es viable.
  // Se agranda el viewport hasta el documento entero, como en `full`, en vez de
  // usar `captureBeyondViewport`: asi el `clip` cae dentro del viewport y no se
  // repite el fallo de fotogramas duplicados que documenta `full`. Y por eso el
  // rect se lee DESPUES de agrandar — al cambiar el alto del viewport la pagina
  // se remaqueta y las `y` de antes ya no valen.
  // Acepta varios `selector=salida.png` de una sola carga.
  else if (comando === "recorte") {
    const [url, ancho = "1440", ...pares] = args;
    await viewport(+ancho, 800, 1);
    await ir(url);
    const alto = await evaluar(`document.documentElement.scrollHeight`);
    await viewport(+ancho, alto, 1);
    await espera(400);

    for (const par of pares) {
      const i = par.lastIndexOf("=");
      const [sel, salida] = [par.slice(0, i), par.slice(i + 1)];
      const r = await evaluar(`(() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
      })()`);
      if (!r) { console.log(`  SIN NODO ${sel}`); continue; }
      const { data } = await cdp("Page.captureScreenshot", {
        format: "png",
        clip: { ...r, scale: 1 },
      });
      escribir(salida, Buffer.from(data, "base64"));
      console.log(`    ${sel} · ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }

  // ------------------------------------------------------------ medir
  // Acepta varios `url=salida.json` en una sola sesion de Chrome: arrancarlo
  // cuesta mas que medir, y el barrido son 26 rutas x 2 anchos x 2 servidores.
  else if (comando === "medir") {
    const [ancho = "1440", ...pares] = args;
    await viewport(+ancho, 900, 1);

    for (const par of pares) {
    const [url, salida] = par.split("=");
    await ir(url);

    const datos = await evaluar(`(() => {
      const PROPS = ${JSON.stringify(PROPS)};
      const vistos = new Map();
      const nodos = [];
      for (const el of document.querySelectorAll("[class]")) {
        const clases = (el.getAttribute("class") || "").split(/\\s+/).filter(Boolean).sort();
        if (!clases.length) continue;
        // Astro marca sus componentes con data-astro-cid-*; no es una clase de
        // Webflow y cambia con el hash del fichero.
        const sel = el.tagName.toLowerCase() + "." + clases.join(".");
        const i = (vistos.get(sel) ?? -1) + 1;
        vistos.set(sel, i);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const css = {};
        for (const p of PROPS) css[p] = cs.getPropertyValue(p);
        nodos.push({
          sel, i,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          css,
        });
      }
      const fuentes = {};
      for (const f of ["300 16px Ubuntu","400 16px Ubuntu","500 16px Ubuntu","700 16px Ubuntu",
                       "italic 400 16px Ubuntu","600 16px 'Open Sans'","300 16px Campton",
                       "700 16px 'stix-two-text'"]) fuentes[f] = document.fonts.check(f);
      return { url: location.href, ancho: innerWidth, alto: document.documentElement.scrollHeight,
               cls: window.__cls ?? null, clsCarga: window.__clsCarga ?? null, fuentes, nodos };
    })()`);

    const ruta = salida ?? `${DESTINO}/medida-${ancho}.json`;
    escribir(ruta, JSON.stringify(datos, null, 1));
    console.log(`  ${datos.nodos.length} nodos · documento ${datos.alto}px`);
    }
  }

  // ------------------------------------------------------------ antes/despues
  else {
    const [base = "http://localhost:4321"] = args;
    // En movil se abre la hamburguesa; en escritorio esta en display:none, asi
    // que el equivalente es el desplegable de servicios.
    const VISTAS = [
      { ancho: 375, recorte: 700, abrir: ".menu-button" },
      { ancho: 1440, recorte: 560, abrir: "button.w-dropdown-toggle" },
    ];
    /**
     * Abre y NO sigue hasta comprobarlo. Sin esto la captura "abierto" puede
     * salir identica a la "cerrado" y el antes/despues miente sin avisar:
     * paso de verdad con el desplegable de escritorio.
     */
    const abrir = async (sel) => {
      await evaluar(`document.querySelector(${JSON.stringify(sel)}).click()`);
      for (let i = 0; i < 20; i++) {
        await espera(100);
        if (await evaluar(`!!document.querySelector('.w--open')`)) return;
      }
      throw new Error(`El click en ${sel} no abrio nada.`);
    };

    for (const v of VISTAS) {
      console.log(`${comando} · ${v.ancho}px`);
      await viewport(v.ancho, v.recorte);
      await ir(base + "/");
      await captura(`${DESTINO}/${comando}-${v.ancho}-cerrado.png`);
      await abrir(v.abrir);
      await espera(400);
      await captura(`${DESTINO}/${comando}-${v.ancho}-abierto.png`);
    }
  }

  ws.close();
} finally {
  chrome.kill();
}
