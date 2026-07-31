# 00 · Contexto compartido — paridad visual accountingmaxservices.com

**Todo subagente lee este fichero ANTES de hacer nada.** Las reglas de aquí ganan a
cualquier instinto propio.

---

## 1 · Los dos servidores

| puerto | qué es | cómo se navega |
|---|---|---|
| **4321** | el sitio nuevo (`astro dev`) | URLs limpias: `http://localhost:4321/about-us` |
| **4327** | **el oráculo**: `baseline/html/`, snapshot de producción Webflow | **URLs con `.html`**: `http://localhost:4327/about-us.html` |

### T1 · El oráculo se muere en silencio — assert obligatorio

Un servidor caído **no da error**: `curl` devuelve vacío, y un diff contra vacío se lee
como «al port le falta el sitio entero». Ya pasó una vez en esta sesión y produjo dos
comparativas basura que parecían catástrofes.

**Toda comparación abre con esto y aborta si falla:**

```bash
for p in 4321 4327; do
  curl -sf -o /dev/null "http://localhost:$p/" || { echo "SERVIDOR :$p MUERTO — ABORTA, no reportes nada"; exit 1; }
done
```

Si tu diff dice que falta media página, **primero** vuelve a correr el assert. Un
hallazgo cuyo lado baseline salga vacío es T1, no un bug. **No lo reportes.**

### T2 · `http.server` no reescribe URLs sin extensión

El baseline enlaza `href="/about-us"`, pero en disco el fichero es `about-us.html`.
Navegar por el oráculo pinchando enlaces da **404 en todos**. `/` funciona solo porque
`index.html` es el índice del directorio. **Toda URL del oráculo lleva `.html`.**

### T3 · El diff tiene ruido estructural — no reportes el desfase de índice

`diff` indexa por `etiqueta.clasesOrdenadas[n]`. Consecuencia: **cambiar la etiqueta o
añadir una clase parte un elemento en `FALTA` + `SOBRA` y desplaza el índice de todos
los siguientes**, que entonces divergen en `width`/`height` sin que nada esté mal.

Medido en la portada a 1440: **253 divergencias, y la mayoría es ruido.**

```
baseline  a.nav-link.w-nav-link: [83.45, 106.94, 131.56, 118.81]
port      a.nav-link.w-nav-link: [       106.94, 131.56, 118.81]
```

El port no tiene tres anchos malos: tiene **un elemento menos en la lista** (lleva
`w--current`, que cambia la clave) y todo se corre una posición. Los valores son
idénticos.

**Antes de reportar una divergencia de `width`/`height`, comprueba si la secuencia
completa está simplemente desplazada:**

```bash
node -e 'const a=require("A.json"),b=require("B.json");
const f=(j,s)=>j.nodos.filter(n=>n.sel===s).map(n=>n.css.width);
console.log("base:",f(a,"SELECTOR")); console.log("port:",f(b,"SELECTOR"));'
```

Fuentes conocidas de ruido, **todas deliberadas y ya justificadas** — no las reportes:

- `<div>` → `<button>`: hamburguesa, desplegable de servicios, disparador de FAQ,
  flechas del carrusel.
- `<div role=list>` → `<ul>`: submenú del `<nav>`, lista de servicios del pie.
- `<html class="w-mod-ix wf-*-active …">`: son las ~48 clases que inyecta `webfont.js`
  en producción. El port no usa `webfont.js`.
- El rediseño del cromo móvil (§4): `.nav-telefono`, `.nav-volver`,
  `.saltar-al-contenido`, `.visually-hidden`, `.yt-facade`.
- `.w-nav-overlay`, `.w-dyn-*` en el submenú: los pone `webflow.js`, que no existe aquí.

Reparto real de esas 253 en la portada, para que calibres: **98 `FALTA` · 78 `SOBRA` ·
77 con propiedades divergentes** (53 `width`, 39 `height`, 19 `display`, 8 `color`,
1 `margin`). El grano fino está en esas 77, no en las 176 primeras.

### Cobertura del oráculo — tiene huecos

`baseline/html/` cubre **26 rutas, solo EN**: `index`, `about-us`, `contact-us`,
`blog-news`, `services/` ×12, `post/` ×10.

**NO existe baseline de `/es/*` (26 rutas), ni de `/privacy-policy`, ni de `/terms`.**

- Ruta **con** baseline → el baseline es la verdad. Divergencia = bug.
- Ruta **sin** baseline → la verdad es su equivalente EN ya corregido, más coherencia
  interna. **Nunca inventes diseño nuevo.**

El oráculo carga su CSS, fuentes e imágenes desde `cdn.prod.website-files.com` y
`use.typekit.net` por URL absoluta. **Renderiza completo y con estilo, pero exige red.**
Sin internet sale HTML crudo — que también parece una catástrofe y tampoco lo es.

El oráculo **sí ejecuta `webflow.js` / IX2**. El port no. Ver §5.

---

## 2 · El instrumento: `tools/capturas.mjs`

Ya existe y es la columna vertebral. **No se añade Puppeteer ni ninguna dependencia.**

