# FASES 3 y 5 — y qué queda bloqueado

**1 de agosto de 2026.** Commits `7b1cc74` (fase 3) y `045da2b` (fase 5), desplegados y
medidos en producción.

---

## Dónde está el sitio ahora

Baseline de la fase 0 → hoy, sobre `https://www.accountingmaxservices.com`:

| Ruta | | Rendimiento | FCP | LCP | CLS |
|---|---|---:|---:|---:|---:|
| `/` | móvil | 87 → **98** | 2.881 → **1.486** | 3.108 → **2.086** | 0,000 |
| `/` | escritorio | 99 → **100** | 803 → **376** | 803 → **430** | 0,000 |
| `/services/personal-tax-preparation` | móvil | 85 → **95** | 2.900 → **1.612** | 3.287 → **2.498** | 0,000 |
| ” | escritorio | 99 → **100** | 735 → **343** | — | 0,000 |
| `/post/understanding-tax-deductions` | móvil | 90 → **97** | 2.691 → **1.456** | 2.691 → **2.056** | 0,000 |
| ” | escritorio | 99 → **100** | 712 → **353** | — | 0,025 → **0,013** |

**Las 54 rutas responden 200.** CLS sigue en 0,000 en móvil en las tres plantillas — el
objetivo de cierre del rediseño para rendimiento (móvil ≥95, escritorio 100) **ya está
cumplido en las tres**.

---

## Fase 3 — las 24 fichas de servicio son landings

| Criterio | Estado |
|---|---|
| Formulario propio con Turnstile en las 12 + 12 ES | ✅ |
| Fuera la caja de los 12 servicios | ✅ |
| 0 clases de Webflow en el `<main>` | ✅ |
| JSON-LD de servicio | ✅ en las 24 |

**El problema que resuelve**: 182 de los 204 botones del sitio (89 %) mandaban a
`/contact-us`. Quien llegaba desde un anuncio buscando «EIN» tenía que saltar de página
para pedir presupuesto, y ese salto es donde se pierde el lead que se acaba de pagar.

**`src/components/LeadForm.astro`** es ahora la única fuente del formulario. El contrato de
Turnstile se **consume, no se reescribe**: los cuatro `data-` del widget, el honeypot
`ref_id` —nunca `company_url`, que los gestores de contraseñas autocompletaban tirando
leads de personas reales en silencio—, el campo `ts` y la carga en fachada. Los tres
ficheros que lo implementan siguen intactos: zona prohibida por concurrencia.

Dos cosas que el formulario de `/contact-us` no tiene y este sí:

- **El reto va antes del botón de enviar.** SC 2.4.3: el orden de tabulación tiene que
  llevar al reto antes que a la acción que ese reto autoriza. El del boletín del pie lo
  tiene al revés en las 54 rutas.
- **`min-height: 65px` en la caja del captcha**, así que al aparecer el widget no empuja el
  botón y no reaparece el CLS.

**Fuera «Global Financial Solutions»**, que repetía los doce servicios en las 24 fichas y
ocupaba la mitad exacta del cuerpo. En su lugar, 2-3 hermanos de la misma familia.

---

## Fase 5 — movimiento con 0 KB de librería

| Criterio | Estado |
|---|---|
| 0 KB de JS de librería | ✅ verificado en el CSS y el JS servidos |
| El hero no arranca en `opacity:0` | ✅ comprobado sobre el HTML construido |
| `prefers-reduced-motion` conserva el fundido y elimina el movimiento | ✅ `@keyframes` propio |
| CLS 0 | ✅ |

Todo nativo: `animation-timeline: view()` para las entradas al hacer scroll,
`@starting-style` + `allow-discrete` para lo que aparece en el DOM, `::details-content`
para el acordeón y `@view-transition` para la navegación entre rutas.

Las tres reglas que no se negocian:

1. **El hero nunca arranca invisible.** Si el elemento LCP empieza en `opacity:0`, el
   navegador mide el LCP **al final de la animación**. Este port ya tuvo que quitar los
   `data-w-id` de Webflow por esto mismo.
2. **`prefers-reduced-motion` conserva el fundido y elimina el desplazamiento.** El reset
   estándar a 0,01 ms es demasiado bruto: deja las cosas apareciendo de golpe. Quien activa
   esa preferencia no pide que la interfaz deje de responder, pide que no se mueva.
