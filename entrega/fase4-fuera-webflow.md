# FASE 4 — Fuera Webflow

**1 de agosto de 2026.** Commits `85ebde0` → `a8b4ff0`, desplegados y medidos en producción.

---

## El criterio, y se cumple

| Criterio | Estado |
|---|---|
| `src/styles/vendor/` borrado entero | ✅ **5.141 líneas** eliminadas; el directorio ya no existe |
| `main.css` sin `@layer webflow` | ✅ la única aparición de «layer» es un comentario |
| Las 54 rutas responden 200 | ✅ comprobadas una a una tras el despliegue |

Y lo que arrastraba desde la fase 0:

| | Antes | Después |
|---|---:|---:|
| **Accesibilidad** | 97 en todas | **100 en las 7 plantillas** |
| Nodos de contraste | 4 | **0** |
| CSS servido | 78.003 B (con 5.141 líneas de Webflow dentro) | **45.608 B** |
| CLS móvil | 0,000 | **0,000** |
| Rendimiento móvil | 85–90 | **94–98** |
| Rendimiento escritorio | 99 | **100** |

Medición final, producción:

| Ruta | perf móvil | perf escritorio | A11y | BP | SEO | CLS |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 96 | 100 | **100** | 100 | 100 | 0,000 |
| `/services/personal-tax-preparation` | 97 | 100 | **100** | 100 | 100 | 0,000 |
| `/about-us` | 94 | 100 | **100** | 100 | 100 | 0,000 |
| `/contact-us` | 98 | 100 | **100** | 100 | 100 | 0,000 |
| `/post/understanding-tax-deductions` | 97 | 100 | **100** | 100 | 100 | 0,000 |
| `/blog-news` | 96 | 100 | **100** | 100 | 100 | 0,000 |
| `/es` | 97 | 100 | **100** | 100 | 100 | 0,000 |

---

## Qué sustituye a las 5.141 líneas

| Fichero | Líneas | Qué hace |
|---|---:|---|
| `base.css` | 118 | Reset. Sustituye a `normalize.css` (355) y a la parte de reset de `webflow.css` |
| `cromo.css` | 696 | Cabecera, pie y boletín |
| `paginas.css` | 638 | Las 77 clases que quedaron sin una sola regla al borrar el vendor |
| `componentes.css` | 1.007 | El sistema, de las fases 2, 3 y 5 |
| `tokens.css` | 267 | Los valores |
| `site.css` | 1.220 | Accesibilidad y correcciones propias, del port |

El reset son **118 líneas frente a 355** porque normalize resolvía
incompatibilidades de IE, Edge Legacy y Safari 6.

### Por qué no se reescribió el marcado de cinco plantillas

`/about-us`, `/blog-news`, `/contact-us`, `/post/[slug]` y las dos legales conservan su
marcado; lo que cambió es que ahora hay CSS propio detrás. Reescribir ocho plantillas a la
vez (EN + ES) en un sitio en producción con una campaña pagada encima es exactamente el
movimiento que el plan por fases existe para evitar. Con esto el vendor desaparece **hoy y
sin riesgo**, y el marcado se moderniza plantilla a plantilla cuando toque.

### Los nombres de clase del cromo no cambian, y es deliberado

`.navbar`, `.menu-button`, `.w--open`, `.dropdown`, `.cromo-centinela` no son «clases de
Webflow que exorcizar»: son los **ganchos de `src/scripts/ui.ts`**, donde viven los ocho
arreglos de accesibilidad medidos en `baseline/auditoria-diseno.md` §1 — cajón de dos
niveles, bloqueo de scroll, gestión de foco, enlace de salto. Lo que se borra es el CSS del
vendor, no una lista de nombres.

### Se acabó el escudo

En el diseño de Webflow `.brand` era un círculo navy en `position:absolute`, centrado al
50 % del viewport y colgando **17 px por debajo de la barra**: el gesto más llamativo de la
página, y no decía nada. Rompía la línea del cromo, robaba el centro óptico —que es donde
va el titular— y obligó a parchear un solape de 144×5 px (`entrega/mejoras.md` §0).

Ahora es lo que debía haber sido siempre: el logo, a la izquierda, en flujo.

---

## Lo que se rompió por el camino

Borrar el vendor destapó **cinco fallos de contraste que no existían antes**, y merece la
pena dejarlos escritos porque los cinco son el mismo error:

> **Una clase lleva su color de otro contexto y viaja con él cuando el bloque cambia de
> fondo.** El color vivía en la clase, no en el contenedor. Es exactamente lo que un
> sistema de tokens existe para no repetir.

| Dónde | Ratio | Causa |
|---|---:|---|
| Bloque promo del pie | **1,07:1** | fondo claro nuevo, texto blanco heredado de `.footer` |
| Titular del boletín | 1,07:1 | `.h2.white` ganaba por orden a `.wrapper-form-email .white` |
| Avisos del formulario | 1,17:1 | el blanco del pie pisaba los colores de estado |
| `.link-footer` en el lateral del blog | 1,06:1 | clase del pie reutilizada sobre fondo claro |
| «Read more» de las tarjetas | **1,75:1** | `.button.mini` — `.mini` es gris y le ganaba al botón |

### Y una causa raíz que valía por todas