```bash
# medir dos lados en una sola sesión de Chrome (arrancarlo cuesta más que medir)
node tools/capturas.mjs medir 1440 \
  "http://localhost:4327/index.html=/tmp/ams/b-home-1440.json" \
  "http://localhost:4321/=/tmp/ams/p-home-1440.json"

node tools/capturas.mjs diff /tmp/ams/b-home-1440.json /tmp/ams/p-home-1440.json

# captura de página completa como evidencia
node tools/capturas.mjs full "http://localhost:4321/" 1440 /tmp/ams/p-home-1440.png
```

`medir` vuelca `rect` + computed de todo elemento **con clase**, indexado **por clase y
no por posición** en el árbol: los dos lados no tienen el mismo número de nodos, así que
cualquier clave posicional desalinea el diff a la primera diferencia. `diff` reporta
`FALTA` (está en el baseline y no en el port), `SOBRA` (al revés) y las propiedades que
divergen.

`diff` ignora a propósito `opacity` y `aspect-ratio`, y `list-style-type` fuera de
`display:list-item`. Está justificado en el propio fichero: no lo cambies.

**Limitación que tienes que compensar: `medir` solo ve elementos CON clase.** Los `<div>`
sin clase — por ejemplo los envoltorios de celda de `.features` — no se miden. Cómpleta
con un **diff de inventario de clases** sobre el HTML crudo, que es lo que destapó el
`<nav>` y el pie:

```bash
ext() { grep -oE 'class="[^"]*"' "$1" | sed 's/class="//;s/"$//' | tr ' ' '\n' \
        | grep -v '^$' | grep -v 'astro-' | sort | uniq -c | awk '{print $2" "$1}' | sort; }
curl -s http://localhost:4327/index.html > /tmp/ams/b.html
curl -s http://localhost:4321/           > /tmp/ams/p.html
ext /tmp/ams/b.html > /tmp/ams/bc.txt; ext /tmp/ams/p.html > /tmp/ams/pc.txt
echo "--- faltan en el port:"; join -v1 /tmp/ams/bc.txt /tmp/ams/pc.txt
echo "--- sobran en el port:"; join -v2 /tmp/ams/bc.txt /tmp/ams/pc.txt
echo "--- conteos distintos:"; join /tmp/ams/bc.txt /tmp/ams/pc.txt | awk '$2!=$3'
```

Usa `/tmp/ams/` (o el scratchpad) para los intermedios. **No ensucies el repo.**

---

## 3 · Estado ya verificado — NO lo re-descubras

Medido con `document.fonts` y `getComputedStyle` en el árbol de trabajo actual:

- **Las fuentes están correctas.** [BaseLayout.astro:67](../src/layouts/BaseLayout.astro)
  carga Ubuntu 300/400/500/700/400i + Open Sans 600. El conjunto cargado **es
  exactamente** el que exigen las reglas del CSS de Webflow: cero de más, cero de menos.
  `stix-two-text` (Typekit `blq3zch`) **sí sirve desde localhost**: `.h1/.h2/.h3`
  computan `stix-two-text` a 45/35/25 px. **Los titulares NO están en serif.**
  - Ubuntu 600 lo pide `.h2-2`, clase que no aparece en ningún HTML → correctamente fuera.
  - `dolly-new` (Typekit) está muerto: 0 usos. `Roboto` no lo pide ni una regla.
  - Campton es autoalojado (`public/fonts/`, `@font-face` en `accounting-max.webflow.css:1-39`).
    Solo `.button-news` a peso 300 lo usa.
  - **D9 sigue en pie**: el kit Typekit está restringido por dominio, así que en
    `*.vercel.app` los titulares caerán al fallback. **Es esperado, no es un bug.**
- **La portada rinde los 12 servicios**, sin filtro por `feature`. `.collection-list` es
  la grilla real (`1fr 1fr 1fr 1fr`, → 2 col a 991, → 1 col a 767).
- **Cero enlaces internos a 404** (0 de 55 en `dist/`). Es una regresión a vigilar.
- **El CSS del vendor no tiene estados iniciales huérfanos de IX2.** Los `opacity:0` y
  `data-w-id` de producción vivían en atributos `style` del HTML (404 y 90 casos), y ya
  están fuera del port. No busques ahí.

---

## 4 · Documentos que VINCULAN

Lo que esté justificado en cualquiera de los dos **no es un bug** y **no se re-reporta**:

1. **`DECISIONS.md`** — bloqueos y decisiones de plataforma, contenido y legales.
2. **`baseline/auditoria-diseno.md`** — auditoría previa: 21 hallazgos, 15 arreglados,
   4 reportados sin tocar, 2 falsos positivos. **Incluye un rediseño deliberado del
   cromo móvil** (botón de llamada, cajón de dos niveles, hamburguesa en aspa, enlace de
   salto, bloqueo de scroll). Nada de eso existe en el baseline y **está ratificado**:
   no es divergencia, no se revierte.

**Sí se reporta** si alguno de esos 15 arreglos **se ha roto** desde entonces.

---

## 5 · Reglas duras — se cumplen sin excepción

