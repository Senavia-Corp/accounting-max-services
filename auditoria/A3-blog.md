# A3 · Blog — `/post/<slug>` ×20 · `/blog-news` ×2

Auditor A3. Chrome propio (`AMS_PUERTO=9233`, perfil `/tmp/ams-perfil-A3`), salidas en
`/tmp/ams/A3-*`. **Ningún fichero del repo modificado**; este informe es la única
escritura.

## Alcance y método

- **Assert de servidores** ejecutado antes de cada tanda: `:4321` y `:4327` respondieron
  200 en las cuatro tandas de medida. Ningún lado salió vacío (T1 descartada).
- **Todas las URLs del oráculo llevan `.html`** (T2).
- Instrumento: `tools/capturas.mjs medir|diff|full`. Como `medir` solo ve elementos
  **con clase** y todo el interior de `.w-richtext` (`<h1>`, `<p>`, `<h2>`, `<li>`) va
  **sin clase**, se completó con una sonda CDP de solo lectura (`/tmp/ams/A3-sonda.mjs`,
  fuera del repo) que mide esos nodos y un inventario de etiquetas sobre el HTML crudo.
- Medido a **1440 y 375** en los dos lados.

**Instancias verificadas (3 posts + el índice), y por qué esas:**

| ruta | por qué |
|---|---|
| `/post/understanding-tax-deductions` | el único con `<ul>` + `<strong>` en el cuerpo |
| `/post/preparing-for-tax-season` | el único con `<ol>` (lista numerada) |
| `/post/tax-credits-explained` | `<ul>` + `<strong>` y cuerpo más corto (h1 hero a 1 línea) |
| `/blog-news` | la retícula de tarjetas |

Además, **inventario de etiquetas del `.w-richtext` de las 10 rutas EN del baseline
contra las 20 del port (EN+ES)** y de la imagen de cabecera de las 10, para saber si lo
medido en 3 se generaliza. Se generaliza: los dos defectos de contenido salen 10/10.

`/es/*` no tiene oráculo (§1 del contexto): se auditó como coherencia contra su
equivalente EN ya medido. Estructura idéntica; las únicas diferencias de caja vienen de
que el texto español es más largo (tarjetas 468 vs 438 px, `.blog-column-left` 982 vs
915 px). Sin desbordes ni elementos invisibles.

---

### A3-01 · El titular que abre el cuerpo del artículo se pinta como párrafo

- **Ruta:** `/post/<slug>` ×10 y `/es/post/<slug>` ×10 · **Sección:** `.blog-column-left > .w-richtext` · **Viewport:** 1440 y 375
- **Síntoma:** el primer bloque del artículo, que en producción es un titular de 38 px en
  negrita, en el port se lee como una línea de texto corrido de 16 px indistinguible del
  párrafo siguiente. Sale en las 20 rutas.
- **Evidencia:** computed del primer hijo de `.w-richtext`, a 1440:

  | post | | baseline | port |
  |---|---|---|---|
  | `understanding-tax-deductions` | etiqueta / `font-size` / `font-weight` / `line-height` / alto | `H1` · 38px · 700 · 44px · **44px** | `P` · 16px · 400 · 25px · **25px** |
  | `tax-credits-explained` | ídem | `H1` · 38px · 700 · 44px · 44px | `P` · 16px · 400 · 25px · 25px |
  | `preparing-for-tax-season` | ídem | `H1` · 38px · 700 · 44px · 44px | `P` · 16px · 400 · 25px · 25px |
  | los 3 | `.w-richtext` alto | 280 / 255 / 280 px | 261 / 236 / 261 px |

  A 375 el mismo bloque pasa de **88 px** (2 líneas de 44) a **25 px**.
  Inventario de etiquetas del `.w-richtext`, **10 rutas EN del baseline** frente a las
  **20 del port**: baseline `{h1:10, p:20, h2:10, ul:3, ol:1, li:10, strong:4}`;
  port por idioma `{p:30, h2:10, ul:3, ol:1, li:10, strong:4}`. **Es exactamente
  `h1 → p`, 10 de 10, y nada más.** Capturas: `/tmp/ams/A3-b-hero2.png` (titular
  «Tax Deductions Explained» a 38 px) vs `/tmp/ams/A3-p-hero2.png` (el mismo texto en
  cuerpo de párrafo).
