// Descarga de Google Fonts las caras que el sitio usa de verdad (latin y
// latin-ext) y escribe el @font-face local equivalente.
//
// Ubuntu y Open Sans son de licencia abierta (OFL/Apache), asi que auto-alojarlas
// es legitimo. Las de Typekit NO: los Terms of Use de Adobe lo prohiben, por eso
// stix-two-text se queda donde esta.
import { writeFileSync, mkdirSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const URL_GF =
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@600&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap";
const DEST_PUB = "/Users/senavia/site/public/fonts/google";
const DEST_CSS = "/Users/senavia/site/src/styles/fuentes.css";
const SUBSETS = new Set(["latin", "latin-ext"]);

const css = await (await fetch(URL_GF, { headers: { "user-agent": UA } })).text();

// Cada bloque viene precedido de un comentario con el nombre del subset.
const bloques = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
const campo = (b, k) => (b.match(new RegExp(k + ":\\s*([^;]+);")) || [])[1]?.trim();

mkdirSync(DEST_PUB, { recursive: true });
const salida = [];
let bytes = 0;

for (const [, subset, bloque] of bloques) {
  if (!SUBSETS.has(subset)) continue;
  const familia = campo(bloque, "font-family").replace(/['"]/g, "");
  const estilo = campo(bloque, "font-style");
  const peso = campo(bloque, "font-weight");
  const rango = campo(bloque, "unicode-range");
  const url = bloque.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)[1];

  const nombre = `${familia.toLowerCase().replace(/\s+/g, "-")}-${peso}${estilo === "italic" ? "i" : ""}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(`${DEST_PUB}/${nombre}`, buf);
  bytes += buf.length;

  salida.push(
    `/* ${subset} */\n@font-face {\n  font-family: "${familia}";\n  font-style: ${estilo};\n  font-weight: ${peso};\n  font-display: swap;\n  src: url("/fonts/google/${nombre}") format("woff2");\n  unicode-range: ${rango};\n}`,
  );
  console.log(`  ${nombre.padEnd(34)} ${(buf.length / 1024).toFixed(1)} KB`);
}

const cabecera = `/* FUENTES AUTO-ALOJADAS — generado, no editar a mano.
 *
 * Antes esto eran dos peticiones a dos origenes distintos en el CAMINO CRITICO:
 * fonts.googleapis.com servia el CSS (que BLOQUEA el render) y solo cuando ese
 * CSS llegaba se descubrian los .woff2, que vivian en un TERCER origen,
 * fonts.gstatic.com. Dos handshakes TLS encadenados antes de poder pintar.
 *
 * Auto-alojadas, los .woff2 salen del mismo origen que ya esta conectado y las
 * declaraciones viajan dentro del CSS del sitio: se va un origen del camino
 * critico y desaparece el salto encadenado.
 *
 * Ubuntu (OFL) y Open Sans (Apache 2.0) permiten alojarlas. stix-two-text NO se
 * toca: es de Adobe Fonts y sus Terms of Use prohiben servirla uno mismo.
 *
 * Solo latin y latin-ext: son los subsets que EN y ES necesitan. El resto de los
 * 40 ficheros que sirve Google (cirilico, griego, vietnamita) no se descargaban
 * nunca porque unicode-range ya los filtraba, asi que no se pierde nada.
 *
 * Las caras son exactamente las que el CSS pide (ver la nota de BaseLayout):
 * Ubuntu 300/400/500/700 + 400 cursiva, y Open Sans 600.
 *
 * Regenerar con tools/bajar-fuentes.mjs si alguna vez cambian.
 */\n\n`;

writeFileSync(DEST_CSS, cabecera + salida.join("\n\n") + "\n");
console.log(`\n${salida.length} caras · ${(bytes / 1024).toFixed(1)} KB en total`);
console.log(`CSS -> ${DEST_CSS}`);
