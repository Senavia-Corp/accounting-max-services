// Sube las 10 portadas a Sanity y las engancha a su post.
//
//   node --env-file=.env tools/upload-blog-covers.mjs            (dry-run)
//   node --env-file=.env tools/upload-blog-covers.mjs --apply    (escribe)
//
// ESCRIBE EN EL CMS DEL CLIENTE. Por eso el dry-run es lo que pasa por defecto
// y --apply hay que pedirlo a mano.
//
// Reusa el patron de tools/upload-assets.mjs: misma guardia de identidad (R1,
// resolver /users/me y comprobar el proyecto ANTES de escribir) y la misma
// llamada client.assets.upload. Va aparte porque aquel tiene otro trabajo —
// lee baseline/assets-descargados.csv — y ademas este ademas PARCHEA los
// documentos, cosa que aquel no hace.
//
// Re-ejecutable sin duplicar: los _id de asset de Sanity son direccionables por
// contenido (sha1 de los bytes), asi que subir los mismos bytes dos veces
// devuelve el MISMO _id. Y el parche es idempotente.
//
// Escribe tres campos por post y ni uno mas:
//   heroImage.asset._ref   la portada nueva
//   heroImage.alt          alt SEO en ingles
//   heroImage.altEs        alt SEO en espanol
// El alt viaja aqui porque lo define blog-image-prompts.mjs junto al prompt que
// genero la imagen: describimos algo que hemos disenado nosotros, no hay que
// adivinarlo. Los otros 24 alt del dataset (los de service) siguen vacios y su
// lista esta en entrega/alt-pendientes.md — esos si son del cliente.

import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { createClient } from "@sanity/client";
import { SEO } from "./blog-image-prompts.mjs";

try { process.loadEnvFile(".env"); } catch { /* sin .env, se mira el entorno */ }

const PROJECT = "ep5i6co1";
const DATASET = "production";
const DIR = "public/blog";
const APLICAR = process.argv.includes("--apply");
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error("Falta SANITY_WRITE_TOKEN.\nLos scripts de tools/ NO heredan el .env de Astro: usa `node --env-file=.env`.");
  process.exit(1);
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// --- self-check: los 10 ficheros, antes de tocar la red -------------------
const slugs = Object.keys(SEO);
const filas = slugs.map((slug) => {
  const ext = [".jpg", ".png", ".webp"].find((e) => existsSync(join(DIR, SEO[slug].fichero + e)));
  return { slug, ext, ruta: ext && join(DIR, SEO[slug].fichero + ext), ...SEO[slug] };
});
const fallos = filas.filter((f) => !f.ext).map((f) => `${f.slug}: falta ${DIR}/${f.fichero}.{jpg,png,webp}`);
if (slugs.length !== 10) fallos.push(`esperados 10 slugs, hay ${slugs.length}`);
if (fallos.length) {
  console.error("ABORTA — self-check:\n  " + fallos.join("\n  ") +
    "\n\nGeneralas antes:  node --env-file=.env tools/gen-blog-images.mjs");
  process.exit(1);
}

const client = createClient({ projectId: PROJECT, dataset: DATASET, token, apiVersion: "2021-06-07", useCdn: false });

// R1: comprobar a quien resolvio el token ANTES de escribir nada.
const me = await client.request({ uri: "/users/me" });
const ids = (await client.request({ uri: "/projects" })).map((p) => p.id);
if (!ids.includes(PROJECT)) throw new Error(`ABORTA: el token ve ${JSON.stringify(ids)}, se esperaba ${PROJECT}`);
console.log(`identidad OK -> ${PROJECT}  token="${me.name}" rol=${me.role}\n`);

const posts = Object.fromEntries(
  (await client.fetch(`*[_type=="post"]{"slug":slug.current,_id,"ref":heroImage.asset._ref}`)).map((p) => [p.slug, p]),
);
const sinDoc = filas.filter((f) => !posts[f.slug]);
if (sinDoc.length) {
  console.error("ABORTA: sin documento en Sanity para " + sinDoc.map((f) => f.slug).join(", "));
  process.exit(1);
}

if (!APLICAR) {
  console.log("DRY-RUN — esto es lo que se escribiria:\n");
  for (const f of filas) {
    const kb = Math.round(readFileSync(f.ruta).length / 1024);
    console.log(`${f.slug}`);
    console.log(`  fichero  ${f.fichero}${f.ext}  (${kb}KB)`);
    console.log(`  alt      ${f.alt.en}`);
    console.log(`  altEs    ${f.alt.es}`);
    console.log(`  destino  ${posts[f.slug]._id}  ·  heroImage.asset._ref  ${posts[f.slug].ref?.slice(0, 28)}… -> (nuevo)`);
  }
  console.log(`\n${filas.length} posts · ${filas.length} assets a subir · 3 campos por post`);
  console.log("\nNo se ha escrito nada. Para aplicar:  node --env-file=.env tools/upload-blog-covers.mjs --apply");
  process.exit(0);
}

// ----------------------------------------------------------------- escritura
// Primero TODAS las subidas, luego UNA transaccion con los 10 parches. Subir es
// aditivo y no rompe nada aunque se quede a medias; parchear si, y por eso los
// 10 documentos entran o no entran juntos.
const subidos = {};
for (const f of filas) {
  const bytes = readFileSync(f.ruta);
  const doc = await client.assets.upload("image", bytes, {
    filename: f.fichero + f.ext,
    contentType: MIME[extname(f.ext).toLowerCase()],
  });
  // Sanity relee las dimensiones del binario: si llegara corrupto, no habria
  // metadata. Comprobarlo es mas barato que descubrirlo en el build.
  const dim = doc.metadata?.dimensions;
  if (!dim?.width) throw new Error(`${f.fichero} subio sin dimensiones: llego corrupto`);
  subidos[f.slug] = doc._id;
  console.log(`  ${doc._id}  ${dim.width}x${dim.height}  ${f.fichero}${f.ext}`);
}

const tx = filas.reduce(
  (t, f) => t.patch(posts[f.slug]._id, (p) => p.set({
    "heroImage.asset._ref": subidos[f.slug],
    "heroImage.alt": f.alt.en,
    "heroImage.altEs": f.alt.es,
  })),
  client.transaction(),
);
await tx.commit();
console.log(`\nescritos ${filas.length} documentos.`);

// Releer, no confiar.
const despues = await client.fetch(
  `*[_type=="post"]{"slug":slug.current,"ref":heroImage.asset._ref,"alt":heroImage.alt,"altEs":heroImage.altEs}`,
);
const mal = filas.filter((f) => {
  const p = despues.find((x) => x.slug === f.slug);
  return p?.ref !== subidos[f.slug] || !p?.alt?.trim() || !p?.altEs?.trim();
});
if (mal.length) throw new Error("verificacion fallida en: " + mal.map((f) => f.slug).join(", "));
console.log(`verificado: 10/10 con portada propia, ${new Set(despues.map((p) => p.ref)).size} assets distintos, 20/20 alt escritos.`);
console.log("\nSiguiente:  npm run build   (los dos avisos de imagen deben desaparecer)");
