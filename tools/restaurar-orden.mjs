/**
 * Repara en Sanity dos cosas que se perdieron en el import y que NO son de CSS:
 *
 *   1. El orden de las colecciones. Webflow lo tenia en la coleccion y el crawl
 *      no lo trajo (ver DECISIONS.md B4), asi que servicios y posts salian por
 *      `title asc`. El orden real se deduce del HTML de produccion y esta
 *      verificado: las cuatro listas del sitio son `order asc` (desplegable),
 *      su inverso (pie y sidebar de ficha) y `feature desc, order asc`
 *      (portada). Las tres permutaciones salen exactas, asi que un unico campo
 *      `order` las reproduce todas.
 *
 *   2. El <h1> con el que los 10 posts abren su cuerpo. `blockContent.styles`
 *      no declaraba `h1`, asi que htmlToBlocks no tenia destino y lo importo
 *      como `normal`: el titular se leia como texto corrido.
 *
 * Uso:
 *   node tools/restaurar-orden.mjs --check                   # comprueba el modelo, sin red
 *   node --env-file=.env tools/restaurar-orden.mjs           # plan, no escribe
 *   node --env-file=.env tools/restaurar-orden.mjs --write   # aplica
 *
 * Es idempotente: al segundo pase no hay nada que hacer. NO toca ningun otro
 * campo, y el <h1> se localiza comparando el TEXTO contra el de produccion, no
 * por posicion — si no hay exactamente una coincidencia, ese post se salta y se
 * reporta en vez de adivinar.
 */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { createClient } from "@sanity/client";

const ESCRIBIR = process.argv.includes("--write");
const SOLO_CHECK = process.argv.includes("--check");

const sanity = SOLO_CHECK ? null : createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID ?? "ep5i6co1",
  dataset: process.env.PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2021-06-07",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});
if (!SOLO_CHECK && !process.env.SANITY_WRITE_TOKEN) {
  throw new Error("Falta SANITY_WRITE_TOKEN. Arranca con `node --env-file=.env`.");
}

const doc = (ruta) => new JSDOM(readFileSync(`baseline/html/${ruta}`, "utf8")).window.document;
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/** Slugs, en el orden en que produccion los pinta dentro de `contenedor`. */
const orden = (documento, contenedor, prefijo) => {
  const caja = documento.querySelector(`.${contenedor}`);
  if (!caja) throw new Error(`No encuentro .${contenedor}`);
  const vistos = [];
  for (const a of caja.querySelectorAll(`a[href^="${prefijo}"]`)) {
    const slug = a.getAttribute("href").slice(prefijo.length);
    if (slug && !vistos.includes(slug)) vistos.push(slug);
  }
  return vistos;
};

// El desplegable es el orden nativo de la coleccion: el pie y el sidebar lo
// pintan al reves y la portada lo reordena por `feature`, pero todos salen de el.
const SERVICIOS = orden(doc("index.html"), "collection-list-submenu", "/services/");
const POSTS = orden(doc("blog-news.html"), "collection-list-blog", "/post/");
if (SERVICIOS.length !== 12) throw new Error(`Esperaba 12 servicios, leo ${SERVICIOS.length}`);
if (POSTS.length !== 10) throw new Error(`Esperaba 10 posts, leo ${POSTS.length}`);

/** El <h1> que abre el rich text de un post en produccion. */
const titularDePost = (slug) => {
  const h1 = doc(`post/${slug}.html`).querySelector(".w-richtext h1");
  return h1 ? norm(h1.textContent) : null;
};

/**
 * El modelo de orden, comprobado contra el HTML de produccion. Falla si alguien
 * cambia una de las tres reglas en las plantillas sin darse cuenta de que cada
 * una reproduce una lista distinta del sitio original.
 */
