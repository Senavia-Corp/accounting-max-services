# Publicación — pasos, sin ejecutar

**El corte de dominio sigue sin ejecutarse.** Ni cambio de DNS, ni Team Pro, ni dominio
propio en Vercel. Todo lo de abajo (bloqueos 1-8) sigue siendo el guion para cuando se
decida cortar. Lo que **sí** cambió — la previsualización en la cuenta Hobby que D6 ya
autorizó — está en la sección 0.

`.vercel/project.json` **no existe en este checkout** — lo que hay en `.vercel/` es solo
`output/`, la salida del adapter, que se regenera en cada `npm run build`. Este checkout
**no está vinculado** por CLI (y no debe estarlo — ver AGENTS.md/D15: instalar la CLI de
Vercel crearía una octava identidad conflictiva). El proyecto en sí ya existe y despliega
por integración Git; ver sección 0.

---

## 0 · Estado del despliegue Hobby ya autorizado (no es el corte) — verificado 2026-07-31

- **Repo GitHub privado**, reconfirmado por esta sesión con tres métodos independientes
  antes de tocar nada: `gh api .../accounting-max-services --jq .visibility` → `private`;
  API sin autenticar → 404; web sin autenticar → 404. El repo había vuelto a quedar
  público (recaída de D8) y otra sesión lo corrigió el mismo día — ver **D14** en
  `DECISIONS.md` para el procedimiento exacto y **D15** para esta reconfirmación
  independiente y por qué los metadatos de despliegue de Vercel (`githubRepoVisibility`)
  no sirven para detectar esto por sí solos.
- **Producción sigue Ready:** `accounting-max-services.vercel.app` responde 200 en
  portada y en `/es`, 404 en ruta inexistente (comprobado ahora, no solo por el informe de
  `release-verificacion.md` de más temprano hoy).
- **Un solo proyecto Vercel**, confirmado por `VERCEL_GET_PROJECTS` vía Composio (nunca
  CLI ni el MCP de Vercel genérico, que resuelve a la cuenta de GQM): `prj_D755iZtk3M0g1wCylmYs6CA9JWtI`.
  No se creó ningún proyecto nuevo.
- **Variables de entorno confirmadas por API**, no solo por archivo: `SANITY_READ_TOKEN`
  en los tres targets. **`SANITY_WRITE_TOKEN` sigue sin subir, a propósito** — subirlo
  antes de resolver B3 armaría el fallo de formularios en vez de arreglarlo (ver
  `release-verificacion.md` §5). No se subió en este encargo tampoco, pese a que el
  encargo original lo pedía.
- **`AGENTS.md` ya tiene la autorización permanente de publicación** (D15): push/merge a
  `main` sin pedir permiso cada vez, siempre vía Composio `--account
  accounting-max-services`, nunca CLI ni MCP genérico de Vercel. Cubre commit/merge/push
  y la verificación post-deploy. **No cubre** el corte de dominio (sigue bloqueado por
  D6), ni subir `SANITY_WRITE_TOKEN`, ni escribir en Sanity más allá del token Editor.
- **🚨 Integración Git ROTA con el repo privado — descubierto por el push real de esta
  sesión.** El commit `3dc05cf` se empujó a `main` y Vercel lo rechazó de inmediato:
  `"Cannot deploy from a private GitHub organization repository on the Hobby plan"`.
  **La producción sigue sirviendo `ae9ccde`** (el último commit que se desplegó mientras
  el repo aún era público) y **ningún push futuro se publicará solo** hasta resolver
  esto. Detalle completo y las tres salidas posibles, ninguna elegida, en DECISIONS.md
  **D16**.

## Bloqueos que van ANTES del corte

Ninguno es opcional. Están razonados en `DECISIONS.md`; aquí solo el efecto.

| | Bloqueo | Si se ignora |
|---|---|---|
| **D8** | La Vercel GitHub App no está instalada en la org `Senavia-Corp` con acceso al repo | `Failed to create project (status 400)`. **Es lo primero, sin esto no hay nada** |
| **D6** | La cuenta está en **Hobby**, facturada a `ananavia746@gmail.com` (Gmail personal) | Hobby **prohíbe uso comercial**; un sitio que capta leads para un despacho fiscal lo es. Sanción: suspensión. Y en el traspaso el cliente no recupera la cuenta sin ese buzón |
| **B3** | El dataset `production` es **público** (`aclMode: "public"`) | El primer lead que entre es **PII de contribuyentes expuesta en internet**. Bloquea los formularios, no el sitio estático |
| **D9** | El kit Typekit `blq3zch` está restringido por dominio | Sin añadir el dominio, **todos los titulares caen a `sans-serif`**. Parecerá un port de CSS mal hecho. No lo es |
| **D4** | Sin política de privacidad ni aviso GLBA revisados | Un preparador de impuestos está obligado a publicarlo antes de recoger un dato |
| **B1** | Sin acceso a la zona de Google Cloud DNS | No hay migración posible. Y cada día sin verificar Search Console es línea base perdida **para siempre** |
| **B4** | Sin token de Webflow | Las **submissions históricas de los formularios se pierden al cancelar la cuenta**. Recuperarlas antes, pase lo que pase |

