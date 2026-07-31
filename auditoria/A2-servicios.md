# A2 · Servicios — `/services/<slug>` ×12 + `/es/services/<slug>` ×12

Auditor de FASE 1. **No se ha tocado ni un fichero de código.** Este `.md` es la
única escritura.

---

## Alcance y método

**Plantillas auditadas:** `src/pages/services/[slug].astro` ·
`src/pages/es/services/[slug].astro`.

**Instancias verificadas — 3 de 12, elegidas por lo que ejercitan, no al azar:**

| slug | por qué esta |
|---|---|
| `audit-assistance` | cuerpo corto (50 722 B). `.block-left` (286 px) **más bajo** que `.block-right` (680 px): ejercita el estirado del grid en un sentido, y el `<h2>` de apertura del rich text. |
| `personal-tax-preparation` | la más larga del baseline (52 615 B). `.block-left` 1 516 px **más alto** que la barra: ejercita el grid en el sentido contrario, es la única con cuerpo de solo `<h3>`, y es la que arrastra R2 de `auditoria-diseno.md`. |
| `sales-tax-filing-7k40q` | el slug con sufijo de desempate que **R4 prohíbe normalizar**. Comprueba que el aserto de `getStaticPaths` no lo ha «limpiado» y que la ruta responde 200 en EN y ES. |

**Por qué 3 bastan para la plantilla.** Hash MD5 de las tres secciones fijas sobre
los 12 HTML del oráculo: `.call-action` → **1 hash único**, `.features` → **1**,
`.reviews` → **1**. Y el listado de `.block-right` sale en **un solo orden** en los
12. La única parte que varía entre fichas es `header-page` (h1 + intro + foto) y
`.block-left`. Las tres elegidas cubren los dos regímenes de altura del grid.

**Barridos ejecutados** (siempre con `AMS_PUERTO=9232 AMS_PERFIL=/tmp/ams-perfil-A2`,
salidas en `/tmp/ams/A2-*`):

- `medir` a **1440** y **375**, baseline y port, en las 3 instancias EN → 6 `diff`.
- `medir` a **1440** y **375** en las 3 instancias **ES** → contrastadas contra su
  equivalente EN ya corregido (no hay oráculo de `/es/`).
- `medir` a **768** en `audit-assistance` como sonda de punto de ruptura.
- Inventario de clases sobre el HTML crudo (los `<div>` sin clase que `medir` no ve).
- Estados `:hover` y `:focus-visible` forzados por CDP (`CSS.forcePseudoState`) en
  los 5 controles de la plantilla, en los dos lados.
- Carrusel sin `webflow.js`: click real en las dos flechas, 1440 y 375.
- 24 rutas: código HTTP, `{{PENDIENTE}}`, enlaces internos.

**T1 · aserto del oráculo:** ejecutado antes de cada tanda. Los seis `medir` del
baseline devuelven **490 nodos** y documentos de 5 611–10 243 px. Ningún lado salió
vacío en ningún momento. **T2:** todas las URL del oráculo llevan `.html`.
**T3:** ver `notas`; 9 de los 10 grupos de divergencia del `diff` son ruido de índice
o cromo ratificado, y están descartados uno a uno con su medida.

**Reparto del `diff`** (`audit-assistance` @1440): 210 divergencias = 98 `FALTA` ·
78 `SOBRA` · 34 con propiedades divergentes. De esas 34, **12 son del cromo**
(F1), **3 son sub-píxel**, **2 son desfase de índice** y **17 son las 3 causas
reales de abajo**.

---

## Hallazgos

### A2-01 · Los 12 servicios de `.block-right` salen en orden alfabético inverso, no en el de producción

- **Ruta:** `/services/<slug>` ×12 y `/es/services/<slug>` ×12 · **Sección:** `.body-service` → `.block-right` · **Viewport:** 1440 y 375 (idéntico en 768)
- **Síntoma:** la barra lateral «global financial solutions» lista los mismos 12
  servicios que producción pero en otra secuencia, y el elemento marcado
  `w--current` cae en otro sitio de la columna.
