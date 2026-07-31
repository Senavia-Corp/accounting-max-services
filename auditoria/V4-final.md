# V4 · Verificación final — salud del build y reglas duras

**Assert de vivacidad:** ejecutado antes de cada una de las 8 tandas y al cerrar
(16:17:26 → 16:46:47 EDT). `:4321` y `:4327` vivos en todas. **Ninguna medida de este
informe se tomó contra un servidor caído.** URLs del oráculo siempre con `.html` (T2).

**Instrumento:** Chrome headless por CDP, `AMS_PUERTO=9272` / `AMS_PERFIL=/tmp/ams-perfil-V4`.
Volcados en `/tmp/ams/V4-salud.json`, `V4-inter.json`, `V4-focos.json`, `V4-pixel.json`,
`V4-regres.json`, `V4-http-todas.txt`, `V4-sanity.json`, `V4-build.log`. Scripts en el
scratchpad de la sesión. **No se ha tocado ni un fichero del repo fuera de este informe.
Cero escrituras en Sanity, cero commit, cero deploy.**

**Veredicto: CON RECHAZOS — 2, los dos cosméticos y los dos nuevos.**
Los tres arreglos de la ronda 2 (**V2-01**, **V1-R3**, **V1-R4**) **pasan**, y no con la
evidencia de quien los hizo: los he vuelto a medir por mi cuenta, dos de ellos leyendo
píxeles del framebuffer y no `getComputedStyle`. Las ocho comprobaciones del encargo
salen limpias. Lo que encuentro nuevo son dos cosas pequeñas y ninguna rompe nada.

---

## 1 · Build

`npm run build` termina **sin errores**, exit 0, en 5,62 s (dos ejecuciones).

| comprobación | exigido | medido |
|---|---|---|
| ficheros HTML | 54 | **54** en `dist/client/` y **54** en `.vercel/output/static/` |
| `sales-tax-filing-7k40q` (R4) | presente | **presente**, EN y ES: `dist/client/services/sales-tax-filing-7k40q/index.html` y `dist/client/es/services/sales-tax-filing-7k40q/index.html` |
| `<loc>` del sitemap | 26 | **26** |
| `/es` en el sitemap | 0 | **0** |
| `/privacy-policy` en el sitemap | 0 | **0** |
| `/terms` en el sitemap | 0 | **0** |

### Avisos — dos, y **ninguno nuevo**

```
[post/[slug]] 10/10 entradas sin alt en heroImage. El esquema lo exige (imageWithAlt); el import no lo relleno.
[blog-news]   10 posts comparten solo 1 imagen(es) de portada. Las referencias post.heroImage de Sanity estan mal: revisar el import.
```

Los dos son de **datos**, previos a la Fase 3, y siguen encendidos porque **A-1 sigue sin
arreglar a propósito** (MEJORAS §1.1). El de `blog-news` es el que el encargo declara
esperado; el de `post/[slug]` es de la misma familia y V2 ya lo fechó fuera de la ventana
de la Fase 3. Revisado el log completo línea a línea: no hay ningún otro aviso — ni de
Vite, ni de Rollup, ni del adapter.

---

## 2 · Errores de consola — CERO

**Dos barridos independientes**, no uno:

| barrido | cargas | pageerror | log error/warning | consoleAPI |
|---|---|---|---|---|
| `astro dev` (:4321), 20 rutas × 1440/375/320 | **60** | **0** | **0** | 120, todos `debug "[vite] connecting…/connected."` |
| **`dist/` servido en estático** (:4399), las mismas 60 | **60** | **0** | **0** | **0** |

El segundo barrido cierra la limitación que V2 declaró en su §11: sobre `dist/` no hay
cliente HMR, así que **cualquier** mensaje sería real, y no hay ninguno.

Las 20 rutas cubren los siete tipos, EN y ES: portada, about, contact, blog-news, privacy,
terms, 3 fichas de servicio y 3 posts en EN; portada, about, contact, blog-news, 2 fichas
y 2 posts en ES.

