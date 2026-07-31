# V3 · Regresiones y paridad — verificación final

**Assert de vivacidad:** ejecutado antes de cada tanda (7 veces). `:4321` y `:4327`
vivos en todas. **Ninguna medida de este informe se tomó contra un servidor caído; no
hay T1 aquí.** Las 54 rutas del puerto respondieron 200 en el barrido de imágenes.

**Instrumento:** `tools/capturas.mjs medir|diff` + instrumental propio por CDP en
`/tmp/ams/V3/` (`cdp.mjs` con decodificador PNG sin dependencias, `t3.mjs` como
clasificador de desfase de índice). Chrome en `AMS_PUERTO=9271`, perfil
`/tmp/ams-perfil-V3`. **No he tocado ni un fichero de código, ni Sanity, ni git.**
El único fichero que escribo es este.

**Veredicto: CON RECHAZOS — 7, de los cuales 6 ya estaban documentados.**
Los tres arreglos de la ronda 2 (V2-01, V1-R3, V1-R4) **aguantan los tres**, y he
intentado romperlos con medidas nuevas, no con las suyas. Los siete B-1…B-7 siguen en
pie. Los 15 de `auditoria-diseno.md` siguen en pie. **Cero regresiones de paridad:**
ninguna ruta empeora y dos mejoran. El único rechazo nuevo es una cifra falsa en un
documento vinculante.

---

## 1 · Los tres arreglos de la ronda 2, intentando romperlos

### 1.1 · V2-01 · AVIF → `fm=webp` · **AGUANTA**

Barrido sobre **las 54 rutas** (no una muestra), extrayendo `src` y `srcset` del HTML
servido: **118 URL de Sanity distintas**. Pedidas con la cabecera **real de Chrome**
`Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8`:

| | resultado |
|---|---|
| `image/avif` | **0 de 118** |
| `image/webp` | 94 (todos los mapas de bits) |
| `image/svg+xml` | **24 (los 24 SVG, sin rasterizar)** |
| respuestas ≠ 200 | **0** |
| cuerpos de 0 bytes | **0** (el más pequeño, 391 B) |
| `auto=format` en el marcado de las 54 rutas | **0** · en `dist/`: **0**, con 938 `fm=webp` |

**Los SVG: el punto crítico.** `fm=webp` rasteriza un SVG, así que el helper no debe
tocarlos nunca. Comprobado a dos niveles:

- **Por dato:** las 24 URL `.svg` de las 54 rutas salen **sin un solo parámetro de
  consulta**. Cero `.svg` con `?`.
- **Por código:** la separación es estructural, no suerte. Los SVG se emiten siempre
  con `.url` en crudo — `Nav.astro:123/142/161`, `index.astro:183/303/349/510` — y los
  once `src()` sólo reciben fotografías (`foto.url`, `f.imagen.url`, `hero.url`,
  `a.url`). Los 11 helpers llevan `fm=webp`; no queda ningún otro sitio donde se
  construya una URL de Sanity (`grep` sobre `src/`).

**Trampa que casi me cuela un resultado inválido, y el control que la desmonta.** Mi
extractor sacaba las URL del HTML crudo, o sea con las entidades sin decodificar:
`?w=800&amp;q=75&amp;fm=webp`. Un navegador nunca pide eso. Repetí las 118 con las URL
**decodificadas** y comprobé el comportamiento del CDN con el mismo asset:

| consulta | `content-type` | bytes |
|---|---|---|
| `?w=800` (sin `fm`) | `image/jpeg` | 18 354 |
| `?w=800&q=75&fm=webp` | **`image/webp`** | 10 706 |
| `?w=800&amp;q=75&amp;fm=webp` | `image/webp` | 10 706 |
| `?w=800&q=75&auto=format` | **`image/avif`** | 8 805 |

