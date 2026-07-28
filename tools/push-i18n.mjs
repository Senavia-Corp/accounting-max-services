// FASE 5 (paso 1/2) — empuja las traducciones al espanol a Sanity.
//
//   node tools/push-i18n.mjs --dry        simulacion, no escribe
//   node tools/push-i18n.mjs              escribe
//   node tools/push-i18n.mjs --autoprueba demuestra que los asertos saltan
//
// ESPEJO EXACTO DE tools/sanity-import.mjs. Alli la lista blanca son los campos
// EN y se PROHIBEN los *Es; aqui es al reves:
//
//   { createIfNotExists: { _id, _type } }        <- solo la cascara
//   { patch: { id, set: { …solo campos *Es… } } } <- nunca toca el ingles
//
// Por que importa la simetria: los dos scripts escriben sobre LOS MISMOS 22
// documentos. Si el importador pudiera tocar *Es, una reimportacion borraria el
// espanol; si este pudiera tocar los campos EN, una pasada de traduccion
// borraria el ingles. Cada uno solo puede escribir su mitad, y el aserto lo
// impone — no la disciplina de quien lo ejecuta.
//
// `createOrReplace` esta prohibido por la misma razon que en el importador: la
// segunda pasada borraria la otra mitad entera. Eso es lo que dejo 32 de 47
// paginas de AB Aluminum sirviendo H1 en ingles durante meses.

import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

const PROJECT = "ep5i6co1";
const DATASET = "production";
const DRY = process.argv.includes("--dry");
const AUTOPRUEBA = process.argv.includes("--autoprueba");

// ---------------------------------------------------------------------------
// Asertos. Espejo de assertSafe() en tools/sanity-import.mjs.
// ---------------------------------------------------------------------------

/**
 * Lista blanca: los UNICOS campos que este script puede escribir. Todos acaban
 * en `Es`. Cualquier otra cosa —y en particular un campo EN— hace fallar el
 * proceso antes de enviar una sola mutacion.
 */
const ES_KEYS = new Set([
  "titleEs", "introEs", "bodyEs", "excerptEs",
  "metaTitleEs", "metaDescriptionEs", "altEs",
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
      // El aserto que da nombre a la fase: si no acaba en Es, es ingles.
      if (!/Es$/.test(k)) {
        throw new Error(`R5: el empujador ES intento escribir el campo EN "${k}" en ${m.patch.id}`);
      }
      if (!ES_KEYS.has(k)) throw new Error(`campo no autorizado "${k}" en ${m.patch.id}`);
    }
  }
}

// URLs del CDN de Webflow: mismo cordon sanitario que el importador. Una
// traduccion con un <a> al sitio viejo dentro del Portable Text es una fuga.
const BANNED = /cdn\.prod\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|d3e54v103j8qbb\.cloudfront\.net/;

// ---------------------------------------------------------------------------
// Autoprueba: un aserto que nunca se ha visto fallar no es un aserto.
// ---------------------------------------------------------------------------

