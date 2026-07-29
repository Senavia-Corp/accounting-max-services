# Blog — comparativa antes / después

Todo lo de aquí está **medido**, no estimado. El «antes» sale de `baseline/posts/*.json`
(el crawl de producción, única foto fiel del contenido migrado); el «después», de los
ficheros compilados. Se regenera con:

```bash
node tools/blog-build.mjs --tabla
```

---

## Resumen

| | antes | después | |
|---|---|---|---|
| palabras de cuerpo EN | **652** | **8.204** | ×12,6 |
| palabras de cuerpo ES | ~660 (traducción de los stubs) | **9.087** | ×13,8 |
| encabezados en el cuerpo | 20 (2 por post, siempre iguales) | **65** | ×3,3 |
| enlaces internos a servicio | **0** | **24** | — |
| enlaces entre posts | 0 | **7** | — |
| enlaces a fuente oficial | 0 | **1** | — |
| posts con `metaTitle` | **0 / 10** | **10 / 10** | — |
| posts con `metaDescription` | **0 / 10** | **10 / 10** | — |
| posts con meta ES | 0 / 10 | **10 / 10** | — |
| posts con `publishedAt` | 0 / 10 | 0 / 10 → se estampa en el empuje | decidido |
| posts con `authorName` | 0 / 10 | **0 / 10 — decisión del cliente** | abierto |

---

## Por post

| slug | palabras EN | palabras ES | encabezados | enlaces a servicio | meta EN |
|---|---|---|---|---|---|
| understanding-sales-tax | 69 → **937** | ~66 → **1.100** | 2 → **6** | 0 → **3** | no → **sí** |
| understanding-tax-deductions | 97 → **724** | ~95 → **768** | 2 → **6** | 0 → **2** | no → **sí** |
| tax-credits-explained | 76 → **765** | ~75 → **824** | 2 → **6** | 0 → **2** | no → **sí** |
| common-tax-mistakes | 67 → **780** | ~68 → **813** | 2 → **6** | 0 → **3** | no → **sí** |
| preparing-for-tax-season | 64 → **767** | ~65 → **843** | 2 → **8** | 0 → **3** | no → **sí** |
| tax-planning-strategies | 63 → **921** | ~64 → **1.053** | 2 → **8** | 0 → **3** | no → **sí** |
| navigating-business-expenses | 58 → **948** | ~59 → **1.062** | 2 → **8** | 0 → **3** | no → **sí** |
| understanding-cryptocurrency-taxes | 48 → **878** | ~49 → **963** | 2 → **7** | 0 → **2** | no → **sí** |
| tax-implications-of-investing | 53 → **711** | ~54 → **812** | 2 → **6** | 0 → **2** | no → **sí** |
| retirement-planning-and-taxes | 57 → **773** | ~58 → **849** | 2 → **6** | 0 → **1** | no → **sí** |
| **TOTAL** | **652 → 8.204** | **~660 → 9.087** | **20 → 65** | **0 → 24** | **0/10 → 10/10** |

### Contra los objetivos de la Fase 0

**9 de 10 dentro de la banda que justifiqué.** El único fuera es el piloto:

| slug | banda Fase 0 | real | |
|---|---|---|---|
| understanding-sales-tax | 950–1.100 | 937 | **13 por debajo** |
| understanding-cryptocurrency-taxes | 850–1.000 | 878 | ✓ |
| navigating-business-expenses | 850–1.000 | 948 | ✓ |
| tax-planning-strategies | 800–950 | 921 | ✓ |
| retirement-planning-and-taxes | 750–900 | 773 | ✓ |
| preparing-for-tax-season | 700–850 | 767 | ✓ |
| common-tax-mistakes | 700–850 | 780 | ✓ |
| tax-credits-explained | 700–850 | 765 | ✓ |
| tax-implications-of-investing | 700–850 | 711 | ✓ |
| understanding-tax-deductions | 700–850 | 724 | ✓ |

Total previsto en Fase 0: 7.800–9.100 EN. Real: **8.204**. Dentro.

Las 13 palabras que le faltan al piloto se pueden añadir en un minuto. No las añadí porque
serían relleno para cuadrar un número que yo mismo puse, que es exactamente lo que el
encargo prohíbe.

---

