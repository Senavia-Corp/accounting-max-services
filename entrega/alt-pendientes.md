# Texto alternativo pendiente — necesita al cliente

**Solo faltan los de `service`.** Los 20 de las portadas del blog ya están escritos: son
ilustraciones que definimos nosotros, así que su alt se deriva del prompt y no hay nada que
adivinar.

Las fotos de servicio son otra cosa: son **fotos reales del cliente**, y describir mal la
foto de un servicio fiscal es afirmar algo sobre ese servicio. Esas no las redacto — aquí
está la lista para quien pueda responder por ellas.

## Qué falta exactamente

**48 valores**: 24 imágenes de `service` × (`alt` + `altEs`). Los 20 de los 10 `post` ya
están escritos — ver abajo.

Ojo con el matiz, porque cambia cómo se rellenan: las claves **no están vacías, están
ausentes**. Los 34 objetos imagen del dataset tienen exactamente `["_type","asset"]`. En el
Studio los campos aparecerán en blanco; por la API hay que crearlos, no actualizarlos.

El esquema **sí los exige** — `src/sanity/schemas.mjs:55` define `imageWithAlt` con
`alt` marcado `required()`. Nunca se aplicó porque el import escribió por la API de
mutaciones, que no pasa la validación del Studio.

## El sitio no está roto mientras tanto

Las plantillas ya componen un alt de reserva, y en el HTML construido **no falta ni un
`alt`** (332 imágenes comprobadas en 6 rutas, 0 sin atributo). Lo que falta es que el alt
sea *bueno*, no que exista.

| plantilla | qué sirve hoy si Sanity no trae nada |
|---|---|
| `post/[slug].astro` | `Illustration for the article “<título>”` |
| `es/post/[slug].astro:79` | la plantilla i18n `c.post.heroAltFallback`. **Nunca cae al alt inglés** (R5) |
| `services/[slug].astro:144` | mapa `ALT_FOTO` por slug, escrito a mano en la plantilla |
| `es/services/[slug].astro:155` | igual con `altEs`, y **revienta el build** si faltan los dos |
| `blog-news.astro:107` | `alt=""` **a propósito**: la miniatura es redundante con el `<h2>` que va al lado, dentro de la misma tarjeta, y el enlace ya nombra el post. Repetir la descripción diez veces solo añade ruido al lector de pantalla |

Por eso `service.icon` es el único caso que puede quedarse como está: se pinta con
`alt=""` fijo en las dos lenguas porque es decorativo. Sus 24 campos entran igualmente en
la lista de abajo por completitud, pero **no hacen falta**.

## Los 10 posts — `heroImage.alt` / `heroImage.altEs` · YA RESUELTOS

**No hace falta que redactes estos 20.** Las portadas son ilustraciones que hemos definido
nosotros, así que su alt no se adivina mirando el resultado: está escrito en
`tools/blog-image-prompts.mjs`, **junto al prompt que generó cada imagen**, y viaja con
`tools/upload-blog-covers.mjs` en la misma escritura que engancha la portada.

Criterio: cada alt **describe la ilustración Y nombra el tema del artículo**. Solo el tema
sería redundante con el `<h1>` que va justo al lado y ruido para un lector de pantalla;
solo la descripción no aportaría nada a SEO. Todos por debajo de 125 caracteres, que es
donde los lectores de pantalla más comunes cortan.

Alimentan además `og:image:alt` de la tarjeta al compartir, que es el otro sitio donde se
notan.

**Quedan escritos en cuanto ejecutes `tools/upload-blog-covers.mjs --apply`.** Hasta
entonces las plantillas siguen sirviendo su alt de reserva y el sitio no está roto.

## Los 12 servicios — `picture.alt` / `picture.altEs`

Prioridad media. Hoy sale el mapa `ALT_FOTO` de la plantilla, que funciona pero vive en el
código en vez de en el CMS: el cliente no lo puede editar.

| `_id` | slug |
|---|---|
| `service.6785b5fda3f8132ff2b2a924` | corporate-tax-preparation |
| `service.6785b62ad9e67de3023d7ffe` | personal-tax-preparation |
| `service.6785b651297dbfede43de007` | business-incorporation-in-florida |
| `service.6785b675f49ea1df71a030bc` | employer-identification-number-application |
| `service.6785b68d438040df32283237` | itin-application-irs-tax-id |
| `service.6785b6a9a1a91b4448ce47d5` | representation-before-the-irs |
| `service.6785b6be18a274e9bd9e2ccd` | audit-assistance |
| `service.6785b740bd0b2a8d83f16207` | sales-tax-filing-7k40q |
| `service.6785b7688ba793590840ab73` | monthly-bookkeeping-accounting |
| `service.6785b7cf849d22fe47ec5d3b` | financial-statement-preparation |
| `service.6785b7e7d9e67de3023efc36` | notary-public-services |
| `service.6785b80386d5a1463c6c4ce9` | bilingual-services-english-spanish |

## Los 12 servicios — `icon.alt` / `icon.altEs`

**No hacen falta.** Los iconos se pintan con `alt=""` fijo porque son decorativos: el
título del servicio va al lado. Rellenarlos no cambiaría el HTML. Mismos `_id` que arriba.

## Dos avisos para quien los redacte

1. **`altEs` no es la traducción literal de `alt`.** Es la descripción de la misma foto
   escrita en español. Y valen los términos que D3 deja sin traducir: IRS, CPA, Enrolled
   Agent, ITIN, EIN, W-2, 1099, Sales Tax.
2. **`notary-public-services`**: D3 lo deja por escrito — en Florida está tipificado como
   infracción que un *notary public* se anuncie como «notario» en español. No usar esa
   palabra en `altEs`.

## Comprobar cuántos quedan

```bash
node --env-file=.env -e 'import("@sanity/client").then(async({createClient})=>{const c=createClient({projectId:"ep5i6co1",dataset:"production",apiVersion:"2021-06-07",useCdn:false,token:process.env.SANITY_WRITE_TOKEN});console.log(await c.fetch(`{"conAlt":count(*[defined(heroImage.alt)||defined(picture.alt)]),"conAltEs":count(*[defined(heroImage.altEs)||defined(picture.altEs)])}`))})'
```

Hoy devuelve `{ conAlt: 0, conAltEs: 0 }`. Tras subir las portadas debe dar 10 y 10; los
12 restantes de cada uno son los de `service`.