Los `console.warn` de las plantillas siguen sin llegar al navegador: se emiten en el
frontmatter, o sea en Node durante el prerender. Aparecen en §1 y en ningún otro sitio.

**Añadido por mi cuenta — consola DURANTE la interacción.** V2 midió páginas quietas. Yo
he pulsado los 5 ítems del FAQ (abrir y cerrar), 8 veces las flechas del carrusel, el
desplegable, el cajón móvil y su nivel 2, en EN y en ES: **cero mensajes**. La única
excepción es el clic sobre la fachada del vídeo → **rechazo V4-01**.

---

## 3 · Desbordes horizontales — CERO

`document.documentElement.scrollWidth > innerWidth` en 20 rutas × **1440, 375 y 320**,
por duplicado (dev y `dist/`): **0 de 120**. `scrollWidth === innerWidth` en las 120.

Estados que tapan la página, medidos aparte:

| | 375 | 320 |
|---|---|---|
| cajón cerrado | 375 = 375 | 320 = 320 |
| cajón abierto | 375 = 375 | **320 = 320** |
| cajón en nivel 2 (los 12 servicios) | 375 = 375 | **320 = 320** |
| tras cargar el `<iframe>` del vídeo (1440) | 1440 = 1440 | — |

---

## 4 · Imágenes

| comprobación | resultado |
|---|---|
| `<img>` en `dist/client/` | **2 888** |
| **sin `width`** | **0** |
| **sin `height`** | **0** |
| `<picture>` / `<source>` | 0 |
| cadena `.avif` en el marcado | **0** |
| `auto=format` en el marcado | **0** |
| `fm=webp` en el marcado | 938 |
| URL distintas en `src`/`srcset` | **119** (118 de Sanity + 1 miniatura de YouTube) |
| **rotas, confirmadas por HTTP** | **0** |
| **AVIF, con la cabecera `Accept` real de Chrome** | **0** |

### V2-01 · cerrado y verificado por mi cuenta

Las 119 URL pedidas una a una con
`Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8` — exactamente
la cabecera con la que V2 destapó el AVIF:

| `content-type` | recuento |
|---|---|
| `image/webp` | **94** |
| `image/svg+xml` | 24 |
| `image/jpeg` | 1 (`i.ytimg.com`, miniatura del vídeo: tercero, no pasa por nuestro helper) |
| **`image/avif`** | **0** |
| no-200 | **0** |

Los 11 helpers `src()` revisados uno a uno: **los 11 emiten `fm=webp`**. Las 12
apariciones de la cadena `auto=format` que quedan en `src/` están **todas dentro de
comentarios** que explican por qué no se usa. Y **ningún `.svg` lleva `fm=webp`** (0 de
24), que es lo que esos comentarios prometen.

**Comprobación que nadie había hecho: el canal alfa.** `fm=webp` fuerza el formato, y si
Sanity aplanase la transparencia los PNG con alfa de `.features` y el promo del pie
saldrían con una caja opaca. Muestreados 8 PNG servidos como WebP: **los 8 traen `VP8X` +
chunk `ALPH`**. La transparencia sobrevive. No hay regresión.

### El falso positivo, otra vez

`complete === false` sale en **436 lecturas** — todas `.icon-submenu`, `.icon-google` e
`.icon-start`, SVG con `loading="lazy"` dentro del desplegable cerrado (`display:none`),
que Chrome nunca pide. **`complete && naturalWidth === 0`: 0 casos.** Y los 119 `src` dan
200 por HTTP. **Cero rotas. No se reporta.**

---

## 5 · Enlaces internos a 404 — CERO

Barrido sobre `dist/client/`: **2 401 `href`/`action` internos**, **57 destinos
distintos**, contrastados contra las 54 rutas construidas y contra los ficheros reales.

