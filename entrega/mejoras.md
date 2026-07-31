# Mejoras propuestas — una APLICADA, el resto no

Es un port 1:1. Salvo la 0, que pediste expresamente, todo lo de aquí se aparta del
baseline o del alcance del corte y queda propuesto y sin tocar.

---

## 0 · APLICADA — el escudo del logo se comía la esquina de la portada

**Única desviación visual del baseline en toda la entrega. +16 px.** Pedida por Sebastian
el 28-jul tras verlo en pantalla.

`.brand` cuelga 69 px por debajo del `.menu` de 125 px y va centrado al 50 % del viewport;
`.picture-blog-page` empieza al 45 % del contenedor. Ambos anclados al mismo centro, así
que el solape es **constante a cualquier ancho de escritorio**: medido 144×5 px igual a
1600 que a 2000.

**Ya estaba así en producción.** No se notaba porque el escudo caía sobre una **foto** y
su silueta se recortaba sola. Las portadas generadas tienen fondo `#243137`, que es
**exactamente el color de `.brand`** (verificado: los dos son `rgb(36,49,55)`), así que el
escudo se fundía con la imagen y parecía un borrón.

Arreglo, en `site.css`, sin `!important` y sin tocar el vendor:

```css
@media screen and (min-width: 992px) {
  .header-page-blog:has(.picture-blog-page) { padding-top: 5em; }
}
```

- **`:has()` no es adorno:** `.header-page-blog` lo usan **22 rutas, no 20** —
  `/privacy-policy` y `/terms` reaprovechan la cabecera del blog pero no llevan imagen.
  Sin el filtro crecían 16 px sin nada que despejar. Verificado: siguen a `4em`.
- **`min-width:992px` tampoco:** por debajo, `.brand` ya se reubica a la izquierda por el
  rediseño móvil que este mismo fichero documenta, y sobran 218 px de holgura.
- Un navegador sin `:has()` descarta la regla y se queda en el baseline exacto.

Resultado: 11 px de holgura entre escudo e imagen, banda verde de 382 → 398 px en las 20
rutas de post, hero intacto en 688×350, sin desbordes.

**Si prefieres paridad estricta, se borran esas cuatro líneas y vuelve el solape.**

---

## 1 · La tarjeta del listado tenía su propia imagen, distinta del hero

**Hallazgo.** Producción daba **dos** imágenes a cada post: una en la tarjeta de
`/blog-news` y otra, **distinta**, en el hero de `/post/<slug>`. El esquema de Sanity solo
tiene `heroImage`, así que el port fusionó los dos campos en uno y la tarjeta pasará a
mostrar el hero.

La prueba de que el mapeo está completo: el conjunto de tarjetas ∪ el de heroes = **los 13
assets huérfanos exactos** que hay en Sanity. No falta ni sobra ninguno.

| post | tarjeta en producción | hero en producción |
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

**Coste de restaurarlo:** campo `cardImage` en `src/sanity/schemas.mjs`, un `?? heroImage`
en `blog-news.astro` y su gemela /es, y 20 escrituras en Sanity en vez de 10.

**Por qué no se hizo:** decisión tuya del 28-jul. Con un solo campo el listado sigue
saliendo con 7 fotos distintas en vez de 1, que es el 90 % del problema resuelto.

## 2 · Las 13 fotos reales del cliente quedan sin usar

Al generar las 10 portadas, las fotos que producción usaba en el blog dejan de tener
destino: **13 assets, 1,36 MB**, que siguen en Sanity sin referenciar.

No las borres todavía. Son la vuelta atrás: `tools/fix-post-heroes.mjs` sigue en el
repositorio y su dry-run pasa, así que restaurar el estado de producción es un comando.
Mientras las portadas generadas no lleven un tiempo publicadas y aprobadas por el cliente,
esas 13 son la red.

Recordatorio de lo que eran, por si hay que volver: producción daba **dos** imágenes por
post —una en la tarjeta y otra en el hero— y la unión de ambos conjuntos son exactamente
esos 13 assets. El mapeo completo está en la sección 1.

## 2b · Los 10 masters pesan 20 MB en `public/`

`public/` se copia entero a `dist/`, así que hoy el sitio despliega **20 MB de JPEG que
nadie referencia**: las portadas se sirven desde Sanity, no desde `/blog/`.

Mientras se revisan está bien tenerlas ahí. **En cuanto estén subidas a Sanity y aprobadas,
sacarlas de `public/`** — a `assets/` fuera del build, o borrarlas y regenerarlas con el
script si hicieran falta. Los prompts son deterministas salvo por la semilla, así que lo
que hay que conservar de verdad es `tools/blog-image-prompts.mjs`, no los binarios.

## 3 · Peso de las OG

`og:image` se sirve en **JPEG** (`q=80`) y no en PNG. Cambio decidido contigo el 28-jul.

El motivo no es estético: PNG es sin pérdida y Sanity **ignora `q` con `fm=png`** (medido:
402 KB con `q=80`, `q=60` o sin `q`, byte a byte lo mismo). Las tarjetas salían de 402 KB a
1,4 MB, y WhatsApp deja de pintar la miniatura pasados unos 300 KB — el formato acabaría
impidiendo justo lo que `og:image` venía a arreglar. En JPEG son 39–206 KB.

