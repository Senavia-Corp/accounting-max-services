# PLAN · Triaje de la Fase 1 → reparto de la Fase 3

6 auditores · 54 rutas · **20 hallazgos en bruto → 15 tras deduplicar** · 7 falsos
positivos documentados y descartados · **0 justificados** por DECISIONS.md o
auditoria-diseno.md.

---

## El titular: 8 de los 15 no son bugs de código

Se dedujo por separado en cinco informes y converge en lo mismo: **el markup y el CSS
del port están, en lo esencial, bien. Lo que está mal es el DATO en Sanity.**

Eso choca de frente con la regla dura §5 — *«No tocar contenido de Sanity. Si el arreglo
es de datos, para y pregunta»* — así que **8 hallazgos quedan bloqueados esperando tu
decisión** y no entran en la Fase 3.

Solo **7 son arreglos de código**, y se concentran en F0 y F5. **F1 (cromo), F2 (portada)
y F4 (blog) no tienen ni un arreglo de código que hacer.**

---

## BLOQUE A · Bloqueado por la regla §5 — escritura en Sanity

### A-1 · Las 22 rutas del blog muestran la imagen equivocada · **ROMPE** · `A3-02`

Los 10 posts tienen 10 fotos distintas en producción. En el port **los 10 heroes y las 10
tarjetas del índice muestran la misma imagen** — y encima es la del promo del pie, así
que **sale dos veces en la misma página**: arriba como cabecera del artículo, abajo como
fondo del promo.

Los 10 documentos `post` apuntan su `heroImage` al asset del `picture.png` del pie. En
`baseline/import/docs.json` entraron con `heroImage: null`; la referencia se puso después
y se puso mal. Las plantillas leen el campo correcto — `blog-news.astro:44-54` **ya avisa
por consola**. Las 20 fotos buenas ya están subidas (`baseline/import/assets-sanity.json`,
13 asset ids, todas 1300×860). El origen de la verdad es el `src` del
`<img class="picture-blog-page">` de `baseline/html/post/<slug>.html`.

### A-2 · El orden de las 4 listas de servicios y de los 10 posts · **SE NOTA** · `A1-01` `A2-01` `A5-01` `A3-04`

Cuatro informes, **una sola causa**: el campo `order` está a `null` en los 12 documentos
`service` y en los 10 `post` (verificado con GROQ de solo lectura, 12/12 y 10/10), así que
el desempate real es `title asc`. Superficies afectadas: la parrilla de la portada, el
desplegable del `<nav>`, la lista del pie, la barra lateral de cada ficha y `/blog-news`.

**El código ya está preparado** — `sanity.ts` ordena por `order asc, title asc`, el esquema
declara el campo y `tools/restaurar-orden.mjs --check` pasa sin red. Falta el `--write`.
La secuencia canónica se recupera del desplegable del oráculo y está verificada: su
inverso reproduce la lista del pie y de la barra lateral, y `feature desc, order asc`
reproduce la portada. Las tres permutaciones salen exactas.

### A-3 · El orden de los 20 testimonios · **COSMÉTICO** · `A1-02` `A2-04` `A6-02`

Tres informes, una causa: `sanity.ts:110` consulta `review` **sin `order()`**, y el tipo
`review` **no tiene campo de orden**. El carrusel abre por «Sofía M.» donde producción abre
por «Juan T.», y solo se ven ~4 tarjetas de golpe. Requiere **campo de esquema nuevo** además
del dato. El orden real es recuperable del oráculo.

### A-4 · El titular que abre el cuerpo del artículo se pinta como párrafo · **SE NOTA** · `A3-01`

En las 20 rutas de post, el primer bloque —un titular de 38 px/700 en producción— se lee
como texto corrido de 16 px. Es exactamente `h1 → p`, **10 de 10**. El import corrió antes
de que el esquema declarase el estilo `h1`, así que `htmlToBlocks` lo guardó como `normal`.
**El esquema ya está corregido; los documentos no se han vuelto a importar.** La reparación
ya está escrita en `restaurar-orden.mjs:133-165`.

> **Residuo a decidir en el mismo movimiento:** `PortableText.astro:99-106` mapea `h1 → <h2>`
> para no dejar dos `<h1>` por página. `.w-richtext h2` computa 32 px, así que tras reparar
> el dato el titular quedará en **32 px y no en los 38 px** del baseline. O aceptas 6 px de
> diferencia a favor de la jerarquía de encabezados, o se emite `<h1>` para 1:1 estricto.

### A-5 · Producción tiene DOS imágenes por post; el esquema modela una · `A3-03`

La miniatura de la tarjeta y el hero del artículo son **fotos distintas** en los 10 posts.
El port tiene un solo campo y lo usa en ambos sitios: **aunque se arregle A-1, una de las
dos superficies seguirá sin parecerse a producción.** Requiere campo de esquema nuevo.

### A-6 · El cuerpo del servicio pierde los párrafos vacíos · **COSMÉTICO** · `A2-05`

`.body-service` se acorta hasta 186 px respecto al baseline. No es la plantilla ni
`PortableText`: el dato importado ya viene sin ellos. Decisión de contenido.

---

## BLOQUE B · Arreglos de código — listos para la Fase 3

