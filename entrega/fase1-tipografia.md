# FASE 1 — Sistema de tokens y tipografía auto-alojada

**31 de julio de 2026.** Commits `9df813d` y el de corrección de medida. Desplegado y
medido en producción. El «antes» de todas las tablas es `fase0-baseline.md`.

---

## Resultado

| Métrica (móvil) | Antes | Después | |
|---|---:|---:|---|
| Rendimiento `/` | 87 | **96** | +9 |
| Rendimiento `/services/personal-tax-preparation` | 85 | **95** | +10 |
| Rendimiento `/contact-us` | 88 | **98** | +10 |
| Rendimiento `/post/understanding-tax-deductions` | 90 | **97** | +7 |
| Rendimiento `/es` | 86 | **96** | +10 |
| FCP `/` | 2.881 ms | **1.481 ms** | −49 % |
| LCP `/` | 3.108 ms | **2.362 ms** | −24 % |
| **CLS** | 0,000 | **0,000** | ✅ intacto |

| Métrica (escritorio) | Antes | Después |
|---|---:|---:|
| Rendimiento, las 5 rutas | 99 | **100** |
| FCP `/` | 803 ms | **341 ms** |
| CLS `/post` (el único apreciable) | 0,025 | **0,017** |

**El objetivo de móvil ≥95 del cierre ya está cumplido, en la primera fase.** Escritorio
llega a 100 en las cinco.

### La causa, y su desaparición

| Bloqueo de render, portada móvil | Antes | Después |
|---|---:|---:|
| Recursos que bloquean | 4 | **1** |
| Milisegundos bloqueados | 2.762 | **150** |

```
ANTES                                    DESPUÉS
842 ms  use.typekit.net/blq3zch.css      150 ms  /_astro/Footer.DPgxL5Mq.css
848 ms  fonts.googleapis.com/css2…
772 ms  p.typekit.net/p.css
300 ms  /_astro/Footer.Bx8W8E6m.css
```

**−94,6 % de bloqueo.** Lo único que queda es la hoja propia, que es la que se va en la
fase 4.

---

## Qué se hizo

### Tres proveedores tipográficos → cero

El sitio cargaba **5 familias de 3 proveedores para 5 usos**:

| Familia | Proveedor | Para qué servía |
|---|---|---|
| `stix-two-text` | Typekit | `.h1`, `.h2`, `.h3` (61 usos) |
| `dolly-new` | Typekit | 2 reglas |
| `Ubuntu` (5 caras) | Google Fonts | el `body` |
| `Open Sans 600` | Google Fonts | **1 regla, presente en 2 de 54 rutas** |
| `Campton` (6 `.ttf`) | auto-alojada | **1 regla**: el botón del boletín del pie |

Las dos de Google eran valores por defecto de Webflow, no decisiones de diseño. Y de las
7 familias que servía el kit de Typekit, el sitio usaba dos.

**Ahora: 2 familias OFL, 3 ficheros, 95.100 B.**

| Fichero | Bytes | Papel |
|---|---:|---|
| `source-serif-4-600.woff2` | 21.488 | Titulares. **Una sola cara**: la jerarquía la hace el tamaño, no el peso. Es la fuente del elemento LCP en 3 de las 5 plantillas, y lo único que va en `<link rel="preload">`. |
| `inter-var.woff2` | 48.432 | Cuerpo. Variable 300–700: **un fichero da los cinco pesos exactos** que el sitio usa, sin sintetizar ninguno. |
| `inter-italic-400.woff2` | 25.180 | `<em>` del rich text. No se sintetiza: una oblicua falsa se ve barata. |

Por qué estas dos: **Source Serif 4** es una serif de texto sobria — en un despacho que
representa contribuyentes ante el IRS la autoridad la da una serif seria, no una con
carácter. **Inter** trae cifras tabulares, que este sitio necesita porque habla de
importes, plazos y años fiscales.

**Medido en producción**: la portada descarga **70.520 B de fuente frente a 140.300 B
antes** — la cursiva no se pide hasta que aparece un `<em>`. Los orígenes externos bajan
de **5 a 2**, y los dos que quedan son de imágenes (`cdn.sanity.io`, `i.ytimg.com`).

### Dos decisiones pendientes, cerradas de paso

- **D2 (licencia Campton)** — cerrada por sustitución. Los 6 `.ttf` eran **660.708 B de
  una fuente comercial sin licencia** que un repositorio público servía con `200` a
  cualquiera. Hoy dan `404`. Las dos familias nuevas son SIL Open Font License, así que
  auto-alojarlas es legal.
- **D9 (kit `blq3zch` de Adobe)** — cerrada. Ya no se pide.

### El sistema de tokens

