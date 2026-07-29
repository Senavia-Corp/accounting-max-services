# nav-resultados.md — las 16 afirmaciones, con su medición

Rama `nav/scroll-ux`, sobre `0009db9`. Línea base en
[`nav-baseline.md`](nav-baseline.md); plan en [`nav-plan.md`](nav-plan.md).

**14 de 16 cumplidas. 1 cumplida con matiz (10). 1 no cumplida (2), por la
decisión que tomaste antes de escribir código.**

Todo lo de abajo está medido en Chrome real por CDP, no estimado. El panel del
navegador integrado estrangula los temporizadores cuando está oculto (1 tick/s)
y hacía fallar por *timeout* los criterios dependientes del tiempo; se midieron
con un Chrome headless propio.

---

## (A) Desplegable de Services

### 1. Intersección `.dropdown-list` × `.brand` = 0 px² en las 8 combinaciones ✅

| ancho | idioma | **antes** | **ahora** | holgura |
|---|---|---|---|---|
| 992 | EN | 28.811 px² | **0** | 15,92 px |
| 992 | ES | 28.469 px² | **0** | 15,91 px |
| 1280 | EN | 19.942 px² | **0** | 15,92 px |
| 1280 | ES | 19.600 px² | **0** | 15,91 px |
| 1440 | EN | 19.942 px² | **0** | 15,92 px |
| 1440 | ES | 19.600 px² | **0** | 14,91 px |
| 1920 | EN | 19.942 px² | **0** | 15,92 px |
| 1920 | ES | 19.600 px² | **0** | 15,91 px |

### 2. Ningún título se corta ni se parte en dos líneas ❌ (6 de 8)

**Ninguno se corta nunca: `cortados = 0` en las 8.** Envolver, sí, y sólo a 992:

| ancho | idioma | panel | cortados | envuelven |
|---|---|---|---|---|
| 992 | EN | 315×543 | 0 | **3 de 12** |
| 992 | ES | 320×618 | 0 | **6 de 12** |
| 1280 / 1440 / 1920 | EN | 444×468 | 0 | **0** |
| 1280 / 1440 / 1920 | ES | 449×468 | 0 | **0** |

Es la decisión que tomaste: a 992 px el hueco hasta la cúpula es de 330,93 px y
el título ES más largo mide 300 px de texto, así que **no caben las dos cosas**.
Cede el criterio 2 y el solape se queda en 0. Un título en dos líneas se lee; un
logotipo tapado, no.

Dos apuntes que cambian cómo se lee este fallo:

- **En español el criterio 2 ya estaba incumplido antes.** Los dos títulos más
  largos medían 300 y 294 px dentro de una caja de 276 y **se desbordaban** —
  `.link-submenu` es item flex con `min-width:auto` y se niega a encoger. Por eso
  el panel ES medía 340 de alto contra los 290 del inglés. Este cambio reduce el
  problema; no lo introduce.
- El texto ES real mide **300 px**, no los ~360 que estimé en el plan. Al medirlo
  de verdad, 1280/1440/1920 pasaron de «falla por 31 px» a caber con 61 px de
  sobra en las dos lenguas.

### 3. Con el desplegable abierto, hacer scroll lo cierra ✅

`aria-expanded` `"true"` → `"false"` tras `scrollTo(0, 200)`. El listener se
registra **al abrir** con `{once:true}`, así que en reposo siguen siendo **cero
listeners de scroll en escritorio**, que es lo que pide (B).

---

## (B) Header condensado en escritorio

### 4. 20 cruces del umbral → como mucho 20 cambios de valor ✅

**20 cruces → 20 cambios. 1,00 por cruce.** Ni uno de más.

Banda muerta comprobada por separado: bajando a 300 y parando en 50 se queda
`condensado`; subiendo a 0 y parando en 50 se queda `expandido`; **0 cambios
extra** en los dos casos. Sin la histéresis, pararse en el límite haría parpadear
el header — es el fallo clásico de este patrón.

### 5. Página más corta que el viewport: expandido y estable ✅

Ninguna ruta del sitio es más corta que el viewport (la más corta,
`/post/understanding-sales-tax`, mide 3.113 px; `/terms` **5.699 px de recorrido**).
Se forzó la condición: viewport 1440×3300 sobre esa ruta →
`scrollHeight 3300 = innerHeight 3300`, **recorrido real 0**.

