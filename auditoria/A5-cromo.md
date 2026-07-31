# A5 · Cromo (Nav · Footer · FooterSubscribe · BaseLayout · ui.ts)

Barrido del cromo, transversal a las 54 rutas. Todas las cifras son medidas reales
(`getBoundingClientRect` + `getComputedStyle`) tomadas en la misma sesión de Chrome,
puerto 9235 / perfil `/tmp/ams-perfil-A5`, con los dos servidores vivos y comprobados
antes de cada tanda.

```
SERVIDOR :4321 VIVO   ·   SERVIDOR :4327 VIVO   ·   oraculo /index.html 200
```

**Rutas medidas** (4 tipos + ES): portada, ficha de servicio, post, `/contact-us`, y
sus equivalentes `/es`. **Anchos:** 1440 · 1024 · 992 · 768 · 375 · 320.

---

## Resumen

| | |
|---|---|
| Hallazgos | **3** |
| Falsos positivos descartados con números | 9 |
| Rediseño móvil ratificado | **INTACTO** en las 6 combinaciones probadas |

Los dos hallazgos previos que traía el encargo quedan así:

1. **Las clases `w-dyn-list` / `w-dyn-items` / `w-dyn-item` del desplegable: REFUTADO
   como bug de caja.** Ninguna regla del CSS depende de ellas (las únicas `.w-dyn-*`
   del vendor son `.w-dyn-hide` y `.w-dyn-bind-empty`, `webflow.css:1781` y `:1784`, y
   ninguna de las dos aparece en el marcado). Con el panel abierto a 1440 la caja es
   **idéntica al píxel** en los dos lados. Detalle en «Falsos positivos · FP-1».
   Lo que sí destapó la medida es otra cosa: **el orden de los 12 servicios** (A5-01).
2. **El aplanado de los doce `<ul class="list-footer">` del pie: CONFIRMADO**, y con
   consecuencias mayores de lo previsto — mueve la segunda columna 20 px y cambia el
   alto del pie en los tres anchos, en direcciones distintas (A5-02).

---

### A5-01 · Los 12 servicios del cromo salen en orden alfabético, no en el de producción

- **Ruta:** las 54 (EN y ES) · **Sección:** `.collection-list-submenu` del `<nav>` y
  `.collection-list-footer` del pie · **Viewport:** 1440 y 375 (independiente del ancho)
- **Síntoma:** el desplegable de servicios y la columna «Services» del pie listan los
  doce servicios en orden alfabético inglés en lugar del orden comercial de producción,
  que abre por «Corporate Tax Preparation» y «Personal Tax Preparation».
- **Evidencia:**

  Desplegable del `<nav>`, portada, orden de arriba abajo y de izquierda a derecha:

  | # | baseline (`:4327/index.html`) | port (`:4321/`) |
  |---|---|---|
  | 1 | Corporate Tax Preparation | Audit Assistance |
  | 2 | Personal Tax Preparation | Bilingual Services (English & Spanish) |
  | 3 | Business Incorporation in FL | Business Incorporation in FL |
  | 4 | EIN Application | Corporate Tax Preparation |
  | 5 | ITIN Application (IRS Tax ID) | EIN Application |
  | 6 | Representation Before The IRS | Financial Statement Preparation |
  | 7 | Audit Assistance | ITIN Application (IRS Tax ID) |
  | 8 | Sales Tax Filing | Monthly Bookkeeping & Accounting |
  | 9 | Monthly Bookkeeping & Accounting | Notary Public Services |
  | 10 | Financial Statement Preparation | Personal Tax Preparation |
  | 11 | Notary Public Services | Representation Before The IRS |
  | 12 | Bilingual Services (English & Spanish) | Sales Tax Filing |

  El pie pinta la colección invertida en los dos lados, así que hereda la misma
  permutación (baseline abre por «Bilingual Services», port por «Sales Tax Filing»).

  La medida geométrica lo confirma sin leer texto: con el panel abierto a 1440 los
  anchos de los doce `.link-submenu` son **el mismo multiconjunto** en los dos lados
  pero en distinto índice — misma lista, distinto orden.

  | índice | baseline | port |
  |---|---|---|
  | `.link-submenu[0]` | 179,91 px | 111,78 px |
  | `.link-submenu[1]` | 169,31 px | 247,14 px |
  | `.link-submenu[11]` | 247,14 px | 101,05 px |

  Y el dato duro, leído del dataset con el token del proyecto (solo lectura):

  ```
  *[_type=="service"] | order(order asc, title asc){title, order}   → 12 filas
  order = null en LAS DOCE
  ```

