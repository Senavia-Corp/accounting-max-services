# Verificación del release — 31 de julio de 2026

**URL de producción:** <https://accounting-max-services.vercel.app>
**Commit desplegado:** `6fcd18c` · **Proyecto Vercel:** `prj_D755iZtk3M0g1wCylmYs6CA9JWtI`
**Dominio del cliente:** NO tocado. `accountingmaxservices.com` sigue sirviendo el Webflow antiguo.

Todo lo de abajo está medido **sobre la URL de producción**, no en local.

---

## Resultado: 11 de 12

| # | Criterio | Resultado |
|---|---|---|
| 1 | Deploy Ready, sin errores de build | ✅ |
| 2 | 54 rutas responden 200 | ✅ |
| 3 | Paridad de ruta con las 26 EN del sitio actual | ✅ |
| 4 | Consola, imágenes, enlaces y desbordes | ✅ |
| 5 | Formularios envían y llega el correo | ❌ **NO CUMPLIDO** |
| 6 | sitemap.xml y robots.txt | ✅ |
| 7 | canonical a `www.accountingmaxservices.com` | ✅ |
| 8 | 28 rutas con noindex intactas | ✅ |
| 9 | Todo en `origin/main`, árbol limpio | ✅ |
| 10 | `.env` fuera del repositorio | ✅ |
| 11 | Lighthouse móvil y escritorio | ✅ |
| 12 | Cero dominios en Vercel, cero DNS | ✅ |

---

## 1 · Despliegue

```
READY   sha=6fcd18c  rama=main
        accounting-max-services-kyxhm9iql-accounting-max-services.vercel.app
```

Desplegado por la **integración Git de Vercel**, disparada por el push a `main`.
No se instaló la CLI de Vercel: `ACCOUNTS.md:18` lo prohíbe porque `vercel login`
crearía una octava identidad y `vercel link` escribiría `.vercel/project.json` bajo
ella. El control se hizo por la conexión Composio `accounting-max-services`
(usuario `38vIWRaJFIpicVCxmY5UXZna`, `ananavia746@gmail.com`).

No se usó el MCP de Vercel: está autenticado contra `team_rtKW2Pw4fLvbavehX9tF3W9Q`,
que es **Manuel Ramirez / GQM** — identidad de otro cliente.

## 2 · Las 54 rutas

**54 comprobadas, 0 distintas de 200.** Reparto: 28 EN (portada + 5 estáticas +
12 servicios + 10 posts) y 26 ES.

Comportamiento de borde, también verificado:

| Prueba | Resultado |
|---|---|
| `/no-existe`, `/services/no-existe`, `/post/no-existe`, `/es/no-existe` | 404 real, ningún 500 |
| `GET /api/lead`, `GET /api/newsletter` | 405 explícito |
| `/about-us/` | 308 → `/about-us` |

## 3 · Paridad con el sitio actual

Las **26 rutas EN** de `baseline/urls-vivas.csv` responden 200 **en la misma ruta**.

> **0 divergencias → no hará falta ni un 301 cuando se conecte el dominio.**

Las dos únicas rutas EN nuevas son `/privacy-policy` y `/terms`, que no existen en
el sitio actual y nacen con `noindex` (D4).

## 4 · Consola, imágenes, enlaces, desbordes

Medido en portada, `/services/notary-public-services`,
`/post/understanding-tax-deductions`, `/about-us` y `/contact-us`, a **1440** y **375**.

| Comprobación | Resultado |
|---|---|
| Errores de consola | **0** |
| Peticiones de red fallidas | **0** |
| Imágenes rotas | **0** de 72 URLs únicas |
| Enlaces internos a 404 | **0** de 54 destinos únicos (2.351 enlaces recogidos en las 54 rutas) |
| Desborde horizontal a 1440 | **0 px** en las 5 |
| Desborde horizontal a 375 | **0 px** en las 5 |

Dos notas de método, porque la primera medición dio un falso positivo:

- El navegador reportó «1 imagen rota» y «80 pendientes». Era artefacto del panel
  oculto: sin render, las imágenes *lazy* nunca entran en viewport. La URL señalada
  responde 200 con un WebP válido de 4.352 bytes, comprobado con `curl`. Con render
  activo: 0 rotas.
