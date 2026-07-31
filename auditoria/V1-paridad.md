# V1 · Paridad y cierre — verificación adversarial de la Fase 3

**Instrumento:** `tools/capturas.mjs medir|diff` + CDP directo (`CSS.forcePseudoState`,
`Input.dispatch*`, `Page.captureScreenshot`) desde `/tmp/ams/V1-*.mjs`. Chrome en
`AMS_PUERTO=9251`, perfil `/tmp/ams-perfil-V1`. **No he tocado ni un fichero del
proyecto.** Las lecturas de Sanity son GROQ de SOLO LECTURA (`/data/query`), nunca
`/mutate`.

**Assert de vivacidad:** `:4321` y `:4327` vivos antes de cada tanda, y las 9 rutas del
puerto + las 7 del oráculo responden 200 con cuerpo no vacío. No hay T1 en este informe.

**Ventana de medida:** 15:05–15:07 EDT (JSON `V1-*`). Es un dato que importa: ver R1.

---

## 0 · Veredicto

**Los 7 arreglos B-1…B-7 están aplicados y los he verificado con medidas propias.**
Cinco cierran limpios (B-2, B-3, B-4, B-5, B-7). Dos cierran con reserva (B-1, B-6).
Cero regresiones de maquetación: el diff puerto-antes → puerto-ahora solo contiene lo
que la Fase 3 se propuso cambiar.

**Pero el punto 4 falla: SE ESCRIBIÓ EN SANITY.** Dos de los ocho hallazgos bloqueados
—A-2 (orden) y A-4 (titular del cuerpo)— están hoy escritos en el dataset de
producción. Eso es una violación de la regla dura §5 y es el hallazgo principal de este
informe.

---

## 1 · Recaptura y diff

7 rutas × 2 anchos × 2 lados. Bruto, con el desglose que exige T3:

| ruta | 1440 total | FALTA | SOBRA | props | 375 total | FALTA | SOBRA | props |
|---|---|---|---|---|---|---|---|---|
| `/` | **253** | 98 | 78 | **77** | 267 | 98 | 78 | 91 |
| `/services/audit-assistance` | 209 | 83 | 60 | 66 | 237 | 83 | 60 | 94 |
| `/services/personal-tax-preparation` | 214 | 83 | 60 | 71 | 235 | 83 | 60 | 92 |
| `/post/understanding-tax-deductions` | 184 | 84 | 52 | 48 | 201 | 84 | 52 | 65 |
| `/blog-news` | 189 | 83 | 73 | 33 | 205 | 83 | 73 | 49 |
| `/about-us` | 202 | 108 | 57 | 37 | 217 | 108 | 57 | 52 |
| `/contact-us` | 195 | 83 | 70 | 42 | 211 | 83 | 70 | 58 |

**La portada a 1440 da 253 · 98 FALTA · 78 SOBRA · 77 con propiedades divergentes: el
mismo número exacto que antes de la Fase 3** (`00-contexto.md` §T3). No es sospechoso,
es lo esperado: los tres arreglos de F0 caen sobre nodos cuya clave de clase **no
existe en el baseline** (`li.collection-item-footer` no existe allí, y el teléfono y el
correo son `<div>` en producción y `<a>` aquí), así que mejoran el píxel sin mover el
contador.

### Aplicando T3 a las 92 divergencias de `width`/`height` de la portada a 1440

Clasificador propio (`/tmp/ams/V1-t3.mjs`): si el multiconjunto completo de valores de
ese selector coincide en los dos lados, es desfase de índice.

- **27 son desfase de índice puro** (T3) — entre ellas las tres de `a.nav-link` que el
  contexto ya usa de ejemplo.
