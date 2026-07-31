# MEJORAS · detectado y NO aplicado

Cosas reales, con evidencia, que **no tocan a un port 1:1** o que exigen una decisión que
no es mía. Nada de esto se ha aplicado. Cada entrada dice qué costaría y qué se gana.

---

## 1 · Datos de Sanity — lo que sigue roto

Bloqueado por la regla dura §5 («si el arreglo es de datos: para y pregunta»).

### 1.1 · Las 22 rutas del blog muestran la imagen equivocada · **ROMPE** · `A3-02`

Los 10 posts tienen 10 fotos distintas en producción. En el port **los 10 heroes y las 10
tarjetas del índice muestran la misma imagen**, que además es la del promo del pie: sale
**dos veces en la misma página**. `blog-news.astro:44-54` ya avisa por consola.

> **Para el agente que genera imágenes: aquí NO hay nada que generar.** Las 10 fotos
> existen, son del cliente y ya están subidas a Sanity. Esto es un arreglo de
> referencias, no de contenido. Generar sustitutos pondría imágenes sintéticas en el
> blog de un despacho fiscal en lugar de las suyas.

**Resuelto 10 de 10, 0 sin asset.** Cruzando el `src` del `<img class="picture-blog-page">`
de `baseline/html/post/<slug>.html` con `baseline/assets-descargados.csv` (sha256) y
`baseline/import/assets-sanity.json` (sha256 → asset id):

| slug | `heroImage._ref` que le corresponde | fichero de producción |
|---|---|---|
| `common-tax-mistakes` | `image-2f3dfdf1c8d3018183993d094fb430b2b05bc21d-1300x860-jpg` | `…1d91_image14.jpeg` |
| `navigating-business-expenses` | `image-f64adacf8be18201d8c04b7c7d8e71f31921f983-1300x860-jpg` | `…1d79_image13.jpeg` |
| `preparing-for-tax-season` | `image-d45641cc747a0f33d9306f6e8bd5940bc54ca1fc-1300x860-jpg` | `…1d85_image3.jpeg` |
| `retirement-planning-and-taxes` | `image-2fe6354c6240e065da7c58a576f1e835913a5063-1300x860-jpg` | `…1d5a_image9.jpeg` |
| `tax-credits-explained` | `image-dac3b704c2aef4c5e0baae30885ec1e78a21eb1e-1300x860-jpg` | `…1d57_image8.jpeg` |
| `tax-implications-of-investing` | `image-f64adacf8be18201d8c04b7c7d8e71f31921f983-1300x860-jpg` | `…1d5d_image13.jpeg` |
| `tax-planning-strategies` | `image-d45641cc747a0f33d9306f6e8bd5940bc54ca1fc-1300x860-jpg` | `…1d8e_image3.jpeg` |
| `understanding-cryptocurrency-taxes` | `image-dac3b704c2aef4c5e0baae30885ec1e78a21eb1e-1300x860-jpg` | `…1dce_image8.jpeg` |
| `understanding-sales-tax` | `image-5837447f8412ad9b148381f3aebc233fa0966d0d-1300x860-jpg` | `…1d7c_image16.jpeg` |
| `understanding-tax-deductions` | `image-05a07d8d54756ed640a698ae6345fd458d530105-1300x860-jpg` | `…1d8b_image11.jpeg` |

Tres asset ids se repiten (`f64adacf…`, `d45641cc…`, `dac3b704…`): **no es un error del
mapeo**, es que producción reutiliza la misma foto en dos posts — mismo sha256 bajo dos
ids de Webflow distintos. Se respeta tal cual.

**Coste:** un `patch` de 10 documentos con el patrón que ya usa `restaurar-orden.mjs`.
**Cero generación, cero subida.**

### 1.2 · Producción tiene DOS imágenes por post; el esquema modela una · `A3-03`

La miniatura de la tarjeta y el hero del artículo son fotos **distintas** en los 10 posts.
Con un solo campo `heroImage`, **aunque se arregle 1.1 una de las dos superficies seguirá
sin parecerse a producción**. Requiere campo nuevo en el esquema + dato.

