# nav-baseline.md — línea base antes de `nav/scroll-ux`

Estado del cromo **antes** de tocar nada. Todo lo de aquí está medido en el
navegador con `getBoundingClientRect()`, no estimado.

- **Commit de partida:** `0009db9` (rama `main`), rama de trabajo `nav/scroll-ux`.
- **Servidor:** `astro dev` en `localhost:4321`.
- **Instrumento:** CDP + `getBoundingClientRect()`; capturas con
  `scratchpad/cabecera.mjs` (viewport emulado, `deviceScaleFactor: 2`).

---

## 1. Geometría del cromo — 4 anchos × 2 idiomas

Constantes en las 8 combinaciones (no dependen del ancho ni del idioma):

| elemento | valor |
|---|---|
| `.menu` | alto **125 px**, `position: sticky`, `inset: 0 0 auto`, `z-index: 10` |
| `.top-bar` | alto **43,75 px** (35 % de 125) — la barra verde |
| `.navbar` | alto **81,25 px** (65 % de 125) — la barra oscura |
| `.brand` | **163,25 × 150**, `position: absolute`, `y = 43,75` → **cuelga 68,75 px por debajo** del header |
| `.logo` | **123,25 × 100** |
| `.container-menu` | `max-width: 1250`, `position: relative` |
| sombra de `.menu` | `rgba(0,0,0,.2) 0 2px 5px` — **siempre encendida**, también en el tope |

Lo que sí cambia:

| ancho | idioma | contenedor | `.brand` x | disparador x | `.dropdown-list` abierto | hueco disponible |
|---|---|---|---|---|---|---|
| 992 | EN | x0 w992 | 414,38 | 83,45 | x83,45 y125 · **750 × 290** | **330,93** |
| 992 | ES | x0 w992 | 414,38 | 78,47 | x78,47 y125 · **750 × 340** | **335,91** |
| 1280 | EN | x15 w1250 | 558,38 | 98,45 | x98,45 y125 · 750 × 290 | **459,93** |
| 1280 | ES | x15 w1250 | 558,38 | 93,47 | x93,47 y125 · 750 × 340 | **464,91** |
| 1440 | EN | x95 w1250 | 638,38 | 178,45 | x178,45 y125 · 750 × 290 | **459,93** |
| 1440 | ES | x95 w1250 | 638,38 | 173,47 | x173,47 y125 · 750 × 340 | **464,91** |
| 1920 | EN | x335 w1250 | 878,38 | 418,45 | x418,45 y125 · 750 × 290 | **459,93** |
| 1920 | ES | x335 w1250 | 878,38 | 413,47 | x413,47 y125 · 750 × 340 | **464,91** |

«Hueco disponible» = `.brand.x − dropdown-list.x`: el ancho máximo que puede tener
el panel sin llegar a tocar la cúpula.

El modelo cerrado que reproduce las 8 filas con error < 0,02 px:

```
hueco(vw, lang) = min(vw, 1250)/2 − 81,625 − desplazamiento(lang)
desplazamiento: EN 83,45   ES 78,47      (el ancho de «Home» / «Inicio»)
```

## 2. Criterio 1 hoy — el solape, medido

El panel mide **750 px** fijos (`min-width: 750px`, `accounting-max:1185`) y se
ancla en el disparador, así que invade la cúpula en las 8 combinaciones. La banda
vertical de solape es siempre **68,75 px** (de `y125`, donde abre el panel, a
`y193,75`, donde acaba la cúpula).

| ancho | idioma | solape X | solape Y | **área** |
|---|---|---|---|---|
| 992 | EN | 419,07 | 68,75 | **28 811 px²** |
| 992 | ES | 414,09 | 68,75 | **28 469 px²** |
| 1280 | EN | 290,07 | 68,75 | **19 942 px²** |
| 1280 | ES | 285,09 | 68,75 | **19 600 px²** |
| 1440 | EN | 290,07 | 68,75 | **19 942 px²** |
| 1440 | ES | 285,09 | 68,75 | **19 600 px²** |
| 1920 | EN | 290,07 | 68,75 | **19 942 px²** |
| 1920 | ES | 285,09 | 68,75 | **19 600 px²** |

Objetivo del criterio 1: **0 px² en las ocho.**

## 3. Criterio 2 hoy — anchos reales de los 12 títulos

Fuente medida: `16px/25px Ubuntu`, `letter-spacing: -0,5px`. «Natural» es el ancho
del texto sin restricción de columna; «render» es la caja que le da el layout actual.

| ES (49→16 car.) | natural | render | | EN | natural |
|---|---|---|---|---|---|
| Solicitud de ITIN (identificación fiscal del IRS) | **300,0** | 276 ⚠ | | Bilingual Services (English & Spanish) | **247,1** |
| Teneduría de Libros y Contabilidad Mensual | **294,0** | 276 ⚠ | | Monthly Bookkeeping & Accounting | 243,2 |
| Preparación de Impuestos Corporativos | 267,3 | 267,3 | | Financial Statement Preparation | 218,6 |
| Preparación de Impuestos Personales | 253,7 | 253,7 | | Representation Before The IRS | 209,3 |
| Servicios Bilingües (Inglés y Español) | 244,9 | 244,9 | | Business Incorporation in FL | 189,1 |
| Preparación de Estados Financieros | 239,3 | 239,3 | | ITIN Application (IRS Tax ID) | 185,6 |
| Constitución de Empresas en FL | 214,9 | 214,9 | | Corporate Tax Preparation | 179,9 |
| Representación ante el IRS | 180,8 | 180,8 | | Personal Tax Preparation | 169,3 |
| Presentación del Sales Tax | 178,0 | 178,0 | | Notary Public Services | 150,5 |
| Servicios de Notary Public | 175,1 | 175,1 | | Audit Assistance | 111,8 |
| Asistencia en Auditorías | 161,3 | 161,3 | | EIN Application | 104,1 |
| Solicitud de EIN | 105,8 | 105,8 | | Sales Tax Filing | 101,0 |

