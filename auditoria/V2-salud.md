# V2 · Salud del build y del render — verificación adversarial de la Fase 4

**Assert de vivacidad:** ejecutado antes de cada tanda y al cerrar. `:4321` y `:4327`
vivos en las 6 tandas. Ninguna medida de este informe se tomó contra un servidor caído.

**Instrumento:** Chrome headless por CDP en `AMS_PUERTO=9252` / `AMS_PERFIL=/tmp/ams-perfil-V2`.
Volcados en `/tmp/ams/V2-salud.json`, `/tmp/ams/V2-interactivo.json`, `/tmp/ams/V2-focos.json`,
`/tmp/ams/V2-final.json`. Scripts en el scratchpad de la sesión; **no se ha tocado ni un
fichero del repo fuera de este informe**.

**Veredicto: CON RECHAZOS — 6.** Ninguno de los 7 arreglos B-1…B-7 está roto: los siete
se verificaron uno a uno con medidas propias y los siete pasan. Lo que sale mal es otra
cosa: **una regla dura incumplida en las 54 rutas (AVIF)** y **trabajo aplicado fuera del
encargo de la Fase 3, incluido sobre hallazgos que estaban bloqueados**.

---

## 1 · Build limpio

`npm run build` termina **sin errores**, en 6,19 s.

| comprobación | exigido | medido |
|---|---|---|
| ficheros HTML | 54 | **54** en `dist/`, `dist/client/` y `.vercel/output/static/` |
| `sales-tax-filing-7k40q` (R4) | presente, sin normalizar | **presente**, EN y ES: `dist/client/services/sales-tax-filing-7k40q/index.html` y `dist/client/es/services/…` |
| `<loc>` del sitemap | 26 | **26** |
| `/es` en el sitemap | 0 | **0** |
| `/privacy-policy` en el sitemap | 0 | **0** |
| `/terms` en el sitemap | 0 | **0** |

Reparto de las 54: 28 EN (portada + about + contact + blog-news + privacy + terms +
12 fichas + 10 posts) y 26 ES (sin las dos legales).

### Avisos del build — dos, **ninguno nuevo**

```
[post/[slug]] 10/10 entradas sin alt en heroImage. El esquema lo exige (imageWithAlt); el import no lo relleno.
[blog-news] 10 posts comparten solo 1 imagen(es) de portada. Las referencias post.heroImage de Sanity estan mal: revisar el import.
```

- El de `blog-news` es el **esperado y documentado** (`blog-news.astro:44-53`).
- El de `post/[slug]` (`post/[slug].astro:33-42`) es del mismo tipo y **también es previo a
  la Fase 3**: `git diff` sobre ese fichero solo muestra `<main>` → `<main id="main">`, y su
  mtime es `11:42:15`, fuera de la ventana de la Fase 3 (14:51–15:01). **No es un aviso nuevo.**
- El tercer aviso posible de esa plantilla (`sinExtracto`, línea 45) **no se dispara**: los
  10 posts tienen extracto.
- Los dos avisos siguen encendidos porque **A-1 sigue sin arreglar** — ver §8.

---

## 2 · Errores de consola — CERO

42 cargas: **14 rutas × 3 anchos** (1440 / 375 / 320), EN y ES, de todos los tipos
(portada, ficha, post, índice de blog, about, contact, privacy, terms).

| canal | recuento |
|---|---|
| `Runtime.exceptionThrown` (pageerror) | **0** |
| `Log.entryAdded` nivel error/warning (red incluida) | **0** |
| `Runtime.consoleAPICalled` | 84, **todos informativos** |

Los 84 son exactamente `42 × debug "[vite] connecting..."` + `42 × debug "[vite] connected."`,
el cliente HMR de `astro dev`. Nada más.

Los `console.warn` de las plantillas **no llegan al navegador**: se emiten en el frontmatter,
o sea en Node durante el prerender. Aparecen en el log del build (§1) y en ningún otro sitio.

> **Trampa que casi me come.** La primera tanda dio un 404 en `/es/` y 39 mensajes en vez
> de 42. No es un bug: `astro.config.mjs` declara `trailingSlash: "never"`, así que en el
> servidor de desarrollo `/es/` es 404 y `/es` es 200 (igual que `/about-us/` es 404 y
> `/about-us` es 200). En producción lo resuelve la primera regla que el adapter escribe en
> `.vercel/output/config.json`: `{"src":"^/(.*)/$", "status":308, "Location":"/$1"}`.
> Verificado con `curl`. **Descartado, no es hallazgo.**

