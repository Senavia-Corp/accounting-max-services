# Propuestas — fuera del alcance de este encargo

Nada de lo que hay aquí se ha implementado. Son hallazgos del trabajo de copy que
caen fuera de «escribir texto», ordenados por lo que rinde antes.

---

## 1. El sitio no emite ni un byte de datos estructurados · **lo más rentable**

`src/components/JsonLd.astro` está escrito —emite `AccountingService` con
dirección, `areaServed` y horario, y tiene una constante `FAQ_PORTADA` lista para
un `FAQPage` válido— pero **no lo importa ninguna página**. Comprobado:

```
grep -rn "JsonLd" src/     → solo un comentario en BaseLayout.astro:40
grep -rl "application/ld+json" dist/  → 0 de 54 rutas
```

El encargo decía «JsonLd.astro ya emite AccountingService, no lo rehagas». No lo he
rehecho: lo que informo es que **no está conectado**, y por eso el sitio no tiene
`LocalBusiness` en ninguna ruta. Es una línea de `import` y una de uso en
`BaseLayout.astro`.

Al conectarlo faltarían `geo` (lat/long del 1700 N University Dr) y `sameAs` (las
redes del despacho, que hoy no constan en ningún sitio).

> **Prohibido** emitir `Review` o `aggregateRating`: las 20 reseñas del CSV no
> tienen calificación, ni fecha real, ni fuente (D5). Marcarlas sería una
> violación de las directrices de Google con sanción manual.

---

## 2. Enviar el sitemap a Search Console

La propiedad `sc-domain:accountingmaxservices.com` **ya está verificada** y el
acceso funciona (`permissionLevel: siteOwner`). Lo que no hay es dato: 0 filas en
16 meses y **0 sitemaps enviados**.

`dist/client/sitemap-index.xml` se genera en cada build. Enviarlo es un minuto y
es el requisito previo para que las 12 páginas nuevas se descubran rápido.

Corrección al expediente: `DECISIONS.md` B1 y `entrega/blog-investigacion.md`
dan por hecho un `403` de permisos. Ese `403` era de la cuenta equivocada —
Composio resuelve por defecto a AB Aluminum. Con la cuenta `Accounting-max-services`
el acceso es correcto. B1 sigue siendo necesario para el cutover, pero **ya no
está perdiéndose baseline cada día**.

---

## 3. Desbloquear `/es/` — hoy el español no puede rendir nada

Se ha escrito el español completo de las 12 páginas de servicio (12.065 palabras).
En este momento **ninguna es visible para Google**:

| Bloqueo | Estado | Dónde |
|---|---|---|
| `noindex` | activo en las 20 rutas ES | prop `noindex` en cada `<BaseLayout>` |
| Fuera del sitemap | activo | `astro.config.mjs:40-48` |
| `Disallow: /es/` | activo | `robots.txt` |
| Sin `hreflang` recíproco | activo | 1 sola ruta lo tiene, ver §4 |
| **Sin un solo enlace entrante** | activo | no hay selector de idioma; `grep 'href="/es'` en las 34 rutas EN → **0** |

Es deliberado (R6) hasta que se firme **D3 — revisor nativo con criterio fiscal**.
Pero conviene ver el orden de magnitud: el ángulo bilingüe es el activo más
infravalorado del sitio (el SERP de «contador en español Coral Springs» devuelve
resultados de Miami, ninguno de Broward) y está apagado por completo.

Secuencia para encenderlo, cuando D3 esté firmado:
1. Un EA o CPA hispanohablante del despacho revisa las 12 páginas ES.
2. Quitar `noindex` de las rutas ES.
3. Quitar `Disallow: /es/` y meterlas en el sitemap.
4. `hreflang` recíproco EN↔ES en las 24 parejas.
5. **Selector de idioma en el cromo** — sin esto, ni el usuario ni el rastreador
   llegan. Es el paso que más se olvida y el único imprescindible.

---

## 4. Un `hreflang` suelto en una sola ruta

`dist/client/es/contact-us/index.html` es la única de las 54 que emite `hreflang`.
O sobra ahí, o faltan en las otras 53. Hoy es una incoherencia sin efecto porque
la ruta va con `noindex`, pero hay que resolverla junto con §3.

---

## 5. Separar el `<h1>` de la etiqueta del nav

`servicio.title` alimenta **el H1 y la etiqueta del nav/sidebar a la vez**
(`services/[slug].astro:198` y `:311`). Por eso los 12 títulos se han quedado
cortos y navegables, y la keyword local completa vive en `metaTitle`, en la `intro`
y en un H2 del cuerpo.

Un campo `h1` opcional en el esquema `service` (con `title` de reserva) permitiría
H1 como «ITIN Application in Coral Springs, FL» sin romper un menú de 12 ítems. Es
cambio de esquema y de componente: fuera del port 1:1, por eso no se ha tocado.

---

## 6. Los 48 `alt` de imágenes de servicio

`entrega/alt-pendientes.md` los tiene inventariados: 24 imágenes × (`alt` + `altEs`).
Son fotos reales del despacho y no se describen a ciegas. Es texto, cuenta para
accesibilidad y para búsqueda de imágenes, y necesita diez minutos de alguien que
sepa qué se ve en cada foto.

---

## 7. Seis páginas se han pasado de la banda de longitud · **decisión suya**

La FASE 0 fijó 550–900 palabras por página con el SERP delante. Seis se han pasado:

| Página | Objetivo FASE 0 | Real EN | Desvío |
|---|--:|--:|--:|
| `sales-tax-filing-7k40q` | 750 | 1.132 | +51 % |
| `personal-tax-preparation` | 750 | 1.090 | +45 % |
| `representation-before-the-irs` | 800 | 1.012 | +27 % |
| `corporate-tax-preparation` | 700 | 977 | +40 % |
| `audit-assistance` | 700 | 955 | +36 % |
| `business-incorporation-in-florida` | 750 | 942 | +26 % |

`tools/services-build.mjs` lo marca como **aviso, no como fallo**, a propósito: la
longitud la fija la consulta, no la regla. Las seis son justamente las de materia
más densa (tasas y surtax por condado, Form 2848, plazos de examen). No hay
relleno evidente, pero **contradicen mi propia investigación** y el techo de 1.100
que el blog ya justificó por mantenibilidad: cuando las cifras cambien en enero,
alguien tiene que poder actualizar esto.

Si quiere ceñirlas a la banda, dígamelo y las recorto sin tocar ni un dato.

---

## 8. Lo demás, sin implementar

- **Google Business Profile.** Para «near me» y el paquete de mapas pesa más que
  cualquier cosa que se escriba en la página. No consta que exista.
- **Páginas por ciudad.** `/services/<servicio>/<ciudad>` para Coconut Creek,
  Parkland, Margate. Solo cuando las 12 de servicio estén indexadas y rindiendo:
  hacerlo antes multiplica páginas delgadas.
- **Servicios que hoy no existen** en el sitio y que el despacho sí presta
  (payroll, planificación fiscal, ayuda con cartas CP2000). No los he inventado.
- **`accounting-max-services.webflow.io` sigue vivo, indexable y completo**
  (`DECISIONS.md`): duplicado exacto sin `noindex` ni `canonical`. Compite con el
  sitio real. Es lo único de esta lista que hace daño activo.