O sea: Sanity tolera `&amp;` como separador (por eso las dos pasadas coinciden), sin
`fm` **no** negocia, y con `auto=format` **sí** devuelve AVIF — que es exactamente el
defecto que V2-01 describía y que hoy ya no se dispara. Las 118 decodificadas:
**0 AVIF, 0 no-200, 0 SVG rasterizado.**

**Regresión que busqué y no encontré: pérdida del canal alfa.** Las tres fotos de
`.features` son PNG RGBA. `fm=webp` podría aplastarlas a un fondo opaco. Leí la
cabecera RIFF de 8 de los 29 PNG de origen: las 8 son `RIFF/WEBP/**VP8X**` con el
**bit ALPHA a 1**. La transparencia se conserva.

**Documentación:** `baseline/auditoria-diseno.md:308-315` ya lleva la corrección
`R2-A` que desmiente la afirmación «ningún AVIF». Correcta.

### 1.2 · V1-R3 · anillo de la fachada de vídeo · **AGUANTA**

Con **`Input.dispatchKeyEvent` real**, tabulando desde el principio del documento. Ni
`forcePseudoState` ni `.click()` ni `.focus()`.

| | `/` 1440 | `/es` 1440 | `/` 375 | `/es` 375 |
|---|---|---|---|---|
| Tab hasta `button.yt-facade` | **#53** | **#52** | **#49** | **#48** |
| `:focus-visible` | sí | sí | sí | sí |
| `outline` / `outline-offset` | `2px solid #fff` / **`-4px`** | igual | igual | igual |
| `::after` | `inset 0 0 0 2px rgb(36,49,55)` | igual | igual | igual |
| contenedor `.youtube` | 493×277, `overflow:hidden` | igual | 271×152 | igual |

**Mapas de píxeles** (recorte del botón + 8 px de margen, decodificado a RGB):

| comparación | píxeles distintos | caja del cambio |
|---|---|---|
| reposo → foco | **9 186** (1440) · **6 401** (375) | toda la orla |
| reposo → hover | 3 102 / 3 094 | **sólo el triángulo** `[221,123]-[288,170]` |
| **hover → foco** | **6 084 (1440) · 3 308 (375)** | toda la orla |

**Antes hover-vs-foco daban 0 px. Hoy dan 6 084 y 3 308: el foco ya no se confunde con
el ratón.**

**¿Cae dentro de la caja?** Sí. A 375 la caja del cambio es `[8,8]-[278,159]` y el
botón ocupa exactamente `[8,8]-[278,159]`. Barrido de píxel cruzando los cuatro bordes:

```
borde izquierdo, 1440           borde inferior, 375
x=-1  fuera  172,171,175        y=+1 fuera  234,234,234  (sombra de .youtube, intacta)
x= 0  navy    36, 49, 55        y= 0 dentro  36, 49, 55
x= 1  navy    36, 49, 55        y=-1 dentro  36, 49, 55
x= 2  blanco 255,255,255        y=-2 dentro 255,255,255
x= 4+ miniatura 219,238,244
```

Contraste de la banda navy contra la miniatura que tiene al lado: **12,3:1**. La sombra
de 5 px del contenedor `.youtube` sigue pintándose fuera y no la toca nadie.

> **Falso positivo mío, cazado y descartado.** Mi primera pasada a 375 daba 16 792 px
> de diferencia y el anillo «fuera de la caja». No era el anillo: el `clip` de
> `Page.captureScreenshot` va en **coordenadas de página**, y tabular mueve el scroll
> (1768 → 1558), así que las dos capturas no eran de la misma región. Restaurando el
> scroll antes de disparar, el número cae a 6 401 y la caja encaja al píxel. (Mi
> **primerísima** pasada, a 1440, salió toda blanca por lo contrario: pasé
> coordenadas de viewport sin sumar `scrollY`.)

### 1.3 · V1-R4 · sombra de reposo bajo el anillo · **AGUANTA**

