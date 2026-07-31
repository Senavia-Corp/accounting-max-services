# El repositorio es público — qué quedó expuesto y qué cerrar primero

**Fecha:** 31 de julio de 2026 · **Decisión:** expresa de Sebastian, para recuperar el
auto-deploy bloqueado por D16.

`github.com/Senavia-Corp/accounting-max-services` pasó de privado a **público**. Se le
advirtió antes de hacerlo que esto descubre el **historial completo**, no solo el estado
actual, y que **no** resuelve el problema de ToS. Reafirmó la decisión y se ejecutó.

Este documento existe para que la exposición esté inventariada, no para discutirla.

---

## 1 · Lo que NO se filtró

Escaneados los **25 commits** del historial con
`AIza[0-9A-Za-z_-]{10}|sk-[A-Za-z0-9]{20}|sk[A-Za-z0-9]{40}`:

> **Cero credenciales.** Las coincidencias fueron blobs base64 de metadatos de imagen
> (`lqip`, `thumbHash`) en `baseline/import/*.ndjson` y en `og-default.png.ts`. Falsos
> positivos, verificados uno a uno.

Tampoco están, ni han estado nunca, en el historial:

- `.env` — cubierto por `.gitignore` (`.env*`) desde el primer commit.
- `ACCOUNTS.md` y `DECISIONS.md` — ignorados desde `caca5fe`. Viven en
  `~/outputs/accounting-max-privado/`.
- `SANITY_WRITE_TOKEN`, `GEMINI_API_KEY` o cualquier otro valor de clave.

`.env.example` sí es público, pero sus únicos valores son `PUBLIC_SANITY_PROJECT_ID` y
`PUBLIC_SANITY_DATASET`, que el propio fichero documenta como no secretos: el `projectId`
va en el bundle de cualquier sitio hecho con Sanity.

## 2 · Lo que SÍ quedó expuesto

No son credenciales: es **documentación que describe con precisión lo que todavía no
está protegido**. Para alguien que busque un objetivo, ahorra el trabajo de reconocimiento.

| Fichero | Qué revela |
|---|---|
| `entrega/release-verificacion.md` | Que el dataset `production` de Sanity es público (B3); que `SANITY_WRITE_TOKEN` está deliberadamente sin subir y qué pasaría si se subiera; las consultas GROQ anónimas que lo demuestran; los IDs de Sanity (`ep5i6co1`) y de Vercel (`prj_D755iZtk3M0g1wCylmYs6CA9JWtI`) |
| `entrega/release-pendiente-dominio.md` | La zona DNS completa, el plan de corte y el de marcha atrás |
| `AGENTS.md` | La estructura de cuentas, qué está autorizado y qué no, y por qué |
| `entrega/publicacion.md` | Historial de despliegue y decisiones de plataforma |
| `auditoria/*.md` | Hallazgos de la auditoría, incluidos los no corregidos |

**Borrarlos ahora no sirve de nada:** siguen en el historial, y sacarlos exigiría
reescribir historia y `git push --force`, que las reglas permanentes prohíben siempre.
Una vez público, además, hay forks, cachés y archivadores que ya no se controlan.

La consecuencia práctica: **el valor de cerrar B3 sube**, porque ahora está escrito
en abierto que está sin cerrar.

## 3 · Orden en el que conviene cerrar

1. **B3 — dataset `leads` privado en Sanity.** Es el que el documento público nombra.
   Necesita el rol administrator (B2). Hoy, medido, un lector anónimo obtiene 73
   documentos y **todos son `sanity.imageAsset`** — cero de contenido, así que la
   exposición real es más estrecha de lo que dice el bloqueo. Pero eso es comportamiento
   observado, no configuración garantizada, y ahora hay un documento público invitando a
   comprobarlo.
2. **Rotar `GEMINI_API_KEY`.** Sigue pendiente desde el release anterior. No está en el
   repo ni en Vercel, pero se expuso en un chat.
3. **ToS de Vercel — sigue sin resolver.** Ver abajo.
4. Revisar si alguna captura de `entrega/nav/` o `baseline/diseno/densidad/` muestra
   datos de cliente. Son recortes de maquetación de la web pública, así que en principio
   no, pero conviene mirarlo una vez.

## 4 · Lo que abrir el repo NO arregló

> **Vercel Hobby prohíbe el uso comercial, y el sitio del despacho ya está vivo en
> `accountingmaxservices.com`.**

Antes de conectar el dominio esto era discutible: eran previsualizaciones, es decir
desarrollo. Ahora es la web de producción de un negocio que capta clientes. La sanción
por incumplimiento es **suspensión de la cuenta**, y una suspensión tira abajo la web del
cliente sin preaviso.

Abrir el repositorio desbloqueó el auto-deploy (D16) y dejó este riesgo **exactamente
igual**. Subir a Pro lo cierra, y era además el prerrequisito que D6 fijaba para el
corte.

## 5 · Estado tras el cambio

| | |
|---|---|
| Visibilidad del repo | **público** — confirmado sin autenticar: `api.github.com` responde 200 |
| Auto-deploy | **funciona** — `dd3eb91` construyó y desplegó a producción |
| Commits que estaban atascados | `3dc05cf`, `cb3dbf7`, `f1621f6` — los tres ya desplegados |
| Producción | `dd3eb91`, READY |
| Regla de `AGENTS.md` «el repo debe permanecer PRIVADO siempre» | **anulada** por esta decisión. Conviene actualizarla o registrarla como D17 para que ninguna sesión futura la «arregle» volviéndolo privado y rompa el deploy otra vez |
