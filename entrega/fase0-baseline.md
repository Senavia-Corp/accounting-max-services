# FASE 0 — Medición de partida

**Fecha: 31 de julio de 2026.** Origen: `https://www.accountingmaxservices.com` (producción,
dominio real, no la URL de `vercel.app`). Herramienta: Lighthouse 12.8.2 sobre Chrome
headless. HEAD del repo en el momento de medir: `73818ca`.

> **Para qué existe este documento.** El rediseño va a borrar las 5.181 líneas de CSS de
> Webflow y a rehacer las 54 rutas. Cuando eso pase, el estado actual deja de ser medible
> para siempre. Esto es la foto del «antes», y es contra esto —no contra una impresión— que
> se juzga cada fase.
>
> **Cifras acompañadas.** Todo lo de aquí es reproducible: los comandos están en §8 y los
> datos crudos en `fase0-baseline.json`.

---

## Resumen: qué dice la medición

El sitio está **sano en escritorio y cojo en móvil**, y la causa es una sola, concreta y
completamente heredada del port de Webflow: **carga tipografías de tres proveedores
distintos, y tres de las cuatro hojas de estilo que bloquean el render son de terceros.**

| | Escritorio | Móvil |
|---|---|---|
| Rendimiento | **99** en las 5 rutas | **85–90** |
| FCP | 0,70–0,80 s | **2,69–2,93 s** |
| LCP | 0,70–0,80 s | **2,69–3,29 s** |
| TBT | 0 ms | **0 ms** |
| CLS | ≤0,00016 (salvo un caso) | **0,00000 en las 5** |

Que el TBT sea 0 ms y el CLS sea 0 en las diez mediciones dice algo importante: **no hay
un problema de JavaScript ni de layout.** El sitio no se atraganta ni salta. Simplemente
no pinta nada durante 2,9 segundos porque está esperando a Adobe, a Google y a sí mismo.

Eso es una buena noticia para el rediseño: el problema de rendimiento se resuelve
**quitando cosas**, que es exactamente lo que la fase 1 hace de todos modos.

---

## 1 · Lighthouse — las 5 rutas clave

Una ruta por plantilla. Las tres primeras columnas de métricas en milisegundos.

### Móvil

| Ruta | Rend. | Acces. | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 87 | 97 | 100 | 100 | 2.881 | 3.108 | 0 | 0,00000 | 4.291 |
| `/services/personal-tax-preparation` | **85** | 97 | 100 | 100 | 2.900 | **3.287** | 0 | 0,00000 | 4.314 |
| `/contact-us` | 88 | 97 | 100 | 100 | 2.732 | 2.963 | 0 | 0,00000 | 4.267 |
| `/post/understanding-tax-deductions` | **90** | 97 | 100 | 100 | 2.691 | 2.691 | 0 | 0,00000 | 4.258 |
| `/es` | 86 | 97 | 100 | 100 | 2.925 | 3.160 | 0 | 0,00000 | 4.345 |

### Escritorio

| Ruta | Rend. | Acces. | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 99 | 97 | 100 | 100 | 803 | 803 | 0 | 0,00012 | 864 |
| `/services/personal-tax-preparation` | 99 | 97 | 100 | 100 | 735 | 735 | 0 | 0,00015 | 949 |
| `/contact-us` | 99 | 97 | 100 | 100 | 707 | 707 | 0 | 0,00016 | 958 |
| `/post/understanding-tax-deductions` | 99 | 97 | 100 | 100 | 712 | 712 | 0 | **0,02543** | 924 |
| `/es` | 99 | 97 | 100 | 100 | 713 | 713 | 0 | 0,00012 | 713 |

Estrangulamiento aplicado en móvil (el estándar de Lighthouse, para que sea comparable):
RTT 150 ms, 1.638 kbps, CPU ×4.

**Notas de lectura:**

- El escritorio da **99, no 98** como decía `release-verificacion.md` §11. La medición
  anterior se hizo contra `accounting-max-services.vercel.app`; esta contra el dominio real.
  Manda esta.
- La página de servicio es la **peor de las cinco en móvil** (85, LCP 3.287 ms). Es
  precisamente la plantilla que recibe el tráfico de pago.
- `post-desktop` es la única con CLS apreciable (0,025). Sigue muy por debajo del umbral
  de 0,1, pero es el único punto del sitio donde algo se mueve al cargar.

