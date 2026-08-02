// Comprobacion del sistema de entradas por scroll (data-entra / data-entra-cascada).
//
//   node tools/entradas-check.mjs
//
// Sin red, sin navegador y sin build: lee el FUENTE y saca las etiquetas de
// apertura que llevan un `data-entra*`.
//
// POR QUE existe este fichero: los cuatro fallos que comprueba son SILENCIOSOS.
// Ninguno rompe el build, ninguno rompe `astro check`, y ninguno se ve en la
// ruta que uno tiene abierta mientras trabaja:
//
//   1. Marcar la plantilla inglesa y olvidar la espanola. La ruta /es
//      simplemente no anima, para siempre. Es el fallo mas probable del sistema:
//      6 de las 8 plantillas estan duplicadas a mano.
//   2. Poner el atributo en algo de la lista negra. Los peores casos dejan
//      contenido invisible (`.faq-answer` arranca en display:none, asi que el
//      observador no dispara nunca dentro) o rompen algo que ya funcionaba (el
//      cromo y el carrusel usan `transform` como su propio mecanismo).
//   3. Marcar un candidato a LCP. El elemento en opacity:0 no cuenta como
//      pintado, asi que el LCP se retrasa hasta que dispara el observador.
//   4. Marcar los .collection-item-2 de una ficha de servicio. Viven dentro de
//      .block-right, que tiene overflow-y:auto propio: el scrollport interno
//      recorta la region de interseccion y a 1280x800 en ES las ultimas filas
//      quedan fuera. isIntersecting seria false para siempre.

import { readFileSync } from "node:fs";

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

// Etiquetas de apertura que contienen un data-entra*. Basta con regex: el
// atributo se escribe siempre a mano y siempre dentro de la etiqueta.
const etiquetas = (src) => src.match(/<[a-zA-Z][^>]*\bdata-entra[^>]*>/g) || [];
const cuenta = (src) => (src.match(/\bdata-entra(-cascada)?[=\s>]/g) || []).length;

// --- 1. Paridad EN/ES ------------------------------------------------------
// Las 6 plantillas duplicadas. contact-us entra a proposito: su cero tiene que
// ser cero en los dos idiomas, no un olvido en uno solo.
const GEMELAS = [
  "index.astro",
  "about-us.astro",
  "blog-news.astro",
  "contact-us.astro",
  "services/[slug].astro",
  "post/[slug].astro",
];

console.log("paridad EN/ES");
for (const p of GEMELAS) {
  const en = cuenta(leer("src/pages/" + p));
  const es = cuenta(leer("src/pages/es/" + p));
  ok(en === es, `${p}: EN=${en} ES=${es}` + (en === es ? "" : "  <- la gemela se quedo sin marcar"));
}

// --- 2. Lista negra --------------------------------------------------------
// Nada de esto puede llevar un data-entra*. Las <section> porque son a sangre y
// llevan el fondo: fundirlas deja una franja del blanco del body en el canto, y
// .reviews ademas tiene cuatro .corner-* que sobresalen 100px.
const NEGRA = [
  "<section",
  "<main",
  "<footer",
  'class="menu',
  "cromo-centinela",
  "saltar-al-contenido",
  "splide-slide",
  "corner-",
  "faq-answer",
  "logos",
  "yt-facade",
  "lead-form",
  "newsletter-form",
  "w-form-done",
  "w-form-fail",
];

const FUENTES = [
  ...GEMELAS.map((p) => "src/pages/" + p),
  ...GEMELAS.map((p) => "src/pages/es/" + p),
  "src/pages/privacy-policy.astro",
  "src/pages/terms.astro",
  "src/components/CtaConsulta.astro",
  "src/components/ServiciosPorCategoria.astro",
];

console.log("lista negra");
let sucias = 0;
for (const f of FUENTES) {
  for (const et of etiquetas(leer(f))) {
    for (const veto of NEGRA) {
      if (et.includes(veto)) {
        sucias++;
        console.log(`  FALLO  ${f}: data-entra sobre "${veto}"`);
        console.log(`         ${et.slice(0, 120)}`);
      }
    }
  }
}
ok(sucias === 0, `${FUENTES.length} ficheros sin data-entra en la lista negra`);

// --- 3. Guardia de LCP -----------------------------------------------------
console.log("guardia de LCP");
let lcp = 0;
for (const f of FUENTES) {
  for (const et of etiquetas(leer(f))) {
    if (et.includes('fetchpriority="high"') || et.includes('loading="eager"')) {
      lcp++;
      console.log(`  FALLO  ${f}: data-entra sobre un candidato a LCP`);
      console.log(`         ${et.slice(0, 120)}`);
    }
  }
}
ok(lcp === 0, "ningun data-entra sobre eager / fetchpriority=high");

// --- 4. El caso .block-right -----------------------------------------------
console.log("interior de .block-right");
for (const f of ["src/pages/services/[slug].astro", "src/pages/es/services/[slug].astro"]) {
  const malo = etiquetas(leer(f)).some((et) => et.includes("collection-item-2"));
  ok(!malo, `${f}: los .collection-item-2 no llevan data-entra`);
}

// --- 5. El sello -----------------------------------------------------------
const layout = leer("src/layouts/BaseLayout.astro");
console.log("sello");
ok(
  (layout.match(/setAttribute\("data-entradas"/g) || []).length === 1,
  "BaseLayout escribe el sello exactamente una vez",
);
ok(
  layout.includes('removeAttribute("data-entradas")'),
  "BaseLayout retira el sello si el montaje falla",
);
ok(etiquetas(layout).length === 0, "BaseLayout no lleva data-entra en su propio marcado");

console.log(fallos === 0 ? "\nentradas-check OK" : `\nentradas-check: ${fallos} fallo(s)`);
process.exit(fallos === 0 ? 0 : 1);