- **Evidencia:** verificado en las **3 instancias**, orden idéntico entre ellas en
  cada lado (y **único en los 12 HTML del oráculo**).

  | # | baseline | port |
  |---|---|---|
  | 0 | Bilingual Services (English & Spanish) | Sales Tax Filing |
  | 1 | Notary Public Services | Representation Before The IRS |
  | 2 | Financial Statement Preparation | Personal Tax Preparation |
  | 3 | Monthly Bookkeeping & Accounting | Notary Public Services |
  | 4 | Sales Tax Filing | Monthly Bookkeeping & Accounting |
  | 5 | **Audit Assistance** ← `w--current` en `/audit-assistance` | ITIN Application (IRS Tax ID) |
  | 6 | Representation Before The IRS | Financial Statement Preparation |
  | 7 | ITIN Application (IRS Tax ID) | EIN Application |
  | 8 | EIN Application | Corporate Tax Preparation |
  | 9 | Business Incorporation in FL | Business Incorporation in FL |
  | 10 | Personal Tax Preparation | Bilingual Services (English & Spanish) |
  | 11 | Corporate Tax Preparation | **Audit Assistance** ← `w--current` en `/audit-assistance` |

  Mismo conjunto (`sorted(b) == sorted(p)` → `True`), distinta secuencia. Lo confirma
  el computed, `.title-cms-services` @1440:

  | | baseline | port |
  |---|---|---|
  | `[0]` width | 240,406 px | 98,0312 px |
  | `[4]` width | 98,0312 px | 238,516 px |
  | `[10]` width | 165,25 px | 240,406 px |

  Y a 375, donde además cambia qué elementos parten a dos líneas:
  `div.collection-item-2[0]` **50 → 30 px**, `[4]` **30 → 50 px**, `[10]` **30 → 50 px**.
  (`.block-right` mide 680 px @1440 y 775 px @375 en los **dos** lados: la caja no se
  mueve, se mueve el contenido dentro.)

- **Causa raíz:** `src/pages/services/[slug].astro:281` (y `es/services/[slug].astro:258`)
  hace `[...todos].reverse()`. **El `.reverse()` es correcto** — invertir la colección
  es justo lo que hace producción. Lo que está roto es la entrada: `todos` sale de
  `servicios()` en `src/lib/sanity.ts:95`, que ordena
  `| order(order asc, title asc)`, y **el campo `order` está a `null` en los 12
  documentos**. Comprobado con GROQ de solo lectura contra `ep5i6co1/production`:

  ```
  null false Audit Assistance          null false Notary Public Services
  null false Bilingual Services…       null true  Personal Tax Preparation
  null true  Business Incorporation…   null true  Representation Before The IRS
  null true  Corporate Tax Preparation null false Sales Tax Filing
  …  (12/12 con order = null)
  ```

  Con `order` nulo el desempate es `title asc`, o sea **alfabético**, y su inverso es
  el alfabético descendente que se ve arriba.

  El orden canónico de producción **sí es recuperable del oráculo**: es el del
  desplegable del `<nav>` (idéntico en los 12 HTML), y su inverso reproduce
  **exactamente** el de `.block-right` y el del pie. Verificado elemento a elemento:

  ```
  canónico  = [Corporate, Personal, BusInc, EIN, ITIN, Representation,
               Audit, SalesTax, Monthly, Financial, Notary, Bilingual]
  reverse() = [Bilingual, Notary, Financial, Monthly, SalesTax, Audit,
               Representation, ITIN, EIN, BusInc, Personal, Corporate]
            == orden del baseline en .block-right  ✓ coincidencia exacta
  ```

- **Arreglo propuesto:** **es un arreglo de DATOS, no de código — §5 dice «para y
  pregunta».** Rellenar `order` 1…12 en Sanity con la secuencia canónica:

  | order | slug |
  |---|---|
  | 1 | `corporate-tax-preparation` |
  | 2 | `personal-tax-preparation` |
  | 3 | `business-incorporation-in-florida` |
  | 4 | `employer-identification-number-application` |
  | 5 | `itin-application-irs-tax-id` |
  | 6 | `representation-before-the-irs` |
  | 7 | `audit-assistance` |
  | 8 | `sales-tax-filing-7k40q` |
  | 9 | `monthly-bookkeeping-accounting` |
  | 10 | `financial-statement-preparation` |
  | 11 | `notary-public-services` |
  | 12 | `bilingual-services-english-spanish` |

  Con eso el `.reverse()` que ya está escrito devuelve el orden del baseline sin
  tocar ninguna plantilla, y **arregla de una vez las cuatro superficies** que hoy
  divergen por la misma causa (ver `notas`). No tocar el código de `[slug].astro`.
  Alternativa solo-código y peor: constante `ORDEN` en `src/lib/sanity.ts` — duplica
  en el repo una responsabilidad que el CMS ya modela y que el cliente tendrá que
  poder cambiar.
- **Archivos a tocar:** ninguno si se arregla como toca (dato de Sanity: 12 docs
  `service`, campo `order`). Si se decide la vía código: `src/lib/sanity.ts` (F0).
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no. `auditoria-diseno.md` §6
  dice que las 26 rutas EN quedaron «idénticas»; esto es una regresión respecto a esa
  afirmación.

---

### A2-02 · El anillo de foco del CTA de `.header-page` es blanco sobre fondo blanco

- **Ruta:** `/services/<slug>` ×12 y `/es/services/<slug>` ×12 · **Sección:** `.header-page` → `a.button.w-button` («Book A consultation») · **Viewport:** 1440 y 375
- **Síntoma:** al tabular hasta el CTA principal de la cabecera no se ve nada. El
  control recibe el foco pero el indicador es invisible.