---

## 3 · Desbordes horizontales — CERO

`document.documentElement.scrollWidth > innerWidth` en las mismas 14 rutas a **1440, 375 y
320**: **0 de 42**. `scrollWidth === innerWidth` en las 42 combinaciones, sin una sola
excepción.

Añadido por mi cuenta, porque el cajón móvil es `position:fixed` y tapa la página:

| ancho | cerrado | cajón abierto | cajón en nivel 2 (los 12 servicios) |
|---|---|---|---|
| 375 | 375 = 375 | 375 = 375 | 375 = 375 |
| 320 | 320 = 320 | 320 = 320 | 320 = 320 |

---

## 4 · Imágenes

| comprobación | resultado |
|---|---|
| `<img>` en `dist/` | 2 888 |
| **sin `width`** | **0** |
| **sin `height`** | **0** |
| `<picture>` / `<source>` | 0 |
| cadena `.avif` en el marcado | 0 |
| **imágenes rotas** | **0 confirmadas por HTTP** |

### El falso positivo, otra vez — y descartado por HTTP

`complete===false && naturalWidth===0` sale en **120 lecturas** de las 14 rutas. Son todas
`.icon-submenu` (12 SVG de 50×50), `.icon-google` y `.icon-start`: van con `loading="lazy"`
dentro del desplegable cerrado, que está en `display:none`, así que **Chrome nunca las pide**.

Confirmado por HTTP antes de reportar nada, como manda §7 del contexto: **los 44 `src`
distintos devuelven 200**. Cero rotas. No se reporta.

### AVIF · **SÍ se está sirviendo** → rechazo V2-01, §7

---

## 5 · Enlaces internos a 404 — CERO, sin regresión

Barrido sobre `dist/client/`: **2 401 `href`/`action` internos**, **55 destinos distintos**,
contrastados contra las 54 rutas construidas y contra los ficheros reales del directorio.

**0 de 55 a 404.** Exactamente el número de antes de la Fase 3. **No hay regresión.**

Dos `action=` apuntan a `/api/lead` y `/api/newsletter`, que no existen como fichero en
`dist/client` — y **no son 404**: son funciones (`export const prerender = false`), con su
ruta declarada en `.vercel/output/config.json`:

```json
{ "src": "^/api/lead$", "dest": "_render" },
{ "src": "^/api/newsletter$", "dest": "_render" }
```

---

## 6 · Interactividad sin `webflow.js` — los cuatro comportamientos responden

Todo verificado con **clicks y teclas reales por CDP** (`Input.dispatchMouseEvent` /
`Input.dispatchKeyEvent`), no con `element.click()`.

### 6a · Acordeón de FAQ (portada, 5 `.faq-item`) — **pasa**

| | `aria-expanded` | `panel.hidden` | `data-open` | alto del panel | `display` |
|---|---|---|---|---|---|
| inicial | `false` | `true` | `"false"` | 0 | `none` |
| tras 1 click | **`true`** | **`false`** | **`"true"`** | **80 px** | **`block`** |
| tras 2 clicks | `false` | `true` | `"false"` | 0 | `none` |

El disparador es `<BUTTON>` de verdad y los otros 4 ítems no se mueven.

### 6b · Carrusel de testimonios (20 diapositivas) — **pasa**

| | `scrollLeft` | `prev.disabled` | `next.disabled` |
|---|---|---|---|
| inicial | 0 | **`true`** | `false` |
| tras 1 `next` | **313** | `false` | `false` |
| extremo derecho | **5000** (= 6250 − 1250) | `false` | **`true`** |
| de vuelta al inicio | **0** | **`true`** | `false` |

Las dos flechas son `<BUTTON>`; la pista lleva `tabIndex=0`, `role="group"` y
`aria-labelledby="reviews-title"`.

### 6c · Cajón móvil a 375 — **pasa, incluida la trampa de foco**