**0 a 404.** Los dos únicos destinos sin fichero son `/api/lead` y `/api/newsletter`, que
son funciones con su ruta declarada en `.vercel/output/config.json`
(`{"src":"^/api/lead$","dest":"_render"}`). **No hay regresión.**

De paso: `/terms` se enlaza **1** vez y `/privacy-policy` **4**. Comprobado contra el
oráculo — **producción no enlaza ninguna de las dos desde ninguna de sus 26 rutas**
(0 coincidencias en `baseline/html/`), así que el port no está por debajo del baseline.
No es hallazgo.

---

## 6 · Interactividad sin `webflow.js` — los cuatro responden

Todo con **clicks y teclas reales por CDP** (`Input.dispatchMouseEvent` /
`Input.dispatchKeyEvent`), nunca con `element.click()`.

### 6a · Acordeón de FAQ (portada, 5 `.faq-item`) — **pasa**

| | `aria-expanded` | `panel.hidden` | `display` | alto | los otros 4 |
|---|---|---|---|---|---|
| inicial | `false` | `true` | `none` | 0 | `false,false,false,false` |
| tras 1 click | **`true`** | **`false`** | **`block`** | **80 px** | sin moverse |
| tras 2 clicks | `false` | `true` | `none` | 0 | sin moverse |

El disparador es `<BUTTON>` de verdad.

### 6b · Carrusel de testimonios (20 diapositivas) — **pasa**

| | `scrollLeft` | `prev.disabled` | `next.disabled` |
|---|---|---|---|
| inicial | 0 | **`true`** | `false` |
| tras 1 `next` | **313** | `false` | `false` |
| extremo derecho | **5000** (= 6250 − 1250) | `false` | **`true`** |
| de vuelta al inicio | **0** | **`true`** | `false` |

Las dos flechas son `<BUTTON>`; la pista lleva `tabIndex=0` y `role="group"`.

### 6c · Cajón móvil a 375 — **pasa, incluida la trampa de foco**

| | `html.nav-abierto` | `aria-expanded` | `overflow` de `<html>` | foco |
|---|---|---|---|---|
| cerrado | no | `false` | `visible` | `BODY` |
| **abierto** | **sí** | **`true`** | **`hidden`** | **`A.nav-link` «Home»** |
| **tras Escape** | no | `false` | `visible` | **`BUTTON.menu-button`** |

Trampa de foco: **14 `Tab` reales seguidos, 14 de 14 dentro del `<nav>`**, ciclando
`nav-link → … → button → nav-telefono → menu-button → brand → …`. **0 escapes.**

### 6d · Desplegable de servicios a 1440 — **pasa**

| | `aria-expanded` | `.w--open` toggle | `.w--open` lista | `display` | alto | enlaces |
|---|---|---|---|---|---|---|
| cerrado | `false` | no | no | `none` | 0 | 12 |
| abierto | **`true`** | **sí** | **sí** | **`flex`** | **290 px** | 12 |
| tras Escape | `false` | no | no | `none` | 0 | 12 |

Tras `Escape` el foco vuelve al `BUTTON` disparador.

---

## 7 · Reglas duras

| regla | estado | evidencia |
|---|---|---|
| cero `!important` fuera de `prefers-reduced-motion` | **cumple** | 4 en `site.css:81-84`, los cuatro dentro del `@media (prefers-reduced-motion: reduce)` que abre en :77. La quinta aparición, `site.css:378`, está **dentro de un comentario**. |
| los dos `@layer webflow {}` deliberados | **cumplen** | `site.css:103` (reset de `<button>` con `:where()`) y `site.css:151` (`img{width:auto;height:auto}`), con sus comentarios intactos. `main.css` sigue metiendo los tres ficheros del vendor en `layer(webflow)` e importando `site.css` **suelto**. |
| `src/styles/vendor/*` intocado | **cumple** | `git status --porcelain src/styles/vendor` → **vacío**. mtimes 27-jul 21:46:44 / 21:47:23, muy anteriores a todo. |
| cero `auto=format` en código | **cumple** | 12 apariciones en `src/`, **las 12 en comentarios**. En `dist/`: **0**. |

