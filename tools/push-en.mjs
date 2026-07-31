// Empuja el contenido INGLES de los 10 posts a Sanity.
//
//   node tools/push-en.mjs --autoprueba   demuestra que los asertos saltan
//   node tools/push-en.mjs --dry          simulacion, no escribe
//   node tools/push-en.mjs                escribe
//
// ESPEJO EXACTO de tools/push-i18n.mjs, con la lista blanca INVERTIDA. Alli
// solo pueden escribirse campos *Es y un campo EN aborta el proceso; aqui solo
// pueden escribirse campos EN y un campo *Es aborta el proceso.
//
//   { createIfNotExists: { _id, _type } }        <- solo la cascara
//   { patch: { id, set: { …solo campos EN… } } } <- nunca toca *Es
//
// POR QUE HACE FALTA ESTE FICHERO. Ya existe tools/sanity-import.mjs, que si
// escribe campos EN — pero es el importador de la MIGRACION: su fuente es
// baseline/import/docs.json, o sea los cuerpos originales de Webflow.
// Reejecutarlo devolveria los 10 posts a sus 48-97 palabras. Ademas su EN_KEYS
// no admite `publishedAt`. Es la herramienta equivocada, no una que falte.
//
// `createOrReplace` esta prohibido por el mismo motivo que en los otros dos
// scripts: la segunda pasada borraria la mitad que este script no escribe.
// Eso es lo que dejo 32 de 47 paginas de AB Aluminum sirviendo H1 en ingles.

import { readFileSync } from "node:fs";

const PROJECT = "ep5i6co1";
const DATASET = "production";
const DRY = process.argv.includes("--dry");
const AUTOPRUEBA = process.argv.includes("--autoprueba");

// ---------------------------------------------------------------------------
// Asertos
// ---------------------------------------------------------------------------

/**
 * Lista blanca: los UNICOS campos que este script puede escribir.
 *
 * `authorName` NO esta aqui, y es deliberado. Los 10 posts no tienen firma y no
 * se inventa una (R3): el contenido fiscal es justo donde una credencial falsa
 * hace dano. Mientras el cliente no designe a una persona real con su EA o su
 * CPA, este script es fisicamente incapaz de escribir un autor. El dia que la
 * designe, se anade aqui a proposito y en un commit que se ve.
 *
 * `slug`, `order`, `heroImage` y `webflowItemId` tampoco estan: son identidad y
 * los fija el import, no una pasada de contenido.
 */
// `intro` es el equivalente de `excerpt` en los 12 `service`: se pinta bajo el
// H1 y ademas hace de meta description de reserva (services/[slug].astro:110).
const EN_KEYS = new Set([
  "title", "excerpt", "intro", "body", "metaTitle", "metaDescription", "publishedAt",
]);
const MUTACIONES_PROHIBIDAS = ["createOrReplace", "createOrReplaceIfNotExists", "delete", "replace"];

export function assertSafe(mutations) {
  for (const m of mutations) {
    for (const k of Object.keys(m)) {
      if (MUTACIONES_PROHIBIDAS.includes(k)) {
        throw new Error(`idempotencia: mutacion prohibida "${k}"`);
      }
    }
    for (const k of Object.keys(m.patch?.set ?? {})) {
      // El aserto simetrico al de push-i18n.mjs: si acaba en Es, es espanol.
      if (/Es$/.test(k)) {
        throw new Error(`R5: el empujador EN intento escribir el campo ES "${k}" en ${m.patch.id}`);
      }
      if (!EN_KEYS.has(k)) throw new Error(`campo no autorizado "${k}" en ${m.patch.id}`);
    }
  }
}

// Mismo cordon sanitario que los otros dos: un <a> al CDN de Webflow dentro del
// Portable Text es una fuga al sitio viejo.
const BANNED = /cdn\.prod\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|d3e54v103j8qbb\.cloudfront\.net/;

// ---------------------------------------------------------------------------
// Autoprueba
// ---------------------------------------------------------------------------

