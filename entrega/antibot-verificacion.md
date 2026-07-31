# Protección antibot — verificación de los 10 criterios

Fecha: 2026-07-31 · Rama `seguridad/turnstile`, fusionada a `main` en `3dd4345`.
Probado contra **producción** (`https://accounting-max-services.vercel.app`) y contra
el preview de la rama, no en local.

> **Claves de PRUEBA.** Todo lo de abajo está medido con las claves de prueba oficiales
> de Cloudflare, porque el widget real todavía no existe (ver §«Lo que necesito de ti»).
> `1x0000…AA` = siempre pasa · `2x0000…AA` = siempre rechaza. El cambio a las claves
> reales **no toca código**: son dos variables de entorno.

---

## Resumen

| # | Criterio | Estado |
|---|---|---|
| 1 | Widget en los 2 formularios × EN/ES | ✅ |
| 2 | Envío humano llega a Sanity y al correo | ⚠️ **PARCIAL — bloqueado a propósito** |
| 3 | POST sin token → 403 | ✅ |
| 4 | POST con token inventado/caducado → 403 | ✅ |
| 5 | Honeypot descarta en silencio con `ok:true` | ✅ |
| 6 | Rate limit por IP sigue dando 429 | ✅ |
| 7 | Script de Turnstile solo en páginas con formulario | ✅ |
| 8 | Teclado y lector de pantalla | ✅ con una reserva |
| 9 | Error de verificación en el idioma de la página | ✅ |
| 10 | Claves en Vercel; el secreto nunca en HTML ni repo | ✅ |

---

## 1 · Widget en las 4 variantes — ✅

La caja del widget sale en el HTML construido; el widget se pinta encima al primer foco.

```
/contact-us      -> 2 cajas  (formulario de contacto + boletín del pie)
/es/contact-us   -> 2 cajas
/  (y las otras) -> 1 caja   (solo el boletín del pie)
```

Idioma y tema por caja, medidos en el DOM de producción:

| Ruta | Formulario | `data-lang` | `data-theme` |
|---|---|---|---|
| `/contact-us` | contacto | `en` | `light` |
| `/contact-us` | boletín | `en` | `dark` |
| `/es/contact-us` | contacto | `es` | `light` |
| `/es/contact-us` | boletín | `es` | `dark` |

El tema no es cosmética: la tarjeta de contacto es blanca y el pie es azul marino. Con
`theme:"auto"` el widget sigue a `prefers-color-scheme` y saldría oscuro sobre blanco.

## 2 · Envío humano hasta Sanity y correo — ⚠️ PARCIAL, y a propósito

**Lo que sí está probado.** El captcha es el paso 8 y guardar en Sanity el 9. Un envío
humano real, con token válido de Turnstile, atraviesa los pasos 1 a 8 y muere en el 9:

```
Token obtenido antes de enviar : 21 caracteres
Respuesta                      : 500
Texto mostrado al usuario (EN) : "We could not save your request. Please call us at +1 (754) 244-3993."
Texto mostrado al usuario (ES) : "No pudimos guardar su solicitud. Llámenos al +1 (754) 244-3993."
Boletín (ES)                   : "No pudimos guardar su suscripción. Llámenos al +1 (754) 244-3993."
```

Ese 500 **es la prueba de que el captcha pasó**: si hubiera fallado, la respuesta sería
403 con «Verification failed», y no lo es.

**Por qué no se cierra.** El fallo del paso 9 es anterior a este encargo y está puesto
adrede (`entrega/release-verificacion.md` §5):

1. `SANITY_WRITE_TOKEN` no está en Vercel, **retenido a propósito**. El dataset
   `production` de Sanity es público (bloqueo B3). Subirlo no arregla el fallo: lo *arma*.
   Hoy el envío falla en seco y la persona ve un teléfono al que llamar; con el token, y
   hasta que exista un dataset de leads aparte y privado, cada envío sería PII de un
   contribuyente en un dataset legible sin credenciales.
2. `nodemailer` no está instalado y no existe ninguna variable `SMTP_*`. **No hay correo
   que pueda llegar.**

No se ha tocado ninguna de las dos. Cerrar el criterio 2 exige el dataset privado (B2 +
B3) y credenciales SMTP del dominio del cliente, que es otro encargo.

## 3 · POST sin `cf-turnstile-response` → 403 — ✅

Este era **el bug de fondo**. `antibot.ts` devolvía `{ok:true, motivo:"sin-token"}` para
un envío sin token: a un bot le bastaba con **omitir el campo** para entrar por la puerta
del fail-open. Ahora, con clave configurada, un token ausente es un rechazo explícito.

