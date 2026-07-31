# A6 · Transversal — tipografía, tokens, espaciado y salud de `site.css`

**Ámbito:** lo que cruza las 54 rutas. No se auditan rutas concretas: se audita el sistema.
**Instrumento:** `tools/capturas.mjs medir|diff` + sondas CDP propias en el scratchpad
(nunca en el repo). Chrome propio: puerto 9236, perfil `/tmp/ams-perfil-A6`.
**Assert T1 ejecutado antes de cada tanda:** `:4321` y `:4327` vivos en las 6 sesiones.

**Muestra:** 6 tipos de ruta (portada, servicio, post, blog-news, about-us, contact-us)
en EN contra su baseline, y sus 6 equivalentes `/es/` contra el EN ya corregido.
Medido a **1440** y **375**; desbordes también a **320**.

**Resultado de conjunto:** el sistema está sano. **Cero divergencias de tipografía**
(familia, peso, tamaño, interlineado, tracking, `text-transform`, `text-decoration-line`)
entre baseline y port en las 6 rutas, a 1440 y a 375. **Los 9 tokens `:root` son
idénticos**. **Cero desbordes horizontales** a 375 y 320 en EN y ES. **Cero `!important`**
fuera del bloque permitido, **cero reglas muertas**, y **los 15 arreglos de
`auditoria-diseno.md` siguen en pie**. Los tres hallazgos de abajo son lo único real.

---

### A6-01 · El teléfono y el correo del pie se repintan a `#333` y subrayados

- **Ruta:** las 54 (verificado en `/`, `/es`, `/blog-news`, `/contact-us`) · **Sección:** `footer .list-footer` (bloque NAP) · **Viewport:** 1440 y 375

- **Síntoma:** en el bloque «Contact Information» del pie, las dos primeras líneas
  (teléfono y correo) salen en gris `#333` y **subrayadas**, mientras las otras dos
  (dirección y horario) siguen en navy y sin subrayar. En producción las cuatro son
  idénticas. La incoherencia se ve dentro del mismo bloque de cuatro líneas.

- **Evidencia:**

  | `.link-footer` (elemento 1 y 2 del NAP) | baseline | port |
  |---|---|---|
  | etiqueta | `<div class="link-footer">` | `<a href="tel:…">` / `<a href="mailto:…">` |
  | `color` | `rgb(36, 49, 55)` (`--bllue`) | `rgb(51, 51, 51)` (`--black`) |
  | `text-decoration-line` | `none` | `underline` |
  | caja (1440) | 236×25 | 122×44 y 236×44 |
  | contraste sobre blanco | 13,38:1 | 12,63:1 |

  Los elementos 3 y 4 del mismo `<ul>` (dirección y horario) siguen siendo `<div>` y
  computan `rgb(36, 49, 55)` / `none` en **los dos lados**: la divergencia es solo de
  los dos que cambiaron de etiqueta. Medido igual en `/`, `/es` y `/blog-news`.

  No es una regresión de contraste (12,63:1 sigue muy por encima de 4,5:1); es paridad
  de color y una incoherencia interna nueva.

- **Causa raíz:** [`src/components/Footer.astro:155`](../src/components/Footer.astro) y
  `:158` convierten los dos `<div class="link-footer">` de producción en `<a href="tel:">`
  y `<a href="mailto:">`. A partir de ahí les aplica
  `a { color: var(--black); text-decoration: underline }`
  (`src/styles/vendor/accounting-max.webflow.css:112`), que a un `<div>` nunca le llegaba.
  **La conversión está justificada** en el propio comentario de `Footer.astro:10-13` (la
  llamada es la conversión del despacho) y no se discute; lo que falta es la regla que
  compense el repintado — exactamente la compensación que
  [`site.css:85-88`](../src/styles/site.css) ya hace para el caso simétrico de
  `/contact-us` (`.block-icon-contact-page`, ahí `<a>` → `<div>`).

- **Arreglo propuesto:** añadir a `site.css` (fuera de capa, junto al bloque del pie):

  ```css
  .link-footer[href^="tel:"],
  .link-footer[href^="mailto:"] {
    color: var(--bllue);
    text-decoration: none;
  }
  ```

  Selector verificado en `/`, `/es` y `/blog-news`: casa **exactamente 2 elementos** y
  ninguno más (los 12 servicios del pie viven en `.collection-list-footer` y la columna
  de navegación no tiene ningún `a.link-footer`, comprobado con
  `.list-footer a.link-footer:not([href^='tel:']):not([href^='mailto:'])` → 0).
  Mantiene intacta la mejora de accesibilidad: siguen siendo enlaces reales.