Tabulando de verdad hasta el elemento (y midiendo **el que recibe el foco**, no el
primero del `querySelector` — Chrome mueve el punto de partida de la navegación
secuencial al hacer scroll, y en mi primer intento medí una tarjeta distinta de la
enfocada):

| control | `box-shadow` con foco | ¿las dos partes? |
|---|---|---|
| `a.block-bar-services` (`/` 1440, `/es` 1440, `/` 375) | `rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,0.2) 0 2px 5px 3px` | **sí** |
| `input.text-field-form` | `rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,0.2) 0 2px 5px 0` | **sí** |
| `textarea.large.text-field-form` | idem | **sí** |
| `.button-slider-cms` **con hover + foco** | `rgb(36,49,55) 0 0 0 4px, rgba(255,255,255,0.2) 0 2px 11px -4px` | **sí** |
| `.header-page a.button` (sin sombra propia) | `rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,0) 0 0 0 0` | correcto: relleno nulo |

**Prueba de píxel sobre la tarjeta**, línea a media altura cruzando el borde izquierdo
(`/` 1440). Compárese con la evidencia de V1-R4, donde con foco salía «fondo liso»:

| x | reposo | foco | lectura |
|---|---|---|---|
| −10…−5 | 207,206,213 → 196,195,199 | **idénticos** | **la sombra de reposo sigue ahí** |
| −4, −3 | 190,189,193 · 183,182,187 | 255,255,255 | banda blanca |
| −2, −1 | 177,176,180 · 172,171,175 | 36,49,55 | banda navy |
| 0+ | 36,49,55 | 36,49,55 | la tarjeta |

Cambio de estado en x=−2: **6,21:1**. El anillo es perceptible sobre la tarjeta.

**El barrido que pedía el encargo — otros elementos que sigan perdiendo la sombra.**
Recorrí `a, button, input, textarea, select, [tabindex]` en **16 rutas × 2 anchos**
(las 8 del punto 3, EN y ES, más las dos legales) buscando quien tenga
`box-shadow ≠ none` en reposo:

| selector | sombra en reposo | `--sombra-reposo` declarada | veredicto |
|---|---|---|---|
| `a.block-bar-services` ×24 | `rgba(0,0,0,0.2) 0 2px 5px 3px` | `0 2px 5px 3px #0003` | **coincide** |
| `input.text-field-form` ×6 | `rgba(0,0,0,0.2) 0 2px 5px 0` | `0 2px 5px #0003` | **coincide** |
| `textarea.large.text-field-form` ×2 | `rgba(0,0,0,0.2) 0 2px 5px 0` | `0 2px 5px #0003` | **coincide** |

**No hay un cuarto.** Contrastado además contra el CSS: las 14 reglas con `box-shadow`
del vendor caen todas sobre contenedores no focalizables (`.menu`, `.header`,
`.top-bar`, `.dropdown-list`, `.youtube`, `.faq-item`, `.block-review`, `.block-form`,
`.picture-blog-page`) salvo esas tres y `.button-slider-cms:hover`, que también está
declarada y **verificada en el estado combinado hover+foco** (fila 4 de la tabla de
arriba). `.w-slider-dot:focus` existe en `webflow.css:999` pero **no hay un solo
`.w-slider-*` en el marcado del puerto**.

**Efecto colateral que busqué y no existe:** `--sombra-reposo` se hereda, así que un
focalizable descendiente de los tres podría **ganar** una sombra fantasma al
enfocarse. Barrido de focalizables con `--sombra-reposo` heredada y `box-shadow:none`
propia, en 7 rutas: **0**.

---

## 2 · No regresión de B-1 … B-7 · **los siete siguen en pie**

Medidas mías, no las suyas.

