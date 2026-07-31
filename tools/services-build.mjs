// Compila las 12 paginas de servicio: HTML de autor -> Portable Text, EN y ES.
//
//   node tools/services-build.mjs            compila, comprueba y escribe
//   node tools/services-build.mjs --check    solo comprueba, no escribe
//   node tools/services-build.mjs --tabla    ademas imprime la tabla antes/despues
//   node tools/services-build.mjs --autoprueba   demuestra que los asertos saltan
//
// Entra:  baseline/contenido/servicios-meta.json
//         baseline/contenido/servicios/<slug>.en.html  y  .es.html
// Sale:   baseline/contenido/servicios-en.json   (nuevo, para tools/push-en.mjs)
//         baseline/i18n/servicios-es.json        (PARCHEADO, lo consume push-i18n.mjs)
//
// Espejo de tools/blog-build.mjs. Misma ruta de conversion que uso el import de la
// FASE 2 (tools/build-import.mjs) y la misma libreria ya instalada. Escribir 12
// cuerpos de Portable Text a mano es como se cuelan las listas aplanadas y los
// markDefs huerfanos.
//
// Este fichero NO habla con Sanity. No puede: no importa ningun cliente.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";
import { schemaTypes } from "../src/sanity/schemas.mjs";

const CHECK = process.argv.includes("--check");
const TABLA = process.argv.includes("--tabla");

const META = "baseline/contenido/servicios-meta.json";
const DIR = "baseline/contenido/servicios";
const OUT_EN = "baseline/contenido/servicios-en.json";
const OUT_ES = "baseline/i18n/servicios-es.json";
const ANTES = "baseline/import/docs.json";

const compiled = Schema.compile({ name: "ams", types: schemaTypes });
const blockType = compiled.get("service").fields.find((f) => f.name === "body").type;

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * htmlToBlocks genera _key aleatorios en cada pasada. Sin esto, recompilar sin
 * cambiar una coma reescribe los dos JSON enteros y el diff de revision deja de
 * servir para nada. Las claves se derivan de (slug, idioma, indice).
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
// Medidas
// ---------------------------------------------------------------------------

const texto = (bloques) =>
  bloques.map((b) => (b.children ?? []).map((c) => c.text ?? "").join("")).join(" ");

