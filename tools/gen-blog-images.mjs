// Genera las 10 portadas del blog con la API de Google AI Studio.
//
//   node --env-file=.env tools/gen-blog-images.mjs --only understanding-sales-tax
//   node --env-file=.env tools/gen-blog-images.mjs               (las que falten)
//   node --env-file=.env tools/gen-blog-images.mjs --force       (regenera todo)
//
// Adaptado de senavia-corp/tools/gen-subservice-images.mjs — misma API, mismo
// esqueleto de reintentos. Dos cosas de aquel NO se traen:
//   - `sharp`: alli redimensionaba y convertia. Aqui no se toca el binario, se
//     escribe el PNG tal cual llega. Este proyecto no construye contra sharp
//     (razonado en og-default.png.ts) y meterla aunque sea en tools/ invita a
//     que alguien la suba a package.json.
//   - AVIF: alli era el formato de salida. Aqui esta prohibido — quien recorta
//     y convierte es Sanity, con fm=webp, cuando las plantillas piden la
//     imagen.
//
// Salida a public/blog/<nombre-seo>.<ext>, con el nombre y el alt que define
// SEO en blog-image-prompts.mjs. NO se sube a Sanity: adjuntar el heroImage es
// escribir en el CMS del cliente y va aparte, con autorizacion.

import { writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { PROMPTS, SEO } from "./blog-image-prompts.mjs";

const KEY = process.env.GEMINI_API_KEY;
// Hace falta un modelo que sirva 2K: el hueco mayor es el hero, 750x350 CSS, y
// a 2x son 1500 de ancho. Los *-flash-image de 1K se quedan en ~1024 y habria
// que ampliar, que es justo lo que no se quiere.
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";
const OUT = path.resolve("public/blog");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const onlySlug = val("--only"), force = flag("--force");

// --- self-check ANTES de gastar cuota -------------------------------------
// Diez slugs, diez prompts con cuerpo, diez alt en los dos idiomas. Descubrir
// que falta el septimo cuando ya se han pagado seis imagenes es el fallo que
// esto evita.
const slugs = Object.keys(PROMPTS);
const fallos = [];
if (slugs.length !== 10) fallos.push(`esperados 10 slugs, hay ${slugs.length}`);
for (const s of slugs) {
  if (typeof PROMPTS[s] !== "string" || PROMPTS[s].length < 600) fallos.push(`${s}: prompt ausente o demasiado corto`);
  if (!SEO[s]?.alt?.en?.trim() || !SEO[s]?.alt?.es?.trim()) fallos.push(`${s}: falta alt en o es`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(SEO[s]?.fichero ?? "")) fallos.push(`${s}: nombre de fichero no es un slug valido`);
  for (const [l, t] of Object.entries(SEO[s]?.alt ?? {})) {
    // 125 caracteres es donde los lectores de pantalla mas comunes cortan.
    if (t.length > 125) fallos.push(`${s}: alt ${l} de ${t.length} caracteres, pasa de 125`);
  }
}
// El prompt describe una ilustracion, pero el que manda es el bloque de
// prohibiciones: si alguien lo recorta al editar el estilo, las diez salen con
// texto o con caras y no se puede publicar ninguna.
for (const s of slugs) {
  for (const clave of ["NO text", "NO human faces", "NO charts", "NO tax forms"]) {
    if (!PROMPTS[s].includes(clave)) fallos.push(`${s}: el prompt perdio la prohibicion "${clave}"`);
  }
}
const ficheros = slugs.map((s) => SEO[s]?.fichero);
if (new Set(ficheros).size !== ficheros.length) fallos.push("hay nombres de fichero repetidos");
if (onlySlug && !slugs.includes(onlySlug)) fallos.push(`--only ${onlySlug}: no es uno de los 10 slugs`);
if (fallos.length) {
  console.error("ABORTA — self-check:\n  " + fallos.join("\n  "));
  process.exit(1);
}
if (!KEY) {
  console.error("Falta GEMINI_API_KEY.\nLos scripts de tools/ NO heredan el .env de Astro: usa `node --env-file=.env`.");
  process.exit(1);
}
console.log(`self-check OK · ${slugs.length} prompts · modelo ${MODEL}\n`);

const existe = (p) => access(p, constants.F_OK).then(() => true).catch(() => false);

async function genUna(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      // 16:9 es el compromiso entre los dos huecos, que recortan cada uno por
      // su lado. Los modelos que no entiendan imageConfig lo ignoran y
      // devuelven su formato por defecto; por eso abajo se mide lo que llega.
      imageConfig: { aspectRatio: "16:9", imageSize: "2K" },
    },
  };
  let ultimo;
  for (let intento = 1; intento <= 3; intento++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      // El formato lo elige el modelo, no nosotros: gemini-3-pro-image devuelve
      // JPEG. Da igual cual sea — estos ficheros son el master del que tira
      // Sanity, y quien recorta y convierte a WebP para el sitio es Sanity.
      if (part) return { buf: Buffer.from(part.inlineData.data, "base64"), mime: part.inlineData.mimeType };
      // Sin imagen suele ser un filtro de seguridad, y reintentar no lo cambia.
      throw new Error("respuesta sin imagen: " + JSON.stringify(json).slice(0, 300));
    }
    const txt = await res.text();
    ultimo = `HTTP ${res.status}: ${txt.slice(0, 300)}`;

    // No todos los 429 son iguales, y confundirlos cuesta minutos por imagen:
    // el de POR MINUTO se pasa esperando, el de POR DIA no se pasa hoy. Con 10
    // portadas, reintentar el diario son 2 minutos de espera para acabar igual.
    if (res.status === 429 && /PerDay/.test(txt)) {
      throw new Error(
        "cuota DIARIA del tier gratuito agotada para este modelo. No se arregla esperando:\n" +
        "     · se renueva a medianoche hora del Pacifico, o\n" +
        "     · activa facturacion en el proyecto de Google AI Studio, o\n" +
        "     · usa GEMINI_IMAGE_MODEL con otro modelo que aun tenga cuota, o una clave distinta.",
      );
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 4000 * intento));
      continue;
    }
    throw new Error(ultimo);
  }
  throw new Error("agotados los reintentos · " + ultimo);
}

