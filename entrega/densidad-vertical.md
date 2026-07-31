# Densidad vertical — `.reviews` y promo verde

Rama `diseno/densidad-vertical`, creada desde `main` (`git reflog`: `branch: Created from
main` en `0009db9`). **El ajuste de densidad esta sin commitear y sin desplegar**, como
pediste: vive entero en el arbol de trabajo.

> ⚠️ La rama sí lleva **un commit que no es de este encargo**: `ce16882 «Reescribir los 10
> posts del blog, en ingles y en espanol»` (28-jul 20:52). No lo he hecho yo y no toca nada
> de diseño — son `baseline/contenido/**` y los posts. Lo dejo donde esta porque mover o
> borrar commits es destructivo y es decision tuya. Si quieres la rama limpia, lo suyo es
> `git branch -f` sobre `main` tras rescatar ese commit a su propia rama.
Un solo fichero de codigo tocado por este encargo: **`src/styles/site.css`, +117 lineas**,
todas al final y en un bloque marcado. Cero `!important` y ni un solo atajo
`padding`/`margin`: solo longhand vertical, para que sea imposible mover un ancho.
`src/styles/vendor/*` intacto. **Markup sin tocar**: ni `src/pages/*` ni
`src/components/*` participan en este ajuste — todo sale con CSS.

> Aviso sobre `git status`: el arbol de trabajo trae ademas cambios en
> `src/pages/index.astro`, `src/pages/about-us.astro`, `src/lib/i18n.ts`,
> `src/lib/sanity.ts` y `baseline/i18n/servicios-es.json`. **No son de este encargo**
> — son el trabajo de copy/NAP y de servicios que venia de la rama `contenido/blog` y
> viajo con el `checkout`. Comprobado: ninguno toca `review`, `promo`, `block-pic`,
> `padding`, `margin`, `min-height` ni `splide`.
> El diff de este encargo es exactamente `git diff main -- src/styles/site.css`.

---

## Los 8 criterios

| # | criterio | estado | la medida |
|---|---|---|---|
| 1 | −30% de alto a 1440 | ✔ | reviews **−37,5%** (642→401) · promo **−40,3%** (650→388) |
| 2 | ningun ancho cambia | ✔ | 536 nodos comparados en 5 anchos: 0 cambios de `rect.w`, salvo `img.bg-pic` (ver abajo) |
| 3 | ningun texto bajo la diagonal | ✔ | holgura medida en los 5 anchos, arriba y abajo: minimo **27px** (a 1024 y a 1440). Con `4em` a 1024 salia −4px: por eso el recorte esta acotado a ≥1440 |
| 4 | la foto ni se deforma ni se corta | ✔ | proporcion 0,76772 exacta en los 5 anchos; sin `object-fit`, no puede recortar |
| 5 | valores dentro de la escala del sitio | ✔ | solo `2em`, `4em` y `1em`. `4em` ya es el valor de `.call-action` y el de `.reviews` a ≤991px; `2em` es el padding horizontal de todas las secciones |
| 6 | nada roto por debajo de 992px | ✔ | promo **identico** a 375 y 768 (0,0% en los 5 nodos); reviews solo encoge la tarjeta |
| 7 | CLS igual o menor | ✔ | identico al sexto decimal en los 5 anchos |
| 8 | `npm run build` limpio | ✔ | 54 paginas, 0 warnings, 0 errores |

**Los 8 se cumplen.** El unico que costo fue el 1: con `4em` en `.reviews` la seccion se
quedaba en −27,6%. Se cumple con `2em`, que tambien esta en la escala. Lo que eso cuesta en
diseno esta medido y argumentado abajo (§«Lo que costo el criterio 1»), y **revertirlo es
cambiar un numero**.

---

## Antes / despues

Alturas en px. El ancho va al lado para el criterio 2.

### `section.reviews`

