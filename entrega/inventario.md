# Inventario de imagen — accountingmaxservices.com

Barrido de las 54 rutas y de los 63 assets del dataset `ep5i6co1/production`.
Todo lo de aquí está medido contra el dataset real, el HTML construido en `dist/` o el
baseline de producción en `baseline/`. Nada inferido.

**Resumen:** (a), (c), (d) y la mitad de (e) quedan CERRADOS en esta entrega. Ni (b) ni (f)
tenían nada. Lo único que sigue abierto son los 48 alt de las fotos de `service`, que son
fotos reales del cliente y no me corresponde describir.

| # | Dónde | Qué pasa | Evidencia | Propuesta | ¿Imagen o CSS? |
|---|---|---|---|---|---|
| **A1** | los 10 `post` · `heroImage` | Los 10 apuntaban al MISMO asset — y encima al promo del pie, un PNG de 2,37 MB en retrato | ahora `count(array::unique(…)) == 10` | 10 portadas generadas y subidas | **CERRADO** |
| **C1** | `post/[slug].astro` hero | `width`/`height` declaraban 1289×1679 (retrato) para un hueco apaisado → CLS | `heroAttr 1289x1679` · `heroHueco 375x350` | Resuelto con A1: ahora 2752×1536 (1,79). CLS medido = **0** | **CERRADO** |
| **C2** | `Footer.astro:115` · promo del pie | `sizes="50vw"` para un hueco real de **357 px** → el navegador pedía la variante de 1289 px (**162 KB**) en las 54 rutas | medido en navegador: `huecoReal 357x464` · `sirviendo 1289px` | `sizes` fijo de 400 px. Cero CSS, cero píxeles de diferencia | **CERRADO** |
| **D1** | las 54 rutas | Ninguna emitía `og:image`. Compartir en WhatsApp o LinkedIn daba tarjeta sin imagen | `grep -rn "og:image" src/ dist/` → 0 | Cableado en `BaseLayout.astro` | **CERRADO en esta entrega** |
| **E1** | 24 imágenes de `service` | `alt` y `altEs` ausentes | la clave no existe | Fotos reales del cliente → no se redactan. Ver `alt-pendientes.md` | Contenido del cliente |
| **E2** | 10 `post` · `heroImage` | idem | idem | 20/20 escritos con el alt SEO de `blog-image-prompts.mjs` | **CERRADO** |

## a) Assets repetidos

**Un único asset en todo el dataset tiene `refCount > 1`.** Distribución sobre los 63:
`{0: 38, 1: 24, 10: 1}`.

| assetId | fichero | refs | quién |
|---|---|---|---|
| `image-9786cde4…-1289x1679-png` | `6659037c0fab9f0937fe7130-picture.png` | **10** | los 10 posts, en `heroImage.asset` |

Comprobado y **descartado** en el resto, que es lo que pedía el barrido:

- **`review` (20 docs): no tienen campo de imagen.** Su unión de claves es exactamente
  `author, quote, slug, webflowItemId`. No hay nada que repetir.
- **`service` (12 docs): 24 referencias, las 24 distintas.** 12 iconos + 12 fotos, sin
  solape entre los dos conjuntos. **No se tocan** — son fotos reales del cliente.
- **No hay documentos `page` ni `siteSettings`.** `/about-us` y `/contact-us` son `.astro`
  con las imágenes resueltas por `originalFilename`, no documentos de Sanity. No hay
  secciones sueltas donde pueda esconderse una repetición.
- **No hay imágenes dentro de Portable Text.** Los 34 objetos `_type:"image"` del dataset
  están todos en `heroImage` (10), `icon` (12) y `picture` (12). Ninguno en `body`.

### A1 — CERRADO. 10 portadas generadas, subidas y verificadas en Sanity

**Decidido por Sebastian el 28-jul: se generan las 10 portadas.**

