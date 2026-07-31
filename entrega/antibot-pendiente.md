# Antibot — lo que queda bloqueado hasta que el dominio esté en Cloudflare

Fecha: 2026-07-31. Complemento de `entrega/antibot-verificacion.md`.

## Por qué está bloqueado

Cloudflare **no está en el camino del tráfico** de este sitio. Estado actual:

```
Nameservers de accountingmaxservices.com : ns-cloud-e1..e4.googledomains.com
El dominio apunta a                       : proxy-ssl.webflow.com
El sitio nuevo vive en                    : accounting-max-services.vercel.app
```

Todo lo que Cloudflare hace en el **borde** —inspeccionar la petición antes de que llegue
al origen— exige que sus nameservers sean los del dominio. Mientras el DNS lo sirva Google
y el tráfico vaya a Webflow, Cloudflare no ve ni una petición y ninguna regla suya puede
aplicarse.

**Turnstile es la excepción, y por eso es lo único que se ha podido hacer:** es un
producto independiente que funciona en cualquier hosting, incluido `*.vercel.app`, porque
la verificación la hace el servidor de la aplicación llamando a `siteverify`, no el borde.

> Mover los nameservers es una migración de dominio y está **fuera** de este encargo. No
> se ha tocado DNS.

---

## Lo que se desbloquea cuando el dominio esté en Cloudflare

Ordenado por lo que más aporta a este sitio.

### 1 · WAF — reglas de firewall

Reglas propias sobre la petición antes de llegar a Vercel. Para este sitio, las tres que
valen la pena:

- Bloquear `POST` a `/api/lead` y `/api/newsletter` cuyo `Origin` no sea el dominio
  propio. Hoy eso lo hace Astro dentro de la función (y funciona: devuelve 403 `text/plain`,
  lo vimos en la verificación), pero en el borde no llegaría a gastar invocación.
- Bloquear por país o ASN si aparece spam concentrado. Es un despacho de Coral Springs:
  el tráfico legítimo desde fuera de EE. UU. es escaso, pero **no cero** (clientes
  hispanohablantes en el extranjero), así que esto es a la vista de los datos, no a priori.
- Reglas sobre user-agent y ausencia de cabeceras típicas de navegador.

### 2 · Rate limiting de borde

Sustituiría, o mejor complementaría, al límite en memoria de
`src/lib/antibot.ts:limitePorIp`. La diferencia importa:

| | Hoy (en la función) | Con Cloudflare (borde) |
|---|---|---|
| Estado | en memoria de **cada instancia** | compartido y real |
| Efecto de escalar | cada instancia nueva empieza a cero | ninguno |
| Coste del ataque | consume invocación de Vercel | se corta antes |
| Reinicios | se pierde en cada arranque en frío | persistente |

El límite actual (5/10 min en lead, 3/10 min en boletín) **funciona** —está medido, da
429 con `retry-after`— pero es aproximado por diseño: un atacante con paciencia se
beneficia de que las instancias se reciclen. Está documentado así en el propio fichero
(D6). En el borde deja de ser aproximado.

### 3 · Bot Fight Mode / Super Bot Fight Mode

Detección de bots por reputación y huella JA3/JA4, antes del origen. Complementa a
Turnstile en vez de sustituirlo: Turnstile actúa **en el formulario**, esto actúa en
**toda** petición, incluidas las que ni pasan por un formulario (rastreo de rutas,
escaneo de `/api/*`, fuerza bruta sobre lo que sea).

Cuidado al activarlo: el modo básico bloquea también rastreadores legítimos. Hay que
revisar la lista de verificados antes de encenderlo, o se sale del índice de Google.

### 4 · Managed Challenge en rutas concretas

Reto gestionado sobre `/contact-us` y `/es/contact-us` cuando la puntuación de la petición
sea mala. Es un escalón por delante de Turnstile: el reto llega antes de que se pinte la
página, no al enviar.

### 5 · Analítica de seguridad

Cuántas peticiones se bloquean, de dónde y por qué regla. Hoy el único registro es el
`console.warn` con el motivo del captcha en los logs de la función, y eso solo ve lo que
ya llegó a la aplicación.

---

## Pendiente que NO depende de Cloudflare

### `appearance: "interaction-only"` — depende de D4

Arreglaría de golpe las dos pegas del widget en el pie: el orden de tabulación (quedaría
invisible hasta que hiciera falta) y el desplazamiento de maquetación.

**Bloqueado por D4, no por lo técnico.** Cloudflare exige, para los modos no visibles,
citar su *Turnstile Privacy Addendum* en la política de privacidad. Hoy `/privacy-policy`
es un borrador con `noindex` que ningún abogado ha revisado. Añadir una obligación de
divulgación a un documento sin firmar es exactamente lo que D4 prohíbe. Un widget visible
se autodeclara y no crea esa obligación.

**Revisar en cuanto D4 cierre.**

### Turnstile en la política de privacidad

Aunque el widget siga visible, la política debería nombrar a Cloudflare como tercero
cuando se revise. La fachada limita la exposición —no se contacta con Cloudflare hasta que
alguien toca un formulario— pero no la elimina.

Además, **`DECISIONS.md` no menciona Turnstile todavía**. Merece una entrada propia.

### CSP

Hoy no hay ninguna cabecera `Content-Security-Policy` en el repositorio, así que no hubo
nada que ajustar. Si algún día se añade, tiene que permitir:

```
script-src  https://challenges.cloudflare.com
frame-src   https://challenges.cloudflare.com
```

Sin eso, los dos formularios dejan de funcionar **en silencio**: el script no carga, no
hay token, y el servidor responde 403 a todo.

### Criterio 2 — el camino completo del lead

Fuera del alcance de este encargo, pero es lo que de verdad falta para que un lead llegue
a alguien. En orden:

1. Dataset `leads` privado en Sanity (rol administrator — bloqueo **B2**) y
   `SANITY_LEADS_DATASET=leads` en los tres targets.
2. Credenciales SMTP del dominio del cliente, alineadas con su SPF/DKIM. **No un Gmail
   personal con App Password**: es la cuenta de una persona, se cae cuando esa persona
   cambia la contraseña, y en el traspaso el cliente no la recupera.
3. `npm i nodemailer`, y **entonces** sí `SANITY_WRITE_TOKEN` en Vercel.

El orden importa: subir el token antes de tener el dataset privado convierte cada envío
en PII de un contribuyente en un dataset público. Con el repositorio ya público (D16),
**B3 es más urgente que antes**, porque el historial describe el problema a la vista de
cualquiera.

---

## Resumen para decidir

| Quiero… | ¿Se puede hoy? | Qué hace falta |
|---|---|---|
| Captcha en los formularios | ✅ hecho | — |
| Widget real en vez de claves de prueba | ✅ | 5 min tuyos en el panel de Cloudflare |
| Widget invisible en el pie | ❌ | cerrar D4 (política de privacidad revisada) |
| WAF, Bot Fight, rate limit de borde | ❌ | mover los nameservers a Cloudflare |
| Que el lead llegue a Sanity y al correo | ❌ | B2 + B3 + SMTP del cliente |