- **Evidencia:** `:focus-visible` forzado por CDP en los dos lados, mismo elemento:

  | | baseline | port |
  |---|---|---|
  | `outline-color` | `rgb(0, 95, 204)` (anillo por defecto de Chrome) | `rgb(255, 255, 255)` |
  | `outline-width` | 1 px | 2 px |
  | fondo sobre el que se dibuja | `BODY` `rgb(255,255,255)` | `BODY` `rgb(255,255,255)` |
  | contraste anillo/fondo | **5,98 : 1** ✓ | **1,00 : 1** ✗ |

  `outline-offset: 2px`, así que el anillo cae fuera del botón verde, sobre el blanco
  del `<body>` (`.header-page` no tiene `background-color` propio: medido, el primer
  ancestro con fondo es `BODY` = `rgb(255,255,255)`).

  **No es un problema de la regla, es un problema de este contexto.** Los otros tres
  controles de la plantilla la aprovechan bien, medidos en el mismo barrido:

  | control | color del anillo | fondo detrás | ¿visible? |
  |---|---|---|---|
  | `.call-action .button.padding` | `rgb(255,255,255)` | `section.call-action` `rgb(36,49,55)` | sí, 13,38:1 |
  | `.block-right .link-block` | `rgb(255,255,255)` | `div.block-right` `rgb(36,49,55)` | sí, 13,38:1 |
  | `.button-slider-cms` | `rgb(255,255,255)` | `section.reviews` `rgb(36,49,55)` | sí, 13,38:1 |
  | **`.header-page .button.w-button`** | `rgb(255,255,255)` | `BODY` `rgb(255,255,255)` | **no, 1,00:1** |

  `:hover` sí es idéntico en los dos lados en los 5 controles (incluido el
  `matrix(1.05,…)` de las flechas del carrusel): el problema es solo el foco.
- **Causa raíz:** [`src/styles/site.css:10-13`](../src/styles/site.css) —
  `:where(a, button, input, textarea, select, [tabindex]):focus-visible { outline: 2px
  solid currentColor; outline-offset: 2px }`. `currentColor` en `.button` es blanco
  (texto blanco sobre verde `--green-2`), y el anillo se pinta **fuera** del botón,
  donde ya no hay verde. Incumple SC 1.4.11 / 2.4.11 (pide 3:1 para el indicador de
  foco); el baseline, sin la regla, cumplía por accidente con el anillo del navegador.
- **Arreglo propuesto:** anillo de dos tonos, que es visible tanto sobre blanco como
  sobre `--bllue`, sin necesidad de conocer el contexto de cada control:
  ```css
  :where(a, button, input, textarea, select, [tabindex]):focus-visible {
    /* Dos tonos: el blanco resuelve el cromo navy y el navy resuelve el cuerpo
     * blanco. Con currentColor a secas, el CTA verde sobre <body> blanco pintaba
     * un anillo blanco sobre blanco (1,00:1). */
    outline: 2px solid #fff;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--bllue);
  }
  ```
  Descartada la variante «forzar `outline-color: var(--bllue)` solo en `.button`»:
  rompería el mismo botón dentro de `.call-action`, que sí está sobre navy.
- **Archivos a tocar:** `src/styles/site.css` — **es de F0**, va a `auditoria/COLA-CSS.md`, no lo toca F3.
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no. `auditoria-diseno.md` D3
  solo verificó el anillo de `.saltar-al-contenido` (blanco sobre navy). El caso
  «anillo claro sobre cuerpo claro» no se comprobó en ninguna de las 21 entradas.

---

### A2-03 · El `<style>` de la plantilla duplica los `clip-path` de `site.css` **y les gana por especificidad**

- **Ruta:** las 24 · **Sección:** `.header-page` (`.background-services`) y `.reviews` (las 4 esquinas) · **Viewport:** 1440 y 375
- **Síntoma:** hoy no se ve nada raro. El defecto es de cascada: hay dos copias vivas
  de las mismas 5 declaraciones y **la de la plantilla tapa a la de `site.css`**, así
  que un futuro arreglo en `site.css` no tendrá ningún efecto en estas 24 rutas y
  parecerá que «el CSS no aplica».