- `tools/blog-image-prompts.mjs` — 10 prompts derivados del `title` y el `excerpt` reales
  de Sanity, más el nombre SEO y el `alt` en inglés y español de cada uno. El estilo, la
  paleta, la luz y el encuadre viven en **una constante común**: por eso las diez son una
  serie por construcción, no por suerte.
- `tools/gen-blog-images.mjs` — adaptado de `senavia-corp/tools/gen-subservice-images.mjs`,
  sin `sharp` y sin AVIF. Self-check antes de gastar cuota: 10 prompts con cuerpo, 10 alt
  en los dos idiomas y por debajo de 125 caracteres, nombres de fichero únicos y con forma
  de slug, y las cuatro prohibiciones presentes en los diez prompts.
- `tools/upload-blog-covers.mjs` — sube y engancha. **Dry-run por defecto.**

**SUBIDAS A SANITY el 28-jul** (10 assets distintos, 20/20 alt escritos). Los masters quedan
en `public/blog/`, todas 2752×1536 JPEG (`gemini-3-pro-image` respetó el
16:9 y el 2K), entre 1,6 y 2,3 MB. Muy por encima de los 1500 px que pide el hero a 2x.

Verificado a mano contra las reglas de contenido: sin texto, sin caras ni personas, sin
cifras ni gráficas, sin formularios del IRS, sin logos ni moneda. Y comprobado montándolas
sobre los **dos recortes reales** — el hero a 688×350 sobre la banda `--green-2` y la
tarjeta a 395×250 y a 296×187 — para confirmar que el sujeto sobrevive a ambos.

> **Una salió mal y se regeneró.** `tax-planning-strategies` decía *«one piece held slightly
> above the surface»* y el modelo entendió *held* literalmente: dibujó una **mano**, además
> mal formada — el «efecto IA» que destruye la credibilidad de una firma contable. El prompt
> ahora dice *«floating unsupported… nothing and nobody touches it»* y prohíbe mano, brazo,
> dedos y pinza. Queda anotado en el propio fichero de prompts para que nadie lo revierta.

**Nota sobre la cuota:** al empezar, la cuota diaria del tier gratuito estaba agotada en los
cuatro modelos (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). Se desbloqueó
activando facturación. Dos cosas que conviene no olvidar: la API anuncia `retryDelay: 20s`
aunque la violación sea **diaria**, así que reintentar no sirve — el script lo distingue y
falla rápido; y `imagen-4.0-ultra-generate-001` no es alternativa, responde **404, «no
longer available to new users»**.

### El contexto que hay que conservar

Producción **sí** daba a cada post su propia foto, y esas fotos **ya están en Sanity**.
El `heroImage` compartido es un fallo del import de la FASE 2. `blog-news.astro:52` ya lo
tenía diagnosticado por escrito. `tools/fix-post-heroes.mjs` sigue en el repositorio y su
dry-run pasa: es la alternativa sin coste ni cuota si las portadas generadas no convencen.

| post | foto en producción | asset en Sanity | 200 |
|---|---|---|---|
| understanding-cryptocurrency-taxes | `…1dce_image8.jpeg` | `image-dac3b704…-1300x860-jpg` | ✓ |
| retirement-planning-and-taxes | `…1d5a_image9.jpeg` | `image-2fe6354c…-1300x860-jpg` | ✓ |
| tax-implications-of-investing | `…1d5d_image13.jpeg` | `image-f64adacf…-1300x860-jpg` | ✓ |
| common-tax-mistakes | `…1d91_image14.jpeg` | `image-2f3dfdf1…-1300x860-jpg` | ✓ |
| preparing-for-tax-season | `…1d85_image3.jpeg` | `image-d45641cc…-1300x860-jpg` | ✓ |
| tax-credits-explained | `…1d57_image8.jpeg` | `image-dac3b704…-1300x860-jpg` | ✓ |
| understanding-sales-tax | `…1d7c_image16.jpeg` | `image-5837447f…-1300x860-jpg` | ✓ |
| navigating-business-expenses | `…1d79_image13.jpeg` | `image-f64adacf…-1300x860-jpg` | ✓ |
| tax-planning-strategies | `…1d8e_image3.jpeg` | `image-d45641cc…-1300x860-jpg` | ✓ |
| understanding-tax-deductions | `…1d8b_image11.jpeg` | `image-05a07d8d…-1300x860-jpg` | ✓ |