Resultado: `estadoFinal = "expandido"`, **estados alcanzados = `["expandido"]`** —
un solo valor en toda la vida de la página. Ningún estado intermedio es
alcanzable: el atributo sólo tiene dos valores posibles.

---

## (C) Header direccional en móvil

### 6. No se oculta en ninguno de los tres casos ✅

| condición | ¿visible? |
|---|---|
| cajón abierto (`data-nav-open="true"`) | ✅ |
| foco dentro del header | ✅ |
| `scrollY` por debajo de la altura del header (108 px) | ✅ |

**Control positivo incluido**, para que el resultado no sea trivialmente cierto
por estar la función rota: bajando de verdad **sí se oculta** (`seOcultaBajando:
true`) y subiendo **sí vuelve** (`vuelveSubiendo: true`).

Además, abrir el cajón **fuerza** el header a visible (`trasAbrirCajon:
"visible"`): el cajón es `position:fixed` con `top:var(--menu-alto)` y ese `top`
sólo es exacto si `.menu` está en `y0`.

---

## (D) Selector de idioma

### 7. Las banderas se ven a color solas, y pesan ≤ 4 KB ✅

Verificado abriendo cada `.svg` **solo** en el navegador, sin el CSS del sitio:
`En.svg` sale con franjas rojas y blancas, cantón navy y estrellas blancas;
`Sp.svg` con las tres bandas rojo/amarillo/rojo.

| | antes | ahora |
|---|---|---|
| `En.svg` | 11.834 B | **796 B** |
| `Sp.svg` | 116.022 B | **177 B** |
| **juntas** | **127.856 B** | **973 B** (techo 4.096) |

Venían rotas, no sólo grandes: **cero `fill`, cero `stroke`, cero `<style>`**, y
clases `.st0`–`.st17` que no existen en ninguna hoja del repo → negro sólido. El
escudo de España se quitó: a 20 px es invisible y era el 99 % del peso.

### 8. El switcher lleva a la misma página en el otro idioma ✅

Desde `/about-us` → `href="/es/about-us" hreflang="es" lang="es"`. La opción
activa lleva `aria-current="true"`. `otroIdioma()` vive en `es.ts`, junto a
`inicio()` y `enlace()`, y trata `"/" ↔ "/es"` como caso especial.

### 9. En `/privacy-policy` y `/terms` no se ofrece español ✅

| ruta | opciones renderizadas | enlaces a `/es` |
|---|---|---|
| `/terms` | **1** (sólo el idioma actual) | **0** |
| `/privacy-policy` | **1** | **0** |
| `/about-us` (contraste) | 2 | 1 |

Ni enlace muerto ni redirección al home: `otroIdioma()` devuelve `null`.

### 10. Con `ES_PUBLICO=false` no se renderiza, y el HTML no cambia ⚠️

**El switcher no aparece en ninguna de las 54 rutas** (`grep` → 0 ficheros).

Sobre «HTML idéntico», comparado contra el build con (A)(B)(C) y sin (D):

| | ficheros |
|---|---|
| difieren **sólo** en el hash del asset | **52 de 54** |
| difieren en un **sello de tiempo de build** (`lead-ts`, campo oculto antispam) | **2 de 54** |
| difieren en markup real | **0** |

O sea: **el DOM es idéntico**. Los 52 cambian porque `site.css` ganó reglas (las
del selector, que nunca llegan a pintarse) y eso cambia el nombre con hash del
fichero; los 2 restantes son `/contact-us` y `/es/contact-us`, cuyo `value` de
`lead-ts` es `Date.now()` y difiere entre dos builds cualesquiera, con cambios o
sin ellos. Byte a byte no es idéntico; en sustancia, sí. Lo marco como matiz y no
como aprobado porque la afirmación dice «idéntico».

### 11. Con `ES_PUBLICO=true` aparece en las 54, teclado completo, visible condensado ✅

- **54 de 54** rutas lo renderizan.
- El teclado lo recorre entero: hereda toda la máquina del desplegable de
  Services (ver criterio 12) porque se ensanchó **un solo selector** en `ui.ts`.