- **Evidencia:**

  **1. Los valores coinciden byte a byte**, y coinciden con el `.w-embed` de producción:

  | declaración | `site.css:567-583` | `[slug].astro:506-527` | `.w-embed` del oráculo |
  |---|---|---|---|
  | `.background-services` | `polygon(20% 0, 100% 0, 100% 100%, 0% 100%)` | idem | idem |
  | `.background-services` @≤789 | `polygon(50% 20%, 100% 0, 100% 100%, 0 100%, 0 0)` | idem | idem |
  | `.corner-top-1`, `.corner-bottom-1` | `polygon(50% 50%, 100% 0, 0 0, 0% 100%)` | idem | idem |
  | `.corner-top-2`, `.corner-bottom-2` | `polygon(50% 50%, 100% 0, 100% 100%, 0% 100%)` | idem | idem |

  Computed medido, los dos lados, sin una sola divergencia:

  | | baseline @1440 | port @1440 | baseline @375 | port @375 |
  |---|---|---|---|---|
  | `img.background-services` | 720×550, `polygon(20% 0px, 100% 0px, 100% 100%, 0% 100%)` | **igual** | 375×249,75, `polygon(50% 20%, …)` | **igual** |
  | `div.corner-top-1` | 100×100, `polygon(50% 50%, 100% 0px, 0px 0px, 0% 100%)` | **igual** | 50×50, idem | **igual** |
  | `div.corner-bottom-2` | 100×100, `polygon(50% 50%, 100% 0px, 100% 100%, 0% 100%)` | **igual** | 50×50, idem | **igual** |

  **2. Uno pisa al otro.** Astro emite el bloque con ámbito de componente:
  ```
  .corner-top-1[data-astro-cid-njl2q4gy] { … }      ← especificidad (0,2,0)
  ```
  contra `site.css`:
  ```
  .corner-top-1 { … }                                ← especificidad (0,1,0)
  ```
  Los dos están **fuera de `@layer`**, así que decide la especificidad: **gana la
  plantilla, siempre.**

  **3. La copia de `site.css` está parcialmente muerta.** `.background-services` solo
  se usa en las 2 plantillas de servicio (`grep -rl` sobre `src/pages` y
  `src/components`), o sea que `site.css:576-583` **no pinta en ninguna ruta**. El
  bloque de esquinas sí sigue vivo, pero solo para `index.astro` / `es/index.astro`;
  en las 24 rutas de servicio está ensombrecido.

  **4. Hay 2 declaraciones que existen solo en la plantilla** y que sí hacen falta:
  `background-size: cover` + `background-position: 50%` sobre `.background-services`,
  que son las que colocan el `lqip` inline. Medido: baseline `background-size: auto` /
  `background-position: 0% 0%` (no tiene lqip), port `cover` / `50% 50%`.
- **Causa raíz:** [`src/pages/services/[slug].astro:500-528`](../src/pages/services/[slug].astro)
  y [`src/pages/es/services/[slug].astro:453-481`](../src/pages/es/services/[slug].astro)
  reintroducen lo que ya vive en [`src/styles/site.css:567-583`](../src/styles/site.css).
  El comentario de `site.css:562-566` dice explícitamente que ese bloque existe *para
  las 12 fichas de servicio* — hoy es falso.
- **Arreglo propuesto:** borrar el `<style>` de las **dos** plantillas y llevar a
  `site.css`, junto al bloque que ya está, las dos únicas declaraciones que faltan:
  ```css
  .background-services {
    clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
    /* El lqip va como background-image inline: sin esto se repetiría a tamaño
     * natural en vez de tapar la caja del LCP. */
    background-size: cover;
    background-position: 50%;
  }
  ```
  Cumple además §5 («CSS propio solo en `site.css`»), que el `<style>` de la plantilla
  incumple. **Orden obligatorio: primero F0 añade las 2 líneas a `site.css`, después
  F3 borra los dos `<style>`.** Al revés, las 24 fichas se quedan un rato con el lqip
  repitiéndose.
- **Archivos a tocar:** `src/pages/services/[slug].astro` y
  `src/pages/es/services/[slug].astro` (F3) + `src/styles/site.css` (F0 → `COLA-CSS.md`).
- **Severidad:** cosmético (hoy no cambia ni un píxel; es trampa de cascada y deuda)
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no.

---

### A2-04 · El carrusel de reseñas sale en orden arbitrario: las 4 tarjetas visibles no son las de producción

- **Ruta:** las 24 · **Sección:** `.reviews` → `.splide-list` · **Viewport:** 1440 y 375
- **Síntoma:** los 20 testimonios son los mismos, pero el que abre el carrusel —y por
  tanto las 4 tarjetas que se ven sin desplazar— es otro. Además el orden no está
  fijado por ningún criterio: depende del `_id` que Sanity asignó en el import.