if (AUTOPRUEBA) {
  const casos = [
    {
      nombre: "campo ES (titleEs) en un patch",
      mutaciones: [{ patch: { id: "post.demo", set: { titleEs: "Hola" } } }],
      esperado: /R5: el empujador EN intento escribir el campo ES "titleEs"/,
    },
    {
      nombre: "campo ES (bodyEs) junto a uno legitimo",
      mutaciones: [{ patch: { id: "post.demo", set: { title: "ok", bodyEs: [] } } }],
      esperado: /R5: el empujador EN intento escribir el campo ES "bodyEs"/,
    },
    {
      nombre: "authorName: fuera de la lista blanca a proposito",
      mutaciones: [{ patch: { id: "post.demo", set: { authorName: "Jane Doe, EA" } } }],
      esperado: /campo no autorizado "authorName"/,
    },
    {
      nombre: "slug: identidad, no contenido",
      mutaciones: [{ patch: { id: "post.demo", set: { slug: { current: "otro" } } } }],
      esperado: /campo no autorizado "slug"/,
    },
    {
      nombre: "createOrReplace",
      mutaciones: [{ createOrReplace: { _id: "post.demo", _type: "post", title: "x" } }],
      esperado: /mutacion prohibida "createOrReplace"/,
    },
  ];

  let fallos = 0;
  for (const c of casos) {
    let err = null;
    try { assertSafe(c.mutaciones); } catch (e) { err = e; }
    if (!err) { console.error(`  NO SALTO: ${c.nombre}`); fallos++; }
    else if (!c.esperado.test(err.message)) { console.error(`  MENSAJE INESPERADO en ${c.nombre}: ${err.message}`); fallos++; }
    else console.log(`  OK  ${c.nombre}\n      -> ${err.message}`);
  }
  // Control negativo: un patch legitimo NO puede saltar.
  try {
    assertSafe([
      { createIfNotExists: { _id: "post.demo", _type: "post" } },
      { patch: { id: "post.demo", set: { title: "Florida Sales Tax", body: [], metaTitle: "x", metaDescription: "y", excerpt: "z", publishedAt: "2026-07-28T00:00:00Z" } } },
    ]);
    console.log("  OK  un patch legitimo (solo campos EN) NO salta");
  } catch (e) { console.error(`  FALSO POSITIVO: ${e.message}`); fallos++; }

  console.log(fallos ? `\nautoprueba: ${fallos} fallo(s)` : "\nautoprueba: 6/6 correctos");
  process.exit(fallos ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

const { createClient } = await import("@sanity/client");

try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {
  // Sin .env local (CI): se espera la variable ya en el entorno.
}

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  throw new Error(
    "Falta SANITY_WRITE_TOKEN.\n" +
      "En local: .env  ·  En CI: variable de entorno. Este script ESCRIBE en el CMS.",
  );
}

const sanity = createClient({
  projectId: PROJECT, dataset: DATASET, apiVersion: "2021-06-07", useCdn: false, token,
});

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

const raiz = new URL("../", import.meta.url).pathname;
const lee = (p) => JSON.parse(readFileSync(raiz + p, "utf8"));

// Los dos encargos escriben el mismo lado (EN) de documentos distintos y con el
// mismo formato de fichero, asi que comparten empujador: duplicarlo seria
// duplicar tambien la lista blanca y el cordon anti-Webflow, que es justo lo que
// no conviene tener por partida doble.
const FUENTES = [
  { fichero: "baseline/contenido/posts-en.json", tipo: "post", n: 10, build: "node tools/blog-build.mjs" },
  { fichero: "baseline/contenido/servicios-en.json", tipo: "service", n: 12, build: "node tools/services-build.mjs" },
];

const entradas = [];
for (const f of FUENTES) {
  const docs = Object.entries(lee(f.fichero)).map(([_id, v]) => ({ _id, _type: f.tipo, ...v }));
  if (docs.length !== f.n) {
    throw new Error(`Entrada incompleta: ${docs.length} ${f.tipo} (${f.n}) en ${f.fichero}. Ejecuta antes: ${f.build}`);
  }
  entradas.push(...docs);
}

// ---------------------------------------------------------------------------
// R1 — identidad antes de escribir.
// ---------------------------------------------------------------------------

const vivos = await sanity.fetch(
  `*[_id in $ids]{_id, _type, "slug": slug.current, publishedAt, titleEs, "bodyESn": count(bodyEs)}`,
  { ids: entradas.map((e) => e._id) },
);
const porId = new Map(vivos.map((d) => [d._id, d]));

for (const e of entradas) {
  const d = porId.get(e._id);
  if (!d) throw new Error(`ABORTA: ${e._id} no existe en ${PROJECT}/${DATASET}.`);
  if (d._type !== e._type) throw new Error(`ABORTA: ${e._id} es ${d._type}, se esperaba ${e._type}.`);
  // El slug no se escribe y por eso sirve de huella: si no coincide, el _id
  // apunta a otro documento del que cree quien genero el JSON.
  if (d.slug !== e.slug) {
    throw new Error(`ABORTA: ${e._id} tiene slug "${d.slug}" y el JSON dice "${e.slug}".`);
  }
}
console.log(
  `identidad OK -> ${PROJECT}/${DATASET}  (${vivos.length}/${entradas.length} documentos)${DRY ? "  (simulacion)" : ""}`,
);

// ---------------------------------------------------------------------------
// Mutaciones.
//
// publishedAt: politica decidida por Sebastian el 28-jul-2026 = FECHA DEL
// EMPUJE. No hay fecha original recuperable (ni el crawl de produccion ni
// Sanity la traen en ninguno de los 10), asi que no se inventa una anterior.
// Se estampa SOLO si el documento aun no tiene fecha: reejecutar este script no
// mueve las fechas ya puestas, que es lo que lo hace idempotente de verdad.
// ---------------------------------------------------------------------------

const AHORA = new Date().toISOString();
const estampados = [];

const mutations = [];
for (const e of entradas) {
  const { _id, _type, slug, ...campos } = e; // `slug` se usa arriba y NO se escribe
  const set = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    set[k] = v;
  }
  // Solo los `post` llevan fecha: el esquema de `service` no tiene publishedAt.
  if (_type === "post" && !porId.get(_id).publishedAt) {
    set.publishedAt = AHORA;
    estampados.push(_id);
  }
  if (!Object.keys(set).length) throw new Error(`${_id}: no hay ni un campo EN que escribir.`);
  mutations.push({ createIfNotExists: { _id, _type } });
  mutations.push({ patch: { id: _id, set } });
}

