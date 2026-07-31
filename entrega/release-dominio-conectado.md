# El dominio está conectado y el sitio publicado

**Fecha:** 31 de julio de 2026 · **Producción:** `dd20e9c`
**URL pública:** <https://www.accountingmaxservices.com>

Sustituye a `release-pendiente-dominio.md`, que describía el corte como pendiente.
El corte se ejecutó. Todo lo de abajo está medido **sobre el dominio**, no sobre
`*.vercel.app`.

---

## Estado

| | |
|---|---|
| **54 rutas** | 200 · 0 fallos |
| **Paridad con el sitio antiguo** | 26/26 rutas EN en la misma ruta · **0 redirecciones necesarias** |
| **apex → www** | 308, conservando la ruta |
| **`/ruta/` → `/ruta`** | 308 |
| **Certificados** | Let's Encrypt, emitidos el 31-jul, válidos hasta el 29-oct, para www **y** apex |
| **canonical** | autorreferente en las 54 · 0 apuntando a `*.vercel.app` |
| **sitemap** | 200 · **52 URLs** (26 EN + 26 ES) · 0 legales |
| **robots.txt** | 200 · `Sitemap:` declarado · `Disallow: /api/` |
| **noindex** | **2** — solo `/privacy-policy` y `/terms` (D4) |
| **hreflang** | recíproco en las 52 rutas indexables: `en`, `es`, `x-default` |
| **Correo** | **intacto** — MX (5), SPF y DKIM idénticos a la línea base del 28-jul |
| **Lighthouse escritorio** | Perf **99** · A11y **97** · BP **100** · SEO **100** · CLS **0** |

## Lo que cambió respecto al release anterior

**D3 se firmó** (commit `ae9ccde`, de otra sesión), y con él las cuatro cosas que iban
juntas: el `noindex` sale de las 26 rutas `/es`, el sitemap pasa de 26 a 52 URLs, aparece
el `hreflang` recíproco y desaparece el `Disallow: /es/` de `robots.txt`. Los documentos
anteriores dicen «28 noindex» y «26 URLs en el sitemap»: eran correctos el 31 de julio
por la mañana y dejaron de serlo esa misma tarde.

**D16 se resolvió abriendo el repositorio.** Ver `repo-publico-exposicion.md`.

**Un arreglo de accesibilidad** (`f1621f6`): el botón del selector de idioma mostraba
«EN» pero se anunciaba solo como «Language», y WCAG 2.5.3 (Label in Name, nivel A) pide
que el nombre accesible contenga el texto visible. Queda «Language: EN» / «Idioma: ES».
Lo detectó Lighthouse sobre el dominio; era una auditoría que antes ni aparecía, porque
el selector solo se publica con `ES_PUBLICO`, que se activó al firmar D3.

## Trampa de medición, por si alguien repite las comprobaciones

Durante las primeras horas el **resolver local seguía devolviendo Webflow** por caché,
mientras el autoritativo ya servía Vercel. Eso produjo dos falsos negativos: unos
certificados que parecían de Google Trust Services (eran los de Webflow) y un Lighthouse
de 90/89/96/91 que medía el sitio viejo. Con el DNS asentado: 99/97/100/100.

Para forzar la resolución correcta sin esperar al TTL:

```bash
curl --resolve www.accountingmaxservices.com:443:64.29.17.65 https://www.accountingmaxservices.com/
```

Y para comprobar el DNS real, preguntar al autoritativo, no al resolver del sistema:

```bash
dig +short @ns-cloud-e1.googledomains.com CNAME www.accountingmaxservices.com
```

## Lo que sigue abierto

| Asunto | Estado |
|---|---|
| 🔴 **ToS de Vercel** | Hobby prohíbe uso comercial y el sitio del despacho ya está vivo en su dominio. La sanción es **suspensión**, que tira la web abajo sin preaviso. Abrir el repo no lo tocó. **Subir a Pro es lo único que lo cierra** |
| 🔴 **B3** — dataset `leads` privado | Sube de prioridad: el historial público describe que está sin cerrar |
| 🔴 **D4** — privacidad y aviso GLBA | Un preparador de impuestos no puede recoger un dato sin publicarlo. Bloquea activar los formularios |
| **Formularios** | Siguen fallando en seco (500 + «llámenos»). Nada persiste. Necesitan B3 + B2 + SMTP + `nodemailer` |
| **Search Console** | Sin enviar. La conexión disponible solo tiene propiedades de otro cliente (AB Aluminum). Ver abajo |
| **Rotar `GEMINI_API_KEY`** | Pendiente desde el release anterior |
| **Webflow** | No cancelar sin rescatar antes las *submissions* históricas de sus formularios (**B4**): se pierden para siempre |
| Copy de los 12 servicios | Sigue sin estar vivo: solo se aplica con `CONTENIDO_LOCAL=1`. En producción esas fichas sirven el texto de Sanity |
| Contraste de marca 3,06:1 | Blanco sobre `#6da228` en todos los CTA. Techo de accesibilidad en 97. Decisión del cliente |
| Autor y fecha de los 10 posts | Sin resolver |
| Tamarac vs Coral Springs | Sede corregida. Falta decidir si Tamarac se nombra como zona atendida |

## Search Console — procedimiento

No se envió porque la cuenta Google conectada aquí solo tiene
`sc-domain:abaluminumandscreen.com` y `sc-domain:abaluminumandscreens.com`, que son de
**otro cliente**, y usar esa identidad para este dominio sería mezclar cuentas.

Cuando esté la cuenta del cliente:

1. Crear la propiedad de **dominio** `accountingmaxservices.com` (no la de prefijo de URL:
   la de dominio cubre apex, www, http y https de una vez).
2. Verificarla con el registro `TXT` que da Google, en la zona de Google Cloud DNS.
   **Añadir, no sustituir**: el `TXT` del apex ya tiene el SPF y borrarlo deja al cliente
   sin correo.
3. Enviar `https://www.accountingmaxservices.com/sitemap-index.xml` (52 URLs).
4. Revisar «Páginas» a los pocos días: lo que interesa vigilar es que las 26 rutas `/es`
   entren, ahora que D3 las abrió, y que `/privacy-policy` y `/terms` sigan fuera.
