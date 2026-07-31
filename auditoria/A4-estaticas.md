# A4 · Estáticas — `/about-us`, `/contact-us`, `/privacy-policy`, `/terms` (+ los dos `/es/`)

Barrido a **1440** y **375**, DPR 1, Chrome headless por CDP
(`AMS_PUERTO=9234 AMS_PERFIL=/tmp/ams-perfil-A4`).

Assert T1 ejecutado antes de cada tanda: `:4321` y `:4327` respondieron 200 en las
tres sesiones de medida. `about-us.html` y `contact-us.html` del oráculo, 200.

**6 rutas verificadas**, 2 con oráculo y 4 sin él:

| ruta | oráculo | veredicto |
|---|---|---|
| `/about-us` | `4327/about-us.html` | port 1:1. Texto idéntico (2717 car., `diff` vacío) y geometría idéntica al píxel en las 4 secciones. 1 defecto de resolución de imagen. |
| `/es/about-us` | — (coherencia con EN) | espejo exacto: 205 nodos en ambos, solo reflujo por longitud del español. Hereda el mismo defecto de imagen. |
| `/contact-us` | `4327/contact-us.html` | formulario 1:1 en campos y cajas; el bloque de consentimiento desnivela la composición de dos tarjetas. |
| `/es/contact-us` | — (coherencia con EN) | 224 nodos en ambos, solo reflujo. Mismo desnivel, 476 px. |
| `/privacy-policy` | — (coherencia interna) | cromo de página idéntico al de `baseline/html/post/*`; 1 defecto cosmético en la tabla del modelo FTC. |
| `/terms` | — (coherencia interna) | limpio. |

---

## Hallazgos

### A4-01 · Las fotos de Misión y Visión se sirven a 500 px reales para una caja que necesita 675: se pintan ampliadas un 35 %

- **Ruta:** `/about-us` y `/es/about-us`  ·  **Sección:** `.mission-vision` (`.pic-about-us[1]` y `[2]`)  ·  **Viewport:** 1440 (y todo ≥992)
- **Síntoma:** las dos fotos de la sección Misión/Visión salen visiblemente blandas
  frente a producción; el hero de la misma página, en cambio, está bien.
- **Evidencia** (nodo `img.pic-about-us[1]`, «Our Mission», medido en los dos servidores):

  | | baseline `:4327` | port `:4321` |
  |---|---|---|
  | caja pintada | 484×450 | 484×450 (idéntica) |
  | `object-fit` | `cover` | `cover` (idéntico) |
  | `sizes` de escritorio | `940.0000610351562px` | `484px` |
  | candidato elegido (`currentSrc`) | `…_MIssion-p-1080.webp` | `…-1250x833.webp?w=500&q=75&auto=format` |
  | píxeles reales servidos | **1080×720** | **500×333** |
  | factor de pintado (`cover`) | **0,625 → reduce** | **1,351 → AMPLÍA 35 %** |

  Los 500×333 están confirmados por HTTP, no deducidos:
  `curl "…-1250x833.webp?w=500&q=75&auto=format"` → `500x333`.
  (`naturalWidth` no sirve como prueba aquí: con descriptores `w` el navegador
  devuelve el ancho **corregido por densidad**, 484, no el real.)

  Son 166 500 px reales frente a los 777 600 del baseline: **4,67× menos píxeles**
  para exactamente la misma caja. `.pic-about-us[2]` («Our Vision») se comporta
  igual (fuente `1250x824`, mismo candidato `w=500`).

- **Causa raíz:** `SIZES_MV` declara el **ancho** de la columna (484 px) e ignora que
  `.pic-about-us` es `height: 450px` + `object-fit: cover`
  ([accounting-max.webflow.css:1435-1440](../src/styles/vendor/accounting-max.webflow.css)).
  Con `cover` y una fuente de proporción 1250/833 = 1,5006, cubrir 450 px de **alto**
  exige 450 × 1,5006 = **675 px de ancho**, por estrecha que sea la columna. Al pedir
  484 el navegador se queda con el candidato de 500w.
  [about-us.astro:98-99](../src/pages/about-us.astro) · [es/about-us.astro:70-71](../src/pages/es/about-us.astro)