- **Causa raíz:** [`src/lib/sanity.ts:94-96`](../src/lib/sanity.ts) ordena por
  `order(order asc, title asc)`. El campo `order` existe en el esquema
  ([`src/sanity/schemas.mjs:103`](../src/sanity/schemas.mjs)) pero **está vacío en los
  12 documentos**, así que el desempate `title asc` es lo único que ordena. La consulta
  está bien escrita; lo que falta es el dato.
  `tools/restaurar-orden.mjs` reconstruye ese campo desde el HTML de producción y su
  autocomprobación pasa —
  `node tools/restaurar-orden.mjs --check` → *«el modelo de orden reproduce las 6 listas
  de producción»* (desplegable = `order asc`, pie = `order desc`, sidebar de ficha =
  `order desc`, portada = `feature desc, order asc`, blog y sidebar de post = `order
  asc`) — pero **nunca se ha ejecutado con `--write`**.
- **Arreglo propuesto:** ejecutar `node --env-file=.env tools/restaurar-orden.mjs --write`.
  **Es una escritura en Sanity, o sea un arreglo de DATOS: la regla dura de
  `00-contexto.md §5` obliga a parar y preguntar antes de correrlo.** No hay que tocar
  `sanity.ts`. Sin ese paso, ningún cambio de CSS o de plantilla puede arreglarlo.
- **Alcance más allá del cromo:** el mismo `order` vacío gobierna la rejilla de la
  portada, el sidebar de ficha, `/blog-news` y el sidebar de post. Es un arreglo único
  que cierra seis listas; conviene tratarlo en el plan como tal y no seis veces.
- **Archivos a tocar:** `tools/restaurar-orden.mjs` (ejecutar, no editar)
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A5-02 · El pie aplanado: el `<ul>` se come el `padding-left:40px` y el `margin-bottom:10px` que en producción llevaba cada fila

- **Ruta:** las 54 (EN y ES) · **Sección:** `.collection-list-footer` (columna
  «Services» del pie) · **Viewport:** 1440, 1024 y 375 (los tres, de formas distintas)
- **Síntoma:** la segunda columna de servicios del pie está 20 px a la izquierda de
  donde debe; el alto del pie no cuadra con el baseline en ningún ancho, y a 375 la
  lista entera queda 20 px sangrada respecto a la columna de contacto de encima.
- **Evidencia:**

  Producción anida `wrapper > div.collection-list-footer > 12 × div.collection-item-footer
  > ul.list-footer > li`. El port lo aplana a `wrapper > ul.collection-list-footer > 12 × li`
  ([`Footer.astro:179-199`](../src/components/Footer.astro)). El `column-count:2` sobrevive,
  pero el `ul,ol{margin-bottom:10px; padding-left:40px}` de `webflow.css:256` deja de caer
  sobre **cada fila** y pasa a caer sobre **el contenedor multicolumna**.

  | | baseline | port |
  |---|---|---|
  | etiqueta del contenedor | `div.collection-list-footer.w-dyn-items` | `ul.collection-list-footer` |
  | `padding` del contenedor | `0px` | **`0px 0px 0px 40px`** |
  | `margin` del contenedor | `0px` | **`0px 0px 10px`** |

  **A 1440** (contenedor 600 px en `x745`, `column-count:2`):

  | | baseline | port |
  |---|---|---|
  | 1.ª columna, x del enlace | 785 px | 785 px |
  | **2.ª columna, x del enlace** | **1093 px** | **1073 px** (−20) |
  | ancho útil por enlace | 252 px | 272 px |
  | alto de `.collection-list-footer` | 210 px | 264 px (+ 10 de margen ⇒ envoltorio 274) |
  | alto de `.block-footer` (las 3 columnas) | 270 px | 334 px |
  | alto de `.container-footer` | 526 px | 590 px |

  **A 1024** (contenedor 423 px en `x569`) el signo se invierte, porque el port da 20 px
  más de ancho útil por enlace y por eso rompen menos títulos en dos líneas:

  | | baseline | port |
  |---|---|---|
  | **2.ª columna, x del `<li>`** | **829 px** | **809 px** (−20) |
  | ancho del `<li>` | 163 px | 183 px |
  | alto de `.block-footer` | **385 px** | **352 px** (−33) |

  **A 375** (`column-count:1`). Aquí muerde una regla que el port ya no alcanza:
  `@media (max-width:991px){ .list-footer{ padding-left:0 } }`
  ([`accounting-max.webflow.css:2303`](../src/styles/vendor/accounting-max.webflow.css),
  dentro del bloque que abre en la línea 2165). En producción la quitaba a las doce filas;
  el `<ul>` del port no lleva `.list-footer`, así que conserva los 40 px:

  | | baseline | port |
  |---|---|---|
  | x del contenedor de la lista | 63,9 px | 43,9 px |
  | **x del enlace** | **63,9 px** | **83,9 px** (+20) |
  | x de la columna de contacto de encima | 69,7 px | 69,7 px |
  | alto de `.block-footer` de servicios | 480 px | 598 px |
  | alto de `.container-footer` | 1148 px | 1304 px |

  De esos +118 px a 375 (y +64 a 1440), **10 px son este defecto** (el
  `margin-bottom` del `<ul>`) y el resto es el `min-height:44px` de D1, que sí está
  ratificado — ver «Falsos positivos · FP-8».

  Los marcadores no cambian: `list-style-type: disc`, `list-style-position: outside` y
  `display: list-item` en los dos lados. La justificación escrita en
  [`site.css:552-556`](../src/styles/site.css) («la lista del pie no lleva reset de
  sangría ni de viñeta a propósito») es correcta en el *qué* y falla en el *dónde*: la
  sangría tiene que seguir estando, pero en la fila, no en el contenedor.

