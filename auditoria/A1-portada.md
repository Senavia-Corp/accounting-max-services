# A1 · Portada (`/` y `/es`)

Auditor A1. Chrome propio: `AMS_PUERTO=9231`, `AMS_PERFIL=/tmp/ams-perfil-A1`.
Intermedios en `/tmp/ams/A1-*`.

**Assert de servidores ejecutado antes de cada tanda** (T1): `:4321` y `:4327` vivos,
y `:4327/index.html` sirve el oráculo con su CSS y sus fuentes reales — verificado con
`document.fonts.check`: los 8 cortes dan el mismo vector en los dos lados, y `.h1/.h2/.h3`
computan `stix-two-text` a 45/35/25 px en ambos. **No hay oráculo caído en ninguna medida
de este informe.**

Todas las URLs del oráculo llevan `.html` (T2).

---

## Veredicto

**La portada está en paridad.** De las siete secciones del encargo, **cinco son idénticas
al baseline al píxel** en las dos anchuras, y las otras dos divergen solo en el **orden**
de sus elementos, no en su maqueta.

Comparación de caja por sección (`rect` = ancho×alto, medido en los dos lados):

| sección | 1440 baseline | 1440 port | 375 baseline | 375 port |
|---|---|---|---|---|
| `section.header` | 1440×650 | **1440×650** | 375×530 | **375×530** |
| `.wrapper-header` / `.block-header` | 1376×522 / 650×290 | **idem** | 311×434 / 311×370 | **idem** |
| `img.background-header` | 1440×650 `cover` | **idem** | `display:none` | **idem** |
| `section.bar-services` | 1440×332 | **1440×332** | 375×1376 | **375×1376** |
| `.collection-item` ×12 | 301×100 | **301×100** | 311×100 | **311×100** |
| `section.about-us` | 1440×591 | **1440×591** | 375×895 | **375×895** |
| `.w-embed-youtubevideo` | 493×277 | **493×277** | 271×152 | **271×152** |
| `section.reviews` | 1440×642 | **1440×642** | 375×839 | **375×839** |
| `section.features` | 1440×1680 | **1440×1680** | 375×2325 | **375×2325** |
| `section.call-action` | 1440×233 | **1440×233** | 375×515 | **375×515** |
| `section.faq` | 1440×860 | 1440×835 | 375×870 | 375×845 |

El único delta de caja es el de `.faq` (−25 px), y es la entradilla de relleno de Webflow
que `auditoria-diseno.md` §6 decide no migrar (D12). **Justificado, no se reporta.**

Las cuatro esquinas de `.reviews` con `clip-path` están **exactas en los dos lados y en
las dos anchuras** (`polygon(50% 50%, 100% 0px, 0px 0px, 0% 100%)` y su espejo, 100×100 a
1440 y 50×50 a 375, con los cuatro fondos correctos). El `<div class="w-embed"><style>`
que las traía en producción está fuera del port, y lo compensa
[site.css:567-572](../src/styles/site.css) — verificado, no supuesto.

Solo hay **dos hallazgos**, y los dos son de **orden de datos**, no de CSS.

---

### A1-01 · Los 12 servicios de `.bar-services` salen en orden alfabético, no en el de producción

- **Ruta:** `/` y `/es` · **Sección:** `.bar-services` · **Viewport:** 1440 y 375 (idéntico en ambos)
- **Síntoma:** la parrilla de servicios de la portada arranca por «Business Incorporation in FL»
  cuando producción arranca por «Corporate Tax Preparation»; los 12 están permutados, y en
  `/es` el orden es alfabético **por el título inglés**, así que en la página española se lee
  como aleatorio.