```
$ curl -i -X POST https://accounting-max-services.vercel.app/api/lead \
    -H "Origin: https://accounting-max-services.vercel.app" \
    -F "full_name=Prueba Produccion" -F "email=prod@example.com" \
    -F "phone=7542443993" -F "message=Sin token" -F "lang=en" -F "ts=<ahora>"

HTTP/2 403
content-type: application/json; charset=utf-8
{"ok":false,"error":"Verification failed. Please try again."}
```

```
$ curl -i -X POST https://accounting-max-services.vercel.app/api/newsletter \
    -H "Origin: https://accounting-max-services.vercel.app" \
    -F "email=prod-es@example.com" -F "lang=es"

HTTP/2 403
{"ok":false,"error":"La verificación falló. Inténtelo de nuevo."}
```

> **Trampa que casi da un falso positivo.** Sin la cabecera `Origin` correcta, Astro
> corta antes con su propia protección CSRF y devuelve un **403 `text/plain`** que no
> tiene nada que ver con el captcha. Los 403 de arriba son `application/json` y traen el
> mensaje traducido: esos sí son míos. Si alguien repite estas pruebas, la cabecera
> `Origin` no es opcional.

## 4 · POST con token inventado o caducado → 403 — ✅

Medido en el preview con el secreto de prueba **que siempre rechaza**
(`2x0000000000000000000000000000000AA`), acotado a la rama para no tocar producción, y
borrado después.

```
$ curl -i -X POST <preview>/api/lead -H "Origin: <preview>" \
    -F "full_name=Prueba Token Falso" -F "email=falso@example.com" \
    -F "phone=7542443993" -F "message=Token inventado" \
    -F "cf-turnstile-response=token-inventado-o-caducado-abc123" -F "lang=en" -F "ts=<ahora>"

HTTP/2 403
content-type: application/json; charset=utf-8
{"ok":false,"error":"Verification failed. Please try again."}
```

```
$ curl -i -X POST <preview>/api/newsletter -H "Origin: <preview>" \
    -F "email=falso-es@example.com" -F "cf-turnstile-response=token-inventado-xyz" -F "lang=es"

HTTP/2 403
{"ok":false,"error":"La verificación falló. Inténtelo de nuevo."}
```

**Por qué hizo falta cambiar el secreto.** La clave de prueba «siempre pasa» de Cloudflare
da `success:true` a **cualquier** cadena, también a la basura — comprobado directamente
contra `siteverify`:

```
secreto 1x…AA + token basura -> {"success":true,  "metadata":{"result_with_testing_key":true}}
secreto 2x…AA + token basura -> {"success":false, "error-codes":["invalid-input-response"]}
```

Con el widget real esta distinción desaparece: un token inventado será rechazado sin
tener que cambiar nada.

## 5 · Honeypot en silencio — ✅

Sigue cortando en el paso 3, antes del rate limit y del captcha, y sigue respondiendo
`ok:true` para no enseñarle al bot cuál fue el campo que lo delató.

```
$ curl -i -X POST https://accounting-max-services.vercel.app/api/lead \
    -H "Origin: https://accounting-max-services.vercel.app" \
    -F "full_name=Bot" -F "email=bot@example.com" -F "phone=7542443993" \
    -F "ref_id=bot" -F "lang=en" -F "ts=<ahora>"

HTTP/2 200
{"ok":true,"id":null}
```

Igual en `/api/newsletter`. Ningún cambio: no se ha convertido en error visible.

## 6 · Rate limit por IP → 429 — ✅

Siete envíos seguidos a `/api/newsletter` (límite 3 por 10 min):

```
[1] HTTP/2 403                    {"ok":false,"error":"Verification failed. Please try again."}
[2] HTTP/2 403                    {"ok":false,"error":"Verification failed. Please try again."}
[3] HTTP/2 429  retry-after: 576  {"ok":false,"error":"Too many submissions from this connection. Please try again in a few minutes."}
[4] HTTP/2 429  retry-after: 576  ...
[7] HTTP/2 429  retry-after: 576  ...
```

Esto también **prueba que el orden de operaciones no se ha movido**: mientras quedaba
cupo mandaba el captcha (403, paso 8); agotado el cupo manda el límite (429, paso 5), que
va antes. Si el orden se hubiera roto, los 429 no habrían tapado a los 403.

## 7 · El script solo donde hay formulario — ✅

**Cero peticiones a `challenges.cloudflare.com` en las 54 rutas hasta que alguien toca un
formulario.** No hay ni una etiqueta `<script>` de Cloudflare en el HTML construido:

```
$ grep -rl "challenges.cloudflare" dist/client --include="*.html" | wc -l
0
```

En producción, ruta por ruta (nº de apariciones en el HTML servido):

```
/                -> 0
/contact-us      -> 0
/es/contact-us   -> 0
/about-us        -> 0
```

Y medido en el navegador, en producción, alrededor del primer foco:

```
scripts de Cloudflare ANTES del foco : 0
scripts de Cloudflare DESPUÉS        : 1
token obtenido                       : 21 caracteres
```

**Por qué una fachada y no `defer`.** El formulario del boletín vive en el pie de las 54
rutas: cargarlo al pintar habría metido un tercero en todo el sitio. Es el mismo criterio
que ya aplica el repositorio al vídeo de YouTube. Lo que sí viaja en las 54 rutas es el
módulo propio `turnstile.ts` (unos 2 KB, sin red), porque el formulario del pie está en
todas; el tercero, no.

## 8 · Teclado y lector de pantalla — ✅ con una reserva

Orden de tabulación medido en el DOM de producción:

```
contacto : nombre → email → teléfono → mensaje → casilla llamadas →
           casilla SMS → enlace de privacidad → [WIDGET] → Enviar
boletín  : email → Suscribirse → [WIDGET]
```

En el formulario de contacto el reto queda **antes** del botón, que es el único orden en
el que se ve antes de intentar enviar. Comprobado: la caja precede al botón en el DOM
(`compareDocumentPosition`), ocupa 300 px y reserva 65 px de alto para que el botón no
salte cuando aparece el widget.

En el pie el reto queda **después** del botón. Es un compromiso consciente: el campo y el
botón comparten una «pastilla» flex con bordes redondeados, y meter un tercer hijo de
300 px la parte en dos. La mitigación está en el código: en cuanto Cloudflare avisa de
que va a pedir un clic, se lleva el foco a la caja (`scrollIntoView` + `focus`), para que
nadie se quede mirando un botón deshabilitado sin saber que le toca a él. Arreglarlo de
verdad es rehacer la pastilla, que es rediseño y no antibot.

**Auditoría `accesslint` (motor `@accesslint/core` sobre DOM vivo):**

```
mi build,  /contact-us     -> 4 violaciones (4 serious, todas color-contrast)
mi build,  /es/contact-us  -> 4 violaciones (idénticas)
PRODUCCIÓN ANTERIOR sin mis cambios, /contact-us -> 4 violaciones (idénticas, mismos selectores y ratios)
```

**Cero violaciones nuevas.** Las cuatro son de contraste en cabecera y pie, preexistentes
y ajenas a este encargo.

Otros puntos: el `<div>` de error ya tenía `role="alert"` y `tabindex="-1"`; el texto
ahora se escribe **antes** de mostrarlo y enfocarlo, porque al revés el lector anuncia el
mensaje anterior. Se usa `textContent`, nunca `innerHTML`, porque el texto viene de una
respuesta HTTP.

> **Reserva honesta.** Con las claves de prueba el widget no llega a pintar un `iframe`
> real, así que **no he podido comprobar en vivo que el foco no se quede atrapado dentro
> del reto**. Es lo único del criterio 8 que queda pendiente y hay que repetirlo con el
> widget real: entrar con Tab, salir con Tab y con Mayús+Tab, y resolver el reto solo con
> teclado.

## 9 · Error en el idioma de la página — ✅

Antes el cliente **nunca** enseñaba el mensaje del servidor: miraba solo `res.ok` y
pintaba un «Oops! Something went wrong» genérico. Ahora lee el JSON y muestra el `error`,
que el servidor ya emite traducido.

Medido en el navegador:

| Página | Texto mostrado |
|---|---|
| `/contact-us` | "We could not save your request. Please call us at +1 (754) 244-3993." |
| `/es/contact-us` | "No pudimos guardar su solicitud. Llámenos al +1 (754) 244-3993." |
| boletín en `/es/…` | "No pudimos guardar su suscripción. Llámenos al +1 (754) 244-3993." |

Y el de captcha, vía API, con el secreto que rechaza: `"Verification failed. Please try
again."` en EN, `"La verificación falló. Inténtelo de nuevo."` en ES — que son
literalmente las cadenas que ya existían en `i18n.ts` (`errores.captcha`, líneas 181 y
515).

Para que no dependa del `Referer` —que algunos navegadores quitan— cada formulario manda
ahora un campo `lang` explícito. `idiomaDe()` ya lo prefería; no hubo que tocar servidor.

**Efecto lateral bueno:** el rechazo por PII (422) también era invisible y ahora llega a
la persona con el canal seguro al que llamar.

