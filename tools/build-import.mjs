// FASE 2 (paso 1/3) — construye los documentos a importar. Local, sin red.
//
//   node tools/build-import.mjs
//
// Sale: baseline/import/docs.json
//
// La conversion HTML -> Portable Text se hace con @portabletext/block-tools y
// no a mano: los 12 cuerpos traen listas ANIDADAS (<li> con <ol> dentro) y
// Portable Text codifica el anidamiento con `level`. Un conversor casero las
// aplana o las pierde, en silencio.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { homedir } from "node:os";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";
import { schemaTypes } from "../src/sanity/schemas.mjs";

const DOWNLOADS = join(homedir(), "Downloads");
const SERVICES_CSV = join(DOWNLOADS, "Accounting Max Services - Services - 678170792441245c3514a9d5.csv");
const REVIEWS_CSV = join(DOWNLOADS, "Accounting Max Services - Reviews - 684a13ff5103367745f37fa2.csv");
const OUT = "baseline/import";

const compiled = Schema.compile({ name: "ams", types: schemaTypes });
const blockType = compiled.get("post").fields.find((f) => f.name === "body").type;

/** Parser CSV minimo con comillas dobles al estilo RFC4180. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') (text[i + 1] === '"' ? (field += '"', i++) : (q = false));
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") (row.push(field), (field = ""));
    else if (c === "\n") (row.push(field), rows.push(row), (row = []), (field = ""));
    else if (c !== "\r") field += c;
  }
  if (field || row.length) (row.push(field), rows.push(row));
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/** Limpia la basura que Webflow mete en el rich text antes de convertir. */
function sanitize(html) {
  return (html || "")
    .replace(/\sid=""/g, "")           // 222 atributos vacios
    .replace(/‍/g, "")            // 27 ZWJ que abren cada <p>
    .replace(/<(strong|em|b|i)>\s*<\/\1>/g, "")  // los envoltorios que quedan vacios
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

const toBlocks = (html) =>
  htmlToBlocks(sanitize(html), blockType, {
    parseHtml: (h) => new JSDOM(h).window.document,
  })
    // Webflow deja cabeceras y parrafos sin texto (p.ej. un <h2> vacio al final
    // de personal-tax-preparation). En el Studio se ven como bloques fantasma y
    // en el render meterian un hueco, asi que se descartan.
    .filter((b) =>
      b._type !== "block" ||
      (b.children || []).some((c) => (c.text || "").trim()),
    );

/** sha256 -> nombre local, para referenciar los assets ya descargados. */
function assetIndex() {
  const idx = new Map();
  for (const name of readdirSync("baseline/assets")) {
    idx.set(name.split("__")[0], name); // los 16 primeros hex del sha256
  }
  return idx;
}

const byUrl = new Map(
  parseCsv(readFileSync("baseline/assets-descargados.csv", "utf8")).map((r) => [r.url, r]),
);

function assetFor(url) {
  if (!url) return null;
  const rec = byUrl.get(decodeURIComponent(url.trim()));
  return rec ? { sha256: rec.sha256, local: rec.local } : null;
}

const docs = [];

// ---- Servicios: 12 filas, _id derivado del Item ID de Webflow ----
for (const r of parseCsv(readFileSync(SERVICES_CSV, "utf8"))) {
  if (r.Archived === "true" || r.Draft === "true") continue;
  docs.push({
    _id: `service.${r["Item ID"]}`,
    _type: "service",
    title: r.Name,
    slug: { _type: "slug", current: r.Slug },
    intro: r.Intro || undefined,
    body: toBlocks(r.Body),
    feature: r.Feature === "true",
    webflowItemId: r["Item ID"],
    _assets: { icon: assetFor(r.Icon), picture: assetFor(r.Picture) },
  });
}

// ---- Testimonios: 20 filas. Sin rating, sin fecha, sin fuente (D5). ----
for (const r of parseCsv(readFileSync(REVIEWS_CSV, "utf8"))) {
  if (r.Archived === "true" || r.Draft === "true") continue;
  docs.push({
    _id: `review.${r["Item ID"]}`,
    _type: "review",
    author: r.Name,
    slug: { _type: "slug", current: r.Slug },
    quote: r.Review,
    webflowItemId: r["Item ID"],
    _assets: {},
  });
}

// ---- Posts: 10, rescatados del sitio vivo ----
// DESVIACION DOCUMENTADA: no tienen Item ID recuperable. Las paginas /post/
// emiten data-wf-page (id de plantilla, identico en los 10) y
// data-wf-collection, pero data-wf-item-id da 0 coincidencias. Se usa el slug,
// que aqui es estable por construccion porque es la URL canonica congelada.
for (const f of readdirSync("baseline/posts").sort()) {
  const p = JSON.parse(readFileSync(join("baseline/posts", f), "utf8"));
  docs.push({
    _id: `post.${p.slug}`,
    _type: "post",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    body: toBlocks(p.bodyHtml),
    // publishedAt y authorName se quedan fuera a proposito: la plantilla de
    // Webflow no los liga y no se inventan (R3).
    _assets: { heroImage: assetFor(p.heroImage) },
  });
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "docs.json"), JSON.stringify(docs, null, 1));

// --- comprobaciones que fallan ruidosamente ---
const idx = assetIndex();
const counts = docs.reduce((a, d) => ((a[d._type] = (a[d._type] || 0) + 1), a), {});
const missing = docs.flatMap((d) =>
  Object.entries(d._assets).filter(([, v]) => v && !idx.has(v.sha256.slice(0, 16))).map(([k]) => `${d._id}.${k}`),
);
const noAsset = docs.filter((d) => d._type !== "review" && Object.values(d._assets).every((v) => !v));
const empty = docs.filter((d) => d.body && d.body.length === 0);
const cdn = JSON.stringify(docs).match(/website-files\.com|cloudfront\.net/g) || [];
const ids = new Set(docs.map((d) => d._id));

console.log("documentos:", counts);
console.log("_id unicos:", ids.size === docs.length ? "OK" : `FALLA (${ids.size}/${docs.length})`);
console.log("assets no descargados:", missing.length ? missing : "ninguno");
console.log("docs sin ningun asset:", noAsset.map((d) => d._id));
console.log("cuerpos vacios:", empty.map((d) => d._id));
console.log("URLs de CDN de Webflow en la salida:", cdn.length);

if (counts.service !== 12 || counts.review !== 20 || counts.post !== 10) throw new Error("conteo inesperado");
if (ids.size !== docs.length) throw new Error("_id duplicado");
if (missing.length) throw new Error("faltan assets descargados");
if (cdn.length) throw new Error("sobrevivio una URL del CDN de Webflow");
console.log("\nOK -> baseline/import/docs.json");