- El primer conteo de elementos que sobresalen incluía las tarjetas del carrusel de
  reseñas. Están dentro de un *scroller* horizontal propio, que es su diseño. El
  chequeo definitivo ignora todo lo que cuelgue de un contenedor con `overflow-x`,
  y da 0.

Los 54 destinos internos únicos coinciden **exactamente** con las 54 rutas: el sitio
no enlaza a nada que no exista, ni deja ruta huérfana.

## 5 · Formularios — NO CUMPLIDO

**Estado medido.** Envío real a los dos endpoints, con `Origin` correcto y datos de
prueba evidentes:

```
POST /api/lead        → 500  {"ok":false,"error":"We could not save your request. Please call us at +1 (754) 244-3993."}
POST /api/newsletter  → 500  {"ok":false,"error":"We could not save your subscription. Please call us at +1 (754) 244-3993."}
```

Los endpoints están vivos y pasan CSRF, honeypot, *time-trap*, validación y filtro de
PII. Mueren en la escritura a Sanity. **Nada persistió** — consulta anónima posterior:
`count(*[_type=="lead"]) = 0`.

**Tres causas, ninguna resoluble en este encargo:**

1. `SANITY_WRITE_TOKEN` no está en Vercel — y **no se ha subido a propósito**. Es lo
   único que hoy mantiene el sitio seguro (ver abajo).
2. `nodemailer` no está instalado y no existe ninguna variable `SMTP_*` en `.env`,
   `.env.example` ni Vercel. `enviarAviso` devuelve siempre
   `{enviado:false, motivo:"sin-configuracion"}`. **No hay correo que pueda llegar.**
3. `SANITY_LEADS_DATASET` no está definida, así que `src/pages/api/lead.ts:112` cae a
   `production` (bloqueo **B3**).

> **Por qué no se subió el token, aunque el encargo lo pedía.** Subirlo *arma* el
> fallo en vez de arreglarlo: los formularios pasarían a guardar leads en el dataset
> de contenido en lugar de fallar. Sin token fallan en seco y el usuario ve un
> teléfono al que llamar; con token, y hasta que `SANITY_LEADS_DATASET` apunte a un
> dataset privado, cada lead sería PII de un contribuyente en el dataset equivocado.
> El build **no** lo necesita: `src/lib/sanity.ts:22` acepta
> `SANITY_READ_TOKEN || SANITY_WRITE_TOKEN`, y `SANITY_READ_TOKEN` ya está en los tres
> targets.

**Corrección medida a B3.** El bloqueo dice «se lee desde internet sin token» y que un
lead sería «PII de contribuyentes expuesta». Medido hoy, la exposición es **más
estrecha**: una consulta anónima a `production` devuelve **73 documentos, todos de tipo
`sanity.imageAsset`** — cero documentos de contenido.

```
count(*)                          → 73
array::unique(*[]._type)          → ["sanity.imageAsset"]
count(*[_type=="service"])        → 0     (existen 12, con token)
```

O sea que hoy un `lead` probablemente **no** sería legible anónimamente. Dicho eso, no
cambia la recomendación: el `aclMode` no se puede leer sin rol administrator (401), la
salida correcta —un dataset `leads` aparte y privado— es barata, y elimina la pregunta
en vez de dejarla dependiendo de un comportamiento no documentado.

**Para cerrar el criterio 5 hacen falta tres cosas:**

1. Dataset `leads` privado en Sanity (rol administrator, bloqueo B2) y
   `SANITY_LEADS_DATASET=leads` en los tres targets de Vercel.
2. Credenciales SMTP del dominio del cliente, alineadas con el SPF/DKIM que ya vive en
   esa zona. **No un Gmail personal con App Password** — es la cuenta de una persona,
   se cae cuando esa persona cambia la contraseña, y en el traspaso el cliente no la
   recupera.
3. `npm i nodemailer`, y entonces sí `SANITY_WRITE_TOKEN` en Vercel.

Y en paralelo sigue abierto **D4**: un preparador de impuestos no puede recoger un dato
sin publicar la política de privacidad y el aviso GLBA. Hoy las dos páginas son
borradores con `noindex`.

