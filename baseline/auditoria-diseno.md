# Auditoría de diseño — Accounting Max Services

Barrido a **375 · 768 · 1024 · 1440** (y 320 como caso extremo) sobre portada,
`/about-us`, `/contact-us`, `/blog-news`, una ficha de servicio, un post,
`/privacy-policy` y los equivalentes `/es/`.

Todas las cifras son medidas reales del DOM (`getBoundingClientRect`,
`getComputedStyle`, `elementFromPoint`), no impresiones. El «antes» se midió sobre
el despliegue de Vercel; el «después», sobre el `dist/` construido y servido en local.

Los contrastes se calculan con la fórmula de luminancia relativa de WCAG. Umbrales:
**4,5:1** texto normal (SC 1.4.3), **3:1** texto grande y elementos no textuales
(SC 1.4.11). Objetivos táctiles: **24×24** mínimo AA (SC 2.5.8), **44×44** AAA (SC 2.5.5).

---

## Resumen

| | |
|---|---|
| Hallazgos | 21 |
| Arreglados | 15 |
| Reportados sin tocar | 4 |
| Falsos positivos descartados al verificar | 2 |

---

## 1 · El menú en móvil — los 8 del encargo

### M1 · La marca desbordaba la barra y el panel la partía · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

`.brand` renderizaba **190×150** dentro de un `.menu` de **125 px** (`.brand` es
`position:absolute` + `padding:15px 20px 35px` + `.logo{height:100px}`), así que
sobresalía **68,8 px** por debajo de la cabecera. El panel móvil abría en `top:100%`
del `.navbar`, o sea en **y125**, mientras el blob terminaba en **y193,8**: el
logotipo salía cortado por la mitad y se leía «AAAS».

Por debajo de 992 px la marca pasa a `position:static` dentro del flujo, sin el
padding colgante ni el `border-radius` del blob, y `.logo` baja a 48 px.

| | antes | después |
|---|---|---|
| `.brand` a 375 | 190×150, y43,8→193,8 | 150×64, y44→108 |
| Desbordamiento bajo la cabecera | **68,8 px** | **0 px** |
| `.menu` | 125 px | 108 px (44 + 64) |

**A ≥992 px el blob se queda exactamente igual: 190×150 colgando 68,8 px.** Ahí es el
diseño, no el bug.

### M2 · Hamburguesa con el gris por defecto de Webflow · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

`.menu-button` medía **86×81,3** con `background-color: rgb(222,222,222)`
(`--gray`, el valor por defecto de Webflow) sobre la barra navy. Parecía un bloque
sin estilar.

Ahora es un cuadrado de **48×48** con fondo transparente y barras blancas dibujadas
en CSS sobre el `<span class="icon w-icon-nav-menu">` que ya existía (`content:""`
apaga el glifo de la fuente `webflow-icons`).

### M3 · El icono no cambiaba de estado · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

Peor de lo que parecía a simple vista. `webflow.css:1664` aplica
`.w-nav-button.w--open { background-color:#C8C8C8; color:white }`: al abrir, el glifo
pasaba a **blanco sobre #C8C8C8 = 1,67:1**, que incumple SC 1.4.11 (pide 3:1). Y
seguían siendo tres barras — no había aspa. El único indicio de «abierto» era un
icono que casi desaparecía.

Ahora la barra central se desvanece y las otras dos giran a aspa en 200 ms.
Verificado con la clase alternada tres veces seguidas:

| estado | fondo de la barra central | `transform` de `::before` |
|---|---|---|
| cerrado | `rgb(255,255,255)` | `none` |
| abierto | `rgba(0,0,0,0)` | `rotate(45°) translateY(7px)` |

**Contraste del aspa: 1,67:1 → 13,38:1** (blanco sobre `--bllue #243137`).

### M4 · Sin bloqueo de scroll · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

`html` y `body` se quedaban en `overflow:visible` con el panel abierto, y la portada
mide **11 613 px**: la página de detrás se desplazaba bajo el dedo.

`ui.ts` pone `html.nav-abierto` y la regla `html.nav-abierto{overflow:hidden}` vive
**dentro** del `@media (max-width:991px)`, de modo que no puede aplicar en escritorio
aunque la clase se quedara pegada. Verificado con un evento `wheel` real de 600 px:
`scrollY` no se mueve (0 → 0). El cajón sí se desplaza por dentro
(`overflow-y:auto` + `overscroll-behavior:contain`).

