// Compila el blog: HTML de autor -> Portable Text, en los dos idiomas.
//
//   node tools/blog-build.mjs            compila, comprueba y escribe
//   node tools/blog-build.mjs --check    solo comprueba, no escribe
//   node tools/blog-build.mjs --tabla    ademas imprime la tabla antes/despues
//
// Entra:  baseline/contenido/meta.json
//         baseline/contenido/posts/<slug>.en.html  y  .es.html
// Sale:   baseline/contenido/posts-en.json         (nuevo, para tools/push-en.mjs)
//         baseline/i18n/posts-es.json              (PARCHEADO, lo consume push-i18n.mjs)
//
// Por que se escribe en HTML y no en Portable Text a mano: es la MISMA ruta de
// conversion que uso el import de la FASE 2 (tools/build-import.mjs), con la
// misma libreria ya instalada. Escribir 20 cuerpos de Portable Text a mano es
// como se cuelan las listas aplanadas y los markDefs huerfanos.
//
// Este fichero NO habla con Sanity. No puede: no importa ningun cliente.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";
import { schemaTypes } from "../src/sanity/schemas.mjs";

const CHECK = process.argv.includes("--check");
const TABLA = process.argv.includes("--tabla");

const META = "baseline/contenido/meta.json";
const DIR = "baseline/contenido/posts";
const OUT_EN = "baseline/contenido/posts-en.json";
const OUT_ES = "baseline/i18n/posts-es.json";

const compiled = Schema.compile({ name: "ams", types: schemaTypes });
const blockType = compiled.get("post").fields.find((f) => f.name === "body").type;

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * htmlToBlocks genera _key aleatorios en cada pasada. Sin esto, recompilar sin
 * cambiar una coma reescribe los dos JSON enteros y el diff de revision deja de
 * servir para nada. Las claves se derivan de (slug, idioma, indice), asi que la
 * misma entrada da siempre la misma salida.
 */
const clavesDeterministas = (bloques, semilla) =>
  bloques.map((b, i) => {
    const k = (s) => createHash("sha256").update(`${semilla}:${s}`).digest("hex").slice(0, 12);
    const markDefs = (b.markDefs ?? []).map((d, j) => ({ ...d, _key: k(`${i}.def.${j}`) }));
    const viejoANuevo = new Map((b.markDefs ?? []).map((d, j) => [d._key, k(`${i}.def.${j}`)]));
    return {
      ...b,
      _key: k(`${i}`),
      markDefs,
      children: (b.children ?? []).map((c, j) => ({
        ...c,
        _key: k(`${i}.${j}`),
        marks: (c.marks ?? []).map((m) => viejoANuevo.get(m) ?? m),
      })),
    };
  });

const aBloques = (html, semilla) => {
  const bloques = htmlToBlocks(html.trim(), blockType, {
    parseHtml: (h) => new JSDOM(h).window.document,
  }).filter((b) => b._type !== "block" || (b.children ?? []).some((c) => (c.text ?? "").trim()));
  return clavesDeterministas(bloques, semilla);
};

// ---------------------------------------------------------------------------
// Medidas y comprobaciones
// ---------------------------------------------------------------------------

const texto = (bloques) =>
  bloques.map((b) => (b.children ?? []).map((c) => c.text ?? "").join("")).join(" ");