## 6 · sitemap y robots

| Recurso | Estado | Contenido |
|---|---|---|
| `/robots.txt` | 200 `text/plain` | `Sitemap:` declarado · `Disallow: /es/` presente |
| `/sitemap-index.xml` | 200 `application/xml` | 1 sitemap |
| `/sitemap-0.xml` | 200 `application/xml` | **26 URLs** · 0 de `/es/` · 0 legales |

El sitemap apunta a `https://www.accountingmaxservices.com/...`, no a la URL temporal.

## 7 · canonical

**0 de las 54 rutas** llevan un canonical a `*.vercel.app`. Todas apuntan a
`https://www.accountingmaxservices.com<ruta>`. Es lo que impide que la URL temporal
compita en el índice mientras el dominio no esté conectado.

```
/                                   → https://www.accountingmaxservices.com/
/about-us                           → https://www.accountingmaxservices.com/about-us
/services/notary-public-services    → https://www.accountingmaxservices.com/services/notary-public-services
/es                                 → https://www.accountingmaxservices.com/es
```

## 8 · noindex

**28 exactas**, sin tocar: 26 rutas `/es*` (D3) + `/privacy-policy` + `/terms` (D4).

## 9 · Git

```
main local  = 6fcd18c
origin/main = 6fcd18c        SINCRONIZADOS
git status  = 0 cambios pendientes
```

Las 5 ramas de trabajo están en origin y coinciden con su local. **Ningún `--force`,
ninguna reescritura de historia remota.**

## 10 · Secretos

- `git grep -nE 'AIza[0-9A-Za-z_-]{10}|sk-[A-Za-z0-9]{20}'` → **vacío**, tanto en el
  árbol como en los 9 commits nuevos.
- Único fichero rastreado que casa `.env` es `.env.example`, y sus dos únicos valores
  son `PUBLIC_SANITY_PROJECT_ID` y `PUBLIC_SANITY_DATASET`, que el propio fichero
  documenta como no secretos.
- Verificado también contra el árbol publicado en GitHub (364 ficheros): ningún `.env`,
  ningún `ACCOUNTS.md`, ningún `DECISIONS.md`.

## 11 · Lighthouse

Sobre <https://accounting-max-services.vercel.app/>, Lighthouse 12, Chrome headless.

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| **Escritorio** | **98** | 97 | **100** | **100** |
| **Móvil** | **87** | 97 | **100** | **100** |

| Métrica | Escritorio | Móvil |
|---|---|---|
| First Contentful Paint | 0,8 s | 2,9 s |
| Largest Contentful Paint | 0,8 s | 3,1 s |
| Total Blocking Time | 0 ms | 0 ms |
| **Cumulative Layout Shift** | **0** | **0** |
| Speed Index | 0,9 s | 4,3 s |

CLS 0 en ambos: los centinelas de la navegación condensada están fuera de flujo, como
se diseñaron, y no desplazan nada.

Lo que queda por debajo de 100, con su causa:

- **Móvil 87** — lo marca el LCP de 3,1 s. Oportunidades: 37 KiB en formatos
  siguiente generación y 57 KiB en dimensionado de imágenes. Recursos que bloqueen el
  render: 0 ms.
- **Accesibilidad 97** — un único fallo, y es de marca, no de código: blanco `#ffffff`
  sobre el verde corporativo `#6da228` da **3,06:1** y WCAG AA pide 4,5:1. Afecta a
  todos los CTA (`.button`, `.button-news`, `.text-top-bar`). Viene heredado del sitio
  de Webflow. **No se ha cambiado**: oscurecer el verde de marca es una decisión del
  cliente, no del release.

## 12 · Dominios y DNS

```
dominios del proyecto: 1
  - accounting-max-services.vercel.app   verified: true
DOMINIOS PERSONALIZADOS: NINGUNO
```

**Ningún registro DNS tocado.** Ninguna redirección de dominio configurada. El sitio
antiguo de Webflow sigue en producción, intacto.

---

## Los commits