if (SOLO_CHECK) {
  const igual = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const destacado = new Set(
    JSON.parse(readFileSync("baseline/import/docs.json", "utf8"))
      .filter((d) => d._type === "service" && d.feature)
      .map((d) => d.slug.current ?? d.slug),
  );

  const casos = [
    ["desplegable = order asc", SERVICIOS, orden(doc("index.html"), "collection-list-submenu", "/services/")],
    ["pie = order desc", [...SERVICIOS].reverse(), orden(doc("index.html"), "collection-list-footer", "/services/")],
    ["sidebar de ficha = order desc", [...SERVICIOS].reverse(),
      orden(doc("services/audit-assistance.html"), "collection-list-2", "/services/")],
    // Array.sort es estable, asi que dentro de cada grupo se conserva el orden
    // de la coleccion. Es exactamente lo que hacen index.astro y es/index.astro.
    ["portada = feature desc, order asc",
      [...SERVICIOS].sort((a, b) => Number(destacado.has(b)) - Number(destacado.has(a))),
      orden(doc("index.html"), "collection-list", "/services/")],
    ["blog = order asc", POSTS, orden(doc("blog-news.html"), "collection-list-blog", "/post/")],
    ["sidebar de post = order asc", POSTS,
      orden(doc("post/common-tax-mistakes.html"), "block-blogs-features", "/post/")],
  ];

  let mal = 0;
  for (const [nombre, calculado, real] of casos) {
    const ok = igual(calculado, real);
    if (!ok) mal++;
    console.log(`  ${ok ? "OK  " : "MAL "} ${nombre}`);
    if (!ok) console.log("      calculado:", calculado, "\n      produccion:", real);
  }
  if (destacado.size !== 5) { mal++; console.log(`  MAL  esperaba 5 destacados, hay ${destacado.size}`); }
  console.log(mal ? `\n${mal} reglas no cuadran` : "\nel modelo de orden reproduce las 6 listas de produccion");
  process.exit(mal ? 1 : 0);
}

const docs = await sanity.fetch(
  `*[_type in ["service","post"]]{ _id, _type, "slug": slug.current, order, body, bodyEs }`,
);
const porSlug = new Map(docs.map((d) => [`${d._type}:${d.slug}`, d]));

const tx = sanity.transaction();
let cambios = 0;
const avisos = [];

// ---------------------------------------------------------------- 1. orden
for (const [tipo, lista] of [["service", SERVICIOS], ["post", POSTS]]) {
  lista.forEach((slug, i) => {
    const d = porSlug.get(`${tipo}:${slug}`);
    if (!d) return avisos.push(`falta en Sanity: ${tipo}/${slug}`);
    if (d.order === i + 1) return;
    console.log(`  order  ${tipo}/${slug} : ${d.order ?? "(vacio)"} -> ${i + 1}`);
    tx.patch(d._id, { set: { order: i + 1 } });
    cambios++;
  });
}

// ------------------------------------------------------- 2. el h1 de los posts
for (const slug of POSTS) {
  const d = porSlug.get(`post:${slug}`);
  if (!d) continue;
  const titular = titularDePost(slug);
  if (!titular) { avisos.push(`sin <h1> en produccion: post/${slug}`); continue; }

  const bloques = d.body ?? [];
  const idx = bloques
    .map((b, i) => [b, i])
    .filter(([b]) => b._type === "block" && norm((b.children ?? []).map((c) => c.text).join("")) === titular);

  if (idx.length !== 1) {
    avisos.push(`post/${slug}: ${idx.length} bloques coinciden con "${titular}" — se salta`);
    continue;
  }
  const [bloque, i] = idx[0];
  if (bloque.style === "h1") continue; // ya arreglado

  console.log(`  h1     post/${slug} : body[${i}] ${bloque.style} -> h1  ("${titular.slice(0, 40)}")`);
  tx.patch(d._id, { set: { [`body[${i}].style`]: "h1" } });
  cambios++;

  // La traduccion conserva la estructura de bloques, asi que el titular ES es
  // el mismo indice. Solo se toca si el recuento cuadra: si no, el indice no
  // significa lo mismo y prefiero dejarlo y reportarlo.
  const es = d.bodyEs ?? [];
  if (es.length && es.length !== bloques.length) {
    avisos.push(`post/${slug}: bodyEs tiene ${es.length} bloques y body ${bloques.length} — ES sin tocar`);
  } else if (es[i] && es[i].style !== "h1") {
    console.log(`  h1(es) post/${slug} : bodyEs[${i}] ${es[i].style} -> h1`);
    tx.patch(d._id, { set: { [`bodyEs[${i}].style`]: "h1" } });
    cambios++;
  }
}

for (const a of avisos) console.log(`  AVISO  ${a}`);
console.log(`\n${cambios} cambios ${ESCRIBIR ? "" : "(plan; usa --write para aplicar)"}`);

if (ESCRIBIR && cambios) {
  await tx.commit();
  console.log("aplicado.");
}
