# Blog — investigación previa (FASE 0)

Consultas ejecutadas el **28 de julio de 2026**. Un SERP es una foto, no una constante:
si esto se relee dentro de seis meses, las posiciones habrán cambiado. Las cifras fiscales
llevan su propio año y su fuente, y viven en `blog-revision-fiscal.md`.

---

## a) Datos de búsqueda — NO se obtuvieron. Todo lo de abajo es hipótesis.

**Search Console no está disponible y no es un problema de configuración mía.**

```
GOOGLE_SEARCH_CONSOLE_LIST_SITES
→ sc-domain:abaluminumandscreen.com   (siteOwner)
→ sc-domain:abaluminumandscreens.com  (siteOwner)

GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY  site_url=sc-domain:accountingmaxservices.com
→ 403  "User does not have sufficient permission for site
        'sc-domain:accountingmaxservices.com'"
```

La cuenta de Google conectada solo posee las dos propiedades de AB Aluminum. La del cliente
**nunca se verificó**, que es exactamente el bloqueo **B1** de `DECISIONS.md`: la zona vive en
Google Cloud DNS y sin acceso no se puede publicar el TXT. `baseline/gsc/` está vacío porque
no hay nada que guardar.

**Consecuencia para este encargo, dicha sin adornos:** no hay ni una consulta real, ni una
impresión, ni una posición. Todo lo que sigue en esta sección son **hipótesis razonadas**
derivadas de tres cosas verificables — los `title`/`excerpt` reales de los 10 posts, los 12
slugs de servicio del dataset, y el perfil del despacho (Coral Springs, bilingüe,
cross-border). Ninguna es un dato. Marcadas `HIPÓTESIS` una a una para que nadie las cite
más adelante como si lo fueran.

| # | Consulta hipotética | Post | Por qué se postula |
|---|---|---|---|
| H1 | `florida sales tax filing small business` | understanding-sales-tax | El servicio `sales-tax-filing-7k40q` existe y se vende; el Sales Tax es competencia estatal |
| H2 | `broward county sales tax rate` | understanding-sales-tax | Consulta de hecho, alto volumen, respuesta verificable en el DR-15DSS |
| H3 | `what business expenses can i deduct` | navigating-business-expenses | Intención de dueño de negocio; conduce a bookkeeping |
| H4 | `tax planning coral springs` | tax-planning-strategies | El SERP local ya lo disputan 5 despachos (ver b) |
| H5 | `crypto taxes 1099-DA` | understanding-cryptocurrency-taxes | Formulario nuevo, demanda estacional real en 2026 |
| H6 | `standard deduction vs itemizing` | understanding-tax-deductions | Duda de individuo, la más masiva de las diez |
| H7 | `itin application how long` | *ninguno* | **No hay post.** Ver `blog-temas-propuestos.md` |
| H8 | `ein for foreign owned llc florida` | *ninguno* | **No hay post.** Ídem |

Que H7 y H8 no tengan post es el hallazgo más rentable de esta fase, y está fuera de alcance
por diseño: son propuestas, no posts nuevos.

---

## b) SERP real por tema, y de dónde sale la longitud

Se consultaron los diez temas con intención local (Coral Springs / Broward / South Florida).
**Salieron tres patrones**, y la longitud objetivo de cada post se deduce de cuál le toca —
no de un número redondo:

**Patrón 1 — IRS.gov ocupa las tres primeras posiciones.**
Pasa en `common tax mistakes`, `business expenses`, `capital gains`, `tax credits`,
`crypto`, `retirement limits`. Las páginas que mandan son Tax Topics y newsroom del propio
IRS: cortas, autoritativas, imbatibles en la consulta pelada. **Competir de frente es tirar
el dinero.** El hueco está en la consulta siguiente — la que el lector hace *después* de
leer al IRS y no entenderlo, o al descubrir que su caso tiene una arruga de Florida.
→ longitud media (700–900) y ángulo local obligatorio.

**Patrón 2 — SERP local comercial, sin artículos.**
`tax planning coral springs cpa` devuelve **páginas de servicio de despachos competidores**
(Block Advisors ×2, Howard CPAs, KB CPA, Venti, Beir, Complete CPA, Shaban Malik). No hay ni
un artículo largo. La profundidad media es baja: son páginas de servicio de 300–800 palabras.
→ aquí un artículo de verdad, de 800–950, gana por utilidad sin necesidad de inflarse.