const palabras = (bloques) => texto(bloques).split(/\s+/).filter(Boolean).length;
const encabezados = (bloques) => bloques.filter((b) => /^h[1-4]$/.test(b.style ?? "")).length;
const itemsLista = (bloques) => bloques.filter((b) => b.listItem).length;
const enlaces = (bloques) => bloques.flatMap((b) => b.markDefs ?? []).filter((d) => d._type === "link");
const aServicios = (bloques) => enlaces(bloques).filter((d) => /\/services\//.test(d.href ?? ""));

/** D3: estos terminos se quedan en ingles dentro del espanol. */
const GLOSARIO_PROHIBIDO = [
  [/\bnotarios?\b/i, "«Notary Public» NUNCA se traduce como «notario» (infraccion en Florida)"],
  [/\bnotaria/i, "«notaría» implica funcion notarial civil; no aplica a un Notary Public de Florida"],
  [/\bagente inscrito\b/i, "«Enrolled Agent» no se traduce: seria una credencial falsa"],
  [/\bagente registrado\b/i, "«Enrolled Agent» no se traduce: seria una credencial falsa"],
  [/\bcontador publico certificado\b/i, "«CPA» no se traduce"],
  [/\bimpuesto sobre las ventas\b/i, "«Sales Tax» se mantiene en ingles (D3)"],
  [/\bservicio de rentas internas\b/i, "«IRS» no se traduce"],
];

/** Calcos frecuentes que delatan traduccion automatica en contexto fiscal. */
const CALCOS = [
  [/\barchivar (su|la|una|las|los) declaraci/i, "«file a return» es «presentar», no «archivar»"],
  [/\bretorno de impuestos?\b/i, "«tax return» es «declaración», no «retorno»"],
  [/\baplicaci[oó]n para (el|un) (ITIN|EIN)\b/i, "«application» es «solicitud», no «aplicación»"],
];

function comprueba(compilados) {
  const fallos = [];
  const avisos = [];
  const vistos = { metaTitle: new Map(), metaDescription: new Map() };

  for (const p of compilados) {
    const { slug, en, es } = p;

    // C3 — cada post conduce a por lo menos un servicio, en los dos idiomas.
    if (!aServicios(en.body).length) fallos.push(`${slug}: EN sin enlace a /services/`);
    if (!aServicios(es.bodyEs).length) fallos.push(`${slug}: ES sin enlace a /services/`);

    // C4 — meta EN dentro de limite y unicas entre si.
    if (!en.metaTitle) fallos.push(`${slug}: falta metaTitle`);
    else if (en.metaTitle.length > 60) fallos.push(`${slug}: metaTitle ${en.metaTitle.length} car. (max 60)`);
    if (!en.metaDescription) fallos.push(`${slug}: falta metaDescription`);
    else if (en.metaDescription.length > 155) fallos.push(`${slug}: metaDescription ${en.metaDescription.length} car. (max 155)`);
    for (const campo of ["metaTitle", "metaDescription"]) {
      const v = en[campo];
      if (!v) continue;
      if (vistos[campo].has(v)) fallos.push(`${slug}: ${campo} identico al de ${vistos[campo].get(v)}`);
      else vistos[campo].set(v, slug);
    }
    // El esquema valida metaDescriptionEs a 160; el limite propio sigue siendo 155.
    if (es.metaTitleEs && es.metaTitleEs.length > 60) fallos.push(`${slug}: metaTitleEs ${es.metaTitleEs.length} car.`);
    if (es.metaDescriptionEs && es.metaDescriptionEs.length > 155) fallos.push(`${slug}: metaDescriptionEs ${es.metaDescriptionEs.length} car.`);

    // C7 — glosario D3 intacto y sin calcos, sobre TODO el texto en espanol.
    const todoEs = [es.titleEs, es.excerptEs, es.metaTitleEs, es.metaDescriptionEs, texto(es.bodyEs)]
      .filter(Boolean).join(" ");
    for (const [re, porque] of GLOSARIO_PROHIBIDO) if (re.test(todoEs)) fallos.push(`${slug}: ES — ${porque}`);
    for (const [re, porque] of CALCOS) if (re.test(todoEs)) fallos.push(`${slug}: ES — ${porque}`);

    // El H1 lo pone la plantilla desde `title`. Un h1/h2 de apertura que repita
    // el titular es el artefacto del import que estos cuerpos vienen a quitar.
    for (const [lang, body] of [["EN", en.body], ["ES", es.bodyEs]]) {
      if (/^h[12]$/.test(body[0]?.style ?? "")) fallos.push(`${slug}: ${lang} abre con encabezado; debe abrir con parrafo`);
    }

    // Estructura minima exigida por el criterio 1.
    if (encabezados(en.body) < 2) fallos.push(`${slug}: EN con ${encabezados(en.body)} encabezado(s)`);
    if (encabezados(es.bodyEs) < 2) fallos.push(`${slug}: ES con ${encabezados(es.bodyEs)} encabezado(s)`);

    // Desequilibrio grande entre idiomas = a alguien se le quedo medio traducido.
    const r = palabras(es.bodyEs) / Math.max(1, palabras(en.body));
    if (r < 0.8 || r > 1.45) avisos.push(`${slug}: ES/EN = ${r.toFixed(2)} en palabras — revisar`);
  }
  return { fallos, avisos };
}

// ---------------------------------------------------------------------------
// Autoprueba: un aserto que nunca se ha visto fallar no es un aserto.
// ---------------------------------------------------------------------------

if (process.argv.includes("--autoprueba")) {
  const base = (extra = {}) => ({
    slug: "demo",
    en: {
      title: "T", excerpt: "E", metaTitle: "M", metaDescription: "D",
      body: aBloques('<p>uno</p><h2>a</h2><p>ver <a href="/services/x">x</a></p><h2>b</h2>', "d.en"),
    },
    es: {
      titleEs: "T", excerptEs: "E", metaTitleEs: "M", metaDescriptionEs: "D",
      bodyEs: aBloques('<p>uno</p><h2>a</h2><p>ver <a href="/es/services/x">x</a></p><h2>b</h2>', "d.es"),
    },
    ...extra,
  });
  const casos = [
    ["control: un post correcto NO falla", base(), null],
    ["ES sin enlace a servicio", (() => { const p = base(); p.es.bodyEs = aBloques("<p>uno</p><h2>a</h2><p>sin enlace</p><h2>b</h2>", "z"); return p; })(), /sin enlace a \/services\//],
    ["metaTitle de 61 caracteres", base({ en: { ...base().en, metaTitle: "x".repeat(61) } }), /metaTitle 61 car/],
    ["«notario» en el espanol", (() => { const p = base(); p.es.excerptEs = "servicios de notario"; return p; })(), /NUNCA se traduce como «notario»/],
    ["«archivar su declaracion»", (() => { const p = base(); p.es.excerptEs = "archivar su declaracion de renta"; return p; })(), /es «presentar», no «archivar»/],
    ["cuerpo que abre con encabezado", (() => { const p = base(); p.en.body = aBloques('<h2>Titular</h2><p>ver <a href="/services/x">x</a></p><h2>b</h2>', "y"); return p; })(), /abre con encabezado/],
  ];
  let malos = 0;
  for (const [nombre, entrada, esperado] of casos) {
    const { fallos } = comprueba([entrada]);
    const encaja = esperado ? fallos.some((f) => esperado.test(f)) : fallos.length === 0;
    console.log(`  ${encaja ? "OK " : "MAL"} ${nombre}${encaja ? "" : ` -> ${JSON.stringify(fallos)}`}`);
    if (!encaja) malos++;
  }
  // Dos metas identicas entre posts distintos: solo se ve mirando el conjunto.
  const dup = comprueba([{ ...base(), slug: "a" }, { ...base(), slug: "b" }]).fallos;
  const okDup = dup.some((f) => /metaTitle identico al de a/.test(f));
  console.log(`  ${okDup ? "OK " : "MAL"} dos posts con la misma metaTitle`);
  if (!okDup) malos++;
  console.log(malos ? `\nautoprueba: ${malos} fallo(s)` : "\nautoprueba: 7/7 correctos");
  process.exit(malos ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Compilacion
// ---------------------------------------------------------------------------

const meta = JSON.parse(readFileSync(META, "utf8"));
const slugs = Object.keys(meta).filter((k) => !k.startsWith("_"));

const escritos = new Set(
  readdirSync(DIR).filter((f) => f.endsWith(".en.html")).map((f) => f.replace(/\.en\.html$/, "")),
);

const compilados = [];
for (const slug of slugs) {
  const fEn = `${DIR}/${slug}.en.html`;
  const fEs = `${DIR}/${slug}.es.html`;
  if (!existsSync(fEn) || !existsSync(fEs)) {
    throw new Error(`${slug}: falta ${!existsSync(fEn) ? fEn : fEs}`);
  }
  const m = meta[slug];
  compilados.push({
    slug,
    en: {
      title: m.title, excerpt: m.excerpt,
      metaTitle: m.metaTitle, metaDescription: m.metaDescription,
      body: aBloques(readFileSync(fEn, "utf8"), `${slug}.en`),
    },
    es: {
      titleEs: m.titleEs, excerptEs: m.excerptEs,
      metaTitleEs: m.metaTitleEs, metaDescriptionEs: m.metaDescriptionEs,
      bodyEs: aBloques(readFileSync(fEs, "utf8"), `${slug}.es`),
    },
  });
}

const { fallos, avisos } = comprueba(compilados);
for (const a of avisos) console.log(`  aviso  ${a}`);
if (fallos.length) {
  console.error("\nCOMPROBACION FALLIDA:");
  for (const f of fallos) console.error("  " + f);
  process.exit(1);
}
console.log(`comprobado: ${compilados.length} post(s) sin fallos`);

// Los 10 solo se exigen cuando estan los 10: la FASE 1 compila uno solo.
const esJson = JSON.parse(readFileSync(OUT_ES, "utf8"));
const totalEs = Object.keys(esJson).length;
if (compilados.length < 10) {
  console.log(`\nPARCIAL: ${compilados.length}/10 escritos. Los ${10 - compilados.length} restantes`);
  console.log(`         conservan su contenido actual en ${OUT_ES}.`);
}

if (CHECK) {
  console.log("\n--check: no se escribe nada");
} else {
  // EN: fichero espejo, con la misma forma que posts-es.json.
  const enJson = existsSync(OUT_EN) ? JSON.parse(readFileSync(OUT_EN, "utf8")) : {};
  for (const p of compilados) enJson[`post.${p.slug}`] = { slug: p.slug, ...p.en };
  writeFileSync(OUT_EN, JSON.stringify(enJson, null, 2) + "\n");

  // ES: se PARCHEA el fichero que ya existe. No se reescribe entero, para no
  // perder los posts que aun no se han redactado.
  for (const p of compilados) {
    const id = `post.${p.slug}`;
    if (!esJson[id]) throw new Error(`${id} no existe en ${OUT_ES}; el slug no coincide con el dataset`);
    esJson[id] = { ...esJson[id], slug: p.slug, ...p.es };
  }
  writeFileSync(OUT_ES, JSON.stringify(esJson, null, 2) + "\n");

  console.log(`\nescrito ${OUT_EN}  (${Object.keys(enJson).length} post[s])`);
  console.log(`escrito ${OUT_ES}  (${totalEs} post[s], ${compilados.length} actualizado[s])`);
}

// ---------------------------------------------------------------------------
// Tabla antes/despues (criterio 12). El "antes" sale del crawl de produccion,
// que es la unica foto fiel del contenido migrado.
// ---------------------------------------------------------------------------

if (TABLA) {
  const antesDe = (slug) => {
    const d = JSON.parse(readFileSync(`baseline/posts/${slug}.json`, "utf8"));
    const html = d.bodyHtml ?? "";
    const plano = html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
    return {
      palabras: plano.split(/\s+/).filter(Boolean).length,
      encabezados: (html.match(/<h[1-4]\b/g) ?? []).length,
      enlaces: (html.match(/<a\s/g) ?? []).length,
      meta: (d.metaDescription ?? "").trim() ? "si" : "no",
    };
  };

  const esAntes = JSON.parse(readFileSync("baseline/posts/understanding-sales-tax.json", "utf8")) && null;
  const fila = (c) => {
    const a = antesDe(c.slug);
    return [
      c.slug.padEnd(36),
      String(a.palabras).padStart(5), "->", String(palabras(c.en.body)).padStart(5),
      String(palabras(c.es.bodyEs)).padStart(6),
      String(a.encabezados).padStart(4), "->", String(encabezados(c.en.body)).padStart(3),
      String(a.enlaces).padStart(4), "->", String(aServicios(c.en.body).length).padStart(3),
      `  ${a.meta.padEnd(3)}-> si`,
    ].join(" ");
  };
  console.log("\n" + "=".repeat(96));
  console.log("ANTES / DESPUES" + (compilados.length < 10 ? `  (solo los ${compilados.length} redactado[s])` : ""));
  console.log("=".repeat(96));
  console.log(`${"slug".padEnd(36)} ${"palEN".padStart(5)}     ${"nuevo".padStart(5)} ${"palES".padStart(6)} ${"enc".padStart(4)}    ${"nue".padStart(3)} ${"enl".padStart(4)}    ${"srv".padStart(3)}   meta`);
  for (const c of compilados) console.log(fila(c));
  const sumaAntes = compilados.reduce((n, c) => n + antesDe(c.slug).palabras, 0);
  const sumaEn = compilados.reduce((n, c) => n + palabras(c.en.body), 0);
  const sumaEs = compilados.reduce((n, c) => n + palabras(c.es.bodyEs), 0);
  console.log("-".repeat(96));
  console.log(`${"TOTAL".padEnd(36)} ${String(sumaAntes).padStart(5)} -> ${String(sumaEn).padStart(5)} ${String(sumaEs).padStart(6)}`);
  void esAntes;
}