| ancho | alto antes | alto despues | Δ | ancho antes | ancho despues |
|---|---|---|---|---|---|
| 375 | 839 | 751 | −10,5% | 375 | **375** |
| 768 | 744 | 631 | −15,2% | 768 | **768** |
| 1024 | 646 | 579 | −10,4% | 1024 | **1024** |
| **1440** | **642** | **401** | **−37,5%** | 1440 | **1440** |
| 1920 | 942 | 529 | −43,8% | 1920 | **1920** |

### Promo verde (`.wrapper-promo`)

| ancho | alto antes | alto despues | Δ | ancho antes | ancho despues |
|---|---|---|---|---|---|
| 375 | 853 | 853 | 0,0% | 375 | **375** |
| 768 | 831 | 831 | 0,0% | 768 | **768** |
| 1024 | 541 | 413 | −23,7% | 1024 | **1024** |
| **1440** | **650** | **388** | **−40,3%** | 1440 | **1440** |
| 1920 | 750 | 388 | −48,3% | 1920 | **1920** |

### Las dos juntas, y el documento entero

| ancho | suma antes | suma despues | Δ | documento antes | documento despues |
|---|---|---|---|---|---|
| 375 | 1692 | 1604 | −5,2% | 10335 | 10233 |
| 768 | 1575 | 1462 | −7,2% | 8415 | 8317 |
| 1024 | 1187 | 992 | −16,4% | 6381 | 6186 |
| **1440** | **1292** | **789** | **−38,9%** | 6551 | **6048** |
| 1920 | 1692 | 917 | −45,8% | 6951 | **6176** |

### Los anchos, en detalle (criterio 2)

Comparados los **536 nodos** de cada pagina por `(clase, indice)` en los 5 anchos —
no solo las clases citadas. Resultado, exhaustivo:

```
375   nodos 536/536  ANCHOS distintos: 0   X distintas: 0
768   nodos 536/536  ANCHOS distintos: 0   X distintas: 0
1024  nodos 536/536  ANCHOS distintos: 1   X distintas: 1   <- img.bg-pic
1440  nodos 536/536  ANCHOS distintos: 1   X distintas: 1   <- img.bg-pic
1920  nodos 536/536  ANCHOS distintos: 1   X distintas: 1   <- img.bg-pic
```

Las clases que el criterio nombra:

| nodo | 375 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|
| `.block-review` | 271 | 294 | 220 | 293 | 293 |
| `.block-content-promo` | 375 | 668 | 512 | 625 | 625 |
| `.splide-slide` | 281 | 319 | 240 | 313 | 313 |
| `.splide-track` | 281 | 638 | 960 | 1250 | 1250 |
| `.wrapper-reviews` | 311 | 668 | 960 | 1250 | 1250 |
| `.block-pic` | 375 | 768 | 512 | 720 | 960 |

Identicos antes y despues, los seis, en los cinco anchos.

**La unica excepcion, y hay que decirla: `img.bg-pic` si cambia de ancho y de `x`.**

| ancho | `img.bg-pic` antes | despues |
|---|---|---|
| 1024 | 374 px (x=69) | 285 px (x=113) |
| 1440 | 449 px (x=135) | 268 px (x=226) |
| 1920 | 518 px (x=221) | 268 px (x=346) |

No es un fallo: esa `<img>` es `height:90%` con `width:auto` y **sin `object-fit`**, o sea
que su ancho **deriva** del alto por diseño. Al bajar la seccion, la foto escala en
proporcion — y la `x` se mueve porque `.block-pic` la centra (`justify-content:center`),
asi que una foto mas estrecha se centra mas adentro. Es exactamente lo que pide el
criterio 4, y `img.bg-pic` no es una de las clases que nombra el criterio 2.
A 375 y 768 no cambia nada tampoco aqui: el promo movil esta intacto.

### CLS (criterio 7)

| ancho | de carga (antes → despues) | con barrido (antes → despues) |
|---|---|---|
| 375 | 0,000000 → 0,000000 | 0,000000 → 0,000000 |
| 768 | 0,000000 → 0,000000 | 0,000000 → 0,000000 |
| 1024 | 0,000231 → 0,000231 | 0,000231 → 0,000231 |
| 1440 | 0,000087 → 0,000087 | 0,000087 → 0,000087 |
| 1920 | 0,000049 → 0,000049 | 0,000049 → 0,000049 |