- **Archivos a tocar:** `src/styles/site.css`
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** **no.** Ninguno de los dos
  menciona el pie NAP. `Footer.astro` justifica el cambio de etiqueta, no el repintado.

---

### A6-02 · Las reseñas se consultan sin `order()`: el carrusel no es el de producción

- **Ruta:** 26 (portada EN+ES y las 24 fichas de servicio) · **Sección:** `.reviews` / `.name-customer` · **Viewport:** los dos

- **Síntoma:** el carrusel de testimonios muestra otras personas, y en otro orden, que
  el sitio de producción. La maqueta es idéntica; lo que cambia es qué reseña cae en
  cada posición visible.

- **Evidencia** (primeros 6 `.name-customer`, portada):

  | | primeros 6 |
  |---|---|
  | baseline (`:4327/index.html`) | Juan T. · Andrea K. · Andrés V. · Javier L. · Paola E. · Camila R. |
  | port (`dist/` del build 13:31) | Sofía M. · Carlos R. · Michael G. · Laura P. · Miguel H. · Valentina D. |
  | port (dev `:4321`, 2 peticiones) | Sofía M. · Carlos R. · Michael G. · Laura P. · Miguel H. · Valentina D. |
  | port `/services/audit-assistance` | Sofía M. · Carlos R. · Michael G. · Laura P. · Miguel H. · Valentina D. |

  Los 20 testimonios están todos presentes en los dos lados; solo cambia el orden.
  Hoy es **estable entre peticiones y entre build y dev**, pero esa estabilidad no está
  garantizada por nada: es el orden interno de Sanity.

- **Causa raíz:** [`src/lib/sanity.ts:111`](../src/lib/sanity.ts) —
  `sanity.fetch('*[_type == "review"]{ _id, author, quote }')`. **Es la única de las tres
  consultas de colección sin cláusula `order()`**: `service` (`:95`) y `post` (`:103`)
  sí llevan `| order(order asc, title asc)`. Sin `order()`, GROQ no garantiza ninguna
  ordenación, así que el orden puede cambiar solo con reguardar un documento o reimportar
  el dataset — y cambiaría en un build sin que nadie toque código.

- **Arreglo propuesto:** **parar y preguntar antes de tocar nada.** El orden de producción
  es el del CSV de importación y hoy no hay ningún campo para reproducirlo:
  `DECISIONS.md` D5 deja escrito que los `Published On` de las 20 reseñas son idénticos
  (artefacto de importación masiva), o sea que **no existe fecha por la que ordenar**.
  Las dos salidas posibles:
  1. añadir un campo `order` al esquema `review` y poblarlo con el orden del CSV, y
     cerrar la consulta con `| order(order asc)`; **es escritura en Sanity** y la regla
     de §5 obliga a preguntar antes;
  2. si el orden no importa al cliente, dejarlo — pero entonces hay que cerrar igualmente
     con un `order()` determinista (`| order(_id asc)`) para que el carrusel no cambie
     solo entre despliegues.

  Lo que **no** se puede hacer es dejarlo como está: la no-determinación es el defecto,
  el orden concreto es una decisión de contenido.

- **Archivos a tocar:** `src/lib/sanity.ts` (y, solo si el cliente aprueba la opción 1,
  `src/sanity/schemas.mjs` + datos)
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** **no.** D5 explica por qué no hay
  fecha utilizable, pero no sanciona el orden divergente ni la falta de `order()`.

> Solapa con A2 (portada) y A3 (servicios), que verán el mismo síntoma en su ruta. La
> causa raíz es una sola línea en un fichero de F0, por eso se reporta aquí.

---

### A6-03 · Los `clip-path` están declarados dos veces, y el bloque de `site.css` es inalcanzable

- **Ruta:** las 24 fichas de servicio (EN+ES) · **Sección:** hoja de estilos · **Viewport:** los dos

- **Síntoma:** ninguno visible hoy. El defecto es que hay **dos fuentes de verdad** para
  los mismos recortes, y una de ellas no puede ganar nunca.