- **Evidencia:** mismo conjunto de 12 (`sorted(baseline) == sorted(port)` → `True`) y
  **mismo número exacto de caracteres de texto visible en la sección: 316 en los dos lados.**
  Es una permutación pura, no una pérdida de contenido.

  | pos | baseline (oráculo) | port |
  |---|---|---|
  | 1 | Corporate Tax Preparation | **Business Incorporation in FL** |
  | 2 | Personal Tax Preparation | **Corporate Tax Preparation** |
  | 3 | Business Incorporation in FL | **Monthly Bookkeeping & Accounting** |
  | 4 | Representation Before The IRS | **Personal Tax Preparation** |
  | 5 | Monthly Bookkeeping & Accounting | **Representation Before The IRS** |
  | 6 | EIN Application | **Audit Assistance** |
  | 7 | ITIN Application (IRS Tax ID) | **Bilingual Services (English & Spanish)** |
  | 8 | Audit Assistance | **EIN Application** |
  | 9 | Sales Tax Filing | **Financial Statement Preparation** |
  | 10 | Financial Statement Preparation | **ITIN Application (IRS Tax ID)** |
  | 11 | Notary Public Services | Notary Public Services |
  | 12 | Bilingual Services (English & Spanish) | **Sales Tax Filing** |

  El mismo desfase lo canta el instrumento como anchos cruzados, reproducible en las dos
  medidas y en las dos anchuras:

  | | baseline | port |
  |---|---|---|
  | `.block-title-services[8]` width | 174.047px | 250.5px |
  | `.block-title-services[11]` width | 250.5px | 174.047px |
  | `.title-bar-services[8]` width | 109.047px | 185.5px |

  **No es T3.** El desfase de índice de T3 desplaza una secuencia entera en un puesto; aquí
  los valores se **intercambian por pares** (1↔3, 5↔7, 8↔11) y la lista tiene el mismo
  número de nodos en los dos lados (12/12).

  El grupo `feature` **sí es correcto** (los mismos 5 destacados en los puestos 1-5). Lo que
  falla es el orden **dentro** de cada grupo: en el port es estrictamente alfabético en los
  dos grupos (Business < Corporate < Monthly < Personal < Representation, y Audit < Bilingual
  < EIN < Financial < ITIN < Notary < Sales).
- **Causa raíz:** [src/lib/sanity.ts:95](../src/lib/sanity.ts) ordena por
  `order(order asc, title asc)` y **el campo `order` no está aplicado en el dataset**: los 12
  empatan en `order`, así que decide el desempate `title asc`. Sobre eso,
  [src/pages/index.astro:97](../src/pages/index.astro) aplica un `sort` estable por
  `feature desc`, que conserva el alfabético de dentro.
  El comentario de [index.astro:88-92](../src/pages/index.astro) afirma que «la permutación
  completa sale idéntica» — **esa afirmación ya no se sostiene** y conviene corregirla al
  arreglar esto.
  El modelo de orden correcto **existe y está verificado**: `node tools/restaurar-orden.mjs --check`
  (modo sin red y sin escritura) responde `OK portada = feature desc, order asc` y
  `el modelo de orden reproduce las 6 listas de produccion`.
- **Arreglo propuesto:** **es un arreglo de DATOS, no de código — hay que parar y preguntar**
  (regla §5: «Si el arreglo es de datos: para y pregunta»). La acción concreta es poblar
  `order` en Sanity con `node --env-file=.env tools/restaurar-orden.mjs --write`, que es
  idempotente y no toca ningún otro campo. La consulta y el `sort` de la portada **ya están
  bien** y no hay que cambiarlos: en cuanto `order` exista, el orden de producción sale solo.
  Afecta además al desplegable del `<nav>`, al pie y a las fichas de servicio, así que
  conviene resolverlo una sola vez y que F1 y F3 lo verifiquen después.
- **Archivos a tocar:** ninguno de código para el arreglo (es dato). Si se decide dejar
  constancia, solo el comentario de `src/pages/index.astro:88-92`. **`src/lib/sanity.ts` es
  de F0**, no de F2.
- **Severidad:** se nota
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no

---

### A1-02 · Los 20 testimonios salen en un orden arbitrario, no en el de producción

- **Ruta:** `/` y `/es` · **Sección:** `.reviews` · **Viewport:** 1440 y 375 (idéntico en ambos)
- **Síntoma:** el carrusel abre por «Sofía M.» donde producción abre por «Juan T.». Como solo
  se ven ~4 tarjetas de golpe, el primer pantallazo de prueba social no es el del sitio real.