- **Causa raíz:** [`site.css:557-560`](../src/styles/site.css) neutraliza el
  `margin-block` heredado del `<ul>` solo para `.collection-list-submenu` y
  `.collection-list-blog` — las otras dos listas que pasaron de `<div>` a `<ul>` — y deja
  fuera `.collection-list-footer`, que además es la única de las tres cuyo
  `padding-left:40px` sí es visible (las otras dos lo tapan con su propio `padding:15px`).
- **Arreglo propuesto:** en `site.css`, mover la sangría del contenedor a la fila:
  ```css
  .collection-list-footer { margin-block: 0; padding-left: 0; }
  .collection-item-footer { padding-left: 40px; }
  @media screen and (max-width: 991px) { .collection-item-footer { padding-left: 0; } }
  ```
  Con `box-sizing:border-box` global (`webflow.css:40-44`) el `<li>` sigue midiendo el
  ancho completo de la columna y su contenido cae en 785 / 1093 a 1440, que es
  exactamente el baseline. `.collection-item-footer` solo existe en el pie
  (`Footer.astro:187`), así que el cambio no toca nada más.
- **Archivos a tocar:** `src/styles/site.css` (dueño F0 → entra por `auditoria/COLA-CSS.md`)
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A5-03 · El teléfono y el correo del pie ganan subrayado y cambian de color al pasar de `<div>` a `<a>`

- **Ruta:** las 54 (EN y ES) · **Sección:** `.block-footer` → «Contact Information» ·
  **Viewport:** 1440 y 375
- **Síntoma:** en la columna de contacto del pie, las dos primeras filas salen
  subrayadas y en un gris distinto; las dos de abajo (dirección y horario) no. En
  producción las cuatro son idénticas.
- **Evidencia** (mismos valores medidos a 1440 y a 375):

  | fila | baseline | port |
  |---|---|---|
  | `+1 (754) 244-3993` | `<div>` · `color rgb(36,49,55)` · `text-decoration: none` | `<a>` · **`color rgb(51,51,51)`** · **`underline`** |
  | `info@accountingmaxservices.com` | `<div>` · `rgb(36,49,55)` · `none` | `<a>` · **`rgb(51,51,51)`** · **`underline`** |
  | dirección | `<div>` · `rgb(36,49,55)` · `none` | `<div>` · `rgb(36,49,55)` · `none` |
  | horario | `<div>` · `rgb(36,49,55)` · `none` | `<div>` · `rgb(36,49,55)` · `none` |

- **Causa raíz:** [`Footer.astro:155-158`](../src/components/Footer.astro) convierte las
  dos primeras filas en `tel:` y `mailto:` — cambio funcional deliberado y bien
  argumentado en el propio fichero (`Footer.astro:10-13`), pero al hacerse `<a>` les
  alcanza `a { color: var(--black); text-decoration: underline }`
  ([`accounting-max.webflow.css:112`](../src/styles/vendor/accounting-max.webflow.css)),
  que a un `<div>` nunca le llegaba.
