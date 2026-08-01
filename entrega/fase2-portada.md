# FASE 2 — Portada reconstruida

**31 de julio de 2026.** Commit `7a12890`, desplegado y medido en producción. El «antes»
es `fase1-tipografia.md`; el baseline original, `fase0-baseline.md`.

---

## Criterios de la fase

| Criterio | Estado |
|---|---|
| 0 clases de Webflow en la portada | ✅ **cero en el `<main>`** de `/` y `/es`, comprobado sobre el HTML construido |
| Contraste AA en todos los CTA | ✅ los 14 selectores de texto de la portada medidos en el DOM: pasan los 14 |
| Lighthouse móvil ≥92 | ✅ **96** (`/` y `/es`) |
| CLS sigue en 0 | ✅ **0,000** en móvil |
| Las 54 rutas responden 200 | ✅ |
| Paridad EN/ES en el mismo commit | ✅ el tipo `Cadenas` de `i18n.ts` no deja publicar una clave sin su gemela |

### Alcance, dicho con precisión

**«0 clases de Webflow en la portada» se cumple en el `<main>`, no en el cromo.** Nav y
Footer siguen siendo del vendor porque viven en las **54 rutas**: reconstruirlos aquí
cambiaría el sitio entero de golpe, que es justo lo que el plan por fases evita. Les toca
la fase 4, donde ya están listados.

---

## Medición

| | Antes (fase 1) | Después | |
|---|---:|---:|---|
| Rendimiento móvil `/` | 96 | **96** | = |
| Rendimiento escritorio `/` | 100 | **100** | = |
| LCP móvil `/` | 2.362 ms | **2.227 ms** | −135 ms |
| LCP escritorio `/` | 659 ms | **366 ms** | **−44 %** |
| CLS móvil | 0,000 | **0,000** | intacto |
| Accesibilidad | 97 | **97** | ver abajo |
| SEO | 100 | **100** | = |

La portada no era el cuello de botella de rendimiento —eso lo resolvió la fase 1— así que
lo que se buscaba aquí era **no perder nada**, y no se pierde. El LCP de escritorio baja
casi a la mitad de paso, porque la foto del hero dejó de competir por prioridad.

---

## Qué cambió

### Los 12 servicios en 3 familias

Doce tarjetas idénticas no son doce opciones: son ninguna. Ahora son tres tarjetas —
**Impuestos**, **Su empresa**, **IRS y respaldo** — y cada una lleva dentro sus servicios
como enlaces.

**Los 24 destinos se conservan enteros** (12 EN + 12 ES): el enlazado interno no pierde ni
uno. El agrupado vive en `src/lib/familias.ts` y va **por slug**, que es el mismo en las
dos lenguas, así que `/es` hereda el reparto sin poder divergir. `agrupar()` **revienta el
build** si un servicio del CMS se queda sin familia — el modo de fallo silencioso que este
proyecto ya sufrió con las imágenes de los posts no se repite.

### Estructura, reordenada por intención de compra

```
hero → credenciales → servicios (3 familias) → quiénes somos →
proceso → testimonios → qué esperar → FAQ → cierre
```

Dos secciones nuevas: la **barra de credenciales** (estaban a 10 px en la barra verde de
arriba, en blanco sobre verde, o sea escondidas *y* ilegibles) y el **proceso en 3 pasos**,
que quita la fricción de «no sé qué me van a pedir» — la objeción número uno en servicios
fiscales.

**El H1 no se reescribe.** Es el que sostiene el posicionamiento local y la campaña de Ads
apunta aquí; cambiarlo sería pagar el rediseño con tráfico. Cambia todo lo que lo rodea.

### El teléfono vuelve a existir en escritorio

Estaba en `display:none` a partir de 992 px — invisible justo donde más se mira. Ahora es
un botón pulsable en el hero y en el cierre, en todos los anchos. En un despacho contable,
llamar **es** la conversión.

### Menos JavaScript, no más

| Antes | Ahora |
|---|---|
| Acordeón con `<button>` + `hidden` desde `ui.ts` | **`<details>/<summary>` nativo** — `iniciarFaq()` borrado (1.879 B) |
| Carrusel `.splide` | **scroll-snap nativo**; los botones solo empujan el scroll |