/**
 * Ancho y alto leidos del propio binario, para comprobar que la imagen llego a
 * la resolucion pedida. Devuelve [0,0] si no es una imagen reconocible, que es
 * como se detecta que el modelo devolvio otra cosa.
 */
const dimensiones = (b) => {
  if (b.length > 24 && b.slice(1, 4).toString() === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: recorrer los marcadores hasta el SOF, que es quien lleva el tamano.
    for (let i = 2; i < b.length - 9 && b[i] === 0xff; i += 2 + b.readUInt16BE(i + 2)) {
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      }
    }
  }
  return [0, 0];
};

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

await mkdir(OUT, { recursive: true });
let hechas = 0, saltadas = 0, fallidas = 0;
const errores = [];

/**
 * Ya generada, sea cual sea la extension que eligio el modelo. Se busca por el
 * nombre SEO, que es el que se escribe — no por el slug del post.
 */
const yaEsta = async (slug) => {
  for (const e of Object.values(EXT)) if (await existe(path.join(OUT, `${SEO[slug].fichero}.${e}`))) return true;
  return false;
};

for (const slug of slugs) {
  if (onlySlug && slug !== onlySlug) continue;
  if (!force && await yaEsta(slug)) { saltadas++; continue; }
  try {
    process.stdout.write(`${slug} … `);
    const { buf, mime } = await genUna(PROMPTS[slug]);
    const [w, h] = dimensiones(buf);
    if (!w) throw new Error(`lo devuelto no es una imagen reconocible (mime ${mime})`);
    const destino = path.join(OUT, `${SEO[slug].fichero}.${EXT[mime] ?? "bin"}`);
    await writeFile(destino, buf);
    console.log(`OK  ${w}x${h}  ${Math.round(buf.length / 1024)}KB  ${path.basename(destino)}`);
    // El hueco mayor pide 1500 de ancho. Aviso, no error: una portada algo
    // corta se ve, y abortar aqui tiraria las que ya salieron bien.
    if (w < 1500) console.log(`   AVISO: ${w}px de ancho, por debajo de los 1500 que pide el hero a 2x`);
    hechas++;
    await new Promise((r) => setTimeout(r, 1500)); // respeta el rate limit
  } catch (e) {
    console.log("FALLO", e.message);
    fallidas++;
    errores.push(`${slug}: ${e.message}`);
  }
}

console.log(`\n${hechas} generadas · ${saltadas} ya estaban · ${fallidas} fallaron`);
if (errores.length) console.log("Fallos:\n  " + errores.join("\n  "));
process.exit(fallidas ? 1 : 0);