---

## 2 · Por qué el móvil va a 2,9 s: la causa raíz

Cuatro hojas de estilo bloquean el primer pintado. **Tres son de terceros, y las tres son
tipografía:**

| Recurso | Bytes | Bloqueo |
|---|---:|---:|
| `use.typekit.net/blq3zch.css` | 1.806 | **842 ms** |
| `fonts.googleapis.com/css2?family=Open+Sans…&family=Ubuntu…` | 2.379 | **848 ms** |
| `p.typekit.net/p.css?…` | 176 | **772 ms** |
| `/_astro/Footer.Bx8W8E6m.css` (el propio) | 18.566 | 300 ms |

**2.762 ms de bloqueo, de los cuales 2.462 ms —el 89 %— son de proveedores tipográficos
externos.** Y solo 4.361 bytes de los tres: no es peso, es latencia de negociar con tres
dominios distintos antes de poder pintar una letra.

**Y no es cosa de la portada: es de las 54 rutas.** Comprobado plantilla por plantilla —
las cinco sirven exactamente los mismos tres `<link rel="stylesheet">`, en el mismo orden.
Arreglarlo una vez lo arregla en todo el sitio; no arreglarlo lo deja roto en todo el sitio.

La cadena crítica lo enseña mejor que cualquier tabla — fíjate en la profundidad:

```
/ (178 ms)
├── use.typekit.net/blq3zch.css (247 ms)
│   ├── p.typekit.net/p.css (137 ms)          ← tercer salto
│   └── use.typekit.net/af/4f08df/… (58 ms)   ← la fuente, al final de todo
├── fonts.googleapis.com/css2?… (200 ms)
│   ├── fonts.gstatic.com/…/ubuntu…woff2 (129 ms)
│   ├── fonts.gstatic.com/…/ubuntu…woff2 (138 ms)
│   ├── fonts.gstatic.com/…/ubuntu…woff2 (125 ms)
│   └── fonts.gstatic.com/…/opensans…woff2 (108 ms)
├── /_astro/Footer.Bx8W8E6m.css (70 ms)
│   └── /fonts/Campton-Light.ttf (208 ms)     ← 120 KB de TTF sin comprimir
├── /_astro/Nav…js (51 ms)
└── /_astro/FooterSubscribe…js (51 ms)
    └── /_astro/turnstile.js (50 ms)          ← correcto: hijo, no bloqueante
```

### El elemento LCP, y por qué esto lo explica todo

| Ruta (móvil) | Elemento LCP |
|---|---|
| `/` | `<h1 class="h1">` — **texto** |
| `/contact-us` | `<h1 class="h1">` — **texto** |
| `/es` | `<h1 class="h1">` — **texto** |
| `/services/personal-tax-preparation` | `<img>` de Sanity CDN |
| `/post/understanding-tax-deductions` | `<img>` de Sanity CDN |

En tres de las cinco rutas **el elemento más grande de la primera pantalla es texto**. Un
LCP de texto no depende del peso de las imágenes: depende de cuándo llega la fuente. Por eso
el FCP (2.881 ms) y el LCP (3.108 ms) están a solo 227 ms de distancia en la portada — una
vez pinta, pinta todo de golpe. **El sitio no es lento: es que empieza tarde.**

---

## 3 · Tres proveedores tipográficos para dos familias usadas

Esta es la herencia más cara del port, y no estaba documentada en ninguna parte:

| Proveedor | Qué sirve | Coste |
|---|---|---|
| **Adobe Typekit** (kit `blq3zch`) | **21 `@font-face`** de **7 familias**: `cofo-sans-variable`, `dolly-new`, `dolly-small-caps-new`, `nimbus-roman`, `quiroh`, `stix-two-math`, `stix-two-text` | 2 hojas bloqueantes, 1.614 ms |
| **Google Fonts** | `Open Sans 600` + `Ubuntu` en 5 variantes | 1 hoja bloqueante (848 ms) + **4 `woff2`** |
| **Auto-alojado** | **6 `@font-face`** → `Campton-{Light,Medium,SemiBold,Bold,ExtraBold,Black}.ttf` | **660.708 B (645 KB)** disponibles, `.ttf` sin `woff2` ni subsetting |