- **Evidencia:** mismo conjunto de 20 autores y de 20 citas
  (`sorted(baseline) == sorted(port)` → `True` en los dos), y **mismo número exacto de
  caracteres de texto visible en la sección: 3046 en los dos lados.** Permutación pura.

  | pos | baseline | port |
  |---|---|---|
  | 1 | Juan T. | **Sofía M.** |
  | 2 | Andrea K. | **Carlos R.** |
  | 3 | Andrés V. | **Michael G.** |
  | 4 | Javier L. | **Laura P.** |
  | … | … | … |
  | 20 | Michael G. | **Juan T.** |

  Confirmado también por el instrumento, reproducible en las dos anchuras:

  | | baseline | port |
  |---|---|---|
  | `p.paragraph[7]` height (1440) | 75px | 50px |
  | `p.paragraph[12]` height (1440) | 50px | 75px |
  | `.name-customer[5]` width | 74.6562px | 84.5156px |
  | `.name-customer[9]` width | 84.5156px | 74.6562px |

  La **maqueta** del carrusel, en cambio, es exacta: `.splide-slide` 313×320 a 1440 y
  281×320 a 375, `.splide-track` 1250×320 / 281×320, `.block-review` 293×300 / 271×300,
  `.block-button-slider` 247×90 — **los mismos números en los dos lados**. 20/20 diapositivas.
- **Causa raíz:** [src/lib/sanity.ts:110-111](../src/lib/sanity.ts) —
  `*[_type == "review"]{ _id, author, quote }` **no lleva ninguna cláusula `order()`**, así
  que GROQ devuelve el orden interno por `_id`. Es estable entre builds, pero es arbitrario y
  no es el de producción. A diferencia de los servicios, el tipo `review` **no tiene campo
  `order`** (`Testimonio = { _id, author, quote }`, sanity.ts:87) y
  `tools/restaurar-orden.mjs` no cubre `review`.
- **Arreglo propuesto:** **parar y preguntar** — reproducir el orden exige añadir un campo al
  esquema `review` y escribir dato, que es exactamente lo que la regla §5 prohíbe hacer por
  cuenta propia. El orden real es recuperable del oráculo
  (`baseline/html/index.html`, los 20 `.name-customer` en orden de DOM), así que la decisión
  es solo si merece la pena; el mecanismo es el mismo que ya usa `restaurar-orden.mjs` para
  servicios y posts. **No se toca nada mientras tanto.**
- **Archivos a tocar:** ninguno sin decisión previa. Si se aprueba, `src/lib/sanity.ts` (F0)
  + esquema y dato de Sanity. **Nada de `src/pages/index.astro`.**
- **Severidad:** cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no. D5 cubre el *marcado estructurado*
  de las reseñas (prohíbe `Review`/`aggregateRating`, y el port lo cumple: **cero JSON-LD en
  la portada**), pero no dice nada del orden.

---

## Notas · falsos positivos descartados y límites del barrido

Lo que sigue **parecía** un hallazgo y no lo es. Cada uno se comprobó, no se supuso.

### FP1 · `.features` — «imágenes enormes y texto diminuto». **DESCARTADO: paridad exacta.**

Es el foco especial del encargo, así que va con todos los números de los dos lados.

A **375** el port y el baseline son **idénticos hasta el decimal**, sin una sola divergencia:

| | baseline | port |
|---|---|---|
| `section.features` | 375×2324.89 | 375×2324.89 |
| `.div-block-4` (bloques 1 y 3) | 311×600.438 / 311×586.016, `grid`, `311px`, gap 32 | idem |
| `.div-block-4.rotate` | 311×600.438, `flex`, gap 32 | idem |
| `.image-2` ×3 | 311×193.438 / 311×193.438 / 311×204.016 | idem |

A **1440**, tras repetir la medida (ver FP2), **tampoco hay ninguna divergencia**:

| | baseline | port |
|---|---|---|
| `section.features` | 1440×1679.67 | 1440×1679.67 |
| `.div-block-4` | `grid`, `593px 593px`, gap 64 | idem |
| `.image-2` ×3 | 593×368.969 ×2, 593×388.734 | idem |
| celda de imagen (el `<div>` **sin clase**) | 593×369 | 593×369 |
| celda de texto (el `<div>` **sin clase**) | 593×195 | 593×195 |
| `h3.h3` | 25px `stix-two-text` 700 | idem |
| cuerpo del bloque | 16px / `line-height` 25px, Ubuntu 400, `rgb(36,49,55)`, caja 593×150 | idem |

Las celdas sin clase, que `medir` no ve, se sacaron con `getComputedStyle` directo por CDP
sobre `.div-block-4 > div` — que era justo lo que pedía el encargo.

Sobre las dos pistas concretas del encargo:

- **`.image-2 { width: 1005px }`** (`accounting-max.webflow.css:574`) **no se aplica en
  ninguno de los dos lados**: el `max-width:100%` de Webflow lo recorta a los 593 px de la
  celda. Computed `width: 593px` en baseline **y** en port.
- **`site.css:103-108` (`img{width:auto;height:auto}` dentro de `layer(webflow)`)** hace
  exactamente lo que dice su comentario y **no rompe nada**: neutraliza los atributos
  `width`/`height` que el port añade desde Sanity, y pierde por especificidad contra
  `.image-2`. Resultado medido: el port pinta 593×368.969 con `attr width=1600 height=996`,
  y el baseline pinta 593×368.969 **sin atributos**. Misma caja.
- Los tres pares de imágenes sirven además el **mismo candidato intrínseco** en los dos
  lados (`naturalWidth×naturalHeight` = 940×584, 940×584 y 940×616), así que ni siquiera hay
  diferencia de nitidez.

**Conclusión: `.features` no está roto en el port.** La proporción imagen/texto (una imagen
de 369 px de alto junto a una celda de texto de 195 px, con cuerpo a 16 px en una columna de
593 px) es **el diseño de producción**, medido en el oráculo. Cambiarla sería rediseñar, que
es lo que la regla §5 prohíbe; si se quiere tocar, va a `MEJORAS.md` como propuesta, no aquí.

### FP2 · `.features` con la imagen central a **altura 0** en el baseline. **DESCARTADO: fallo de carga puntual del oráculo.**

La primera medida del baseline a 1440 dio `img.image-2[1]` a **593×0**, y con ella
`.div-block-4.rotate` a 195 px y `section.features` 174 px más corta que el port. Leído a la
ligera, «al port le sobran 174 px en features».

Comprobado antes de reportarlo, como manda §7:

1. Los cuatro candidatos del `srcset` de esa imagen responden **200** por HTTP
   (`curl -sI` sobre `66591fc962e8774f9117068b_3{,-p-500,-p-800,-p-1080}.png`).
2. La **misma** imagen medía 311×193.438 en el baseline a 375, o sea que carga bien.
3. **Al repetir la medida del baseline a 1440 salió 593×368.969**, idéntica al port, y las
   tres líneas de `features` desaparecieron del diff.

Era una imagen `loading="lazy"` que no terminó de cargar en esa sesión de Chrome. **Un lado
del baseline vacío es T1, no un bug.** Todo este informe usa la medida repetida
(`A1-b-home-1440-r2.json`).

### FP3 · `margin: 0px 63px -> 0px` en el contenedor de `.about-us`, y `0px 95px -> 0px` en `.container-menu`. **DESCARTADO: no reproducible.**

Aparecía en la primera medida con el `rect` **idéntico en los dos lados** (1250×335 @95),
que ya era sospechoso: un margen que cambia sin mover la caja. Se comprobó de dos maneras:

- `getComputedStyle` directo por CDP sobre los dos servidores: **`0px 63px` y `0px 95px` en
  los dos lados**, mismo `width`, mismo `max-width`, mismo padre.
- Al repetir la medida del port (`A1-p-home-1440-r2.json`), **las dos líneas desaparecen del
  diff**.

Es Chrome devolviendo `0px` para un `margin:auto` sobre un layout aún sin asentar. Falso
positivo del instrumento, no del port.