- **Evidencia:** `.name-customer` en orden de DOM, los 20, `audit-assistance`
  (idéntico en las 3 instancias; `sorted(b) == sorted(p)` → `True`, o sea mismo
  conjunto y distinta secuencia — **20 de 20 posiciones distintas**):

  | # | baseline | port |
  |---|---|---|
  | 0 | Juan T. | Sofía M. |
  | 1 | Andrea K. | Carlos R. |
  | 2 | Andrés V. | Michael G. |
  | 3 | Javier L. | Laura P. |
  | … | … | … |
  | 19 | Michael G. | Juan T. |

  Y el computed lo confirma, `audit-assistance` @375:

  | | baseline | port |
  |---|---|---|
  | `p.paragraph[0]` height | 100 px (4 líneas) | 75 px (3 líneas) |
  | `p.paragraph[1]` height | 100 px | 75 px |
  | `p.paragraph[5]` height | 75 px | 100 px |
  | `div.name-customer[5]` width | 74,6562 px | 84,5156 px |
  | `div.name-customer[9]` width | 84,5156 px | 74,6562 px |

  (`.block-review` mide 292,5×300 @1440 y 271×300 @375 en los **dos** lados: la
  tarjeta no cambia, cambia qué reseña lleva dentro.)
- **Causa raíz:** [`src/lib/sanity.ts:110-111`](../src/lib/sanity.ts) —
  `*[_type == "review"]{ _id, author, quote }` **sin cláusula `order()`**. GROQ
  devuelve entonces el orden por `_id`, que es el hash del import y no significa nada.
  Los 20 documentos tienen además `order: null` (verificado por GROQ de solo lectura),
  así que hoy no hay ningún campo por el que ordenar. El orden de producción sí está
  disponible: es el de los 20 `.splide-slide` del oráculo, idéntico en los 12 HTML.
- **Arreglo propuesto:** **también es dato — §5, «para y pregunta».** Rellenar `order`
  1…20 en los documentos `review` con la secuencia del oráculo
  (`Juan T.` = 1 … `Michael G.` = 20) y añadir `| order(order asc)` en
  `testimonios()`. El `order()` hace falta aunque el dato no llegue: sin él el orden
  del carrusel puede cambiar solo con reimportar el dataset, y eso es un diff
  fantasma en cada auditoría futura.
  **Prohibido** convertir esto en JSON-LD `Review`/`aggregateRating` de paso: D5 lo
  veta y sigue vetado.
- **Archivos a tocar:** `src/lib/sanity.ts` (F0 → `COLA-CSS.md`) para el `order()`;
  el resto es dato de Sanity.
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no. D5 regula qué **no** se
  emite sobre las reseñas, no su orden.

---

### A2-05 · El cuerpo del servicio pierde los párrafos vacíos de producción: `.body-service` se acorta hasta 186 px

- **Ruta:** las 24 · **Sección:** `.body-service` → `.block-left > .w-richtext` · **Viewport:** 1440 y 375
- **Síntoma:** el bloque de texto termina antes que en producción. En
  `personal-tax-preparation` la sección entera mide 186 px menos y el ritmo vertical
  entre bloques del cuerpo cambia.
- **Evidencia:** `div.w-richtext[0]` height, las 3 instancias, los 2 anchos:

  | ruta | viewport | baseline | port | Δ |
  |---|---|---|---|---|
  | `audit-assistance` | 1440 | 286 px | 251 px | **−35** |
  | `audit-assistance` | 375 | 447 px | 412 px | **−35** |
  | `sales-tax-filing-7k40q` | 1440 | 297 px | 262 px | **−35** |
  | `sales-tax-filing-7k40q` | 375 | 483 px | 448 px | **−35** |
  | `personal-tax-preparation` | 1440 | 1 516 px | 1 330 px | **−186** |
  | `personal-tax-preparation` | 375 | 1 881 px | 1 695 px | **−186** |

  Se propaga a la sección solo cuando `.block-left` manda en el grid:
  `section.body-service` en `personal-tax-preparation` @1440 **1 708 → 1 522 px**;
  en `audit-assistance` @375 **1 368 → 1 333 px** (@1440 no se mueve, porque ahí
  gobierna `.block-right`, 680 px en los dos lados).

  Qué se pierde exactamente, contado sobre el HTML crudo del tramo `.block-left`:

  | | baseline | port |
  |---|---|---|
  | `audit-assistance` — `<p>` con solo ZWJ (`‍`) | 2 (uno abre el primer párrafo, otro cierra el bloque) | 0 |
  | `personal-tax-preparation` — `<p>` con solo ZWJ | 5 | 0 |
  | `personal-tax-preparation` — `<h2>` vacío con ZWJ | 1 | 0 |

- **Causa raíz:** **no es la plantilla ni `PortableText.astro`.** El dato de Sanity ya
  viene sin esos bloques: GROQ sobre `personal-tax-preparation` devuelve
  `count(body) = 35` y **0 bloques vacíos**; sobre `audit-assistance`,
  `count(body) = 6` con estilos `["h2","normal","normal","normal","normal","normal"]`
  y todos con texto. Los perdió el import de Webflow → Sanity
  (`baseline/import/` · `tools/sanity-import`), que descartó los párrafos que solo
  contenían el *zero-width joiner* que Webflow deja al vaciar una línea del editor.