| # | comprobación | baseline | puerto |
|---|---|---|---|
| **B-1** | anillo del CTA de `.header-page` (`/services/audit-assistance`, Tab #9 real) | — | `outline 2px #fff` + `box-shadow rgb(36,49,55) 0 0 0 4px`; banda navy medida en x=−2,−1 sobre página blanca → **13,4:1**; navy contra el verde `rgb(109,162,40)` del botón → **4,42:1**. El caso original (blanco sobre blanco, 1,00:1) queda cerrado. |
| **B-2** | `x` de las columnas de servicio del pie · 1440 | **460 / 785 / 1093** | **460 / 785 / 1093** |
| | ídem · 375 | 64 / 70 | 64 / 70 |
| **B-3** | teléfono y correo del pie | `DIV` · `rgb(36,49,55)` · `none` · 16px/400 | `A` · **`rgb(36,49,55)`** · **`none`** · 16px/400 |
| | los 12 enlaces de servicio | `rgb(51,51,51)` · `underline` | **iguales** (EN y ES) |
| **B-4** | Misión/Visión a 1440: caja 484×450, fuente 1250×833 (1,5006) | necesita 675 px | **sirve 800** → 0 % de ampliación |
| | a 375: caja 311×250 | necesita 375 px | **sirve 500** → 0 % |
| | `/es/about-us` a 1440 | idéntico | idéntico |
| **B-5** | `/contact-us` 1440 · alto gris / desnivel | 559 / **126** | 1006 / **0** (`align-self:stretch`) — la desviación que `PLAN.md` acordó |
| | 991 y 375 · alto gris | 539 / 629 | **539 / 629** (idénticos) |
| | `/es/contact-us` 1440 | — | 1085 / 1085, desnivel **0** |
| **B-6** | `.pendiente` `overflow-wrap` | — | **`break-word`** · 25 nodos en `/privacy-policy`, 12 en `/terms` |
| | cortes a mitad de palabra | — | **0** a 1440 y a 375 |
| | tabla | — | 1440: `scrollWidth == clientWidth == 820`; 375: 600 dentro de `.legal-table-scroll` de 311 con `overflow-x:auto`; **desborde de página 0** |
| **B-7** | `clip-path` computado, `/services/audit-assistance` 1440 | `.background-services` `polygon(20% 0px, …)` · esquinas · `.block-pic` `polygon(90% 0px, …)` | **idénticos los 6** |
| | fuente única | — | `grep clip-path` en `src/` sin `vendor`: **sólo `site.css`** (líneas 72, 656, 660, 664, 668, 713, 717). Cero en las dos plantillas de servicio. |

**Higiene de las reglas duras, re-verificada:** 4 `!important` en `site.css:81-84`,
los cuatro dentro del `@media (prefers-reduced-motion: reduce)`; la quinta aparición
(`:378`) está dentro de un comentario. Los dos `@layer webflow {}` deliberados siguen
ahí (`:103` y `:151`). `src/styles/vendor/` sin tocar. Las 54 rutas tienen `id="main"`
y **exactamente un `<h1>`** cada una.

---

## 3 · Paridad general · **cero regresiones**

`medir` + `diff` a 1440 y 375, ocho rutas, los dos lados. Comparado contra la tabla de
V1 (columna «V1»), que es el detector de regresión que importa:

| ruta | V1 1440 | **V3 1440** | V1 375 | **V3 375** | |
|---|---|---|---|---|---|
| `/` | 253 | **252** | 267 | **267** | −1 |
| `/services/audit-assistance` | 209 | **198** | 237 | **214** | **−11 / −23** |
| `/services/personal-tax-preparation` | 214 | **203** | 235 | **214** | **−11 / −21** |
| `/post/understanding-tax-deductions` | 184 | 184 | 201 | 201 | = |
| `/blog-news` | 189 | 189 | 205 | 205 | = |
| `/about-us` | 202 | 202 | 217 | 217 | = |
| `/contact-us` | 195 | 195 | 211 | 211 | = |

**Ninguna sube. Dos bajan.** La bajada de las fichas de servicio es el orden de Sanity
ya asentado: V1 avisó de que `astro dev` servía la lista de servicios **congelada** en
`globalThis.__amsServicios` de antes de la escritura, así que medía permutaciones que
hoy ya no existen. Reiniciado el servidor, esas permutaciones desaparecen.

### Aplicando T3 · las divergencias con propiedades, clasificadas

Clasificador propio: si el multiconjunto completo de valores del selector coincide en
los dos lados, es desfase de índice. Portada a 1440: **20 `width` + 2 `height` son
desfase puro**; las demás caen todas en familias ya ratificadas y **ninguna es nueva**:

| familia | qué es | dónde |
|---|---|---|
| **D1 · pie** | `a.link-footer` ×36 (12 `width` + 12 `height` + 12 `display`), `div.block-footer` ×3, `container-footer`, `wrapper-footer`, `ul.list-footer`, `li.list-item-footer` ×2, `div.link-footer` ×6 | las 7 rutas |
| **D1 · relacionados** | `.block-blogs-features` 459→559 = **los 10 enlaces pasan de 25 px a 44 px**, mismos anchos y mismo orden | `/post/*` |
| **FAQ** | `faq-answer`/`faq-answer-inner` ×25 (IX2 `height:0` vs `display:none`), `.block-title-faq` 80→55, `section.faq` 860→835 | `/` |
| **sub-píxel** | `h3.title-faq` 412,219→412,281 · `img.bg-pic` 449,109→449,125 · `div-block-4/5` +0,08 | todas |
| **R3 · iconos sociales** | `img.icon-sociall` `color` ×6: color **heredado sobre un `<img>`**, sin efecto visual (eran `<a href="#">`, ahora `<span>`) | todas |
| **B-3 · desfase** | `a.link-footer[0]` y `[1]` con `underline→none` y `#333→navy`: en el baseline son enlaces de servicio y aquí el teléfono y el correo | todas |
| **T3 clásico** | `a.nav-link.w-nav-link` `width` (la clave cambia con `w--current`) | `/`, `/blog-news`, `/about-us` |
| **A-6 (Sanity)** | `.w-richtext` 286→251, `section.body-service` 1708→1522 | `/services/*` |
| **D4 (legal)** | `.block-form`/`.form`/`.block-form-contact` +321 px: es el bloque de consentimiento FTSA/TCPA | `/contact-us` |
| **§4 · cromo móvil** | `.brand`, `img.logo`, `.menu-button`, `.wrapper-menu`, `.top-bar`, `.text-top-bar`, `.block-items-menu`, `.block-social-media` | 375, todas |

Dos que verifiqué elemento a elemento porque olían a bug y **no lo son**:

- **`/services/*`: `h2.h2` `color` navy→blanco y `width` 672→418.** El puerto tiene
  **cuatro** `h2.h2` y el baseline **tres**: en `y=1022` el baseline pone `h1.h2` y el
  puerto `h2.h2`, misma posición y misma caja (419×40). Es el cambio de etiqueta que
  deja **un solo `<h1>` por página**, ratificado en `auditoria-diseno.md:302`, y por
  §T3 desplaza todo el índice. Verificado: las 54 rutas tienen 1 `<h1>`.
- **`/about-us`: `margin 0px 63px → 0px 95px` y `color` navy→blanco.** El puerto no
  tiene el contenedor del índice 3 del baseline (`y=2885, h=501`) — **la sección de
  equipo, D1** —; el resto de la secuencia calza uno a uno: `base[4]=port[3]`,
  `base[5]=port[4]`, `base[6]=port[5]`. Desfase puro.

### `/es` — no hay baseline, así que se contrasta contra su gemela EN

| | 1440 | 375 |
|---|---|---|
| `FALTA` | **0** | **0** |
| `SOBRA` | **0** | **0** |
| nodos | 536 = 536 | 536 = 536 |

**Paridad estructural exacta.** Las 200/208 divergencias son todas de **caja**, y todas
en la dirección esperada: el castellano ocupa más (`a.blue.button` 179→280,
`a.link-footer` 101→180, `.block-header-review` 128→166). Cero divergencias de
`color`, `font-family`, `font-weight`, `display`, `clip-path` o `grid-template-columns`.

---

## 4 · Los 15 arreglos de `auditoria-diseno.md` a 375 · **todos en pie**

Con **clics y teclas reales** (`Input.dispatchMouseEvent` / `dispatchKeyEvent`).

| | comprobación | medido |
|---|---|---|
| M1 | marca sin desbordar | `.brand` **59,2×64**, y44→108 · `.logo` 59,2×48 · `.menu` 108 · `position:static` · **desborde 0** |
| M2 | hamburguesa sin el gris del UA | **48×48**, `background-color: rgba(0,0,0,0)` |
| M3 | icono en aspa | barra a `rgba(0,0,0,0)`, `aria-expanded="true"` |
| M4 | bloqueo de scroll | `html.nav-abierto`, `overflow: visible → hidden` |
| M5 | ritmo del cajón | **120 · 169 · 218 · 267 · 333** (Contact) · CTA en **398**; `cajón.top` 120 = `menu.bottom` 108 + 12 |
| M6 | botón de llamada | `.nav-telefono` **79,3×44**, `href="tel:+17542443993"` |
| M7 | credenciales a una línea | **109,8×20** y **112,9×20**, **1 caja cada una** |
| M8 | cajón de dos niveles | **12** enlaces, **44 px** todos, **1 columna**, `min-width: 0px` |
| D1 | objetivos táctiles del pie | `min-height: 44px`; altos 44/44/50/50 |
| D2 | campo del boletín | **311×50** (envío 164,3×50) |
| D3 | enlace de salto | existe, `href="#main"`, destino presente en **54/54**, `translateY(-90px)` en reposo |
| D4 | trampa de foco | Escape 1 → cierra el submenú y devuelve el foco a `BUTTON.w-dropdown-toggle`, `nav` sigue abierto · Escape 2 → cierra el cajón, foco a `BUTTON.menu-button`, `html` limpio, `overflow: visible` · Tab ×11 con el cajón abierto: `Services → About Us → Blog & news → Contact Us → CTA → Call → Menu → marca → Home → Services → About Us` — **cicla, no se escapa** |
| D5 | botón «Back» | **335×44**, fondo `rgba(0,0,0,0)`, color `rgb(157,191,67)`, texto «Back»; pulsándolo vuelve al nivel 1 con el foco en el toggle |
| — | FAQ sin `webflow.js` | cerrado `aria=false / hidden / 0 px / display:none` → **abierto `aria=true / visible / 180 px / display:block`** |
| — | carrusel sin `webflow.js` | `scrollLeft 0 → 313`; `prev.disabled true → false` |
| — | desbordes horizontales | **0 en 21 combinaciones** (7 rutas × 320/375/768) |
| — | escritorio 1440 | `.menu` 1440×125 · `.brand` **163,3×150** · `.logo` 123,3×100 · `position:absolute` · hamburguesa, teléfono y «volver» en `display:none` · desborde 0 |

---

## 5 · RECHAZOS

### V3-01 · `auditoria-diseno.md` da `.brand` en escritorio como 190×150; mide 163,3×150 — y el oráculo también · **NUEVO** · cosmético

- **Documento:** `baseline/auditoria-diseno.md` líneas **34, 45, 49, 350 y 375**
- **Síntoma:** el documento afirma cinco veces que `.brand` mide **190×150**. Tres de
  esas cinco lo afirman del **estado actual** en escritorio: «A ≥992 px el blob se
  queda exactamente igual: **190×150** colgando 68,8 px» (:49), «Medido antes y
  después: **190×150** … idéntico» (:350) y la tabla de verificación §7 (:375).
- **Evidencia** (medido hoy, `/` a 1440 y a 375, los dos lados):

  | | `.brand` | `img.logo` |
  |---|---|---|
  | **oráculo** `:4327` 1440 | **163×150** @638,44 | 123×100 |
  | **puerto** `:4321` 1440 | **163×150** @638,44 | 123×100 |
  | oráculo 375 | 163×150 | 123×100 |
  | puerto 375 | 59×64 (M1, deliberado) | 59×48 |

  En el diff a 1440 **no aparece ni una divergencia de `.brand`**: el puerto es
  idéntico a producción. Los 190 px salen de sumar el `padding` lateral (2×20) a un
  logotipo de 150 de ancho, y el logotipo nunca ha medido 150 de ancho aquí: mide
  123,25 (la proporción del asset, 123,25/100). La cifra es anterior al bloque
  `@layer webflow { img { width:auto; height:auto } }` de `site.css:151`.
- **Impacto:** `00-contexto.md §4` hace **vinculante** este documento. Una cifra falsa
  sobre un arreglo que está bien va a hacer que el siguiente barrido «encuentre» una
  regresión de 27 px en `.brand` que no existe. Es exactamente lo que le pasó a V1 con
  la cifra de 375, y por eso ya hay una entrada abierta.
- **Relación con lo ya documentado:** es **la misma causa raíz** que `MEJORAS 3.5`
  (`V1-R7`), pero esa entrada sólo recoge la cifra del «después» a 375 (150×64 →
  59,2×64). Las tres afirmaciones de escritorio y el «antes» de las líneas 34 y 45
  siguen sin registrar. **Debería ampliarse esa entrada, no abrirse otra.**
- **Arreglo propuesto:** corregir las cinco cifras a 163,3×150 (logo 123,25×100) y
  anotar que a ≥992 px puerto y oráculo son idénticos al píxel.
- **Archivos a tocar:** `baseline/auditoria-diseno.md`
- **¿Lo justifica `DECISIONS.md` o `auditoria-diseno.md`?** No — es el propio documento.

---

### Lo que sigue abierto · re-medido y confirmado · **NADA DE ESTO ES NUEVO**

No los re-abro: los verifico para que el estado del informe sea completo. Los seis
están ya en `MEJORAS.md` o en los informes V1/V2.

#### V3-02 · `MEJORAS 1.1` (`A3-02`) · las 22 rutas de blog siguen con la imagen del promo del pie · **rompe**

Los heroes de `common-tax-mistakes`, `preparing-for-tax-season` y
`understanding-tax-deductions` apuntan los tres al asset **`9786cde4a9f5…`**, que es el
`.bg-pic` del promo del pie. Sigue exactamente como lo dejó V1. Es dato de Sanity.

#### V3-03 · `MEJORAS 1.3` (`A1-02`) · el carrusel sigue abriendo por «Sofía M.» · **cosmético**

`/` a 1440: `Sofía M. · Carlos R. · Michael G.`; producción abre por «Juan T.».
`review` sigue sin campo de orden. Dato + esquema de Sanity.

#### V3-04 · `MEJORAS 2.1` (`V1-R2`, `V2-04`) · el titular del cuerpo sigue en 32 px y la decisión sigue sin tomarse · **se nota**

Primer hijo de `.w-richtext` en `/post/understanding-tax-deductions`:

| | etiqueta | `font-size` / `line-height` | `<h1>` en la página |
|---|---|---|---|
| oráculo | `H1` | **38 px / 44 px** | 2 |
| puerto EN | `H2` | **32 px / 36 px** | 1 |
| puerto ES | `H2` | 32 px / 36 px | 1 |

#### V3-05 · `MEJORAS 2.2` (`V1-R6`) · `D11` y `D12` siguen sin existir en `DECISIONS.md` · **cosmético**

`grep "D11\|D12" DECISIONS.md` → **0 coincidencias**. El fichero llega hasta `D10`.
Mientras siga así, `.block-title-faq` 80→55 y los tres iconos sociales se van a
re-reportar en cada barrido.

#### V3-06 · `MEJORAS 3.4` (`V1-R5`) · los 7 marcadores siguen en dos líneas · **cosmético**

`/privacy-policy`, tabla del modelo FTC: 7 `mark.pendiente`, **2 cajas de línea** cada
uno, 97 px de ancho. Lo que sí cierra B-6: **0 cortes** a mitad de palabra y tabla sin
desbordar. Es geometría, y el marcador desaparece con **D4**.

#### V3-07 · `V2-06` · el residuo de B-4 sigue, y el comentario que lo descarta sigue siendo falso · **cosmético**

`src/pages/about-us.astro:107` (y su gemela ES) sigue diciendo: «A ≤991px la caja baja
a 350/250px de alto y `calc(100vw - 64px)` ya cubre de sobra». Medido a **480 px**:

| viewport | caja `.pic-about-us` | candidato | `cover` exige | déficit |
|---|---|---|---|---|
| **480** | 416×350 | `w=500` | **525 px** | **−4,8 %** |
| 375 | 311×250 | `w=500` | 375 px | 0 |
| 1440 | 484×450 | `w=800` | 675 px | 0 |

No pido revertir nada: **~5 %, no el 35 % que arreglaba B-4**, y sólo a DPR 1. Lo que
está mal es el comentario. **`V2-06` no llegó a `MEJORAS.md`** — conviene anotarlo allí
o se perderá.

---

## 6 · Lo que probé a romper y aguantó

- **AVIF por la puerta de atrás:** las 54 rutas, no una muestra; URL decodificadas; la
  cabecera literal de Chrome; y el control de que `auto=format` **sí** devuelve AVIF
  con esa misma cabecera, para descartar que mi `Accept` fuera el equivocado.
- **SVG rasterizados:** por dato (0 con `?`) y por código (los SVG nunca pasan por
  `src()`; se emiten con `.url` en crudo).
- **Alfa de los PNG:** los 8 muestreados conservan `VP8X` con el bit ALPHA.
- **Imágenes rotas:** 118/118 a 200, ninguna de 0 bytes; y **0** con
  `complete && naturalWidth===0` en 12 rutas.
- **Un cuarto elemento que pierda su sombra:** 16 rutas × 2 anchos. No lo hay.
- **Sombras fantasma por herencia de `--sombra-reposo`:** 7 rutas. Cero.
- **El anillo de la fachada confundible con el hover:** 6 084 px de diferencia a 1440
  y 3 308 a 375. Ya no.
- **Divergencias de paridad nuevas:** ninguna ruta empeora respecto a V1 y dos mejoran;
  las familias son exactamente las siete ya ratificadas.
- **`/es` divergiendo estructuralmente de EN:** 0 `FALTA`, 0 `SOBRA` a los dos anchos.
- **Tres falsos positivos míos**, cazados y descartados antes de escribirlos: el
  `clip` en coordenadas de viewport (captura en blanco), el `clip` sin restaurar el
  scroll (16 792 px falsos y un anillo «fuera de la caja» a 375), y medir la primera
  tarjeta del `querySelector` en vez de la que recibió el Tab.

## 7 · Limitaciones de esta verificación

- Todo se midió contra **`astro dev` (:4321)**, no contra `dist/` servido en estático.
  La única comprobación sobre `dist/` es de texto: 0 `auto=format`, 938 `fm=webp`.
  **No he ejecutado `npm run build`** para no escribir en el árbol.
- Los contrastes están **calculados** con la fórmula WCAG de luminancia relativa a
  partir de píxeles leídos de la captura, no leídos de un medidor externo.
- Sanity se comprobó **sólo desde el render** (imagen del hero, orden del carrusel).
  No he hecho ni una consulta al dataset, ni de lectura.
- El barrido de sombras cubre 16 rutas de 54, pero las 16 cubren **las seis plantillas**
  y las dos legales, en EN y ES; las 38 restantes son instancias de esas plantillas.