Identico al sexto decimal. Se miden dos numeros porque `hadRecentInput` **no** filtra un
`scrollTo()` programatico: `de carga` se toma antes del barrido de scroll y es el
comparable con CrUX; `con barrido` incluye lo que se mueve al entrar en viewport y solo
vale como antes/despues contra otra medida tomada igual.

---

## Los valores nuevos y por que estan en la escala

La escala vertical real del sitio, extraida de `vendor/accounting-max.webflow.css`:

| seccion | base ≥992px | ≤991px |
|---|---|---|
| `.header` | `8em` (padding-bottom) | `6em` |
| `.bar-services` | 0 | 0 |
| `.about-us` | `8em` | `4em` |
| `.reviews` | `6em` | `4em` |
| `.features` | `8em` | `4em` |
| `.call-action` | `4em` | — |
| `.faq` | `8em` | `4em` |
| `.block-promo` | `8em` | `50px` |
| `.email-subscribed` | `4em` | — |
| `.container-footer` | `8em` | `4em` |

**La escala es `2em / 4em / 6em / 8em`** (16px de base → 32/64/96/128px), y por debajo de
992px casi todo colapsa a `4em`.

| declaracion nueva | valor | de donde sale |
|---|---|---|
| `.reviews` padding vertical (≥1440) | `2em` | el padding horizontal de todas las secciones de la portada. Es el unico escalon de la escala que cumple el −30%: `4em` se queda en −27,6% |
| `.block-promo` padding vertical (≥992) | `4em` | idem |
| `.wrapper-reviews` padding vertical (≥1920) | `4em` | sustituye a `150px`, que no estaba en ninguna escala |
| `.block-review` padding vertical | `1em` | la mitad de su `2em`; el horizontal se queda en `2em` |
| `.block-review` `margin-bottom` | `0` | — |
| `.block-services-animation` `margin-top` | `0` | — |
| `.wrapper-promo` `height` (≥1440) | `auto` | quita dos numeros fijos (650px/750px), no anade ninguno |

Los tres valores que estaban **fuera** de toda escala eran precisamente el problema:
`.wrapper-promo{height:650px/750px}` y `.wrapper-reviews{padding:150px 0}`. Los tres
desaparecen.

Breakpoints usados: `992`, `1440` y `1920`. Los tres los declara ya el sitio.
**No hay ni un numero inventado, y no hay ni un atajo `padding:`/`margin:`** en las 110
lineas nuevas: solo longhand vertical, que es la garantia estructural de que ningun ancho
se puede mover por descuido.

---

## Que se ha cambiado y por que

### (A) `.reviews`

La causa principal **no era el padding**: era `.block-review{min-height:300px}`.
Medido a 1440, el contenido real de la tarjeta ocupa **190px** (de y=55 a y=245) dentro
de una caja de 300px, y con `justify-content:center` esos 110px sobrantes salian como
aire arriba y abajo de cada cita. Las 20 tarjetas median exactamente 300px.

- `min-height: 0` → la tarjeta pasa a medir su contenido.
- `padding-top/bottom: 1em` (de `2em`) → −32px. El horizontal se queda en `2em`.
- `margin-bottom: 0` → los 10px de abajo eran hueco muerto. Los 10px de arriba se quedan
  (ahora son ellos la separacion con el titulo) y los laterales tambien: son la calle
  entre tarjetas y tocarlos moveria anchos.
- `.block-services-animation{margin-top:0}` → los 25px sobran porque la tarjeta ya aporta
  su propio margen de 10px.
- `.reviews` de `6em` a `2em`, **solo a ≥1440** (ver la diagonal, abajo).
- `.wrapper-reviews` de `150px` a `4em` a ≥1920.

Resultado a 1440: tarjeta 300→**222**, pista 320→**232**, seccion 642→**401**.

