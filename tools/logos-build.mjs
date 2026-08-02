// Normaliza los logos de software para el carrusel.
//
// Las fuentes vienen de sitios distintos: distintos formatos, fondos blancos y
// proporciones que van de 7.7:1 (Drake) a 1.5:1 (ADP). Este script las deja a
// todas en un lienzo IDENTICO con transparencia, de modo que el CSS del
// carrusel sea una sola regla de altura y no doce excepciones.
//
//   node tools/logos-build.mjs
//
// La clave es normalizar por AREA, no por altura: a igual altura, un logotipo
// muy ancho pesa visualmente mucho mas que uno cuadrado. Igualar el area es lo
// que hace que la fila se lea pareja.

import { readdir } from 'node:fs/promises'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ORIGEN = path.join(process.env.HOME, 'Downloads')
const DESTINO = path.join(process.env.HOME, 'site/public/images/logos')

// ALTURA de lienzo comun, a 2x (70px en pantalla). La ANCHURA la pone cada
// logotipo y por eso este numero es el unico fijo: con altura comun el factor de
// escala en pantalla es exactamente 0,5 para los doce, asi que la normalizacion
// por area que se calcula mas abajo llega intacta al navegador.
//
// UN LIENZO DE ANCHURA FIJA NO SIRVE, aunque simplifique el CSS: mete relleno
// transparente distinto en cada archivo (un logotipo estrecho como ADP se lleva
// 57px a cada lado, uno ancho como Drake casi ninguno) y ese relleno SE SUMA al
// margen CSS. Medido en el navegador: 165px de hueco entre Gusto y ADP donde el
// margen pedia 56, y distinto entre cada par. El hueco lo tiene que poner el
// CSS, que es el unico que lo puede poner igual para todos.
const LIENZO_ALTO = 140

// Area optica objetivo, en px^2 del lienzo 2x. Calibrada para que una marca
// denominativa de ~3.5:1 quede en unos 38px de alto en pantalla.
const AREA = 20000
const ALTO_MAX = 96 // tope para los logos cuadrados, si no se comen la fila
const ANCHO_MAX = 380 // tope para los muy anchos (Drake)

// Umbrales para convertir el fondo blanco en transparencia. La distancia al
// blanco se mide sobre el canal MAS claro: asi un cian saturado (41,180,232)
// da 214 y queda opaco, mientras que un gris #F5F5F5 da 10 y desaparece.
const BLANCO_LO = 6 // por debajo de esto: transparente puro
const BLANCO_HI = 120 // por encima: opaco puro; en medio, rampa antialias

// El `nombre` es el texto alternativo, y aqui el alt SI es informacion: el
// logotipo de Drake no se lee solo. Va en esta tabla y no en el componente
// porque de aqui sale el manifiesto que el componente consume — una sola lista.
const LOGOS = [
  // slug          nombre (alt)            origen                        quitarFondo  densidad
  ['drake', 'Drake Software', 'idt5NnOixF_1785626469201.png', false],
  ['ultratax', 'UltraTax CS', 'UltraTax.svg', false, 400],
  // SVG con un PNG dentro, no es vector: densidad nativa para no reescalar.
  ['lacerte', 'Intuit Lacerte', 'Lacerte-logo-1.svg', false, 72],
  ['proseries', 'Intuit ProSeries Tax', 'images (1).png', true],
  ['cch-axcess', 'CCH AXcess', 'logo-hero-cch-axcess.webp', false],
  ['quickbooks', 'Intuit QuickBooks', 'Intuit_QuickBooks_logo.png', false],
  ['xero', 'Xero', 'images (2).png', true],
  ['sage', 'Sage', 'Sage-logo_svg.svg.webp', false],
  ['gusto', 'Gusto', 'gusto-logo-vector.png', true],
  ['adp', 'ADP', 'ADP-logo.png', false],
  ['stripe', 'Stripe', 'Stripe_Logo,_revised_2016.svg.webp', false],
  ['square', 'Square', 'Square,_Inc._logo.svg.webp', false],
]

// Convierte el fondo blanco en alfa. Des-premultiplica el color en la banda de
// antialias: sin esto los bordes quedan lavados sobre fondos que no son blancos.
async function quitarBlanco(img) {
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const d = 255 - Math.min(r, g, b)
    const a = Math.min(1, Math.max(0, (d - BLANCO_LO) / (BLANCO_HI - BLANCO_LO)))

    if (a <= 0) {
      data[i + 3] = 0
      continue
    }
    if (a < 1) {
      // observado = color*a + 255*(1-a)  =>  color = (observado - 255*(1-a)) / a
      const base = 255 * (1 - a)
      data[i] = Math.min(255, Math.max(0, Math.round((r - base) / a)))
      data[i + 1] = Math.min(255, Math.max(0, Math.round((g - base) / a)))
      data[i + 2] = Math.min(255, Math.max(0, Math.round((b - base) / a)))
    }
    data[i + 3] = Math.round(a * 255)
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
}

// Dado el recorte ajustado, cuanto debe medir para pesar lo mismo que el resto.
function medida(ancho, alto) {
  const r = ancho / alto
  let h = Math.round(Math.sqrt(AREA / r))
  let w = Math.round(h * r)
  if (h > ALTO_MAX) {
    h = ALTO_MAX
    w = Math.round(h * r)
  }
  if (w > ANCHO_MAX) {
    w = ANCHO_MAX
    h = Math.round(w / r)
  }
  return { w, h, r }
}

