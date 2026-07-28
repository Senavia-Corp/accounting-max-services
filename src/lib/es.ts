// R5 — SIN FALLBACK SILENCIOSO AL INGLES.
//
// Lo unico que hace este modulo es negarse a servir ingles bajo una URL /es/.
// Si un campo *Es requerido esta vacio, el BUILD CAE y dice que documento es.
//
// POR QUE ES LO MAS IMPORTANTE DE LA FASE 5. El fallback silencioso no da
// error, no da aviso y no rompe nada visible: la pagina se construye, se
// despliega y se sirve. Simplemente esta en el idioma equivocado. Asi es como
// 32 de 47 paginas de AB Aluminum estuvieron meses sirviendo el H1 en ingles
// bajo rutas en espanol sin que nadie lo notara — no lo detecto ningun build,
// lo detecto una persona leyendo. Aqui el modo de fallo por defecto es el
// contrario: antes de publicar una linea en el idioma equivocado, no se publica.
//
// Vive en src/lib/ y no en src/pages/es/ porque tambien lo usan los tres
// componentes del cromo (Nav, Footer, FooterSubscribe), que pintan los titulos
// de los 12 servicios en las 26 rutas ES.

import type { Lang } from "./i18n";

/**
 * Campos *Es obligatorios por tipo de documento.
 * ESPEJO EXACTO de REQ en tools/push-i18n.mjs: si las dos listas divergen, el
 * script de empuje dira que todo esta bien y el build caera igualmente.
 *
 * Los posts no llevan metaTitleEs/metaDescriptionEs a proposito: tampoco
 * existen en ingles (los 10 traen metaTitle/metaDescription vacios). La ruta
 * /es/post/<slug> los COMPONE desde titleEs y excerptEs — dato en espanol, no
 * una caida al ingles.
 */
export const REQUERIDOS = {
  service: ["titleEs", "introEs", "bodyEs", "metaTitleEs", "metaDescriptionEs"],
  post: ["titleEs", "excerptEs", "bodyEs"],
} as const;

type Doc = { _id?: string; _type?: string; slug?: string; [k: string]: any };

const vacio = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/**
 * Devuelve doc[campo] o LANZA. Nunca devuelve el equivalente ingles.
 *
 *   const titulo = requiereEs<string>(servicio, "titleEs", `/es/services/${servicio.slug}`);
 *
 * @param doc   documento de Sanity (hace falta _id: es lo que se busca en el CMS)
 * @param campo nombre del campo *Es
 * @param ruta  ruta /es/ afectada, opcional; solo mejora el mensaje
 */
export function requiereEs<T = any>(doc: Doc, campo: string, ruta?: string): T {
  const v = doc?.[campo];
  if (!vacio(v)) return v as T;

  const id = doc?._id ?? "(documento sin _id)";
  const tipo = doc?._type ?? "?";
  const slug = doc?.slug ? `, slug "${doc.slug}"` : "";
  const donde = ruta ? ` · ${ruta}` : "";
  const fuente =
    tipo === "post" ? "baseline/i18n/posts-es.json" : "baseline/i18n/servicios-es.json";

  throw new Error(
    `R5${donde}: el campo "${campo}" esta vacio y NO se cae al ingles.\n` +
      `  documento: ${id}  (${tipo}${slug})\n` +
      `  El build se aborta a proposito: publicar esta ruta serviria ingles bajo una URL /es/.\n` +
      `  Arreglo: rellenar "${campo}" en ${fuente} y ejecutar 'node tools/push-i18n.mjs',\n` +
      `           o editarlo directamente en Sanity (${tipo} · ${id}).`,
  );
}

/**
 * Comprueba de golpe todos los campos obligatorios de un documento. Se llama al
 * principio de cada plantilla ES, antes de pintar nada: mejor caer con el
 * documento entero senalado que campo a campo en tres builds seguidos.
 */
export function requiereTodoEs(doc: Doc, tipo: keyof typeof REQUERIDOS, ruta?: string): void {
  for (const campo of REQUERIDOS[tipo]) requiereEs(doc, campo, ruta);
}

/**
 * POLITICA DE SLUGS (FASE 5): los slugs NO se traducen.
 *
 * /es/services/notary-public-services, no /es/servicios/servicios-notariales.
 * Tres razones, por orden de peso:
 *   1. `sales-tax-filing-7k40q` es una URL viva e indexada y su sufijo es el
 *      desempate de Webflow (R4). Traducir el resto y no ese seria incoherente.
 *   2. Un slug por idioma duplica el numero de URLs que hay que redirigir,
 *      vigilar y canonicalizar el dia que D3 se firme y /es/ salga de noindex.
 *   3. Los slugs contienen terminos del glosario que no se traducen nunca
 *      (itin-application-irs-tax-id, notary-public-services): traducir el resto
 *      del slug dejaria mitad y mitad.
 * El prefijo /es es lo unico que cambia entre las dos lenguas.
 */
export const raiz = (lang: Lang): string => (lang === "es" ? "/es" : "");

/** Enlace a la portada. En EN es "/", en ES es "/es" (sin barra final). */
export const inicio = (lang: Lang): string => (lang === "es" ? "/es" : "/");

/** Enlace interno con el prefijo de idioma. `ruta` empieza siempre por "/". */
export const enlace = (lang: Lang, ruta: string): string => raiz(lang) + ruta;