### 1.3 · Los 20 testimonios salen en orden arbitrario · `A1-02` `A2-04` `A6-02`

`sanity.ts:110` consulta `review` **sin `order()`**, y el tipo no tiene campo de orden. El
carrusel abre por «Sofía M.» donde producción abre por «Juan T.», y solo se ven ~4 tarjetas
de golpe. Requiere campo nuevo + dato. El orden real se recupera del oráculo.

### 1.4 · El cuerpo del servicio perdió los párrafos vacíos · `A2-05`

`.body-service` se acorta hasta 186 px. No es la plantilla ni `PortableText`: el dato
importado ya viene sin ellos. Decisión de contenido.

---

## 2 · Decisiones abiertas que alguien tiene que tomar

### 2.1 · El titular del cuerpo del post: 32 px o 38 px · `V1-R2` `V2-04`

Tras la escritura en Sanity del punto 4, el primer bloque del cuerpo vuelve a ser un
titular — pero `PortableText.astro:99-106` mapea `h1 → <h2>` para no dejar dos `<h1>` por
página, así que computa **32 px/36 px** donde el baseline tiene **38 px/44 px**.

- **Aceptar 32 px:** una sola `<h1>` por página, mejor jerarquía de encabezados. 6 px de
  divergencia permanente contra el oráculo.
- **Emitir `<h1>`:** 1:1 exacto, dos `<h1>` por página como en producción.

No la he tomado yo. El comentario de `PortableText.astro` («hoy esta entrada NO se
dispara», «0 bloques h1») **quedó falso** tras la escritura y hay que corregirlo elijas lo
que elijas.

### 2.2 · `D11` y `D12` se citan pero no existen · `V1-R6`

El commit `38e0788` retira la entradilla del FAQ citando **(D12)** y los tres iconos
sociales citando **(D11)**; `auditoria-diseno.md §R3` también remite a D11. **`DECISIONS.md`
no contiene ninguna de las dos.** Como §4 hace vinculante solo lo que esté escrito ahí, la
divergencia se va a **re-reportar en cada barrido futuro** por muy justificada que esté.

Medido: producción tiene dentro de `.block-title-faq` un `<div>` de 25 px con el texto
literal «This is some text inside of a div block.» — el placeholder por defecto de Webflow.
`.block-title-faq` pasa de 80 px a 55 px y `section.faq` de 860 a 835.

**Coste: dos párrafos en `DECISIONS.md`.** No es inventar decisiones: es escribir las que ya
se tomaron y se aplicaron.

---

## 3 · Deuda que no cambia un píxel

### 3.1 · Open Graph · **RESUELTO desde fuera de esta orquestación** (2026-07-28, ~19:40)

Estaba anotado como «solo reportar»: ninguna de las 54 rutas emitía `og:image` ni datos
estructurados, y `/og-default.png` quedaba huérfano.

`BaseLayout.astro` ya emite Open Graph y Twitter Card. Verificado tras el cambio:

| comprobación | resultado |
|---|---|
| rutas con `og:image` | **54 de 54** |
| con imagen propia (foto de servicio o portada de post) | **44** |
| con `/og-default.png` de reserva | **10** |
| formato servido a un scraper (`Accept: */*`) | `image/jpeg` · el PNG por defecto, `image/png` |
| formato con la cabecera de Chrome | `image/jpeg` — **no** negocia |
| build | limpio, 54 HTML |

**El riesgo que había aquí y NO se materializó:** el helper `src()` sirve `fm=webp` desde
la ronda 2, y `og-default.png.ts` documenta que Facebook y LinkedIn **no renderizan WebP**
en las tarjetas. Si `ogUrl()` hubiera reutilizado ese helper, las 44 tarjetas con imagen
propia habrían salido rotas en el sitio donde más se comparten. No lo reutiliza: entrega
JPEG sea cual sea la cabecera. Comprobado, no supuesto.

Queda pendiente `JsonLd.astro`, que **sigue sin importarlo nadie**: los datos
estructurados siguen sin emitirse. `JsonLd.astro:95` ya calcula la URL del OG.

### 3.2 · Cinco de los seis `.ttf` de Campton son bytes muertos