## 10 · Claves — ✅

En Vercel, los tres targets:

```
PUBLIC_TURNSTILE_SITE_KEY    ['production','preview','development']  plain
TURNSTILE_SECRET_KEY         ['production','preview','development']  encrypted
```

El secreto **no aparece** en ningún artefacto construido:

```
$ grep -rl "<valor del secreto>" dist/ .vercel/ | wc -l
0
```

`.env` sigue fuera de git (`.gitignore:19` `.env*`, con `!.env.example`), y no está
trazado. `.env.example` documenta las dos variables sin valores. **Esto importa más que
de costumbre: el repositorio es público desde el 2026-07-31 (D16).**

**El aviso de claves desparejadas, probado de verdad.** Con secreto y sin clave pública,
ningún formulario emite token y el servidor rechazaría **todos** los envíos con 403, sin
más síntoma que dejar de recibir leads. Por eso el build avisa. Comprobado forzando el
estado:

```
$ PUBLIC_TURNSTILE_SITE_KEY="" npm run build
[turnstile] CLAVES DESPAREJADAS: PUBLIC_TURNSTILE_SITE_KEY NO, TURNSTILE_SECRET_KEY si.
Con secreto y sin clave publica el servidor rechaza TODOS los envios con 403.
```

---

## Registro, para poder distinguir «menos spam» de «estamos bloqueando gente»

Cada envío deja una línea con el motivo, pase o no:

```ts
console.warn(`[lead] captcha ${captcha.motivo} (ip ${ip})`);
```

Valores: `ok` · `sin-token` · `token-invalido` · `sin-clave` · `http-<código>` ·
`error-red` · `respuesta-rara`. Se registra **siempre**, no solo los rechazos: contar
rechazos sin el denominador no distingue las dos situaciones.

> **No conseguido:** no he podido leer los logs de ejecución desde aquí. El toolkit de
> Vercel disponible por Composio solo devuelve eventos de *build*
> (`VERCEL_GET_DEPLOYMENT_LOGS2` responde `{"logs":[]}`), y la CLI de Vercel está
> prohibida por `CLAUDE.md`. Se ven en el panel: proyecto → Logs, filtrando por
> `captcha`. Lo que sí está comprobado es que ninguna respuesta HTTP fue un error
> inesperado: los únicos 500 son el fallo de Sanity ya conocido del criterio 2.

## El fail-open, revisado

Se mantiene tal como lo documenta el fichero, porque el criterio es correcto: un captcha
caído no puede dejar al despacho sin leads.

| Situación | Antes | Ahora |
|---|---|---|
| Sin `TURNSTILE_SECRET_KEY` | pasa | pasa (igual) |
| **Sin token, con clave** | **pasa** | **403** ← el bug |
| Cloudflare 5xx | pasa | pasa (igual) |
| Cloudflare inalcanzable / timeout | pasa | pasa (igual) |
| Cloudflare dice `success:false` | 403 | 403 (igual) |
| **200 sin campo `success`** | **pasa y se firma como «verificado»** | pasa, sin firmar |

Ese último era un hueco secundario: una respuesta rota del proveedor se registraba como
un lead comprobado que nadie había comprobado. Ahora se trata como avería —se deja pasar,
que es la política— pero no se firma.

---

## Lo que necesito de ti, en el panel de Cloudflare

**Composio no puede crear el widget.** El toolkit de Cloudflare no tiene ninguna
herramienta de Turnstile (solo túneles, monitores, pools y DNS), y además la credencial
conectada está rota: `Invalid format for X-Auth-Key`, código 6103. No he improvisado con
otra API.

1. Cloudflare → **Turnstile** → *Add widget*
2. Hostnames: `accounting-max-services.vercel.app`, `accountingmaxservices.com`,
   `www.accountingmaxservices.com` — los dos últimos ahora, para no tener que tocarlo
   cuando se conecte el dominio
3. Modo **Managed**
4. Pásame el site key y el secret

Yo cambio las dos variables en Vercel y redespliego. **No hay que tocar código.**

Después del cambio conviene repetir dos cosas: el paseo con teclado del criterio 8 (con
widget real ya hay `iframe`) y un envío humano de cada formulario.

## Limpieza pendiente

- El `.env` local tiene las claves de prueba; sustituirlas al mismo tiempo que las de
  Vercel.
- `errores.captcha` sigue duplicado en tres sitios (`i18n.ts:181/515`, `lead.ts:340`,
  `newsletter.ts:66`), hoy idénticos byte a byte. No lo he unificado porque el encargo
  pedía tocar lo mínimo, pero es una trampa para el próximo que cambie el texto.