- **Es un port 1:1. NO rediseñes.** Si algo «se vería mejor» pero difiere del baseline,
  va a `auditoria/MEJORAS.md` como propuesta — **no se aplica**.
- **Clases de Webflow VERBATIM.** No renombrar, no «limpiar», no semantizar.
- **Respeta el orden de `@layer`.** `main.css` mete los 95 KB de Webflow en
  `layer(webflow)` y `site.css` va **suelto**: lo no capado gana a TODO lo capado sin
  importar la especificidad. Ponerlo en una capa «encima» haría justo lo contrario.
- **CERO `!important`.** Si hace falta, el diagnóstico está mal.
  **Única excepción, ya en el árbol y que NO se toca:**
  [site.css:29-38](../src/styles/site.css), el bloque `prefers-reduced-motion` sobre
  `*, *::before, *::after` — 4 `!important` idiomáticos. Fuera de ese bloque, cero.
- **`site.css` tiene DOS bloques `@layer webflow {}` deliberados** —
  [site.css:55-89](../src/styles/site.css) (reset de `<button>` con `:where()`) y
  [site.css:103-108](../src/styles/site.css) (`img{width:auto;height:auto}`). Están
  capados **a propósito, para PERDER** contra las reglas reales del port. Sacarlos «para
  que ganen» rompe `.menu-button` y el dimensionado de todas las imágenes. **No los toques.**
- **CSS propio solo en `site.css`.** `src/styles/vendor/*` es **intocable**.
- **Sin reintroducir `webflow.js` / IX2.** Lo que dependía de una interacción se resuelve
  con CSS.
- **No tocar contenido de Sanity** ni ejecutar los scripts de escritura de `tools/`
  (`sanity-import`, `push-i18n`, `upload-assets`). Si el arreglo es de datos: **para y
  pregunta**.
- Comentarios **en español**, estilo del repo: explican **POR QUÉ**, no qué.
- **Nadie hace commit ni deploy.** Solo working tree.

---

## 6 · Mapa de propiedad de ficheros — un fichero, UN dueño

En la fase de corrección, **un agente jamás edita un fichero que no le pertenece**. Si
necesita un cambio fuera de su territorio, lo anota en `auditoria/COLA-CSS.md` y sigue.

| dueño | ficheros |
|---|---|
| **F0 · GLOBAL** | `src/styles/site.css` · `src/layouts/BaseLayout.astro` · `src/scripts/ui.ts` · `src/components/PortableText.astro` · `src/components/JsonLd.astro` · `src/lib/*.ts` · `astro.config.mjs` |
| **F1 · CROMO** | `src/components/Nav.astro` · `Footer.astro` · `FooterSubscribe.astro` |
| **F2 · PORTADA** | `src/pages/index.astro` · `src/pages/es/index.astro` |
| **F3 · SERVICIOS** | `src/pages/services/[slug].astro` · `src/pages/es/services/[slug].astro` |
| **F4 · BLOG** | `src/pages/post/[slug].astro` · `es/post/[slug].astro` · `blog-news.astro` ×2 |
| **F5 · ESTÁTICAS** | `about-us` ×2 · `contact-us` ×2 · `privacy-policy` · `terms` |

`src/styles/vendor/*` no tiene dueño: **nadie lo edita**.

---

## 7 · Cómo se reporta un hallazgo

**Evidencia obligatoria.** Computed style de los DOS lados, o captura recortada. **Un
hallazgo sin evidencia no se reporta.** Una impresión visual no es evidencia.

Cada auditor escribe **solo su propio fichero** `auditoria/<id>-<área>.md`. Una entrada
por hallazgo, con este formato:

```markdown
### A1-03 · [título corto]

- **Ruta:** /  ·  **Sección:** .features  ·  **Viewport:** 1440
- **Síntoma:** qué se ve mal, en una frase.
- **Evidencia:**
  | | baseline | port |
  |---|---|---|
  | `.image-2` width | 940px | 593px |
  (o: `baseline/diseno/xxx.png`, recorte)
- **Causa raíz:** la regla o el nodo concreto, con `fichero:línea`.
- **Arreglo propuesto:** qué cambio exacto.
- **Archivos a tocar:** `src/styles/site.css`
- **Severidad:** rompe | se nota | cosmético
- **¿Lo justifica DECISIONS.md o auditoria-diseno.md?** no
```

**Rutas de plantilla:** audita la plantilla y **verifica 3 instancias distintas**, no las
24. Reporta cuáles.

**Ámbitos a cubrir en cada ruta, a 1440 y a 375:** familia y peso de fuente REALMENTE
aplicados (computed, no declarado) · tamaños de texto · ancho de contenedor · padding y
gaps · nº de elementos por grilla y filas huérfanas · ratio imagen/texto · desbordes
horizontales · `clip-path` de las esquinas de `.reviews` · estados hover y focus ·
acordeón FAQ y carrusel **sin webflow.js** · imágenes rotas o sin dimensionar ·
contraste · jerarquía de encabezados · enlaces a 404.

**Antes de reportar una imagen rota**, confírmalo por HTTP (`curl -sI`). Ya hubo un falso
positivo: `complete && naturalWidth===0` durante la carga no es una imagen rota.