- **Arreglo propuesto:** en las dos rutas, sustituir el valor de `SIZES_MV` por
  ```
  "(max-width: 991px) calc(100vw - 64px), 675px"
  ```
  Comprobado sobre el candidato que elegiría: 675 → 800w (800×533) → factor
  `max(484/800, 450/533) = 0,844`, o sea reduce, como el baseline. La rama `≤991px`
  no se toca: ahí la caja baja a 450/350/250 px de alto y `calc(100vw - 64px)` ya
  cubre de sobra (medido a 375: factor 0,751).
  **No tocar `SIZES_HERO`:** su fuente es cuadrada (1250×1250), la caja 609×450 es
  más ancha que alta y el factor ya sale 0,761.
- **Archivos a tocar:** `src/pages/about-us.astro` · `src/pages/es/about-us.astro`
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A4-02 · En `/contact-us` a ≥992 px la tarjeta gris se queda 447 px por encima del pie de la azul

- **Ruta:** `/contact-us` y `/es/contact-us`  ·  **Sección:** `.wrapper-contact-page`  ·  **Viewport:** 1440
- **Síntoma:** las dos tarjetas del bloque de contacto dejaron de leerse como un
  panel: bajo la gris queda un hueco blanco de casi 450 px mientras la azul sigue
  bajando sola. Se lee como un fallo de maquetación, no como un diseño.
- **Evidencia** (mismos nodos, mismo viewport):

  | | baseline | port EN | port ES |
  |---|---|---|---|
  | `.block-info-contact` (gris) | 750×**559**, y253→**812** | 750×**559**, y253→**812** | 750×609, y253→862 |
  | `.wrapper-form-page` (azul) | 500×**685**, y253→**938** | 500×**1006**, y253→**1259** | 500×1085, y253→1338 |
  | **desnivel** | **126 px** | **447 px** | **476 px** |
  | `.wrapper-contact-page` | 1250×685 | 1250×1006 | 1250×1085 |

  Capturas: `/tmp/ams/A4-b-contact-crop.png` vs `/tmp/ams/A4-p-contact-crop.png`
  (mismo recorte 1440×1450). Los dos bordes verticales se tocan en x845 en ambos
  lados; en el port solo comparten 559 de los 1006 px.

  El resto del formulario **sí es 1:1**: los tres campos 372×50, el `textarea`
  372×100 y el `input[type=submit]` 198×55 en x996 coinciden al píxel con el
  baseline, y las 4 etiquetas nuevas van en `.visually-hidden` (1×1) sin ocupar
  hueco. La trampa anti-bots está dentro de `div.visually-hidden[aria-hidden]` con
  `tabindex="-1"` y su `<label>` asociado. Sin desbordamiento horizontal a 375
  (`scrollWidth === 375`).

- **Causa raíz:** `.wrapper-contact-page` es `display:flex` con **`align-items: flex-start`**
  ([accounting-max.webflow.css:1943-1951](../src/styles/vendor/accounting-max.webflow.css), la
  declaración está en la 1948), así que la tarjeta gris nunca se estira: su alto lo fija
  su propio contenido sobre `min-height:450px` ([:1839-1846](../src/styles/vendor/accounting-max.webflow.css)).
  Lo que crece es la azul, y crece por `fieldset.lead-consent` — 372×**306** en EN y
  372×**360** en ES — que añade [contact-us.astro:276-334](../src/pages/contact-us.astro)
  (FTSA/TCPA). **Ese bloque sí está justificado** (D4 + el comentario del propio
  fichero); lo que no está documentado en ninguna parte es el desnivel que produce.