---

## 1 · Desbloquear D8

Con sesión en Vercel como la cuenta `accounting-max-services`:

1. Abrir `https://github.com/apps/vercel/installations/new` y elegir la **organización
   `Senavia-Corp`** — no la cuenta personal `senaviacorp`.
2. **Only select repositories** → `accounting-max-services`.
3. Avisar. A partir de ahí el proyecto se puede crear ya enlazado.

El repo (`https://github.com/Senavia-Corp/accounting-max-services`) es **privado** y debe
seguir siéndolo: contiene `ACCOUNTS.md` con IDs de cuentas del cliente. Ya pasó una vez que
una transferencia lo dejó público — GitHub no conserva la visibilidad al cambiar de dueño.

**Por qué Git y no subir ficheros:** el despliegue por Composio **no transporta binarios**.
Las 6 fuentes `.ttf` y el favicon salían corruptos o a 0 bytes. Está documentado con las
tres variantes probadas en `tools/deploy.py`.

## 2 · Cuenta y plan (D6)

Antes del corte tiene que existir un **Team en plan Pro** cuyo propietario sea una cuenta
del dominio del cliente — `info@accountingmaxservices.com` sirve, el dominio ya corre
Workspace. El movimiento de cuenta se hace **antes** de la FASE 7, nunca durante.

En Hobby, además, el rate limiting por IP de los formularios hay que escribirlo a mano: el
de plataforma es de tier Pro.

## 3 · Variables de entorno, por target

En Vercel → Settings → Environment Variables. **Marcar los tres targets** (Production,
Preview, Development) salvo donde se indique.

| Variable | Valor | Por qué |
|---|---|---|
| `SANITY_WRITE_TOKEN` | token rol Editor de `ep5i6co1` | **Obligatoria: sin ella el build FALLA en voz alta.** `assertContenido()` en `src/lib/sanity.ts` la exige. El dataset no es legible sin token pese a figurar como `public`: anónimo devuelve solo los 63 assets y **0 documentos**, así que sin token el sitio se construiría con 0 servicios y 0 posts, en silencio |
| `PUBLIC_SANITY_PROJECT_ID` | `ep5i6co1` | Opcional — `sanity.ts` ya cae a este valor. Explicitarlo evita sorpresas |
| `PUBLIC_SANITY_DATASET` | `production` | Igual. **Cambiar aquí si B3 se resuelve creando un dataset aparte** |

No son secretos los dos `PUBLIC_*`: el `projectId` viaja en el bundle de cualquier sitio
hecho con Sanity. El token **sí** lo es — no commitearlo nunca, y anotar su rotación en el
registro de secretos de `ACCOUNTS.md`, no en el repositorio.

El token debe subir a **Administrator** (B2) para desplegar el Studio y poner los CORS; con
Editor basta para construir.

## 4 · Vincular y primer despliegue

```bash
vercel link                 # crea .vercel/project.json
vercel env pull .env.local  # comprobar que bajan las tres
vercel --prod=false         # preview primero, SIEMPRE
```

`astro.config.mjs` ya trae `adapter: vercel()` y `output: "static"`, así que Vercel detecta
Astro sin configuración. **No añadir `vercel.json`**: la paridad de URL la da
`trailingSlash: "never"`, que el adapter traduce a la primera regla de
`.vercel/output/config.json` (`^/(.*)/$` → 308). Un `vercel.json` a mano la pisaría.

**Las previews `*.vercel.app` piden SSO** (`ssoProtection: all_except_custom_domains`).
Para medir Lighthouse o verificar con `curl`, usar el secreto de bypass:
cabecera `x-vercel-protection-bypass: <secreto>`, o `?x-vercel-set-bypass-cookie=true` en
navegador. **Al borrar y recrear el proyecto hay que regenerarlo** (D10) y anotarlo en
`ACCOUNTS.md`.