### `git diff --stat` · 25 ficheros, uno inesperado

Reparto por mtime, que aísla las fases limpiamente:

| ventana | ficheros | qué es |
|---|---|---|
| 11:32 – 13:29 | 8 · `Nav.astro`, `ui.ts`, `i18n.ts`, `BaseLayout.astro`, `PortableText.astro`, `astro.config.mjs`, `schemas.mjs`, `sanity.ts` | **sesión ajena previa**, ya documentada en `PLAN.md` §Nota de proceso y `MEJORAS.md` §4. No es nuevo. |
| 14:56 – 15:01 | 4 · `contact-us` ×2, `terms`, `privacy-policy` | Fase 3 (F5) |
| 15:45 – 16:13 | 11 · los 11 helpers `src()` | ronda 2 · V2-01 |
| 15:55 | `site.css` | ronda 2 · V1-R4 |
| 16:13 | `index.astro` ×2 | ronda 2 · V1-R3 (además de su `src()`) |
| **16:16:09** | **`src/pages/og-default.png.ts`** | **fuera de la lista declarada de 11** → rechazo **V4-02** |

`site.css`, `about-us` ×2 y `services/[slug]` ×2 llevan mtime de la ronda 2 porque **la
ronda 2 los volvió a tocar**; su trabajo de Fase 3 sigue dentro (verificado en §9).

---

## 8 · Los bloqueados SIGUEN bloqueados — verificado con GROQ de solo lectura

Consulta directa al dataset `ep5i6co1/production` por la API **sin CDN**. **Cero
mutaciones: solo `data/query`.**

| comprobación | exigido | medido |
|---|---|---|
| escritura más reciente en `post`/`service`/`review`/`siteSettings`/`page` | ninguna posterior a 15:04 | **`2026-07-28T19:04:09Z` = 15:04:09 EDT**, y son los mismos 22 documentos de siempre (10 `post` + 12 `service`). **Nada más nuevo.** |
| las 10 `heroImage` de post | apuntando al promo del pie | **10 de 10** → `image-9786cde4a9f57ba8377b3ee43f2ad436f5dcceab-1289x1679-png`, **1 solo `_ref` distinto**. Es exactamente el asset del `<img>` del promo del pie de la portada. **Sin tocar.** |
| los 20 `review` sin campo de orden | sin `order` | **20 de 20**. Unión de claves de los 20: `_createdAt, _id, _rev, _type, _updatedAt, author, quote, slug, webflowItemId`. **`order` no aparece.** `_updatedAt` = `2026-07-28T02:26:08Z`, el import. **Sin tocar.** |

**Ningún rechazo «rompe».** A-1 y A-3 siguen abiertos tal y como el encargo exige.

---

## 9 · Los tres arreglos de la ronda 2, re-medidos por mí

### V2-01 · AVIF — **pasa** (§4, 0 de 119)

### V1-R3 · anillo de foco de la fachada de vídeo — **pasa, y con prueba de píxel**

`getComputedStyle` no basta: la queja original era que el anillo **se recortaba**. Así que
he tabulado hasta el botón (22 `Tab` reales), capturado el framebuffer y **leído los
píxeles** de la fila a media altura, desde el borde izquierdo hacia dentro:

| px desde el borde | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| **EN** (`/`) | `36,49,55` | `36,49,55` | `255,255,255` | `255,255,255` | miniatura | miniatura |
| **ES** (`/es`) | `36,49,55` | `36,49,55` | `255,255,255` | `255,255,255` | miniatura | miniatura |