### FP4 · `.faq-item` 747 px en el baseline contra 750 px en el port. **DESCARTADO: transform de IX2 a medio animar.**

`rect` 747×80 y 745×79 en el baseline contra 750×80 en el port (y 310 contra 311 a 375). Pero
el **computed** `width` es **`750px` en los dos lados**, y el `diff` no marca la propiedad.
La razón está escrita en el propio `capturas.mjs:57-60`: el baseline ejecuta IX2 y el `rect`
recoge escalas en curso (aquí ≈0.996). **Se mide el computed, no el rect.**

### FP5 · Las 254 divergencias del diff a 1440. **La inmensa mayoría es ruido ya catalogado en §T3.**

Del reparto reproducible, en mis secciones **solo sobreviven dos familias**, que son A1-01 y
A1-02. Todo lo demás es una de estas cuatro cosas:

- `<div>` → `<button>` (FAQ ×5, flechas del carrusel ×2) y `<div role=list>` → `<ul>` — ruido
  deliberado de §T3.
- Rediseño ratificado del cromo móvil: `.nav-telefono`, `.nav-volver`, `.saltar-al-contenido`,
  `.visually-hidden` (M1/M2/M6/M8) y objetivos táctiles del pie a 44 px (D1).
- Las ~48 clases `wf-*-active` que `webfont.js` inyecta en producción, `w-nav-overlay`,
  `swiper-*` y `w-dyn-*` — los pone `webflow.js`/Swiper, que no existen en el port.
- La entradilla de relleno del FAQ (D12).

El **inventario de clases sobre el HTML crudo** lo confirma y es notablemente limpio: solo
falta `w-embed` ×2 (los dos `<style>` embebidos, ya compensados en `site.css:567-572` y
`site.css:625-630` — verificado midiendo `clip-path` en los dos lados) y solo sobran
`nav-telefono`, `nav-telefono-icono`, `nav-volver`, `nav-volver-flecha`,
`saltar-al-contenido`, `visually-hidden` ×2, `yt-facade` y `yt-play`, **todas ratificadas**.

### FP6 · `.faq-answer` `display:block; height:0` en el baseline contra `display:none` en el port. **DESCARTADO: mismo estado cerrado.**

Dos mecanismos distintos para lo mismo. Comprobado que el acordeón funciona **sin
webflow.js**: los 5 disparadores son `<button aria-expanded="false">` con el panel a
`display:none`; al pulsar, `aria-expanded="true"`, `data-open="true"` y el panel abre a 80 px
(1440) / 180 px (375) / 205 px (`/es`, 375); al volver a pulsar, cierra a 0. Y las **5
respuestas son idénticas carácter a carácter** a las del oráculo.

### FP7 · Foco «sin anillo» en los controles nuevos. **DESCARTADO.**

`el.focus()` mediante CDP no dispara la heurística de `:focus-visible`, así que la sonda daba
`outline:none` en los dos lados. La regla existe y es global:
[site.css:10-13](../src/styles/site.css), `:where(a, button, input, textarea, select, [tabindex]):focus-visible { outline: 2px solid currentColor; outline-offset: 2px }`.
En producción **no hay ninguna regla de foco** (0 coincidencias de `focus` en el CSS servido):
el port mejora, no regresa.

### Lo que se comprobó y está bien

- **Sin desborde horizontal** en ninguna de las 4 combinaciones (`/` y `/es` × 1440 y 375):
  `documentElement.scrollWidth === innerWidth` en las cuatro. Las tarjetas del carrusel que
  asoman por la derecha viven dentro de un `overflow-x:auto`, que es su sitio.
- **CSS del vendor: port 1:1.** Diff de selectores del bundle servido en producción
  (`accounting-max-services.webflow.shared.b58bed75d.css`, 898 selectores) contra los tres
  ficheros de `src/styles/vendor/` (900): **cero selectores perdidos**. Los 25 que aparecían
  como «faltantes» son el mismo selector con comillas simples en vez de dobles
  (`[type='button']` vs `[type="button"]`); lo único realmente añadido es `.w-layout-grid` y
  `pre.w-code-block code > span`, ambos boilerplate sin uso. **No falta ninguna regla `:hover`
  ni `:focus`.**
