# Copy + SEO local — investigación (FASE 0)

Accounting Max Services, Inc. · accountingmaxservices.com
Fecha: 2026-07-28 · Rama: `contenido/copy`

Este documento fija lo que se sabe **con dato** y lo que se asume **con criterio**,
y separa las dos cosas de forma explícita. Todo lo marcado `HIPÓTESIS` es un juicio
razonado sin respaldo de Search Console, no un dato.

---

## 0. Resumen ejecutivo

| | |
|---|---|
| Páginas de servicio que son plantilla vacía | **10 de 12** (56–84 palabras) |
| `metaTitle` / `metaDescription` en inglés | **0 de 12** |
| Palabras EN en las 12 páginas hoy | **1.348** |
| Objetivo tras la FASE 2 | **≈ 8.350** |
| Conflicto de NAP en el héroe | «Tamarac, FL» × 5 sitios en `src/` |
| Afirmaciones falsas de antigüedad | «since 2009» × 3, «15+ Years» × 2 |
| Datos de Search Console disponibles | **cero filas en 16 meses** (§1) |

El hueco de mercado más claro no es «tax preparation» —ahí están H&R Block y media
docena de despachos locales— sino **la intersección de trámite de estatus fiscal y
español**: ITIN, EIN, incorporación y Notary Public explicados en las dos lenguas.
Es donde el SERP local está más vacío y donde la clientela del despacho ya está.

---

## 1. (a) Datos de búsqueda reales — qué hay y qué no

### Corrección de un supuesto heredado

`entrega/blog-investigacion.md:11-26` y `DECISIONS.md` B1 dan por hecho que Search
Console devuelve `403 "User does not have sufficient permission"` para este
dominio, y de ahí concluyen que la propiedad no está verificada. **Es incorrecto.**
La sesión anterior consultó con la cuenta Composio por defecto, que resuelve a AB
Aluminum y por tanto no ve este dominio.

Con la cuenta correcta (`Accounting-max-services`):

```
GET /webmasters/v3/sites
→ { "siteEntry": [ { "siteUrl": "sc-domain:accountingmaxservices.com",
                     "permissionLevel": "siteOwner" } ] }
```

**La propiedad existe, es de dominio (`sc-domain:`) y estamos como `siteOwner`.**

### Lo que devuelve

| Consulta | Ventana | Resultado |
|---|---|---|
| `searchAnalytics` sin dimensión | 2025-03-01 → 2026-07-25 | sin filas |
| `searchAnalytics` dimensión `date` | 16 meses | **0 filas** |
| `searchAnalytics` dimensión `query` | 16 meses | **0 filas** |
| `searchAnalytics` dimensión `page` | 16 meses | **0 filas** |
| `searchAnalytics` dimensión `date` | últimos 12 días | **0 filas** |
| `/sitemaps` | — | **`{}`** — ningún sitemap enviado |
| GA4 `accountSummaries` | — | **vacío** — ninguna propiedad accesible |

### Qué significa

1. **No hay ni una keyword real que usar.** Cero impresiones registradas en 16
   meses. Toda la sección §2 es hipótesis y va marcada como tal.
2. **B1 pierde la urgencia que declara.** El argumento era «GSC nunca rellena hacia
   atrás, cada día sin verificar es baseline perdido para siempre». La propiedad ya
   está verificada, así que el reloj ya arrancó. Lo que falta es enviar el sitemap
   (`https://www.accountingmaxservices.com/sitemap-index.xml`) → `copy-propuestas.md`.
3. **No habrá comparación antes/después del cutover.** Sin analítica y sin
   histórico de GSC, la única medida posible es a partir de hoy. Conviene decirlo
   al cliente antes, no después.

> Nota metodológica para quien repita esto: `composio execute` resuelve mal el
> toolkit cuando el slug lleva guiones bajos (`GOOGLE_SEARCH_CONSOLE_*` → toolkit
> `google`), y `--account` falla con «No connected account matched». La vía que sí
> funciona es `composio run` con `await proxy("google_search_console", { account:
> "Accounting-max-services" })` y el cuerpo como **objeto**, no como string.

---

## 2. (b) SEO local

### Sede y zona

**Sede — única, y no admite ambigüedad:** 1700 N University Dr STE 210, Coral
Springs, FL 33071 (Broward County). Fuente de verdad: `NEGOCIO` en
`src/lib/sanity.ts:138-149`.

**Zona atendida** (aparece como cobertura, nunca como sede, y nunca las 8 juntas en
un pie de página): Coral Springs, Coconut Creek, Parkland, Margate, Tamarac,
Sunrise, Pompano Beach, Fort Lauderdale.

