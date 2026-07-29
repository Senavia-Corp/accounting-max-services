# nav-mejoras.md — propuestas NO aplicadas de la rama `nav/scroll-ux`

Todo lo de aquí se encontró trabajando en D13 y queda **fuera** de las cuatro
divergencias autorizadas. Nada está aplicado.

# Navegación (rama `nav/scroll-ux`) — propuestas NO aplicadas

Todo lo de esta sección se encontró trabajando en D13 y **queda fuera de las
cuatro divergencias autorizadas**. Nada de esto está aplicado.

## N1 · `D11` y `D12` se citan desde cinco sitios del código y no existen

`Nav.astro:23,190`, `site.css:320` y `Footer.astro:248` remiten a **D11** (los 3
iconos de redes sin URL real); `index.astro:549` y `es/index.astro:463` remiten a
**D12**. `DECISIONS.md` llega a D10 y nunca los recogió — es el hallazgo abierto
`V3-05` de `auditoria/V3-final.md`. Por eso la entrada nueva es **D13** y no D11:
reusar el número pisaría una decisión ya referenciada. **Hay que escribirlas.**

## N2 · La cúpula tapa el cuerpo de la página cuando hay scroll

`.brand` es un `<a>` opaco y absoluto que sobresale del header. Condensado
cuelga **43,75 px** (antes 68,75), así que la mejora (B) reduce la oclusión un
36 %, pero no la elimina: sobre texto corrido se come una banda de ~136 × 44 px
y, por ser un enlace, **se traga clics y selección de texto** de lo que hay
debajo. Se ve en `entrega/nav/despues-1440-condensado.png`.

Dos variantes que lo resolverían, ninguna aplicada porque las dos son una quinta
divergencia:

- **`scale(0,5417)`** — la cúpula queda enrasada con la barra, cero vuelo, cero
  oclusión. El logotipo baja a 54 px.
- **`pointer-events: none`** en `.brand` con un hijo que sí los reciba: mantiene
  el diseño y devuelve el clic y la selección al contenido. Es la más barata y la
  que yo haría.

## N3 · El presupuesto de +4 KB grava los comentarios, no el peso real

`ui.ts` es ~2:1 comentario/código por bytes, y Astro los minifica a **cero**. Un
techo sobre la fuente penaliza justamente los comentarios en español que explican
el *por qué* — que es la convención del fichero y lo que lo hace mantenible.
Medir sobre el JS servido (lo que hicimos: **+2.153 B**) es lo que refleja lo que
cuesta al visitante. **Propuesta:** fijar los presupuestos futuros sobre el
bundle, no sobre la fuente.

## N4 · El bundle cruzó el umbral de *inlining* de Astro

Efecto colateral de (B)/(C)/(D): el JS del cromo pasó de ir **incrustado en cada
uno de los 54 HTML** (4.049 B × 54) a ser un fichero externo cacheable de
6.202 B. Para un sitio multipágina es una mejora — se descarga una vez en vez de
54 — pero **cambia el perfil de carga** y conviene saberlo antes de mirar un
Lighthouse: la primera visita gana una petición y pierde ~4 KB de HTML.

## N5 · `scale()` sobre el logotipo lo ablanda durante la transición

Chrome rasteriza el SVG una vez y escala la textura, así que al expandir se
reescala una textura del 83 % durante 220 ms. Se ve poco y `will-change` lo
empeoraría (además de romper el cajón, ver D13). La alternativa —animar
`.logo{height}` + `.brand{padding-bottom}`, que no reflowa nada por ser `.brand`
absoluta— **está prohibida por el encargo** («Nunca animes `.logo{height}`»), así
que se reporta y no se toca.

## N6 · `assertContenido()` sigue siendo código muerto

`src/lib/sanity.ts:37`, exportada y documentada como la guardia contra un build
vacío (12 servicios / 10 posts / 20 testimonios), **no se llama desde ningún
sitio**. Es la red que evitaría que el desplegable de Services salga vacío en las
26 rutas si Sanity devuelve de menos.

## N7 · `robots.txt` no cubre `/es` sin barra

`Disallow: /es/` no casa con `/es`, que es como se emite la portada española
(`inicio()` devuelve `/es`, `trailingSlash:"never"`). `astro.config.mjs` sí trata
ese caso para el sitemap; `robots.txt` no. Hoy da igual porque el idioma no se
anuncia, pero entra en la lista del gate D3.
