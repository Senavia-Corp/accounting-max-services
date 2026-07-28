// FASE 2 (paso 3/3) — importa los documentos a Sanity. Idempotente por diseno.
//
//   composio run -f tools/sanity-import.mjs
//   composio run -f tools/sanity-import.mjs -- --dry
//
// Garantia de idempotencia expresada como estructura, no como disciplina:
//
//   { createIfNotExists: { _id, _type } }        <- solo la cascara
//   { patch: { id, set: { …solo campos EN… } } } <- nunca toca *Es
//
// La primera pasada crea, la segunda es un no-op. `createOrReplace` NO se
// evita por convencion: assertSafe() lanza si aparece. Si se usara, la segunda
// pasada borraria todas las traducciones al espanol — que es exactamente lo
// que dejo 32 de 47 paginas de AB Aluminum sirviendo H1 en ingles.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";

const PROJECT = "ep5i6co1";
const DATASET = "production";
const DRY = process.argv.includes("--dry");

// Lista blanca de campos que el importador puede escribir. Todo lo demas
// —y en particular cualquier cosa acabada en Es— hace fallar el proceso.
const EN_KEYS = new Set([
  "title", "slug", "intro", "body", "excerpt", "author", "quote",
  "icon", "picture", "heroImage", "feature", "webflowItemId",
  "metaTitle", "metaDescription",
]);
const MUTACIONES_PROHIBIDAS = ["createOrReplace", "createOrReplaceIfNotExists", "delete", "replace"];

function assertSafe(mutations) {
  for (const m of mutations) {
    for (const k of Object.keys(m)) {
      if (MUTACIONES_PROHIBIDAS.includes(k)) {
        throw new Error(`idempotencia: mutacion prohibida "${k}"`);
      }
    }
    for (const k of Object.keys(m.patch?.set ?? {})) {
      if (/Es$/.test(k)) throw new Error(`R5: el importador intento escribir el campo ES "${k}" en ${m.patch.id}`);
      if (!EN_KEYS.has(k)) throw new Error(`campo no autorizado "${k}" en ${m.patch.id}`);
    }
  }
}

const BANNED = /cdn\.prod\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|d3e54v103j8qbb\.cloudfront\.net/;

const f = await proxy("sanity", { account: "accounting-max-services" });
const api = (path, body) =>
  f(`https://${PROJECT}.api.sanity.io/v2021-06-07${path}`, body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body }
    : undefined);

// R1: comprobar identidad antes de escribir.
const projects = await (await f("https://api.sanity.io/v2021-06-07/projects")).json();
const ids = projects.map((p) => p.id);
if (ids.length !== 1 || ids[0] !== PROJECT) {
  throw new Error(`ABORTA: la conexion ve ${JSON.stringify(ids)}, se esperaba solo [${PROJECT}]`);
}
console.log(`identidad OK -> ${PROJECT}/${DATASET}${DRY ? "  (simulacion)" : ""}`);

const docs = JSON.parse(readFileSync("baseline/import/docs.json", "utf8"));
const assetMap = existsSync("baseline/import/assets-sanity.json")
  ? JSON.parse(readFileSync("baseline/import/assets-sanity.json", "utf8"))
  : {};
if (!Object.keys(assetMap).length) {
  console.log("AVISO: no hay assets en Sanity todavia (B5). Se importa el texto y las");
  console.log("       imagenes se anaden en una segunda pasada, que es no destructiva.");
}

const mutations = [];
for (const d of docs) {
  const { _id, _type, _assets, ...campos } = d;
  const set = {};
  for (const [k, v] of Object.entries(campos)) {
    if (v !== undefined && v !== null) set[k] = v;
  }
  for (const [campo, a] of Object.entries(_assets || {})) {
    const assetId = a && assetMap[a.sha256];
    if (assetId) set[campo] = { _type: "image", asset: { _type: "reference", _ref: assetId } };
  }
  mutations.push({ createIfNotExists: { _id, _type } });
  mutations.push({ patch: { id: _id, set } });
}

assertSafe(mutations);
const serial = JSON.stringify(mutations);
if (BANNED.test(serial)) throw new Error("sobrevivio una URL de CDN de Webflow hasta las mutaciones");
console.log(`documentos: ${docs.length}  mutaciones: ${mutations.length}`);

if (DRY) {
  console.log("simulacion: no se envia nada");
} else {
  // En tandas: una transaccion con 84 mutaciones y Portable Text completo es
  // grande, y si falla no se sabe por donde iba.
  const TANDA = 20;
  for (let i = 0; i < mutations.length; i += TANDA) {
    const lote = mutations.slice(i, i + TANDA);
    const res = await api(`/data/mutate/${DATASET}?returnIds=true`, { mutations: lote });
    const body = await res.json();
    if (!res.ok) throw new Error(`fallo en la tanda ${i / TANDA}: ${res.status} ${JSON.stringify(body).slice(0, 400)}`);
    console.log(`  tanda ${i / TANDA + 1}: ${body.results?.length ?? 0} resultados`);
  }
}

// --- instantanea normalizada, para la prueba de doble pasada ---
const q = async (query) =>
  (await (await api(`/data/query/${DATASET}?query=${encodeURIComponent(query)}`)).json()).result;

// Se descartan los documentos de sistema: el dataset trae 12 `system.group`
// generados por Sanity (_.groups.*) que ensuciarian el diff.
const todos = await q('*[!(_id in path("_.**"))]|order(_id)');
const orden = (v) =>
  Array.isArray(v) ? v.map(orden)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().filter((k) => !["_rev", "_updatedAt"].includes(k)).map((k) => [k, orden(v[k])]))
      : v;
mkdirSync("baseline/import", { recursive: true });
const snap = (todos ?? []).map(orden).map((d) => JSON.stringify(d)).join("\n");
const destino = process.argv.includes("--snap2") ? "snap2.ndjson" : "snap1.ndjson";
writeFileSync(`baseline/import/${destino}`, snap);

const conteo = await q('{"service":count(*[_type=="service"]),"review":count(*[_type=="review"]),"post":count(*[_type=="post"]),"teamMember":count(*[_type=="teamMember"]),"total":count(*[!(_id in path("_.**"))])}');
console.log("\nen el dataset:", JSON.stringify(conteo));
console.log(`instantanea -> baseline/import/${destino}`);