const palabras = (bloques) => texto(bloques).split(/\s+/).filter(Boolean).length;
const encabezados = (bloques) => bloques.filter((b) => /^h[1-4]$/.test(b.style ?? "")).length;
const enlaces = (bloques) => bloques.flatMap((b) => b.markDefs ?? []).filter((d) => d._type === "link");
const aServicios = (bloques) => enlaces(bloques).filter((d) => /\/services\//.test(d.href ?? ""));

/** D3: estos terminos se quedan en ingles dentro del espanol. */
const GLOSARIO_PROHIBIDO = [
  [/\bnotarios?\b/i, "«Notary Public» NUNCA se traduce como «notario» (infraccion en Florida)"],
  // Lo prohibido es la traduccion literal de la FRASE «Notary Public» — o sea
  // «notario» y «notaría». El adjetivo «notarial» no lo es: la propia s.
  // 117.05(11) se refiere en ingles a "an advertisement for notarial services",
  // asi que «servicios notariales» es la traduccion correcta del estatuto y no
  // puede fallar la comprobacion. El patron anterior (/\bnotaria/) marcaba
  // «notarial(es)» y, a la vez, se le escapaba «notaría» por el acento.
  [/\bnotar[ií]as?\b/i, "«notaría» implica funcion notarial civil; no aplica a un Notary Public de Florida"],
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

/**
 * Regla de hecho innegociable: la firma existe desde 2019. Los 17+ anos son
 * EXPERIENCIA ACUMULADA del equipo, no antiguedad de la firma. Estas cadenas ya
 * estaban vivas en el sitio (i18n.ts:298, :615, about-us.astro:186 y el cuerpo de
 * personal-tax-preparation), asi que el aserto existe para que no vuelvan.
 */
const ANTIGUEDAD_FALSA = [
  [/\bsince 2009\b/i, "«since 2009» implica 17 años de firma; la firma es de 2019"],
  [/\bdesde 2009\b/i, "«desde 2009» implica 17 años de firma; la firma es de 2019"],
  [/\b1[5-9]\+?\s*(years|años)\s+(serving|in business|atendiendo|sirviendo)/i,
    "antigüedad de firma; lo correcto es «experiencia profesional acumulada»"],
  [/\b1[5-9]\s*(years|años)\s+(serving|in business)/i, "antigüedad de firma"],
];

/** La sede es Coral Springs. Tamarac solo puede aparecer como zona atendida. */
const SEDE_EQUIVOCADA = [
  [/\b(based|located|headquarter\w*)\s+in\s+Tamarac\b/i, "la sede es Coral Springs, no Tamarac"],
  [/\b(con sede|ubicad\w+|situad\w+)\s+en\s+Tamarac\b/i, "la sede es Coral Springs, no Tamarac"],
  [/\bserving clients in Tamarac\b/i, "el héroe decia esto; la sede es Coral Springs"],
];

// ---------------------------------------------------------------------------
// Comprobaciones
// ---------------------------------------------------------------------------

function comprueba(compilados) {
  const fallos = [];
  const avisos = [];
  const vistos = { metaTitle: new Map(), metaDescription: new Map() };

  for (const s of compilados) {
    const { slug, en, es } = s;

    // C1 — el H1 lo pone la plantilla desde `title`, y la `intro` va justo debajo.
    // Un encabezado de apertura duplica el titular y rompe la jerarquia.
    for (const [lang, body] of [["EN", en.body], ["ES", es.bodyEs]]) {
      if (/^h[1-4]$/.test(body[0]?.style ?? "")) {
        fallos.push(`${slug}: ${lang} abre con encabezado; debe abrir con parrafo`);
      }
      if (body.some((b) => b.style === "h1")) fallos.push(`${slug}: ${lang} usa h1 en el cuerpo`);
    }

    // C2 — estructura real, no plantilla vacia (criterio 1).
    if (encabezados(en.body) < 3) fallos.push(`${slug}: EN con ${encabezados(en.body)} encabezado(s), min 3`);
    if (encabezados(es.bodyEs) < 3) fallos.push(`${slug}: ES con ${encabezados(es.bodyEs)} encabezado(s), min 3`);

    // C3 — cada servicio conduce a otro servicio, en los dos idiomas.
    if (!aServicios(en.body).length) fallos.push(`${slug}: EN sin enlace a /services/`);
    if (!aServicios(es.bodyEs).length) fallos.push(`${slug}: ES sin enlace a /services/`);

    // C4 — meta dentro de limite y unicas entre si (criterio 2).
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
    if (!es.metaTitleEs) fallos.push(`${slug}: falta metaTitleEs`);
    else if (es.metaTitleEs.length > 60) fallos.push(`${slug}: metaTitleEs ${es.metaTitleEs.length} car.`);
    if (!es.metaDescriptionEs) fallos.push(`${slug}: falta metaDescriptionEs`);
    else if (es.metaDescriptionEs.length > 155) fallos.push(`${slug}: metaDescriptionEs ${es.metaDescriptionEs.length} car.`);

    // C5 — la intro se pinta bajo el H1 Y se usa de meta description si falta.
    // Tiene que funcionar en los dos sitios: una frase que venda y ubique.
    for (const [lang, v] of [["EN", en.intro], ["ES", es.introEs]]) {
      if (!v || !v.trim()) fallos.push(`${slug}: ${lang} sin intro`);
      else if (v.length > 200) fallos.push(`${slug}: intro ${lang} ${v.length} car. (max 200)`);
      else if (v.split(/\s+/).length < 12) avisos.push(`${slug}: intro ${lang} de ${v.split(/\s+/).length} palabras — corta`);
      if (v && v !== v.trim()) fallos.push(`${slug}: intro ${lang} con espacio sobrante`);
      if (v && /\s{2,}/.test(v)) fallos.push(`${slug}: intro ${lang} con espacio doble`);
    }
    for (const [lang, v] of [["EN", en.title], ["ES", es.titleEs]]) {
      if (!v || !v.trim()) fallos.push(`${slug}: ${lang} sin title`);
      else if (v !== v.trim()) fallos.push(`${slug}: title ${lang} con espacio sobrante`);
      // `title` alimenta el H1 Y la etiqueta del nav/sidebar: pasado de largo, rompe el menu.
      else if (v.length > 42) avisos.push(`${slug}: title ${lang} de ${v.length} car. — el nav se resiente`);
    }

    // C6 — glosario D3 y calcos, sobre TODO el texto en espanol.
    const todoEs = [es.titleEs, es.introEs, es.metaTitleEs, es.metaDescriptionEs, texto(es.bodyEs)]
      .filter(Boolean).join(" ");
    for (const [re, porque] of GLOSARIO_PROHIBIDO) if (re.test(todoEs)) fallos.push(`${slug}: ES — ${porque}`);
    for (const [re, porque] of CALCOS) if (re.test(todoEs)) fallos.push(`${slug}: ES — ${porque}`);

    // C7 — reglas de hecho, sobre los DOS idiomas (criterio 5).
    const todo = [en.title, en.intro, en.metaTitle, en.metaDescription, texto(en.body), todoEs]
      .filter(Boolean).join(" ");
    for (const [re, porque] of ANTIGUEDAD_FALSA) if (re.test(todo)) fallos.push(`${slug}: ${porque}`);
    for (const [re, porque] of SEDE_EQUIVOCADA) if (re.test(todo)) fallos.push(`${slug}: ${porque}`);

    // C8 — banda de longitud justificada en la FASE 0 (copy-investigacion.md §5).
    // Aviso y no fallo: la longitud la fija la consulta, no la regla. Pero salirse
    // es una decision que hay que tomar mirandola, no por descuido al redactar.
    const pEn = palabras(en.body);
    if (pEn < 550 || pEn > 900) avisos.push(`${slug}: EN ${pEn} palabras — fuera de la banda 550-900`);

    // C9 — desequilibrio grande entre idiomas = medio traducido.
    const r = palabras(es.bodyEs) / Math.max(1, palabras(en.body));
    if (r < 0.8 || r > 1.45) avisos.push(`${slug}: ES/EN = ${r.toFixed(2)} en palabras — revisar`);
  }
  return { fallos, avisos };
}

// ---------------------------------------------------------------------------
// Autoprueba: un aserto que nunca se ha visto fallar no es un aserto.
// ---------------------------------------------------------------------------

const CUERPO_EN = '<p>uno</p><h2>a</h2><p>ver <a href="/services/x">x</a></p><h2>b</h2><h3>c</h3>';
const CUERPO_ES = '<p>uno</p><h2>a</h2><p>ver <a href="/es/services/x">x</a></p><h2>b</h2><h3>c</h3>';

if (process.argv.includes("--autoprueba")) {
  const base = (extra = {}) => ({
    slug: "demo",
    en: {
      title: "T", intro: "Una intro de al menos doce palabras para que no salte el aviso corto.",
      metaTitle: "M", metaDescription: "D", body: aBloques(CUERPO_EN, "d.en"),
    },
    es: {
      titleEs: "T", introEs: "Una intro de al menos doce palabras para que no salte el aviso corto.",
      metaTitleEs: "M", metaDescriptionEs: "D", bodyEs: aBloques(CUERPO_ES, "d.es"),
    },
    ...extra,
  });
  const con = (f) => { const p = base(); f(p); return p; };
  const casos = [
    ["control: un servicio correcto NO falla", base(), null],
    ["ES sin enlace a servicio", con((p) => { p.es.bodyEs = aBloques("<p>uno</p><h2>a</h2><p>sin</p><h2>b</h2><h3>c</h3>", "z"); }), /sin enlace a \/services\//],
    ["metaTitle de 61 caracteres", con((p) => { p.en.metaTitle = "x".repeat(61); }), /metaTitle 61 car/],
    ["metaDescription de 156", con((p) => { p.en.metaDescription = "x".repeat(156); }), /metaDescription 156 car/],
    ["«notario» en el espanol", con((p) => { p.es.introEs = "servicios de notario para usted"; }), /NUNCA se traduce como «notario»/],
    ["«archivar su declaracion»", con((p) => { p.es.introEs = "archivar su declaracion de renta"; }), /es «presentar», no «archivar»/],
    ["cuerpo que abre con encabezado", con((p) => { p.en.body = aBloques('<h2>T</h2><p><a href="/services/x">x</a></p><h2>b</h2><h3>c</h3>', "y"); }), /abre con encabezado/],
    ["solo dos encabezados", con((p) => { p.en.body = aBloques('<p>uno</p><h2>a</h2><p><a href="/services/x">x</a></p><h2>b</h2>', "w"); }), /encabezado\(s\), min 3/],
    ["«since 2009» en ingles", con((p) => { p.en.intro = "Serving clients since 2009 with care and attention every year."; }), /implica 17 años de firma/],
    ["«15+ years serving» en ingles", con((p) => { p.en.metaDescription = "15+ Years Serving U.S. and International Clients"; }), /antigüedad de firma/],
    ["«desde 2009» en espanol", con((p) => { p.es.introEs = "Le acompañamos desde 2009 en todos sus trámites fiscales cada año."; }), /implica 17 años de firma/],
    ["sede en Tamarac", con((p) => { p.en.intro = "We are based in Tamarac and we help you file on time every single year."; }), /la sede es Coral Springs/],
    ["intro con espacio doble", con((p) => { p.en.intro = "Track  and manage your business finances with expert support today."; }), /espacio doble/],
    ["sin intro", con((p) => { p.es.introEs = ""; }), /ES sin intro/],
  ];
  let malos = 0;
  for (const [nombre, entrada, esperado] of casos) {
    const { fallos } = comprueba([entrada]);
    const encaja = esperado ? fallos.some((f) => esperado.test(f)) : fallos.length === 0;
    console.log(`  ${encaja ? "OK " : "MAL"} ${nombre}${encaja ? "" : ` -> ${JSON.stringify(fallos)}`}`);
    if (!encaja) malos++;
  }
  // Dos metas identicas entre servicios distintos: solo se ve mirando el conjunto.
  const dup = comprueba([{ ...base(), slug: "a" }, { ...base(), slug: "b" }]).fallos;
  const okDup = dup.some((f) => /metaTitle identico al de a/.test(f));
  console.log(`  ${okDup ? "OK " : "MAL"} dos servicios con la misma metaTitle`);
  if (!okDup) malos++;
  console.log(malos ? `\nautoprueba: ${malos} fallo(s)` : `\nautoprueba: ${casos.length + 1}/${casos.length + 1} correctos`);
  process.exit(malos ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Compilacion
// ---------------------------------------------------------------------------

const meta = JSON.parse(readFileSync(META, "utf8"));
const slugs = Object.keys(meta).filter((k) => !k.startsWith("_"));

// El fichero ES ya existe y esta keyed por `service.<_id>`; el slug de dentro es
// la huella de identidad. De ahi sale el mapa slug -> _id, sin hablar con Sanity.
const esJson = JSON.parse(readFileSync(OUT_ES, "utf8"));
const idDeSlug = new Map(Object.entries(esJson).map(([id, e]) => [e.slug, id]));

const compilados = [];
for (const slug of slugs) {
  const fEn = `${DIR}/${slug}.en.html`;
  const fEs = `${DIR}/${slug}.es.html`;
  if (!existsSync(fEn) || !existsSync(fEs)) {
    throw new Error(`${slug}: falta ${!existsSync(fEn) ? fEn : fEs}`);
  }
  const id = idDeSlug.get(slug);
  if (!id) throw new Error(`${slug}: no existe en ${OUT_ES}; el slug no coincide con el dataset`);
  const m = meta[slug];
  compilados.push({
    slug,
    id,
    en: {
      title: m.title, intro: m.intro,
      metaTitle: m.metaTitle, metaDescription: m.metaDescription,
      body: aBloques(readFileSync(fEn, "utf8"), `${slug}.en`),
    },
    es: {
      titleEs: m.titleEs, introEs: m.introEs,
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
console.log(`comprobado: ${compilados.length} servicio(s) sin fallos`);

if (compilados.length < 12) {
  console.log(`\nPARCIAL: ${compilados.length}/12 redactado(s). Los ${12 - compilados.length} restantes`);
  console.log(`         conservan su contenido actual en ${OUT_ES} y en Sanity.`);
}

if (CHECK) {
  console.log("\n--check: no se escribe nada");
} else {
  // EN: fichero espejo, keyed igual que servicios-es.json.
  const enJson = existsSync(OUT_EN) ? JSON.parse(readFileSync(OUT_EN, "utf8")) : {};
  for (const s of compilados) enJson[s.id] = { slug: s.slug, ...s.en };
  writeFileSync(OUT_EN, JSON.stringify(enJson, null, 2) + "\n");

  // ES: se PARCHEA el fichero que ya existe, para no perder los servicios que aun
  // no se han redactado.
  for (const s of compilados) esJson[s.id] = { ...esJson[s.id], slug: s.slug, ...s.es };
  writeFileSync(OUT_ES, JSON.stringify(esJson, null, 2) + "\n");

  console.log(`\nescrito ${OUT_EN}  (${Object.keys(enJson).length} servicio[s])`);
  console.log(`escrito ${OUT_ES}  (${Object.keys(esJson).length} servicio[s], ${compilados.length} actualizado[s])`);
}

// ---------------------------------------------------------------------------
// Tabla antes/despues (criterio 14). El "antes" sale de baseline/import/docs.json,
// que es la carga exacta que hoy vive en Sanity.
// ---------------------------------------------------------------------------

if (TABLA) {
  const docs = JSON.parse(readFileSync(ANTES, "utf8"))
    .filter((d) => d._type === "service");
  const antesDe = (slug) => {
    const d = docs.find((x) => (x.slug?.current ?? x.slug) === slug);
    if (!d) return { palabras: 0, encabezados: 0, servicios: 0, meta: "no" };
    return {
      palabras: palabras(d.body ?? []),
      encabezados: encabezados(d.body ?? []),
      servicios: aServicios(d.body ?? []).length,
      meta: (d.metaDescription ?? "").trim() ? "si" : "no",
    };
  };

  const fila = (c) => {
    const a = antesDe(c.slug);
    return [
      c.slug.slice(0, 42).padEnd(42),
      String(a.palabras).padStart(5), "->", String(palabras(c.en.body)).padStart(5),
      String(palabras(c.es.bodyEs)).padStart(6),
      String(a.encabezados).padStart(3), "->", String(encabezados(c.en.body)).padStart(3),
      String(a.servicios).padStart(3), "->", String(aServicios(c.en.body).length).padStart(3),
      `  ${a.meta.padEnd(2)}-> si`,
    ].join(" ");
  };
  const linea = "=".repeat(104);
  console.log("\n" + linea);
  console.log("ANTES / DESPUES" + (compilados.length < 12 ? `  (solo los ${compilados.length} redactado[s])` : ""));
  console.log(linea);
  console.log(
    `${"slug".padEnd(42)} ${"palEN".padStart(5)}     ${"nuevo".padStart(5)} ${"palES".padStart(6)} ` +
    `${"enc".padStart(3)}    ${"nue".padStart(3)} ${"srv".padStart(3)}    ${"nue".padStart(3)}   meta`,
  );
  for (const c of compilados) console.log(fila(c));
  const suma = (f) => compilados.reduce((n, c) => n + f(c), 0);
  console.log("-".repeat(104));
  console.log(
    `${"TOTAL".padEnd(42)} ${String(suma((c) => antesDe(c.slug).palabras)).padStart(5)} -> ` +
    `${String(suma((c) => palabras(c.en.body))).padStart(5)} ${String(suma((c) => palabras(c.es.bodyEs))).padStart(6)}`,
  );

  console.log("\nKeyword objetivo por pagina (HIPOTESIS — no hay dato de GSC, ver copy-investigacion.md §1)");
  for (const c of compilados) {
    const kw = meta[c.slug].keyword ?? "(sin fijar)";
    console.log(`  ${c.slug.slice(0, 42).padEnd(42)} ${kw}`);
  }
}