- **Arreglo propuesto:** en el `<style>` con alcance de página de las dos rutas,
  dejar que la tarjeta gris llegue al mismo pie **solo en escritorio**:
  ```css
  /* .wrapper-contact-page es flex con align-items:flex-start, asi que la tarjeta
     gris no se estira; con el bloque de consentimiento la azul le saca 447px. */
  @media screen and (min-width: 992px) {
    .block-info-contact { align-self: stretch; }
  }
  ```
  A ≤991 px las tarjetas se apilan (medido: y172 y y801, ambas 311 px) y no hace falta.
  **Requiere decisión de triaje:** es la única salida que no es literalmente el
  baseline — deja la gris en 1006 px donde producción tenía 559. La alternativa es
  acortar el texto de consentimiento, y eso es copia legal, no maquetación.
- **Archivos a tocar:** `src/pages/contact-us.astro` · `src/pages/es/contact-us.astro`
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no (D4 justifica el bloque, no el desnivel)

---

### A4-03 · `overflow-wrap: anywhere` parte «{{PENDIENTE» a la mitad en las 7 filas de la tabla del modelo FTC

- **Ruta:** `/privacy-policy`  ·  **Sección:** `.legal-table` (Parte 1, tabla del 16 CFR 313 Ap. A)  ·  **Viewport:** 1440
- **Síntoma:** la columna «Do we share?» sale estrangulada y el marcador se rompe
  mid-token en las siete filas: `{{PENDIENTE` / `: Yes / No}}`.
- **Evidencia** (medido en la ruta; no hay oráculo, la referencia es el propio texto):

  | | medido | necesario |
  |---|---|---|
  | ancho de `.legal-table` | 820 px | — |
  | columnas `thead th` | 566 / **119** / 134 | — |
  | caja de `mark.pendiente` | 94×43 px = **2 líneas** | 1 línea |
  | ancho del mismo texto sin romper | — | **162 px** |
  | filas afectadas | **7 de 7** | 0 |

  Captura: `/tmp/ams/A4-p-privacy-tabla.png`.

- **Causa raíz:** [privacy-policy.astro:511-514](../src/pages/privacy-policy.astro).
  `overflow-wrap: anywhere` no solo permite romper: además **anula la aportación de
  la palabra al `min-content`** de la celda. Con `table-layout:auto` eso deja la
  columna 2 en 119 px (por debajo de los 162 que pide el token) y entonces la rompe.
  `overflow-wrap: break-word` da exactamente la misma protección contra desborde
  **sin** tocar el `min-content`, que es lo que pide el comentario de la propia regla
  («que no parta palabras a la mitad al envolver»).
- **Arreglo propuesto:** `overflow-wrap: anywhere` → `overflow-wrap: break-word` en
  `.pendiente`. Cabe: 162 + 134 deja 524 px para la primera columna, de sobra para
  su texto. Aplicar el mismo cambio en [terms.astro:305-308](../src/pages/terms.astro)
  por coherencia — ahí no hay tabla, así que no cambia nada visible.
- **Archivos a tocar:** `src/pages/privacy-policy.astro` · `src/pages/terms.astro`
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

## Notas

### La sección de equipo (D1): comprobado, no dejó hueco

El encargo pedía verificar que su ausencia no dejara margen doble ni sección vacía.
**No lo dejó**, y la prueba es el orden del baseline:

| | baseline `/about-us` | port `/about-us` |
|---|---|---|
| `.mission-vision` | y1304 → 2524 | y1304 → 2524 |
| `.call-action` | y2524 → **2757** | y2524 → **2757** |
| `.team` | y2757 → 3514 | — |
| `footer` | y3514 | y**2757** |

El pie arranca **exactamente** donde termina `.call-action`: 0 px muertos, ningún
margen colapsado de más, ninguna sección vacía. Y esa secuencia
`.call-action → footer` es la que ya usan `baseline/html/index.html` y las 12 fichas
de servicio del propio oráculo, así que además es coherente con el sitio.
El inventario de clases confirma que lo único que falta del `<main>` son las 14
clases del bloque de equipo (`team`, `wrapper-team`, `block-team`×6, `pic-team`×6,
`block-info-team`×6, `title-center`, `collection-*-team`, `w-dyn-*`).

### Falsos positivos descartados