**Tarjetas desiguales — riesgo real, resuelto.** Sin `min-height`, `.block-review` es un
hijo *bloque* de altura natural, asi que las citas cortas habrian quedado mas bajas que la
pista y los bordes inferiores dentados. `.splide-slide{display:flex;flex-direction:column}`
+ `.block-review{flex-grow:1}` lo iguala: en columna, `stretch` da el ancho (el mismo que
tenia como bloque) y `flex-grow` el alto. Medido: **las 20 tarjetas a 222px exactos** en
los 5 anchos, con el ancho intacto.
Se usa `flex-grow:1` y **no** el atajo `flex:1`: el atajo pone `flex-basis:0%` y, junto al
`min-height:0`, anula el tamaño minimo automatico y colapsa la pista entera.

### (B) La diagonal — donde estaba la trampa de verdad

De las cuatro esquinas, **solo dos caen dentro de la caja de `.reviews`**: `.corner-top-1`
(blanca, arriba-izquierda) y `.corner-bottom-2` (gris, abajo-derecha). Las otras dos tienen
`inset` negativo y pintan *fuera* de la seccion.

`.corner-top-1` es 100×100 recortada en triangulo: a distancia `x` del borde izquierdo tapa
hasta `y = 100 − x`. El contenido arranca en `x = max(32, (W−1250)/2)` — 32px por el
`padding-left:2em`, y `(W−1250)/2` cuando el `.container` llega a su `max-width` y se
centra. **`x ≥ 32` siempre, luego la diagonal tapa como mucho 68px.**

Y no hay colchon: `accounting-max.webflow.css:104` y `:563` ponen `margin-top:0` en `h2` y
`.h2`, pisando el `margin-top:20px` de Webflow. La caja del titulo arranca exactamente en
`padding-top`.

Medido con la seccion ya ajustada:

Medido con la seccion ya ajustada, arriba (`h2` contra `.corner-top-1`) y abajo
(`.splide-track` contra `.corner-bottom-2`). Las otras dos esquinas tienen `inset`
negativo y pintan **fuera** de la caja de `.reviews`, asi que no pueden tapar nada.

| ancho | padding aplicado | tapa la diagonal | holgura arriba | holgura abajo | |
|---|---|---|---|---|---|
| 375 | `4em` (sin tocar) | 3px | +111px | +111px | despejado |
| 768 | `4em` (sin tocar) | 0px | +114px | +114px | despejado |
| 1024 | `6em` (sin tocar) | 68px | **+28px** | **+28px** | despejado |
| **1440** | **`2em`** | 5px | **+27px** | **+27px** | despejado |
| 1920 | `2em` | 0px | +96px | +96px | despejado |

La fila de 1024 es la razon de que el recorte este acotado a **≥1440**: ahi el `.container`
todavia no llega a su `max-width`, el contenido arranca en x=32 y la diagonal tapa 68px, o
sea que ni `4em` (64px) llega — daba **−4px**, medido. Entre 992 y 1439 se queda el `6em`
de Webflow, intacto. Se descarto cortar en el 1322 exacto donde la holgura pasa a positiva
porque ahi es de medio pixel; 1440 ademas ya es un breakpoint del sitio.
**Las esquinas no se han tocado**: mismo tamaño, mismo `clip-path`, mismo angulo.

### (C) Promo verde

Dos hipotesis del encargo no se sostenian, y por eso el arreglo es otro:

1. **La foto no impone la altura.** `.block-pic` es `position:absolute; inset:0 auto 0 0` a
   ≥992px: esta fuera del flujo y aporta **cero** altura. Y `.bg-pic{height:90%}` la
   *sigue*. Quien mandaba era una altura fija — `650px` a ≥1440 y `750px` a ≥1920 — que
   dejaba **134px de aire muerto** sobre un contenido de 260px. Bajar solo el padding de
   `.block-promo` no habria movido nada a 1440.
2. **La foto no se puede recortar ni deformar hoy.** `.bg-pic` es `height:90%` con
   `width:auto` y **sin `object-fit`**, sobre un PNG de **fondo transparente**. La
   proporcion se conserva por construccion. Lo que rodea a la mano no son franjas vacias:
   es el panel gris de `.block-pic`, que es el diseño.

   **El riesgo real era el contrario: añadir un `object-fit:cover` "para que cuadre".** Eso
   si habria cortado el puño. Por eso **la imagen no se toca**, y es deliberado.