**Patrón 3 — marketing de contenidos de SaaS fiscal.**
`florida sales tax` lo disputan Avalara/TaxJar y agregadores (salestaxhandbook,
salestaxguide.org, businesslicenseguide) con guías de 1.200–2.000 palabras. Son **nacionales
y genéricas**: cubren los 50 estados y no saben nada de Broward.
→ es el único tema donde conviene subir a ~1.000, y se gana por especificidad de condado,
no por extensión.

### Longitud objetivo, post a post

| post | patrón | objetivo EN | justificación |
|---|---|---|---|
| understanding-sales-tax | 3 | **950–1.100** | Único tema con soporte documental local denso: FL DOR da tipo, surtax de Broward, umbrales de frecuencia, vencimiento y regla de e-file. Se le gana a Avalara con el condado, no con palabras |
| understanding-cryptocurrency-taxes | 1 | **850–1.000** | El 1099-DA es **nuevo** (transacciones desde 1-ene-2025, estados al contribuyente antes del 17-feb-2026, base desde 2026). Hay materia real y verificable |
| navigating-business-expenses | 1 | **850–1.000** | «Ordinary and necessary» + recordkeeping + burden of proof dan tres H2 con sustancia, y arrastran al servicio de bookkeeping |
| tax-planning-strategies | 2 | **800–950** | Rival local flojo; basta con ser el único que explique en vez de vender |
| retirement-planning-and-taxes | 1 | **750–900** | Límites 2026 ya publicados + RMD; el ángulo Florida (sin impuesto estatal sobre la renta) es corto pero real |
| preparing-for-tax-season | 1 | **700–850** | Es una lista de documentos. Estirarlo lo empeora |
| common-tax-mistakes | 1 | **700–850** | El IRS ya publica la lista. El valor propio es la arruga bilingüe y de ITIN |
| tax-credits-explained | 1 | **700–850** | Las cifras caducan cada año. Cuanto más corto, más barato de mantener |
| tax-implications-of-investing | 1 | **700–850** | Holding period + NIIT 3,8 % + Florida. Tres ideas, no quince |
| understanding-tax-deductions | 1 | **700–850** | Standard vs. itemized con cifras de 2025; el ángulo SALT en Florida es el diferencial |

**Total objetivo ≈ 7.800–9.100 palabras EN, frente a las 652 de hoy.**

Nota deliberada: **ninguno pasa de 1.100.** Un despacho de este tamaño tiene que poder
mantener el blog cuando las cifras cambien en enero. Diez artículos de 2.500 palabras con
cifras dentro son diez pasivos, no diez activos.

---

## c) Mapa post → servicio

Es el mecanismo de captación: el lector llega con una duda, entiende que le supera, y
encuentra quién la resuelve. Cada post enlaza **dentro del texto**, donde la duda aparece.

| post | servicio(s) destino | dónde cae el enlace |
|---|---|---|
| understanding-sales-tax | `sales-tax-filing-7k40q` · `business-incorporation-in-florida` | al explicar frecuencia de presentación y al hablar de registrarse como dealer |
| navigating-business-expenses | `monthly-bookkeeping-accounting` · `corporate-tax-preparation` | en la sección de recordkeeping (es su dolor exacto) |
| understanding-tax-deductions | `personal-tax-preparation` | al comparar standard vs. itemized |
| tax-credits-explained | `personal-tax-preparation` | al hablar de créditos reembolsables |
| common-tax-mistakes | `audit-assistance` · `representation-before-the-irs` | al llegar a «ya presenté y estaba mal» |
| preparing-for-tax-season | `personal-tax-preparation` · `bilingual-services-english-spanish` | en la lista de documentos |
| tax-planning-strategies | `corporate-tax-preparation` · `personal-tax-preparation` | al separar planificación de preparación |
| understanding-cryptocurrency-taxes | `personal-tax-preparation` · `representation-before-the-irs` | al tratar la base de coste que el broker no reporta |
| tax-implications-of-investing | `personal-tax-preparation` · `financial-statement-preparation` | en NIIT y en cosecha de pérdidas |
| retirement-planning-and-taxes | `personal-tax-preparation` | en el tratamiento de los retiros |

