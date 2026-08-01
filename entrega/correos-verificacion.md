# Los dos correos del formulario — entrega y verificación

**Commit:** `f5cfa6d` · **Desplegado:** 1-ago-2026 13:14 ET, deploy `dpl_AurFRtGTSDbyazNzYFprpHUenU7S` READY
**Ficheros:** `src/lib/correo.ts` (nuevo) · `src/pages/api/lead.ts` · `src/lib/i18n.ts` (3 líneas de comentario) · `tools/correo-check.mjs` (nuevo)

---

## Qué cambia

| | Antes | Ahora |
|---|---|---|
| **Acuse al prospecto** | **no existía** | HTML de marca, en su idioma, a la dirección que escribió |
| **Aviso al despacho** | lista de texto plano | HTML con lo accionable arriba y los consentimientos destacados |

El acuse dice a la persona que su consulta llegó, le devuelve lo que envió, le da el
plazo (**un día hábil**) y un botón para llamar. Es **transaccional**: sin enlace de baja
(CAN-SPAM no lo exige y ponerlo lo convertiría en marketing), sin nada que suene a
asesoría fiscal, y sin devolver ni un dato que no escribiera la persona.

El aviso pone el nombre, el teléfono y el correo arriba como botones pulsables, y saca
los dos consentimientos de la lista: bajo **FTSA/TCPA** deciden si es legal descolgar el
teléfono, así que van a ancho completo, en rojo, con símbolo y con etiqueta —el color
solo no vale (WCAG SC 1.4.1) y Gmail en oscuro puede invertirlo—. La fecha ISO, la IP y
el `_id` siguen estando en letra pequeña: son la prueba fechada del consentimiento.

---

## Verificado

| Comprobación | Resultado |
|---|---|
| `node tools/correo-check.mjs` (≈70 asertos) | ✅ `OK: todo pasa` |
| `npm run build` | ✅ limpio; `correo.ts` entra en la función, `nodemailer` sigue empaquetado |
| Ningún secreto en `.vercel/output/` | ✅ comprobado contra los 3 valores reales |
| Render a 320 px, claro y oscuro | ✅ 0 px de desborde; el botón pasa a ancho completo |
| Logo | ✅ el PNG del CDN de Sanity carga en navegador real (el SVG original no lo pinta ningún cliente) |
| Con imágenes bloqueadas | ✅ la cabecera sigue diciendo *Accounting Max Services* como texto |
| SMTP | ✅ `verify: true`, `250 2.0.0 OK`, `accepted`, `rejected: []` — con el HTML real |
| **Fallo de correo no pierde el lead** | ✅ las **dos** ramas: `SMTP_HOST` inválido y `SMTP_USER` ausente → **200** y lead guardado |
| `/api/newsletter` intacto | ✅ 200, sigue saliendo en texto plano (no pasa `html`) |
| Producción, 2 envíos reales con Turnstile real | ✅ EN sin consentimientos y ES con llamada; los dos guardados en `leads` |

**Un agujero encontrado y cerrado por el camino.** `RE_EMAIL` (`lead.ts:186`) no excluye
`?` ni `&`, y en un `mailto:` son separadores de cabecera:
`a?subject=X&body=Y@ejemplo.com` pasa la validación, y al pulsar el botón del aviso se le
habría abierto al despacho el cliente de correo con **un asunto y un cuerpo escritos por
un desconocido**. `hrefMail()` los percent-codifica. Lo mismo con `phone`, que solo se
valida contando dígitos.

## La última milla — confirmada por Sebastian

Yo no pude comprobar la recepción con las herramientas de esta sesión: el buscador de
Gmail vía Composio devuelve resultados inconsistentes (la misma consulta dio 2 y luego 0
para mensajes que existen), no había Chrome conectado, y el API de logs en runtime de
Vercel devuelve `{"logs": []}`. Mi verificación llegaba hasta el `250 OK` de Gmail.

**Sebastian lo cerró a mano el 1-ago-2026, revisando `info@accountingmaxservices.com`:**

| # | Comprobación | Estado |
|---|---|---|
| 1 | Los dos correos **llegan** a `info@` | ✅ confirmado |
| 2 | **Responder** al aviso escribe **al lead**, no a `info@` — no regresión de `replyTo` | ✅ confirmado |
| 3 | Modo oscuro en Gmail móvil y Apple Mail | sin comprobar en cliente real (sí en navegador) |
| 4 | Pulsar el botón verde en un móvil abre el marcador | sin comprobar en móvil real |

Los dos que importaban están cerrados. Los dos que quedan son cosméticos y de bajo
riesgo: el modo oscuro está verificado en navegador con `prefers-color-scheme: dark`, y
el `tel:` está verificado como `href` bien formado (solo dígitos) por el self-check.

## Limpieza — hecha

Los **7** documentos de prueba borrados el 1-ago-2026 con autorización expresa de
Sebastian: los 6 de esta sesión y el de las 16:07 (`J8e1BGaYR6YZtHxrPrah0O`, nombre
«sebastian», mensaje `test`), que era la prueba tras conectar el SMTP a las 11:49.

**Método, y es el que hay que repetir siempre:** borrado **por `_id` exacto**, con una
comprobación documento a documento antes de cada `delete`. Nunca por consulta — un
`*[_type=="lead"]` contra un dataset vivo es como se pierden leads de verdad.

> **El dataset `leads` queda a 0 documentos.** A partir de aquí, todo lo que aparezca
> ahí es un lead real de un contribuyente.

## Pendiente de decisión

- El asunto del aviso se deja igual que hoy (`Nuevo lead: {nombre}`) por si hay un filtro
  de Gmail montado encima. Cambiarlo a bilingüe es una línea.

---

## ⚠️ Para el cliente, y esto no lo cierra un desarrollador

**D4 sigue abierto.** El aviso GLBA de `/privacy-policy` es un **borrador sin revisar por
abogado**, con huecos `{{PENDIENTE}}` visibles, y el sitio **ya almacena y envía por
correo PII de contribuyentes**. Un preparador de impuestos es *financial institution*
bajo la **Gramm-Leach-Bliley Act**.

**Este trabajo empeora la exposición y hay que decirlo:** añade un segundo correo con
datos personales dentro y, sobre todo, convierte `/api/lead` en un aparato que **envía
correo desde el dominio del despacho a una dirección que elige quien rellena el
formulario**. Hoy lo frenan Turnstile, el honeypot, el time-trap, el límite de 5 envíos
por IP cada 10 minutos y el tope de 5.000 caracteres; además, el eco del mensaje en el
acuse **se recorta a 600 caracteres** justamente para acotar la carga útil. El riesgo
residual es pequeño, pero es nuevo y es real.

**Lo cierra un abogado de Florida, no una sesión de código.**