### El conflicto de NAP a corregir

El héroe de la portada dice «serving clients in **Tamarac, FL** and across the
U.S.», mientras la dirección, el H2 de la portada, el pie y el JSON-LD dicen Coral
Springs. Para Google eso es una señal local contradictoria en la página más
importante del sitio. Las 5 apariciones en `src/`:

| # | Fichero:línea | Qué es |
|---|---|---|
| 1 | `src/lib/i18n.ts:64` | `meta.homeDescription` (EN) |
| 2 | `src/lib/i18n.ts:196` | `home.heroIntro` (EN) |
| 3 | `src/lib/i18n.ts:411` | `meta.homeDescription` (ES) |
| 4 | `src/lib/i18n.ts:527` | `home.heroIntro` (ES) |
| 5 | `src/pages/index.astro:123` | `const ENTRADA` — alimenta a la vez el `<div>` visible y la meta description |

`baseline/html/index.html:3` también lo tiene, pero **no se toca**: es el oráculo
de paridad, no código vivo.

### Auditoría de NAP — resultado

**El NAP renderizado está limpio.** No hay ni un teléfono, correo o dirección
escritos a mano en ninguna página ni en `i18n.ts`: los 18 puntos de consumo
interpolan desde `NEGOCIO`. La casing `STE 210` es consistente en todo el repo —
cero apariciones de `Ste 210`, `Suite 210` o `#210`.

Divergencias reales encontradas, ninguna crítica:

| Divergencia | Dónde | Canónico |
|---|---|---|
| `1700 N University Drive` sin `STE 210` | alt de about-us, EN (`i18n.ts:295`) y ES (`:613`), `about-us.astro:170` | `1700 N University Dr STE 210` |
| `(754) 244-3993` sin `+1` | cuerpo del post `understanding-sales-tax`, EN y ES | `+1 (754) 244-3993` |

La segunda es de otro encargo (blog) → va a `copy-propuestas.md`, no la toco.

### Keyword objetivo por página · `HIPÓTESIS`

Una principal por página. Sin datos de GSC, el criterio es: intención comercial
observable en el SERP + coherencia con lo que el despacho hace de verdad.

| Página | Keyword principal (EN) | Keyword principal (ES) |
|---|---|---|
| `itin-application-irs-tax-id` | ITIN application Coral Springs FL | solicitud de ITIN en español Coral Springs |
| `employer-identification-number-application` | EIN application Florida | cómo sacar un EIN en Florida |
| `business-incorporation-in-florida` | form an LLC in Florida Coral Springs | abrir una LLC en Florida |
| `personal-tax-preparation` | tax preparation Coral Springs FL | preparación de impuestos Coral Springs |
| `corporate-tax-preparation` | corporate tax preparation Coral Springs FL | impuestos corporativos Coral Springs |
| `sales-tax-filing-7k40q` | Florida sales tax filing service | presentación de Sales Tax en Florida |
| `monthly-bookkeeping-accounting` | bookkeeping services Coral Springs FL | contabilidad mensual Coral Springs |
| `financial-statement-preparation` | financial statement preparation Florida | estados financieros para préstamos |
| `representation-before-the-irs` | IRS representation Coral Springs FL | representación ante el IRS en español |
| `audit-assistance` | IRS audit help Coral Springs FL | ayuda con auditoría del IRS |
| `notary-public-services` | Notary Public Coral Springs FL | Notary Public bilingüe Coral Springs |
| `bilingual-services-english-spanish` | bilingual accountant Coral Springs FL | contador en español Coral Springs |

**Restricción de plantilla que afecta a la keyword.** `servicio.title` alimenta el
`<h1>` **y** la etiqueta del nav/sidebar a la vez (`services/[slug].astro:198` y
`:311`). Meter «Coral Springs FL» en los 12 títulos rompe el menú y se lee como
spam local. Decisión: `title` corto y navegable; la keyword local completa va en
`metaTitle`, en la `intro` y en un H2 del cuerpo.

---

## 3. (c) El ángulo bilingüe — línea de posicionamiento, no coletilla

### Por qué es el activo más infravalorado del sitio

Búsqueda «contador en español Coral Springs FL impuestos»: **los resultados son de
Miami** — International CPA of Miami, TuContadorMiami, El Contador,
TuContadorFlorida, Paramount (North Miami Beach). Ni un solo despacho de Coral
Springs o del norte de Broward posicionado para la consulta en español.

Es un hueco geográfico, no de idioma: la demanda hispanohablante del norte de
Broward está siendo atendida —en términos de búsqueda— por despachos a 45 minutos.

