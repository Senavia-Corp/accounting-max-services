// Genera baseline/i18n/posts-es.json: traduccion ES de los 10 posts.
//
// No escribe el JSON a mano: lee el original de Sanity, clona cada bloque de
// Portable Text y solo sustituye el texto de cada span buscandolo por _key.
// Asi la estructura (numero de bloques, style, listItem, level, marks, _key)
// es identica al original por construccion, no por buena voluntad.
//
// R3: nada inventado. metaTitle/metaDescription son null en los 10 posts del
// original, asi que aqui salen null. No se fabrican metadatos.
// Glosario: IRS, Sales Tax, W-2, 1099, IRA, 401(k) y los nombres propios de
// creditos del IRS se quedan en ingles.

import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const RAIZ = "/Users/senavia/site";

// --- token: .env del proyecto ---------------------------------------------
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(RAIZ, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const sanity = createClient({
  projectId: "ep5i6co1",
  dataset: "production",
  apiVersion: "2021-06-07",
  useCdn: false,
  token: env.SANITY_WRITE_TOKEN,
});

// --- traducciones ----------------------------------------------------------
// Por post: title, excerpt y un mapa _key-de-span -> texto ES.
const ES = {
  "post.common-tax-mistakes": {
    title: "Errores fiscales comunes que debe evitar",
    excerpt: "Identifique los errores fiscales comunes y aprenda a evitarlos.",
    spans: {
      "18683e74788c": "Cómo evitar los errores fiscales comunes",
      da1cd2104d95:
        "Muchos contribuyentes cometen errores comunes que pueden causar retrasos o sanciones. Entre ellos están los números de Seguro Social incorrectos, no firmar la declaración y calcular mal las deducciones.",
      "9f08ad4a0838": "Consejos para evitar errores",
      bdc195a692ef: "Verifique dos veces toda la información antes de enviarla.",
      "313f93f01bb9": "Use software de impuestos para reducir al mínimo los errores.",
      d74932b164d6: "Considere la ayuda de un profesional si su situación es compleja.",
      "156deb3d3aef":
        "Si conoce estos errores, puede lograr que el proceso de presentación de su declaración sea más sencillo.",
    },
  },

  "post.navigating-business-expenses": {
    title: "Cómo manejar los gastos de su negocio",
    excerpt: "Aprenda a manejar los gastos de su negocio y a maximizar sus deducciones de impuestos.",
    spans: {
      bbf2700217c9: "Entender los gastos del negocio",
      "82f00a1a7bed":
        "Los gastos del negocio son los costos en los que se incurre en el curso ordinario de la actividad. Se pueden deducir de sus ingresos y así reducir su carga fiscal total. Entre los gastos habituales están el alquiler, los servicios públicos y los salarios.",
      "715614a08c40": "Gastos deducibles vs. no deducibles",
      d57af2ad40cb:
        "Es importante distinguir entre los gastos deducibles y los no deducibles. Los gastos deducibles pueden reducir sus ingresos sujetos a impuestos; los no deducibles, no.",
    },
  },

  "post.preparing-for-tax-season": {
    title: "Cómo prepararse para la temporada de impuestos",
    excerpt:
      "Aprenda a prepararse de forma eficaz para la temporada de impuestos y a evitar el estrés de última hora.",
    spans: {
      "3574b3143858": "Preparación para la temporada de impuestos",
      e5ee3d645bd1:
        "Prepararse para la temporada de impuestos puede parecer abrumador, pero con el enfoque adecuado se vuelve manejable. Empiece por reunir todos los documentos necesarios, incluidos los W-2, los 1099 y los recibos de las deducciones.",
      e3b93c31986a: "Pasos para prepararse",
      cef8031d15af: "Organice sus documentos financieros.",
      "8bbe9587a56f": "Revise la declaración de impuestos del año pasado.",
      d401c00dc83b: "Considere usar software de impuestos o contratar a un profesional.",
      d251b560f137: "Estar preparado le ayuda a presentar sus impuestos con exactitud y a tiempo.",
    },
  },

  "post.retirement-planning-and-taxes": {
    title: "La planificación de la jubilación y los impuestos",
    excerpt:
      "Conozca cómo se relaciona la planificación de la jubilación con las consideraciones fiscales.",
    spans: {
      "309ace2fc647": "Consideraciones para planificar la jubilación",
      ac6033e70b17:
        "Al planificar la jubilación, es esencial considerar las implicaciones fiscales de sus ahorros. Las distintas cuentas de jubilación reciben tratamientos fiscales diferentes, lo que puede afectar sus retiros durante la jubilación.",
      "58a83356c2b7": "Cuentas con impuestos diferidos vs. cuentas sujetas a impuestos",
      ec330262786e:
        "Entender la diferencia entre las cuentas con impuestos diferidos, como las IRA tradicionales, y las cuentas sujetas a impuestos le ayuda a tomar decisiones informadas sobre sus ahorros para la jubilación.",
    },
  },

  "post.tax-credits-explained": {
    title: "Los créditos tributarios, explicados",
    excerpt: "Descubra la importancia de los créditos tributarios y cómo pueden beneficiarle.",
    spans: {
      "311fc6356549": "¿Qué son los créditos tributarios?",
      "7b4db0dac5a3":
        "Los créditos tributarios reducen directamente el impuesto que se debe, por lo que resultan más beneficiosos que las deducciones. Pueden ser reembolsables o no reembolsables. Los créditos reembolsables pueden generar un reembolso si superan su obligación tributaria.",
      "66ba08706973": "Créditos tributarios comunes",
      // Nombre propio de un programa del IRS: no se traduce (igual criterio que los formularios).
      d05e3a12784d: "Earned Income Tax Credit",
      "4fb90deee23f": ": un beneficio para las personas que trabajan y tienen ingresos bajos o moderados.",
      "1df1a96b87ad": "Child Tax Credit",
      "1b9a0a967159": ": un crédito para los contribuyentes con hijos dependientes.",
      "35d7ba361f63":
        "Entender los créditos tributarios puede influir de forma significativa en su declaración de impuestos.",
    },
  },

  "post.tax-implications-of-investing": {
    title: "Implicaciones fiscales de invertir",
    excerpt:
      "Explore las implicaciones fiscales de invertir y las estrategias para invertir con eficiencia fiscal.",
    spans: {
      "0dbd01536329": "Las inversiones y los impuestos",
      "9bf11750297b":
        "Invertir puede tener implicaciones fiscales importantes. Entender cómo funciona el impuesto sobre las ganancias de capital es fundamental para los inversionistas. Las ganancias de capital a corto plazo tributan a las tasas del ingreso ordinario, mientras que las de largo plazo se benefician de tasas más bajas.",
      ecafa10a7185: "Estrategias para invertir con eficiencia fiscal",
      e078c4c2c284:
        "Considere las cuentas con ventajas fiscales, como las IRA y los 401(k), para reducir al mínimo las obligaciones tributarias sobre sus inversiones.",
    },
  },

  "post.tax-planning-strategies": {
    title: "Estrategias eficaces de planificación fiscal",
    excerpt:
      "Explore estrategias eficaces de planificación fiscal para reducir al mínimo sus obligaciones tributarias.",
    spans: {
      "6b7d9e56d05b": "Estrategias de planificación fiscal",
      "68af4493d150":
        "Una planificación fiscal eficaz es fundamental tanto para las personas como para los negocios. Consiste en analizar su situación financiera para reducir al mínimo las obligaciones tributarias. Las estrategias pueden incluir diferir ingresos, maximizar las deducciones y aprovechar los créditos tributarios.",
      "47f7adbe5a8e": "Por qué importa la planificación fiscal",
      "0f8904da2378":
        "Una planificación fiscal adecuada puede generar ahorros significativos y asegurar el cumplimiento de las leyes tributarias. Le permite tomar decisiones informadas sobre sus inversiones y sus gastos.",
    },
  },

  "post.understanding-cryptocurrency-taxes": {
    title: "Entender los impuestos sobre las criptomonedas",
    excerpt: "Infórmese sobre las implicaciones fiscales de las transacciones con criptomonedas.",
    spans: {
      "758f82b92e19": "Las criptomonedas y los impuestos",
      "77758a8c22db":
        "A medida que las criptomonedas ganan popularidad, entender sus implicaciones fiscales es fundamental. El IRS trata las criptomonedas como propiedad, lo que significa que su venta está sujeta al impuesto sobre las ganancias de capital.",
      "7ef0c1db6533": "Cómo reportar las transacciones con criptomonedas",
      "860612851d72":
        "Es esencial llevar registros exactos de sus transacciones para reportarlas correctamente en su declaración de impuestos.",
    },
  },

  "post.understanding-sales-tax": {
    title: "Entender el Sales Tax",
    excerpt: "Conozca los conceptos básicos del Sales Tax y cómo afecta sus compras.",
    spans: {
      e45110eccb6a: "Conceptos básicos del Sales Tax",
      "1e4e8f37ea84":
        "El Sales Tax es un impuesto al consumo que se aplica a la venta de bienes y servicios. Entender cómo funciona el Sales Tax es esencial tanto para los consumidores como para los negocios. Las tasas varían según el estado y la localidad, y algunos artículos pueden estar exentos.",
      "7bbf5ef52de7": "Cómo calcular el Sales Tax",
      "1c255dd93287":
        "Para calcular el Sales Tax, multiplique el precio de compra por la tasa del Sales Tax. Ese monto se suma después al costo total del artículo.",
    },
  },

  "post.understanding-tax-deductions": {
    title: "Entender las deducciones de impuestos",
    excerpt:
      "Conozca las deducciones de impuestos y cómo pueden ayudarle a reducir sus ingresos sujetos a impuestos.",
    spans: {
      "9949bad5c4c7": "Las deducciones de impuestos, explicadas",
      a3dc44fddf0d:
        "Las deducciones de impuestos son esenciales para reducir sus ingresos sujetos a impuestos, lo que puede generar ahorros significativos. Le permiten restar ciertos gastos de sus ingresos totales y, así, disminuir la cantidad de ingresos sobre la que se pagan impuestos. Entre las deducciones habituales están los intereses hipotecarios, los intereses de préstamos estudiantiles y los gastos médicos.",
      "6c61586590b0": "Tipos de deducciones",
      "4de4e0e83bff": "Deducción estándar",
      "637b185a6bac": ": una cantidad fija en dólares que reduce los ingresos sobre los que paga impuestos.",
      "82afdc02a6b8": "Deducciones detalladas",
      "0d902dfd697d":
        ": gastos específicos que se pueden deducir, como las contribuciones caritativas y los gastos médicos.",
      d287c38f7edc:
        "Saber para qué deducciones califica le ayuda a maximizar sus ahorros de impuestos.",
    },
  },
};

// --- construccion ----------------------------------------------------------
const posts = await sanity.fetch(
  `*[_type=="post"]|order(slug.current asc){_id, title, slug, excerpt, body, metaTitle, metaDescription}`,
);

const errores = [];
const salida = {};

if (posts.length !== 10) errores.push(`posts en Sanity: ${posts.length}, se esperaban 10`);

for (const p of posts) {
  const t = ES[p._id];
  if (!t) {
    errores.push(`${p._id}: sin traduccion`);
    continue;
  }

  const usados = new Set();

  const bodyEs = (p.body ?? []).map((bloque, i) => {
    if (bloque._type !== "block") {
      errores.push(`${p._id} bloque ${i}: _type "${bloque._type}" no soportado`);
      return structuredClone(bloque);
    }
    const clon = structuredClone(bloque); // conserva style, listItem, level, markDefs, _key
    clon.children = (bloque.children ?? []).map((span) => {
      const c = structuredClone(span); // conserva marks y _key
      if (span._type !== "span") return c;
      const es = t.spans[span._key];
      if (es === undefined) {
        errores.push(`${p._id} span ${span._key}: sin traducir -> "${span.text.slice(0, 50)}"`);
        return c;
      }
      usados.add(span._key);
      c.text = es;
      return c;
    });
    return clon;
  });

  for (const k of Object.keys(t.spans)) {
    if (!usados.has(k)) errores.push(`${p._id} span ${k}: traduccion sobrante, no existe en el original`);
  }

  salida[p._id] = {
    slug: p.slug.current,
    titleEs: t.title,
    excerptEs: t.excerpt,
    bodyEs,
    // R3: el original no tiene metaTitle/metaDescription. No se inventan.
    metaTitleEs: p.metaTitle ?? null,
    metaDescriptionEs: p.metaDescription ?? null,
  };
}

// --- validacion estructural vs original ------------------------------------
const forma = (b) =>
  (b ?? []).map((x) => ({
    _key: x._key,
    _type: x._type,
    style: x.style ?? null,
    listItem: x.listItem ?? null,
    level: x.level ?? null,
    hijos: (x.children ?? []).map((c) => ({ _key: c._key, _type: c._type, marks: c.marks ?? [] })),
  }));

for (const p of posts) {
  const es = salida[p._id];
  if (!es) continue;
  const a = JSON.stringify(forma(p.body));
  const b = JSON.stringify(forma(es.bodyEs));
  if (a !== b) errores.push(`${p._id}: la estructura de bodyEs no coincide con el original`);
  if (es.titleEs === p.title) errores.push(`${p._id}: titleEs identico al ingles`);
  if (es.excerptEs === p.excerpt) errores.push(`${p._id}: excerptEs identico al ingles`);
}

// Ningun texto ES puede quedar vacio.
for (const [id, v] of Object.entries(salida)) {
  for (const bl of v.bodyEs) {
    for (const c of bl.children ?? []) {
      if (c._type === "span" && !String(c.text).trim()) errores.push(`${id} span ${c._key}: texto vacio`);
    }
  }
}

if (errores.length) {
  console.error("FALLOS:\n" + errores.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

const destino = path.join(RAIZ, "baseline/i18n/posts-es.json");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(salida, null, 2) + "\n");

const nBloques = posts.reduce((n, p) => n + p.body.length, 0);
const nSpans = posts.reduce((n, p) => n + p.body.reduce((m, b) => m + b.children.length, 0), 0);
console.log(`OK  ${Object.keys(salida).length} posts · ${nBloques} bloques · ${nSpans} spans · ${destino}`);