- **Arreglo propuesto:** conservar los enlaces (el cambio funcional no se discute) y
  devolverles el aspecto de producción, acotado a esa columna para no tocar los doce
  enlaces de servicios — que en producción **sí** van subrayados y así se quedan
  (`auditoria-diseno.md §6`, «El subrayado de los enlaces»):
  ```css
  /* Telefono y correo eran <div> en produccion: al hacerlos tel:/mailto: heredan
     el subrayado y el #333 de `a{}`. El selector solo alcanza la columna de
     contacto (su <ul> es .list-footer); la de servicios cuelga de
     .collection-list-footer y conserva el subrayado, que si es de produccion. */
  .list-footer > .list-item-footer > a.link-footer {
    color: var(--bllue);
    text-decoration: none;
  }
  ```
  **Contrapartida a decidir en el triaje:** quitar el subrayado deja el enlace
  distinguible solo por ser táctil. En esta columna no hay texto corrido alrededor y
  ningún hermano es enlace, así que no hay confusión de «enlace vs. texto» dentro de un
  párrafo (SC 1.4.1 habla de color como *única* señal dentro de bloques de texto); aun
  así, la alternativa conservadora es dejarlo como está y anotarlo como desviación
  aceptada. La decisión es de paridad, no técnica.
- **Archivos a tocar:** `src/styles/site.css` (dueño F0 → `auditoria/COLA-CSS.md`)
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

## El rediseño móvil ratificado: comprobado, INTACTO

No se re-audita — se verifica que sigue en pie. Medido a 375×812 en
`/`, `/es`, `/post/tax-planning-strategies` y `/es/services/corporate-tax-preparation`:

| pieza | esperado (`auditoria-diseno.md`) | medido ahora |
|---|---|---|
| M1 · marca sin colgar | 150×64 en flujo | `.brand` **59,2×64**, `position:static`, fondo transparente, `border-radius:0`; `.logo` 48 px |
| M2 · hamburguesa | 48×48, fondo transparente | **48×48**, `background-color: rgba(0,0,0,0)` |
| M3 · aspa | barra central se apaga, ::before gira 45° | `icon` bg `rgba(0,0,0,0)`, `::before` `matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 7)` = **rotate(45°) translateY(7px)** |
| M4 · bloqueo de scroll | `html.nav-abierto{overflow:hidden}` | clase `nav-abierto` puesta, `overflow` computa **`hidden`** |
| M5 · ritmo del cajón | filas 49 px, CTA con aire | Home y120 · Services y169 · About y218 · Blog y267 · **Contact y333** (separador) · CTA y398 h48 |
| M6 · botón de llamada | 79,3×44 | **79,3×44** en EN, **99,3×44** en ES |
| M7 · barra superior sin iconos | `.top-bar .block-social-media` oculto, credenciales a 1 línea | `display:none`; `.text-top-bar` **h20** (era 40) |
| M8 · nivel 2 del cajón | 12 enlaces de 44 px, 1 columna | **12 enlaces, altura mínima 44 px**, `.dropdown-list` a `y169` |
| D3 · enlace de salto | revelado por el primer Tab | `.saltar-al-contenido` presente, 149,5×45, `y −82` en reposo |
| D5 · «Back» sin gris del UA | fondo transparente | `.nav-volver` **`rgba(0,0,0,0)`**, texto `rgb(157,191,67)` |
| D6 · 320 px sin desborde | `scrollWidth === 320` | **320 = 320** en EN y ES; borde derecho de la hamburguesa en **308** |

Sin desbordamiento horizontal a 320, 375 ni 768, en las dos lenguas
(`scrollWidth === innerWidth` en las seis combinaciones).

En escritorio (992 / 1024 / 1440) `.nav-telefono` y `.nav-volver` computan `display:none`
en los tres anchos, y el desplegable sigue siendo el panel de dos columnas de siempre.

## Escritorio ≥992: el cromo es idéntico donde debe serlo

Con el desplegable abierto a 1440, forzando el mismo par de clases (`w--open` en el
disparador y en el panel) en los dos lados:

| | baseline | port |
|---|---|---|
| `.dropdown-list` | `x178,45 y125 · 750×290` | **idéntico** |
| `min-width` / `padding` / `border-radius` | `750px` / `25px` / `0 0 15px 15px` | idénticos |
| `.collection-list-submenu` | `x203,45 y150 · 700×240`, `column-count:2`, `padding:15px` | idénticos |
| `.collection-item-submenu` ×12 | col1 `x218,45`, col2 `x561,45`, `327×35` cada uno | idénticos |
| `.icon-submenu` | `25×25` en `x223,45` / `x566,45` | idénticos |

También coinciden al píxel, a 1440: `.menu` (1440×125), `.top-bar`, `.navbar`,
`.brand` (`x638 y44 · 163,25×150`, blob navy con `border-radius:0 0% 100% 100%`),
`.logo`, los cuatro `.nav-link` (83,45 / 120 / 106,94 / 131,56 / 118,81 de ancho),
`.button.top-menu-click` (`x1127 · 218×45`), la barra superior entera con sus dos
credenciales y sus tres iconos, y todo el bloque de boletín y de promo del pie:
`.wrapper-promo` 1440×650, `.block-pic` 720×650, `.block-promo` `padding:128px 50px`,
`.email-subscribed` 1440×258 `padding:64px 32px`, `.text-field` 336×50 con
`border-radius:5px 0 0 5px`, `.button-news` 164×50, `.icon-news` 100×100,
`.bar-footer` 1440×75 `padding:25px 50px`, `.logo-footer` 185×150.

Las 21 imágenes del cromo responden **200** por HTTP (20 `image/svg+xml` + el PNG de la
promo). Los 16 destinos internos del cromo dan **200 en EN y en ES** (32/32 comprobados):
cero 404.

---

## Falsos positivos descartados (y por qué)

**FP-1 · `w-dyn-list` / `w-dyn-items` / `w-dyn-item` ausentes en el desplegable.**
Están en el HTML **estático** del oráculo (4 `w-dyn-list`, 4 `w-dyn-items`, 56
`w-dyn-item`), o sea que **no** los inyecta `webflow.js` como dice `00-contexto §T3` —
pero da igual: **ninguna regla del CSS del proyecto las usa.** Las únicas `.w-dyn-*`
declaradas son `.w-dyn-hide` (`webflow.css:1781`) y `.w-dyn-bind-empty` (`:1784`), y no
aparecen en el marcado. Con el panel abierto a 1440 la caja del desplegable es idéntica
al píxel en los dos lados (tabla de arriba). **No mueve nada. No es un hallazgo.**

**FP-2 · «El port pierde el `w--current` del `Home`» (a 1440 el enlace sale verde).**
Es un artefacto del oráculo, de la familia T2. El HTML estático del baseline **sí** trae
`class="nav-link w-nav-link w--current"`, pero al servirse en `/index.html` `webflow.js`
recalcula el enlace actual contra `location.pathname`, no encuentra coincidencia con
`href="/"` y **le quita la clase en tiempo de ejecución**: el baseline medido tiene
4 `.nav-link.w-nav-link` planos y el port 3 + 1 con `w--current`. En producción, servido
en `/`, la clase se queda y `.nav-link.w--current{color:var(--green-1)}`
(`accounting-max.webflow.css:216`) pinta el enlace verde igual que el port. **El port es
el correcto.** Mismo caso en `/contact-us` con el `Contact Us` y el CTA
`.button.top-menu-click`: los dos HTML estáticos son byte a byte iguales en clases.

**FP-3 · `img.icon-sociall color: rgb(51,51,51) → rgb(36,49,55)` (6 nodos por página).**
Consecuencia de que los 3 iconos pasen de `<a href="#">` a `<span>` (R3 / D11, ya
ratificado). `color` en un `<img src="*.svg">` no pinta nada: un SVG referenciado por
`<img>` es un documento aislado y no hereda `currentColor`. Las cajas son idénticas
(`20×25` en `x1255/1290/1325` arriba y `x1300/1335/1370` en el pie). **Cero efecto visual.**

**FP-4 · `div.w-form-done` / `div.w-form-fail`: `color` blanco → `rgb(36,49,55)`.**
Es una regla deliberada y documentada con su medida:
[`site.css:615-621`](../src/styles/site.css) — el mensaje heredaba el blanco de
`.email-subscribed` sobre el `#dddddd` del `.w-form-done` de Webflow, o sea **1,3:1**, y
era ilegible. Está acotada con `.email-subscribed`, solo se ve tras enviar el boletín y
corrige un incumplimiento real. **No se reporta como divergencia.**