### M5 · Ritmo vertical incoherente · **ARREGLADO**

**Ruta:** las 54 · **Viewport:** 375 px

Antes: cuatro filas de 49 px pegadas (y135/184/233/282), un hueco de 10 px, «Contact Us»
en y341, y el CTA en y390 — **a 0 px** del elemento anterior.

Ahora las filas tienen `min-height:48px`, los dos `<nav>` que ya existían en el marcado
quedan separados por una regla fina de 1 px, y el CTA lleva `margin-top:16px`.

| | antes | después |
|---|---|---|
| Home / Services / About / Blog | 49 px, y135–331 | 49 px, y120–316 |
| Contact Us | y341 (hueco de 10 px) | y333 (separador de 17 px) |
| Book A Consultation | y390, **pegado** | y398, **16 px de aire** |

### M6 · Sin teléfono en la cabecera · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** todos

`header a[href^="tel:"]` daba **0** en las 54 rutas. El único `tel:` del sitio estaba
en el pie: en `/about-us` a 375 px de ancho aparecía a **y6672** y medía **122×18**.
En un despacho contable la llamada es la conversión.

Ahora hay un botón `[📞 Call]` de **79,3×44** en la barra, visible solo por debajo de
992 px. El número sale de `NEGOCIO.telefonoHref` — no se reescribe ni se traduce.

- Nombre accesible: `Call Accounting Max Services` / `Llamar a Accounting Max Services`.
  El texto visible está contenido en el nombre (SC 2.5.3).
- Contraste: etiqueta 13,38:1, borde `--green-1` sobre navy 6,35:1.

### M7 · Un tercio de la barra superior en tres iconos mudos · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

`.block-social-media` ocupaba **126,9 de 375 px = 33,8 %** del ancho. Los tres
`.social-link` son `<span>` sin `href` (no existe ninguna URL real; ver **D11**) con
`<img alt="">`: sin nombre accesible y sin destino, o sea cero información. Encima,
`.text-top-bar-social` («Follow us on our social networks:») computaba `display:none`
a 375, así que ni siquiera quedaba la etiqueta que les daba sentido.

El coste lo pagaban las dos credenciales, que sí son información y son la única señal
de confianza del cromo: partían a dos líneas de 75,9 y 78,1 px.

| | antes (375) | después (375) |
|---|---|---|
| «Certified Public Accounting» | 75,9×**40** (2 líneas) | 109,8×**20** (1 línea) |
| «IRS Certified Enrolled Agent» | 78,1×**40** (2 líneas) | 112,9×**20** (1 línea) |
| Iconos sociales | 33,8 % del ancho | ocultos |

En escritorio no cambia nada: los tres siguen visibles. **A 320 px** las credenciales
siguen partiendo a 2 líneas (40 px) — por eso la barra superior se dejó en 44 px y no
en 32: a 32 se cortarían.

### M8 · Doce servicios sin tratamiento móvil · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** ≤991 px

`.dropdown-list.w--open` conservaba `min-width:750px` y `column-count:2` en un
viewport de 375. Los doce `.link-submenu` medían **25 px** de alto (el `<li>`, 35) —
por debajo del 44×44 de SC 2.5.5 y con muy poco margen sobre el 24×24 de SC 2.5.8. Y
el panel abierto llegaba a **y895** con un viewport de 812: los últimos servicios
quedaban fuera de pantalla.

Ahora el desplegable es un **segundo nivel del cajón**: tocar «Services» oculta el
resto del menú y deja el listado completo, con un botón «← Back» que devuelve el foco
al disparador. Ver la justificación del patrón más abajo.

| | antes | después |
|---|---|---|
| Alto de cada enlace | **25 px** | **44 px** (50 si el título parte en dos líneas) |
| Columnas | 2 | 1 |
| `min-width` del panel | 750 px | 0 |
| Panel abierto | y125→**895** (viewport 812) | cabe; y si no, el cajón se desplaza |

---

## 2 · Otros hallazgos del barrido