| | `data-nav-open` | `aria-expanded` | `html.nav-abierto` | `overflow` de `<html>` | cajón | foco |
|---|---|---|---|---|---|---|
| cerrado | `false` | `false` | no | `visible` | `none` | `BODY` |
| **abierto** | **`true`** | **`true`** | **sí** | **`hidden`** | **`flex`** | **`A.nav-link` «Home»** |
| **tras Escape** | `false` | `false` | no | `visible` | `none` | **`BUTTON.menu-button` (la hamburguesa)** |

Trampa de foco medida sobre los 9 tabulables visibles de `.navbar`: con el foco en el
**último**, `Tab` real deja el foco **dentro** del nav (vuelve al primero); con el foco en el
primero, `Shift+Tab` vuelve al último. No se escapa a los 11 613 px de página tapada.

### 6d · Desplegable de servicios a 1440 — **pasa**

| | `aria-expanded` | `.w--open` en el toggle | `.w--open` en la lista | `display` | alto | enlaces |
|---|---|---|---|---|---|---|
| cerrado | `false` | no | no | `none` | 0 | 12 |
| abierto | **`true`** | **sí** | **sí** | **`flex`** | **290 px** | 12 |
| tras Escape | `false` | no | no | `none` | 0 | 12 |

Tras `Escape` el foco vuelve a `a.nav-link.w-dropdown-toggle`.

---

## 7 · Higiene de las reglas duras

| regla | estado | evidencia |
|---|---|---|
| cero `!important` fuera de `prefers-reduced-motion` | **cumple** | 4 en `site.css:48-51`, los cuatro dentro del `@media (prefers-reduced-motion: reduce)` que abre en :47. La quinta aparición, `site.css:345`, está **dentro de un comentario**. |
| los dos `@layer webflow {}` deliberados | **cumplen** | `site.css:70` (reset de `<button>` con `:where()`) y `site.css:118` (`img{width:auto;height:auto}`). Intactos, con sus comentarios. |
| `src/styles/vendor/*` intocado | **cumple** | `git status --porcelain src/styles/vendor` → vacío. mtimes 27-jul 21:46/21:47, muy anteriores a la Fase 3. |
| mapa de propiedad §6 | **cumple** | ventana de la Fase 3 (14:51:22 – 15:01:57) toca **exactamente** los 9 ficheros previstos: `site.css`, `services/[slug].astro` ×2, `about-us.astro` ×2, `contact-us.astro` ×2, `terms.astro`, `privacy-policy.astro`. Ni uno más. |

`git diff --stat` da 24 ficheros modificados, pero 15 de ellos son de la sesión previa
(mtimes 11:32 – 13:30); el reparto por mtime aísla la Fase 3 limpiamente.

---

## 8 · Los 7 arreglos B-1…B-7, verificados uno a uno — **los 7 pasan**

### B-1 · Anillo de foco de dos tonos — **pasa**

Medido tabulando **de verdad** (9 `Tab` reales hasta el CTA de `.header-page` en
`/services/corporate-tax-preparation`), no con `.focus()`:

| | valor |
|---|---|
| `:focus-visible` | `true` |
| `outline` | `2px solid rgb(255,255,255)` |
| `outline-offset` | `2px` |
| `box-shadow` | `rgb(36,49,55) 0 0 0 4px` |
| fondo del botón | `rgb(109,162,40)` |

El anillo pintado es **navy 0-2 px + blanco 2-4 px**. Contrastes calculados: navy vs verde
del botón **4,36:1**, navy vs página blanca **13,4:1**, blanco vs navy de `.block-right`
**alto**. Cumple SC 1.4.11 en los dos fondos. `CSS.getMatchedStylesForNode` con
`forcePseudoState` confirma que la regla de `site.css:24-28` es la ganadora y que **no hay
ninguna otra declaración de `outline` en el CSS propio** (`grep` sobre `src` sin `vendor`: 1 sola).

> Aviso para quien mida esto: hay una transición sobre el anillo. Un `getComputedStyle`
> disparado justo tras enfocar devuelve valores a medio camino (`rgb(47,59,65) solid 2px`,
> `box-shadow` con spread `0.2px`). No es un bug: hay que dejar asentar la transición.

### B-2 · 40 px de sangría en las filas del pie — **pasa**

