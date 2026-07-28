// Modelo de contenido de Accounting Max Services.
//
// NO existe `teamMember` y es deliberado (R2): el equipo vivo en produccion son
// 6 personas de plantilla de Webflow con correos @example.com. El esquema es el
// vector de importacion — sin esquema no hay import accidental. Si el cliente
// entrega bios reales (D1), se anade en ese momento.
//
// Este fichero lo consumen dos cosas: el Studio y el importador, que necesita
// el tipo `blockContent` compilado para convertir HTML a Portable Text.

const blockContent = {
  name: "blockContent",
  type: "array",
  of: [
    {
      type: "block",
      // H1 esta aqui porque el rich text de los 10 posts ABRE con un <h1> en
      // produccion. Sin este estilo, htmlToBlocks no tenia destino y los importo
      // como `normal`: el titular del cuerpo se leia como texto corrido en las
      // 10 rutas. La plantilla no lo emite como <h1> — PortableText.astro lo
      // baja a <h2> para no dejar dos h1 por pagina — pero el nivel tiene que
      // sobrevivir al import para poder distinguirlo de un parrafo.
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H1", value: "h1" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
      ],
      lists: [
        { title: "Vineta", value: "bullet" },
        { title: "Numerada", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Negrita", value: "strong" },
          { title: "Cursiva", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Enlace",
            fields: [{ name: "href", type: "url", title: "URL" }],
          },
        ],
      },
    },
  ],
};

// Imagen con alt OBLIGATORIO y bilingue. En produccion 109 de 111 imagenes
// tienen alt="" y los CSV no traen el campo, asi que si el esquema no lo exige
// la FASE 6 no puede arreglarlo.
const imageWithAlt = (name, title) => ({
  name,
  title,
  type: "image",
  options: { hotspot: true },
  fields: [
    { name: "alt", type: "string", title: "Texto alternativo (EN)", validation: (r) => r.required() },
    { name: "altEs", type: "string", title: "Texto alternativo (ES)" },
  ],
});

// Campos SEO por documento y por idioma. Hoy 22 paginas comparten el mismo
// <title> y NINGUNA de las 26 tiene meta description ni canonical.
const seoFields = [
  { name: "metaTitle", type: "string", title: "Meta title (EN)", validation: (r) => r.max(60) },
  { name: "metaDescription", type: "text", rows: 2, title: "Meta description (EN)", validation: (r) => r.max(160) },
  { name: "metaTitleEs", type: "string", title: "Meta title (ES)", validation: (r) => r.max(60) },
  { name: "metaDescriptionEs", type: "text", rows: 2, title: "Meta description (ES)", validation: (r) => r.max(160) },
];

const service = {
  name: "service",
  type: "document",
  title: "Servicio",
  fields: [
    { name: "title", type: "string", title: "Titulo (EN)", validation: (r) => r.required() },
    {
      name: "slug",
      type: "slug",
      title: "Slug",
      // R4: `sales-tax-filing-7k40q` se conserva byte a byte. Es la URL viva e
      // indexada; el sufijo es el desempate de Webflow.
      options: { source: "title" },
      validation: (r) => r.required(),
    },
    { name: "intro", type: "text", rows: 3, title: "Intro (EN)" },
    { name: "body", type: "blockContent", title: "Cuerpo (EN)" },
    { name: "titleEs", type: "string", title: "Titulo (ES)" },
    { name: "introEs", type: "text", rows: 3, title: "Intro (ES)" },
    { name: "bodyEs", type: "blockContent", title: "Cuerpo (ES)" },
    imageWithAlt("icon", "Icono"),
    imageWithAlt("picture", "Imagen"),
    { name: "feature", type: "boolean", title: "Destacado", initialValue: false },
    // Orden de la coleccion en Webflow, recuperado del HTML de produccion. No
    // venia en el crawl (ver B4), pero es deducible y esta verificado: las
    // cuatro listas del sitio son este orden asc (desplegable), su inverso
    // (pie y sidebar de ficha) y `feature desc, order asc` (portada). Las tres
    // permutaciones salen exactas. Sin este campo todo caia en `title asc`.
    { name: "order", type: "number", title: "Orden", validation: (r) => r.integer() },
    // Llave de idempotencia: el Item ID de Webflow, no el slug. Derivarlo del
    // slug reproduce el bug de duplicados de AB Aluminum.
    { name: "webflowItemId", type: "string", title: "Webflow Item ID", readOnly: true },
    ...seoFields,
  ],
};