**De las 7 familias que sirve Typekit, el sitio usa 2**: `dolly-new` y `stix-two-text`. Las
otras cinco se negocian, se descargan las hojas y no se usan jamás.

Las de Google (`Open Sans`, `Ubuntu`) son **valores por defecto de Webflow**: llegaron con
la plantilla, no con el diseño.

### Lo que esto añade a D2 y D9

- **D2 (licencia Campton, PENDIENTE)**: los 6 `.ttf` no solo se sirven, **se sirven desde un
  repositorio público y responden 200 a cualquiera** (comprobado:
  `GET /fonts/Campton-Bold.ttf` → `200`). Una fuente comercial sin licencia, redistribuible
  por cualquiera que pase por ahí. La exposición es mayor de lo que D2 describe.
- **D9 (Typekit `blq3zch`)**: el kit está activo en producción y es el mayor coste de
  rendimiento del sitio.

**Las tres se van en la fase 1.** Una sola familia auto-alojada en `woff2` subsetteado
elimina de golpe 2.462 ms de bloqueo, 645 KB de TTF y dos decisiones legales pendientes.

---

## 4 · Accesibilidad: 97, y el fallo es uno solo (pero peor de lo previsto)

De todas las auditorías automatizables de Lighthouse, en las 5 rutas **falla exactamente
una**: `color-contrast`. Todo lo demás pasa.

**6–7 nodos por ruta**, y son **dos fallos distintos**, no uno:

| Combinación | Ratio medido | Dónde | Veredicto WCAG 2.2 |
|---|---:|---|---|
| `#ffffff` sobre `#6da228` a 16 px | **3,06:1** | CTA `.button`, `input.button`, banda del pie | ❌ AA normal (pide 4,5) |
| `#ffffff` sobre `#6da228` a **10 px** | **3,06:1** | barra superior, `.block-top-info` ×2 | ❌ y además es texto diminuto |
| **`#243137` sobre `#6da228` a 16 px** | **4,36:1** | `.block-content-promo` | ❌ **también falla**, por 0,14 |

### La corrección que este baseline obliga a hacer

El prompt de rediseño proponía resolver el contraste usando **el navy de marca `#243137`
sobre el verde**, dándolo por bueno a «≈4,4:1». **Es incorrecto**: son 4,36:1 y AA para
texto normal pide 4,5. El propio axe ya lo reporta como fallo hoy, en las 5 rutas.

Recalculado con la fórmula WCAG 2.2, manteniendo `#6da228` intacto:

| Texto sobre `#6da228` | Ratio | AA normal (4,5) |
|---|---:|---|
| `#ffffff` | 3,07:1 | ❌ (solo vale para ≥24 px) |
| `#243137` navy de marca | 4,36:1 | ❌ |
| **`#1f2b30`** | **4,73:1** | ✅ |
| `#1a2427` | 5,17:1 | ✅ con margen |

**Decisión para el sistema de diseño**: token derivado `--sobre-verde: #1f2b30`. No es un
color de marca nuevo — es el navy existente un punto más oscuro — y es lo único que permite
llegar a accesibilidad 100 sin tocar el verde del cliente. `~/prompts/ams-rediseno-10k.md`
§4.1 ya está corregido con esta tabla.

---

## 5 · Inventario de producción

### Rutas

| | |
|---|---|
| Rutas comprobadas | **54 / 54 responden `200`** |
| En `sitemap-0.xml` | 52 (las 2 legales quedan fuera a propósito, D4) |
| HTML más pesado | `/es` — 72.443 B |
| HTML de la portada | 71.991 B |

### Carga útil de la portada

| Recurso | Sin comprimir | Transferido |
|---|---:|---:|
| HTML | — | 71.991 B |
| `Footer.Bx8W8E6m.css` (todo el CSS del sitio) | 78.003 B | 18.413 B |
| `Nav…js` | — | 2.245 B |
| `FooterSubscribe…js` | — | 983 B |
| Typekit `blq3zch.css` | — | 1.547 B |

**Todo el CSS del sitio cabe en un fichero de 78 KB**, del que las 5.181 líneas de vendor
son la mayor parte. Es el objeto de la demolición.

### Cabeceras de respuesta

```
strict-transport-security: max-age=63072000    ✅
cache-control: public, max-age=0, must-revalidate
x-vercel-cache: HIT
```