La restricción real se respeta entera: **ni WebP ni AVIF**, que son los que Facebook y
LinkedIn no renderizan. JPEG lo renderizan las cuatro plataformas. `og-default.png` sigue
en PNG, que en un diseño plano comprime mejor (23 KB).

**Para volver a PNG** es una línea, `ogUrl` en `src/lib/sanity.ts`. No lo recomiendo.

## 4 · Assets sin uso en el dataset

Tras subir las portadas quedan **15 sin referenciar**:

- Las **13 fotos de blog** — ver la mejora 2. **No borrar:** son la vuelta atrás.
- `687016debfe3ef2db438a9c2-favicon-1.png` (32×32) y `687016e1a263092297ac6653-favicon-2.png`
  (256×256): duplicados de los favicon que ya se sirven desde `public/`. Estos sí, borrables.

Los otros 23 con `refCount == 0` **no son huérfanos**: se consumen por `originalFilename`
desde `Nav`, `Footer`, `FooterSubscribe`, `JsonLd`, `index` y `about-us`. No borrarlos por
leer mal el `refCount`.

## 5 · SEO que quedó a medias en el import

- **Los 12 servicios no tienen `metaTitle` ni `metaDescription` en inglés** — pero **sí**
  tienen `metaTitleEs` y `metaDescriptionEs`. Está justo al revés de lo que uno esperaría, y
  el efecto es que las 12 rutas EN componen el título desde la plantilla en vez de usar el
  redactado.
- **Los 10 posts no tienen `publishedAt` ni `authorName`** (las claves ni existen). Por eso
  `post/[slug].astro:20` no emite JSON-LD `Article`: `datePublished` y `author` son
  obligatorios de facto y no se pueden inventar (R3). Con esos dos datos, el JSON-LD entra
  solo.

## 6 · Nota factual sobre `sharp`

`og-default.png.ts:14-16` dice que «`sharp` no está en package.json y astro@7 tampoco la
declara». Lo segundo no es exacto: `astro@7.1.4` **sí** la declara, en
`optionalDependencies` (`^0.34.0 || ^0.35.0`), y por eso aparece en `node_modules`.

**La conclusión del comentario no cambia, se refuerza:** una dependencia *opcional* es
precisamente la que puede no instalarse en un runner concreto, que es el motivo exacto para
no construir contra ella. Nada en `src/` la importa y esta entrega no la ha añadido a
`package.json`. Vale la pena corregir la frase para que nadie la use como argumento al
revés.

## 7 · Rendimiento — VOLVER A MEDIR tras subir las portadas

Medido con Lighthouse sobre el build de producción, **antes** de tocar las portadas
(`/post/understanding-cryptocurrency-taxes`):

| | escritorio | móvil |
|---|---|---|
| Performance | 99 | **78** |
| LCP | 0,9 s | **4,1 s** |
| CLS | 0 | 0 |
| A11y / BP / SEO | 96 / 100 / 100 | 96 / 100 / 100 |

El elemento LCP es el hero. Hoy pesa **77 KB** porque deriva de un PNG de 2,37 MB con canal
alfa. Las portadas generadas son JPEG de 1,6–2,3 MB, así que **el master pesa parecido al
actual** y el derivado que sirve Sanity dependerá de cuánto comprima cada ilustración.

**Esto es lo que hay que volver a medir en cuanto se suban**, y es el riesgo real de haber
generado en vez de reparado: las fotos del cliente pesaban 39–177 KB y daban un derivado de
9,4 KB. Si el LCP móvil no baja de 4,1 s, se ha cambiado un problema por otro — que es
exactamente lo que el encargo pedía vigilar.

Los 96 de accesibilidad no los baja ninguna imagen: 332 `<img>` revisadas en 6 rutas, todas
con `alt`, `width` y `height`.

## 8 · Fuera de alcance, pero conviene saberlo

- El aviso de `blog-news.astro:52` **debe desaparecer** del log del build tras la
  reparación. Si sigue saliendo, algo se hizo mal. Es el mejor detector de regresión que
  tiene el proyecto para esto; **no quitarlo**.
- `tools/gen-subservice-images.mjs` de `senavia-corp` **no sirve tal cual** para este
  proyecto: importa `sharp` en la línea 10 y escribe AVIF en la 60. Si algún día hace falta
  generar aquí, hay que quitarle las dos cosas.

## 9 · Un comentario de `public/robots.txt` se ha quedado obsoleto

El bloque que justifica `Disallow: /es/` dice: «hoy no hay ninguna ruta /es/ construida».
**Ya no es cierto** — el build emite **26 rutas `/es`** (4 estáticas + 10 posts + 12
servicios).

Eso activa la tensión que el propio comentario anticipaba: `Disallow` impide el rastreo, y
una URL que no se rastrea **no puede mostrar su `noindex`**. Si alguna `/es/` se enlazara
desde fuera, Google podría listar la URL desnuda sin poder leer el `noindex`.

El riesgo sigue siendo bajo — no están en el sitemap y no hay enlaces externos — y la
decisión de fondo (no rastrear consejo fiscal sin revisar, D3) sigue siendo la correcta.
Pero **la frase induce a error a quien la lea dentro de seis meses**. Corregirla a algo como
«las 26 rutas /es se construyen pero no se anuncian». No he tocado el fichero.