### El detalle que casi nadie usa

**El propio IRS publica el Formulario W-7 en español: el W-7(SP).** Instrucciones
del W-7 (Rev. diciembre 2024): *«If you prefer to receive them in Spanish, submit
Form W-7(SP)»*. Poder decirle a un solicitante que su correspondencia con el IRS
puede ir en español, y tramitarlo, es concreto, verificable y prácticamente nadie
lo explica en una página de servicio.

### Cómo se aplica

- El español no es una traducción del inglés: es la misma información escrita para
  quien ya piensa en español. Traducción de verdad, no calco.
- Términos que se quedan en inglés (D3, y `i18n.ts:20-31` lo aplica en código):
  IRS · Enrolled Agent (EA) · CPA · ITIN · EIN · LLC · S-Corp · C-Corp · W-2 ·
  1099 · Sales Tax · Form 1040 / 1120 / 1120-S / 1065 · **Notary Public**.
- **«Notary Public» NUNCA como «notario».** En Florida está tipificado como
  infracción que un notary se anuncie así en español, porque en Latinoamérica el
  término designa a un abogado. Afecta directamente a `notary-public-services`.
- Registro: **usted**, sin mezclar con tú.

### El techo que hay que conocer

Las 20 rutas `/es/` están hoy con `noindex`, fuera del sitemap, con `Disallow:
/es/` en `robots.txt`, sin `hreflang` y **sin un solo enlace entrante** (no existe
selector de idioma). Es deliberado (R6) hasta que se firme D3.

**El español se escribe igual** —lo exige el criterio 8 y el build ES revienta si
falta un campo `*Es`— pero conviene saber que hoy no rinde SEO. El plan de
desbloqueo va a `copy-propuestas.md`.

---

## 4. (d) La credencial vende — pero con honestidad

### El argumento

Fuente: irs.gov, *Enrolled Agent Information*, verbatim:

> «An enrolled agent is a person who has earned the privilege of representing
> taxpayers before the Internal Revenue Service by either passing a three-part
> comprehensive IRS test covering individual and business tax returns, or through
> experience as a former IRS employee.»

> «Enrolled agents, like attorneys and certified public accountants (CPAs), have
> **unlimited practice rights**. This means they are unrestricted as to which
> taxpayers they can represent, what types of tax matters they can handle, and
> which IRS offices they can represent clients before.»

Traducido a lenguaje de cliente: **quien solo rellena formularios no puede
representarle si el IRS escribe. Un EA sí.** Es la distinción más útil y menos
explicada del sector.

### Y ahora la honestidad

El encargo asume que «la mayoría de la competencia local no lo es [EA]». Es cierto
frente a las cadenas y los bookkeepers, **pero no es un diferenciador exclusivo en
Coral Springs**. El SERP devuelve al menos tres competidores locales que ya se
anuncian como EA:

- John Masselli Enrolled Agent Inc (`sfl.tax`) — Coral Springs
- Serenity Tax Assistance — Coral Springs, EA declarado
- Ultra Care Tax — Coral Springs, «Enrolled Agents licensed by the IRS»

**Conclusión operativa:** el diferenciador no es «somos EA». Es la combinación —
**EA y CPA en la misma firma, trabajando en inglés y español**— más el hecho de
*explicar* qué significa la representación ilimitada, que ninguno de los tres
anteriores hace en su copia. Se escribe así, y no se afirma exclusividad.

---

## 5. (e) SERP real por servicio → longitud objetivo

Metodología: la misma de `entrega/blog-investigacion.md` §(b), para que las dos
mitades del sitio se midan igual. Se clasifica cada SERP por **quién lo ocupa**, y
de ahí sale la longitud: contra un directorio se gana con utilidad, contra una
cadena con especificidad local, contra un despacho especializado no se gana por
longitud y conviene no fingir que sí.

### Los cuatro patrones observados

| Patrón | Quién ocupa el SERP | Cómo se gana | Longitud |
|---|---|---|---|
| **A · Directorio + cadena** | Yelp, Thumbtack, BBB, Thervo, H&R Block, Block Advisors | Utilidad concreta: documentos, plazos, qué pasa si no lo haces | 700–800 |
| **B · Vacío local** | resultados de otra ciudad, o solo agregadores | Especificidad local y de idioma; se gana barato | 550–700 |
| **C · Especialista** | despachos de resolución fiscal, bufetes | No se compite de frente: se capta al cliente que ya está | 700–800 |
| **D · Fuente oficial** | floridarevenue.com, irs.gov, SaaS (TaxValet, Avalara) | Se gana en la consulta de seguimiento, con el ángulo local | 700–750 |

