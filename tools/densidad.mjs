/**
 * Lector de las medidas de `capturas.mjs medir` para el ajuste de densidad
 * vertical. Saca la tabla alto/ancho antes-despues y el CLS.
 *
 *   node tools/densidad.mjs baseline/diseno/densidad/antes-1440.json [despues-1440.json]
 *
 * Existe porque `capturas.mjs diff` compara COMPUTED STYLES y aqui hace falta lo
 * contrario: la caja pintada. El criterio del encargo es "el alto baja un 30% y
 * el ancho no se mueve ni un pixel", o sea rect.h contra rect.w, que el diff de
 * paridad no mira.
 *
 * Se listan TODOS los `.block-review`, no solo el primero: al quitarles el
 * `min-height` la duda es justamente si quedan desiguales entre si.
 */
import { readFileSync } from "node:fs";

/** Clases que deciden este encargo, en orden de lectura de la pagina. */
const CLAVES = [
  "section.reviews",
  "section.wrapper-reviews",
  "div.wrapper-header-slider",
  "div.block-services-animation",
  "div.splide-track",
  "div.splide-slide",
  "div.block-review",
  "div.wrapper-promo",
  "div.block-pic",
  "img.bg-pic",
  "div.block-content-promo",
  "div.block-promo",
];

/** `sel` del volcado es "tag.a.b.c" con las clases ORDENADAS alfabeticamente. */
const casa = (sel, clave) => {
  const [t, ...c] = clave.split(".");
  const [ts, ...cs] = sel.split(".");
  return ts === t && c.every((x) => cs.includes(x));
};

const carga = (f) => {
  const d = JSON.parse(readFileSync(f, "utf8"));
  const por = new Map();
  for (const n of d.nodos) {
    for (const k of CLAVES) {
      if (!casa(n.sel, k)) continue;
      if (!por.has(k)) por.set(k, []);
      por.get(k).push(n);
      break; // una clave por nodo: CLAVES esta de mas-especifico a menos
    }
  }
  return { d, por };
};

const [fa, fb] = process.argv.slice(2);
const A = carga(fa);
const B = fb ? carga(fb) : null;

const pct = (a, b) => (a ? (((b - a) / a) * 100).toFixed(1) + "%" : "—");
const caja = (n) => `${Math.round(n.rect.w)}x${Math.round(n.rect.h)}`;

console.log(`\n${A.d.ancho}px · documento ${A.d.alto}px` + (B ? ` -> ${B.d.alto}px (${pct(A.d.alto, B.d.alto)})` : ""));
const n6 = (x) => (x == null ? "n/d" : Number(x).toFixed(6));
console.log(`CLS carga ${n6(A.d.clsCarga)}` + (B ? ` -> ${n6(B.d.clsCarga)}` : "") +
            `  ·  CLS con barrido ${n6(A.d.cls)}` + (B ? ` -> ${n6(B.d.cls)}` : ""));
console.log("\nclase                          n   antes        despues      alto      ancho");
console.log("-".repeat(80));

for (const k of CLAVES) {
  const a = A.por.get(k) ?? [];
  const b = B?.por.get(k) ?? [];
  if (!a.length) continue;
  // Del grupo se informa el mas alto: es el que fija la altura de la fila.
  const alto = (xs) => xs.reduce((m, x) => (x.rect.h > m.rect.h ? x : m), xs[0]);
  const A1 = alto(a), B1 = b.length ? alto(b) : null;
  const dh = B1 ? pct(A1.rect.h, B1.rect.h) : "";
  const dw = B1 ? (Math.round(A1.rect.w) === Math.round(B1.rect.w) ? "IGUAL" : "*** MOVIDO ***") : "";
  console.log(
    k.padEnd(30) + String(a.length).padEnd(4) +
    caja(A1).padEnd(13) + (B1 ? caja(B1) : "").padEnd(13) +
    dh.padEnd(10) + dw,
  );
  // Dispersion de las tarjetas: si el min-height desaparece y quedan desiguales,
  // se ve aqui antes que en la captura.
  if (k === "div.block-review" && a.length > 1) {
    const rango = (xs) => {
      const h = xs.map((x) => Math.round(x.rect.h));
      const w = new Set(xs.map((x) => Math.round(x.rect.w)));
      return `alto ${Math.min(...h)}-${Math.max(...h)} · anchos ${[...w].join(",")}`;
    };
    console.log(`  ${a.length} tarjetas antes:   ${rango(a)}`);
    if (b.length) console.log(`  ${b.length} tarjetas despues: ${rango(b)}`);
  }
}

// Padding vertical de las secciones de la portada: la "escala" del sitio.
console.log("\npadding vertical de las secciones");
console.log("-".repeat(80));
for (const s of ["header", "bar-services", "about-us", "reviews", "features", "call-action", "faq", "wrapper-promo", "block-promo", "wrapper-reviews", "block-review"]) {
  const n = A.d.nodos.find((x) => x.sel.split(".").includes(s));
  if (!n) continue;
  const m = B?.d.nodos.find((x) => x.sel.split(".").includes(s));
  const p = (x) => (x ? x.css.padding : "");
  console.log(s.padEnd(20) + p(n).padEnd(26) + (m && p(m) !== p(n) ? "-> " + p(m) : m ? "(igual)" : ""));
}
console.log();