- **Evidencia:** los cinco selectores están declarados con **valores idénticos** en dos sitios:

  | selector | `site.css` | `<style>` con scope de la plantilla |
  |---|---|---|
  | `.corner-top-1`, `.corner-bottom-1` | `:567-570` | `services/[slug].astro`, `es/services/[slug].astro` |
  | `.corner-top-2`, `.corner-bottom-2` | `:571-574` | ídem |
  | `.background-services` (+ `@media 789`) | `:576-583` | ídem |

  Astro emite el scope como atributo, no con `:where()` — verificado en el HTML
  construido (`dist/client/services/monthly-bookkeeping-accounting/index.html`):

  ```
  .background-services[data-astro-cid-njl2q4gy]{clip-path:polygon(20% 0,100% 0,100% 100%,0% 100%);…}
  .corner-top-1[data-astro-cid-njl2q4gy],.corner-bottom-1[data-astro-cid-njl2q4gy]{clip-path:…}
  ```

  Eso es **0-2-0** contra el **0-1-0** de `site.css`, y las dos van sin capa: gana siempre
  la de la plantilla. Como `.background-services` **solo existe en esas 24 rutas** (contado
  sobre las 54 de `dist/`), el bloque `site.css:576-583` **no gana en ninguna ruta del
  sitio: es código muerto**. Los `.corner-*` sí se reparten: `site.css` gana en las 2
  portadas (donde están las esquinas de `.reviews`, 26 rutas en total) y la plantilla en
  las 24 fichas.

  Paridad verificada — el `clip-path` computado es idéntico en los dos lados, o sea que
  **hoy no se ve nada**:

  | | baseline | port |
  |---|---|---|
  | `.background-services` (`/services/monthly-bookkeeping-accounting`) | `polygon(20% 0px, 100% 0px, 100% 100%, 0% 100%)` | idéntico |
  | `.corner-top-1` (`/` y ficha) | `polygon(50% 50%, 100% 0px, 0px 0px, 0% 100%)` | idéntico |
  | `.corner-top-2` | `polygon(50% 50%, 100% 0px, 100% 100%, 0% 100%)` | idéntico |
  | `.block-pic` | `polygon(90% 0px, 100% 50%, 90% 100%, 0px 100%, 0px 0px)` | idéntico |

- **Causa raíz:** [`src/styles/site.css:565-583`](../src/styles/site.css) y los bloques
  `<style>` de [`src/pages/services/[slug].astro`](../src/pages/services/[slug].astro) y
  [`src/pages/es/services/[slug].astro`](../src/pages/es/services/[slug].astro). El
  comentario de la plantilla dice «si otra ruta acaba necesitando lo mismo, su sitio es
  `site.css`» — y ya está en `site.css`; la migración se hizo pero no se retiró la copia.

- **Arreglo propuesto:** quitar de los dos `<style>` con scope **solo los `clip-path`
  duplicados** (`.corner-top-1/.corner-bottom-1`, `.corner-top-2/.corner-bottom-2`,
  `.background-services` y su `@media`), dejando en la plantilla lo que sí es de página:
  `background-size: cover` y `background-position: 50%` de `.background-services`, que no
  están en `site.css` y son el `lqip` del LCP. `site.css` no se toca: sus `.corner-*` hacen
  falta para las 2 portadas y su `.background-services` pasa a ser el único declarante.

- **Archivos a tocar:** `src/pages/services/[slug].astro`, `src/pages/es/services/[slug].astro`
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

## Lo verificado que está BIEN (para que nadie lo repita)

### Tipografía — 0 divergencias

Agregado por `(selector, propiedad)` cruzando las 6 rutas, sobre los nodos presentes en
los dos lados: **0 patrones** en `font-family`, `font-weight`, `font-size`, `font-style`,
`line-height`, `letter-spacing`, `text-transform` y `text-decoration-line`, **a 1440 y a
375**. Ningún elemento cae a un fallback.

Medido además con `canvas.measureText` (inmune a los `transform` de IX2) sobre el mismo
texto de control en `/about-us` y `/services/monthly-bookkeeping-accounting`:

| | baseline | port |
|---|---|---|
| `.h1` (stix-two-text 700 45px) | 324,67 | 324,67 |
| `.h2` (stix-two-text 700 35px) | 252,52 | 252,52 |
| `.h3` / `.title-special` (700 20px) | 144,30 | 144,30 |
| `.h3` en ficha de servicio (700 25px) | 180,37 | 180,37 |
| `<em>` (Ubuntu 400 16px) | 112,34 | 112,34 |
| `<strong>` (Ubuntu 700 16px) | 120,51 | 120,51 |

`stix-two-text` sirve y **se aplica de verdad** en los dos lados (`stix45x700` mide 324,67
frente a 342,64 del `sans-serif` desnudo). `.title-cms-services`, `.title-blog`,
`.name-customer`, `body`, `<strong>` y `<em>`: familia y peso idénticos.

**ES incluido:** `/es`, `/es/about-us` y `/es/services/monthly-bookkeeping-accounting`
contra su equivalente EN → **0 divergencias** en las 13 clases sondeadas, mismos conteos
de elementos y `lang` correcto (`en`/`es`). La cobertura de glifos de `stix-two-text` para
acentos (`áéíóúüñÁÉÍÓÚÑ`) y signos españoles (`¿¡«»—`) es propia de la familia, no del
fallback: ningún titular en español sale con dos fuentes mezcladas.

### Tokens de color — 9/9 idénticos

`:root` de `accounting-max.webflow.css:41-50`, resueltos a su valor **computado** (no al
texto declarado) en `/`, `/services/monthly-bookkeeping-accounting` y `/about-us`:

`--bllue #243137` · `--black #333` · `--white white` · `--green-1 #9dbf43` ·
`--green-2 #6da228` · `--green-3 #87af0b` · `--gray #dedede` · `--white-2 white` ·
`--black-2 black` — los nueve dan el mismo `rgb()` en los dos lados en las tres rutas.

`--menu-alto` solo existe en el port: es nuestro (`site.css:140-142`), no un token de Webflow.

### Escala de espaciado — sin patrón divergente

Agregado de `padding`, `margin`, `gap`, `grid-template-columns`, `column-count` y
`flex-flow` sobre las 6 rutas a 1440: **3 patrones**, los tres en
`div.container.w-container.w-layout-blockcontainer`, y los tres descartados abajo
(dos por desfase de índice, uno por no reproducible). Cero patrones a nivel de sección.

### Salud de `src/styles/site.css` (632 líneas, 67 selectores)

| comprobación | resultado |
|---|---|
| `!important` | **4, todos en `:33-36`**, dentro del bloque `prefers-reduced-motion` de `:29-38`. Fuera de ahí, **cero** (la única otra aparición, `:313`, está dentro de un comentario). |
| `@layer webflow {}` de `:55-89` | **intacto** — `:where(button.w-nav-button, button.w-dropdown-toggle, button.faq-question, button.button-slider-cms)` + `button.faq-question, .block-icon-contact-page { color: var(--black) }`. |
| `@layer webflow {}` de `:103` | **intacto** — `img { width:auto; height:auto }` sigue ahí. El bloque ahora llega a `:118` porque contiene además `svg.icon-check`; las dos reglas capadas a propósito no se han tocado. |
| orden de capas | `main.css` mete los 3 ficheros de vendor en `layer(webflow)` y `site.css` va suelto. Correcto. |
| reglas muertas | **cero.** Los 67 selectores probados con `querySelectorAll` sobre 9 rutas (`/`, servicio, `/about-us`, `/contact-us`, `/blog-news`, post, `/privacy-policy`, `/terms`, `/es`) en dos estados: reposo y con el cajón móvil + desplegable + FAQ abiertos. Los 23 selectores de estado (`[data-nav-open]`, `[data-nivel="2"]`, `.w--open`, `html.nav-abierto`, `[data-open]`) casan todos al abrir. |
| reglas duplicadas | **una sola**, la de A6-03. Ninguno de los 8 ficheros con `<style>` de página choca con `site.css` en ningún otro selector. Las plantillas EN y ES de servicio y de contacto tienen bloques con scope **byte a byte equivalentes** entre sí. |

### Los 15 arreglos de `auditoria-diseno.md` siguen en pie (375 px)