### D1 · Objetivos táctiles del pie · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** todos. Los 14 `.link-footer` medían **122×18**.
Ahora `min-height:44px` con `inline-flex`. El interlineado de la columna ya dejaba
ese aire, así que el diseño no se mueve.

### D2 · Campo del boletín · **ARREGLADO**

**Rutas:** las 54 · **Viewport:** todos. El `input` del boletín medía **179×25**.
Ahora **311×44**. Aplicado a `.text-field.w-input` y `.text-field-form.w-input`, que
son las dos clases de campo del sitio.

### D3 · No existía ningún enlace de salto · **ARREGLADO**

**Rutas:** las 54. Incumplía SC 2.4.1 (Bypass Blocks): en escritorio el cromo mete el
logo, cinco enlaces, el CTA y los doce del desplegable antes del contenido.

Añadido `<a href="#main" class="saltar-al-contenido">` como primer elemento del
`<body>` en `BaseLayout.astro`, más `id="main"` en los 14 `<main>` de `src/pages/`
(que generan las 54 rutas) y `scroll-margin-top: var(--menu-alto)` para que la
cabecera sticky no tape el destino. Verificado con el teclado: **el primer Tab lo
revela** (127,7×45, anillo de foco blanco 2 px).

### D4 · Gestión de foco del cajón · **ARREGLADO**

Al abrir, el foco no se movía: el cajón es `position:fixed` y tapa la página, así que
el contenido de detrás seguía siendo tabulable a ciegas.

Ahora el foco entra al primer enlace y queda atrapado dentro de `.navbar` mientras el
cajón está abierto. Verificado:

| prueba | resultado |
|---|---|
| Al abrir | foco en «Home» |
| Orden de foco | marca → Home → Services → About → Blog → Contact → CTA → Call → Menu |
| Tab desde el último | vuelve a la marca (`preventDefault` ✓) |
| Shift+Tab desde el primero | va a «Menu» (`preventDefault` ✓) |
| Escape en el nivel 2 | vuelve al nivel 1, foco en «Services», `aria-expanded=false` |
| Escape otra vez | cierra el cajón, foco en la hamburguesa, scroll desbloqueado |
| Redimensionar a 1024 con el cajón abierto | se cierra, `html.nav-abierto` desaparece |

### D5 · Botón «Back» con el gris por defecto del navegador · **ARREGLADO**

Introducido por este mismo rediseño y detectado en la captura: el reset de fondo que
ya existía en `site.css` enumera los `<button>` que sustituyen a controles de Webflow,
y `.nav-volver` es nuevo, así que heredaba `rgb(239,239,239)` del UA. Corregido.

### D6 · Fila de la barra a 320 px · **VERIFICADO, sin problema**

Es el caso más apretado, y en español. Marca 132,8 + teléfono 99,3 + hamburguesa 48
= 280,1, más 12 px de canal a cada lado y 8 px de separación: el borde derecho queda
en **308 de 320**. Sin desbordamiento horizontal (`scrollWidth === 320`).

---

## 3 · Reportado sin tocar

### R1 · `--green-2 #6da228` incumple AA con texto blanco · **NO ARREGLADO — decisión de marca**

Es el verde corporativo. Con texto blanco da **3,07:1**, por debajo del 4,5:1 que pide
SC 1.4.3 para texto normal.

**Dónde muerde:**

| elemento | tamaño | ratio |
|---|---|---|
| Barra superior — las dos credenciales | 10 px | **3,07:1** ✗ |
| `.button.top-menu-click` — «Book A Consultation» de la cabecera | 16 px | **3,07:1** ✗ |
| `.button-news` — envío del boletín | 16 px | **3,07:1** ✗ |
| Promo del pie, cabecera de `/blog-news` | 16 px | **3,07:1** ✗ |

Son **14 usos del token** en las 54 páginas, e incluye el CTA principal del sitio.

**Corrección propuesta:** `--green-2: #56801B` — el mismo tono (86,1° → 84,9°), nueve
puntos más oscuro, da **4,67:1**. Arregla los cuatro de golpe con una línea.

**No aplicada** porque oscurece el verde de marca en las 54 páginas y esa es una
decisión del cliente, no de un rediseño de menú. Alternativa peor y descartada:
oscurecerlo solo en el cromo dejaría el CTA de la cabecera y el del hero con dos
verdes distintos a 400 px de distancia, que se lee como un fallo.

