# COLA — cambios fuera de la propiedad de quien los detecta

Un agente jamás edita un fichero que no le pertenece (00-contexto.md §6). Lo que
detecta fuera de su territorio se anota aquí y sigue.

---

## R2A-COLA-01 · `src/pages/og-default.png.ts:7` afirma que el sitio sirve WebP «vía `auto=format`»

- **Fichero:** `src/pages/og-default.png.ts`, líneas 6-7
- **Dueño:** ninguno. No aparece en el mapa de §6 y no es de los dos agentes de
  la ronda 2 (R2-A = las 11 rutas/componentes del helper `src()`; R2-B = `site.css`).
- **Texto actual:**

  ```
  // POR QUE PNG Y NO AVIF/WEBP: Facebook y LinkedIn no renderizan AVIF ni WebP en
  // las tarjetas. El resto del sitio si sirve WebP via `auto=format` de Sanity,
  ```

- **Por qué hay que tocarlo:** es la **octava** afirmación del árbol sobre
  `auto=format`, y el rechazo V2-01 pedía corregir las ocho. Las otras siete
  (`Footer.astro`, `index.astro` ×2, `about-us.astro`, `blog-news.astro`,
  `post/[slug].astro`, `services/[slug].astro`) ya están corregidas por R2-A.
  Esta se queda desincronizada por partida doble:
  1. Cuando se escribió ya era **falsa**: `auto=format` negocia por la cabecera
     `Accept` y Chrome pide `image/avif` primero, así que el CDN devolvía AVIF,
     no WebP. Medido: 52 de las 94 URL de mapa de bits de `dist/` salían
     `image/avif`.
  2. Desde la ronda 2 los 11 helpers usan `fm=webp`, no `auto=format`, así que
     el mecanismo que cita ya no existe en el código.
- **Arreglo propuesto (solo comentario, cero cambio de comportamiento):**

  ```
  // POR QUE PNG Y NO AVIF/WEBP: Facebook y LinkedIn no renderizan AVIF ni WebP en
  // las tarjetas. El resto del sitio si sirve WebP, pero via `fm=webp` y NO via
  // `auto=format`: `auto=format` negocia por la cabecera `Accept` y Chrome pide
  // `image/avif` primero, o sea que devolvia AVIF, que esta prohibido.
  ```

- **Severidad:** cosmético en pantalla, **se nota** como deuda: es el único sitio
  que queda diciendo lo contrario de lo que hace el código, y es justo el tipo de
  comentario que hizo que V2-01 no se detectara antes.
- **Riesgo de tocarlo:** ninguno. Es un comentario dentro de un bloque que
  documenta por qué el OG va en PNG; el PNG no cambia.