| # | hallazgo | qué | dueño | ficheros | sev |
|---|---|---|---|---|---|
| B-1 | `A2-02` | Anillo de foco **blanco sobre blanco** en el CTA de `.header-page`: al tabular no se ve nada, en las 24 fichas. Anillo de dos tonos. | **F0** | `site.css` | se nota |
| B-2 | `A5-02` | La columna de servicios del pie está **20 px a la izquierda** de producción: el reset de `<ul>` de `site.css:557-560` se comió el `padding-left:40px`. Mover la sangría del contenedor a la fila. | **F0** | `site.css` | se nota |
| B-3 | `A5-03` + `A6-01` | Teléfono y correo del pie **subrayados y repintados a `#333`** al pasar de `<div>` a `<a>`, en las 54 rutas. Conservar los enlaces, recuperar el color y quitar el subrayado. | **F0** | `site.css` | se nota |
| B-4 | `A4-01` | Fotos de Misión y Visión servidas a **500 px reales para una caja que necesita 675**: se pintan **ampliadas un 35 %**. `SIZES_MV` declara el ancho de columna e ignora que la caja es `height:450px` + `object-fit:cover`. | **F5** | `about-us.astro` ×2 | se nota |
| B-5 | `A4-02` | En `/contact-us` ≥992 px la tarjeta gris queda **447 px por encima** del pie de la azul (baseline: 126). Lo causa el bloque de consentimiento FTSA/TCPA, que sí está justificado por D4 — el desnivel no. | **F5** | `contact-us.astro` ×2 | se nota |
| B-6 | `A4-03` | `overflow-wrap: anywhere` parte `{{PENDIENTE` a la mitad en **7 de 7 filas** de la tabla del modelo FTC. `break-word` protege igual sin anular el `min-content`. | **F5** | `privacy-policy.astro`, `terms.astro` | cosmético |
| B-7 | `A2-03` + `A6-03` | Los `clip-path` están **declarados dos veces** y el `<style>` de las plantillas gana por especificidad: el bloque de `site.css` es **inalcanzable**. Hoy no cambia un píxel; es una trampa de cascada. Fuente única. | **F3** | `services/[slug].astro` ×2 | cosmético |

**Reparto real:** F0 → B-1, B-2, B-3 · F5 → B-4, B-5, B-6 · F3 → B-7.
**F1, F2 y F4 no tienen trabajo de código.** No se lanzan agentes para no hacer nada.

### Dos decisiones dentro del Bloque B

- **B-5** es el único arreglo que **no es literalmente el baseline**: `align-self:stretch`
  deja la tarjeta gris en 1006 px donde producción tenía 559. La alternativa es acortar la
  copia legal, y eso no es maquetación. Propongo aplicarlo y dejarlo escrito.
- **B-7** toca ficheros de F3 para borrar CSS que pertenece a F0. Va como una sola tarea de
  F3, con F0 verificando después que el bloque de `site.css` queda alcanzable.

---

## Lo que se comprobó y está BIEN

No es relleno: acota dónde **no** hace falta volver a mirar.

- **Tipografía: 0 divergencias** en las 6 rutas muestreadas. Familia y peso computados
  coinciden con el baseline en `.h1/.h2/.h3/body/.title-cms-services/.title-special/
  .title-blog/.name-customer/<strong>/<em>`. Ningún elemento cae a un fallback.
- **Tokens de color: 9 de 9 idénticos.** Las 8 divergencias de `color` que yo vi en la
  portada eran ruido T3.
- **Escala de espaciado: sin patrón divergente.**
- **Desbordes horizontales: cero** a 375 y 320.
- **Los 15 arreglos de `auditoria-diseno.md` siguen en pie** a 375.
- **`site.css`: sano.** Cero `!important` fuera del bloque `prefers-reduced-motion`; los
  dos `@layer webflow {}` deliberados, intactos.
- **`.features` — la pista 3 del encargo: DESCARTADA, paridad exacta.** «Imágenes enormes
  y texto diminuto» no reproduce a ninguna anchura. Medido en los dos lados.
- **La sección de equipo (D1)** no dejó hueco ni margen doble en `/about-us`.
- **El formulario de `/contact-us` es 1:1** al píxel: campos 372×50, textarea 372×100,
  submit 198×55. La trampa anti-bots, correctamente fuera del teclado.

---

## Nota de proceso · otra sesión editó este repositorio

Entre las **13:25 y las 13:31** —después de que empezara esta sesión (13:11) y **antes**
de que arrancaran los auditores (14:03)— se modificaron `astro.config.mjs`,
`src/lib/sanity.ts`, `src/sanity/schemas.mjs`, `src/components/Footer.astro`, las dos
plantillas de servicio, las dos portadas y `src/styles/site.css`, y se creó
`tools/restaurar-orden.mjs`. **No fue ninguno de mis agentes:** los de exploración no
tienen permiso de escritura y los auditores corrieron una hora después.

El trabajo es coherente y está en el estilo de la casa. Añade el campo `order`, corrige el
esquema `blockContent` y **retira `build: { format: "file" }`** con una explicación
verificada: `@astrojs/vercel` lo pisa con `"directory"` en su hook, así que la paridad de
URL la da `trailingSlash` solo. Eso cierra por sí mismo uno de los puntos que yo llevaba a
MEJORAS.

**No he revertido nada.** Pero la auditoría midió un árbol en movimiento, y la Fase 3 asume
que soy el único que escribe. **Conviene confirmar que esa sesión está cerrada antes de
empezar a corregir.**