- **65 son cajas realmente distintas.** De esas:
  - **33 son el pie**: `a.link-footer` ×24 (12 anchos + 12 altos), `div.block-footer`
    ×3, `li.list-item-footer` ×2, `div.link-footer` ×2, contenedor ×2. Todas salen de
    D1 (`min-height:44px` + `inline-flex`, SC 2.5.5/2.5.8), **ratificado en
    `auditoria-diseno.md` — no se reporta.** Consecuencia medida: el pie del puerto es
    54 px más alto que producción en las 7 rutas (324 vs 270).
  - **28 son el FAQ**: 25 son la representación del panel plegado (baseline
    `display:block; height:0` con IX2 · puerto `display:none`, geometría equivalente) y
    3 son el `<div>` de entradilla que el puerto retira (ver R6): `.block-title-faq`
    80 px → 55 px y `section.faq` 860 → 835.
  - **4 son sub-píxel** (`h3.title-faq` 412,219 → 412,281 px, etc.).
- Las permutaciones de `div.block-title-services` / `h2.title-bar-services` /
  `div.name-customer` **no son cajas malas: son el orden**. Los valores son los mismos,
  barajados. Es A-2 y A-3.

### Regresiones: cero

Comparé el puerto **antes** (JSON `A1…A6-p-*` de las 14:03–14:22) contra el puerto
**ahora**, que es el detector limpio porque los dos lados son el mismo sitio:

| ruta | divergencias antes→ahora | qué son |
|---|---|---|
| `/` 1440 | 24 | las 24 previstas del pie |
| `/` 375 | 9 | las mismas, plegadas a una columna |
| `/about-us` 1440 / 375 | 24 / 9 | pie |
| `/contact-us` 1440 | 24 | pie + `.block-info-contact` 559 → 1006 (B-5) |
| `/contact-us` 375 | 9 | pie |
| `/services/…` 1440 / 375 | 23 / 32 | pie |
| `/blog-news` 1440 / 375 | 23 / 25 | pie |
| `/post/…` 1440 | 34 | pie + `.w-richtext` 261 → 272 y una **permutación** de los anchos de las tarjetas relacionadas |

Ninguna divergencia nueva contra el baseline. La única entrada que no venía en la lista
de la Fase 3 —`div.container-menu.w-container` `margin: 0px → 0px 95px`— **no es una
regresión sino lo contrario**: el baseline dice `0px 95px` y ahora el puerto coincide;
`x=95 w=1250` era ya idéntico en los dos casos, o sea que la lectura anterior fue un
computed capturado a destiempo.

La permutación del `/post/` y la de la portada **sí son nuevas, y no las hizo la Fase 3**:
son el efecto de la escritura en Sanity. Ver R1.

---

## 2 · Cierre de los 7 arreglos, uno a uno

### B-1 · anillo de foco de dos tonos · **CIERRA CON RESERVA**

Forcé `:focus-visible` por CDP (`CSS.forcePseudoState`) en 13 controles de 3 rutas y 2
anchos. **Primero tuve que corregir mi propio instrumento:** a 80 ms de forzar el
pseudo-estado leía `outline: 2px solid rgb(148,154,157)` y `box-shadow: rgba(36,49,55,
0.51) 0 0 0 2.04379px` en los enlaces del pie — que no es un anillo roto sino la
transición de Webflow **a medio camino** (0,51 exacto entre reposo y foco). Con 900 ms
de espera todos leen el valor final.

Regla efectiva en **todos** los controles probados:
`outline: 2px solid rgb(255,255,255)`, `outline-offset: 2px`,
`box-shadow: rgb(36,49,55) 0 0 0 4px`.

| control | fondo detrás | perfil blanco | sombra navy |
|---|---|---|---|
| `.header-page a` (CTA verde de las 24 fichas) | blanco | 1,00 | **13,38** |
| `.call-action a` | navy | **13,38** | 1,00 |
| `a.nav-link`, `button.w-dropdown-toggle` | navy | **13,38** | 1,00 |
| `button.menu-button`, `.nav-telefono` (375) | navy | **13,38** | 1,00 |
| `input.text-field`, `input[type=submit]` del boletín | navy | **13,38** | 1,00 |
| `button.faq-question`, `.saltar-al-contenido` | blanco | 1,00 | **13,38** |
| `button.button-slider-cms` | navy | **13,38** | 1,00 |
| `.link-footer[href^=tel:]`, `[href^=mailto:]`, los 12 de servicio | blanco | 1,00 | **13,38** |

