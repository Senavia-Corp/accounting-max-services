// Repara `post.heroImage` — los 10 posts apuntan al MISMO asset.
//
//   node --env-file=.env tools/fix-post-heroes.mjs            (dry-run, no escribe)
//   node --env-file=.env tools/fix-post-heroes.mjs --apply    (escribe en Sanity)
//
// POR QUE ESTE SCRIPT Y NO IMAGENES NUEVAS: produccion SI daba a cada post su
// propia foto, y esas fotos YA estan en Sanity — son 13 de los assets que salen
// con refCount 0 en la auditoria. El heroImage compartido
// (6659037c0fab9f0937fe7130-picture.png, que es el promo del pie) es un fallo
// del import de la FASE 2, no una decision de diseno. Generar portadas aqui
// sustituiria fotos reales del cliente por sinteticas y romperia el port 1:1.
// El aviso de blog-news.astro:52 ya decia exactamente esto.
//
// EL MAPEO NO SE HARDCODEA. Se deriva en cada ejecucion de tres ficheros que ya
// estaban en el repositorio, para que sea auditable y para que no se pudra si
// alguien vuelve a importar:
//   baseline/html/post/<slug>.html   -> <img class="picture-blog-page"> de produccion
//   baseline/assets-descargados.csv  -> url de Webflow -> sha256 del contenido
//   baseline/import/assets-sanity.json -> sha256 -> _id del asset en Sanity
//
// Produccion reusaba 3 fotos (image3, image8 e image13 van a dos posts cada
// una): 10 posts, 7 assets distintos. Eso se conserva tal cual — es lo que el
// cliente publico, no un defecto que arreglar aqui.
//
// Solo toca heroImage.asset._ref. No escribe alt: el alt vive en Sanity, esta
// ausente en las 34 imagenes del dataset y redactarlo es decision del cliente
// (ver entrega/alt-pendientes.md).

import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { createClient } from "@sanity/client";

try { process.loadEnvFile(".env"); } catch { /* sin .env, se mira el entorno */ }

const PROJECT = "ep5i6co1";
const DATASET = "production";
const APLICAR = process.argv.includes("--apply");
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error(
    "Falta SANITY_WRITE_TOKEN.\n" +
    "Los scripts de tools/ NO heredan el .env de Astro: usa `node --env-file=.env`.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------- el mapeo

// sha256 -> _id de asset en Sanity, tal como lo dejo tools/upload-assets.mjs.
const porSha = JSON.parse(readFileSync("baseline/import/assets-sanity.json", "utf8"));

// nombre de fichero en el CDN de Webflow -> sha256. La columna `url` trae la
// ruta completa; nos quedamos con el ultimo segmento, que es lo que aparece en
// el `src` del HTML del baseline.
const porFichero = new Map();
for (const linea of readFileSync("baseline/assets-descargados.csv", "utf8").split(/\r?\n/).slice(1)) {
  if (!linea) continue;
  const [url, sha256] = linea.split(",");
  porFichero.set(decodeURIComponent(url.split("/").pop()), sha256);
}

// El <img> del hero en produccion. Se ancla en la clase, no en el orden de los
// atributos: Webflow escribe `src` antes que `class`, pero no hay garantia.
const HERO = /<img\b[^>]*\bclass="[^"]*\bpicture-blog-page\b[^"]*"[^>]*>/;
const SRC = /\bsrc="([^"]+)"/;

const filas = readdirSync("baseline/html/post")
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => {
    const slug = basename(f, ".html");
    const html = readFileSync(join("baseline/html/post", f), "utf8");
    const img = html.match(HERO)?.[0];
    const fichero = img?.match(SRC)?.[1]?.split("/").pop();
    const sha = fichero && porFichero.get(decodeURIComponent(fichero));
    return { slug, fichero: fichero && decodeURIComponent(fichero), sha, destino: sha && porSha[sha] };
  });

// ------------------------------------------------- self-check, antes de nada
// Barato, y evita descubrir a medias que falta un asset con 4 documentos ya
// escritos. Cada aserto nombra el fichero que hay que mirar si falla.
const fallos = [];
if (filas.length !== 10) fallos.push(`esperados 10 posts en baseline/html/post, hay ${filas.length}`);
for (const f of filas) {
  if (!f.fichero) fallos.push(`${f.slug}: sin <img class="picture-blog-page"> en el baseline`);
  else if (!f.sha) fallos.push(`${f.slug}: ${f.fichero} no esta en baseline/assets-descargados.csv`);
  else if (!f.destino) fallos.push(`${f.slug}: sha ${f.sha.slice(0, 12)} no esta en baseline/import/assets-sanity.json`);
}
if (fallos.length) {
  console.error("ABORTA — el mapeo no se puede derivar:\n  " + fallos.join("\n  "));
  process.exit(1);
}

