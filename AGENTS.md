## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Publicacion — autorizada por defecto

Vigente desde 2026-07-31 (D15 en DECISIONS.md).

> 🚨 **Roto ahora mismo (D16, 2026-07-31): el auto-deploy vía Git NO funciona.** Vercel
> Hobby rechaza construir desde un repo privado propiedad de una organizacion de GitHub
> (`Senavia-Corp` lo es), y el repo es privado desde D14. Cualquier push a `main` desde
> ahora falla en Vercel con "Cannot deploy from a private GitHub organization repository
> on the Hobby plan" — produccion queda congelada en el ultimo commit que si desplego
> (`ae9ccde`). Comprobar el estado del commit (`gh api repos/Senavia-Corp/accounting-max-services/commits/<sha>/status`)
> despues de CADA push hasta que D16 se resuelva. No asumir que "sube solo" de la regla
> de abajo sigue siendo cierto.

- Cuando D16 este resuelto: cualquier sesion puede commitear, fusionar, subir a `main` y
  confiar en que Vercel despliega solo a produccion via integracion Git, sin pedir
  permiso cada vez.
- El proyecto Vercel YA existe (`prj_D755iZtk3M0g1wCylmYs6CA9JWtI`, plan Hobby, ver D6 en
  DECISIONS.md) y despliega `accounting-max-services.vercel.app`. **No crear un proyecto
  nuevo.**
- **Nunca instalar la CLI de Vercel ni usar un MCP de Vercel generico.** `ACCOUNTS.md`
  documenta por que: `vercel login` crearia una octava identidad conflictiva, y el MCP de
  Vercel disponible por defecto resuelve a la cuenta de otro cliente (Manuel Ramirez /
  GQM, `team_rtKW2Pw4fLvbavehX9tF3W9Q`). La unica via correcta para leer o tocar el
  proyecto Vercel de este cliente es Composio con `--account accounting-max-services`
  explicito en cada llamada.
- ANTES de cada push: si el cambio toca codigo (no solo Markdown), `npm run build` tiene
  que pasar limpio.
- DESPUES de cada despliegue: comprobar que la portada y una ruta de servicio responden
  200 en la URL de produccion.

## Lo que sigue necesitando permiso expreso, y por que

- **El repositorio de GitHub debe permanecer PRIVADO siempre.** Ya se filtro a publico una
  vez por una transferencia de cuenta (D8, 2026-07-28) y ha vuelto a ocurrir desde
  entonces. Verificar la visibilidad (`gh api repos/Senavia-Corp/accounting-max-services
  --jq .visibility`; sin sesion iniciada debe dar 404) tras cualquier transferencia,
  cambio de plan de organizacion o reconexion de la Vercel GitHub App (D14 tiene el
  procedimiento exacto de arreglo). Nota: los metadatos de deployment de Vercel
  (`githubRepoVisibility`) quedan cacheados del momento en que se conecto la integracion
  — no son una senal en vivo, no usarlos solos.
- **Subir `SANITY_WRITE_TOKEN` a Vercel.** Hoy solo vive `SANITY_READ_TOKEN` en los tres
  targets, a proposito: el dataset `production` de Sanity es publico (B3), y sin un
  dataset de leads aparte y privado, el token de escritura convertiria cada envio de
  formulario en PII de un contribuyente expuesta sin token. Se sube solo cuando B3 + B2 +
  SMTP esten resueltos — ver `entrega/release-verificacion.md` §5.
- **El "corte"** — Team Pro, dominio propio del cliente, conexion DNS — esta BLOQUEADO por
  decision expresa de Sebastian (D6) hasta que exista un Team en Pro con propietario en
  el dominio del cliente. No es un permiso simple a pedir: es un prerrequisito de cuenta
  que no existe todavia.
- Escribir en Sanity mas alla del token Editor ya emitido, o cualquier cambio de rol/CORS
  (B2).
- `git push --force` o reescribir historia remota, siempre.
- Commitear `.env`, `ACCOUNTS.md`, `DECISIONS.md` o cualquier valor de clave.
- Cambiar el `noindex` de las rutas legales o el contenido de `robots.txt` mas alla de lo
  que D3/D4 ya autorizaron.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