async function main() {
  await mkdir(DESTINO, { recursive: true })
  const filas = []

  const manifiesto = []

  for (const [slug, nombre, archivo, limpiar, densidad] of LOGOS) {
    const ruta = path.join(ORIGEN, archivo)
    let img = sharp(ruta, densidad ? { density: densidad } : undefined)

    if (limpiar) img = await quitarBlanco(img)

    // Recorte ajustado al contenido: los origenes traen margenes distintos y
    // sin quitarlos el area calculada mide el margen, no el logotipo.
    const recortado = await img
      .ensureAlpha()
      .trim({ threshold: 1 })
      .png()
      .toBuffer()
    const meta = await sharp(recortado).metadata()

    const { w, h, r } = medida(meta.width, meta.height)

    const escalado = await sharp(recortado)
      .resize(w, h, { fit: 'fill', kernel: 'lanczos3' })
      .png()
      .toBuffer()

    // Anchura ajustada al logotipo, altura comun: solo se rellena en vertical
    // para centrarlo. Asi el <img> mide en pantalla exactamente la mitad del
    // archivo y el hueco entre logos lo pone entero el margen del CSS.
    // DOS PASOS, Y EL ORDEN ES LO QUE AHORRA. Primero se reduce a paleta de 256
    // colores (el paso de PNG) y solo despues se codifica WebP sin perdida.
    // Medido sobre estos doce archivos:
    //   WebP sin perdida directo ...... 95,5 KB
    //   PNG con paleta ................ 74,0 KB
    //   paleta -> WebP sin perdida .... 63,5 KB   <- este
    //   WebP CON perdida q92 .......... 102,6 KB
    //   AVIF q80 ...................... 91,7 KB
    // Los dos ultimos pierden porque un logotipo es color plano con alfa, que es
    // justo donde la codificacion con perdida gasta y no donde ahorra. Y el
    // directo pierde porque "sin perdida" conserva los miles de colores que deja
    // el reescalado en los bordes; cuantizar antes los quita de verdad, y a 48px
    // de alto no se distingue. El sitio ya sirve .webp en otras imagenes.
    const compuesto = sharp({
      create: {
        width: w,
        height: LIENZO_ALTO,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: escalado, gravity: 'centre' }])
      .png({ compressionLevel: 9, palette: true })

    const salida = path.join(DESTINO, `${slug}.webp`)
    await sharp(await compuesto.toBuffer())
      .webp({ lossless: true, effort: 6 })
      .toFile(salida)

    manifiesto.push({ slug, nombre, ancho: Math.round(w / 2), alto: LIENZO_ALTO / 2 })

    filas.push({
      slug,
      origen: `${meta.width}x${meta.height}`,
      ratio: r.toFixed(2),
      render: `${Math.round(w / 2)}x${Math.round(h / 2)} css`,
      // Si el origen es mas chico que el destino hay que reescalar hacia
      // arriba, y eso se ve. Vale la pena avisarlo en vez de callarlo.
      nitidez: meta.height >= h ? 'ok' : `BAJA (falta ${h - meta.height}px)`,
    })
  }

  console.table(filas)

  // El componente lee de aqui el alt y las medidas de cada <img>. Las medidas
  // van explicitas para que la seccion no desplace nada mientras cargan.
  await writeFile(
    path.join(process.env.HOME, 'site/src/lib/logos.json'),
    JSON.stringify(manifiesto, null, 2) + '\n',
  )

  // Hoja de contactos: reproduce el espaciado REAL del carrusel (el margen de
  // 3.5em del CSS, aqui a 2x) repartido en filas. Sirve para juzgar a ojo el
  // equilibrio optico Y el hueco, que es justo lo que no se ve en una tabla.
  const HUECO = 112
  const ANCHO_FILA = 2400
  const filasHoja = [[]]
  let usado = 0
  for (const m of manifiesto) {
    const ancho = m.ancho * 2
    if (usado + ancho > ANCHO_FILA && filasHoja.at(-1).length) {
      filasHoja.push([])
      usado = 0
    }
    filasHoja.at(-1).push({ ...m, x: usado })
    usado += ancho + HUECO
  }

  const piezas = []
  filasHoja.forEach((fila, y) =>
    fila.forEach((m) =>
      piezas.push({
        input: path.join(DESTINO, `${m.slug}.webp`),
        left: m.x,
        top: y * (LIENZO_ALTO + HUECO),
      }),
    ),
  )

  const hoja = await sharp({
    create: {
      width: ANCHO_FILA,
      height: filasHoja.length * (LIENZO_ALTO + HUECO),
      channels: 4,
      background: { r: 246, g: 247, b: 245, alpha: 1 }, // el fondo real de .logos
    },
  })
    .composite(piezas)
    .png()
    .toBuffer()
  const rutaHoja = path.join(process.env.HOME, 'site/tools/.logos-preview.png')
  await writeFile(rutaHoja, hoja)
  console.log(`\nHoja de contactos: ${rutaHoja}`)
}

main()