### R2 · `meta description` equivocada en `/services/personal-tax-preparation` · **NO ARREGLADO — contenido del CMS**

La descripción de la página de impuestos **personales** habla de impuestos
**corporativos**:

> «Expert corporate tax filing for LLCs, S-Corps, and C-Corps. Stay compliant, save on
> taxes, and simplify your corporate filings…»

Es dato de Sanity y contenido fiscal. Reescribirlo sería inventar copia de un despacho
contable, así que se reporta. Las otras 25 descripciones y los 26 títulos son únicos y
correctos (verificado ruta por ruta).

### R3 · Iconos sociales sin destino · **NO ARREGLADO a propósito — ver D11**

No existe ninguna URL real en ningún sitio. Se mantienen como imagen sin enlace en
escritorio y se ocultan en móvil (M7). **No se inventa ninguna URL.**

### R4 · Enlaces del desplegable de escritorio a 25 px · **NO ARREGLADO**

Los doce `.link-submenu` miden 25 px de alto en el panel de escritorio. **Cumplen** el
mínimo AA de WCAG 2.2 (SC 2.5.8, 24×24) y solo fallan el AAA de SC 2.5.5 (44×44). Es
un contexto de puntero, el escritorio no tenía ningún bug medido y tocarlo movería la
retícula de dos columnas. Se deja constancia y no se cambia.

---

## 4 · Falsos positivos — comprobados y descartados

Dos cosas que parecían defectos y no lo son. No se «arreglaron» porque no estaban rotas.

### F1 · El blob de marca «solapa» los enlaces a 1024 px

A 1024 la caja de `.brand` (l417→r607) se solapa con la de «Blog & news» (l309,9→r441,5)
en 24,5 px. Suena a bug de clics. **No lo es:** el hit-test con `elementFromPoint` en
el centro y en el 50/80/90/97 % del ancho del enlace devuelve siempre el propio
`<a class="nav-link">`. Los enlaces van después en el DOM y pintan encima. Ningún
control queda bloqueado a 1024 ni a 1440.

### F2 · `/contact-us` y `/privacy-policy` sin ningún `fetchpriority="high"`

Parecía incumplir la regla de «exactamente uno por página». Comprobado en el navegador:
en el primer viewport de `/contact-us` la **única** imagen es el logo (150×100, ya
`loading="eager"`), no hay fondo CSS y no hay hero. El LCP es texto. **Cero es el valor
correcto**; poner `fetchpriority="high"` en el logo sería empeorarlo.

También se verificó y está bien en las 54 rutas: un solo `<h1>`, landmarks
`header`/`main`/`footer` 1/1/1, `rel=canonical`, `noindex` en `/es/` y en las dos
legales, todas las `<img>` con `width`/`height`, todos los campos de
formulario con `<label for>` reales, y la trampa anti-bots correctamente fuera del
teclado (`tabindex="-1"` + `aria-hidden`).

> **Corrección (R2-A, 28-jul).** Aquí se afirmaba «ningún AVIF» y **era falso**. La
> comprobación de entonces se hizo sin la cabecera `Accept` real de Chrome. Los
> helpers `src()` usaban `auto=format`, que **no fija formato**: Sanity negocia por
> `Accept`, y Chrome anuncia `image/avif` primero, así que el CDN devolvía AVIF.
> Medido con `Accept: image/avif,image/webp,…`: **52 de las 94 URL de mapa de bits
> de `dist/` salían `image/avif`**. Los 11 helpers pasan a `fm=webp`, que fuerza el
> formato en el servidor y no depende del navegador; vuelto a medir, **94 de 94
> devuelven `image/webp` y 0 AVIF**. Los SVG no pasan por `src()` (se sirven crudos,
> sin query): con `fm=webp` se habrían rasterizado.

---

## 5 · Por qué un cajón escalonado en dos niveles

Doce enlaces planos en un móvil son una lista, no una navegación. Tres opciones sobre
la mesa:

**Acordeón plano** — «Services» despliega los doce en línea. Es lo más simple, pero no
resuelve nada: sigue siendo la misma lista larga, solo que ahora con filas de 44 px, y
empuja el resto del menú fuera de la pantalla. **Descartado.**