Los dominios propios quedan **exentos** de ese SSO, así que producción no se ve afectada.

## 5 · Dominio: apex → www conservando la ruta

Estado real hoy (`baseline/dns.md`, capturado 2026-07-28):

```
NS      ns-cloud-e{1..4}.googledomains.com     ← Google Cloud DNS, NO Cloudflare
A       75.2.70.75 · 99.83.190.102             ← apex, Webflow
CNAME   www → proxy-ssl.webflow.com            ← www, Webflow
```

La canonicalización verificada en producción es **apex → www conservando la ruta**, y por
eso `astro.config.mjs` fija `site: "https://www.accountingmaxservices.com"`.

Pasos:

1. En Vercel → Domains, añadir **`www.accountingmaxservices.com` como dominio principal** y
   **`accountingmaxservices.com` redirigiendo a www**. Vercel conserva la ruta en ese
   redirect; es justo el comportamiento que hay que replicar.
2. En Google Cloud DNS:
   - `www` CNAME → `cname.vercel-dns.com.` (**sustituye** a `proxy-ssl.webflow.com`)
   - apex A → `76.76.21.21` (**sustituye** a los dos A de Webflow)
   - Confirmar el valor exacto en el panel de Vercel: cambian.
3. **NO TOCAR NUNCA `MX`, `TXT` de SPF ni el DKIM.** El correo del despacho vive en esta
   misma zona: 5 registros MX de Google, `v=spf1 include:_spf.google.com ~all` y el
   selector DKIM. Tocarlos tumba el correo del cliente.
4. Bajar el TTL a 300 s **unas horas antes** del corte, y subirlo después. Hoy está en
   14400 s (4 h): sin bajarlo, un error tarda cuatro horas en revertirse.

## 6 · Certificado

Vercel lo emite solo por ACME en cuanto el DNS resuelve. **No hay registro CAA** en la
zona (verificado: vacío), así que nada bloquea la emisión. Emitir para **los dos** nombres,
apex y www — el redirect del apex también necesita su certificado o el navegador avisa
antes de redirigir.

Ventana realista: minutos tras propagar, pero contar con el TTL.

## 7 · Search Console — hacerlo el primer día (B1)

**GSC nunca rellena datos hacia atrás.** Cada día sin verificar es línea base perdida para
siempre, y como el sitio no tiene **ninguna** analítica (D7: ni GTM, ni GA4, ni Ads, ni
Meta, ni Clarity), GSC sería la **única** evidencia posible de que el corte no dañó el
tráfico.

Pedir propiedad de **Dominio** (`sc-domain:`) por TXT, no de prefijo de URL: cubre apex +
www + http/https con un solo registro, que es exactamente lo que encaja con la
canonicalización.

Enviar `https://www.accountingmaxservices.com/sitemap-index.xml`. Trae **26 URLs**: las 54
rutas menos las 26 en `/es` y menos `/privacy-policy` y `/terms`. **Está bien así** y está
razonado en `astro.config.mjs` — no es un fallo del sitemap.

## 8 · Después del corte

- **`accounting-max-services.webflow.io` sigue vivo, indexable y es un duplicado completo**:
  200, `robots.txt` de 0 bytes, sin `noindex`, sin `x-robots-tag`. Despublicarlo o ponerle
  `noindex` **el mismo día**.
- **Rescatar las submissions de Webflow ANTES de cancelar** (B4). Se pierden para siempre.
- **No existe registro DMARC** (`_dmarc` → NXDOMAIN) con Workspace activo y DKIM bien
  publicado. Es un hueco de seguridad de correo independiente de esta migración, pero
  conviene cerrarlo.
- Cuando D3 se firme: **borrar** (no cambiar por `Allow`) el `Disallow: /es/` de
  `public/robots.txt`, quitar el `noindex` de las rutas ES y meterlas en el sitemap.

## Comprobación mínima tras el corte

```bash
curl -sI https://accountingmaxservices.com/about-us | grep -i "^location"   # -> https://www.…/about-us
curl -sI https://www.accountingmaxservices.com/about-us/ | grep -i "^HTTP\|^location"  # -> 308 a /about-us
curl -s https://www.accountingmaxservices.com/ | grep -c 'og:image'         # -> 1
curl -sI https://www.accountingmaxservices.com/og-default.png | grep -i "^content-type"  # -> image/png
```

Y a ojo: que los titulares **no** salgan en `sans-serif`. Si salen, es D9 y no el CSS.
