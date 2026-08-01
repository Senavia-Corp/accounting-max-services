// Auditoria de metadatos de indexacion sobre el HTML YA CONSTRUIDO.
//
// Se ejecuta contra dist/client y no contra el codigo fuente a proposito: lo que
// Google lee es el HTML servido, y entre el `.astro` y el `dist` hay un
// compilador. Un aserto sobre el fuente puede pasar mientras la etiqueta sale
// mal (o no sale) en el fichero real.
//
// Uso:  node tools/auditar-seo.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "/Users/senavia/site/dist/client";
const SITIO = "https://www.accountingmaxservices.com";

const rutas = [];
(function anda(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) anda(p);
    else if (e === "index.html") {
      const r = "/" + relative(DIST, p).replace(/\/?index\.html$/, "");
      rutas.push({ ruta: r === "/" ? "/" : r, fichero: p });
    }
  }
})(DIST);
rutas.sort((a, b) => a.ruta.localeCompare(b.ruta));

const uno = (h, re) => (h.match(re) || [])[1];
const todos = (h, re) => [...h.matchAll(re)].map((m) => m[1]);
const attr = (h, sel, a) => uno(h, new RegExp(`<${sel}[^>]*\\s${a}="([^"]*)"`, "i"));
const meta = (h, n) =>
  uno(h, new RegExp(`<meta[^>]*name="${n}"[^>]*content="([^"]*)"`, "i")) ??
  uno(h, new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name="${n}"`, "i"));
const prop = (h, p) =>
  uno(h, new RegExp(`<meta[^>]*property="${p}"[^>]*content="([^"]*)"`, "i")) ??
  uno(h, new RegExp(`<meta[^>]*content="([^"]*)"[^>]*property="${p}"`, "i"));

const fallos = [];
const avisos = [];
const filas = [];
const porTitulo = new Map();
const porDesc = new Map();