El caso que motivó B-1 queda cerrado: el CTA de `.header-page` pasa de 1,00:1 (blanco
sobre blanco) a una banda navy de 2 px a 13,38:1. **Ninguno de los controles que ya
funcionaba se ha roto.**

Dos reservas, R3 y R4 más abajo.

### B-2 · 40 px de sangría devueltos a las filas del pie · **CIERRA**

| | baseline | puerto |
|---|---|---|
| 1440 · columna 1 de servicios, `x` | **785** | **785** |
| 1440 · columna 2, `x` | **1093** | **1093** |
| 375 · los 12, `x` | **64** | **64** |

`ul.collection-list-footer` pasa de `padding-left:40px` + `margin-bottom:10px` a `0`, y
`li.collection-item-footer` recibe los 40 px (0 por debajo de 992). Antes de la Fase 3
la segunda columna caía en 1073 y ahora cae en 1093. Exacto.

### B-3 · teléfono y correo del pie · **CIERRA**

Portada a 1440, los 14 `.link-footer` leídos de un tirón:

| | baseline | puerto |
|---|---|---|
| teléfono y correo (`<div>` allí, `<a>` aquí) | `rgb(36,49,55)` · `none` | `rgb(36,49,55)` · `none` |
| los 12 enlaces de servicio | `rgb(51,51,51)` · `underline` | `rgb(51,51,51)` · `underline` |

El `[href^=]` acota exactamente los dos. Sin daño colateral en `/contact-us`: el único
cambio antes→ahora en esa ruta, fuera del pie, es `.block-info-contact` (B-5).

> Nota T3: en el diff contra baseline siguen apareciendo `a.link-footer[0]` y `[1]` con
> `underline → none` y `#333 → navy`. **Es ruido de índice, no un bug**: en el baseline
> esos dos índices son los dos primeros enlaces de *servicio*, y en el puerto son el
> teléfono y el correo, porque el cambio de `<div>` a `<a>` desplaza la serie.

### B-4 · `SIZES_MV` de misión y visión · **CIERRA**

Cuidado con `naturalWidth`: con `srcset` de descriptores `w` el navegador devuelve la
medida **corregida por densidad**, no los píxeles reales (leí 675×449 para un fichero
que el CDN sirve a 800×533 — comprobado con `curl`). El número bueno sale del `w=` de
`currentSrc`.

| foto | caja | proporción de la fuente | píxeles necesarios | servidos | ampliación |
|---|---|---|---|---|---|
| hero (`SIZES_HERO`, sin tocar) | 609×450 | 1,0000 | 609 | 800 | **0,761** |
| misión | 484×450 | 1,5006 | 675 | 800 | **0,844** |
| visión | 484×450 | 1,5170 | 683 | 800 | **0,853** |

Las tres por debajo de 1: **ya no se amplía nada** (antes: 675 necesarios contra 500
servidos = 1,35). A 375 la caja baja a 311×250, hacen falta 375 px y el candidato
elegido es el de 500 w. Idéntico en `/es/about-us`. `git diff` confirma que
`SIZES_HERO` **no** se tocó en ninguna de las dos rutas.

### B-5 · desnivel de `/contact-us` · **CIERRA (con la desviación ya decidida)**

| ancho | | baseline | puerto |
|---|---|---|---|
| 1440 | `.block-info-contact` alto | 559 | **1006** |
| 1440 | desnivel contra `.wrapper-form-page` | 126 | **0** |
| 992 | desnivel | 116 | **0** |
| **991** | `.block-info-contact` alto | 539 | **539** |
| **375** | `.block-info-contact` alto | 629 | **629** |

`align-self` es `stretch` a ≥992 y `auto` a ≤991. **Por debajo de 992 no ha cambiado
absolutamente nada**, ni en EN ni en ES (`/es/contact-us` a 1440: 1085/1085, desnivel 0).
La desviación respecto al baseline (1006 donde producción tenía 559) es la que
`PLAN.md` acordó explícitamente.

