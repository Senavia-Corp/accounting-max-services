// Genera el juego de iconos del sitio a partir del logo OFICIAL de Sanity.
//
// EL PROBLEMA QUE RESUELVE: public/favicon.svg era el logo de Astro (el que trae
// `npm create astro`) y public/favicon.ico un PNG de 32x32 del mismo. Ademas el
// <head> no emitia NI UN <link rel="icon">, asi que el navegador caia al
// /favicon.ico por convencion y pintaba el cohete de Astro en la pestana, en
// los favoritos y en los resultados de Google.
//
// QUE SE DIBUJA Y POR QUE NO ES EL LOGO ENTERO: el logo oficial son tres grupos
//   [0] el simbolo (6 trazos, los tres verdes de marca)
//   [1] las letras "AMS" (3 trazos)
//   [2] el texto pequeno, "Accounting Max Services, Inc." e "IRS - Enrolled
//       Agent" (43 trazos)
// A 16 o 32 pixeles el grupo [2] no se lee: se convierte en una banda de barro
// gris que ensucia la marca. Se usan [0] y [1]. No es inventarse un logo: es el
// recorte del logo oficial, que es lo que se hace en cualquier favicon.
//
// DOS FORMAS DISTINTAS A PROPOSITO:
//   - favicon.svg / favicon.ico -> CIRCULO navy sobre transparente. Es la marca
//     tal y como aparece en el cromo del sitio (.brand es un circulo navy).
//   - apple-touch-icon y los iconos del manifest -> CUADRADO navy completo. iOS
//     y Android aplican su propia mascara redondeada; meterles un circulo ya
//     recortado da un doble redondeo y margenes feos.
//
// TAMANOS: Google pide que el favicon sea un cuadrado multiplo de 48px, por eso
// el .ico lleva 16/32/48 y no solo 16/32.
//
// Uso:  node tools/generar-favicon.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const DEST = "/Users/senavia/site/public";
const NAVY = "#243137"; // --bllue del CSS portado
const PROY = "https://ep5i6co1.apicdn.sanity.io/v2024-01-01/data/query/production";

// El logo se pide por originalFilename, igual que hacen Nav.astro y Footer.astro:
// asi esto sigue funcionando si Sanity le cambia el hash a la URL.
const consulta = `*[_type=="sanity.imageAsset" && originalFilename=="678077e42e9acb0cea7a50aa-logo-white.svg"][0]{url}`;
const { result } = await (await fetch(`${PROY}?query=${encodeURIComponent(consulta)}`)).json();
if (!result?.url) throw new Error("No esta en Sanity el logo blanco (logo-white.svg).");
const svg = await (await fetch(result.url)).text();

// --- extraer la marca -------------------------------------------------------
// El SVG trae las tintas en un <style> con clases .st0...st3. Se pasan a
// atributos `fill` en linea: hay renderizadores de favicon (y el propio pipeline
// de sharp/resvg) que no aplican CSS de un <style> embebido.
const fills = {};
for (const m of svg.matchAll(/\.(st\d)\s*\{\s*fill:\s*([^;}]+)/g)) fills[m[1]] = m[2].trim();

const grupos = [];
let prof = 0, ini = null;
for (const m of svg.matchAll(/<g\b|<\/g>/g)) {
  if (m[0] === "<g") { if (prof === 0) ini = m.index; prof++; }
  else { prof--; if (prof === 0) grupos.push(svg.slice(ini, m.index + 4)); }
}
if (grupos.length < 2) throw new Error(`El logo trae ${grupos.length} grupos; se esperaban 3.`);

const enLinea = (s) => s.replace(/class="(st\d)"/g, (_, c) => `fill="${fills[c]}" fill-rule="evenodd"`);

// DOS VARIANTES, y el motivo es que se vieron las dos ampliadas a 16, 32 y 48:
//   - `marca`   = simbolo + letras "AMS". Se lee a partir de 32px.
//   - `simbolo` = solo el simbolo verde. A 16px las letras se convierten en una
//     mancha gris ilegible, asi que ahi se cae a la forma sola, que si se
//     reconoce. Es la tecnica de siempre del favicon: menos detalle cuanto mas
//     pequeno, no un logo distinto.
// Los dos grupos comparten caja (las letras van ESCRITAS SOBRE el simbolo), asi
// que las dos variantes centran igual y no hace falta medir dos veces.
const marca = enLinea(grupos[0] + grupos[1]);
const simbolo = enLinea(grupos[0]);