assertSafe(mutations);
const serial = JSON.stringify(mutations);
if (BANNED.test(serial)) throw new Error("sobrevivio una URL de CDN de Webflow hasta las mutaciones");

const campos = new Set(mutations.flatMap((m) => Object.keys(m.patch?.set ?? {})));
console.log(`documentos: ${entradas.length}  mutaciones: ${mutations.length}`);
console.log(`campos escritos: ${[...campos].sort().join(", ")}`);
console.log(
  estampados.length
    ? `publishedAt: se estampa ${AHORA} en ${estampados.length} documento(s) sin fecha`
    : "publishedAt: los 10 ya tienen fecha, no se toca ninguna",
);

if (DRY) {
  console.log("simulacion: no se envia nada");
} else {
  const TANDA = 10; // el Portable Text de 10 articulos completos es grande
  for (let i = 0; i < mutations.length; i += TANDA) {
    const lote = mutations.slice(i, i + TANDA);
    const res = await sanity.request({
      url: `/data/mutate/${DATASET}?returnIds=true`,
      method: "POST",
      body: { mutations: lote },
    });
    console.log(`  tanda ${i / TANDA + 1}: ${res.results?.length ?? 0} resultados`);
  }
}

// ---------------------------------------------------------------------------
// Verificacion. Simetrica a la de push-i18n.mjs: alli se comprueba que el
// INGLES sigue intacto; aqui, que el ESPANOL sigue intacto. El modo de fallo
// que se teme no es "no escribio", es "escribio encima".
// ---------------------------------------------------------------------------