if (AUTOPRUEBA) {
  const casos = [
    {
      nombre: "campo EN (title) en un patch",
      mutaciones: [{ patch: { id: "service.demo", set: { title: "Audit Assistance" } } }],
      esperado: /R5: el empujador ES intento escribir el campo EN "title"/,
    },
    {
      nombre: "campo EN (body) en un patch",
      mutaciones: [{ patch: { id: "post.demo", set: { titleEs: "ok", body: [] } } }],
      esperado: /R5: el empujador ES intento escribir el campo EN "body"/,
    },
    {
      nombre: "campo *Es fuera de la lista blanca",
      mutaciones: [{ patch: { id: "service.demo", set: { inventadoEs: "x" } } }],
      esperado: /campo no autorizado "inventadoEs"/,
    },
    {
      nombre: "createOrReplace",
      mutaciones: [{ createOrReplace: { _id: "service.demo", _type: "service", titleEs: "x" } }],
      esperado: /mutacion prohibida "createOrReplace"/,
    },
  ];

  let fallos = 0;
  for (const c of casos) {
    let err = null;
    try {
      assertSafe(c.mutaciones);
    } catch (e) {
      err = e;
    }
    if (!err) {
      console.error(`  NO SALTO: ${c.nombre}`);
      fallos++;
    } else if (!c.esperado.test(err.message)) {
      console.error(`  MENSAJE INESPERADO en ${c.nombre}: ${err.message}`);
      fallos++;
    } else {
      console.log(`  OK  ${c.nombre}\n      -> ${err.message}`);
    }
  }
  // Control negativo: un patch legitimo NO puede saltar.
  try {
    assertSafe([
      { createIfNotExists: { _id: "service.demo", _type: "service" } },
      { patch: { id: "service.demo", set: { titleEs: "Asistencia en Auditorias", bodyEs: [] } } },
    ]);
    console.log("  OK  un patch legitimo (solo *Es) NO salta");
  } catch (e) {
    console.error(`  FALSO POSITIVO: ${e.message}`);
    fallos++;
  }
  console.log(fallos ? `\nautoprueba: ${fallos} fallo(s)` : "\nautoprueba: 5/5 correctos");
  process.exit(fallos ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Cliente. El token de escritura vive en .env y NO se imprime nunca.
// ---------------------------------------------------------------------------

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
  projectId: PROJECT,
  dataset: DATASET,
  apiVersion: "2021-06-07",
  useCdn: false,
  token,
});

// ---------------------------------------------------------------------------
// Datos de entrada.
// ---------------------------------------------------------------------------

const raiz = new URL("../", import.meta.url).pathname;
const lee = (p) => JSON.parse(readFileSync(raiz + p, "utf8"));

const servicios = lee("baseline/i18n/servicios-es.json");
const posts = lee("baseline/i18n/posts-es.json");

const entradas = [
  ...Object.entries(servicios).map(([_id, v]) => ({ _id, _type: "service", ...v })),
  ...Object.entries(posts).map(([_id, v]) => ({ _id, _type: "post", ...v })),
];

if (Object.keys(servicios).length !== 12 || Object.keys(posts).length !== 10) {
  throw new Error(
    `Entrada incompleta: ${Object.keys(servicios).length} servicios (12), ` +
      `${Object.keys(posts).length} posts (10).`,
  );
}

// ---------------------------------------------------------------------------
// R1 — identidad antes de escribir. Este script escribe sobre documentos que ya
// existen: si el dataset no es el que se cree, el patch va a otro sitio.
// ---------------------------------------------------------------------------

const vivos = await sanity.fetch(
  `*[_id in $ids]{_id, _type, "slug": slug.current}`,
  { ids: entradas.map((e) => e._id) },
);
const porId = new Map(vivos.map((d) => [d._id, d]));

for (const e of entradas) {
  const d = porId.get(e._id);
  if (!d) throw new Error(`ABORTA: ${e._id} no existe en ${PROJECT}/${DATASET}.`);
  if (d._type !== e._type) throw new Error(`ABORTA: ${e._id} es ${d._type}, se esperaba ${e._type}.`);
  // El slug NO se traduce (politica de FASE 5) y por eso sirve de huella: si no
  // coincide, el _id apunta a otro documento del que cree quien escribio el JSON.
  if (d.slug !== e.slug) {
    throw new Error(`ABORTA: ${e._id} tiene slug "${d.slug}" y el JSON dice "${e.slug}".`);
  }
}
console.log(`identidad OK -> ${PROJECT}/${DATASET}  (${vivos.length}/22 documentos)${DRY ? "  (simulacion)" : ""}`);

// ---------------------------------------------------------------------------
// Mutaciones.
// ---------------------------------------------------------------------------

const mutations = [];
for (const e of entradas) {
  const { _id, _type, slug, ...campos } = e; // `slug` se usa arriba y NO se escribe
  const set = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue; // un *Es vacio no se escribe
    set[k] = v;
  }
  if (!Object.keys(set).length) throw new Error(`${_id}: no hay ni un campo *Es que escribir.`);
  mutations.push({ createIfNotExists: { _id, _type } });
  mutations.push({ patch: { id: _id, set } });
}