- **Causa raíz:** **dato**, no CSS. El import corrió antes de que
  [`src/sanity/schemas.mjs:23-29`](../src/sanity/schemas.mjs) declarase el estilo `h1`
  en `blockContent.styles`, así que `htmlToBlocks` no tenía destino y guardó el bloque
  como `normal`. El esquema **ya está corregido**; los documentos de `production` **no
  se han vuelto a importar**. Lo dice el propio comentario de
  [`src/components/PortableText.astro:93-98`](../src/components/PortableText.astro)
  («los 10 posts tienen 0 bloques `h1` y 80 `normal`»).
- **Arreglo propuesto:** la reparación **ya está escrita** en
  [`tools/restaurar-orden.mjs:133-165`](../tools/restaurar-orden.mjs): localiza el bloque
  comparando el TEXTO con el `<h1>` de `baseline/html/post/<slug>.html` y le pone
  `style:"h1"` (también en `bodyEs`). `--check` pasa sin red. Falta ejecutarlo con
  `--write`. **Es escritura en Sanity: regla dura §5 — se para y se pregunta.**
  Residuo que hay que decidir en el mismo movimiento:
  [`PortableText.astro:99-106`](../src/components/PortableText.astro) mapea `h1 → <h2>`
  para no dejar dos `<h1>` por página; `.w-richtext h2` computa **32px/36px**, así que
  tras la reparación el titular quedará en 32 px y no en los **38px/44px** del baseline.
  Hay que elegir: aceptar los 6 px (a favor de la jerarquía de encabezados) o emitir
  `<h1>` para 1:1 estricto.
- **Archivos a tocar:** contenido de Sanity vía `tools/restaurar-orden.mjs` (no editar) ·
  opcionalmente `src/components/PortableText.astro`
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A3-02 · Las 22 rutas del blog muestran la ilustración del promo del pie como portada

- **Ruta:** `/blog-news`, `/es/blog-news`, `/post/<slug>` ×10, `/es/post/<slug>` ×10 · **Sección:** `.picture-blog-page` y `.pic-blog` · **Viewport:** 1440 y 375
- **Síntoma:** los 10 posts tienen 10 fotos distintas en producción; en el port los 10
  heroes **y** las 10 tarjetas del índice muestran **la misma imagen**, que además es la
  del promo del pie (el puño con billetes) — o sea que aparece **dos veces en la misma
  página**, arriba como cabecera del artículo y abajo como fondo del promo.
- **Evidencia:** `currentSrc` medido en el navegador, 1440:

  | | baseline | port |
  |---|---|---|
  | hero `/post/understanding-tax-deductions` | `…6849f1ad9b9fdb792bee1d8b_image11.jpeg` (1300×860) | `…9786cde4a9f57ba8377b3ee43f2ad436f5dcceab-1289x1679.png` (750×977) |
  | hero `/post/tax-credits-explained` | `…1d57_image8.jpeg` (1300×860) | el **mismo** `9786cde4…png` |
  | hero `/post/preparing-for-tax-season` | `…1d85_image3.jpeg` (1300×860) | el **mismo** `9786cde4…png` |
  | heroes distintos en las 10 rutas | **10** | **1** |
  | tarjetas distintas en `/blog-news` | **10** (`image1, image2, image14, image12, image17, image11, image20, image20, image15, image8`) | **1** |
  | `.bg-pic` del promo del pie, misma página | `…6659037c0fab9f0937fe7130_picture.png` | el **mismo** `9786cde4…png` |

  La caja pintada sí coincide (687,5×350 a 1440; 375×350 a 375; 395,3×250 y 311×250 en
  las tarjetas), luego no es un problema de maquetación: es la referencia.
  Capturas: `/tmp/ams/A3-b-idx.png` vs `/tmp/ams/A3-p-idx.png` (las tres primeras
  tarjetas), `/tmp/ams/A3-b-hero.png` vs `/tmp/ams/A3-p-hero.png` (el hero del post).
  La imagen responde 200 y negocia bien el formato (`Accept: image/webp` → `image/webp`,
  78 598 B a 750w), así que **no** es una imagen rota ni un fallo de `auto=format`.
