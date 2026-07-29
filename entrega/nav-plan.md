# nav-plan.md — plan de la rama `nav/scroll-ux`

Cuatro divergencias autorizadas, ninguna más: (A) el desplegable deja de tapar el
logo, (B) header condensado en escritorio, (C) header direccional en móvil,
(D) selector de idioma. Todo lo demás sigue 1:1 con `baseline/html/`.

Los números de partida están en [`nav-baseline.md`](nav-baseline.md).

---

## (A) Desplegable de Services

**Técnica.** Panel anclado a su disparador, alineado a la izquierda, a **una
columna**, con el ancho acotado en tiempo de ejecución para que su borde derecho
nunca alcance la cúpula:

```
--panel-ancho = .brand.x − .dropdown-list.x − holgura(16)
```

Se deriva de rects reales y se recalcula en `resize`. No se escribe como constante:
el hueco depende del ancho del contenedor **y del idioma** (el disparador arranca en
83,45 px en EN y en 78,47 px en ES, porque «Home» y «Inicio» no miden lo mismo).

Se mata el `min-width: 750px` del vendor (`accounting-max:1185`) y se pasa a una
columna (`column-count: 1`). El padding interno del propio panel se aprieta —
panel 25 → 16, lista 15 → 8 — porque el panel se está redimensionando de todos
modos y esos 32 px son texto útil.

`max-height: calc(100vh − var(--menu-alto) − 16px)` con `overflow-y: auto` y
**`overscroll-behavior: contain`**. Lo último no es decoración: sin él, llegar al
final del panel encadena el scroll a la página y el criterio 3 cerraría el
desplegable en la cara del usuario.

**Alternativa descartada:** subir el `z-index` de `.brand`. Cambia un solapamiento
por otro — el logo pasaría a tapar dos enlaces del panel.

**Presupuesto de texto por ancho** (ancho útil = hueco − 99 px de cromo interno:
padding 16×2 + lista 8×2 + item 5×2 + icono 25 + gap 16):

| ancho | hueco | texto útil | título ES más largo (300 px) |
|---|---|---|---|
| 992 | 330,93 | **231,9** | no cabe — envuelve |
| 1280 / 1440 / 1920 | 459,93 | **360,9** | **cabe con 61 px de sobra** |

**Conflicto declarado entre los criterios 1 y 2.** A 992 px faltan 68 px y no hay
forma de recuperarlos dentro de las cuatro divergencias. **Cede el criterio 2**: el
solape se mantiene en 0 px² siempre, y los títulos que no caben envuelven a dos
líneas. **Nunca se corta texto.** Un título en dos líneas se lee; un logotipo tapado
no. Resultado esperado: criterio 2 **cumplido en 6 de las 8 combinaciones**; a 992 px
envuelven 5 títulos de 12 en ES y 2 de 12 en EN.

Nota: en español el criterio 2 **ya está incumplido hoy** — los dos títulos más
largos se desbordan de su columna (300 y 294 px en una caja de 276). Este cambio
reduce el problema, no lo introduce.

**Calidad que hoy no tiene.** Hover-intent (~100 ms al abrir, ~250 ms al cerrar);
teclado ↑↓ / Home / End / Escape / Tab; click fuera; cierre al hacer scroll;
`aria-expanded` sincronizado. Aparición 150 ms, opacidad 0→1 con
`translateY(-4px)→0`. Sin escalados ni rebotes.

**Cerrar-al-scroll sin contradecir a (B).** «Cero listeners de scroll en escritorio»
y «el scroll cierra el desplegable» son incompatibles tal cual. Se resuelve
registrando el listener **al abrir**, con `{ passive: true, once: true }`: se
autoelimina al primer evento, así que en reposo hay cero listeners de scroll.

---

## (B) Header condensado (≥ 992 px)

**Disparo.** **Dos centinelas** de 1 px (`position:absolute`, `top:24px` y
`top:88px`, fuera de flujo → CLS cero), renderizados en servidor por Nav.astro, y
**un solo `IntersectionObserver`** con el root por defecto que observa los dos.

> **Corrección sobre el primer plan.** La primera versión usaba un único centinela
> en `y0` con `rootMargin: "-88px 0 0 0"`. Un margen **negativo encoge** el root, así
> que la banda pasa a ser `[88, vh]`; pero el centinela está en la `y0` del documento
> y su rect en viewport es `[-scrollY, -scrollY+1]`: empieza en `[0,1]` — ya por
> encima de la banda — y al bajar sólo se aleja. `isIntersecting` habría sido `false`
> en toda posición de scroll de toda ruta: los observadores disparan su callback
> inicial y **no vuelven a disparar jamás**. Dos centinelas colocados con `top` y sin
> `rootMargin` dan la misma semántica sin depender del parámetro más invertido de
> esta API, y el fallo se vería en DevTools en vez de ser invisible.