Navy en 0-2 px, blanco en 2-4 px. **Las dos bandas están pintadas y visibles**, dentro de
un contenedor que sigue en `overflow:hidden` (medido: `.w-embed-youtubevideo.youtube`,
`overflow: hidden`, y el botón mide 493×277, **exactamente lo mismo** que su caja).
Mecanismo: `outline: 2px solid #fff` con `outline-offset: -4px` + `::after` con
`box-shadow: inset 0 0 0 2px` navy. Verificado también a **375** (mismo computed).
Los bloques CSS de EN y ES son **idénticos salvo comentarios**.

### V1-R4 · el anillo ya no se come la sombra de reposo — **pasa, y sin fugas**

| control | sombra en reposo | sombra con `:focus-visible` |
|---|---|---|
| `.block-bar-services` (24 tarjetas) | `rgba(0,0,0,.2) 0 2px 5px 3px` | **`rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,.2) 0 2px 5px 3px`** |
| `.text-field-form` (input) | `rgba(0,0,0,.2) 0 2px 5px 0` | **`rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,.2) 0 2px 5px 0`** |
| `.button-slider-cms` **con hover** | `rgba(255,255,255,.2) 0 2px 11px -4px` | **`rgb(36,49,55) 0 0 0 4px, rgba(255,255,255,.2) 0 2px 11px -4px`** |
| CTA de `.header-page` (sin sombra propia) | `none` | `rgb(36,49,55) 0 0 0 4px, rgba(0,0,0,0) 0 0 0 0` |

Las tres sombras de reposo **sobreviven al foco**. El caso borde —`.button-slider-cms`
declara su variable **solo en `:hover`**— lo he provocado con ratón real: reposo `none`,
hover `0 2px 11px -4px`, hover+foco **anillo + sombra**, los tres correctos.

**Dos auditorías propias que la ronda 2 no hizo, y que podían haberla tumbado:**

1. **¿Se dejó algún control con sombra fuera de la lista de tres?** Censo de **todo**
   focalizable (`a[href], button, input, textarea, select, [tabindex]`) en las 20 rutas,
   leyendo `box-shadow` en reposo. Solo **tres clases** salen con sombra:
   `A.block-bar-services` (24), `INPUT.text-field-form` (6), `TEXTAREA.text-field-form` (2).
   **Las tres están cubiertas.** El comentario de `site.css:47-49` dice la verdad.
   Los otros 9 `box-shadow` del vendor viven en contenedores no focalizables
   (`.menu`, `.header`, `.faq-item`, `.top-bar`, `.dropdown-list`, `.youtube`,
   `.block-review`, `.block-form`, `.picture-blog-page`).
2. **¿Se filtra `--sombra-reposo` por herencia a algún descendiente focalizable?** Sería
   una sombra fantasma al enfocar. Censo inverso en las 20 rutas: **32 focalizables
   declaran la variable y los 32 tienen esa misma sombra en reposo. Cero fantasmas.**

### Y los siete de la Fase 3 siguen en pie

`site.css` se reescribió el 15:55, así que re-medí contra el **oráculo** lo que vive allí:

| | oráculo | port |
|---|---|---|
| **B-2** · fila del pie, `left` a 1440 | 745 (`<div>`) | **745** (`<li>`) |
| **B-2** · enlace de servicio, `left` a 1440 | 785 | **785** |
| **B-2** · lo mismo a 375 | 64 / 64 | **64 / 64** |
| **B-3** · teléfono | `DIV`, `rgb(36,49,55)`, `none` | **`A`**, **`rgb(36,49,55)`**, **`none`** |
| **B-3** · correo | `DIV`, `rgb(36,49,55)`, `none` | **`A`**, **`rgb(36,49,55)`**, **`none`** |
| **B-3** · los 12 enlaces de servicio conservan su subrayado | `underline` | **`underline`** |
| **B-1** · CTA de `.header-page` enfocado con 9 `Tab` reales | — | `outline 2px solid #fff` + `offset 2px` + `box-shadow rgb(36,49,55) 0 0 0 4px` |

---

## 10 · RECHAZOS