- **Causa raíz:** **dato**. Los 10 documentos `post` de `production` tienen
  `heroImage` apuntando a `image-9786cde4a9f57ba8377b3ee43f2ad436f5dcceab-1289x1679-png`,
  que es el asset del `picture.png` del promo que también usa
  [`src/components/Footer.astro:41,67`](../src/components/Footer.astro). En
  `baseline/import/docs.json` los 10 posts entran con `heroImage: null`, así que la
  referencia se puso después y se puso mal. Las plantillas leen el campo correcto
  ([`post/[slug].astro:70`](../src/pages/post/[slug].astro),
  [`blog-news.astro:34-37`](../src/pages/blog-news.astro)) y la propia
  `blog-news.astro:44-54` **ya avisa por consola** de que las 10 comparten imagen.
- **Arreglo propuesto:** parchear las 10 referencias `post.heroImage`. **Las imágenes ya
  están subidas**: `baseline/import/assets-sanity.json` mapea las 20 jpeg de
  `baseline/assets/` a 13 asset ids de Sanity, todas 1300×860 (p. ej. `…1d8b-image11` →
  `image-05a07d8d54756ed640a698ae6345fd458d530105-1300x860-jpg`). El origen de la verdad
  es el `src` del `<img class="picture-blog-page">` de `baseline/html/post/<slug>.html`,
  el mismo patrón «leer producción → parchear Sanity» que ya usa
  `tools/restaurar-orden.mjs`. **Es escritura en Sanity: regla dura §5 — se para y se
  pregunta.**
- **Archivos a tocar:** contenido de Sanity (script nuevo en `tools/`, no editar plantillas)
- **Severidad:** rompe
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A3-03 · Producción tiene DOS imágenes por post; el esquema solo modela una

- **Ruta:** `/blog-news` (+ `/es/`) frente a `/post/<slug>` ×10 (+ `/es/`) · **Sección:** `.pic-blog` vs `.picture-blog-page` · **Viewport:** 1440 y 375
- **Síntoma:** en producción la miniatura de la tarjeta y el hero del artículo son
  **fotos distintas**. El port tiene un solo campo (`heroImage`) y lo usa en los dos
  sitios, así que aunque se arregle A3-02 **una de las dos superficies seguirá sin
  parecerse a producción**.
- **Evidencia:** fichero de imagen del baseline, tarjeta vs hero, los 10 posts:

  | post | tarjeta en `/blog-news` | hero en `/post/<slug>` |
  |---|---|---|
  | understanding-cryptocurrency-taxes | `…1d82_image1.jpeg` | `…1dce_image8.jpeg` |
  | retirement-planning-and-taxes | `…1d88_image2.jpeg` | `…1d5a_image9.jpeg` |
  | tax-implications-of-investing | `…1d72_image14.jpeg` | `…1d5d_image13.jpeg` |
  | common-tax-mistakes | `…1d63_image12.jpeg` | `…1d91_image14.jpeg` |
  | preparing-for-tax-season | `…1d69_image17.jpeg` | `…1d85_image3.jpeg` |
  | tax-credits-explained | `…1d7f_image11.jpeg` | `…1d57_image8.jpeg` |
  | understanding-sales-tax | `…1d66_image20.jpeg` | `…1d7c_image16.jpeg` |
  | navigating-business-expenses | `…1d6c_image20.jpeg` | `…1d79_image13.jpeg` |
  | tax-planning-strategies | `…1d6f_image15.jpeg` | `…1d8e_image3.jpeg` |
  | understanding-tax-deductions | `…1d60_image8.jpeg` | `…1d8b_image11.jpeg` |

  **10 de 10 difieren.** Port: un único valor en las 20 superficies.
