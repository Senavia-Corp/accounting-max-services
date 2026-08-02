// Comprobacion de la medicion (Google Tag Manager -> GA4).
//
//   node tools/gtm-check.mjs
//
// Sin red, sin navegador y sin build: lee el FUENTE.
//
// POR QUE existe este fichero: los cinco fallos que comprueba son SILENCIOSOS.
// Ninguno rompe el build, ninguno rompe `astro check`, y ninguno se ve mirando
// el sitio — al contrario, en los cinco casos la pagina carga perfecta, la
// consola sale limpia y Tag Assistant dice «conectado». Lo unico que pasa es
// que los numeros de GA4 estan mal, y eso no se descubre hasta que alguien toma
// una decision con ellos:
//
//   1. Que alguien pegue TAMBIEN el snippet de gtag.js que Google entrega junto
//      al ID de GA4. Es el error mas natural del mundo —Google literalmente lo
//      da hecho y dice «pegalo en todas las paginas»— y duplica el page_view de
//      las 54 rutas: sesiones, usuarios y tasa de conversion quedan inservibles.
//   2. Marcar la plantilla inglesa y olvidar la espanola. El español no reporta
//      NI UNA conversion, para siempre. Es el fallo mas probable del sistema:
//      seis plantillas estan duplicadas a mano.
//   3. Mover el push al manejador de `submit`, que es donde lo pone todo el
//      mundo y donde lo pondra el siguiente que toque esto. Ahi se cuentan
//      tambien los envios que Turnstile rechaza y los 4xx de /api/lead: el
//      despacho creeria tener leads que nunca existieron.
//   4. Duplicar el contenedor (dos snippets en dos sitios) al anadir una
//      plantilla nueva.
//   5. Renombrar el evento. `generate_lead` es un evento RECOMENDADO de GA4 y
//      pierde su tratamiento en los informes si se le cambia el nombre.
//
// LO QUE ESTE FICHERO NO PUEDE VER: si el contenedor de GTM entrega de verdad a
// la propiedad correcta. Eso vive en la interfaz de GTM, no en el repositorio, y
// se comprueba desde fuera resolviendo el contenedor publicado:
//
//   curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-WHNFLL7H" \
//     | grep -oE "G-[A-Z0-9]{8,12}|AW-[0-9]{9,12}" | sort -u
//
// Tiene que imprimir G-L521MPS8H9 y nada mas. Vacio = el contenedor no tiene la
// etiqueta de GA4, o se configuro y no se PUBLICO (el gtm.js publico solo
// refleja versiones publicadas). Otra G- = esta entregando a una propiedad
// ajena. Un AW- inesperado = alguien conecto Google Ads por su cuenta.

import { readFileSync } from "node:fs";

const CONTENEDOR = "GTM-WHNFLL7H";
const MEDICION = "G-L521MPS8H9";

let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos++;
    console.log("  FALLO  " + msg);
  } else {
    console.log("  ok     " + msg);
  }
};

const leer = (ruta) => readFileSync(new URL("../" + ruta, import.meta.url), "utf8");
const veces = (src, aguja) => src.split(aguja).length - 1;

const LAYOUT = "src/layouts/BaseLayout.astro";
const CONVERSIONES = [
  { ruta: "src/pages/contact-us.astro", evento: "generate_lead" },
  { ruta: "src/pages/es/contact-us.astro", evento: "generate_lead" },
  { ruta: "src/components/FooterSubscribe.astro", evento: "newsletter_signup" },
];

// Todo el fuente del sitio, para las comprobaciones de «en ningun otro sitio».
// `tools/` queda fuera a proposito: este mismo fichero menciona los dos IDs.
const FUENTES = [
  LAYOUT,
  "src/pages/privacy-policy.astro",
  ...CONVERSIONES.map((c) => c.ruta),
];