// Caja real de la marca dentro del viewBox 150x121.7 del logo, medida con
// sharp().trim() sobre un render de 10x y guardada aqui como constante para que
// el resultado sea identico en cualquier maquina.
const M = { w: 149.9, h: 108.4 };

/** `contenido` centrado en un lienzo cuadrado de `lado`, ocupando `frac` de ancho. */
const componer = (lado, frac, fondo, contenido) => {
  const w = lado * frac;
  const h = (w * M.h) / M.w;
  const k = w / M.w;
  const x = (lado - w) / 2;
  const y = (lado - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}">
${fondo}
<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})">${contenido}</g>
</svg>`;
};

const CIRCULO = (l) => `<circle cx="${l / 2}" cy="${l / 2}" r="${l / 2}" fill="${NAVY}"/>`;
const CUADRADO = (l) => `<rect width="${l}" height="${l}" fill="${NAVY}"/>`;

// 0.78 dentro del circulo. Se probo 0.64 y la marca quedaba pequena y perdida;
// por encima de 0.80 las puntas del simbolo tocan el borde al recortar.
const circ = componer(512, 0.78, CIRCULO(512), marca);
const circMini = componer(512, 0.6, CIRCULO(512), simbolo);
const cuad = componer(512, 0.7, CUADRADO(512), marca); // mas aire: iOS recorta esquinas

// --- favicon vectorial ------------------------------------------------------
// Lleva la marca completa: quien entiende favicon SVG es un navegador moderno y
// en pantalla retina una pestana de 16 CSS px se pinta a 32 fisicos, que es
// justo donde las letras empiezan a leerse.
writeFileSync(`${DEST}/favicon.svg`, circ);

// --- PNG --------------------------------------------------------------------
const png = (fuente, lado) => sharp(Buffer.from(fuente)).resize(lado, lado).png({ compressionLevel: 9 }).toBuffer();

const [i16, i32, i48, apple, i192, i512] = await Promise.all([
  png(circMini, 16), // 16 -> simbolo solo
  png(circ, 32), png(circ, 48),
  png(cuad, 180), png(cuad, 192), png(cuad, 512),
]);

writeFileSync(`${DEST}/apple-touch-icon.png`, apple);
writeFileSync(`${DEST}/icon-192.png`, i192);
writeFileSync(`${DEST}/icon-512.png`, i512);

// --- favicon.ico ------------------------------------------------------------
// Se escribe a mano porque sharp no sabe emitir ICO. El formato admite cargas
// PNG desde Windows Vista, asi que cada tamano va como PNG dentro del
// contenedor: ICONDIR (6 bytes) + una ICONDIRENTRY de 16 por imagen + los PNG.
const ico = (imgs) => {
  const dir = Buffer.alloc(6 + 16 * imgs.length);
  dir.writeUInt16LE(0, 0); // reservado
  dir.writeUInt16LE(1, 2); // 1 = icono
  dir.writeUInt16LE(imgs.length, 4);
  let off = dir.length;
  imgs.forEach(({ lado, buf }, i) => {
    const p = 6 + 16 * i;
    dir.writeUInt8(lado >= 256 ? 0 : lado, p);     // 0 significa 256
    dir.writeUInt8(lado >= 256 ? 0 : lado, p + 1);
    dir.writeUInt8(0, p + 2);   // colores de la paleta
    dir.writeUInt8(0, p + 3);   // reservado
    dir.writeUInt16LE(1, p + 4);   // planos
    dir.writeUInt16LE(32, p + 6);  // bits por pixel
    dir.writeUInt32LE(buf.length, p + 8);
    dir.writeUInt32LE(off, p + 12);
    off += buf.length;
  });
  return Buffer.concat([dir, ...imgs.map((x) => x.buf)]);
};
writeFileSync(
  `${DEST}/favicon.ico`,
  ico([{ lado: 16, buf: i16 }, { lado: 32, buf: i32 }, { lado: 48, buf: i48 }]),
);

// --- manifest ---------------------------------------------------------------
// `purpose: "any maskable"` para que Android no vuelva a recortar un icono que
// ya trae su propio margen.
writeFileSync(
  `${DEST}/site.webmanifest`,
  JSON.stringify(
    {
      name: "Accounting Max Services, Inc.",
      short_name: "AMS",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
      theme_color: NAVY,
      background_color: NAVY,
      display: "browser",
    },
    null,
    2,
  ) + "\n",
);

console.log("Generado desde", result.url);
for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "site.webmanifest"])
  console.log("  public/" + f);