### B-6 · `overflow-wrap` en las legales · **CIERRA A MEDIAS**

Lo que el encargo pedía comprobar era «`mark.pendiente` en una sola línea y la tabla sin
desbordar». **La tabla, sí. La sola línea, no** — y el propio comentario de
`privacy-policy.astro` lo admite.

- Cortes a mitad de palabra en `/privacy-policy`: **0** (detector por `Range` carácter a
  carácter, a 1440 y a 375).
- Columna «Do we share?»: **148 px** (era 119).
- Tabla a 1440: `scrollWidth == clientWidth == 820`, sin desborde.
- Tabla a 375: 600 px dentro de un `.legal-table-scroll` de 311 con `overflow-x:auto`;
  desborde horizontal de la página: **0**.
- Los 7 marcadores de la tabla siguen en **2 líneas** (97 px de ancho cada uno).
- `/terms`: los 3 «cortes» que marcó mi detector caen todos **detrás de un guion**
  (`carve-out,`, `e-file`, `GLBA-covered`), que es una oportunidad de corte legítima.
  Falso positivo mío, verificado.

### B-7 · `clip-path` de fuente única · **CIERRA**

Computados idénticos entre baseline y puerto en `/services/audit-assistance`:

| ancho | `.background-services` | esquinas 1 / 2 | `.block-pic` |
|---|---|---|---|
| 1440 | `polygon(20% 0px, 100% 0px, 100% 100%, 0% 100%)` | idénticos | `polygon(90% 0px, …)` |
| 789 | `polygon(50% 20%, …)` | idénticos | `polygon(100% 0px, …)` |
| 375 | `polygon(50% 20%, …)` | idénticos | `polygon(100% 0px, …)` |

Recorrí `document.styleSheets` entero: en el puerto hay **una sola regla por selector**
(más su variante en `@media … 789px`), y sale de la hoja que Astro inyecta en dev con
`main.css` + `site.css`. `grep` confirma cero `clip-path` en
`src/pages/services/[slug].astro` y en `src/pages/es/services/[slug].astro`. El bloque de
`site.css` es alcanzable.

---

## 3 · Los 15 arreglos previos, a 375 · **todos en pie**

Medido en `/` a 375, abriendo el cajón con clics reales de CDP.

| | comprobación | medido | doc |
|---|---|---|---|
| M1 | marca sin desbordar | `.brand` y44→108, `.menu` 108, desborde 0 | ✓ (ver R7) |
| M2 | hamburguesa sin el gris del UA | `background-color: rgba(0,0,0,0)`, 48×48 | ✓ |
| M3 | icono en aspa | barra `rgb(255,255,255)` → `rgba(0,0,0,0)`, `aria-expanded=true` | ✓ |
| M4 | bloqueo de scroll | `html.nav-abierto`, `overflow: visible → hidden` | ✓ |
| M5 | ritmo del cajón | 120 · 169 · 218 · 267 · **333** (Contact) · CTA en **398** | ✓ exacto |
| M6 | botón de llamada | `.nav-telefono` 79,3×44, `tel:+17542443993` | ✓ |
| M7 | credenciales a una línea | 109,8×20 y 112,9×20, 1 caja cada una | ✓ exacto |
| M8 | cajón de dos niveles | 12 items, 44 px, **1 columna**, `min-width: 0px` | ✓ |
| D1 | objetivos táctiles del pie | `min-height: 44px`, altos 44/44/50/50 | ✓ |
| D2 | campo del boletín | 311×**50** (y el envío 164×50) | ✓ |
| D3 | enlace de salto | existe, `href="#main"`, destino presente, `translateY(-90px)` en reposo | ✓ |
| D5 | botón «Back» | `.nav-volver` 335×44, fondo transparente, `rgb(157,191,67)` | ✓ |

**D4 · trampa de foco** — lo repetí con `Input.dispatchMouseEvent` /
`Input.dispatchKeyEvent` reales después de comprobar que mi primer intento era inválido
(el manejador vive en `navbar.addEventListener("keydown")`, `ui.ts:108`, y un evento
despachado sobre `document` nunca le llega; además `.click()` no mueve el foco como un
ratón). Con eventos de verdad:

```
1 abre el cajón      foco a.nav-link «Home»                nav=true  html=nav-abierto  overflow=hidden
2 abre Services      foco button.w-dropdown-toggle.w--open submenu=true
3 Escape             foco button.w-dropdown-toggle          submenu=false  nav=true      ← vuelve al nivel 1
4 Escape             foco button.menu-button                nav=false  html=""  overflow=visible
6 Tab ×9  Home → Services → About Us → Blog & news → Contact Us → CTA → Call → Menu → marca → Home
```

Cierra el ciclo sin escaparse. Coincide punto por punto con la tabla de
`auditoria-diseno.md` §D4.

**Extra:** `site.css` sigue sano — los 4 `!important` están solo dentro del bloque
`prefers-reduced-motion` (líneas 48-51) y los dos `@layer webflow {}` deliberados siguen
en su sitio (70 y 118). **44 enlaces internos únicos, 0 que no devuelvan 200.**

---

## 4 · Los 8 bloqueados · **DOS YA NO LO ESTÁN**

GROQ de solo lectura contra `ep5i6co1/production`:

```
los 12 service   order = 1…12   _updatedAt = 2026-07-28T19:04:09Z
los 10 post      order = 1…10   body[0].style = "h1"   _updatedAt = 2026-07-28T19:04:09Z
los 20 review    order = null                          _updatedAt = 2026-07-28T02:26:0xZ
```

`19:04:09Z` son las **15:04:09 EDT de hoy**: después de que terminaran los auditores
(14:22) y después del último cambio de `site.css` (14:51). El orden escrito es el
canónico de producción (`corporate-tax-preparation`, `personal-tax-preparation`,
`business-incorporation-in-florida`, …), exactamente la secuencia que sale del
desplegable del oráculo. Es lo que hace `tools/restaurar-orden.mjs --write`.

Los tres testigos en disco dicen lo contrario, y son de antes:
`baseline/import/docs.json` y `snap1.ndjson` (27-jul 23:52) y `snap2.ndjson` (22:38)
tienen los 10 posts con `body[0].style: "normal"` y sin `order`.

| bloqueado | estado |
|---|---|
| **A-1** imagen de las 22 rutas de blog | **intacto** · las 10 `heroImage` siguen en `image-9786cde4…`, el mismo asset que el `.bg-pic` del promo del pie, verificado en 4 posts y en las 10 tarjetas de `/blog-news` |
| **A-2** orden de servicios y posts | **ESCRITO** |
| **A-3** orden de testimonios | **intacto** · `order:null`, el carrusel sigue abriendo por «Sofía M.» donde producción abre por «Juan T.» |
| **A-4** titular del cuerpo | **ESCRITO** (`normal` → `h1`) |
| **A-5** segunda imagen por post | intacto (necesita esquema) |
| **A-6** párrafos vacíos | intacto |

**Aviso sobre lo que se ve ahora mismo en `:4321`.** `Nav.astro:71` y `Footer.astro:58`
memorizan la consulta en `globalThis.__amsServicios`, así que el servidor de desarrollo
sirve **la lista de servicios congelada de antes de la escritura** (alfabética en el
`<nav>`, inversa en el pie) mientras `/blog-news` y los posts ya salen con el orden
nuevo. El sitio que está en el puerto es hoy una mezcla de dato viejo y dato nuevo; hace
falta reiniciar `astro dev` para ver el estado real. En build no pasa (una sola pasada).

---

## 5 · Rechazos

### V1-R1 · Se escribió en Sanity: A-2 y A-4 salieron del bloqueo sin autorización

- **Superficie:** dataset `ep5i6co1/production` · 22 documentos
- **Síntoma:** los 12 `service` y los 10 `post` tienen `order` poblado y los posts
  `body[0].style = "h1"`; los tres estaban en el bloque A de `PLAN.md`, a la espera de
  decisión.