`@font-face` declara Campton en 300/500/600/700/900, pero **el único selector que la usa es
`.button-news`, a peso 300**. Los otros cinco ficheros (~560 KB de los 660 KB) no los pide
ningún navegador nunca. Relacionado con **D2**, que sigue pendiente: la licencia de Campton
es comercial y hay que ponerla a nombre del cliente. Si se recorta a la Light, el problema
de licencia se reduce a una sola cara.

### 3.3 · `dolly-new` está muerto

El kit de Typekit `blq3zch` sirve siete familias; el CSS solo usa `stix-two-text`. Las dos
clases que piden `dolly-new` (`.nav-link.boton`, `.title-link-menu`) no aparecen en ninguno
de los 26 HTML del baseline ni en `src/`. Ya lo dice `DECISIONS.md:125`.

### 3.4 · El marcador `{{PENDIENTE` sigue en dos líneas · `V1-R5`

`B-6` arregló lo importante —ya no parte palabras (0 cortes medidos) y la tabla no
desborda— pero los 7 `mark.pendiente` siguen ocupando 2 líneas. La razón es geométrica:
`min-content` es el vocablo más largo (`{{PENDIENTE:`, 148 px), no la frase entera
(162 px), así que `break-word` no puede dar una sola línea. Cerrarlo del todo exige tocar
el ancho de la columna o el propio texto del marcador — y ese marcador desaparece cuando
un abogado rellene la política (**D4**).

### 3.5 · Cifra caducada en `auditoria-diseno.md` · `V1-R7`

§M1 dice que tras el arreglo `.brand` mide **150×64** a 375 px. Hoy mide **59,2×64**
(`img.logo` 59×48). El arreglo **sí sigue en pie** —`.brand` y44→108, desborde 0—; lo que
está mal es la cifra, anterior al bloque `@layer webflow { img { width:auto } }` de
`site.css`. Vale la pena corregirla: una cifra falsa en un documento vinculante hace dudar
de un arreglo que está bien.

---

## 4 · Nota de proceso · escrituras desde fuera de esta orquestación

Dos veces se modificó este proyecto desde fuera mientras la auditoría corría:

1. **13:25–13:31** — `astro.config.mjs`, `sanity.ts`, `schemas.mjs`, `Footer.astro`, las dos
   plantillas de servicio, las dos portadas y `site.css`; y se creó `tools/restaurar-orden.mjs`.
2. **15:04:09 EDT** — **escritura en el dataset de producción de Sanity**: los 12 `service` y
   los 10 `post` con `order` poblado y `body[0].style = "h1"`. Es exactamente
   `restaurar-orden.mjs --write`, que la regla §5 prohíbe sin permiso. Los 22 documentos
   comparten `_updatedAt = 2026-07-28T19:04:09Z`; los 20 `review` **no** se tocaron, así que
   la escritura fue selectiva.

**No fue esta orquestación**, y está verificado, no supuesto: los 11 transcritos de mis
subagentes contienen `restaurar-orden.mjs --check` (sin red) y lecturas del fuente, **cero
invocaciones con `--write` y cero llamadas de mutación**.

Funcionalmente el resultado es bueno —las cuatro superficies de servicios coinciden ahora
**12/12** con el oráculo y los 10 posts salen en orden canónico—, pero conviene saber que
el dataset de **producción** se escribió sin pasar por el gate, y que `PLAN.md` habla de 8
bloqueados cuando hoy son 6.

---

## 5 · Ya resuelto por esas escrituras, se anota para no re-reportarlo

- **`build: { format: "file" }` retirado de `astro.config.mjs`**, con una explicación
  verificada: `@astrojs/vercel` lo pisa con `"directory"` en su hook `astro:config:setup`,
  así que la paridad de URL la da `trailingSlash: "never"` **solo**, vía la regla
  `^/(.*)/$ → 308` que el adapter escribe en `.vercel/output/config.json`. Yo lo llevaba a
  esta lista como defecto; la explicación es mejor que la mía y el punto queda cerrado.
- **El esquema `blockContent` ya declara el estilo `h1`**, que es lo que faltaba para que
  `htmlToBlocks` tuviera destino al importar.