| | 1440 · 1ª col | 1440 · 2ª col | 375 |
|---|---|---|---|
| **baseline** (`.collection-list-footer` es `<div>`) | 785 | **1093** | 64 |
| **port** (es `<ul>`, `padding-left:0`, `li` a `40px`) | 785 | **1093** | 64 |

Paridad exacta. A ≤991 el `@media` deja el `li` a `0px` y los dos lados caen en 64.

### B-3 · Teléfono y correo del pie — **pasa**

| | tag | color | `text-decoration-line` |
|---|---|---|---|
| baseline (`+1 (754) 244-3993`) | `DIV` | `rgb(36,49,55)` | `none` |
| **port** | `A` `tel:` | **`rgb(36,49,55)`** | **`none`** |
| baseline (correo) | `DIV` | `rgb(36,49,55)` | `none` |
| **port** | `A` `mailto:` | **`rgb(36,49,55)`** | **`none`** |

Mismo `font-size` (16 px) y `font-weight` (400). Los otros dos `.link-footer` (dirección y
horario) siguen siendo `DIV` en los dos lados. Los 12 enlaces de servicio conservan su
subrayado, como en producción.

### B-4 · `SIZES_MV` de Misión y Visión — **pasa** (con un residuo, rechazo V2-06)

A 1440, `sizes="(max-width:991px) calc(100vw-64px), 675px"` → el navegador escoge el
candidato `800w`. La caja es 484×450 con `object-fit:cover` y la fuente 1250×833
(proporción 1,5006): cubrir 450 px de alto exige **675 px** de ancho. **Antes** se declaraba
484 → candidato `500w` → 675/500 = **35 % de ampliación**. **Ahora**: 0 %.

### B-5 · `/contact-us` ≥992 — **pasa, y es la desviación ya ratificada en PLAN.md**

| | tarjeta gris `.block-info-contact` | tarjeta azul `.block-form-contact` | desnivel |
|---|---|---|---|
| baseline | alto 559, `bottom` 812 | alto 685, `bottom` 938 | **126 px** |
| **port** | alto **1006**, `bottom` 1259, `align-self:stretch` | alto 1006, `bottom` 1259 | **0 px** |

El hueco de 447 px desaparece. **No es el baseline** (559 → 1006) y PLAN.md lo dice y lo
acepta explícitamente. No lo reporto como divergencia.

### B-6 · `overflow-wrap` en las legales — **pasa**

`.pendiente` computa **`break-word`** en las dos rutas (25 nodos en `/privacy-policy`,
12 en `/terms`). Los 7 marcadores de la tabla del modelo FTC están en la columna
«Do we share?», que ahora mide **148 px** (el ancho de `{{PENDIENTE:`, el vocablo más largo).
Siguen ocupando 2 líneas, exactamente como predice el comentario del propio arreglo: el corte
cae en el espacio y **ya no parte palabras**. `/terms` no tiene tabla; el cambio se aplicó
solo por coherencia y allí no cambia nada.

### B-7 · `clip-path` de fuente única — **pasa**

`grep clip-path` en las dos plantillas de servicio: **0 ocurrencias**. Solo quedan
`background-size`/`background-position` para el lqip en línea. Y el bloque de `site.css` ya
es alcanzable — computed **idéntico al baseline**:

| elemento | baseline | port |
|---|---|---|
| `.corner-top-1` / `.corner-bottom-1` | `polygon(50% 50%, 100% 0px, 0px 0px, 0% 100%)` | **igual** |
| `.corner-top-2` / `.corner-bottom-2` | `polygon(50% 50%, 100% 0px, 100% 100%, 0% 100%)` | **igual** |
| `.block-pic` | `polygon(90% 0px, 100% 50%, 90% 100%, 0px 100%, 0px 0px)` | **igual** |

---

## 9 · RECHAZOS

### V2-01 · Las 54 rutas sirven AVIF, que está prohibido — **se nota**

- **Ruta:** las 54 · **Sección:** toda imagen de mapa de bits · **Viewport:** cualquiera
- **Síntoma:** `auto=format` de Sanity **no sirve WebP: negocia por `Accept`**, y todo
  navegador moderno pide `image/avif` primero. El sitio entrega AVIF.
