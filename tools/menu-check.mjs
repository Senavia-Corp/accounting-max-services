// Comprobacion del cierre-al-scroll del menu (src/scripts/ui.ts).
//
//   node tools/menu-check.mjs
//
// Sin red y sin navegador: jsdom + el .ts importado tal cual (node lo resuelve
// por type-stripping, igual que en correo-check.mjs; la extension .ts en el
// especificador es OBLIGATORIA).
//
// QUE se comprueba y POR QUE existe este fichero:
// el desplegable armaba un listener global de `scroll` que lo cerraba entero al
// primer evento. En escritorio es lo deseado; en un telefono real el navegador
// emite `scroll` en window por su cuenta (barra de direcciones que se contrae al
// tocar, rebote de iOS, viewport que se reasienta), asi que el submenu se cerraba
// en el mismo frame en que se abria y el cliente veia "no pasa nada". Y como
// `once` solo retira el listener cuando DISPARA, abrir/cerrar/abrir los iba
// acumulando y el fallo empeoraba con cada intento.
//
// Un emulador de escritorio NO reproduce nada de esto: ahi no hay barra de
// direcciones que se mueva y el submenu abre perfecto. De ahi esta comprobacion.

import { JSDOM } from "jsdom";

let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos++;
    console.log("  FALLO  " + msg);
  } else {
    console.log("  ok     " + msg);
  }
};

// Lo minimo que iniciarMenu() necesita. SIN .menu a proposito: asi iniciarCromo()
// sale por su guarda y no hace falta stubear IntersectionObserver.
const MARCADO = `
<nav class="navbar">
  <button type="button" class="menu-button" aria-expanded="false" aria-controls="nav-items"></button>
  <div class="block-items-menu" id="nav-items">
    <div class="dropdown">
      <button type="button" id="nav-servicios" class="nav-link w-dropdown-toggle"
              aria-expanded="false" aria-controls="nav-servicios-lista">Services</button>
      <div id="nav-servicios-lista" class="dropdown-list">
        <button type="button" class="nav-volver">Back</button>
        <a href="/tax-preparation">Tax Preparation</a>
      </div>
    </div>
    <button type="button" id="selector-idioma" class="selector-idioma"
            aria-expanded="false" aria-controls="selector-idioma-lista">EN</button>
    <div id="selector-idioma-lista" class="selector-idioma-lista"><a href="/es/">ES</a></div>
  </div>
</nav>`;

const dom = new JSDOM(`<!doctype html><html><body>${MARCADO}</body></html>`);
const { window } = dom;

// El listado de medios es la palanca del test: ui.ts captura MOVIL una sola vez
// al cargarse, pero lee MOVIL.matches en CADA llamada, asi que un objeto mutable
// cubre movil y escritorio con un unico import.
const MOVIL = { matches: true, addEventListener() {}, removeEventListener() {} };

// Los globals van ANTES del import: ui.ts se autoejecuta al importarse.
globalThis.window = window;
globalThis.document = window.document;
globalThis.addEventListener = window.addEventListener.bind(window);
globalThis.removeEventListener = window.removeEventListener.bind(window);
// TIENE que ser el AbortController de jsdom. El global de node hace que jsdom
// rechace la opcion signal con "not of type 'AbortSignal'", y el listener
// quedaria puesto para siempre: el test pasaria a verde por el motivo contrario.
globalThis.AbortController = window.AbortController;
window.matchMedia = () => MOVIL;

await import("../src/scripts/ui.ts");
// Un JSDOM construido desde una cadena arranca en readyState "loading", asi que
// ui.ts se queda esperando el evento.
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

const $ = (sel) => window.document.querySelector(sel);
const hamburguesa = $("button.menu-button");
const servicios = $("#nav-servicios");
const idioma = $("#selector-idioma");

const scroll = () => window.dispatchEvent(new window.Event("scroll"));
const abierto = (t) => t.getAttribute("aria-expanded") === "true";
const cerrarTodo = () => {
  for (const t of [servicios, idioma]) if (abierto(t)) t.click();
  if (abierto(hamburguesa)) hamburguesa.click();
};

// 1. La regla: en movil, un scroll del navegador NO puede cerrar el submenu.
MOVIL.matches = true;
hamburguesa.click();
servicios.click();
ok(abierto(servicios), "movil: el submenu abre al tocar Services");
scroll();
ok(abierto(servicios), "movil: sigue abierto tras un scroll de window  <-- el bug reportado");

// 2. Listener acumulado: abrir/cerrar/abrir sin recargar. Antes del arreglo cada
//    apertura dejaba uno vivo y se acumulaban. Se ancla el estado en vez de
//    heredarlo del bloque anterior: si no, un cambio alli invierte esto en
//    silencio.
cerrarTodo();
hamburguesa.click();
servicios.click(); // abrir
servicios.click(); // cerrar
servicios.click(); // abrir
ok(abierto(servicios), "movil: sigue abierto tras abrir/cerrar/abrir");
scroll();
ok(abierto(servicios), "movil: y un scroll despues de eso tampoco lo cierra");

// 3. El selector de idioma comparte toda la maquinaria.
cerrarTodo();
hamburguesa.click();
idioma.click();
ok(abierto(idioma), "movil: el selector de idioma abre");
scroll();
ok(abierto(idioma), "movil: el selector de idioma sigue abierto tras un scroll");

// 4. Regresion de escritorio: ahi scrollear la pagina SI debe cerrarlo.
cerrarTodo();
MOVIL.matches = false;
servicios.click();
ok(abierto(servicios), "escritorio: el desplegable abre");
scroll();
ok(!abierto(servicios), "escritorio: un scroll SI lo cierra (comportamiento deseado)");

// 5. Listener huerfano cruzando el breakpoint: lo que se armo en escritorio no
//    puede sobrevivir hasta una apertura en movil.
servicios.click();
servicios.click(); // abrir y cerrar en escritorio
MOVIL.matches = true;
hamburguesa.click();
servicios.click();
ok(abierto(servicios), "cruce: abre en movil despues de haber abierto en escritorio");
scroll();
ok(abierto(servicios), "cruce: ningun listener de escritorio sobrevive al cambio de ancho");

console.log(fallos ? `\n${fallos} FALLO(S)` : "\nTodo en verde.");
process.exit(fallos ? 1 : 0);
