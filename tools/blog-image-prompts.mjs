// Prompts de las 10 portadas del blog. Uno por slug de Sanity.
//
// Los tenemos que leer como UNA SERIE, no como diez imagenes sueltas: por eso
// el estilo, la paleta, la luz y el encuadre viven en ESTILO y se concatenan a
// los diez. Lo unico que cambia entre imagenes es SUJETO. Si se toca el estilo,
// se tocan las diez a la vez — que es justo lo que se quiere.
//
// Los sujetos salen del title y el excerpt REALES de cada post en Sanity
// (leidos del dataset, no inventados). El excerpt va como comentario encima de
// cada entrada para poder auditar que el sujeto corresponde al articulo.
//
// PALETA, sacada del CSS portado y no inventada:
//   #243137  --bllue    gris azulado oscuro, el fondo de marca
//   #9dbf43  --green-1
//   #6da228  --green-2  ojo: es el fondo de .header-page-blog, la banda verde
//                       sobre la que se apoya el hero. La portada NO puede ser
//                       de ese mismo verde o se funde con el fondo.
//   #87af0b  --green-3
//   #dedede  --gray
//
// FORMATO: 16:9. Es el compromiso entre los dos huecos reales, que no tienen la
// misma proporcion y recortan cada uno por su lado con object-fit:cover:
//   hero  .picture-blog-page  ~688x350 (1,97) — recorta arriba y abajo
//   card  .pic-blog            395x250 (1,58) — recorta a los lados
// De ahi la regla de encuadre: sujeto centrado y aire por los cuatro costados.
// A 2x del hueco mayor son 1500x700; se pide 2K y Sanity sirve el resto.

/** Se concatena a los diez. Aqui vive todo lo que NO debe variar. */
const ESTILO = `
Editorial vector illustration for the blog of a professional accounting firm.
Flat geometric shapes with subtle paper-grain texture and soft long shadows.
Restrained, corporate, calm — closer to a printed annual-report illustration
than to a stock photo.

Strict palette, no other hues: deep desaturated slate blue-grey #243137 as the
dominant background, warm olive green #9dbf43 and yellow-green #87af0b as the
accents, light warm grey #dedede for highlights and paper surfaces. Avoid the
mid-green #6da228 as a large area.

Single soft directional light from the upper left, gentle gradient falloff,
no harsh specular highlights, no lens flare, no bokeh, no photographic depth
of field.

Composition: one clear central subject, generous empty margin on all four
sides, nothing important within 15% of any edge — the image is cropped to two
different aspect ratios. Slight top-down three-quarter perspective. Calm,
uncluttered, plenty of negative space.

ABSOLUTE PROHIBITIONS, these override anything above:
- NO text, letters, words, numbers, digits, labels, captions or signage of any
  kind anywhere in the image, not even blurred, decorative or illegible.
- NO human faces, no people, no portraits, no figures, no hands with visible
  detail, no silhouettes of people.
- NO charts, graphs, plots, dashboards, gauges, percentages or data of any kind.
- NO tax forms, no IRS documents, no invoices, no legible or semi-legible
  paperwork. Paper may appear only as blank, unmarked sheets.
- NO logos, no brand marks, no currency symbols, no cryptocurrency logos.
- NO photorealism, no 3D render look, no AI-glossy plastic sheen.
`.trim();