const review = {
  name: "review",
  type: "document",
  title: "Testimonio",
  fields: [
    { name: "author", type: "string", title: "Autor", validation: (r) => r.required() },
    { name: "slug", type: "slug", title: "Slug" },
    // NO se traduce (FASE 5): son palabras de clientes reales.
    { name: "quote", type: "text", rows: 3, title: "Testimonio (idioma original)", validation: (r) => r.required() },
    // Sin rating, sin fecha y sin fuente A PROPOSITO. Los 20 del CSV no los
    // tienen, y sus `Published On` son identicos: artefacto de importacion
    // masiva, no fechas reales. Emitir JSON-LD Review/aggregateRating sin esos
    // datos es infraccion de las directrices de Google con penalizacion
    // manual. Ver D5.
    { name: "webflowItemId", type: "string", title: "Webflow Item ID", readOnly: true },
  ],
};

const post = {
  name: "post",
  type: "document",
  title: "Entrada de blog",
  fields: [
    { name: "title", type: "string", title: "Titulo (EN)", validation: (r) => r.required() },
    { name: "slug", type: "slug", title: "Slug", validation: (r) => r.required() },
    { name: "excerpt", type: "text", rows: 2, title: "Extracto (EN)" },
    { name: "body", type: "blockContent", title: "Cuerpo (EN)" },
    { name: "titleEs", type: "string", title: "Titulo (ES)" },
    { name: "excerptEs", type: "text", rows: 2, title: "Extracto (ES)" },
    { name: "bodyEs", type: "blockContent", title: "Cuerpo (ES)" },
    imageWithAlt("heroImage", "Imagen principal"),
    // La plantilla de Webflow NO liga fecha ni autor: no existen ni en el
    // export ni en el sitio vivo. Se dejan vacios, no se inventan (R3).
    { name: "publishedAt", type: "datetime", title: "Fecha de publicacion" },
    { name: "authorName", type: "string", title: "Autor" },
    // Mismo caso que en `service`. Aqui no hay fecha con la que ordenar (la
    // plantilla de Webflow no la ligaba), asi que el orden de produccion solo
    // se puede conservar guardandolo. /blog-news y el sidebar de post usan el
    // mismo, verificado.
    { name: "order", type: "number", title: "Orden", validation: (r) => r.integer() },
    { name: "webflowItemId", type: "string", title: "Webflow Item ID", readOnly: true },
    ...seoFields,
  ],
};

const page = {
  name: "page",
  type: "document",
  title: "Pagina",
  fields: [
    { name: "title", type: "string", title: "Titulo (EN)", validation: (r) => r.required() },
    { name: "slug", type: "slug", title: "Slug", validation: (r) => r.required() },
    { name: "body", type: "blockContent", title: "Cuerpo (EN)" },
    { name: "titleEs", type: "string", title: "Titulo (ES)" },
    { name: "bodyEs", type: "blockContent", title: "Cuerpo (ES)" },
    ...seoFields,
  ],
};

const siteSettings = {
  name: "siteSettings",
  type: "document",
  title: "Ajustes del sitio",
  fields: [
    { name: "businessName", type: "string", title: "Nombre" },
    { name: "phone", type: "string", title: "Telefono" },
    { name: "email", type: "string", title: "Correo" },
    { name: "streetAddress", type: "string", title: "Direccion" },
    { name: "addressLocality", type: "string", title: "Ciudad" },
    { name: "addressRegion", type: "string", title: "Estado" },
    { name: "postalCode", type: "string", title: "Codigo postal" },
    { name: "openingHours", type: "string", title: "Horario" },
    // NAP y cifras nunca pasan por el traductor (FASE 5).
    imageWithAlt("ogImage", "Imagen OG (1200x630, JPG o PNG)"),
  ],
};

// El lead NO vive en el dataset publico. Ver B3: `production` esta hoy en
// aclMode "public" y se lee desde internet sin token; meter PII de
// contribuyentes ahi seria repetir la exposicion de AB Aluminum.
const lead = {
  name: "lead",
  type: "document",
  title: "Lead",
  fields: [
    { name: "fullName", type: "string", title: "Nombre" },
    { name: "email", type: "string", title: "Correo" },
    { name: "phone", type: "string", title: "Telefono" },
    { name: "message", type: "text", title: "Mensaje" },
    { name: "lang", type: "string", title: "Idioma del prospecto" },
    { name: "source", type: "string", title: "Origen" },
    { name: "consentCall", type: "boolean", title: "Consiente llamadas/SMS (FTSA FL)" },
    { name: "consentAt", type: "datetime", title: "Fecha del consentimiento" },
    { name: "consentIp", type: "string", title: "IP del consentimiento" },
    { name: "receivedAt", type: "datetime", title: "Recibido" },
  ],
};

export const schemaTypes = [
  blockContent,
  service,
  review,
  post,
  page,
  siteSettings,
  lead,
];