- **Evidencia** (mismo URL, tres cabeceras `Accept`):

  | `Accept` | `content-type` | bytes |
  |---|---|---|
  | `image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8` (Chrome real) | **`image/avif`** | 29 757 |
  | `image/webp,image/apng,image/*,*/*;q=0.8` | `image/webp` | 38 070 |
  | `image/*,*/*;q=0.8` | `image/jpeg` | 65 715 |

  Con la cabecera de Chrome, **26 de los 44 `src` distintos** de las 14 rutas medidas
  devuelven `image/avif` (los 18 restantes son SVG, que no se transcodifican).
  Barrido sobre `dist/`: **212 `<img src>` con `auto=format`, en las 54 rutas, 24 assets
  distintos**. El `og-default.png` sí sale `image/png` — ese está bien.
- **Causa raíz:** el helper `src()` con `&auto=format`, repetido en
  `src/components/Footer.astro:76`, `src/pages/index.astro:72`, `src/pages/es/index.astro:80`,
  `src/pages/about-us.astro:82`, `src/pages/es/about-us.astro:58`,
  `src/pages/services/[slug].astro:94`, `src/pages/es/services/[slug].astro:109`,
  `src/pages/post/[slug].astro:70`, `src/pages/es/post/[slug].astro:50`,
  `src/pages/blog-news.astro:35`, `src/pages/es/blog-news.astro:28`.
  **Ocho de esos ficheros llevan encima el comentario `// Prohibido AVIF: auto=format sirve
  WebP.`**, y `blog-news.astro:31` añade `(verificado con Accept: image/avif)`. Esa
  verificación **no se sostiene**: es exactamente la cabecera con la que hoy sale AVIF.
  `baseline/auditoria-diseno.md:304` también afirma «ningún AVIF» en las 54 rutas.
- **Arreglo propuesto:** cambiar `auto=format` por `fm=webp` en el helper `src()` de los 11
  ficheros, o centralizar el helper en `src/lib/` y arreglarlo una vez. Y **corregir los 8
  comentarios y la línea 304 de `auditoria-diseno.md`**, que hoy afirman lo contrario de lo
  que hace el código.
- **Archivos a tocar:** los 11 de arriba (o uno solo si se centraliza) + `baseline/auditoria-diseno.md`
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** **No.** `auditoria-diseno.md` afirma
  lo contrario de lo medido.

### V2-02 · La ficha de servicio invierte la lista con `.reverse()`, que no estaba en el encargo y pertenece a un hallazgo bloqueado — **se nota**

- **Ruta:** las 24 fichas · **Sección:** `.collection-list-2` (barra lateral)
- **Síntoma:** la Fase 3 asignó a **F3 un solo arreglo, B-7** (borrar los `clip-path`
  duplicados). Además de eso se metió un cambio de **orden de contenido**.
- **Evidencia:** `git diff`
  - `src/pages/services/[slug].astro:278`: `todos.map(` → `[...todos].reverse().map(`
  - `src/pages/es/services/[slug].astro:256`: idéntico
- **Causa raíz:** es el arreglo del hallazgo **A-2**, que PLAN.md §BLOQUE A declara
  **BLOQUEADO** («8 hallazgos quedan bloqueados esperando tu decisión y **no entran en la
  Fase 3**»). El encargo de esta fase decía expresamente «NO se han tocado y NO deben estarlo».
- **Nota:** el resultado **de hoy es correcto** — la barra lateral coincide literal con el
  baseline, verificado enlace a enlace en `dist/client/services/corporate-tax-preparation/`
  y en su gemela ES. Pero es un `reverse()` cableado sobre un orden que ahora viene del dato:
  si el `order` de Sanity se recalcula o se reordena, esta lista se invierte en silencio y
  nadie se entera. Merece quedar registrado como decisión, no como efecto colateral.
- **Archivos a tocar:** `src/pages/services/[slug].astro`, `src/pages/es/services/[slug].astro`
- **Dueño:** F3
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No.

### V2-03 · Se escribió en Sanity: A-2 y A-4 están aplicados pese a estar bloqueados — **se nota**

- **Ruta:** las 54 (orden) y las 20 de post (titular) · **Sección:** datos
- **Síntoma:** dos de los ocho hallazgos bloqueados por la regla dura §5 («No tocar contenido
  de Sanity… Si el arreglo es de datos: **para y pregunta**») **ya están hechos en el dataset**.