**Ausentes**: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`. No penaliza en Lighthouse hoy, pero es trabajo pendiente — y cuando
se añada la CSP hay que acordarse de `challenges.cloudflare.com` en `script-src` y
`frame-src`, o Turnstile deja de funcionar (§6 del prompt).

### Turnstile — confirmado sano

`/_astro/turnstile.js` aparece en la cadena crítica de la portada **como hijo del script de
`FooterSubscribe`, 50 ms, sin bloquear el render**. La carga en fachada funciona: el
`api.js` de Cloudflare no está en la cascada inicial. **El rediseño no puede romper esto.**

### Densidad vertical

Alto de página completa a 412 px de ancho (móvil):

| Ruta | Alto | Equivale a |
|---|---:|---|
| `/services/personal-tax-preparation` | **12.212 px** | ~30 pantallas |
| `/es` | 10.263 px | ~25 pantallas |
| `/` | 9.943 px | **~24 pantallas** |
| `/post/understanding-tax-deductions` | 7.776 px | ~19 pantallas |
| `/contact-us` | 4.844 px | ~12 pantallas |

Veinticuatro pantallas de scroll en una portada es el síntoma más visible de la rejilla
plana de 12 servicios apilados en una columna. La fase 2 debería bajar esto a la mitad
agrupando en 3 familias.

---

## 6 · Baseline visual

Diez capturas de página completa en `entrega/fase0-visual/`, extraídas de los propios
informes de Lighthouse: son el estado visual **exacto en el instante de la medición**, no
una captura hecha aparte que podría no coincidir.

```
portada-{mobile,desktop}.webp        412×9943   /  1350×6201
servicio-{mobile,desktop}.webp       412×12212  /  1350×7211
contacto-{mobile,desktop}.webp       412×4844   /  1350×2763
post-{mobile,desktop}.webp           412×7776   /  1350×3378
portada-es-{mobile,desktop}.webp     412×10263  /  1350×6356
```

Complementan las que ya había en `baseline/diseno/` (375 y 1440 px, del encargo del menú).

---

## 7 · Los números que hay que batir

Objetivo de cierre del rediseño, contra esta medición:

| Métrica | Hoy | Objetivo | Margen |
|---|---:|---:|---|
| Rendimiento móvil | 85–90 | **≥95** | +5 a +10 |
| Rendimiento escritorio | 99 | **100** | +1 |
| FCP móvil | 2,69–2,93 s | **<1,5 s** | −1,4 s |
| LCP móvil | 2,69–3,29 s | **<2,0 s** | −1,3 s |
| Accesibilidad | 97 | **100** | el contraste, §4 |
| CLS | 0,000 | **0,000** | ⚠️ **no perderlo** |
| TBT | 0 ms | **0 ms** | ⚠️ **no perderlo** |
| Líneas de CSS de Webflow | 5.181 | **0** | — |
| Proveedores tipográficos | 3 | **1** | — |
| Peso de fuentes servidas | 645 KB de `.ttf` | **<100 KB de `woff2`** | −85 % |
| Rutas con `200` | 54/54 | **54/54** | ⚠️ **no perderlo** |

Los tres marcados con ⚠️ son los que un rediseño rompe sin darse cuenta. Se comprueban en
cada fase, no al final.

---

## 8 · Cómo reproducir esta medición

```bash
npx --yes lighthouse@12 https://www.accountingmaxservices.com/ --output=json --output=html --output-path=./lh-portada --chrome-flags="--headless=new --no-sandbox" --quiet
```

Para escritorio, añadir `--preset=desktop`. Las 5 rutas medidas:

```
/
/services/personal-tax-preparation
/contact-us
/post/understanding-tax-deductions
/es
```

**En serie, nunca en paralelo**: dos ejecuciones simultáneas en la misma máquina se roban
CPU y las métricas de rendimiento dejan de ser comparables.

Datos crudos completos —incluidas todas las auditorías y las oportunidades por ruta— en
`fase0-baseline.json`.

---

## 9 · Barrido de 5 lentes — lo que Lighthouse no mide

Además de la medición sintética, cinco auditorías independientes sobre producción
(accesibilidad, SEO, superficie CSS, conversión y red). Aquí van los hallazgos que cambian
decisiones; el detalle completo con evidencia está en el registro de la sesión.

> ⚠️ **Aviso de método.** De los 38 agentes del barrido, **5 verificadores no llegaron a
> ejecutarse** por límite de sesión (3 de accesibilidad, 2 de conversión). Los hallazgos de
> esas dos dimensiones marcados abajo con **(sin verificar)** no pasaron la comprobación
> adversarial. Los tres que más pesaban se han verificado a mano y se indica cuál.

### 🚨 Lo que hay que mirar hoy, no en el rediseño

**El captcha de producción lleva la clave de PRUEBAS de Cloudflare.**
**Verificado a mano el 31-jul:** las 54 rutas sirven
`data-sitekey="1x00000000000000000000AA"`, que es la clave pública de prueba de Cloudflare
cuyo comportamiento documentado es **«siempre pasa»**. La protección antibot está en
producción y no protege de nada. Viene del trabajo en curso de la otra sesión (`ff9e964`,
*«Redespliegue con el secreto de prueba que pasa, para el envío humano»*). **Está en zona
prohibida por concurrencia y este encargo no lo toca** — pero no puede quedar así.

### Accesibilidad — el port está mejor de lo que dice el 97

Las 5 rutas pasan accesslint **sin una sola violación que no sea de contraste**. Jerarquía
de encabezados limpia, reflow a 320 px sin scroll horizontal, anillo de foco funcionando.
Lo que Lighthouse no ve:

| Hallazgo | Sev. |
|---|---|
| El verde no llega a 4,5:1 **ni con blanco (3,07) ni con el navy de marca (4,36)**, y no hay un verde que arregle los dos a la vez: para que el blanco funcione hace falta L≤0,183 (más oscuro) y para que el navy funcione L≥0,306 (más claro) — **verificado a mano** | bloqueante |
| El cajón móvil actúa como modal pero **el foco escapa a controles totalmente tapados** (SC 2.4.11), y Escape solo cierra si el evento nace dentro del panel *(sin verificar)* | alto |
| En la plantilla de blog el h1 sobre verde **pasa por 0,07** y su entradilla ya falla *(sin verificar)* | alto |
| El reto Turnstile del boletín va **después** del botón de enviar, sin altura reservada, en las 54 rutas *(sin verificar)* | medio |
| El enlace de salto cambia el hash pero no mueve el foco: a `<main>` le falta `tabindex="-1"` *(sin verificar)* | medio |

Confirma además la decisión del §4: **el navy de marca tampoco vale**. El token derivado
`--sobre-verde: #1f2b30` sigue siendo la salida, porque oscurece el *texto*, no el verde.