**Agrupar en categorías** — lo más escaneable, pero los títulos de grupo y el reparto
de los doce servicios son una decisión editorial nueva sobre el catálogo del cliente.
En un despacho fiscal eso no es maquetación, es contenido. **Descartado por los
límites del encargo.**

**Escalonado en dos niveles** — elegido. Tocar «Services» sustituye el contenido del
cajón por el listado; «← Back» vuelve. No inventa taxonomía, el listado nunca compite
por espacio con el resto del menú, y es el patrón que usan GOV.UK y iOS, así que no
hay que enseñárselo a nadie.

Detalle que importa: **el disparador «Services» sigue visible en el nivel 2**. Es el
que lleva `aria-expanded` y `aria-controls`, y esconder el control cuyo panel está
abierto rompe el patrón *disclosure*. Sirve además de encabezado del nivel, con el
caret girado 180°.

---

## 6 · Lo que NO se tocó

| | por qué |
|---|---|
| **El blob de marca en escritorio** | A ≥992 px es el diseño: el «gota» navy con el logotipo sobre el hero. Medido antes y después: 190×150 colgando 68,8 px, idéntico. |
| **El verde `--green-2`** | Incumple AA (R1) pero es identidad de marca. Decisión del cliente. |
| **Las URL de redes sociales** | No existe ninguna. Inventar una URL de Facebook de un cliente es fabricar un activo suyo (D11). |
| **La entradilla del FAQ** | En producción es literalmente «This is some text inside of a div block.», el placeholder por defecto de Webflow (D12). No se propaga ni se inventa el texto. |
| **El NAP** | Teléfono, dirección, correo y horario salen de `NEGOCIO`. El botón nuevo usa `NEGOCIO.telefonoHref`; no se reescribe ni se traduce. |
| **Los 20 testimonios** | Son palabras de clientes reales: ni se editan ni se traducen. |
| **La sección de equipo** | No se resucita. Las 6 personas con correos `@example.com` no vuelven ni como marcador. |
| **Las 26 rutas EN** | Idénticas, `sales-tax-filing-7k40q` byte a byte. Las 25 del `urls-vivas.csv` siguen en el sitemap. |
| **El subrayado de los enlaces** | `.link-submenu` y `.link-footer` van subrayados por el `a{text-decoration:underline}` del port. Es preexistente, también en escritorio, y no depender solo del color es a favor de la accesibilidad. |
| **`.text-top-bar` a 10 px** | Hay sitio para una línea al 10 px actual, pero a 12 px vuelve a partir a 375 y se come el margen de 320. Es copia de producción a su tamaño de producción. |

---

## 7 · Verificación

```bash
cd /Users/senavia/site && npm run build
```

| comprobación | resultado |
|---|---|
| Build | limpio |
| Ficheros HTML en `dist` | **54, idénticos** antes y después |
| `sales-tax-filing-7k40q` | presente |
| Sitemap | 26 URLs, **0** con `/es`, `privacy-policy` o `terms`; las 25 de `urls-vivas.csv` están |
| Escritorio 1440 y 1024 | `.menu` 125 px · `.brand` 190×150 colgando 68,8 · `.logo` 100 px · desplegable 750×300 a 2 columnas · hamburguesa, teléfono y «volver» en `display:none` · ningún control bloqueado en el hit-test |
| Móvil 320 / 375 / 768 | sin desbordamiento horizontal; `cajón.top === menu.bottom` en las tres |
| FAQ y carrusel | siguen funcionando tras tocar `ui.ts` (acordeón alterna `aria-expanded`/`hidden`/`data-open`; la flecha del carrusel desplaza 281 px) |
| `prefers-reduced-motion` | la regla de `site.css` ya fuerza `0,01 ms`; el aspa y el caret quedan instantáneos |

**Pendiente de un iPhone real:** el bloqueo de scroll es `overflow:hidden` en `<html>`,
que funciona en iOS 15+. Si en un dispositivo real la página de detrás rebota, hay que
pasar a la variante con `body{position:fixed}` y restauración de `scrollY`. No se ha
implementado por adelantado porque cuesta un reflujo en cada apertura.

**Capturas:** `baseline/diseno/{antes,despues}-{375,1440}-{cerrado,abierto}.png`,
generadas con `node tools/capturas.mjs <fase> <url>`.