`src/styles/tokens.css`: color, tipografía, espacio, rejilla, radios, elevación y
movimiento. Va **sin capa**, igual que `site.css`, así que pisa las 9 variables del vendor
sin un solo `!important`. **Es el fichero que sobrevive a la fase 4.**

Los tokens de movimiento se declaran ya, aunque la fase de animación sea la 5: así ningún
componente de las fases 2–4 inventa una duración por su cuenta.

### Tres reglas de color, las tres calculadas

Ninguna estimada — todas con la fórmula WCAG 2.2 y verificadas contra axe:

1. **Sobre el verde `#6da228`**: ni el blanco (3,07:1) ni el navy de marca (4,36:1) llegan
   al 4,5 de AA. El token `--sobre-verde: #1f2b30` da **4,73:1**. Es la única salida que
   no toca el verde del cliente.
2. **Sobre el navy `#243137`**: el verde de marca da **4,36:1** — el mismo par falla en las
   dos direcciones. Sobre oscuro se usa `--verde-claro` (**6,35:1**).
3. **Bordes**: `--borde` da 1,30:1 y es decorativo. Cuando el borde es lo *único* que
   delimita un campo, SC 1.4.11 pide 3:1 → `--borde-control` (**3,56:1**).

Las dos últimas son hallazgos nuevos de esta fase: no estaban en el prompt ni en la
auditoría previa.

### El hueco de la prosa del CMS

El barrido de la fase 0 encontró que **`.w-richtext` tenía 39 reglas en el framework y
cero en la hoja del proyecto**: el cuerpo de los 10 posts y de las 12 fichas de servicio
—44 rutas contando las gemelas `/es`, o sea la mayoría del sitio— nunca tuvo tipografía
propia. Se pintaba con lo que cayera por herencia.

Ahora tiene escala, ritmo vertical, listas, y enlaces con subrayado verde — que hace
visibles los **70 enlaces internos editoriales** del cuerpo de los servicios sin pintarlos
de otro color.

### Una corrección que salió de medir

Puse `--medida: 68ch` dando por supuesto que serían 68 caracteres. **Medido en producción
sobre `/post/understanding-tax-deductions`: eran 772 px y 96 caracteres reales por línea.**

`ch` mide el ancho del glifo «0», más ancho que la letra media de un texto corrido. El
valor correcto para ~68 caracteres es **`48ch`**, y así queda, con la medición anotada en
el propio token para que nadie lo «arregle» de vuelta.

---

## Criterios de la fase

| Criterio | Estado |
|---|---|
| Los seis `.ttf` de Campton borrados | ✅ y dan `404` en producción |
| `woff2` subsetteado | ✅ 3 ficheros, 95.100 B, subset latin (cubre el español) |
| **CLS sigue en 0** | ✅ **0,000 en las 5 rutas móviles**; en escritorio mejora de 0,025 a 0,017 |
| Las 54 rutas responden 200 | ✅ comprobadas una a una tras el despliegue |
| Ni un valor de color fuera de tokens | ⚠️ **NO del todo — ver abajo** |

### El criterio que no se cumple, y por qué

`tokens.css` está limpio: sus 18 valores literales **son** las definiciones. Pero
**`site.css` conserva 26 colores literales** heredados del port:

- **20 son valores con alfa** (`#0003`, `#ffffff14`, `#0000004d`…) dentro del código del
  anillo de foco y de las sombras, que se midió byte a byte en su momento y está
  documentado línea por línea. Tocarlo aquí es riesgo sin ganancia.
- **6 son grises** (`#333`, `#C8C8C8`, `#dddddd`, `#dedede`) que **no tienen equivalente
  idéntico** en el sistema nuevo. Migrarlos no es renombrar: es cambiar el color, y eso es
  rediseño de componente.

Los 26 se van en la **fase 2**, cuando los componentes que los usan se reconstruyan. No se
han migrado a medias para poder marcar una casilla.

---

## Lo que esta fase NO ha movido

- **Accesibilidad sigue en 97.** Los tokens de contraste existen, pero los CTA los sigue
  pintando el vendor con blanco sobre verde. Se corrige en la fase 2, al reconstruir los
  componentes.
- **El diseño es el mismo.** Esta fase cambia la tipografía y crea el vocabulario; la
  estructura no se toca hasta la fase 2.
- **Las 5.181 líneas de vendor siguen ahí** — menos 874 bytes de `@font-face` muerto.

---

## 🚨 Fuera de fase, pero urgente

**El captcha de producción lleva la clave de PRUEBAS de Cloudflare.** Las 54 rutas sirven
`data-sitekey="1x00000000000000000000AA"`, cuya semántica documentada es **«siempre
pasa»**. La protección antibot está desplegada y no protege de nada.

Viene del trabajo en curso de otra sesión (`ff9e964`). **Está en zona prohibida por
concurrencia y este encargo no lo ha tocado.** Pero no puede quedarse así.