### Red — la cuenta exacta del LCP

| Hallazgo | Cifra |
|---|---|
| Peso de la portada móvil | 18 recursos, **193.742 B** |
| **De eso, binarios de fuente** | **140.300 B — el 72,4 %** |
| De terceros | 114.100 B (59 %) repartidos en **5 orígenes** |
| Las 21 `@font-face` de Typekit se declaran con | **`font-display: auto`** → bloqueante |
| Google Fonts (Open Sans + Ubuntu) | 4 woff2, **56.740 B**, para una regla que existe en **2 de 54 rutas** |
| `Campton-Light.ttf` (45.760 B en el cable) se descarga en las 54 rutas para dar tipo a | **UN solo elemento**: el botón del boletín del pie |
| La imagen del hero se pide con `fetchpriority="high"` y se pinta a | **0×0 — está en `display:none` en móvil** |
| Los activos con hash de contenido se sirven con | `max-age=0, must-revalidate` → **cero caché entre visitas** |
| Turnstile en fachada | ✅ **confirmado**: `challenges.cloudflare.com` no entra en la carga inicial |

### Superficie de reconstrucción — el mapa de demolición

| Hallazgo | Cifra |
|---|---|
| Bloques de regla del vendor que **ninguna ruta alcanza** | **44,2 %** (49,5 % contra las 5 plantillas clave) |
| Clases realmente vivas | **229 de 469** → 206 de proyecto + 23 del framework `w-*` |
| Componentes reales | **11**, de los que **5 son cromo en 54/54 rutas** |
| **Las 44 rutas de prosa CMS (`.w-richtext`) no tienen NI UNA regla tipográfica** | el cuerpo del blog y de los servicios se pinta con otra familia que el resto |
| Tokens de diseño existentes | **9 variables, 2 de ellas basura** — y un ritmo de sección 8em/4em que sí es consistente |
| `.container` desperdicia | **29,9 % del viewport a 767 px**, 32,6 % a 991 px |
| Motion en el vendor | 6 `transition: all` + un `@keyframes` muerto; **todo el movimiento real ya vive en `site.css`** |
| Clases propias ya fuera del vendor | **40** — el embrión del sistema nuevo |
| ⚠️ Tres bloques de `clip-path` del diseño original | **nunca estuvieron en la hoja**: vivían en un `<style>` incrustado y solo existen porque `site.css` los rescató |
| ⚠️ Seis reglas del vendor | hacen algo no obvio que **se rompe en silencio** al borrarlas |
| `site.css` | 13,5 % del bundle, **69 % de su fuente son comentarios** que documentan decisiones no reconstruibles |