- **Evidencia:** `_updatedAt = 2026-07-28T19:04:09Z` (15:04:09 EDT) en los 22, contra
  `order:null` / `style:"normal"` en `baseline/import/snap1.ndjson` y `snap2.ndjson`.
  Los `review` conservan `_updatedAt = 2026-07-28T02:26:0xZ` y `order:null`, o sea que
  la escritura fue selectiva y coincide con lo que toca `restaurar-orden.mjs --write`.
- **Causa raíz:** ejecución de `tools/restaurar-orden.mjs --write` (o equivalente), que
  §5 prohíbe expresamente («No tocar contenido de Sanity ni ejecutar los scripts de
  escritura de `tools/`… Si el arreglo es de datos: **para y pregunta**»).
- **Severidad:** rompe

### V1-R2 · El titular del cuerpo sale a 32 px donde producción tiene 38, y la decisión nunca se tomó

- **Ruta:** las 20 de post · **Viewport:** 1440
- **Evidencia:** primer hijo de `.w-richtext` —
  | | baseline | puerto |
  |---|---|---|
  | etiqueta | `H1` | `H2` |
  | `font-size` / `line-height` | 38 px / 44 px | **32 px / 36 px** |
  | `<h1>` en la página | 2 | 1 |
- **Causa raíz:** `PortableText.astro:99-106` mapea `h1 → <h2>`. El comentario que
  acompaña al mapeo dice que «hoy esta entrada NO se dispara» y que hay «0 bloques h1»;
  tras la escritura de R1 **sí se dispara en los 10 posts**, así que el comentario ya
  es falso.
- **Arreglo propuesto:** es la decisión que `PLAN.md` dejó abierta —aceptar los 6 px o
  emitir `<h1>`—; hay que tomarla ahora que el dato está puesto.
- **Severidad:** se nota

### V1-R3 · El anillo de foco de la fachada de vídeo está recortado al 100 %

- **Ruta:** `/` y `/es/` · **Sección:** `.youtube`
- **Evidencia:** `button.yt-facade` mide 493×277 en `x=115,y=1164`, y su contenedor
  `.w-embed-youtubevideo.youtube` mide **exactamente lo mismo** con `overflow:hidden`.
  El anillo se pinta en 0-4 px **fuera** de la caja, así que se recorta entero. Prueba
  de píxel: al forzar `:focus-visible` cambian 3102 px y **todos caen dentro** del
  control, en `[328,426]-[395,473]` — que es el triángulo de reproducción de 68×48.
- **Causa raíz:** lo único que queda como indicador es
  `.yt-facade:focus-visible .yt-play { opacity: .75 }` (`index.astro:649-650`),
  **idéntico al `:hover`** de la línea anterior.
- **Arreglo propuesto:** `outline-offset` negativo en `.yt-facade` (o el anillo sobre
  `.youtube`). No lo introdujo B-1 —era igual antes—, pero desmiente que el anillo se
  vea en TODOS los controles.
- **Severidad:** se nota

### V1-R4 · B-1 se lleva por delante la sombra de reposo de las 12 tarjetas de servicio

- **Ruta:** `/` y `/es/` · **Sección:** `.block-bar-services` ×12
- **Evidencia:** reposo `box-shadow: rgba(0,0,0,0.2) 0 2px 5px 3px`; con foco, la regla
  de `site.css:24-28` sustituye la propiedad entera por `rgb(36,49,55) 0 0 0 4px`.
  Escaneo de la línea `y=450` cruzando el borde izquierdo:
  | x | sin foco | con foco |
  |---|---|---|
  | 87–90 | 206,205,211 → 196,195,200 (degradado de la sombra) | 207,206,212 (fondo liso) |
  | 91–92 | 190,189,194 | **255,255,255** |
  | 93–94 | 177,176,181 | **36,49,55** |
  | 95+ | 36,49,55 (la tarjeta) | 36,49,55 |