- **Carrusel sin webflow.js/Swiper:** pista con `overflow-x:auto`, `role=group`,
  `tabindex="0"`, 20/20 diapositivas, `scrollWidth` 6250/1250 (1440) y 5620/281 (375),
  flechas `<button>` con la anterior deshabilitada al inicio; un clic en «siguiente» mueve
  `scrollLeft` 0→313 (1440) y 0→281 (375), y «anterior» lo devuelve a 0. En `/es` igual.
- **Cero imágenes rotas** en `/` y `/es`, a 1440 y a 375 (`complete && naturalWidth===0` → 0
  casos). La facade de YouTube ocupa exactamente la caja del `<iframe>` de producción
  (493×277 y 271×152).
- **Los 28 destinos internos de la portada responden 200**: los 12 servicios ×2 idiomas
  (incluido `sales-tax-filing-7k40q`), más `/about-us`, `/contact-us` y sus `/es/`.
- **Jerarquía de encabezados idéntica** en `/` y `/es`: un `<h1>`, 15 `<h2>` y 8 `<h3>`, en el
  mismo orden. Los 12 títulos de servicio son `<h2>` como en el oráculo.
- **Texto verbatim:** `section.header`, `.about-us`, `.features` y `.call-action` tienen el
  texto visible **idéntico carácter a carácter** al oráculo (312, 624, 1798 y 212 caracteres).
- **Contraste:** el CTA verde da 3.07:1 (`--green-2` sobre blanco). **Es R1 de
  `auditoria-diseno.md`, ya reportado y decidido como identidad de marca. No se re-reporta.**
- **`/es` es coherente con la EN corregida:** cero `FALTA`/`SOBRA` entre las dos (536 nodos
  cada una), misma estructura, mismos 26 encabezados; toda divergencia es longitud de texto
  (el `<h1>` pasa de 2 a 3 líneas a 1440 y de 3 a 5 a 375, y las secciones crecen para
  acomodarlo **sin desbordar**: el bloque del hero queda 206 px por encima del borde
  inferior a 1440 y 64 px a 375). Los enlaces llevan bien el prefijo `/es/`. Se respeta D3:
  «Notary Public», «Sales Tax», «Enrolled Agents», «Certified Public Accountants», IRS, EIN e
  ITIN **sin traducir**.
- **Cero JSON-LD en la portada** y cero coincidencias de `aggregateRating`, `"Review"` o
  `@example.com` en `/` y `/es` (D5 y D1 cumplidos).

### Límites del barrido

- **`/es` no tiene oráculo.** Se auditó contra la EN ya corregida más coherencia interna,
  como manda §1. No se ha inventado ni un píxel de diseño para ella.
- **No pude confirmar por lectura directa que el campo `order` esté vacío en Sanity:** la
  consulta anónima a `ep5i6co1/production` devuelve `result: []` (el dataset ya no contesta
  sin token, pese a lo que dice B3). La conclusión de A1-01 se sostiene igualmente por
  deducción cerrada: el orden renderizado es **estrictamente alfabético dentro de los dos
  grupos de `feature`**, en EN y en ES, lo que solo puede pasar si los 12 empatan en `order`
  y decide el desempate `title asc` de `sanity.ts:95`.
- **Solo he medido a 1440 y a 375**, que es el encargo. 768 y 991 (el punto donde `.div-block-4`
  pasa de `grid` a `flex` y `.background-header` se apaga) quedan sin cubrir por mí.
- **Fuera de mi territorio, visto de pasada y sin reportar** (son de F1 · CROMO, y lo anoto
  para que no se pierda en el triaje): el port sirve **13** elementos con clase
  `icon-submenu` donde el baseline sirve **12**, y `.container-menu` del `<nav>` es el único
  nodo del cromo cuyo margen no pude cuadrar. Ninguna de las dos cosas se manifiesta en la
  maqueta de la portada a 1440 ni a 375.