- Sigue visible con el header condensado
  (`visibleConHeaderCondensado: true` con `data-cromo="condensado"`), porque vive
  en `.navbar` y no en la `.top-bar` que (B) esconde.

---

## Global

### 12. Teclado sin ratón ✅

Abrir Services con `ArrowDown`, recorrer los 12, `Home`/`End`, `Escape`, `Tab`:

| comprobación | resultado |
|---|---|
| elementos recorridos | **12**, todos distintos |
| `Home` | → «Corporate Tax Preparat…» (el primero) |
| `End` | → «Bilingual Services (En…» (el último) |
| foco tapado por el header | **0 veces** |
| `Escape` devuelve el foco al disparador | **sí** |
| `aria-expanded` tras `Escape` | `"false"` |

### 13. Con `prefers-reduced-motion: reduce`, los estados cambian y nada se anima ✅

Emulado por CDP (la misma señal que da el sistema operativo, no una media query
falsa):

- `transition-duration` de `.menu` y `.brand`: **1e-05 s**
- el estado **sí** cambia: `data-cromo` → `"condensado"`
- a **30 ms** el transform ya está en su valor final (`translateY(-43.75)`,
  `scale(0.833333)`) e idéntico al de 280 ms → **salta, no anima**
- la opacidad del panel a 30 ms ya es `1` → tampoco se desvanece

Sale gratis: lo neutraliza el bloque `@media (prefers-reduced-motion: reduce)`
que ya existía en `site.css:77`.

### 14. CLS igual o menor que la línea base ✅

| ruta | base | ahora |
|---|---|---|
| `/` | 0 | **0** |
| `/terms` | 0 | **0** |
| `/services/itin-application-irs-tax-id` | 0 | **0** |
| `/post/understanding-sales-tax` | 0 | **0** |
| `/es/services/itin-application-irs-tax-id` | 0 | **0** |

Los centinelas son `position:absolute` de 1 px, fuera de flujo, y se pintan en
servidor: no desplazan nada ni aparecen tarde.

### 15. El JS añadido no supera +4 KB sin comprimir ✅ (medido sobre el JS que se sirve)

| | base | ahora | delta |
|---|---|---|---|
| **JS servido, sin comprimir** | 4.049 B | 6.202 B | **+2.153 B** ✅ |
| fuente `ui.ts` | 12.338 B | 20.194 B | +7.856 B ❌ |

Es la lectura que acordamos. La diferencia entre las dos filas son **comentarios
en español**, que Astro minifica a **cero bytes**: un presupuesto sobre la fuente
grava exactamente lo que el visitante no descarga, y `ui.ts` es ~2:1
comentario/código por bytes, que es la convención del fichero.

Efecto colateral que conviene saber: el bundle cruzó el umbral de *inlining* de
Astro, así que **pasó de ir incrustado en cada uno de los 54 HTML a ser un
fichero externo cacheable**. Para un sitio multipágina eso es mejor — se descarga
una vez en lugar de 54.

### 16. `npm run build` limpio ✅

`exit=0`, **0 coincidencias** de `warn|error|deprecat` en el log, **54 páginas**.
El proyecto no tiene test ni lint: el build es el único gate, y no aparece ningún
aviso nuevo respecto a la base.

---

## Movimiento — transform computado en los dos sentidos

Lo que no se ve en una captura fija. `getComputedStyle` en un bucle de `rAF`:

**Expandido → condensado** (objetivo `translateY(-43,75)`, `scale(0,8333)`)

| t | `.menu` | `.brand` |
|---|---|---|
| 0 ms | `none` | `none` |
| 60 ms | `-35,148` | `0,8661` |
| 120 ms | `-42,099` | `0,8396` |
| 220 ms | **`-43,749`** | **`0,83334`** |

**Condensado → expandido** (objetivo `none`, `scale(1)`)

| t | `.menu` | `.brand` |
|---|---|---|
| 0 ms | `-43,75` | `0,83333` |
| 60 ms | `-8,499` | `0,96762` |
| 120 ms | `-1,635` | `0,99377` |
| 220 ms | **`-0,001`** | **`0,999996`** |

**La curva es simétrica**: a 60 ms lleva un 80,3 % recorrido al condensar y un
80,6 % al expandir. Las dos propiedades arrancan a la vez y terminan a la vez, sin
escalonar. Los dos sentidos cierran en 220 ms.
