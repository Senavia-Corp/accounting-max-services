# Copy de servicios — antes / después

Generado desde los ficheros compilados, no transcrito a mano. Reproducible con
`node tools/services-build.mjs --check --tabla`.

«Antes» = el cuerpo importado de Webflow (`baseline/import/docs.json`), que es lo que
sigue hoy en Sanity y en producción: **nada de esto se ha empujado al CMS**.

| Página | Palabras EN | Palabras ES | Encabezados | Enlaces a servicios | metaTitle | metaDesc | Keyword objetivo (hipótesis) |
|---|--:|--:|--:|--:|--:|--:|---|
| `sales-tax-filing-7k40q` | 66 → **1327** | **1469** | 1 → **8** | 0 → **3** | 0 → **48** | 0 → **135** | Florida sales tax filing service |
| `personal-tax-preparation` | 244 → **1196** | **1300** | 6 → **7** | 0 → **3** | 0 → **44** | 0 → **145** | tax preparation Coral Springs FL |
| `employer-identification-number-application` | 68 → **1196** | **1344** | 1 → **6** | 0 → **3** | 0 → **46** | 0 → **144** | EIN application Florida |
| `itin-application-irs-tax-id` | 60 → **1190** | **1252** | 1 → **8** | 0 → **4** | 0 → **54** | 0 → **145** | ITIN application Coral Springs FL |
| `representation-before-the-irs` | 84 → **1164** | **1263** | 1 → **7** | 0 → **3** | 0 → **46** | 0 → **144** | IRS representation Coral Springs FL |
| `business-incorporation-in-florida` | 73 → **1064** | **1176** | 1 → **7** | 0 → **4** | 0 → **41** | 0 → **137** | form an LLC in Florida Coral Springs |
| `financial-statement-preparation` | 63 → **1005** | **1078** | 1 → **6** | 0 → **2** | 0 → **50** | 0 → **131** | financial statement preparation Florida |
| `notary-public-services` | 56 → **1003** | **1103** | 1 → **6** | 0 → **2** | 0 → **50** | 0 → **135** | Notary Public Coral Springs FL |
| `audit-assistance` | 64 → **998** | **1078** | 1 → **8** | 0 → **3** | 0 → **50** | 0 → **142** | IRS audit help Coral Springs FL |
| `bilingual-services-english-spanish` | 68 → **992** | **1090** | 1 → **6** | 0 → **3** | 0 → **47** | 0 → **141** | bilingual accountant Coral Springs FL |
| `corporate-tax-preparation` | 438 → **984** | **1103** | 6 → **7** | 0 → **4** | 0 → **42** | 0 → **137** | corporate tax preparation Coral Springs FL |
| `monthly-bookkeeping-accounting` | 64 → **918** | **1034** | 1 → **7** | 0 → **3** | 0 → **47** | 0 → **134** | bookkeeping services Coral Springs FL |
| **TOTAL** | **1348 → 13037** | **14290** | | | | | |

Las 12 metaTitle ≤ 60 caracteres y las 12 metaDescription ≤ 155, únicas entre sí y en
los dos idiomas. Antes eran **0 de 12** en inglés: el `<title>` se componía por defecto
como `«Título | Accounting Max Services»` y la meta description era la `intro` en crudo.