assertSafe(mutations);
const serial = JSON.stringify(mutations);
if (BANNED.test(serial)) throw new Error("sobrevivio una URL de CDN de Webflow hasta las mutaciones");

const campos = new Set(mutations.flatMap((m) => Object.keys(m.patch?.set ?? {})));
console.log(`documentos: ${entradas.length}  mutaciones: ${mutations.length}`);
console.log(`campos escritos: ${[...campos].sort().join(", ")}`);

if (DRY) {
  console.log("simulacion: no se envia nada");
} else {
  // En tandas, igual que el importador: el Portable Text completo de 22
  // documentos es grande y si falla la transaccion entera no se sabe por donde.
  const TANDA = 20;
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
// Verificacion. Se comprueba que el ESPANOL esta y que el INGLES sigue intacto:
// el modo de fallo que se teme no es "no escribio", es "escribio encima".
// ---------------------------------------------------------------------------

// Exactamente los campos que requiereEs() exige en src/pages/es/_es.ts. Si esta
// lista y aquella divergen, el build cae y este script dice que todo esta bien.
//
// Los posts NO llevan metaTitleEs/metaDescriptionEs: vienen a null en
// baseline/i18n/posts-es.json porque tampoco existen en ingles (los 10 traen
// metaTitle/metaDescription vacios, verificado en el dataset). No se inventan
// (R3): /es/post/<slug> los COMPONE a partir de titleEs + NEGOCIO.nombre y de
// excerptEs, igual que hace la ruta EN con sus equivalentes ingleses. Es
// composicion desde dato en espanol, no una caida al ingles, asi que no viola
// R5. En los 12 servicios si existen y por eso ahi si son obligatorios.
const REQ = {
  service: ["titleEs", "introEs", "bodyEs", "metaTitleEs", "metaDescriptionEs"],
  post: ["titleEs", "excerptEs", "bodyEs"],
};
const OPCIONALES = { service: [], post: ["metaTitleEs", "metaDescriptionEs"] };

const despues = await sanity.fetch(
  `*[_id in $ids]{
     _id, _type, title, "slug": slug.current, "bodyEN": count(body),
     titleEs, introEs, excerptEs, "bodyESn": count(bodyEs),
     metaTitleEs, metaDescriptionEs
   }`,
  { ids: entradas.map((e) => e._id) },
);

const vacio = (d, campo) => {
  const v = d[campo === "bodyEs" ? "bodyESn" : campo];
  return campo === "bodyEs" ? !(v > 0) : !(typeof v === "string" && v.trim());
};

const problemas = [];
const huecos = [];
for (const d of despues) {
  for (const campo of REQ[d._type]) {
    if (vacio(d, campo)) problemas.push(`${d._id}: falta ${campo}`);
  }
  for (const campo of OPCIONALES[d._type]) {
    if (vacio(d, campo)) huecos.push(`${d._id}: sin ${campo}`);
  }
  // El ingles tiene que seguir ahi. Es la mitad que este script no puede tocar.
  if (!d.title?.trim()) problemas.push(`${d._id}: SE PERDIO el title (EN)`);
  if (!(d.bodyEN > 0)) problemas.push(`${d._id}: SE PERDIO el body (EN)`);
}

if (DRY) {
  console.log("\n(simulacion: la verificacion refleja el estado previo)");
} else if (problemas.length) {
  console.error("\nVERIFICACION FALLIDA:");
  for (const p of problemas) console.error("  " + p);
  process.exit(1);
} else {
  const s = despues.filter((d) => d._type === "service").length;
  const p = despues.filter((d) => d._type === "post").length;
  console.log(`\nverificado: ${s}/12 servicios y ${p}/10 posts con sus campos *Es, ingles intacto`);
  if (huecos.length) {
    console.log(`\nhuecos conocidos (${huecos.length}), NO bloquean — se componen desde el espanol:`);
    for (const h of huecos) console.log("  " + h);
  }
}