1. **T3 · `div.info-contact-page[2]` 259,6 → 169,3 px.** Puro desfase de índice: la
   dirección pasó a `<address class="info-contact-page">`, así que la lista de
   `div.` se corre una posición. Los dos valores están en los dos lados (260 y 169),
   verificado nodo a nodo. Mismo caso para `div.container.w-container.w-layout-blockcontainer[3..5]`
   en `/about-us` y `/contact-us`, que se corren por la sección de equipo ausente.
2. **T3 · Cromo (F1).** `.link-footer` `inline`→`inline-flex` con 44 px,
   `.list-item-footer` 25→44, barra superior 43,75→44, `.brand`/`.logo` 190×150→150×64,
   `.menu-button`, `.nav-telefono`, `.nav-volver`, `.saltar-al-contenido`,
   `.block-social-media` a `display:none` en móvil. Es el rediseño del cromo móvil
   **ratificado** (auditoria-diseno.md M1-M8 y D1-D5). No es mío y no es divergencia.
3. **T3 · `html.wf-*-active`** (48 clases) en `FALTA`: las inyecta `webfont.js` en
   producción. El port no lo usa.
4. **«Monday - Friday (8:00 AM - 5:00 PM)» en inglés dentro de `/es/contact-us`.**
   Lo cacé y lo descarté: auditoria-diseno.md §6 dice «**El NAP** — teléfono,
   dirección, correo y **horario** salen de `NEGOCIO` […] no se reescribe ni se
   traduce», y `src/lib/i18n.ts:10-14` nombra **esa cadena exacta** como decisión
   deliberada para las dos lenguas. Los rótulos sí están traducidos
   («Horario de atención»). Está justificado; no se reporta.
5. **`/es/contact-us` enlaza a `/privacy-policy` en inglés.** Es deliberado y ya va
   marcado con `hreflang="en"` ([es/contact-us.astro:302-309](../src/pages/es/contact-us.astro)),
   con la razón escrita: traducir un aviso GLBA sin revisor cualificado es justo lo
   que impiden D3 y D4.
6. **El baseline de `/about-us` desborda en horizontal a 375** (`scrollWidth` 443 vs
   375; `h1.h1` llega a x378). El port **no** (`scrollWidth === 375` en las 6 rutas).
   Es un defecto del oráculo, no del port.
7. **`.icon-news`.** El port declara `width="50" height="50"` y pinta 100×100; el
   baseline pinta 0×100 hasta que carga el SVG. El port reserva el hueco, o sea que
   mejora. No es divergencia.
8. **`path-*` / `circle-*` ausentes** (`path-biak4`, `circle-ugge8`, …): identificadores
   que genera Webflow dentro de los SVG. `grep` sobre las 4 hojas de estilo devuelve
   **0** reglas para ellos. Los `.ikonik-*`, que sí llevan CSS
   ([accounting-max.webflow.css:2015](../src/styles/vendor/accounting-max.webflow.css)),
   están en los dos lados y computan 35×35 `rgb(36,49,55)` idénticos.
9. **`w-inline-block` 10 → 8** en `/contact-us`: son exactamente los dos `<a href="#">`
   de dirección y horario que dejaron de ser enlaces, documentado en
   [contact-us.astro:114-118](../src/pages/contact-us.astro).
10. **`img.bg-pic` 449,109 → 449,125 px.** 0,016 px. Ruido de subpíxel.
11. **`.legal-table` «desbordando» a 375.** Los `th`/`td` salen a x632 con `vw` 375,
    pero `.legal-table-scroll{overflow-x:auto}` lo contiene: `documentElement.scrollWidth`
    es 375. Funciona como se pretendía.
12. **Casillas de consentimiento de 18×18.** Por debajo del 24×24 de SC 2.5.8 si se
    mide solo la caja, pero llevan `<label for>` y el objetivo real es la fila entera
    (372×90 EN, 372×108 ES). Pasa.
13. **`fetchpriority` en las 4 rutas sin hero.** `/contact-us`, `/privacy-policy` y
    `/terms` no llevan ninguno, igual que ya verificó auditoria-diseno.md F2 (el LCP
    es texto). `/about-us` y `/es/about-us` llevan exactamente uno, en el hero. Correcto.

