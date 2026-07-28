// FASE 2 (paso 2/3) — sube a Sanity los assets rescatados del CDN de Webflow.
//
//   composio run -f tools/sanity-upload-assets.mjs
//
// Sale: baseline/import/assets-sanity.json  (sha256 local -> _id de asset Sanity)
//
// Es re-ejecutable sin coste ni duplicados: los _id de asset de Sanity son
// direccionables por contenido (sha1 de los bytes), asi que subir los mismos
// bytes dos veces devuelve el MISMO _id. El fichero de salida solo evita el
// viaje de red, no es necesario para la correccion.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

const PROJECT = "ep5i6co1";
const DATASET = "production";
const OUT = "baseline/import/assets-sanity.json";

const f = await proxy("sanity", { account: "accounting-max-services" });

// R1: comprobar a quien resolvio la conexion ANTES de escribir nada.
const projects = await (await f("https://api.sanity.io/v2021-06-07/projects")).json();
const ids = projects.map((p) => p.id);
if (ids.length !== 1 || ids[0] !== PROJECT) {
  throw new Error(`ABORTA: la conexion ve ${JSON.stringify(ids)}, se esperaba solo [${PROJECT}]`);
}
console.log(`identidad OK -> ${PROJECT}`);

const MIME = {
  ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon",
};

// El csv de Python escribe con CRLF: hay que quitar el \r o los nombres de
// fichero salen con un retorno de carro pegado al final.
const rows = readFileSync("baseline/assets-descargados.csv", "utf8")
  .split(/\r?\n/).filter(Boolean).slice(1)
  .map((l) => {
    const [url, sha256, bytes, local] = l.split(",");
    return { url, sha256, bytes: +bytes, local };
  });

// Deduplicar por contenido: el mismo icono aparece en varias paginas.
const unique = [...new Map(rows.map((r) => [r.sha256, r])).values()];
console.log(`assets: ${rows.length} referencias, ${unique.length} unicos por contenido`);

const map = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
let subidos = 0, cacheados = 0;

for (const a of unique) {
  if (map[a.sha256]) { cacheados++; continue; }
  const path = join("baseline/assets", a.local);
  const bytes = readFileSync(path);
  // El nombre visible en el Studio: sin el prefijo de hash.
  const filename = a.local.split("__").slice(1).join("__") || basename(path);
  const ct = MIME[extname(filename).toLowerCase()] || "application/octet-stream";

  const res = await f(
    `https://${PROJECT}.api.sanity.io/v2021-06-07/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}`,
    { method: "POST", headers: { "Content-Type": ct }, body: bytes },
  );
  const body = await res.json();
  if (!res.ok || !body?.document?._id) {
    throw new Error(`fallo subiendo ${filename}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  map[a.sha256] = body.document._id;
  subidos++;
  console.log(`  ${body.document._id}  ${filename}`);
}

mkdirSync("baseline/import", { recursive: true });
writeFileSync(OUT, JSON.stringify(map, null, 1));
console.log(`\nsubidos: ${subidos}  ya conocidos: ${cacheados}  total en el mapa: ${Object.keys(map).length}`);