| | esperado | medido en el port |
|---|---|---|
| M1 `.logo` | 48 px | **48** (baseline 100) |
| M1 `.brand` | sin blob colgante | **59×64**, fondo transparente (baseline 163×150 navy) |
| M2 `.menu-button` | 48×48 transparente | **48×48**, `background-color: rgba(0,0,0,0)`, y es `<button>` (baseline `<div>` 86×81 `rgb(222,222,222)`) |
| M6 `.nav-telefono` | 79,3×44 | **79×44** (no existe en el baseline) |
| M7 `.top-bar .block-social-media` | oculto | **`display:none`** (baseline `flex`, 89×25) |
| D1 `.link-footer` | ≥44 px | **122×44**, `inline-flex` (baseline 247×18 `inline`) |
| D2 campo del boletín | 50 px, **no** 44 | **311×50 en los dos lados** — la regla que lo recortaba a 44 sigue correctamente retirada (`site.css:183-189`) |
| D3 enlace de salto | existe | `a.saltar-al-contenido` **128×45** |

### Desbordes horizontales — cero

`document.documentElement.scrollWidth > innerWidth` en las 6 rutas EN (baseline y port) y
las 6 `/es/`, **a 375 y a 320**: 18 páginas × 2 anchos, todas `scrollWidth === innerWidth`,
cero elementos con `right > innerWidth`. Incluida `/es` a 320, que es el caso más apretado
(español + viewport mínimo).

---

## Notas · falsos positivos descartados y límites del barrido

**Trampas propias del método que produjeron ruido y cómo se cerraron:**

1. **`.h1` un 5,8 % más ancha y `.h3`/`.title-special`/`<em>` un 18 % más anchas en el
   port.** Falso, y era **mío**: medí el run de texto con `Range.getBoundingClientRect()`,
   que **incluye los `transform` de los ancestros**, y mi primera sonda no hacía el barrido
   de scroll que sí hace `capturas.mjs`. El baseline ejecuta IX2, así que sus entradas
   estaban a medio animar (`div.block-item-features` y `div.wrapper-bar-features` con
   matriz no identidad). Repetido con barrido de scroll y con `canvas.measureText`
   (inmune a `transform`): **idéntico a dos decimales en los dos lados**. Es la trampa que
   §2 documenta para el `rect`, aplicada al `Range`.

2. **8 divergencias de `color` en la portada a 1440** (el hilo del encargo). Son 6 + 2:
   - **6 × `img.icon-sociall`**, `rgb(51,51,51)` → `rgb(36,49,55)`, en las 6 rutas (36
     nodos). Consecuencia de que los 3 iconos sociales pasan de `<a href="#">` a `<span>`,
     que es la decisión **ratificada** de `auditoria-diseno.md` R3 / D11 (no existe URL real
     y no se inventa): el `<a>` heredaba `--black` y el `<span>` hereda el navy del `body`.
     **Impacto visual cero**: es `color` sobre un `<img alt="">`, que no pinta texto.
   - **`div.w-form-done` y `div.w-form-fail`**, blanco → navy. Deliberado y documentado en
     [`site.css:615-621`](../src/styles/site.css): heredaban el blanco de `.email-subscribed`
     sobre `#dddddd` = 1,3:1, o sea mensaje de confirmación ilegible.

3. **`.container` de `/about-us` divergiendo en `margin` y en `color` en las dos
   direcciones a la vez.** Desfase de índice (T3): el baseline tiene 7 y el port 6, porque
   falta la sección de equipo (D1). Comprobado con la secuencia completa que manda §1: la
   del port es **exactamente** la del baseline quitándole el índice 3, elemento a elemento,
   en `margin` (`[63,63,63,63,95,63,63]` → `[63,63,63,95,63,63]`) y en `color`.

4. **`h2.h2` divergiendo en `color` en la ficha de servicio.** También desfase de índice:
   el port tiene un `h2.h2` **más** que el baseline. No es contenido nuevo — producción
   marcaba «global financial solutions» como **un segundo `<h1>`**
   (`<h1 class="h2">`), y el port lo baja a `<h2 class="h2">`. Conteo de encabezados:
   baseline `2 h1 / 6 h2 / 5 h3`, port `1 h1 / 7 h2 / 5 h3`. Es el «un solo `<h1>` en las
   54 rutas» **ya ratificado** en `auditoria-diseno.md` §4 F2. Los otros 5 `h2` coinciden
   en texto, color y `y` exacto en los dos lados.