### SEO — lo que hay que no perder, y tres agujeros

**La capa de metadatos es excepcional**: 54/54 con title único ≤60 car., description de
120–160, canonical autorreferencial, exactamente un h1, y **hreflang 100 % recíproco** en
las 52 rutas bilingües. Todo sale de un único fichero (`BaseLayout.astro`) y **sobrevive al
borrado del CSS**. Pero:

| Hallazgo | Sev. |
|---|---|
| **Cero JSON-LD en producción**: 0 de 54 rutas emiten `application/ld+json`, pese a existir `JsonLd.astro` (252 líneas) que **ningún fichero importa** | bloqueante |
| `/services/sales-tax-filing-7k40q` es la URL viva e indexada, con sufijo de Webflow, y **no existe ninguna infraestructura de redirecciones** en el proyecto | bloqueante |
| **70 enlaces internos editoriales** escritos a mano (37 EN + 33 ES) dentro del cuerpo de los 12 servicios: invisibles al CSS, **se destruyen si se reescribe el copy** | alto |
| No existe hub de servicios: `/services` y `/es/services` dan **404** | medio |
| El sitemap declara la portada **sin** barra final y el canonical **con** barra | medio |
| `/sitemap.xml` da 404 (solo responden `/sitemap-index.xml` y `/sitemap-0.xml`) | medio |
| La portada **no enlaza ni un solo artículo** del blog | medio |
| ✅ `robots.txt` deja pasar a **todos** los rastreadores de IA — verificado con peticiones reales | — |

### Conversión — el embudo desemboca en un 500

| Hallazgo | Cifra |
|---|---|
| **182 de 204 botones (89 %)** apuntan a `/contact-us` — la única página con formulario de lead… que devuelve 500 | bloqueante |
| Etiquetas de analítica o conversión en las 52 rutas | **cero** |
| El teléfono **desaparece en escritorio**: `display:none` a partir de 992 px | alto |
| Las 12 fichas de servicio: formulario propio, precio, prueba social específica | **ninguna de las tres** |
| La caja «Global Financial Solutions» ocupa | **la mitad exacta del cuerpo** en las 24 fichas |
| Las mismas 20 reseñas genéricas en 25 rutas, sin fecha ni fuente | y **en inglés dentro de `/es`** |
| Personas en las 52 rutas: nombre, cara o número de licencia | **cero** |
| Copy ya escrito y **sin publicar** | **13.037 palabras EN + 14.290 ES** |
| La CTA principal aparece con | **4 escrituras distintas y 2 colores**, sin jerarquía |

Ese último dato reordena la fase 3: el copy no hay que escribirlo, hay que **decidir
publicarlo**.

---

## 10 · Estado de la fase

| Criterio de la fase 0 | Estado |
|---|---|
| Lighthouse de las 5 rutas clave guardado en `entrega/` | ✅ `fase0-baseline.md` + `fase0-baseline.json` |
| Baseline visual antes de la demolición | ✅ `entrega/fase0-visual/` (10 capturas) |
| Causa raíz del LCP móvil identificada | ✅ §2 — tres proveedores tipográficos |
| Inventario de las 54 rutas | ✅ §5 — 54/54 a `200` |

**La fase 0 no cambia ni una línea del sitio.** Solo mide. Lo que sigue es la fase 1:
`tokens.css`, tipografía única auto-alojada y borrado de los `.ttf` de Campton.