- **Causa raíz:** [`src/sanity/schemas.mjs:130-141`](../src/sanity/schemas.mjs) — el tipo
  `post` declara un solo `imageWithAlt("heroImage", …)`. Lo consumen
  [`blog-news.astro:92-118`](../src/pages/blog-news.astro) y
  [`post/[slug].astro:142-165`](../src/pages/post/[slug].astro).
- **Arreglo propuesto:** añadir un segundo campo (p. ej. `cardImage`) al tipo `post`,
  poblarlo con el `src` del `<img class="pic-blog">` de `baseline/html/blog-news.html`, y
  hacer que `blog-news.astro` (y su espejo `/es/`) lo use con caída a `heroImage` si
  falta. Las 20 imágenes ya están en Sanity (ver A3-02). **Esquema + datos: se para y se
  pregunta** antes de tocar nada.
- **Archivos a tocar:** `src/sanity/schemas.mjs` · `src/pages/blog-news.astro` · `src/pages/es/blog-news.astro` + contenido de Sanity
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A3-04 · Los 10 posts salen en orden alfabético, no en el de producción

- **Ruta:** `/blog-news`, `/es/blog-news` y la lista «Featured Blogs» de las 20 rutas de post · **Sección:** `.collection-list-blog` y `.block-blogs-features` · **Viewport:** 1440 y 375
- **Síntoma:** la retícula del índice y la barra lateral pintan los mismos 10 posts en
  otro orden. La primera tarjeta deja de ser «Understanding Cryptocurrency Taxes» y pasa
  a ser «Common Tax Mistakes to Avoid».
- **Evidencia:** títulos de `.title-blog` en `/blog-news`, en orden de documento:

  | # | baseline | port |
  |---|---|---|
  | 1 | Understanding Cryptocurrency Taxes | Common Tax Mistakes to Avoid |
  | 2 | Retirement Planning and Taxes | Effective Tax Planning Strategies |
  | 3 | Tax Implications of Investing | Navigating Business Expenses |
  | 4 | Common Tax Mistakes to Avoid | Preparing for Tax Season |
  | 5 | Preparing for Tax Season | Retirement Planning and Taxes |
  | 6 | Tax Credits Explained | Tax Credits Explained |
  | 7 | Understanding Sales Tax | Tax Implications of Investing |
  | 8 | Navigating Business Expenses | Understanding Cryptocurrency Taxes |
  | 9 | Effective Tax Planning Strategies | Understanding Sales Tax |
  | 10 | Understanding Tax Deductions | Understanding Tax Deductions |

  El port es exactamente `title asc`. Misma permutación en la barra lateral
  `.block-blogs-features` de los 3 posts medidos (`y` de los 10 `.link-footer`:
  baseline 1007→1322, port 1004→1400). El **conjunto de alturas de tarjeta es idéntico**
  (`{438×5, 468×4, 463×1}` a 375 en los dos lados) y `.collection-list-blog` mide
  **4669 px en ambos**: es una permutación pura, no un cambio de caja.
- **Causa raíz:** [`src/lib/sanity.ts:103`](../src/lib/sanity.ts) ordena
  `order(order asc, title asc)`, y el campo `order` está vacío en los 10 documentos —
  el crawl no trajo el orden de la colección de Webflow (DECISIONS.md **B4**), así que la
  cláusula colapsa a `title asc`.
- **Arreglo propuesto:** el modelo de orden **ya está escrito y verificado** en
  [`tools/restaurar-orden.mjs`](../tools/restaurar-orden.mjs); su
  `--check` (sin red, ejecutado) devuelve `OK blog = order asc` y
  `OK sidebar de post = order asc`, o sea que un único campo `order` reproduce las seis
  listas del sitio. Falta ejecutarlo con `--write` — **el mismo paso que arregla A3-01**.
  **Escritura en Sanity: se para y se pregunta.**
- **Archivos a tocar:** contenido de Sanity vía `tools/restaurar-orden.mjs` (no editar)
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

## Notas — falsos positivos descartados y límites del barrido

**Lo que se comprobó y está BIEN (no se reporta):**