**Histéresis** (criterio 4): `pasado88 → condensado`; `!pasado24 → expandido`; entre
24 y 88 **se mantiene el estado actual**. Banda muerta de 64 px. El estado vive en
`data-cromo="expandido|condensado"` sobre `<header>` y **se escribe sólo si cambia**.
«Mantener el actual» lee una **variable JS**, no el DOM: si leyera
`header.dataset.cromo` y el atributo faltara al arrancar, escribiría la cadena
`"undefined"`. Nav.astro emite `data-cromo="expandido"` en servidor.

**Aspecto, todo en CSS.** El JS sólo conmuta el atributo.

- `transform: translateY(calc(-1 * var(--barra-verde)))`. No se anima `height`,
  `top` ni `padding`.
- `--barra-verde` sale de la altura **medida** de `.top-bar` con **`offsetHeight`**,
  no `getBoundingClientRect().height`: el rect devuelve la caja ya transformada, y
  `.top-bar` cuelga de un `.menu` que a partir de ahora se traslada. Se remide en
  `resize`. Nunca constante: el 35 % puede tocarse y se rompería en silencio.
- `.brand { transform: scale(var(--brand-escala)); transform-origin: top center }`.
- Sombra: `.menu` pasa a `box-shadow: none` en el tope y la recupera al condensarse.
  En el tope el header no flota sobre nada.
- **220 ms `cubic-bezier(0.32, 0.72, 0, 1)`, la misma curva y duración en ambos
  sentidos**, todo a la vez.

**Factor de escala S = 125/150 = 0,8333**, derivado en ejecución de
`--menu-alto / .brand.offsetHeight`. Justificación: `150 × 0,8333 = 125`, así que la
cúpula cuelga `125 − 81,25 = 43,75 px` bajo la barra condensada — **exactamente la
altura de la barra verde que acaba de desaparecer** — y el cromo condensado entero
ocupa la misma banda de 125 px que ocupaba el header expandido solo. Además reduce
la oclusión sobre el cuerpo de la página de 68,75 px a 43,75.

**Alternativa descartada:** S ≈ 0,72 (el punto de partida sugerido). El vuelo caería
a 26,75 px, el 33 % de la barra frente al 55 % del estado expandido: se lee como
*otro* logotipo, no como el mismo más pequeño. Y no se deriva de ninguna constante
del sistema.

### 🔴 `transform` en `.menu` rompe el cajón móvil

Un `transform` distinto de `none` (o `will-change: transform`, `filter`, `contain`)
convierte a `.menu` en el **bloque contenedor** de todo `position: fixed` que cuelgue
de ella — y `.navbar[data-nav-open=true] .block-items-menu` es exactamente eso
(`site.css:440-459`: `top: var(--menu-alto); bottom: 0`). Dentro de una caja de
108 px, `top:108px; bottom:0` resuelve a **altura 0: el cajón desaparece entero**.

Tres reglas, no negociables:

1. El reposo se escribe `transform: none`, **nunca** `translateY(0)`. `none`
   interpola como identidad, así que la transición funciona igual.
2. **Ningún `will-change: transform` en `.menu`** — crea el bloque contenedor aunque
   no haya transform.
3. Cinturón y tirantes: `html.nav-abierto .menu { transform: none }`. La clase ya la
   pone `ui.ts:71`, así que cuesta cero JS.

**Arranque ya desplazado.** El callback inicial del IO llega *después* del primer
pintado: al volver por bfcache o caer en un `#ancla` con `scrollY = 800`, el frame 1
pinta el header expandido y luego cambia — una animación de 220 ms **al aterrizar**,
en cada navegación hacia atrás. La clase que habilita `transition` se añade en el
segundo `rAF` tras asentarse el primer callback.

---

## (C) Header direccional (< 992 px)

`data-direccion="oculto"` en `.menu` → `translateY(-100%)`. Umbral de **8 px por
gesto**. Ocultar **200 ms ease-in**; mostrar **180 ms ease-out**, más rápido a
propósito: si el usuario sube es porque quiere el menú.

**Nunca se oculta** (criterio 6) con el cajón abierto
(`.navbar[data-nav-open="true"]`), con el foco dentro del header, o con
`scrollY <= menu.offsetHeight`.

**El scroll del body SÍ se bloquea con el cajón abierto** — verificado en código,
`ui.ts:71` + `site.css:465`. O sea que con el cajón abierto no llegan eventos de
scroll. La guarda se pone igual: el criterio 6 la exige y cuesta una condición.

**El cajón cuelga del header.** Su `top: var(--menu-alto)` sólo es exacto porque
`.menu` está siempre en `y0`. Abrir el cajón **fuerza el header a visible** antes de
nada; no basta con «no ocultar mientras está abierto».