for (const { ruta, fichero } of rutas) {
  const h = readFileSync(fichero, "utf8");
  const cabeza = h.slice(0, h.indexOf("</head>"));
  const F = (m) => fallos.push(`${ruta}: ${m}`);
  const A = (m) => avisos.push(`${ruta}: ${m}`);

  const titulo = uno(cabeza, /<title>([^<]*)<\/title>/i)?.trim();
  const desc = meta(cabeza, "description")?.trim();
  const canon = uno(cabeza, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
  const robots = meta(cabeza, "robots");
  const lang = attr(h, "html", "lang");
  const h1 = todos(h, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map((x) => x.replace(/<[^>]+>/g, "").trim());
  const alt = todos(cabeza, /<link[^>]*rel="alternate"[^>]*hreflang="([^"]*)"/gi);
  const jsonld = todos(h, /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  const noindex = /noindex/i.test(robots || "");

  // --- titulo ---
  if (!titulo) F("sin <title>");
  else {
    if (titulo.length > 60) A(`title de ${titulo.length} caracteres (Google corta ~60)`);
    if (titulo.length < 15) A(`title de solo ${titulo.length} caracteres`);
    porTitulo.set(titulo, [...(porTitulo.get(titulo) || []), ruta]);
  }

  // --- descripcion ---
  if (!desc) F("sin meta description");
  else {
    if (desc.length > 160) A(`description de ${desc.length} caracteres (se corta a ~160)`);
    if (desc.length < 50) A(`description de solo ${desc.length} caracteres`);
    porDesc.set(desc, [...(porDesc.get(desc) || []), ruta]);
  }

  // --- canonical ---
  const esperado = SITIO + (ruta === "/" ? "/" : ruta);
  if (!canon) F("sin rel=canonical");
  else if (canon !== esperado) F(`canonical apunta a ${canon} (se esperaba ${esperado})`);

  // --- idioma ---
  const esES = ruta === "/es" || ruta.startsWith("/es/");
  if (!lang) F("sin lang en <html>");
  else if (lang !== (esES ? "es" : "en")) F(`<html lang="${lang}"> en una ruta ${esES ? "ES" : "EN"}`);

  // --- H1 ---
  if (h1.length === 0) F("sin <h1>");
  else if (h1.length > 1) F(`${h1.length} <h1> en la misma pagina`);

  // --- hreflang ---
  const LEGAL = ruta === "/privacy-policy" || ruta === "/terms";
  if (LEGAL) {
    if (alt.length) F(`emite hreflang y no tiene gemela ES (${alt.join(",")})`);
  } else {
    for (const e of ["en", "es", "x-default"])
      if (!alt.includes(e)) F(`falta hreflang="${e}"`);
  }

  // --- Open Graph ---
  for (const p of ["og:type", "og:url", "og:title", "og:description", "og:image", "og:site_name"])
    if (!prop(cabeza, p)) F(`falta ${p}`);
  const ogUrl = prop(cabeza, "og:url");
  if (ogUrl && canon && ogUrl !== canon) F(`og:url (${ogUrl}) != canonical (${canon})`);
  const ogImg = prop(cabeza, "og:image");
  if (ogImg && !/^https?:\/\//.test(ogImg)) F(`og:image no es absoluta: ${ogImg}`);
  if (!meta(cabeza, "twitter:card")) F("falta twitter:card");

  // --- iconos ---
  const iconos = todos(cabeza, /<link[^>]*rel="(icon|apple-touch-icon|manifest)"/gi);
  for (const r of ["icon", "apple-touch-icon", "manifest"])
    if (!iconos.includes(r)) F(`falta <link rel="${r}">`);

  // --- datos estructurados ---
  if (!jsonld.length) A("sin JSON-LD");
  for (const j of jsonld) {
    try { JSON.parse(j); } catch (e) { F(`JSON-LD invalido: ${e.message}`); }
  }

  // --- marcadores de borrador a la vista ---
  const pend = (h.match(/\{\{PENDIENTE/g) || []).length;
  if (pend && !noindex) F(`${pend} marcadores {{PENDIENTE}} visibles en una pagina INDEXABLE`);

  filas.push({ ruta, noindex, titulo: titulo?.length, desc: desc?.length, h1: h1.length, hreflang: alt.length, jsonld: jsonld.length, pend });
}

// --- duplicados -------------------------------------------------------------
for (const [t, rs] of porTitulo) if (rs.length > 1) fallos.push(`title duplicado en ${rs.length} rutas (${rs.slice(0,3).join(", ")}${rs.length>3?"...":""}): "${t.slice(0,60)}"`);
for (const [d, rs] of porDesc) if (rs.length > 1) fallos.push(`description duplicada en ${rs.length} rutas (${rs.slice(0,3).join(", ")}${rs.length>3?"...":""})`);

// --- ficheros de raiz -------------------------------------------------------
for (const f of ["robots.txt", "sitemap-index.xml", "favicon.ico", "favicon.svg", "apple-touch-icon.png", "site.webmanifest", "og-default.png"])
  if (!existsSync(join(DIST, f))) fallos.push(`falta /${f} en dist`);

// --- sitemap ----------------------------------------------------------------
const idx = join(DIST, "sitemap-index.xml");
if (existsSync(idx)) {
  const mapas = todos(readFileSync(idx, "utf8"), /<loc>([^<]+)<\/loc>/g);
  const urls = new Set();
  for (const m of mapas) {
    const f = join(DIST, m.split("/").pop());
    if (existsSync(f)) for (const u of todos(readFileSync(f, "utf8"), /<loc>([^<]+)<\/loc>/g)) urls.add(u.replace(/\/$/, "") || "/");
  }
  const indexables = filas.filter((f) => !f.noindex).map((f) => SITIO + (f.ruta === "/" ? "" : f.ruta));
  for (const u of indexables) if (!urls.has(u) && !urls.has(u + "/")) fallos.push(`indexable pero FUERA del sitemap: ${u}`);
  for (const f of filas.filter((x) => x.noindex)) {
    const u = SITIO + (f.ruta === "/" ? "" : f.ruta);
    if (urls.has(u)) fallos.push(`noindex pero DENTRO del sitemap: ${u}`);
  }
  console.log(`sitemap: ${urls.size} URL en ${mapas.length} fichero(s)`);
}

console.log(`\nRutas auditadas: ${filas.length}`);
console.log(`  indexables: ${filas.filter((f) => !f.noindex).length}   noindex: ${filas.filter((f) => f.noindex).length}`);
console.log(`\nFALLOS: ${fallos.length}`);
for (const f of fallos) console.log("  x " + f);
console.log(`\nAVISOS: ${avisos.length}`);
for (const a of avisos) console.log("  ! " + a);

process.exit(fallos.length ? 1 : 0);