/** Solo el sujeto. Todo lo demas es comun. */
const SUJETOS = {
  // "Get informed about the tax implications of cryptocurrency transactions."
  "understanding-cryptocurrency-taxes": `
    Subject: an abstract network of interlocking hexagonal tiles floating in
    layers above a flat plane, connected by thin luminous lines, with one tile
    lifted and tilted apart from the rest. Suggests a distributed ledger
    without depicting any coin, token or currency symbol.`,

  // "Learn how retirement planning intersects with tax considerations."
  "retirement-planning-and-taxes": `
    Subject: a long calm horizon line with a simple geometric hourglass at the
    centre, its falling sand forming a gentle slope that turns into a series of
    ascending flat steps. Suggests time and long-term planning.`,

  // "Explore the tax implications of investing and strategies for tax-efficient investing."
  "tax-implications-of-investing": `
    Subject: a set of smooth stacked discs of varying diameters balanced on a
    slender fulcrum, slightly off-centre so the arrangement reads as poised
    rather than static. Suggests allocation and balance. No coins, no bars,
    no upward arrows.`,

  // "Identify common tax mistakes and learn how to avoid them."
  "common-tax-mistakes": `
    Subject: a neat grid of identical rounded squares laid flat, with exactly
    one square rotated out of alignment and casting a longer shadow than its
    neighbours. Suggests a single error found within order.`,

  // "Learn how to effectively prepare for tax season and avoid last-minute stress."
  "preparing-for-tax-season": `
    Subject: an orderly row of blank folder dividers standing in a shallow
    tray, seen from a slight angle, with one divider pulled forward. Sheets are
    completely blank and unmarked. Suggests preparation and sorting.`,

  // "Discover the importance of tax credits and how they can benefit you."
  "tax-credits-explained": `
    Subject: a simple balance scale rendered as two shallow flat pans, the
    lower pan holding three smooth rounded pebbles, the raised pan empty.
    Suggests offset and relief. No currency, no numbers on the pans.`,

  // "Get to know the basics of sales tax and how it affects your purchases."
  "understanding-sales-tax": `
    Subject: a small stack of plain cubic parcels on a flat counter surface,
    with a thin ribbon-like band wrapping around the top parcel and continuing
    off to one side. Suggests goods and a small added layer. No price tags,
    no barcodes, no receipts.`,

  // "Learn how to navigate business expenses and maximize your tax deductions."
  "navigating-business-expenses": `
    Subject: a flowing ribbon path winding between a few simple geometric
    building blocks of different heights, with small markers where the path
    branches. Suggests navigating a route. No maps, no compass rose, no labels.`,

  // "Explore effective strategies for tax planning to minimize your tax liabilities."
  //
  // La primera version decia "one piece held slightly above the surface" y el
  // modelo entendio "held" literalmente: dibujo una MANO sujetando la pieza, y
  // ademas mal formada. Es el "efecto IA" que rompe la credibilidad de una
  // firma contable real. De ahi "floating unsupported" y la prohibicion
  // explicita: cuando el sujeto insinua una accion, hay que decir que no hay
  // nadie ejecutandola.
  "tax-planning-strategies": `
    Subject: an overhead view of several smooth interlocking geometric tiles
    arranged on a flat board in a deliberate configuration, with one tile
    floating unsupported a short distance above the empty slot it fits into,
    casting its own shadow onto the board. Nothing and nobody touches it — the
    tile hovers on its own. Suggests strategy and a planned move. No hand, no
    arm, no fingers, no gripper, no tool, no chess pieces, no game branding.`,

  // "Learn about tax deductions and how they can help reduce your taxable income."
  "understanding-tax-deductions": `
    Subject: a tall solid block with several clean rectangular notches carved
    out of one side, the removed pieces resting neatly beside it. Suggests
    subtraction from a whole. No minus signs, no arrows, no numbers.`,
};

/** slug -> prompt completo. Es lo que consume gen-blog-images.mjs. */
export const PROMPTS = Object.fromEntries(
  Object.entries(SUJETOS).map(([slug, sujeto]) => [
    slug,
    `${sujeto.trim().replace(/\s+/g, " ")}\n\n${ESTILO}`,
  ]),
);

/**
 * SEO de cada portada: nombre de fichero y texto alternativo en los dos idiomas.
 *
 * Se escribe AQUI, junto al prompt que genero la imagen, y no despues: es la
 * descripcion de algo que hemos definido nosotros, asi que no hay que
 * adivinarla mirando el resultado.
 *
 * `fichero` — nombre descriptivo con guiones, que es lo que recomienda Google y
 * lo que se vera en el CMS. AVISO PARA NO VENDER HUMO: en cuanto la imagen suba
 * a Sanity, la URL publica pasa a ser
 * `cdn.sanity.io/images/ep5i6co1/production/<sha1>-<w>x<h>.jpg` — direccionable
 * por CONTENIDO. El nombre del fichero NO aparece en esa URL. O sea que el
 * beneficio SEO real del nombre es cero mientras las sirva Sanity; lo que si
 * hace es que el asset sea identificable en el Studio y que el nombre siga
 * siendo correcto si algun dia se sirven desde /public. Quien de verdad pesa en
 * SEO de imagen aqui es el `alt`, y ese si va a producir efecto.
 *
 * `alt` — describe la ilustracion Y ancla el tema del articulo. Las dos cosas a
 * la vez: sin el tema no aporta nada a SEO, y siendo solo el titulo del post
 * seria redundante con el <h1> que va justo al lado y ruido para un lector de
 * pantalla. Por debajo de 125 caracteres, que es donde los lectores de pantalla
 * mas comunes empiezan a cortar.
 *
 * OJO: esto NO se escribe en Sanity por su cuenta. El alt de Sanity sigue vacio
 * y su lista esta en entrega/alt-pendientes.md.
 */