- **Nada quedó invisible al quitar los `style="opacity:0"` de IX2.** `.block-blog` (×10),
  `.blog-column-left`, `.blog-column-right` y `.block-title-blog` computan `opacity:1`,
  `transform:none` y `visibility:visible` en las cuatro medidas (post e índice × 1440 y
  375). El barrido `main *` con `opacity:0 || visibility:hidden` devuelve **lista vacía**
  en el port y en el baseline. En el HTML servido no queda **ni un** `style=` con
  `opacity` (los 9 aciertos de `grep` son reglas del CSS de vendor: `.w-lightbox-*`,
  `.w-file-upload-input`, `.faq-item .plus`) ni ninguna clase `w-dyn-*` en el marcado.
  Detalle de método: en una captura **sin** pase de scroll, el baseline muestra la
  segunda fila de tarjetas en blanco (IX2 aún sin disparar) y el port la muestra pintada.
  Eso es la interacción ausente, no un defecto — y es justo el ruido que el pase de
  scroll de `capturas.mjs` compensa.
- **PortableText, fidelidad estructural 1:1.** Salvo el `h1` de A3-01, el inventario de
  etiquetas del `.w-richtext` coincide exactamente en las 10 rutas EN
  (`p`, `h2`, `ul`, `ol`, `li`, `strong`) y el ES emite la misma estructura. `<ul>`
  computa `padding-left:40px`, `margin-bottom:10px`, `list-style-type:disc` y el `<li>`
  `display:list-item` con `line-height:25px` **en los dos lados**; el primer `<li>` mide
  817,5×25 en ambos.
- **`<em>` y enlaces dentro del cuerpo: no se pudieron comparar aquí.** El corpus del
  blog no tiene ninguno **en ninguno de los dos lados** (0 `<em>` y 0 `<a>` dentro de
  `.w-richtext` en las 10 rutas del baseline y en las 20 del port). Las ramas
  `em`/`link`/`underline`/`code` y las sublistas anidadas de
  `PortableText.astro` quedan **sin ejercitar por esta área**; su verificación
  corresponde a las fichas de servicio (A2), que sí llegan a nivel 2.
- **`/blog-news` a 1440 y 375: paridad de caja exacta.** `.blog` 1440×2327 / 375×5110,
  `.collection-list-blog` `grid-template-columns: 395.328px 395.328px 395.344px`,
  `gap:32px`, tarjetas 395,3×438 en las mismas `x` (95 / 522,3 / 949,7) y las mismas `y`
  (476 / 946 / 1416…) en los dos lados. `.block-info-blog` `padding 16px 16px 32px` y
  fondo `rgb(222,222,222)` idénticos. Botón `.button.mini` 89,2×30, 12 px,
  `rgb(109,162,40)`, `padding 5px 15px`, `text-transform:capitalize` idéntico. **Cero
  desbordamiento horizontal** en las cuatro medidas.
- **`.h1` de la cabecera del post:** 45px / `stix-two-text` / 700 / blanco / 530,5 px de
  ancho, **idéntico** en los dos lados (D9 no muerde en local).
- **`text-transform:capitalize` de los enlaces de «Featured Blogs»** («Common Tax
  Mistakes **To** Avoid»): sale igual en el baseline. No es del port.
- **Cero enlaces internos a 404**: los 23 `href` internos de las cuatro rutas del área
  (EN y ES) responden 200.
- **Ningún `{{PENDIENTE}}`** en las 22 rutas: los 10 `excerpt` llegaron y el resumen bajo
  el `<h1>` coincide literalmente con el del baseline en los 3 posts comprobados.

**Descartados como no-hallazgo:**

1. **`.block-blogs-features` crece 100 px (459 → 559 a 1440) y el paso de la lista pasa
   de 35 a 44 px.** Es el efecto de `.link-footer { display:inline-flex; min-height:44px }`
   ([`site.css:176-180`](../src/styles/site.css)), que es el arreglo **D1 de
   `baseline/auditoria-diseno.md`, ya ratificado**. Aviso para la fase de corrección: la
   nota de D1 («los 14 `.link-footer`… el diseño no se mueve») se midió **en el pie**;
   en una ruta de post hay **24** `.link-footer` (14 del pie + 10 de la barra lateral) y
   ahí el diseño **sí** se mueve: `.blog-column-left/right` 815 → 915 px y el documento
   2959 → 3123 px. Revertirlo devolvería los enlaces a 18 px de alto e incumpliría otra
   vez SC 2.5.8, así que se deja constancia y **no se reporta como bug**.