const client = createClient({ projectId: PROJECT, dataset: DATASET, token, apiVersion: "2021-06-07", useCdn: false });

// R1: comprobar a quien resolvio el token ANTES de escribir nada.
const me = await client.request({ uri: "/users/me" });
const ids = (await client.request({ uri: "/projects" })).map((p) => p.id);
if (!ids.includes(PROJECT)) {
  throw new Error(`ABORTA: el token ve ${JSON.stringify(ids)}, se esperaba ${PROJECT}`);
}
console.log(`identidad OK -> ${PROJECT}  token="${me.name}" rol=${me.role}\n`);

// Estado real en Sanity, para que la tabla muestre de-donde -> a-donde y para
// no emitir mutaciones que no cambian nada.
const actual = Object.fromEntries(
  (await client.fetch(`*[_type=="post"]{"slug":slug.current,_id,"ref":heroImage.asset._ref}`))
    .map((p) => [p.slug, p]),
);

const sinDoc = filas.filter((f) => !actual[f.slug]);
if (sinDoc.length) {
  console.error("ABORTA: sin documento en Sanity para " + sinDoc.map((f) => f.slug).join(", "));
  process.exit(1);
}

// Que el destino exista de verdad en el CDN. Un _id bien formado pero de un
// asset borrado dejaria las 10 portadas rotas y el build no se enteraria.
const urls = await client.fetch(`*[_id in $ids]{_id, url, "w":metadata.dimensions.width, "h":metadata.dimensions.height}`, {
  ids: [...new Set(filas.map((f) => f.destino))],
});
const porId = Object.fromEntries(urls.map((a) => [a._id, a]));
for (const a of urls) {
  const r = await fetch(`${a.url}?w=64`, { method: "HEAD" });
  if (!r.ok) { console.error(`ABORTA: ${a._id} responde ${r.status}`); process.exit(1); }
}
console.log(`assets destino: ${urls.length} distintos, todos 200\n`);

// ------------------------------------------------------------------ informe
const ancho = Math.max(...filas.map((f) => f.slug.length));
let cambian = 0;
for (const f of filas) {
  const a = actual[f.slug];
  const igual = a.ref === f.destino;
  if (!igual) cambian++;
  const d = porId[f.destino];
  console.log(
    `${igual ? "=" : "→"} ${f.slug.padEnd(ancho)}  ${f.fichero.padEnd(42)} ${d.w}x${d.h}  ${f.destino}`,
  );
}
const distintos = new Set(filas.map((f) => f.destino)).size;
console.log(`\n${filas.length} posts · ${distintos} assets distintos · ${cambian} cambian, ${filas.length - cambian} ya estaban bien`);

if (!APLICAR) {
  console.log("\nDRY-RUN: no se ha escrito nada. Para aplicar:  node --env-file=.env tools/fix-post-heroes.mjs --apply");
  process.exit(0);
}
if (!cambian) { console.log("\nNada que hacer."); process.exit(0); }

// ----------------------------------------------------------------- escritura
// Una sola transaccion: o entran las 10 o no entra ninguna. Un dataset a medias
// es peor que el estado actual, que al menos es uniforme y esta diagnosticado.
// Idempotente: reejecutarlo no cambia nada porque `cambian` sale 0.
const tx = filas.reduce(
  (t, f) => (actual[f.slug].ref === f.destino ? t : t.patch(actual[f.slug]._id, (p) => p.set({ "heroImage.asset._ref": f.destino }))),
  client.transaction(),
);
await tx.commit();
console.log(`\nescritos ${cambian} documentos.`);

// Releer, no confiar. Si la transaccion entro pero el dato no cuadra, mejor
// enterarse aqui que en el build.
const despues = await client.fetch(`*[_type=="post"]{"slug":slug.current,"ref":heroImage.asset._ref}`);
const mal = filas.filter((f) => despues.find((p) => p.slug === f.slug)?.ref !== f.destino);
if (mal.length) throw new Error("verificacion fallida en: " + mal.map((f) => f.slug).join(", "));
console.log(`verificado: 10/10 correctos, ${new Set(despues.map((p) => p.ref)).size} assets distintos.`);