Lo nativo además se abre sin JS, deja que Ctrl+F encuentre texto dentro de un panel
cerrado, y sale entero al imprimir. `iniciarCarrusel()` sigue vivo porque las 24 fichas de
servicio lo usan hasta la fase 3.

### Datos estructurados, por primera vez

El sitio emitía **cero JSON-LD en las 54 rutas**, pese a que `JsonLd.astro` existía entero
—252 líneas— y **no lo importaba nadie**. Conectado en las dos portadas: `AccountingService`,
`WebPage` y `FAQPage` con las 5 preguntas. Verificado en producción.

**D5 se respeta**: sigue sin `Review` ni `aggregateRating`. Los testimonios no tienen
valoración, ni fecha, ni fuente verificable.

### Una tercera regla de color, descubierta midiendo

Las dos primeras salieron en la fase 1. Esta salió al medir la portada ya construida:

**El verde tampoco vale como TEXTO sobre claro.** Ni `--verde` (3,07:1) ni `--verde-oscuro`
(**2,57:1** — es el más claro de los tres, el nombre engaña). Token nuevo
**`--verde-texto: #4e751c`**, 5,41:1 sobre blanco y 5,01:1 sobre `--superficie-2`. Los tres
verdes de marca siguen intactos para fondos y adornos.

---

## Lo que no salió como dije

### La portada móvil es un 17 % MÁS ALTA, no la mitad

En `fase0-baseline.md` §5 escribí que la fase 2 «debería bajar esto a la mitad».
**Era una proyección mía y ha salido al revés**, medido:

| | Antes | Después |
|---|---:|---:|
| Alto de página a 412 px | 9.943 px | **11.653 px** (+17 %) |

Dónde se va la altura del `<main>` (8.701 px; el resto es cromo):

| Sección | Alto | |
|---|---:|---|
| «What to expect from Accounting Max Services?» | **2.492 px** | **29 %** — 263 palabras de copy del cliente |
| «What we do» (3 familias) | 1.546 px | los 12 enlaces, visibles |
| «IRS Enrolled Agents & CPAs» | 932 px | |
| Hero | 857 px | |
| Las 5 restantes | 2.874 px | |

La rejilla de 12 tarjetas sí desapareció, pero el ahorro se lo comen **las dos secciones
nuevas que el propio plan pedía** (credenciales y proceso) y, sobre todo, el bloque «What
to expect», que en móvil son tres párrafos largos apilados.

**No lo he recortado por mi cuenta**: son 263 palabras escritas por el cliente sobre sus
propios servicios, y decidir que sobran es suyo, no mío. Es la primera decisión que pongo
sobre la mesa para la fase 3.

### Accesibilidad sigue en 97

Los 4 nodos que quedan **están todos en el cromo**, ninguno en el `<main>`:

| Nodo | |
|---|---|
| `.text-top-bar` ×2 | blanco sobre verde a **10 px**, en la barra superior |
| `input.button-news` | botón del boletín del pie |
| `.bar-footer` | copyright |

Eran 6–7 y ahora son 4; los que se han ido son exactamente los de la portada. Los cuatro
caen en la fase 4, cuando Nav y Footer se reconstruyan.

---

## Decisiones pendientes para la fase 3

1. **El bloque «What to expect»** — 263 palabras, 29 % de la altura móvil de la portada, y
   contenido que también vive en `/about-us`. ¿Se acorta, se mueve o se queda?
2. **Los 20 testimonios** siguen sin verificar (D5) y se muestran **en inglés dentro de
   `/es`**. Traducirlos está prohibido —son palabras de clientes— así que la salida es
   conseguir reseñas reales o retirarlos.
3. **El equipo (D1)** sigue sin datos: cero nombres y cero caras en las 52 rutas. Es lo que
   más convierte en este sector.

---

## 🚨 Sigue abierto, y no es de este encargo

El captcha de producción continúa con la clave de **pruebas** de Cloudflare
(`1x00000000000000000000AA`, «siempre pasa») en las 54 rutas. Zona prohibida por
concurrencia: este encargo no lo toca.