**10/10 resueltos, 7 assets distintos, los 7 responden 200.** Producción reusaba tres fotos
(image3, image8 e image13 iban a dos posts cada una), así que restaurar daría 10 posts con
7 imágenes; las portadas generadas dan 10 con 10.

**Esta tabla NO está aplicada — es la vuelta atrás.** Las 13 fotos del cliente siguen en
Sanity sin referenciar y `tools/fix-post-heroes.mjs` las reengancha con un comando. No
borrarlas mientras las generadas no lleven tiempo aprobadas.

## b) Huecos sin imagen

**Ninguno.** No hay una sola sección donde el baseline tuviera imagen y el sitio nueva no.

Los 38 assets con `refCount == 0` no son huecos: **23 se consumen por `originalFilename`**
desde `Nav.astro:64`, `Footer.astro:51`, `FooterSubscribe.astro:34`, `JsonLd.astro:88`,
`index.astro:47`, `about-us.astro:60` y las gemelas /es. El `grep` de los 24 nombres que
`src/` referencia resuelve al 100 %, sin un solo nombre colgado.

De los 15 restantes, **13 son las fotos de blog de producción**. Siguen sin referenciar a
propósito: al generar portadas nuevas no se usan, y se conservan como vuelta atrás. Los 2
últimos son `favicon-1.png` (32×32) y `favicon-2.png` (256×256), duplicados de los favicon
que ya se sirven desde `public/` — esos sí son borrables.

Tras subir las portadas el dataset tiene **73 assets**: los 63 de antes más las 10 nuevas.

## c) Imágenes mal dimensionadas

Huecos reales, medidos en el CSS y confirmados en navegador:

| Hueco | CSS | Tamaño real | Se pide a Sanity |
|---|---|---|---|
| Hero del post | `.picture-blog-page` → `width:55%; max-width:750px; height:350px; object-fit:cover` (`accounting-max.webflow.css:2108`) | ~688×350 escritorio (tope 750×350) · 375×350 móvil | `?w=750&q=75&fm=webp` |
| Tarjeta del listado | `.pic-blog` → `width:100%; height:250px; object-fit:cover` (`…:1602`) | 395×250 escritorio | `?w=800&h=506&fit=crop&q=75&fm=webp` |

### C2 — el promo del pie se servía al cuádruple de su hueco

Lo encontró Sebastian mirando una página de blog. `.bg-pic` va a `height:90%` dentro de
`.block-pic`, así que **manda la altura y el ancho sale de la proporción** (1289/1679 =
0,77): son ~357 px en escritorio, y son casi constantes porque no dependen del viewport.
Declararlo como `50vw` (≈640 px a 1280) hacía que el navegador pidiese la variante de
1289 px.

Es el **asset más pesado del dataset** (2,37 MB de origen) y está en **las 54 rutas**:
es el promo del pie, el mismo en todo el sitio, igual que en producción.

| | antes | después |
|---|---|---|
| variante pedida | 1289 px · 162 KB | 800 px · 87 KB (2x) · 500 px · 41 KB (1x) |
| peso de la página, escritorio | 397 KB | **352 KB** |
| hueco renderizado | 357×464 | 357×464 — **idéntico** |

Arreglar el `sizes` no cambia ni un píxel de lo que se ve: solo decide qué candidato del
`srcset` se descarga. No se tocó CSS ni ninguna clase de Webflow.

