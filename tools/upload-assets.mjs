// FASE 2 — sube a Sanity los assets rescatados del CDN de Webflow.
//
//   node tools/upload-assets.mjs
//
// Usa @sanity/client con SANITY_WRITE_TOKEN, y NO el proxy de Composio: ese no
// transporta cuerpos crudos y el endpoint /assets/images/ responde
// `422 Invalid image` incluso con un SVG, que es texto plano (ver B5).
//
// Re-ejecutable sin coste ni duplicados: los _id de asset de Sanity son
// direccionables por contenido (sha1 de los bytes), asi que subir los mismos
// bytes dos veces devuelve el MISMO _id. El fichero de salida solo ahorra el
// viaje de red; no es necesario para la correccion.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { createClient } from "@sanity/client";

try { process.loadEnvFile(".env"); } catch { /* sin .env, se mira el entorno */ }

const PROJECT = "ep5i6co1";
const DATASET = "production";
const OUT = "baseline/import/assets-sanity.json";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error(
    "Falta SANITY_WRITE_TOKEN.\n" +
    "  1. Emitirlo en https://www.sanity.io/manage/project/ep5i6co1/api -> Tokens (rol Editor)\n" +
    "  2. echo 'SANITY_WRITE_TOKEN=…' >> .env\n" +
    "El repositorio es PUBLICO: .env esta en .gitignore y no debe commitearse jamas.",
  );
  process.exit(1);
}

const client = createClient({ projectId: PROJECT, dataset: DATASET, token, apiVersion: "2021-06-07", useCdn: false });

// R1: comprobar a quien resolvio el token ANTES de escribir nada.
const me = await client.request({ uri: "/users/me" });
const proyectos = await client.request({ uri: "/projects" });
const ids = proyectos.map((p) => p.id);
if (!ids.includes(PROJECT)) {
  throw new Error(`ABORTA: el token ve ${JSON.stringify(ids)}, se esperaba ${PROJECT}`);
}
console.log(`identidad OK -> ${PROJECT}  token="${me.name}" rol=${me.role}`);

const MIME = {
  ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".ico": "image/x-icon",
};

// El csv de Python escribe con CRLF: si no se quita el \r, los nombres de
// fichero salen con un retorno de carro pegado.
const filas = readFileSync("baseline/assets-descargados.csv", "utf8")
  .split(/\r?\n/).filter(Boolean).slice(1)
  .map((l) => { const [url, sha256, bytes, local] = l.split(","); return { url, sha256, bytes: +bytes, local }; });

// Deduplicar por contenido: el mismo icono aparece en varias paginas.
const unicos = [...new Map(filas.map((r) => [r.sha256, r])).values()];
console.log(`assets: ${filas.length} referencias, ${unicos.length} unicos por contenido`);

mkdirSync("baseline/import", { recursive: true });
const mapa = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
let subidos = 0, cacheados = 0;

for (const a of unicos) {
  if (mapa[a.sha256]) { cacheados++; continue; }
  const ruta = join("baseline/assets", a.local);
  const bytes = readFileSync(ruta);
  const filename = a.local.split("__").slice(1).join("__") || basename(ruta);
  const contentType = MIME[extname(filename).toLowerCase()] || "application/octet-stream";

  const doc = await client.assets.upload("image", bytes, { filename, contentType });
  // Sanity re-lee las dimensiones del binario: si llegara corrupto, no habria
  // metadata. Comprobarlo es mas barato que descubrirlo en la FASE 3.
  const dim = doc.metadata?.dimensions;
  if (!dim?.width) throw new Error(`${filename} subio sin dimensiones: llego corrupto`);
  mapa[a.sha256] = doc._id;
  subidos++;
  console.log(`  ${doc._id}  ${dim.width}x${dim.height}  ${filename}`);
}

writeFileSync(OUT, JSON.stringify(mapa, null, 1));
console.log(`\nsubidos: ${subidos}  ya conocidos: ${cacheados}  total: ${Object.keys(mapa).length}/${unicos.length}`);
if (Object.keys(mapa).length !== unicos.length) throw new Error("faltan assets por subir");
console.log("\nSiguiente: composio run -f tools/sanity-import.mjs   (segunda pasada, no destructiva)");
