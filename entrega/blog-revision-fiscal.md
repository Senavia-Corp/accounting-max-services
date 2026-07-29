# Blog — revisión fiscal previa a publicar

**Este documento es parte del entregable, no un anexo.** Ninguno de los 10 posts debería
publicarse sin que un EA o un CPA del despacho firme lo que aquí se marca.

Toda cifra del blog sale de `irs.gov` o de `floridarevenue.com`, consultada el **28 de julio
de 2026**, y lleva el año al que aplica. Donde no hubo fuente verificable, **no hay cifra** —
lo que se cayó está listado al final.

Estado: **10 de 10 redactados.**

---

## Reglas que me impuse y que se pueden auditar

1. Ninguna estadística de mercado, ningún caso de cliente, ningún testimonio. **Cero.**
2. Ninguna promesa de resultado («le ahorraremos», «pagará menos»).
3. Ningún consejo que dependa de circunstancias que el lector no ha contado. Los 10 lo dicen
   explícitamente antes de la CTA.
4. Toda cifra lleva año. Toda cifra lleva fuente.
5. Lo que no se pudo verificar en fuente primaria se cayó del texto y está abajo.

Las tres primeras son comprobables mecánicamente: `node tools/blog-build.mjs --autoprueba`
verifica el glosario y los calcos; la ausencia de estadísticas inventadas se comprueba
leyendo, y por eso cada afirmación numérica de abajo está enlazada a su fuente.

---

## Tabla maestra de fuentes