**El otro defecto era C1**, y es consecuencia de A1: el asset actual es retrato 1289×1679
y esa relación de aspecto es la que se declara en `width`/`height`. Con la foto real
(1300×860, 1,51) los atributos dejan de mentir sobre la forma del hueco.

**Ningún `<img>` del sitio va sin `width` y `height`.** Comprobado en el HTML construido de
las 6 rutas de muestra: **332 imágenes, 0 sin `width`/`height`, 0 sin `alt`, 0 rotas.**
Y `.pic-blog` fija `height:250px`, así que el listado no salta aunque tarde la imagen.

Peso, que es lo que sí duele hoy:

| | ahora | tras A1 |
|---|---|---|
| hero móvil (`w=750&fm=webp`) | **77 KB** | **9,4 KB** |
| tarjeta (`w=800`) | 85 KB | ~10 KB |
| total de la página | 460 KB | ~317 KB |

## d) Open Graph — **cerrado**

Antes: 0 de 54. Tampoco existían `og:title`, `og:type` ni `og:url` — el bloque entero
había que crearlo. `og-default.png` sí existía y `JsonLd.astro:96` ya lo usaba como `image`
del negocio, pero ningún `<head>` lo referenciaba.

Ahora, en `BaseLayout.astro`: `og:type`, `og:url`, `og:title`, `og:description`,
`og:site_name`, `og:locale`, `og:image`, `og:image:width`, `og:image:height`,
`og:image:alt`, `twitter:card` (`summary_large_image`), `twitter:image`,
`twitter:image:alt`. URLs absolutas con el `site` de `astro.config.mjs`.

| rutas | og:image |
|---|---|
| 20 `post/*` + `/es/post/*` | su portada, `?w=1200&h=630&fit=crop&q=80&fm=jpg` |
| 24 `services/*` + `/es/services/*` | su `picture`, mismos parámetros |
| 10 estáticas | `/og-default.png` (ya existía, 23 KB) |

**Verificado sobre el HTML construido:** 54/54 en `og:image`, `og:image:width`,
`og:image:alt`, `twitter:card` y `twitter:image`. Las 14 URLs distintas responden 200 y
miden exactamente 1200×630. La mayor pesa 206 KB.

No se generó ninguna imagen: 44 de las 54 rutas ya tenían una foto real propia. El detalle
de por qué no se rotula el título dentro del PNG está en `src/lib/sanity.ts` (`ogUrl`) y en
`BaseLayout.astro`.

## e) Texto alternativo

**En el HTML no falta ni un `alt`**: 332 imágenes en las 6 rutas de muestra, 0 sin
atributo. Las plantillas ya componen un alt de reserva cuando Sanity no lo trae
(`post/[slug].astro`, `services/[slug].astro:144`), y `/es` nunca cae al inglés
(`es/post/[slug].astro:79`, `es/services/[slug].astro:155` revienta el build si faltan los
dos).

**En Sanity sí falta todo:** 34 imágenes × (`alt` + `altEs`) = **68 valores ausentes**. El
esquema los declara (`schemas.mjs:55`, con `alt` marcado `required()`), pero el import
escribió por la API de mutaciones, que no pasa la validación del Studio.

No se redacta ninguno. Lista completa en **`alt-pendientes.md`**.

## f) Assets a 404

**Ninguno.** Los 24 nombres que `src/` busca por `originalFilename` resuelven todos; los 7
assets de destino de A1 responden 200; las 14 URLs OG responden 200; y en las 6 rutas de
muestra, 0 imágenes rotas y 0 enlaces internos a 404.

---

## Cómo se reproduce

```bash
npm run build
node --env-file=.env tools/fix-post-heroes.mjs      # dry-run: la tabla de A1
```

Con `dist/client` servido en `localhost:3000`, las 6 rutas de muestra dan:
sin desbordes horizontales a 375 px, sin errores de consola, 0 imágenes rotas, 0 enlaces
a 404.