| SHA | Commit | Por qué |
|---|---|---|
| `ce16882` | Reescribir los 10 posts del blog, en inglés y en español | Ya existía. Estaba sobre la rama `diseno/densidad-vertical`, que mentía |
| `53572dc` | Reescribir el cuerpo de los 12 servicios | El texto de Webflow era genérico y repetía relleno. Entra por overlay `CONTENIDO_LOCAL`, sin escribir en el CMS |
| `9880fb3` | Retirar la credencial falsa, la antigüedad falsa y el NAP contradictorio | «IRS Certified Enrolled Agent» incumple la Circular 230 (31 CFR §10.30(a)(1)); «since 2009» era antigüedad inventada; Tamarac contradecía a Coral Springs |
| `7b95711` | Comprimir el hueco vertical de portada | `.block-review` se forzaba a 300px con 190px de contenido. Alto abajo, ancho sin mover |
| `38257ea` | Añadir la cadena de portadas del blog e ignorar los originales | Los 10 posts compartían 2-3 imágenes repetidas. 20 MB de JPG fuera del repo: no se sirven |
| `a4c6f70` | Añadir los informes de auditoría y entrega | Trazabilidad. Sin las capturas de página completa: 25 MB reproducibles con un comando |
| `6fcd18c` | Fusionar la navegación con scroll y el selector de idioma (D13) | Fusión de `nav/scroll-ux` |

**El historial ya dice la verdad.** `ce16882` estaba commiteado sobre
`diseno/densidad-vertical` con un mensaje de blog. No se reescribió: ese commit ya
estaba empujado como `origin/blog/10-posts`, así que el nombre remoto era correcto y
sobraba el puntero local. Se re-apuntaron las ramas —todas ancestros de `main`, cero
huérfanos, cero reescritura— y ahora cada nombre describe su commit:

```
blog/10-posts             ce16882  Reescribir los 10 posts del blog
contenido/copy            9880fb3  Retirar la credencial falsa…
contenido/blog            38257ea  Añadir la cadena de portadas del blog
diseno/densidad-vertical  7b95711  Comprimir el hueco vertical de portada
nav/scroll-ux             8ad2e81  Navegación: desplegable, header con scroll…
```

### Fusiones y builds

`npm run build` después de **cada** fusión, no solo al final. **7 fusiones, 7 builds
limpios, 54 páginas cada uno.**

El único conflicto fue en `src/styles/site.css`, al fusionar `nav/scroll-ux`, y era
falso: las dos ramas añadieron su bloque al final del mismo fichero sin solaparse. Se
conservaron ambos y se comprobó que los 7 selectores del bloque de densidad y los 27
del de navegación **no comparten ninguno**, así que ninguna regla pisa a la otra.

Trampa resuelta antes de fusionar: `public/images/{En,Sp}.svg` estaban sin rastrear en
`~/site` y a la vez commiteados en `nav/scroll-ux`. Los locales eran los originales
crudos (11,8 KB y 116 KB); los de la rama, versiones optimizadas (796 B y **177 B**).
Se borraron los locales.

---

## Abierto

| Asunto | Estado |
|---|---|
| **Rotar `GEMINI_API_KEY`** | Expuesta en un chat. NO se subió a Vercel (no se usa en el build). **Rotarla igualmente** |
| Criterio 5 — formularios | B3 + B2 + SMTP + `nodemailer`. Ver arriba |
| **D4** — privacidad y aviso GLBA | Bloquea publicar los formularios aunque se arregle lo técnico |
| **D3** — revisor nativo con criterio fiscal | Mantiene el `noindex` de las 26 rutas `/es` |
| Autor y fecha de los 10 posts | Sin resolver |
| Tamarac vs Coral Springs | Sede corregida a Coral Springs en `9880fb3`. Falta decidir si Tamarac se nombra como zona atendida |
| Contraste de marca 3,06:1 | Decisión del cliente. Techo de Accesibilidad en 97 |
| Copy de servicios en el CMS | Vive en `baseline/contenido/` y solo se aplica con `CONTENIDO_LOCAL=1`. **En producción las 12 fichas siguen sirviendo el texto de Sanity** hasta que alguien apruebe el volcado |
| **D6** — plan y propiedad de la cuenta Vercel | Hobby, facturación en un Gmail personal. Bloquea el corte, no esta previsualización |