3. **Nada se mueve solo.** Sin bucles, sin carruseles automáticos, sin parallax (SC 2.2.2).

Solo se animan `transform`, `opacity`, `filter` y `clip-path`. La cascada es de 70 ms entre
hermanos y **se congela al sexto**: nadie espera 840 ms a que aparezca la última tarjeta.

---

## Lo que NO se ha hecho, y por qué

### Fase 4 — cromo y borrado del vendor · **NO HECHA**

Quedan por reconstruir `Nav.astro` (383 líneas), `Footer.astro` (261),
`FooterSubscribe.astro` (231), `/about-us`, `/blog-news`, `/contact-us` (615) y la
plantilla de post — unas **2.200 líneas** — y solo entonces se pueden borrar las 5.181 de
`src/styles/vendor/`.

**No la he empezado a medias a propósito.** El Nav y el Footer viven en las **54 rutas**, y
el Nav concentra ocho arreglos de accesibilidad medidos y documentados en
`baseline/auditoria-diseno.md` §1 (cajón en dos niveles, bloqueo de scroll, gestión de
foco, enlace de salto). Dejar eso a mitad en un sitio en producción con tráfico pagado
encima es peor que no tocarlo.

**Consecuencia directa y medible**: la accesibilidad se queda en **97**. Los 4 nodos que
fallan están **todos en el cromo**, ninguno en el contenido:

| Nodo | |
|---|---|
| `.text-top-bar` ×2 | blanco sobre verde a **10 px** |
| `input.button-news` | botón del boletín del pie |
| `.bar-footer` | copyright |

Y `/contact-us` conserva su formulario inline en vez de usar `LeadForm.astro` — duplicación
consciente: es la única vía de lead que hoy funciona, y migrarla es parte de esta fase.

### Fase 6 — medición · **BLOQUEADA, no es una decisión técnica**

Necesita **D7**: reautorizar la conexión de GA4 con la cuenta de Google del cliente. No
tengo esa cuenta y no es algo que se pueda ejecutar desde aquí. Lo que sí queda listo: el
sitio no tiene ninguna etiqueta que estorbe y la política de privacidad ya dice la verdad
sobre terceros (fase 1).

### Fase 7 — lanzamiento de formularios · **BLOQUEADA por cuatro puertas**

| Puerta | Qué falta |
|---|---|
| **B3** | Un dataset de leads **privado** en Sanity. El `production` es público: con el token de escritura puesto, cada envío sería PII de un contribuyente expuesta |
| **SMTP** | `nodemailer` no está instalado y no existe ninguna variable `SMTP_*`. Hoy `enviarAviso` devuelve siempre `{enviado:false}` |
| **`SANITY_WRITE_TOKEN`** | Subirlo requiere permiso expreso y las dos puertas de arriba resueltas — está escrito así en `AGENTS.md` |
| **D4** | El aviso GLBA es un borrador a la espera de abogado, y bloquea publicar los formularios aunque lo técnico se arregle |

Ninguna de las cuatro es mía. Las 24 fichas nuevas ya tienen el formulario montado y
esperando: el día que se abran, funcionan sin tocar una línea.

---

## 🚨 Lo más urgente sigue abierto

**El captcha de producción lleva la clave de PRUEBAS de Cloudflare**
(`1x00000000000000000000AA`, cuya semántica documentada es «siempre pasa») en las 54 rutas.
Viene del trabajo en curso de otra sesión (`ff9e964`) y está en zona prohibida por
concurrencia, así que este encargo no lo ha tocado — pero **acabo de multiplicar por 12 el
número de formularios que dependen de él**. Cerrarlo es ahora más urgente que ayer.

---

## Tres decisiones que siguen siendo del cliente

1. **El bloque «What to expect»** de la portada: 2.492 px, el 29 % de la altura móvil, y el
   mismo contenido vive en `/about-us`.
2. **Los 20 testimonios** siguen sin verificar (D5) y se muestran **en inglés dentro de
   `/es`**. Traducirlos está prohibido —son palabras de clientes—, así que la salida es
   conseguir reseñas reales o retirarlos.
3. **El equipo (D1)**: cero nombres y cero caras en las 52 rutas. Es lo que más convierte
   en este sector, y es el único de los tres que no puede resolver nadie desde el código.