- **Evidencia:**
  1. **A-2 · orden.** `sanity.ts:95` consulta `order(order asc, title asc)`. Si `order`
     estuviera a `null` en los 12 documentos —como verificó la Fase 1 con GROQ, 12/12— el
     desempate sería `title asc`. **No lo es.** El desplegable del `<nav>`, que pinta
     `servs.map(...)` sin transformar nada (`Nav.astro:250`), sale
     `corporate → personal → business-incorporation → EIN → ITIN → representation → audit →
     sales-tax → monthly → financial → notary → bilingual`, que **no es alfabético** y **sí es
     el orden del oráculo, literal**. Las cuatro superficies coinciden hoy con el baseline:
     nav (12/12), pie (12/12), barra lateral (12/12) y parrilla de la portada (12/12). Y los
     10 posts de `/blog-news` salen en el orden exacto del oráculo.
  2. **A-4 · titular del cuerpo.** El primer bloque del cuerpo de
     `/post/understanding-tax-deductions` ya es un bloque de estilo `h1` (lo emite
     `PortableText` como `<h2>`, `font-size:32px`, `font-weight:700`), donde antes era
     `normal` a 16 px. Es exactamente la reparación de `restaurar-orden.mjs:133-165`.
  3. `sanity.ts:28` fija `useCdn: false`, o sea **sin caché**: lo que renderiza el build es el
     estado actual del dataset. Como la Fase 1 midió `order` nulo a las 14:03 y el build de las
     15:05 lo ve poblado, **la escritura ocurrió después de que arrancara la auditoría**.
- **Lo que NO se ha tocado**, comprobado: **A-1** sigue roto (los 10 posts comparten el mismo
  `heroImage`, que además es el `picture.png` del promo del pie — el aviso del build sigue
  encendido y el `src` del hero es `9786cde4…-1289x1679.png`, el mismo del pie); **A-3** sigue
  roto (el carrusel abre por «Sofía M.» donde producción abre por «Juan T.»); A-5 y A-6 sin
  cambios.
- **Arreglo propuesto:** ninguno técnico. **Confirmar con el dueño que esa escritura estaba
  autorizada** y actualizar PLAN.md: hoy dice que los 8 siguen bloqueados y son 6.
- **Dueño:** orquestador
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No.

### V2-04 · El titular del cuerpo del post queda en 32 px donde el baseline tiene 38 — **cosmético**

- **Ruta:** las 20 de post · **Sección:** `.w-richtext` · **Viewport:** 1440
- **Síntoma:** al reparar A-4 en el dato (V2-03) se ha materializado el residuo que PLAN.md
  dejaba **como decisión abierta**, sin que la decisión se haya tomado.
- **Evidencia** (`/post/understanding-tax-deductions`, primer hijo de `.w-richtext`):

  | | etiqueta | `font-size` | `font-weight` | `<h1>` en la página |
  |---|---|---|---|---|
  | baseline | `H1` | **38 px** | 700 | 2 |
  | port | `H2` | **32 px** | 700 | 1 |

- **Causa raíz:** `PortableText.astro:99-106` mapea `h1 → <h2>` para no dejar dos `<h1>`
  por página, y `.w-richtext h2` computa 32 px.
- **Arreglo propuesto:** es la disyuntiva textual de PLAN.md — aceptar los 6 px a favor de la
  jerarquía de encabezados, o emitir `<h1>` para 1:1 estricto. **Hace falta la decisión.**
- **Archivos a tocar:** `src/components/PortableText.astro` (solo si se elige 1:1)
- **Dueño:** F0
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No — PLAN.md lo deja pendiente.

### V2-05 · `<main>` → `<main id="main">` en 8 ficheros, fuera del encargo de la Fase 3 — **cosmético**

- **Ruta:** 34 de las 54 · **Sección:** landmark principal
- **Evidencia:** `git diff` muestra `-<main>` / `+<main id="main">` en `about-us.astro`,
  `es/about-us.astro`, `contact-us.astro`, `es/contact-us.astro`, `privacy-policy.astro`,
  `terms.astro`, `services/[slug].astro`, `es/services/[slug].astro` — los 8 con mtime dentro
  de la ventana de la Fase 3 (14:56 – 15:01). Ninguno de los 7 arreglos B-* lo pedía.