**El español mide 300 px en su peor caso, no los ~360 que se estimaron en el plan.**
La estimación por caracteres era conservadora: el ancho medio real es 6,1 px/car.
en ES, no 7,26. Esto **reduce mucho** el conflicto entre los criterios 1 y 2.

⚠ **Defecto preexistente en ES, encontrado al medir.** Los dos títulos más largos
tienen `natural 300` / `294` dentro de una caja de `276`: **se desbordan hoy**. No
envuelven — `.collection-item-submenu` es `display:flex` y el `<a>` es un item flex
con `min-width:auto`, así que se niega a encogerse por debajo de su contenido y
sobresale de su columna. También explica que el panel ES mida **340** de alto contra
los **290** del inglés. O sea: el criterio 2 **ya está incumplido en español hoy**,
antes de tocar nada.

## 4. CLS — 5 rutas de muestra

Medido con `PerformanceObserver` sobre entradas `layout-shift` con
`hadRecentInput === false`, a 1440 × 900, 2,0–2,5 s tras la navegación.

| ruta | CLS | eventos | scrollHeight | por qué está en la muestra |
|---|---|---|---|---|
| `/` | **0** | 0 | 6 551 | larga → criterio 4 (histéresis) |
| `/terms` | **0** | 0 | 6 599 | sin equivalente ES → criterios 5 y 9 |
| `/services/itin-application-irs-tax-id` | **0** | 0 | 5 665 | el título peor caso |
| `/post/understanding-sales-tax` | **0** | 0 | 3 113 | tipo post |
| `/es/services/itin-application-irs-tax-id` | **0** | 0 | 5 773 | ES, el mismo peor caso |

**Línea base: CLS = 0 en las cinco.** El criterio 14 (igual o menor) no admite
ninguna regresión: cualquier valor > 0 al terminar es un fallo.

⚠ **Criterio 5 — no existe ninguna ruta más corta que el viewport.** La más corta
de las cinco (`/post/understanding-sales-tax`) mide 3 113 px, y `/terms` — la
candidata «corta» — resulta ser de las más largas, con **5 699 px de recorrido de
scroll**. El criterio se verificará forzando la altura del viewport hasta que
`scrollHeight <= innerHeight`, y se dirá en la entrega que se forzó.

## 5. Tamaños de partida

| fichero | bytes | nota |
|---|---|---|
| `src/scripts/ui.ts` | **12 338** | techo del criterio 15: **16 434** (+4 096) |
| `src/styles/site.css` | 28 108 | |
| `public/images/En.svg` | **11 834** | 65 paths, ninguno > 161 car. |
| `public/images/Sp.svg` | **116 022** | 481 paths; el mayor `d=` sólo 4 692 car. |
| las dos banderas juntas | **127 856** | presupuesto del criterio 7: **≤ 4 096** |

**Las dos banderas están rotas, no sólo son grandes.** Cero `fill`, cero `stroke`,
cero `style`, cero `<style>` en ambos ficheros: se apoyan en clases `.st0`–`.st17`
que **no existen en ninguna hoja del repo** (`grep '\.st[0-9]'` sobre `site.css`,
`main.css` y las tres de `vendor/` → 0 coincidencias). Renderizan **negro sólido**.
El peso de `Sp.svg` tampoco es un escudo monolítico que se pueda podar de un tajo:
son ~378 fragmentos de menos de 200 caracteres.

Ninguna de las dos está referenciada desde ningún sitio del código
(`grep -rn 'En\.svg\|Sp\.svg'` → 0 hits fuera de `public/`).

## 6. Capturas

| fichero | qué es |
|---|---|
| `entrega/nav/antes-1440-tope.png` | escritorio, `scrollY = 0` |
| `entrega/nav/antes-1440-desplazado.png` | escritorio, `scrollY = 600` — **idéntico al tope: hoy el header no reacciona al scroll** |
| `entrega/nav/antes-375-tope.png` | móvil, `scrollY = 0` |
| `entrega/nav/antes-375-desplazado.png` | móvil, `scrollY = 600` — idéntico al tope |

## 7. Estado del JS que ya existe

`src/scripts/ui.ts` (317 líneas) ya trae, y hay que **reusarlo, no duplicarlo**:

- `MOVIL = matchMedia("(max-width: 991px)")` (l. 17) con handler de `change` (l. 160).
- `focos(raiz)` (l. 26) — focalizables visibles, filtrados por `getClientRects()`.
- `toggles` recogidos por `button.w-dropdown-toggle` (l. 41) — el punto de enganche
  del selector de idioma.
- Trampa de foco con Tab acotada a `.navbar`, sólo con el cajón abierto (l. 124-140).
- Cierre por click fuera (l. 143) y por `focusout` (l. 151).
- **Bloqueo de scroll del cajón confirmado**: `html.nav-abierto { overflow: hidden }`
  dentro del `@media (max-width: 991px)` (l. 71 + `site.css:465`).

**Bug preexistente localizado** (`ui.ts:160-162`): el handler de `MOVIL` sólo trata
móvil→escritorio. Yendo escritorio→**móvil** con el desplegable abierto, se quedan
`aria-expanded="true"` y `w--open` puestos con `data-nivel` en `"1"`.