### V4-01 · La fachada del vídeo emite un aviso de consola al pulsarla — **cosmético** · NUEVO

- **Ruta:** `/` y `/es` · **Sección:** `.block-video` · **Viewport:** cualquiera
- **Síntoma:** el único barrido de consola que existía medía páginas **quietas**. Al
  pulsar la fachada —la única interacción del port que crea un `<iframe>`— Chrome emite
  un aviso, atribuido a nuestra propia página:

  ```
  Allow attribute will take precedence over 'allowfullscreen'.
  ```

- **Evidencia:** barrido de interacción sobre `dist/` servido en estático (sin HMR, así
  que el canal está limpio):

  | tanda | mensajes |
  |---|---|
  | EN 1440 · 5 FAQ ×2 + 8 flechas + desplegable ×2 | **0** |
  | EN 1440 · **clic en la fachada** | **1** · `log.warning`, `url: http://127.0.0.1:4399/` |
  | EN 375 · cajón + nivel 2 + cerrar | **0** |
  | ES 1440 · 5 FAQ ×2 + 8 flechas + desplegable ×2 | **0** |
  | ES 1440 · **clic en la fachada** | **1** · `log.warning`, `url: …/es/` |
  | ES 375 · cajón + nivel 2 + cerrar | **0** |

  El `<iframe>` resultante es correcto por lo demás: `src` a `youtube-nocookie.com`,
  `title` puesto, el foco se mueve a él y no hay desborde (1440 = 1440).
- **Causa raíz:** el `<iframe>` se construye con **las dos formas a la vez** —
  [`src/pages/index.astro:707-708`](../src/pages/index.astro) y
  [`src/pages/es/index.astro`](../src/pages/es/index.astro), mismas dos líneas:

  ```js
  marco.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  marco.allowFullscreen = true;
  ```

  `allow` ya concede `fullscreen`, así que `allowFullscreen` es redundante y Chrome avisa
  de que lo ignora. **El comportamiento es el correcto**: no se pierde pantalla completa.
- **Arreglo propuesto:** borrar `marco.allowFullscreen = true;` en los dos ficheros
  (`allow` ya lo cubre) y dejar un comentario diciendo por qué **no** se pone el atributo
  antiguo. Alternativa equivalente: quitar `fullscreen` de la lista de `allow`.
- **Archivos a tocar:** `src/pages/index.astro`, `src/pages/es/index.astro`
- **Dueño:** F2
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No. Tampoco está en `MEJORAS.md`.

### V4-02 · Un fichero fuera de la lista declarada de la ronda 2 — **cosmético** · NUEVO

- **Fichero:** `src/pages/og-default.png.ts`, mtime **16:16:09**
- **Síntoma:** el encargo de la ronda 2 declaraba **11** ficheros (los 11 helpers `src()`)
  más `site.css` y las dos portadas. `og-default.png.ts` es un **12.º**, escrito tres
  minutos después del último cambio declarado.
- **Evidencia:** `git diff` — el cambio es **solo comentario, cero código**:

  ```diff
  -// las tarjetas. El resto del sitio si sirve WebP via `auto=format` de Sanity,
  -// pero aqui seria una tarjeta rota. …
  +// las tarjetas, asi que aqui saldria una tarjeta rota. El resto del sitio sirve
  +// WebP con `fm=webp` — NO con `auto=format`, que no fija formato: negocia por la
  +// cabecera `Accept` y Chrome pide `image/avif` primero, …
  ```

- **Nota — el cambio es correcto y necesario.** Ese comentario afirmaba literalmente lo
  que V2-01 declaró falso («el resto del sitio sí sirve WebP vía `auto=format`»), así que
  cae de lleno en la parte de V2-01 que pedía *«corregir los 8 comentarios»*. Lo reporto
  porque el encargo pide expresamente listar los ficheros tocados fuera de alcance, no
  porque esté mal hecho: **es un comentario, no cambia un byte de salida** (`/og-default.png`
  sigue emitiéndose y sigue siendo PNG).