- **Arreglo propuesto:** **decisión de contenido, no de maquetación — para y
  pregunta.** Dos salidas válidas, y las dos son legítimas:
  1. **No arreglar** y anotarlo como divergencia aceptada: lo que falta son líneas en
     blanco residuales del editor de Webflow, no texto. Es mi recomendación.
  2. Si se quiere paridad estricta de ritmo vertical, reimportar el `body` de los 12
     conservando los bloques vacíos.

  Lo que **no** vale es simularlo con `margin`/`padding` en `site.css`: sería
  rediseño encubierto y se descuadraría en cuanto alguien edite el cuerpo en el CMS.
- **Archivos a tocar:** ninguno de código. Dato de Sanity (campo `body` de los 12
  documentos `service`).
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no directamente. Está en la
  misma familia que la nota de `DECISIONS.md` §«Hallazgos reportables» sobre el body
  de `/services/personal-tax-preparation`, pero aquello es sobre *qué dice* el texto y
  esto es sobre *cuánto ocupa*.

---

## Encargos concretos del brief — respuesta

**1. ¿El `<style>` de las líneas 498-526 duplica o pisa a `site.css:552-573`?**
**Las dos cosas: duplica exacto y pisa.** Los cuatro `clip-path` son idénticos a los
de `site.css` y a los `.w-embed` de producción, y el computed sale igual en los dos
lados a 1440 y a 375 (`polygon(20% 0px, …)` y `polygon(50% 20%, …)` tras el corte de
789 px). Pero Astro emite `.corner-top-1[data-astro-cid-njl2q4gy]` — especificidad
(0,2,0) contra (0,1,0) de `site.css`, ambos sin `@layer` — así que **gana siempre la
plantilla**, y `site.css:576-583` (`.background-services`) no pinta en ninguna ruta
del sitio. Detalle completo y arreglo en **A2-03**.

**2. ¿Y el segundo `<h1 class="h2">` de producción, que el port bajó a `<h2>`?**
**Bajado bien y sin coste visual.** Jerarquía completa comprobada en las 3 instancias:

| | baseline | port |
|---|---|---|
| `audit-assistance` | 13 encabezados, **2 `<h1>`** (`h1.h1` «Audit Assistance» + `h1.h2` «global financial solutions») | 13 encabezados, **1 `<h1>`** |
| `sales-tax-filing-7k40q` | 13, **2 `<h1>`** | 13, **1 `<h1>`** |
| `personal-tax-preparation` | 19, **2 `<h1>`** | 18, **1 `<h1>`** (el que falta es el `<h2>` vacío con ZWJ de A2-05, no un encabezado con texto) |

Y el elemento renderiza exactamente igual — `h1.h2[0]` del baseline contra
`h2.h2[1]` del port, computed:

| | baseline | port |
|---|---|---|
| @1440 | 418,766 × 40 px · `font-size: 35px` · `stix-two-text` · `700` · `rgb(255,255,255)` | **idéntico** |
| @375 | 245 × 60 px · `font-size: 25px` · `stix-two-text` · `700` · `rgb(255,255,255)` | **idéntico** |

Orden final del port en las 3: `h1` → `h2` ×5 → `h3` ×3 → `h2` ×2 (pie) → `h3` ×2
(pie). Sin saltos de nivel. **No hay hallazgo aquí.**

---

## notas

### Falsos positivos descartados (y por qué)

**Ruido de índice — T3 puro:**

1. **`h2.h2[1] width 672,672 → 418,766` y `h2.h2[2] width 950 → 672,672, color
   36,49,55 → 255,255,255`.** Parece que un titular de `.features` se volvió blanco.
   No: el baseline tiene «global financial solutions» como `h1.h2`, el port como
   `h2.h2`, así que **toda la lista `h2.h2` del port va corrida una posición**.
   Emparejados a mano, cada uno con su homólogo, coinciden al píxel (tabla arriba).
   Lo remata el `SOBRA h2.h2[3]`.
2. **`section.footer-subscribe[0] height 105 → 130` (@1440).** El `.footer-subscribe`
   de `.call-action` baja de `<section>` a `<div>` en el port, así que
   `section.footer-subscribe[0]` del port ya no es el mismo nodo: es el del pie.
   Comparando los nodos correctos, `div.footer-subscribe[0]` del port mide **105 px**,
   exactamente el del baseline.
3. **`FALTA section.wrapper-reviews` + `SOBRA div.wrapper-reviews`.** Mismo caso.
   Medido: **1250×450 @1440** y **311×711, padding 50px 15px @375** en los dos lados.
   Idénticos.
4. **`FALTA div.splide-track.swiper-horizontal.swiper-initialized.w-dyn-list` +
   `SOBRA div.splide-track.w-dyn-list`.** Las clases `swiper-*` las inyecta Swiper en
   producción. Caja idéntica: **1250×320 @1440**, **281×320 @375**.
