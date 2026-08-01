// Los 12 servicios agrupados en 3 familias — FASE 2 del rediseño.
//
// POR QUE: la portada mostraba los 12 en una rejilla plana de tarjetas
// idénticas. Doce opciones del mismo peso visual son cero opciones: quien llega
// no elige, se va. Y en móvil esa rejilla es la causa principal de que la
// portada midiera 9.943 px de alto — unas 24 pantallas de scroll
// (entrega/fase0-baseline.md §5).
//
// El agrupado va por SLUG y no por título porque el slug es el mismo en las dos
// lenguas: así /es hereda la agrupación sin duplicar nada y sin poder divergir.
// Los nombres de las familias sí se traducen, y viven en i18n.ts (home.familias)
// en el mismo orden que este array.
//
// El campo `feature` de Sanity NO se usa aquí. Servía para reproducir el orden
// de "Destacado" de Webflow en la rejilla plana, y esa rejilla ya no existe.
// Se deja intacto en el CMS: no se toca Sanity desde el rediseño.

/** Slugs por familia, en el orden en que se pintan dentro de su tarjeta. */
export const FAMILIAS: readonly (readonly string[])[] = [
  // 1 · Impuestos — lo que trae a la mayoría, y lo que compra la campaña.
  ["personal-tax-preparation", "corporate-tax-preparation", "sales-tax-filing-7k40q"],

  // 2 · Su empresa — el ciclo de vida de un negocio, en el orden en que ocurre:
  //     se constituye, saca sus números de identificación, y luego lleva libros.
  [
    "business-incorporation-in-florida",
    "employer-identification-number-application",
    "itin-application-irs-tax-id",
    "monthly-bookkeeping-accounting",
    "financial-statement-preparation",
  ],

  // 3 · IRS y respaldo — a lo que se acude cuando algo ya salió mal, más los
  //     dos servicios de apoyo.
  [
    "representation-before-the-irs",
    "audit-assistance",
    "notary-public-services",
    "bilingual-services-english-spanish",
  ],
] as const;

/**
 * Reparte los servicios del CMS en las 3 familias.
 *
 * Falla en voz alta si el reparto no cubre exactamente los 12. Un servicio que
 * se cae del agrupado desaparecería de la portada Y de su enlazado interno sin
 * que nadie se entere — que es justo el modo de fallo silencioso que este
 * proyecto ya sufrió con las imágenes de los posts.
 */
export function agrupar<T extends { slug: string }>(servicios: T[]): T[][] {
  const porSlug = new Map(servicios.map((s) => [s.slug, s]));
  const grupos = FAMILIAS.map((slugs) =>
    slugs.map((slug) => {
      const s = porSlug.get(slug);
      if (!s) throw new Error(`FAMILIAS nombra un slug que no está en el CMS: "${slug}".`);
      return s;
    }),
  );

  const repartidos = grupos.flat().length;
  if (repartidos !== servicios.length) {
    const sueltos = servicios
      .filter((s) => !FAMILIAS.flat().includes(s.slug))
      .map((s) => s.slug);
    throw new Error(
      `Las 3 familias reparten ${repartidos} servicios y el CMS trae ${servicios.length}. ` +
        `Sin familia: ${sueltos.join(", ") || "(ninguno)"}. ` +
        `Añádelo a FAMILIAS en src/lib/familias.ts.`,
    );
  }

  return grupos;
}

/**
 * Los 2-3 servicios hermanos de uno dado, dentro de su misma familia.
 *
 * SUSTITUYE A la caja «Global Financial Solutions», que repetia los DOCE
 * servicios en cada una de las 24 fichas y ocupaba —medido en el barrido de la
 * fase 0— la mitad exacta del cuerpo. Devolver al menu completo a quien ya
 * eligio es el patron que mata la conversion en una landing de campana: quien
 * llega buscando EIN quiere despues incorporacion y contabilidad, no la lista
 * entera otra vez.
 *
 * Si el servicio no estuviera en ninguna familia devuelve [] en vez de fallar:
 * aqui un hueco es una seccion que no se pinta, no una pagina rota. El aserto
 * duro vive en agrupar(), que es donde se construye la portada.
 */
export function relacionados<T extends { slug: string }>(
  servicios: T[],
  slug: string,
  cuantos = 3,
): T[] {
  const familia = FAMILIAS.find((f) => f.includes(slug));
  if (!familia) return [];
  const porSlug = new Map(servicios.map((s) => [s.slug, s]));
  return familia
    .filter((s) => s !== slug)
    .map((s) => porSlug.get(s))
    .filter((s): s is T => Boolean(s))
    .slice(0, cuantos);
}