### Tabla por página

| Página | Hoy | SERP observado | Patrón | Objetivo |
|---|--:|---|:--:|--:|
| `itin-application-irs-tax-id` | 60 | H&R Block, Block Advisors, Yelp. **Ninguna firma local independiente con página de ITIN** | A/B | **800** |
| `representation-before-the-irs` | 84 | Ultra Care Tax, Serenity, East Coast Tax, Victory Tax Lawyers — SERP más competido | C | **800** |
| `business-incorporation-in-florida` | 73 | Bufetes (Fornaro P.A.), servicios nacionales (Bizee, FL Incorporation Service), Sunbiz | A/D | **750** |
| `personal-tax-preparation` | 244* | H&R Block, Yelp, BBB, Ash Consulting, Beir, 1040 Tax Center | A | **750** |
| `sales-tax-filing-7k40q` | 66 | floridarevenue.com, TaxValet, guías de CPA. Comercial local casi vacío | D | **750** |
| `monthly-bookkeeping-accounting` | 64 | Venti, Tides, RemoteBooksOnline, Beir, 1040 Tax Center — local competido | A/C | **700** |
| `audit-assistance` | 64 | Solapa con representación; mismos especialistas | C | **700** |
| `corporate-tax-preparation` | 438 | Block Advisors, despachos locales | A | **700** |
| `bilingual-services-english-spanish` | 68 | **Resultados de Miami, ninguno de Broward** | B | **650** |
| `employer-identification-number-application` | 68 | Bizee, servicios de formación, irs.gov | D | **600** |
| `financial-statement-preparation` | 63 | Poca competencia local; consulta B2B de bajo volumen | B | **600** |
| `notary-public-services` | 56 | UPS Store, Pak Mail, Yelp, notarios móviles. **Bilingüe: lo más cercano está en Coral Gables** | B | **550** |
| **Total** | **1.348** | | | **≈ 8.350** |

\* `personal-tax-preparation` tiene 244 palabras **de copia corporativa**: su
`intro`, su primer H3 («💼 Full-Service Corporate Tax Preparation») y su cuerpo
hablan de LLC, S-Corp y C-Corp en una página de impuestos personales. No es una
página «que ya estaba bien»: se reescribe entera.

### Por qué ninguna pasa de 800

El techo es deliberado y consistente con el que el blog ya justificó (1.100 para el
post más largo): **una firma de este tamaño tiene que poder mantener esto cuando
las cifras cambien en enero.** Doce páginas de 1.500 palabras con datos fiscales
dentro se quedan desactualizadas y se convierten en un pasivo. Se escribe la
longitud que la consulta necesita, no la que impresiona.

---

## 6. Restricciones de plantilla verificadas en código

Escribo para `src/pages/services/[slug].astro` y su gemelo ES. Lo que la plantilla
permite y lo que no:

| | |
|---|---|
| **H1** | Sale de `servicio.title`. **Es el único H1.** El cuerpo no debe abrir con un titular repetido. |
| **Encabezados del cuerpo** | `h2` → `<h2>`, `h3` → `<h3>`, `h4` → `<h4>`. Un `h1` en el cuerpo se degrada a `<h2>`. |
| **Listas** | `<ul>` / `<ol>` con anidamiento por `level`. Funcionan. |
| **Tablas** | **No existen** en `blockContent` (`src/sanity/schemas.mjs:11`). Todo dato tabular va como lista. |
| **Enlaces internos** | Funcionan: `hrefSeguro()` acepta `^[/#]`. Un `markDef` de tipo `link` con `href: "/services/<slug>"` sale como `<a>` limpio sin `rel`. |
| **`intro`** | Se pinta bajo el H1 **y** se usa como meta description si `metaDescription` está vacío. Tiene que funcionar en los dos sitios. |
| **CTA** | Dos, hardcodeadas, ambas a `/contact-us`. No se puede poner una CTA por servicio en la plantilla; la CTA específica va **dentro del cuerpo**. |
| **Bloques vacíos** | Se descartan al renderizar. |
| **Ruta ES** | `requiereEs()` **aborta el build** si falta `titleEs`, `introEs`, `bodyEs`, `metaTitleEs` o `metaDescriptionEs`. No hay fallback silencioso al inglés. |

Límites del esquema: `metaTitle` máx. 60, `metaDescription` máx. 160. El encargo
pide ≤155 en descripción: se aplica 155.

---

## 7. Enlazado interno — mapa

Los cuerpos enlazan entre sí dentro del texto, no en una lista de «servicios
relacionados» (la plantilla ya pinta los 12 en el sidebar).