Clamp de `scrollY` negativo y del sobredesplazamiento final (rubber-band de iOS).
Listener `passive` estrangulado con `requestAnimationFrame`.

**Cómo (B) y (C) no se pelean por `transform`:** las dos reglas viven en media
queries mutuamente excluyentes (`min-width:992px` / `max-width:991px`), así que nunca
hay dos fuentes activas para la misma propiedad. Sin `!important`.

---

## (D) Selector de idioma

Va en **`.navbar`**, al final del nav derecho, tras el CTA. Ese `.nav-menu` vive
dentro de `.block-items-menu`, que por debajo de 992 **es** el cajón: una sola
instancia sirve escritorio y móvil, sin duplicar markup ni estado. En la `.top-bar`
no puede ir: (B) la esconde al bajar.

**Gate D3.** `ES_PUBLICO` en `i18n.ts`, en `false`. Se construye completo pero
apagado: un selector visible en las 54 rutas publica el español de facto y D3 sigue
pendiente. **La constante no se invierte** — esa decisión es del cliente.

**Mapeo.** `otroIdioma(pathname)` en `es.ts`, junto a `inicio()` y `enlace()`.
Devuelve `{ lang, href } | null`. Los slugs no se traducen, así que el mapeo es sólo
el prefijo `/es`; `"/" ↔ "/es"`; `trailingSlash: "never"`. **`/privacy-policy` y
`/terms` devuelven `null`**: en esas dos rutas la opción español no se ofrece, ni
enlace muerto ni redirección al home. El switcher preserva siempre la ruta.

**Iconos.** Los dos vienen rotos (negro sólido, clases inexistentes) y pesan 127 856
bytes juntos. Se reescriben a mano, autosuficientes y con color explícito: España =
tres bandas **sin escudo** (a 20 px es invisible), EN = franjas + cantón
simplificado. Se insertan **en línea** vía `?raw` — sin petición HTTP en 54 rutas y
el CSS del sitio sí aplica — manteniendo el fichero como fuente única, que es lo que
verifica el criterio 7.

**Teclado, por la vía más barata.** `ui.ts:41` ya recoge los disparadores con
`querySelectorAll("button.w-dropdown-toggle")`. Se **ensancha ese único selector** y
el botón de idioma hereda gratis click, ArrowDown, Escape con devolución de foco,
exclusión mutua, click fuera, `focusout` y la trampa de Tab. Coste: una línea, más
una guarda en `desplegar()` para que no ponga `data-nivel="2"` y secuestre el segundo
nivel del cajón. **No se le cuelga la clase `w-dropdown-toggle`** a un elemento nuevo:
el encargo pide clases de Webflow verbatim y las nuevas con nombre propio.

`<button aria-expanded>` + `<a>` reales con `hreflang` y `lang`; el activo con
`aria-current="true"`; bandera decorativa (`aria-hidden`); nombres siempre en su
propio idioma («English» / «Español»). Sin JS sigue siendo utilizable. Movimiento
idéntico al de Services: 150 ms, opacidad + 4 px.

---

## Ficheros que se tocan

| fichero | qué |
|---|---|
| `src/components/Nav.astro` | centinelas, `data-cromo`, montaje del selector |
| `src/components/SelectorIdioma.astro` | **nuevo** |
| `src/scripts/ui.ts` | (A) (B) (C) y el enganche de (D) — techo +4 096 B |
| `src/styles/site.css` | todo el CSS nuevo, suelto, cero `!important` |
| `src/lib/i18n.ts` | `ES_PUBLICO` |
| `src/lib/es.ts` | `otroIdioma()` |
| `public/images/En.svg`, `Sp.svg` | reescritos |
| `DECISIONS.md` | entrada **D13** |

`src/styles/vendor/*` no se toca. No se toca Sanity ni se ejecuta ningún script de
escritura de `tools/`.

**D13 y no D11**: `DECISIONS.md` llega a D10, pero D11 y D12 ya están citados desde
cinco sitios del código sin haberse escrito nunca en el fichero (hallazgo abierto
`V3-05`). Reusar D11 pisaría una decisión ya referenciada.

## Riesgos

1. **Criterio 2 a 992 px**: falla por diseño, decidido arriba.
2. **Presupuesto de +4 KB en `ui.ts`**: ajustado. `ui.ts` es ~2:1 comentario/código
   por bytes, así que +4 096 B de fuente compran ~60 líneas de código y lo
   especificado pide más. Si se desborda, cae primero el hover-intent (el
   desplegable sigue funcionando por click y teclado) y se dice con el número.
3. **Criterio 10**: el HTML también cambia por (B) y (C), así que la comparación
   válida es contra la rama con (A)(B)(C) hechos y (D) sin añadir. El `dist/` se
   fotografía **justo antes** de empezar (D).
4. **Criterio 5**: no existe ninguna ruta más corta que el viewport; se fuerza la
   altura y se declara.
