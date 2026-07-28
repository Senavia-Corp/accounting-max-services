// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  // Obligatorio: sin `site`, @astrojs/sitemap no emite nada y los canonical
  // salen relativos. Es `www` porque la canonicalizacion verificada en
  // produccion manda apex -> www conservando la ruta.
  site: "https://www.accountingmaxservices.com",

  // Estatico + adapter ES el modo hibrido en Astro 7 ("hybrid" ya no existe).
  // Las 26 paginas se prerenderizan; solo las rutas /api de la FASE 4 llevaran
  // `export const prerender = false` y saldran como Vercel Functions.
  output: "static",
  adapter: vercel(),

  // Paridad de URL con produccion, verificada con curl:
  //   /about-us   -> 200
  //   /about-us/  -> 301 a /about-us
  // Por defecto Astro emite /about-us/index.html, que se sirve en /about-us/ —
  // es decir, cambiaria la URL canonica de las 25 rutas indexadas. `file` emite
  // /about-us.html y Vercel lo sirve en /about-us sin barra.
  trailingSlash: "never",
  build: { format: "file" },

  integrations: [
    sitemap({
      // R6: /es/ nace fuera del sitemap y con noindex, hasta que D3 este firmado.
      filter: (page) => !page.includes("/es/"),
    }),
  ],
});