- **Nota:** el cambio **es bueno** y cierra un defecto real: el enlace de salto de
  `BaseLayout` apunta a `href="#main"` y en esas rutas no había destino. Hoy las **54/54**
  rutas construidas tienen `id="main"`. Se reporta porque es trabajo no declarado en una fase
  cuyo alcance estaba cerrado, no porque esté mal hecho.
- **Dueños:** F5 y F3
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No.

### V2-06 · Residuo de B-4: entre 480 y ~586 px la foto sigue 5 % corta, y el comentario que lo descarta es falso — **cosmético**

- **Ruta:** `/about-us`, `/es/about-us` · **Sección:** `.pic-about-us` de Misión y Visión
- **Síntoma:** el arreglo resuelve ≥992 px, pero el comentario que escribe
  (`about-us.astro:100`) afirma «A ≤991px la caja baja a 350/250px de alto y
  `calc(100vw - 64px)` ya cubre de sobra». **En una banda no es cierto.**
- **Evidencia** (medido, DPR 1, `.pic-about-us` de Misión y de Visión):

  | viewport | caja | candidato elegido | px que exige `cover` | déficit |
  |---|---|---|---|---|
  | 480 | 416×350 | `w=500` | **524** | **4,8 %** |
  | 520 | 456×350 | `w=500` | **527** | **5,4 %** |
  | 600 | 536×350 | `w=800` | 536 | 0 |
  | 768 | 668×450 | `w=800` | 675 | 0 |
  | 1440 | 484×450 | `w=800` | 675 | 0 |

  (`accounting-max.webflow.css:1439/2813/2975`: alto 450 → 350 a ≤991 → 250 a ≤479.)
- **Causa raíz:** entre 480 y ~586 px la caja mide 350 de alto y `cover` exige
  350 × 1,5006 ≈ **525 px** de ancho, mientras `calc(100vw - 64px)` declara 416–522.
- **Nota de escala:** son **~5 %**, no los 35 % que arreglaba B-4, y solo a DPR 1 (a DPR 2
  el navegador sube de candidato y desaparece). **No pido revertir nada**: pido corregir el
  comentario, que hoy afirma algo que no se cumple, y —si se quiere— cerrar la banda con
  `(max-width:991px) max(calc(100vw - 64px), 525px)`.
- **Archivos a tocar:** `src/pages/about-us.astro`, `src/pages/es/about-us.astro`
- **Dueño:** F5
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** No.

---

## 10 · Falsos positivos que descarté y no reporto

1. **120 «imágenes rotas».** `complete===false && naturalWidth===0` en los SVG del submenú
   cerrado. Los 44 `src` distintos dan **200** por HTTP. Es el falso positivo ya conocido.
2. **404 de `/es/`.** Es `trailingSlash: "never"` en desarrollo; en producción hay un 308.
   Verificado con `curl` y con `.vercel/output/config.json`.
3. **`overflow-wrap: normal` en los `td`.** Medí las celdas en vez del `.pendiente`. El
   arreglo B-6 va sobre `.pendiente` y allí computa `break-word`. Mi primer método estaba mal.
4. **«Anillo de foco distinto en el pie.»** Leí el computed a mitad de transición. Con la
   transición asentada el anillo es el mismo en todas partes.
5. **«26 % de ampliación en la banda 480-586».** `naturalWidth` viene **corregido por
   densidad** cuando el `srcset` usa descriptores `w`. Comparado contra los píxeles reales
   servidos, el déficit es **5 %**, no 26. Corregido en V2-06.
6. **`/api/lead` y `/api/newsletter` como enlaces a 404.** Son funciones con ruta declarada
   en `.vercel/output/config.json`.

---

## 11 · Limitaciones de esta verificación

- Las 42 cargas de consola y desborde se hicieron contra **`astro dev` (:4321)**, no contra
  `dist/` servido en estático. Los únicos mensajes de consola son los del cliente HMR, que en
  producción no existen; el resto del render es el mismo marcado que verifiqué en `dist/`.
- No he consultado Sanity ni con GROQ: V2-03 se deduce **solo** del render y de
  `useCdn: false`. La deducción es sólida, pero la fecha exacta de la escritura no la sé.
- El contraste de V2-01 y de B-1 está **calculado** a partir de los computed medidos
  (fórmula WCAG de luminancia relativa), no leído de un medidor externo.