## Enlazado interno resultante

**24 enlaces a páginas de servicio, todos dentro del texto**, en el párrafo donde el lector
se topa con la duda. Ninguno amontonado al final. Cobertura: **9 de los 12 servicios**.

| servicio | posts que le conducen |
|---|---|
| `personal-tax-preparation` | 6 |
| `monthly-bookkeeping-accounting` | 2 |
| `corporate-tax-preparation` | 2 |
| `itin-application-irs-tax-id` | 3 |
| `sales-tax-filing-7k40q` | 1 (×2 enlaces) |
| `business-incorporation-in-florida` | 2 |
| `representation-before-the-irs` | 2 |
| `audit-assistance` | 1 |
| `bilingual-services-english-spanish` | 1 |
| `financial-statement-preparation` | 1 |
| **`employer-identification-number-application`** | **0** |
| **`notary-public-services`** | **0** |

Los dos sin cobertura están en `blog-temas-propuestos.md`. No se les puede enlazar de forma
honesta desde ninguno de los diez temas existentes sin forzar la frase.

**7 enlaces entre posts**, que antes no existían: deductions↔credits, mistakes→crypto,
tax-season→deductions, planning→retirement, planning→sales-tax, crypto→investing.

**1 enlace a fuente oficial**: el DR-15DSS del FL DOR, en el post de Sales Tax. Sale con
`rel="noopener"`, verificado en el HTML construido.

---

## Meta — longitudes reales

Todas por debajo del límite y **únicas entre sí** (lo comprueba `blog-build.mjs`, que falla
si dos coinciden).

| slug | metaTitle | metaDesc | metaTitleEs | metaDescEs |
|---|---|---|---|---|
| understanding-sales-tax | 49 | 141 | 53 | 140 |
| understanding-tax-deductions | 46 | 139 | 46 | 136 |
| tax-credits-explained | 46 | 140 | 56 | 139 |
| common-tax-mistakes | 44 | 139 | 52 | 142 |
| preparing-for-tax-season | 46 | 130 | 53 | 130 |
| tax-planning-strategies | 46 | 144 | 45 | 145 |
| navigating-business-expenses | 54 | 137 | 53 | 140 |
| understanding-cryptocurrency-taxes | 49 | 138 | 50 | 139 |
| tax-implications-of-investing | 47 | 137 | 50 | 131 |
| retirement-planning-and-taxes | 48 | 135 | 51 | 143 |

Límites: `metaTitle` ≤ 60 · `metaDescription` ≤ 155. Máximos alcanzados: **56** y **145**.

---

## Estructura EN vs. ES

El número de bloques de Portable Text coincide **exactamente** en los 10 pares. Es la
prueba mecánica de que el español es una reescritura completa y no una traducción a medias:

| slug | bloques EN | bloques ES |
|---|---|---|
| understanding-sales-tax | 32 | 32 |
| understanding-tax-deductions | 25 | 25 |
| tax-credits-explained | 24 | 24 |
| common-tax-mistakes | 24 | 24 |
| preparing-for-tax-season | 34 | 34 |
| tax-planning-strategies | 28 | 28 |
| navigating-business-expenses | 26 | 26 |
| understanding-cryptocurrency-taxes | 31 | 31 |
| tax-implications-of-investing | 27 | 27 |
| retirement-planning-and-taxes | 26 | 26 |

La proporción de palabras ES/EN va de **1,06 a 1,17**, que es lo normal en una traducción
de verdad del inglés al español. `blog-build.mjs` avisa si algún par se sale de 0,80–1,45,
porque eso delataría medio artículo sin traducir.

---

## Lo que no cambió, a propósito

- **Los `slug`.** R4: son URLs vivas e indexadas, incluido el sufijo de desempate de Webflow
  en `sales-tax-filing-7k40q`.
- **`order`, `heroImage`, `webflowItemId`.** Identidad, no contenido. Fuera de la lista
  blanca de `push-en.mjs`.
- **La CTA del lateral** (`src/lib/i18n.ts`), que es cromo compartido en las 10 rutas. La
  CTA propia de cada tema vive en el **último bloque del cuerpo**, que sí es contenido.
- **Sanity.** Nada escrito. El contenido vive en ficheros hasta que se autorice el empuje.
