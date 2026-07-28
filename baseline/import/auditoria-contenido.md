# Auditoria de contenido — servicios

> Generado por `tools/build-import.mjs`. **Reportar, no reescribir**: es la copia
> de un despacho fiscal y cambiarla es decision del cliente (R3).

| slug | palabras | H2 | densidad fiscal |
|---|---:|---|---:|
| `audit-assistance` | 65 | Audit Stress? Let Us Be Your Defense! | 3.1% |
| `bilingual-services-english-spanish` | 66 | Seamless Service in English & Spanish – Your C | 0.0% |
| `business-incorporation-in-florida` | 73 | Your Florida Business Starts Here – Incorporat | 2.7% |
| `corporate-tax-preparation` | 426 | Tax Compliance Made Simple. Accuracy Guarantee | 11.3% |
| `employer-identification-number-application` | 67 | Fast and Reliable EIN Services – Get Your Busi | 6.0% |
| `financial-statement-preparation` | 63 | Professional Financial Statements for Better B | 4.8% |
| `itin-application-irs-tax-id` | 58 | ITIN Services Made Simple – Get Compliant Quic | 8.6% |
| `monthly-bookkeeping-accounting` | 67 | Stay Organized and In Control with Expert Book | 6.0% |
| `notary-public-services` | 57 | Certified Notary Services You Can Trust! | 3.5% |
| `personal-tax-preparation` | 219 |  | 13.2% |
| `representation-before-the-irs` | 85 | Your Advocate Against the IRS – Stress-Free Re | 9.4% |
| `sales-tax-filing-7k40q` | 68 | Sales Tax Compliance Made Easy – Stay Ahead of | 8.8% |

Mediana: **67 palabras**, densidad fiscal **6.0%**.

## Desviaciones respecto al cohorte

- **`audit-assistance`** — densidad fiscal 3.1% frente a mediana 6.0%
- **`bilingual-services-english-spanish`** — densidad fiscal 0.0% frente a mediana 6.0%
- **`business-incorporation-in-florida`** — densidad fiscal 2.7% frente a mediana 6.0%
- **`corporate-tax-preparation`** — 426 palabras frente a mediana 67
- **`personal-tax-preparation`** — 219 palabras frente a mediana 67

## Hallazgo grave: `personal-tax-preparation` sirve contenido corporativo

Verificado leyendo el cuerpo, no inferido de la densidad. El texto **abre
literalmente** con:

> 💼 Full-Service **Corporate** Tax Preparation

y a partir de ahí describe formularios **1120 y 1120-S**, S Corporations,
C Corporations, LLC multi-socio, partnerships (1065) y «U.S.-based businesses
with foreign ownership». Recuento: 10 menciones de *corporate/business/company*
frente a 6 de *personal/individual*.

Es decir, la página de **impuestos personales** describe el servicio de
**impuestos corporativos**. Está así en producción ahora mismo: un contribuyente
particular que busca preparación de su declaración personal aterriza en una
página que le habla de declaraciones de sociedades.

No es copia duplicada de la página corporativa (Jaccard 0.32, solo 2 frases
literales compartidas de 6+ palabras): es texto corporativo *distinto* colocado
en el sitio equivocado.

**No se corrige aquí.** Es la copia de un despacho fiscal y reescribirla es
decisión del cliente (R3). Se migra tal cual y se reporta.

## Nota sobre longitudes

`corporate-tax-preparation` (426 palabras) y `personal-tax-preparation` (219)
se salen del cohorte, que tiene mediana 67. Las otras diez son fichas cortas de
~60-85 palabras con la misma plantilla: H2 gancho, párrafo, lista de
beneficios, FAQs. Las dos largas usan emojis y checkmarks — otra plantilla
distinta. Conviene decidir con el cliente si el objetivo es homogeneizar.