| Desde | Enlaza a | Dónde, y por qué ahí |
|---|---|---|
| ITIN | EIN, incorporación, personal tax | al explicar que el ITIN es para personas y el EIN para negocios |
| EIN | incorporación, corporate tax, sales tax | al explicar qué hace falta después del EIN |
| Incorporación | EIN, sales tax, bookkeeping, corporate tax | en la secuencia de puesta en marcha |
| Personal tax | ITIN, representación | al hablar de quien no tiene SSN, y de qué pasa si llega carta |
| Corporate tax | bookkeeping, financial statements, sales tax | los libros son la entrada de la declaración |
| Sales tax | incorporación, bookkeeping | registro previo y control mensual |
| Bookkeeping | financial statements, corporate tax | los estados salen de los libros |
| Financial statements | bookkeeping, corporate tax | íd. en sentido inverso |
| Representación | audit assistance, personal tax | son el mismo problema en dos fases |
| Audit assistance | representación, bookkeeping | la defensa se apoya en los registros |
| Notary | incorporación, ITIN | documentos que hay que firmar ante notary |
| Bilingual | ITIN, personal tax, representación | los tres de mayor demanda hispanohablante |

`entrega/blog-investigacion.md` §(c) ya fija los enlaces post → servicio en sentido
contrario. Los tres servicios sin post que lo alimente siguen siendo **ITIN, EIN y
Notary Public**, que son justamente los de mayor intención comercial para la
clientela hispanohablante.

---

## 8. Reglas de hecho — cómo se escriben

### Antigüedad

La firma existe **desde 2019**. Los 17+ años son **experiencia profesional
acumulada del equipo**, no antigüedad de la firma.

- ✅ EN: «founded in 2019» · «over 17 years of combined professional experience»
- ✅ ES: «fundada en 2019» · «más de 17 años de experiencia profesional acumulada»
- ❌ «17 years serving Coral Springs», «17 years in business», «since 2009», «15+ Years Serving»

**No existe la cadena «17 years» en el repo.** Las afirmaciones falsas reales son
otras cuatro, y hay que nombrarlas para poder matarlas:

| Cadena | Fichero:línea | Por qué es falsa |
|---|---|---|
| `"we've proudly supported our clients since 2009"` | `i18n.ts:298` (EN) | 2009→2026 = 17 años de firma |
| `"we've proudly supported our clients since 2009"` | `about-us.astro:186` | íd. (duplicado EN) |
| `"acompañamos con orgullo a nuestros clientes desde 2009"` | `i18n.ts:615` (ES) | íd. |
| `"✔️ 15+ Years Serving U.S. and International Clients"` | cuerpo CMS de `personal-tax-preparation` | antigüedad de firma, y contradice a «2009» |
| `"✔️ 15+ años atendiendo a clientes…"` | `servicios-es.json:2236` | íd. |

### Cifras

Toda cifra fiscal con año y fuente de irs.gov o floridarevenue.com. Sin fuente, no
va. Mejor sin cifra que con una de 2019.

### Prohibido

Estadísticas, casos de cliente, testimonios y premios inventados. Promesas de
resultado («le ahorramos miles», «reembolso garantizado»). Acreditaciones no
verificadas. D5 además prohíbe emitir `Review` o `aggregateRating` en JSON-LD.

---

## 9. Lo que NO conseguí, y lo que necesita decisión

| Asunto | Estado |
|---|---|
| **Keywords con dato real** | Imposible: 0 filas en GSC en 16 meses. Todo §2 es hipótesis marcada. |
| **Volumen de búsqueda** | Sin acceso a herramienta de volumen. Las prioridades salen de la composición del SERP, no de volumen estimado. |
| **¿Es el despacho Certifying Acceptance Agent (CAA)?** | **Bloqueante para la página de ITIN.** Un CAA autentica los documentos y los devuelve en la cita, así el cliente no manda su pasaporte al IRS. Es el argumento más potente de esa página — y una afirmación falsa si no lo son. Escribo la página sin afirmarlo; si lo son, se añade. → `copy-revision-fiscal.md` |
| **Honorarios** | No hay tarifas publicadas ni facilitadas. El SERP muestra $100–$500 por declaración y $110–$650/mes en bookkeeping como referencia de mercado. No se publica precio sin que lo fije el cliente. |
| **`/es/` bloqueado** | Decisión tomada: se escribe el español, no se toca el bloqueo. El desbloqueo va a `copy-propuestas.md` y depende de D3. |
| **Meta de las 20 rutas de blog** | Fuera de alcance por decisión: otra sesión las está reescribiendo. Cubro las 34 restantes. |