export const SEO = {
  "understanding-cryptocurrency-taxes": {
    fichero: "cryptocurrency-taxes-explained-illustration",
    alt: {
      en: "Cryptocurrency taxes: linked hexagonal tiles forming a distributed ledger, one tile lifted apart",
      es: "Impuestos sobre criptomonedas: fichas hexagonales enlazadas como un libro contable distribuido",
    },
  },
  "retirement-planning-and-taxes": {
    fichero: "retirement-planning-and-taxes-illustration",
    alt: {
      en: "Retirement planning and taxes: an hourglass whose falling sand rises into ascending steps",
      es: "Planificación de la jubilación e impuestos: un reloj de arena cuya arena asciende en escalones",
    },
  },
  "tax-implications-of-investing": {
    fichero: "tax-implications-of-investing-illustration",
    alt: {
      en: "Tax implications of investing: discs of different sizes balanced on a slender fulcrum",
      es: "Implicaciones fiscales de invertir: discos de distintos tamaños en equilibrio sobre un eje",
    },
  },
  "common-tax-mistakes": {
    fichero: "common-tax-mistakes-to-avoid-illustration",
    alt: {
      en: "Common tax mistakes: a grid of identical squares with a single one rotated out of alignment",
      es: "Errores fiscales comunes: una cuadrícula de cuadrados iguales con uno girado fuera de sitio",
    },
  },
  "preparing-for-tax-season": {
    fichero: "preparing-for-tax-season-illustration",
    alt: {
      en: "Preparing for tax season: blank folder dividers standing in a tray, one pulled forward",
      es: "Preparación para la temporada de impuestos: separadores en blanco con uno adelantado",
    },
  },
  "tax-credits-explained": {
    fichero: "tax-credits-explained-illustration",
    alt: {
      en: "Tax credits explained: a balance scale with three pebbles in one pan offsetting the other",
      es: "Los créditos tributarios explicados: una balanza con tres guijarros compensando el otro platillo",
    },
  },
  "understanding-sales-tax": {
    fichero: "understanding-sales-tax-basics-illustration",
    alt: {
      en: "Sales tax basics: plain parcels stacked on a counter with a thin band wrapping the top one",
      es: "Conceptos básicos del Sales Tax: paquetes apilados con una cinta rodeando el de arriba",
    },
  },
  "navigating-business-expenses": {
    fichero: "navigating-business-expenses-illustration",
    alt: {
      en: "Navigating business expenses: a ribbon path winding and branching between geometric blocks",
      es: "Cómo manejar los gastos del negocio: un camino que serpentea y se bifurca entre bloques",
    },
  },
  "tax-planning-strategies": {
    fichero: "effective-tax-planning-strategies-illustration",
    // "held" describia la version con mano, que se descarto. El alt tiene que
    // decir lo que se ve: la pieza flota sola sobre su hueco.
    alt: {
      en: "Tax planning strategies: interlocking tiles on a board, one floating above the slot it fits",
      es: "Estrategias de planificación fiscal: piezas encajadas en un tablero y una flotando sobre su hueco",
    },
  },
  "understanding-tax-deductions": {
    fichero: "understanding-tax-deductions-illustration",
    alt: {
      en: "Tax deductions: a solid block with rectangular notches carved out, the pieces resting beside it",
      es: "Deducciones de impuestos: un bloque macizo con muescas recortadas y las piezas retiradas al lado",
    },
  },
};