- **Lectura:** sobre esta tarjeta el anillo de dos tonos degenera —la banda navy se
  funde con la tarjeta navy y la blanca solo llega a **1,58:1** contra el fondo de
  sección `rgb(207,206,212)`—, pero el cambio de estado sí es perceptible (6,09:1 entre
  reposo y foco en 93-94), así que SC 2.4.11 se cumple. El comentario de `site.css`
  solo reconoce el daño en `.text-field-form`; estas 12 tarjetas no están anotadas.
- **Severidad:** cosmético

### V1-R5 · B-6 no deja el marcador en una línea

- **Ruta:** `/privacy-policy` · **Sección:** tabla del modelo FTC
- **Evidencia:** los 7 `mark.pendiente` de la tabla siguen ocupando 2 cajas de línea
  (97 px de ancho). Lo que sí cierra: 0 cortes a mitad de palabra, columna a 148 px,
  tabla sin desbordar a 1440 ni a 375.
- **Causa raíz:** `min-content` es el vocablo más largo (`{{PENDIENTE:`, 148 px), no la
  frase entera (162 px), y el espacio sigue siendo punto de corte. El propio comentario
  del arreglo lo dice.
- **Severidad:** cosmético · **queda como discrepancia entre el encargo y el resultado,
  no como defecto de la página**

### V1-R6 · D11 y D12 no existen en `DECISIONS.md`

- **Ruta:** `/` (FAQ) y las 26 (iconos sociales)
- **Evidencia:** producción tiene un `<div>` de 25 px con «This is some text inside of a
  div block.» dentro de `.block-title-faq`; el puerto no. Medido: `.block-title-faq`
  **80 px → 55 px**, `section.faq` 860 → 835. El commit `38e0788` lo justifica citando
  «(D12)» y «(D11)», y `auditoria-diseno.md` §R3 también remite a D11 — pero
  `DECISIONS.md` **no contiene ni D11 ni D12**.
- **Impacto:** §4 hace vinculantes solo `DECISIONS.md` y `auditoria-diseno.md`. Con la
  referencia colgando, esta divergencia se va a volver a reportar en cada barrido. Yo
  mismo estuve a punto.
- **Arreglo propuesto:** escribir D11 y D12 en `DECISIONS.md`.
- **Severidad:** cosmético

### V1-R7 · `auditoria-diseno.md` §M1 tiene una cifra caducada

- **Evidencia:** el documento da `.brand` a 375 en **150×64** después del arreglo; hoy
  mide **59,2×64**, con `.logo` en 59×48. La proporción coincide con el logotipo de
  escritorio (123×100 = 1,23; 48 × 1,23 = 59). Un `.brand` de 150 con un `.logo` de 48
  de alto sería el logotipo aplastado.
- **Lectura:** el objetivo de M1 se cumple (`.brand` y44→108 = el `.menu` de 108,
  desborde 0). La cifra es anterior al bloque `@layer webflow { img { width:auto } }`
  de `site.css`. **No es una regresión**, es documentación desfasada que hará dudar al
  siguiente.
- **Severidad:** cosmético

---

## 6 · Lo que probé a romper y aguantó

- El anillo en 13 controles × 3 rutas × 2 anchos: no encontré ninguno con los dos tonos
  por debajo de 3:1 salvo el caso analizado en R4.
- Barrido de todos los focalizables de `/`, `/contact-us` y `/services/audit-assistance`
  buscando anillos recortados por un ancestro: solo `yt-facade` (R3) y el `input` de la
  trampa antibots, que lleva `tabindex="-1"` y **está correctamente fuera del teclado**.
- Sombras de reposo que el foco destruye: solo `.block-bar-services` (R4) y
  `.text-field-form` (ya anotada en `site.css`).
- B-5 en la frontera: 991 idéntico al baseline, 992 con `stretch`. El `@media` entra
  donde dice.
- 44 enlaces internos, 0 fuera de 200.
- `site.css` sin `!important` fuera del bloque permitido y con los dos `@layer webflow`
  intactos.
- Dos falsos positivos míos, cazados y descartados: la transición del anillo leída a
  medias (B-1) y los cortes de línea detrás de guion (B-6).