- **Arreglo propuesto:** ninguno técnico. Actualizar el recuento: los comentarios
  corregidos fueron **9**, no 8, y los ficheros tocados **12**, no 11.
- **Dueño:** orquestador
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No.

---

## 11 · Lo que confirmo abierto y NO re-reporto como nuevo

Sigue exactamente igual que en `MEJORAS.md`. Lo verifiqué para poder afirmar que **nadie
lo ha tocado**, no para volver a contarlo:

- **§1.1 · A-1** · las 10 `heroImage` siguen apuntando al promo del pie (10/10, 1 solo
  `_ref`). Los dos avisos del build siguen encendidos por esto.
- **§1.2 · A-5** · un solo campo de imagen por post.
- **§1.3 · A-3** · los 20 `review` siguen sin campo de orden (20/20, clave ausente).
- **§1.4 · A-6** · párrafos vacíos del cuerpo del servicio.
- **§2.1 · V2-04** · el titular del cuerpo del post en 32 px. Decisión abierta.
- **§2.2 · V1-R6** · `D11` y `D12` citados y no escritos en `DECISIONS.md`.
- **§3.1 · JsonLd** · `/og-default.png` sigue huérfano.
- **§3.2, §3.4, §3.5** · Campton, `{{PENDIENTE` en dos líneas, cifra caducada de §M1.
- **V2-02** · el `.reverse()` de la barra lateral de las fichas sigue cableado.
- **V2-05** · `<main id="main">` en 8 ficheros.
- **V2-06** · residuo de B-4 entre 480 y ~586 px.

La corrección documental que V2-01 sí pedía **está hecha**: `baseline/auditoria-diseno.md`
lleva ahora una nota «Corrección (R2-A, 28-jul)» que retira la afirmación «ningún AVIF».

---

## 12 · Falsos positivos que descarté y no reporto

1. **436 «imágenes rotas»** por `complete === false`: SVG con `loading="lazy"` en el
   submenú cerrado. `complete && naturalWidth === 0` da **0**, y los 119 `src` dan **200**.
2. **`/terms` enlazado una sola vez.** El oráculo no lo enlaza **ninguna**. El port está
   por encima del baseline, no por debajo.
3. **`/api/lead` y `/api/newsletter` como enlaces a 404.** Son funciones, con ruta en
   `.vercel/output/config.json`.
4. **`image/jpeg` en un `src`.** Es `i.ytimg.com/vi/…/maxresdefault.jpg`, la miniatura del
   vídeo: la sirve YouTube, no pasa por nuestro helper. No es AVIF, que es lo que importa.
5. **`!important` en `site.css:378`.** Está dentro de un comentario que explica el
   `!important` **del vendor**, no es una declaración.
6. **8 lecturas de `box-shadow` distintas del baseline.** Leídas a mitad de transición.
   Con la transición asentada (800 ms) coinciden. Misma trampa que avisó V2.

---

## 13 · Limitaciones de esta verificación

- El clic sobre la fachada **carga YouTube de verdad**. El aviso de V4-01 está atribuido a
  nuestra URL (`http://127.0.0.1:4399/`) y no al origen de YouTube, así que es nuestro;
  los mensajes que emita el `<iframe>` de terceros quedan fuera de este informe.
- La prueba de píxel de V1-R3 se hizo a DPR 1. A DPR 2 el anillo ocupa los mismos puntos
  CSS, pero no lo he vuelto a leer píxel a píxel.
- No he re-medido la paridad visual completa contra el oráculo: eso era el encargo de V1.
  Aquí solo re-verifiqué B-1, B-2 y B-3, que son los que viven en el `site.css` que la
  ronda 2 reescribió.
- Las consultas a Sanity fueron **solo `data/query`**. La fecha `19:04:09Z` es la que el
  dataset declara en `_updatedAt`; no tengo acceso al log de mutaciones del proyecto.