2. **`SOBRA a.link-footer.w--current[0]`** en el diff. El baseline **sí** trae
   `class="link-footer w--current"` en el HTML, pero `webflow.js` se la quita en tiempo
   de ejecución porque la URL del oráculo es `/post/x.html` y el `href` es `/post/x`.
   Es artefacto de servir el oráculo desde disco (pariente de T2). Además **ninguna regla
   del vendor** aplica a `.link-footer.w--current` (solo hay `.nav-link`,
   `.w-dropdown-link`, `.w-nav-link` y `.w-tab-link`), o sea efecto visual **cero**.
3. **`div.link-footer` 4 → 2 y `div.container-menu` `margin 0 95px → 0`** en el diff del
   post. Son del pie y del cromo (F1), no del área de blog.
4. **`docH` 3961 → 4025 en `/blog-news` a 1440.** `.blog` mide **2327 px en los dos
   lados**: el delta está fuera de mi sección (pie/cromo).
5. **Desplazamiento vertical de 17 px de todo `<main>` a 375** (`.block-title-blog`
   y=125 → y=108). Es la cabecera móvil rediseñada (`.menu` 125 → 108 px), **M1 de
   `auditoria-diseno.md`, ratificado**.
6. **Las ~48 clases `wf-*-active` del `<html>`, `.w-nav-overlay`, `.w-dyn-list` /
   `.w-dyn-items` / `.w-dyn-item`, y los `SOBRA` de `.saltar-al-contenido`,
   `.nav-telefono`, `.nav-volver`, `.collection-item-submenu`, `.visually-hidden`,
   `header.menu`, `footer.footer`, `article`/`aside`.** Todo listado como ruido
   deliberado en §T3 del contexto o consecuencia del rediseño del cromo móvil.
7. **Contraste del resumen bajo el `<h1>`**: blanco 16 px sobre `--green-2 #6da228`
   = **3,07:1**, incumple SC 1.4.3. Es **idéntico en los dos lados** (mismo token,
   mismo tamaño), o sea que **no es divergencia de port**: cae en **R1 de
   `auditoria-diseno.md`**, «NO ARREGLADO — decisión de marca». No se re-reporta.
8. **Hero con `loading="eager"` + `fetchpriority="high"` y con `width`/`height`
   (producción lo servía `loading="lazy"` y sin dimensiones).** Mejora deliberada; la
   caja pintada es **la misma** (687,5×350 a 1440, 375×350 a 375), así que no hay
   divergencia visual.
9. **La imagen del port es un PNG de 1,02 MB.** Falso positivo de método: `curl` sin
   `Accept` no dispara `auto=format`. Con `Accept: image/webp` el CDN devuelve
   `image/webp` de **78 598 B** (hero 750w) y **15 256 B** (tarjeta 400w). El
   `auto=format` funciona.

**Límites de este barrido:**

- Solo 1440 y 375 (el encargo). No se probaron 768/1024, donde
  `.wrapper-content-blog` cambia de dos columnas a una.
- No se comprobaron estados `:hover` reales por puntero: se comparó el **conjunto de
  reglas `:hover`/`:focus` aplicables** a los selectores del área en las hojas cargadas
  de los dos lados — **vacío en ambos**, luego no hay divergencia posible. El anillo de
  `:focus-visible` de `site.css:10` es añadido del port y está justificado en la
  auditoría previa.
- No se pudo comprobar el estado real de `production` en Sanity con una consulta directa;
  las conclusiones de dato de A3-01/02/04 se apoyan en el HTML **servido** por el port
  (que es la salida de esa consulta) y en `baseline/import/docs.json` y
  `assets-sanity.json`. No se ejecutó ningún script de escritura de `tools/`; de
  `restaurar-orden.mjs` solo se corrió `--check`, que no usa red.