5. **`.container[1]` de la portada con `margin: 0px 63px` → `0px`.** **No reproducible.**
   Tres medidas de cada lado: baseline 3/3 `0px 63px`, port **2/3** `0px 63px`. El `rect`
   es idéntico `(95, 1135, 1250, 335)` en las seis. Es un valor usado de un margen `auto`
   capturado a mitad de layout, no una divergencia. Descartado.

6. **`/es/` renderizando a 981 px con el dispositivo a 375** (pinta a «falta el
   `<meta viewport>`»). Era **mi URL**: `astro.config.mjs:30` fija `trailingSlash:"never"`,
   así que `:4321/es/` da **404** y yo estaba midiendo la página de error de Astro, que no
   lleva viewport. Las **54 rutas construidas sí lo llevan** (comprobado una por una), y
   `/es` sin barra mide 375/375 y 320/320. Ningún enlace interno usa `/es/` con barra final.

7. **`a.brand.w-nav-brand` con el fondo navy → transparente a 375.** Es el rediseño del
   cromo móvil, **ratificado** (`site.css:285-292`, M1). No se re-reporta.

8. **`Ubuntu 400` en ASCII y `Ubuntu 700` en acentos marcados como «fallback»** por mi
   sonda de cobertura. Artefacto del umbral: 84,96 vs 84,50 y 123,14 vs 123,56, ambos por
   debajo de los 0,5 px que exigía. `Ubuntu 700` en ASCII difiere 1,28 px en la misma
   página, lo que prueba que la familia sí se aplica. No hay ningún fallback real.

9. **4 selectores marcados como muertos** (`.menu-button .icon::before`, `::after`, y sus
   variantes `.w--open`). Son **pseudoelementos**, que `querySelectorAll` no puede casar por
   definición; su sujeto `.menu-button .icon` está vivo. Limitación del instrumento.

10. **El baseline carga ~250 `FontFace` y el port 67.** Producción tira de `webfont.js` y
    se trae los sets completos de Google Fonts; el port pide exactamente lo que el CSS
    exige. Ya está registrado como verificado en §3; no es divergencia.

11. **Una pared de divergencias de `padding`/`display`/`height` en las secciones de primer
    nivel.** Mía otra vez: comparé `main.children` contra `body.children` porque el
    baseline (export de Webflow) **no tiene `<main>`** y el port sí, además de
    `section.menu` → `header.menu` y `section.footer` → `footer.footer`. Todo el listado
    salía corrido una posición. Rehecho indexando por selector: **cero divergencias**.

**Observado y entregado a otros agentes (no es mi ámbito, no lo reporto como hallazgo):**

- El **orden de los 12 servicios del pie** y el de los **posts de `/blog-news`** tampoco es
  el de producción, pero ahí sí hay `| order(order asc, title asc)`
  (`src/lib/sanity.ts:95` y `:103`): es determinista y sale alfabético. Cuál debe ser el
  orden correcto es decisión de contenido, no de CSS. Para A2 y A4.
- La portada del port mide 6561 px contra 6522 del baseline a 1440, y `/contact-us`
  2960 contra 2575. Son diferencias de alto de ruta concreta; A2 y A5.

**Límites del barrido:**

- 6 tipos de ruta en EN contra baseline + 6 en ES contra el EN corregido. **No** se han
  medido las 54: para lo transversal (fuentes, tokens, `site.css`) la instancia concreta de
  una plantilla es indiferente porque la hoja es la misma, y no apareció nada específico de
  instancia que obligara a verificar 3.
- **Estados `:hover` no medidos**: no se pueden consultar con `querySelectorAll`. Solo se
  ha comprobado que el sujeto de cada regla `:hover` de `site.css` existe.
- **Contraste**: solo se recalculó el del pie (A6-01). R1 de `auditoria-diseno.md`
  (`--green-2` a 3,07:1, 14 usos) está reportado y ratificado como no arreglado; no se
  re-reporta.
- **No se ejecutó `npm run build`** (prohibido). El barrido de reglas muertas y de
  duplicados usó `dist/` tras comprobar que **ningún fichero de `src/` es más reciente**
  que él (`find src -type f -newer dist` → vacío), o sea que estaba al día.
- No se ha tocado ni un fichero del proyecto. El único escrito es este informe.