| fuente | qué sostiene | posts |
|---|---|---|
| [FL DOR — Sales and Use Tax](https://floridarevenue.com/taxes/taxesfees/pages/sales_tax.aspx) | tasa 6%, vencimiento día 1 / tardía tras el 20, umbrales de frecuencia, e-file desde $5,000 | 1 |
| [DR-15DSS, R. 11/25 (año 2026)](https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf) | Broward 1% (2019–2048); cambio de Palm Beach a 0,5% en 2026 | 1 |
| [FL DOR — Discretionary Sales Surtax](https://floridarevenue.com/taxes/taxesfees/Pages/discretionary.aspx) | condado de entrega, tope de $5,000, exclusiones | 1 |
| [FL DOR TIP 21A01-03](https://floridarevenue.com/taxes/tips/Documents/TIP_21A01-03.pdf) | umbral de $100,000 en ventas a distancia, efectivo 1-jul-2021 | 1 |
| [IRS Pub. 501 / Topic 551](https://www.irs.gov/taxtopics/tc551) | deducción estándar 2025 y quién no puede tomarla; adicional por edad o ceguera $1,600 / $2,000 | 2 |
| [IRS — Credits and deductions for individuals](https://www.irs.gov/credits-and-deductions-for-individuals) | deducción ampliada para mayores; deducciones por propinas y horas extra desde 2025 | 2 |
| [IRS — Child Tax Credit](https://www.irs.gov/credits-deductions/individuals/child-tax-credit) | CTC hasta $2,200; ACTC hasta $1,700 | 3 |
| [IRS Pub. 596 / tablas EITC](https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/earned-income-and-earned-income-tax-credit-eitc-tables) | máximo EITC $8,046 (2025) y $8,231 (2026) | 3 |
| [IRS — Education credits AOTC y LLC](https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-and-llc) | AOTC hasta $2,500, 40% reembolsable hasta $1,000; LLC hasta $2,000, no reembolsable | 3 |
| [IRS — Common tax return mistakes](https://www.irs.gov/newsroom/common-tax-return-mistakes-that-can-cost-taxpayers) | la lista de errores frecuentes | 4 |
| [IRS Topic 857 / renovación de ITIN](https://www.irs.gov/tin/itin/how-to-renew-an-itin) | inactividad por tres años consecutivos; Form W-7 | 3, 4, 5 |
| [IRS — Instrucciones del Form 1040-X](https://www.irs.gov/instructions/i1040x) | un 1040-X por cada año enmendado | 4 |
| [IRS — Get an extension to file](https://www.irs.gov/filing/get-an-extension-to-file-your-tax-return) | 15-abr-2026 → 15-oct-2026 con Form 4868; la prórroga no es para pagar | 5 |
| [IRS — How long should I keep records](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) | regla general de tres años; excepciones de costo base | 5, 7 |
| [IRS Topic 306 / pago insuficiente](https://www.irs.gov/payments/underpayment-of-estimated-tax-by-individuals-penalty) | fechas de estimados; 90% / 100% / 110% sobre $150,000; mínimo de $1,000 | 6 |
| [IRS — Qualified business income deduction](https://www.irs.gov/newsroom/qualified-business-income-deduction) | deducción del 20% de la Sección 199A | 6 |
| [IRS Topic 511 / Guide to business expense resources](https://www.irs.gov/forms-pubs/guide-to-business-expense-resources) | «ordinary and necessary»; gastos personales no deducibles | 7 |
| [IRS — Burden of proof](https://www.irs.gov/businesses/small-businesses-self-employed/burden-of-proof) | evidencia documental; se le pedirá explicar lo reportado | 7 |
| [IRS Notice 2026-10 / tarifas estándar](https://www.irs.gov/newsroom/irs-sets-2026-business-standard-mileage-rate-at-725-cents-per-mile-up-25-cents) | 72,5 centavos por milla en 2026 | 7 |
| [IRS — Simplified option for home office](https://www.irs.gov/businesses/small-businesses-self-employed/simplified-option-for-home-office-deduction) | $5.00/pie², máx. 300 pies², máx. $1,500; incompatible con depreciación y §179 | 7 |
| [IRS — About Form 1099-DA](https://www.irs.gov/forms-pubs/about-form-1099-da) · [regulaciones finales](https://www.irs.gov/newsroom/final-regulations-and-related-irs-guidance-for-reporting-by-brokers-on-sales-and-exchanges-of-digital-assets) | ingresos brutos desde 1-ene-2025; costo base desde 1-ene-2026; estados antes del 17-feb-2026; alivio transitorio; brokers de EE. UU. | 8 |
| [IRS — Digital assets](https://www.irs.gov/filing/digital-assets) | la pregunta obligatoria del 1040; minería y staking como ingreso ordinario a valor de mercado en Schedule 1 | 4, 8 |
| [IRS Topic 409](https://www.irs.gov/taxtopics/tc409) | tenencia de más de un año; 0/15/20%; máximos del 28% y del 25%; traslado de pérdidas | 9 |
| [IRS Topic 559 / NIIT](https://www.irs.gov/individuals/net-investment-income-tax) | recargo del 3,8%; umbrales $250,000 / $200,000 / $125,000 | 9 |
| [IRS — Límites 2026 de planes de jubilación](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500) | 401(k) $24,500; catch-up $8,000 y $11,250; IRA $7,500 y $1,100; rangos Roth | 10, 6 |
| [IRS — RMD](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-required-minimum-distributions-rmds) | edad 73; sin RMD en Roth IRA en vida del titular | 10 |

---

## Afirmaciones de criterio — las que necesitan firma de un EA o CPA

No son cifras. Son juicios, y por eso no basta con enlazar una fuente. **Estas son las que
de verdad hay que leer antes de publicar.**

| # | post | afirmación | por qué la marco |
|---|---|---|---|
| C-1 | sales-tax | «La frecuencia no se elige» y el estado reasigna al cruzar umbral | Correcto como principio, pero el **mecanismo exacto** (de oficio, con aviso previo, desde qué periodo) no lo verifiqué en fuente primaria |
| C-2 | sales-tax | «Presentar con el calendario antiguo es presentación tardía aunque haya pagado todo» | Se deduce de las reglas citadas, pero **no cité una norma que lo diga con esas palabras** |
| C-3 | sales-tax | «Es la causa más frecuente de que un negocio cumplidor acabe con sanciones» | **Juicio profesional del despacho, no un dato.** Si el EA no lo suscribe: «una causa frecuente», o fuera |
| C-4 | sales-tax | «El Sales Tax que cobra no es ingreso suyo» y los errores se tratan distinto | Caracterización estándar. Redactado **sin nombrar sanciones ni responsabilidad personal**, que es donde empieza lo legal |
| C-5 | deductions | «Un hogar de Florida llega menos veces a detallar que uno de Nueva Jersey» | Razonamiento correcto sobre la deducción SALT, pero es **una generalización**. Verdadera en promedio, falsa en casos concretos |
| C-6 | credits | «Hay quien no presenta y pierde dinero al que tenía derecho» | Cierto y bien documentado en general; lo marco porque **roza el consejo** de presentar sin conocer el caso |
| C-7 | mistakes | El bloque de nombres compuestos y apellido materno | **Lo escribí yo desde el conocimiento del contexto local, no de una fuente del IRS.** Es exactamente el tipo de detalle que un EA del despacho puede confirmar o corregir mejor que ninguna cita |
| C-8 | planning | «Adelantar deducciones puede dejarle flaco el año siguiente» | Correcto, pero es asesoría en miniatura. Redactado como advertencia y no como recomendación, a propósito |
| C-9 | planning | «La idea de que una estructura siempre ahorra se equivoca lo suficiente como para ser peligrosa» | Postura del despacho. La suscribo, pero **debe suscribirla quien firma** |
| C-10 | expenses | «Un gasto que no puede sustentar no es una deducción que tomó» | Deliberadamente contundente. Es la frase con más probabilidad de que un cliente la cite de vuelta |
| C-11 | investing | «Vender una propiedad de alquiler casi nunca es un cálculo sencillo» por la §1250 | Correcto, pero **«casi nunca» es un juicio de frecuencia**, no un dato |
| C-12 | retirement | «Casi todo el mundo acaba teniendo los dos tipos de cuenta» | Observación de práctica profesional. **No hay estadística detrás y no la presento como tal** |
| C-13 | retirement | «La residencia es cuestión de hechos, no de intención» | Es la doctrina, y es importante decirla. Roza terreno legal-estatal: conviene que la valide quien atiende esos casos |

---

## Se quedó fuera por no poder verificarlo

Cada uno de estos habría mejorado su artículo. Ninguno entró, porque no encontré la fuente
primaria en esta pasada. **Si un EA los confirma con referencia, entran en una línea.**

| tema | dónde iría | por qué importa |
|---|---|---|
| Obligación de presentar el Sales Tax **aunque no haya habido ventas** | post 1, «Cuándo vence la declaración» | Es de lo más útil que se le puede decir a un negocio nuevo |
| **Sanciones e intereses** concretos por presentación o pago tardío del Sales Tax | post 1 | El texto dice «sanciones» sin cifrarlas, que es lo correcto sin cita |
| **Collection allowance** de Florida (descuento por presentar y pagar electrónicamente a tiempo) | post 1 | Le ahorra dinero al lector; por eso mismo hay que citarlo bien |
| **Plazos de tramitación del ITIN** (7–11 semanas, 14 en temporada) | posts 3, 4, 5 y el tema propuesto de ITIN | Solo lo encontré en blogs de terceros. **No lo puse en ningún sitio.** Es la cifra que sostendría un artículo entero de ITIN |
| **Límite de $3,000** de pérdida de capital contra ingreso ordinario | post 9 | El texto dice «el límite anual» sin cifrarlo. Es correcto pero menos útil |
| **Límites de la Sección 179 para 2026** | post 7 | Solo verifiqué los de 2025 ($2,500,000 y $31,300 para SUV) y así están etiquetados |
| **Umbrales de ingreso** de las tasas del 15% y el 20% de ganancias de capital | post 9 | El texto describe la estructura sin dar los cortes |
| **Umbrales y limitaciones de la QBI** | post 6 | Deliberadamente no resumidos: es donde la versión resumida engaña |

---

## Mantenimiento — esto es un pasivo anual, no un activo estático

| post | qué caduca | cuándo revisarlo |
|---|---|---|
| 1 · sales-tax | DR-15DSS se republica cada **noviembre**. Lleva «2026» en la metaTitle | **Diciembre, cada año** |
| 2 · deductions | Montos 2025; deducciones de propinas y horas extra son nuevas | Enero |
| 3 · credits | CTC, EITC y créditos educativos se ajustan | Enero |
| 8 · crypto | El **17-feb-2026** y el escalón de costo base de 2026 quedarán obsoletos | Marzo de 2026 |
| 9 · investing | Umbrales de tasa; el NIIT **no** se indexa (eso es permanente) | Enero |
| 10 · retirement | Límites 2026 → 2027 | Noviembre, al publicarse |
| 5 · tax-season | Fechas 15-abr / 15-oct de cada año | Enero |

Solo el post 1 lleva el año en la meta, y es deliberado: ahí el año es información. Los
demás llevan el año **dentro del texto**, junto a cada cifra, que envejece mejor.

---

## Decisiones abiertas que afectan a los 10

### `authorName` — sin firma, y no la invento

Los 10 documentos tienen `authorName` vacío y **siguen vacíos**. El contenido fiscal es la
categoría donde Google evalúa quién firma, y una firma inventada en un despacho con
credenciales reales es peor que ninguna firma.

Esto no es solo una omisión: **`tools/push-en.mjs` es físicamente incapaz de escribir un
autor.** `authorName` está fuera de su lista blanca a propósito y su autoprueba lo demuestra.
El día que el cliente designe a una persona real con su credencial (EA o CPA), se añade ahí
de forma deliberada y en un commit que se ve.

Nota conectada: **D1** de `DECISIONS.md` retiró por este mismo motivo el equipo de plantilla
con correos `@example.com`, y el esquema `teamMember` no existe a propósito.

### `publishedAt` — decidido, pero hoy no se ve

Política acordada el 28-jul-2026: **fecha del empuje**. No hay fecha original recuperable —
ni el crawl de producción ni Sanity la traen en ninguno de los 10. `tools/push-en.mjs` la
estampa en el momento del push y **solo si el documento aún no tiene una**, así que
reejecutarlo no mueve las fechas ya puestas.

**Pero ninguna plantilla la pinta.** `publishedAt` se consulta en `src/lib/sanity.ts` y no se
imprime. Rellenarlo no cambia nada visible hasta que alguien añada un `<time datetime="…">`
a `post/[slug].astro` y a su espejo en `/es`. **Cambio de plantilla: propuesto, no hecho.**

### JSON-LD `Article` — sigue sin emitirse, y es correcto

`src/components/JsonLd.astro` emite `WebPage` + `BreadcrumbList` en las rutas de post, nunca
`Article` ni `BlogPosting`, y lo documenta: sin `author` ni `datePublished` el marcado sería
inválido. Con la fecha decidida **seguirá faltando el autor**, así que la condición no cambia
todavía. **Reportado, no implementado.** El día que haya firma, es un cambio pequeño.

### `/es` sigue `noindex` (D3)

Los 10 posts en español están escritos con criterio, con el glosario intacto y verificados
mecánicamente contra calcos. **Pero hoy no captan nada**: `/es` está fuera del sitemap y sin
hreflang recíproco hasta que D3 se firme.

Dicho de otro modo: la mitad del trabajo de este encargo está construida y no puede
indexarse. Cerrar D3 —contratar al revisor nativo con criterio fiscal— rinde más que
cualquier artículo nuevo.