// Los dos tipos NO tienen la misma forma, y darlo por sentado convertia la
// verificacion en ruido: un `service` no lleva `excerpt` (su equivalente es
// `intro`, services/[slug].astro:110) ni `publishedAt` (solo lo tienen los 10
// post, como dice el resumen que imprime este mismo script). Con la lista de
// post aplicada a los 12 service salian 36 falsos positivos por pasada — y ahi
// dentro, una perdida REAL de excerptEs en un post era indistinguible del ruido.
// Eso es exactamente lo que esta verificacion existe para detectar.
const FORMA = {
  post:    { req: ["title", "excerpt", "metaTitle", "metaDescription"], es: "excerptEs", fecha: true },
  service: { req: ["title", "intro",   "metaTitle", "metaDescription"], es: "introEs",   fecha: false },
};

const despues = await sanity.fetch(
  `*[_id in $ids]{
     _id, _type, title, excerpt, intro, metaTitle, metaDescription, publishedAt, authorName,
     "bodyENn": count(body),
     titleEs, excerptEs, introEs, "bodyESn": count(bodyEs)
   }`,
  { ids: entradas.map((e) => e._id) },
);

const problemas = [];
for (const d of despues) {
  const forma = FORMA[d._type];
  if (!forma) { problemas.push(`${d._id}: _type inesperado "${d._type}"`); continue; }
  for (const campo of forma.req) {
    if (!(typeof d[campo] === "string" && d[campo].trim())) problemas.push(`${d._id}: falta ${campo}`);
  }
  if (!(d.bodyENn > 0)) problemas.push(`${d._id}: body (EN) vacio`);
  if (forma.fecha && !d.publishedAt) problemas.push(`${d._id}: sin publishedAt`);
  // Longitudes del esquema: metaTitle max 60, metaDescription max 160.
  if (d.metaTitle && d.metaTitle.length > 60) problemas.push(`${d._id}: metaTitle ${d.metaTitle.length} car.`);
  if (d.metaDescription && d.metaDescription.length > 160) problemas.push(`${d._id}: metaDescription ${d.metaDescription.length} car.`);
  // El espanol tiene que seguir ahi. Es la mitad que este script no puede tocar.
  if (!d.titleEs?.trim()) problemas.push(`${d._id}: SE PERDIO el titleEs`);
  if (!d[forma.es]?.trim()) problemas.push(`${d._id}: SE PERDIO el ${forma.es}`);
  if (!(d.bodyESn > 0)) problemas.push(`${d._id}: SE PERDIO el bodyEs`);
}

if (DRY) {
  console.log("\n(simulacion: la verificacion refleja el estado previo)");
} else if (problemas.length) {
  console.error("\nVERIFICACION FALLIDA:");
  for (const p of problemas) console.error("  " + p);
  process.exit(1);
} else {
  const porTipo = FUENTES.map((f) => `${despues.filter((d) => d._type === f.tipo).length} ${f.tipo}`).join(" + ");
  console.log(`\nverificado: ${despues.length}/${entradas.length} documentos (${porTipo}) con cuerpo EN y meta; espanol intacto`);
  // authorName solo aplica a los post: un `service` no lleva firma.
  const posts = despues.filter((d) => d._type === "post");
  const sinAutor = posts.filter((d) => !d.authorName?.trim()).length;
  if (sinAutor) {
    console.log(`\n${sinAutor}/${posts.length} post siguen SIN authorName. Es correcto y esta documentado:`);
    console.log("  entrega/blog-revision-fiscal.md — necesita una firma real con credencial (EA o CPA).");
  }
}