5. **`FALTA div.w-embed` ×3.** Son los tres `<style>` incrustados de producción.
   Deliberado (y objeto de A2-03).
6. **`FALTA a.link-block.w-inline-block` + `SOBRA a.link-block.w--current.w-inline-block`.**
   No falta ningún enlace: los dos lados tienen exactamente **un** `w--current` en
   `.block-right` (y uno en `.link-footer`, y uno en `.link-submenu`). Lo que cambia
   es en qué índice cae, que es el síntoma de **A2-01**.

**Sub-píxel — no reportable:**

7. **`img.image-2` 368,969 → 369,047 y 388,734 → 389,234**, y sus padres
   (`div-block-4`, `div-block-5` 1254,67 → 1255,33, `section.features`
   1679,67 → 1680,33), más `img.bg-pic` 449,109 → 449,125. Causa medida: el mismo
   PNG re-codificado da **940×584** en el CDN de Webflow y **940×585** en el de
   Sanity. Diferencias de 0,08 a 0,5 px.

**Cromo — de F1, y además ratificado:**

8. `div.top-bar`, `wrapper-top-bar`, `block-icons-top-bar`, `text-top-bar`,
   `block-social-media` (`flex → none` a 375), `img.icon-sociall`,
   `a.brand.w-nav-brand` (`absolute → static`, 190×150 → 150×64), `img.logo`
   (100 → 48), `div.navbar` (81,25 → 64), `block-items-menu`, `ul.list-footer`,
   `li.list-item-footer` (25 → 44), `a.link-footer` (`inline → inline-flex`),
   `div.w-form-done` / `w-form-fail`. Todo esto es el **rediseño del cromo móvil
   ratificado** en `auditoria-diseno.md` §1 (M1–M8) y §2 (D1–D5). No se re-reporta.
9. `SOBRA nav-telefono`, `nav-volver`, `saltar-al-contenido`, `visually-hidden`,
   `svg.nav-telefono-icono` — idem, M6/D3/D2.
10. Inventario de clases: `list-footer 13 → 2`, `w-dyn-item 56 → 32`,
    `w-dyn-items 4 → 2`, `w-dyn-list 4 → 2`, `icon-submenu 12 → 13`,
    `w-icon-nav-menu 1 → 2`. Todo del `<nav>`/pie, por los `<div role=list>` → `<ul>`
    y `<div>` → `<button>` que §T3 declara deliberados.

**Mejoras del port, no defectos:**

11. **La foto LCP.** Baseline: `loading="lazy"`, sin `width`/`height`, `alt=""`,
    `sizes="100vw"`, **0** `fetchpriority="high"` en la página. Port:
    `loading="eager"` + `fetchpriority="high"` (exactamente **1** en toda la página) +
    `width="1250" height="833"` + `alt` escrito + `lqip` como `background-image`.
    Y `sizes="(max-width: 991px) 100vw, 50vw"` es correcto: la imagen es `width:50%`
    a partir de 992 px, así que a 1440 el port sirve el recurso de **800 w** para una
    caja de 720 px donde el baseline traía **1439 w**.
12. **El anillo de foco** en `.call-action`, `.block-right` y las flechas del
    carrusel: el baseline no tenía ninguno (solo el del navegador). Solo se reporta el
    caso donde el del port **no se ve** (A2-02).
13. `alt` de `.icon-google`: «Google reviews icon» → «Google Reviews». Texto de un
    `alt`, no afecta al render.

**Ya reportado por otros documentos — no se duplica:**

14. **`meta description` de `/services/personal-tax-preparation` habla de impuestos
    corporativos.** Verificado que sigue ahí (el port la hereda del `intro` del CMS).
    Es **R2 de `auditoria-diseno.md`**, reportado y no arreglado a propósito.
15. **`<title>`**: producción sirve «Accounting Max Services» en las 26 rutas; el port
    emite `«<servicio> | Accounting Max Services»`. Deliberado y documentado en el
    frontmatter de la plantilla (líneas 99-106).
16. **`--green-2` con texto blanco a 3,07:1** en el CTA de `.header-page` y en
    `.call-action`: **R1 de `auditoria-diseno.md`**, decisión de marca.
17. **`stix-two-text`**: computa correctamente en local (45/35/25 px, peso 700) en los
    dos lados. En `*.vercel.app` caerá al fallback — **D9**, esperado, no es defecto.

**Comprobado y limpio (no genera hallazgo):**

18. **Cero desbordamiento horizontal** en los dos lados, 1440 y 375:
    `scrollWidth === clientWidth` (1440/1440 y 375/375). Los elementos cuyo borde
    derecho pasa del viewport están **todos** dentro de `#pista-resenas`, que recorta
    — y salen en la misma lista en el baseline.
19. **Cero imágenes rotas**: 83 `<img>` por página, `naturalWidth > 0` en las 83, en
    los dos lados, tras recorrer la página entera.