Cambios: `.wrapper-promo{height:auto}` a ≥1440 (una sola regla cubre tambien el ≥1920,
porque `site.css` va sin capa y gana a la capa aunque la regla de la capa venga de un
`min-width` mayor) y `.block-promo{padding-top/bottom:4em}` acotado a ≥992px — sin acotar
se habria comido el `padding:50px 0` del movil.

Proporcion de la imagen medida en los 5 anchos: **0,76772 exacto** (1289/1679), antes y
despues. Cero deformacion.

---

## Lo que costo el criterio 1 — y como revertirlo

Con `4em` en `.reviews`, la seccion se quedaba en **−27,6%** (465px). La aritmetica, medida:

```
465 = 64 (padding-top 4em) + 105 (bloque de titulo) + 232 (pista) + 64 (padding-bottom 4em)
401 = 32 (padding-top 2em) + 105 (bloque de titulo) + 232 (pista) + 32 (padding-bottom 2em)
```

Para bajar de **449** (el −30%) faltaban 16px, y de esos cuatro sumandos solo uno era
tocable:

- **105px del bloque de titulo** = h2 (40) + 15 + subtitulo (50). Tocarlo es tipografia,
  que el encargo prohibe.
- **232px de la pista** = 10 (margen de la tarjeta) + 222 (tarjeta). La tarjeta ya es
  190 de contenido + 32 de padding: solo bajaria dejando el padding en 0.
- **el padding de la seccion.** El unico escalon de la escala por debajo de `4em` es `2em`,
  y a ≥1440 despeja la diagonal de sobra (tapa 5px, holgura medida 27px arriba y abajo).

Se ha aplicado `2em`, porque el encargo pide el −30% y `2em` esta en la escala. **Lo que
cuesta, dicho claro:** `.reviews` pasa a ser la seccion con menos aire vertical de la
portada — la mitad que `.call-action` (`4em`) y la cuarta parte que sus dos vecinas
`.features` y `.faq`, que estan a `8em`. En la captura no se ve apretada, pero es un juicio
de diseño y es tuyo.

| salida | resultado a 1440 | lo que cuesta |
|---|---|---|
| **`2em`, lo entregado** | **401px, −37,5%** | `.reviews` es la seccion mas apretada del sitio |
| `4em` | 465px, −27,6% | coherente con `.call-action`, pero **no cumple el criterio 1** |

Revertir es cambiar `2em` por `4em` en las dos lineas del bloque `@media (min-width:1440px)`
de `src/styles/site.css`. Nada mas depende de ese valor.

Una tercera via, `.block-header-review{margin-bottom:0}`, daba **−29,9%**: se quedaba a una
decima del criterio y pegaba la insignia de Google a la cita. Descartada.

---

## Advertencias y limites

### 1. La sombra inferior de las tarjetas se recorta

`.block-review` tiene `box-shadow: 2px 2px 6px #0003` y `.splide-track` computa
`overflow-y:hidden`. Con `margin-bottom:0` la pista mide justo lo que la tarjeta y la
sombra de abajo queda cortada.

Medido pixel a pixel a 1440, en la columna x=200 justo bajo el borde de la tarjeta:

```
antes:    (31,42,47) (32,43,49) (33,45,50) (34,46,52) (35,47,53) ... (36,49,55)
despues:  (36,49,55) (36,49,55) ...
```

O sea: una rampa de 8px con una diferencia **maxima de 5 unidades RGB** sobre el fondo
navy `#243137`. Es real y medible, pero por debajo del umbral de percepcion sobre ese
fondo. Recuperarla cuesta devolver los 10px de `margin-bottom`, que dejaria `.reviews` en
**−36,0%** en vez de −37,5% (411px en vez de 401). Sigue cumpliendo el criterio 1, asi que
si prefieres la sombra intacta, se recupera borrando una linea.

### 2. El promo ya no mide lo mismo en todas las rutas