**Tres de los 12 servicios se quedan sin ningún post que los alimente:**
`itin-application-irs-tax-id`, `employer-identification-number-application` y
`notary-public-services`. Son, además, los tres de mayor intención comercial para la
clientela hispanohablante e internacional del despacho. Va a `blog-temas-propuestos.md`.

---

## d) Intención y público, post a post

No le hablo igual a un jubilado de Coral Springs que a un dueño de LLC sin SSN.

| post | quién lee | qué quiere en los primeros 30 segundos | tono |
|---|---|---|---|
| understanding-sales-tax | dueño de negocio de Broward que acaba de abrir o de vender online | «¿cuánto cobro y cuándo lo presento?» | operativo, con cifras y fechas |
| navigating-business-expenses | autónomo / dueño de LLC pequeña | «¿esto lo puedo deducir?» | claro sobre el límite, sin licencias |
| tax-planning-strategies | dueño de negocio con beneficio, ya rentable | «¿qué debería estar haciendo y no hago?» | consultivo, sin promesas |
| common-tax-mistakes | contribuyente individual, muchos primerizos | «¿lo hice mal?» y «¿lo puedo arreglar?» | tranquilizador, accionable |
| preparing-for-tax-season | individuo, W-2 y 1099 mezclados | «¿qué papeles necesito?» | checklist puro |
| understanding-tax-deductions | individuo, duda anual clásica | «¿me conviene detallar?» | comparativo |
| tax-credits-explained | individuo con hijos o ingreso bajo-medio | «¿me toca dinero de vuelta?» | preciso con años, prudente con importes |
| tax-implications-of-investing | inversor particular residente en FL | «¿cuánto me van a quitar si vendo?» | explicar tenencia y NIIT |
| understanding-cryptocurrency-taxes | inversor cripto, a menudo joven, primer 1099-DA | «me llegó un formulario nuevo, ¿ahora qué?» | de actualidad, con fechas |
| retirement-planning-and-taxes | 50+, planificando el retiro en Florida | «¿cuánto pago al retirar?» | pausado, con límites del año |

**El eje bilingüe no es decorativo.** Es la clientela real del despacho y aparece de forma
natural en `preparing-for-tax-season` (documentos con el nombre exacto de la tarjeta de
Social Security), en `common-tax-mistakes` (desajuste de nombre, ITIN caducado) y en el
propio `bilingual-services-english-spanish`. Y sin embargo `/es` sigue `noindex` por **D3**:
el español se escribe bien igualmente, pero hoy no capta nada. Eso es una decisión pendiente
con coste, no un detalle técnico.

---

## Restricciones de plantilla que condicionan la redacción

Comprobadas en el código, no supuestas:

- **`body` NO admite tablas.** `blockContent` (`src/sanity/schemas.mjs:11`) declara solo
  bloques: estilos `normal/h1/h2/h3/h4`, listas `bullet` y `number` con `level`, marcas
  `strong`/`em`, y la anotación `link`. `PortableText.astro` renderiza exactamente eso.
  → Plazos, requisitos y documentos van **en listas**. Donde pedías tabla, va lista.
- **Los enlaces internos sí funcionan.** `hrefSeguro()` acepta `^[/#]`, así que un `markDef`
  `link` con `href: "/services/<slug>"` sale como `<a>` limpio, sin `rel` (correcto: interno).
- **El `<h1>` lo pone la plantilla** desde `post.title`. El cuerpo **no** debe abrir con otro
  titular: hoy los 10 abren con un bloque que repite el título, y eso es un artefacto del
  import. Los cuerpos nuevos abren con un párrafo de verdad.
- **La CTA del lateral es cromo compartido** (`src/lib/i18n.ts:363`), idéntica en las 10
  rutas y en los dos idiomas. La CTA propia de cada tema va en el **último bloque del cuerpo**.
- **El `excerpt` se ve en pantalla**, bajo el H1 (`post/[slug].astro:156`), no es solo meta.