### Lo que NO pude comprobar

- **El anillo de foco.** El instrumento no llega: en este Chrome headless
  `element.focus()` no hace que el nodo case `:focus-visible`, y `focus({focusVisible:true})`
  tampoco (comprobado: `matches(':focus-visible')` da `false` en los dos lados y en
  los dos servidores). Por tanto el `outline: none` que se lee tras enfocar **no
  prueba nada** y no lo reporto. Por cascada la regla debería ganar: la de
  [site.css:10-13](../src/styles/site.css) va **fuera de capa** y todos los
  `outline:0` de `webflow.css` van en `layer(webflow)`, así que la especificidad no
  importa. Queda para V1 con teclado real. Además es territorio F0, no mío.
- **DPR 2.** Todo está medido a DPR 1. Para A4-01 el cálculo derivado dice que a DPR 2
  el port seguiría ampliando un 25 % (pide 968 → coge 1080w = 1080×720 para una caja
  de 968×900) frente al 8 % del baseline; con el arreglo propuesto pediría 1350 → 1250w
  y quedaría en el mismo 8 %. Es cálculo, no medida.

### Límites del barrido

- Solo 1440 y 375, que es lo que pedía el encargo. No se midió 768, 991 ni 1064,
  donde `SIZES_MV` cambia de rama; el razonamiento de A4-01 cubre todo ≥992 pero solo
  1440 está medido.
- `medir` únicamente ve elementos **con clase**. Lo compensé con dos instrumentos más:
  un `diff` de inventario de clases sobre el HTML crudo de las 4 rutas con oráculo, y
  un `diff` del **texto plano** de `<main>`. En `/about-us` el texto salió idéntico
  carácter a carácter (2717 en los dos lados, `diff` vacío — incluida la errata del
  cliente «your choice.We proudly serve», que sigue migrada tal cual). En `/contact-us`
  la única diferencia son las 4 etiquetas, el bloque de consentimiento y el señuelo,
  todos deliberados.
- Para las 4 rutas sin oráculo la referencia fue: `/es/*` contra su EN ya corregido
  (205 y 224 nodos en ambos lados, solo reflujo por longitud del español), y las dos
  legales contra `baseline/html/post/understanding-tax-deductions.html`, con el que
  comparten `.header-page-blog` / `.block-title-blog` / `.block-blog-page`. Coinciden
  al píxel: padding `64px 32px 0` y `64px 32px 64px 0` a 1440, `96px 32px 32px` y
  `32px` a 375, `h1` 45→30 px. **No inventé diseño en ninguna de las cuatro.**
- Comprobado de paso y **correcto**, sin hallazgo: un solo `<h1>` y un solo `<main>`
  en las 6; `noindex` presente en `/es/about-us`, `/es/contact-us`, `/privacy-policy`
  y `/terms`, y ausente en las dos EN; `rel=canonical` correcto en las 6; jerarquía de
  encabezados sin saltos; `stix-two-text` aplicándose de verdad en los `h1/h2/h3`
  (45/35/25 px) en los dos servidores; cero enlaces internos rotos; `<address>` con
  `font-style: normal` en las tres rutas que lo usan; contrastes de las páginas legales
  entre 9,95:1 y 19,56:1.
- **Comentario obsoleto, no bug:** [privacy-policy.astro:29-31](../src/pages/privacy-policy.astro)
  avisa de que el filtro del sitemap «solo excluye `/es/`» y que la ruta entraría. Ya
  no: [astro.config.mjs:38-47](../astro.config.mjs) excluye las dos legales, y
  `dist/client/sitemap-0.xml` tiene 26 URLs, ninguna de ellas `/es`, `/privacy-policy`
  ni `/terms`. El arreglo de auditoria-diseno.md §7 sigue en pie.
- **Dato de navegación, no hallazgo:** a `/terms` solo se llega desde `/privacy-policy`.
  Ni el pie ni el `<nav>` enlazan ninguna de las dos. Son borradores `noindex` (D4),
  así que puede ser intencionado; lo dejo anotado para el triaje.