Con `height:auto` la seccion mide su contenido, asi que **depende del texto**. Medido a
1440: la portada inglesa da **388px** y `/es` da **453px**, porque la copia española es mas
larga y el `h2` rompe en 3 lineas en vez de 2. Antes las dos median 650px por decreto.

No es un fallo — es lo que significa "altura de contenido", y en `/es` la foto queda de
hecho mejor encuadrada porque la seccion es mas alta. Pero conviene saberlo: **el CTA ya no
tiene un alto uniforme entre rutas**, y si alguna ficha de servicio tuviera un titulo muy
corto o muy largo, se notaria ahi tambien.

### 3. El promo ya no crece con la pantalla

Al quitar las alturas fijas, el promo mide **388px tanto a 1440 como a 1920**: el panel
gris se ensancha con el viewport pero la mano no crece con el. A 1920 la foto ocupa menos
proporcion del panel que antes. En las capturas se ve entera y bien encuadrada, pero es un
cambio de aire real y **la decision de encuadre es tuya**: si quieres que la mano recupere
presencia en pantallas grandes, la salida no es CSS sino un recorte del PNG mas ceñido a la
mano. Te dejo las capturas a los 5 anchos para que lo juzgues.

### 4. Alcance: el CSS es global, el encargo decia «la portada»

El promo vive en `src/components/Footer.astro`, que importan **14 plantillas → las 54
paginas construidas**. Y `.block-review` sale ademas en `/services/[slug]`,
`/es/services/[slug]` y `/es`. No se ha acotado a la portada a proposito: meter un selector
de pagina para esquivarlo seria peor que el problema. Verificado en una ficha de servicio
(`despues-ficha-reviews-1440.png`): el carrusel se ve correcto — ahi `.wrapper-reviews` no
va dentro de `section.reviews`, asi que no hay fondo azul ni esquinas.

---

## `.call-action` — propuesta, no cambio

Fuera del encargo, como pediste. Medida a 1440 con todo ya ajustado: `.call-action` **233px**,
`.reviews` **401px**, promo **388px**. Se queda en `4em`, el mismo valor al que ha bajado
`.block-promo`, y su alto es el menor de las tres porque su contenido tambien lo es. Es
coherente y **no propongo tocarla**.

Donde si se nota ahora el desajuste es en sus vecinas: `.about-us`, `.features` y `.faq`
siguen a `8em`, el doble que `.call-action` y el cuadruple que `.reviews` a ≥1440. Si en
algun momento quieres seguir, ese es el sitio — pero es otro encargo.

---

## Como reproducir las medidas

```bash
node tools/capturas.mjs medir 1440 "http://localhost:4321/=/tmp/x.json"
node tools/densidad.mjs baseline/diseno/densidad/antes-1440.json /tmp/x.json
```

Instrumentacion: `tools/capturas.mjs` ya existia; se le han añadido dos cosas — el
`PerformanceObserver` de `layout-shift` inyectado con `addScriptToEvaluateOnNewDocument`
(el CLS **no** se puede recuperar a posteriori) y un modo `recorte` que captura una seccion
en vez de la pagina entera, porque la portada mide 6048px y mirar si un titulo se mete bajo
la diagonal en una captura asi no es viable. `tools/densidad.mjs` es nuevo y solo lee esos
volcados.

Capturas en `baseline/diseno/densidad/`, todas recortadas a la seccion:

| fichero | que es |
|---|---|
| `antes\|despues-reviews-{375,768,1024,1440,1920}.png` | `.reviews` en los 5 anchos |
| `antes\|despues-cta-{375,768,1024,1440,1920}.png` | el CTA verde en los 5 anchos (criterio 4) |
| `antes\|despues-promo-{375,768,1024,1440,1920}.png` | mismo encuadre, set previo |
| `despues-ficha-reviews-1440.png` | el carrusel en `/services/corporate-tax-preparation` |
| `despues-es-reviews-1440.png`, `despues-es-promo-1440.png` | las dos secciones en `/es` |

Y los volcados de medida `antes|despues-{375,768,1024,1440,1920}.json`, que es de donde
sale cada numero de este documento.