`--white`, `--bllue`, `--green-1/2/3`, `--black` y `--gray` **se definían en el `:root` del
CSS de Webflow**. Al borrarlo quedaron indefinidas, y `site.css` las usa en **25
declaraciones** — entre ellas el **anillo de foco de dos tonos**, la pieza de accesibilidad
mejor documentada del proyecto: sin `--white` ni `--bllue` el `box-shadow` se vuelve
inválido y los 15 controles del sitio se quedan sin indicador de foco visible.

**Un `var()` que apunta a una variable inexistente no da error**: la declaración se descarta
y el valor se hereda. Por eso no rompió el build ni saltó en consola, y solo apareció como
texto blanco sobre fondo claro en las 54 rutas. Es el tipo de fallo que únicamente encuentra
medir.

Resuelto con siete alias en `tokens.css` que apuntan al token equivalente —así sigue
habiendo un único valor por color— y que se borran cuando `site.css` se reescriba.

De paso, `--exito` pasó de `#2f7d32` a `#256a28`: sobre el fondo de su propio aviso daba
**4,35:1**, el mismo error de 0,15 que ya costó la regla del navy sobre verde en la fase 1.

---

## Lo que sigue sin hacerse

**`/contact-us` conserva su formulario inline** en vez de usar `LeadForm.astro`. Es
duplicación consciente: era la única vía de lead que funcionaba y migrarla no era necesario
para borrar el vendor. Queda como deuda anotada.

**`site.css` conserva 1.220 líneas del port**, con sus 26 colores literales y las 25
referencias a los alias. Funciona y está documentado línea por línea; reescribirlo es
trabajo de limpieza, no de rediseño.

**Fase 6 (medición)** sigue bloqueada por **D7**: reautorizar GA4 necesita la cuenta de
Google del cliente.

**Fase 7 (lanzamiento de formularios)** sigue bloqueada por **B3** (dataset de leads
privado), **SMTP** inexistente, **`SANITY_WRITE_TOKEN`** con permiso expreso pendiente y
**D4** (aviso GLBA sin abogado).

---

## 🚨 Y lo de siempre

El captcha de producción sigue con la clave de **pruebas** de Cloudflare
(`1x00000000000000000000AA`, «siempre pasa») en las 54 rutas. Zona prohibida por
concurrencia; este encargo no lo ha tocado.

---

## Cierre — `/contact-us` y limpieza de `site.css`

**1 de agosto de 2026.** Commits `e504308` (formulario) y `52f8229` (limpieza).

### El formulario, con una sola fuente

`/contact-us` y `/es/contact-us` usan ahora el mismo `LeadForm.astro` que las 24 fichas:
**−596 líneas**. Había dos copias del contrato de Turnstile —los cuatro `data-` del widget,
el honeypot `ref_id`, el campo `ts` y la carga en fachada— y dos copias de su script. Dos
fuentes para un contrato de seguridad es una de más: el día que una se actualice y la otra
no, el fallo es silencioso y solo se nota porque dejan de llegar leads.

De paso, esa copia arrastraba dos defectos que el componente no tiene: el reto iba
**después** del botón de enviar (SC 2.4.3) y su caja no reservaba altura. Y las casillas de
consentimiento pasan de 18×18 a **24×24** (SC 2.5.8).

### `site.css`: 1.220 → 1.077 líneas

Fuera **15 bloques** cuyos selectores ya no existen en ninguna de las 54 rutas: el carrusel
`.splide` y sus flechas, `.block-review`, `.wrapper-reviews` y los cuatro `.corner-*`
(sustituidos por scroll-snap), el acordeón `.faq-question` (ahora `<details>`),
`.text-field-form` (ahora `LeadForm`) y los restos de `.block-bar-services`.

**`.nav-abierto` y `.w--open` se quedan a propósito.** No aparecen en el HTML estático
porque las aplica `ui.ts` en runtime, y borrarlas «por no usadas» habría dejado sin estilo
el bloqueo de scroll y el estado abierto del menú. Es el error que una limpieza automática
comete sola.

Las **25 referencias** a las variables del vendor pasan a los tokens reales, más 8 en
estilos en línea de cinco páginas. Con eso los alias de compatibilidad de la fase 4 sobran
y se borran: **ya no hay dos nombres para el mismo color**.

Verificado **con Tab real** —`.focus()` no dispara `:focus-visible`— que el anillo de dos
tonos sigue pintando su banda blanca de 2 px con offset y su banda navy de 4 px. Era lo
único que daba miedo tocar.

Quedan **18 colores literales**: 7 con alfa dentro del anillo de foco y las sombras, que se
midieron byte a byte, y 4 grises sin token idéntico. Migrarlos no es renombrar, es cambiar
el color.

### Medición final

| Ruta | perf móvil | perf escritorio | A11y | BP | SEO | CLS |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 97 | 100 | **100** | 100 | 100 | 0,000 |
| `/contact-us` | 97 | 100 | **100** | 100 | 100 | 0,000 |
| `/es/contact-us` | 99 | 100 | **100** | 100 | 100 | 0,009 |
| `/services/personal-tax-preparation` | 95 | 100 | **100** | 100 | 100 | 0,000 |
| `/blog-news` | **100** | 100 | **100** | 100 | 100 | 0,002 |

**0 nodos de contraste. Las 54 rutas a 200.** Los dos CLS distintos de cero están muy por
debajo del umbral de 0,1, pero se anotan porque antes eran 0,000 exactos: aparecen en las
dos rutas cuyo contenido depende de un widget de terceros.