**FP-5 · `a.nav-link.w-nav-link[0..2]` con `width` divergente a 1440 y a 1024.**
Es el desfase de índice de T3, y es exactamente el ejemplo que trae `00-contexto`:
`83,45 → 106,94 → 131,56 → 118,81` en el baseline contra `106,94 → 131,56 → 118,81` en el
port. Los cuatro anchos existen en los dos lados; lo que cambia es la clave, por el
`w--current` de FP-2.

**FP-6 · «El cromo encoge un 2 % a 1024 y a 992».**
Falsa alarma mía, cazada a tiempo: mi primera consulta medía sin el barrido de scroll que
sí hace `tools/capturas.mjs`, así que el baseline se midió con las interacciones IX2 a
medio animar (`.brand` 160,3 en vez de 163,3; el panel 736,6 en vez de 750 — un factor
uniforme de 0,982). Repetido con `medir`, que sí calienta la página, **las tres piezas
coinciden**. Cualquier medida del oráculo sin ese barrido es sospechosa.

**FP-7 · `img.bg-pic width: 449,109 → 449,125` y `.icon-top-bar 19,84 → 20`.**
Subpíxel (0,016 y 0,16 px). Ruido de redondeo, no diseño.

**FP-8 · El pie crece 64 px a 1440 y 118 px a 375 por el `min-height:44px` de
`.link-footer`.** Está **justificado**: `auditoria-diseno.md` §2 · D1, «Rutas: las 54 ·
Viewport: todos», objetivos táctiles de SC 2.5.5 / 2.5.8. No se re-reporta. Sí queda
constancia de que **la premisa escrita en D1 —«el interlineado de la columna ya deja ese
aire, así que el diseño no se mueve»— no se sostiene al medirla**: el paso entre filas
pasa de **35 px** (25 de `<li>` + 10 del `margin-bottom` de su propio `<ul>`) a **44 px**,
y la caja del pie de **270 → 334** a 1440 y de **480 → 598** a 375. Si el triaje quiere
paridad estricta en escritorio, la palanca es acotar el `min-height` a `≤991px`; es una
decisión de alcance, no un bug, y por eso va aquí y no arriba.

**FP-9 · El `innerText` del pie del port añade «Email address» y «Leave this field
empty».** Son el `<label class="visually-hidden">` del boletín y la trampa anti-bots.
Miden **1×1 px** con `clip-path: inset(50%)` (`site.css:17-27`) y no ocupan sitio. Es un
artefacto de `innerText`, no algo que se vea.

---

## Límites de este barrido

- El desplegable de escritorio del oráculo **no reacciona a un `.click()` sintético**
  (`webflow.js` escucha sus propios eventos de puntero). Para comparar el estado abierto
  se forzó el mismo par de clases `w--open` en los dos lados, que es literalmente lo que
  hace `webflow.js`. El estado con puntero real no se ha probado; sí se comprobó que
  producción abría **con clic y no con hover** (`data-hover="false" data-delay="0"` en
  `.dropdown` del baseline), así que el port coincide en el disparador.
- Los estados `:hover` se han verificado **por regla, no por puntero**: las únicas del
  cromo son `.link-footer:hover{color:var(--green-2)}` (`accounting-max:744`) y
  `.link-submenu:hover{transform:scale(1.05) translate(10px)}` (`:1231`), las dos por
  clase, así que el cambio de etiqueta (`div`→`ul`/`li`, `a`→`span`, `div`→`button`) no
  las afecta. No hay ninguna regla `:hover` para `.nav-link`, `.brand` ni `.social-link`.
- Se han medido 4 tipos de ruta + 2 en ES; **no** las 54 una por una. El cromo es un solo
  componente y las cuatro instancias midieron lo mismo, salvo el `w--current` propio de
  cada ruta, que se comprobó aparte y coincide con el baseline (`/services/*`: 1
  `link-submenu w--current` + 1 `link-footer w--current` en los dos lados).
- **`/privacy-policy` y `/terms` no tienen baseline** y no se han medido: su cromo es el
  mismo componente.
- Nota menor que no llega a hallazgo: `.dropdown-list` pasó de `<nav>` a `<div>`
  ([`Nav.astro:232-236`](../src/components/Nav.astro)) y conserva un `aria-labelledby`
  que, sobre un `<div>` sin rol, la API de accesibilidad ignora. No cambia ni un píxel y
  el patrón *disclosure* del botón (`aria-expanded` + `aria-controls`) ya es correcto, así
  que se deja anotado y no se toca.