20. **Cero enlaces a 404**: 16 hrefs internos en EN + 16 en ES, todos 200. Las 12
    rutas EN y las 12 ES devuelven 200 y **ninguna** contiene `{{PENDIENTE}}`.
    `sales-tax-filing-7k40q` responde en los dos idiomas (R4 intacto).
21. **El carrusel funciona sin `webflow.js`.** Click real en las flechas:
    @1440 `scrollLeft` 0 → 313 → 625 → 313 (slide de 312,5 px);
    @375 0 → 281 → 562 → 281 (slide de 281 px). Las dos direcciones, con
    `overflow-x: auto` + `scroll-snap-type: x mandatory`.
22. **`:hover` idéntico** en los 5 controles medidos, incluido el
    `matrix(1.05, 0, 0, 1.05, 0, 0)` de `.button-slider-cms`.
23. **Punto de ruptura de 789 px del `clip-path` respetado** en los dos lados; sonda a
    768 px en `audit-assistance` sin divergencia nueva más allá de las ya listadas.
24. **`.header-page`, `.call-action` y `.features` son estructuralmente idénticos**:
    diff del marcado tramo a tramo, sin un solo nodo de más ni de menos (aparte de los
    `data-w-id`, los `.w-embed` y los `aria-labelledby`/`id` que añade el port).
25. **Las 3 rutas ES no tienen divergencia estructural**: 467 nodos, los mismos que su
    equivalente EN. Todas las diferencias contra EN son de longitud de texto
    (`div.w-richtext` 251 → 337, `h2.h2` 40 → 80 en `.call-action` por el titular más
    largo, `a.button` 218,406 → 228,078). Ninguna es de caja ni de regla.

### Un mismo dato roto explica cuatro superficies

`order` está a `null` en los 12 documentos `service`, y eso no solo rompe **A2-01**.
Verificado en el mismo barrido, para que el triaje lo trate como **un** arreglo y no
como cuatro:

| superficie | dueño | orden del baseline | orden del port |
|---|---|---|---|
| `.block-right` de las 24 fichas | **F3 (mío)** | Bilingual → Corporate | alfabético inverso |
| Lista de servicios del pie | F1 (`Footer.astro:184`) | **igual que el anterior** | alfabético inverso |
| Desplegable de `Services` del `<nav>` | F1 | Corporate → Bilingual (**el canónico**) | alfabético ascendente |
| `.bar-services` de la portada | F2 (`index.astro:97`) | Corporate, Personal, BusInc, Representation, Monthly, EIN… | featured-primero + alfabético |

El pie y mi barra lateral pintan el canónico **invertido** — y eso es exactamente lo
que hace el `.reverse()` que ya está en el código. Con `order` 1…12 rellenado (tabla
en A2-01), las tres primeras filas se arreglan **sin tocar una sola plantilla**. La
cuarta (portada) tiene un orden propio en producción y es problema aparte de F2.

### Corrección de las referencias del encargo

El brief apuntaba a `[slug].astro:498-526` y `site.css:552-573`. En el árbol de hoy
las líneas exactas son **`[slug].astro:500-528`** (`<style>` en 500, `</style>` en
528; los `clip-path` en 506-527) y **`site.css:567-583`** (comentario en 562-566).
En la ruta ES el bloque equivalente es **`es/services/[slug].astro:453-481`**.
Verificado leyendo los ficheros, no de memoria.

### Límites de este barrido

- **3 de 24 rutas medidas.** Justificado por los hashes (una sola versión de
  `.call-action`, `.features`, `.reviews` y del listado de `.block-right` en los 12),
  pero las 9 fichas EN restantes solo se comprobaron por HTTP 200 + ausencia de
  `{{PENDIENTE}}`, no con `medir`.
- **`/es/` no tiene oráculo.** Su verdad ha sido el equivalente EN del port, que a su
  vez arrastra A2-01, A2-02, A2-04 y A2-05. Si esos se arreglan en EN, hay que
  re-verificar ES; no lo hereda solo.
- **Medido sobre `astro dev` (:4321), no sobre `dist/`.** §5 prohíbe `npm run build`
  en esta fase. La diferencia esperada es el CSS inyectado por HMR, que no cambia
  computed, pero A2-03 (especificidad del `<style>` con ámbito) conviene reconfirmarlo
  en el build de producción, donde Astro puede emitir el selector de otra forma.
- **No he podido comprobar** si el import de Webflow → Sanity descartó los párrafos
  vacíos a propósito o por descuido: `tools/sanity-import` es de escritura y §5
  prohíbe ejecutarlo. La conclusión de A2-05 se apoya solo en lecturas GROQ del
  dataset ya importado.
- **Anchos medidos: 1440 y 375**, más una sonda a 768. No he barrido 320, 991 ni 1024
  en estas rutas.