// --- 1. El contenedor esta una sola vez y solo en el layout ----------------
console.log("contenedor");
const layout = leer(LAYOUT);
ok(
  veces(layout, CONTENEDOR) === 2,
  `${LAYOUT} lleva ${CONTENEDOR} exactamente 2 veces (script + noscript)`,
);
ok(
  layout.includes("<script is:inline"),
  "el snippet es is:inline (si no, Astro lo difiere y el dataLayer no existe al empujar)",
);
ok(
  layout.includes("page_language"),
  "el layout empuja page_language antes del contenedor",
);
for (const f of FUENTES.filter((f) => f !== LAYOUT)) {
  ok(!leer(f).includes(CONTENEDOR), `${f}: no repite el contenedor`);
}

// --- 2. Ni rastro de gtag.js ----------------------------------------------
// La guarda contra el doble conteo. Se busca la URL del script, no el ID de
// medicion: ese ID SI aparece en privacy-policy.astro, dentro del nombre de la
// cookie `_ga_L521MPS8H9` que la politica declara, y eso es correcto.
console.log("\ndoble conteo");
for (const f of FUENTES) {
  const src = leer(f);
  ok(!src.includes("gtag/js"), `${f}: no carga gtag.js`);
  ok(!/\bgtag\s*\(/.test(src), `${f}: no llama a gtag()`);
}
// NO se comprueba ademas que el ID de medicion falte del layout. Se intento y
// dio un falso positivo inmediato: el comentario del propio snippet nombra
// G-L521MPS8H9 justo para explicar por que la propiedad NO va en el codigo, y
// la comprobacion no distingue codigo de comentario. Las dos lineas de arriba
// ya atrapan el fallo de verdad —que alguien pegue gtag.js—, que es la unica
// forma en que ese ID acabaria haciendo algo.

// --- 3. Paridad EN/ES ------------------------------------------------------
console.log("\nparidad EN/ES");
const en = veces(leer("src/pages/contact-us.astro"), '"generate_lead"');
const es = veces(leer("src/pages/es/contact-us.astro"), '"generate_lead"');
ok(en === 1, `contact-us.astro empuja generate_lead 1 vez (empuja ${en})`);
ok(es === 1, `es/contact-us.astro empuja generate_lead 1 vez (empuja ${es})`);

// --- 4. Cada push esta en la rama de EXITO ---------------------------------
// La comprobacion que de verdad protege el dato. Se compara la posicion del
// push contra la del `!res.ok` y la del `catch`: si cae fuera de esa ventana,
// se esta contando algo que no es un lead.
console.log("\nel push cae en la rama de exito");
for (const { ruta, evento } of CONVERSIONES) {
  const src = leer(ruta);
  const push = src.indexOf(`"${evento}"`);
  const guarda = src.indexOf("if (!res.ok)");
  const captura = src.indexOf("} catch {", guarda);

  ok(veces(src, `"${evento}"`) === 1, `${ruta}: empuja ${evento} exactamente 1 vez`);
  ok(guarda !== -1 && captura !== -1, `${ruta}: se localizan el !res.ok y el catch`);
  ok(
    push > guarda && push < captura,
    `${ruta}: el push va DESPUES del !res.ok y ANTES del catch ` +
      `(si no, cuenta captchas fallidos y 4xx como leads)`,
  );
}

// --- 5. La politica de privacidad declara la analitica ---------------------
// Va aqui y no en un fichero aparte porque el fallo es el mismo movimiento:
// encender la medicion y dejar la politica diciendo que no hay ninguna. Es una
// declaracion falsa publicada por un despacho fiscal, no un descuido de estilo.
console.log("\npolitica de privacidad");
const politica = leer("src/pages/privacy-policy.astro");
ok(
  !politica.includes("sets no analytics cookies"),
  "ya NO afirma que el sitio no pone cookies de analitica",
);
ok(politica.includes("Google Analytics"), "declara Google Analytics");
ok(politica.includes(`_ga_${MEDICION.slice(2)}`), "nombra la cookie real de la propiedad");
ok(politica.includes("gaoptout"), "ofrece la via de exclusion");

console.log(fallos === 0 ? "\ngtm-check OK" : `\ngtm-check: ${fallos} fallo(s)`);
process.exit(fallos === 0 ? 0 : 1);
