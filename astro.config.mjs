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
  //
  // Lo hace `trailingSlash` SOLO. Aqui hubo un `build: { format: "file" }` que
  // no servia de nada: @astrojs/vercel pisa build.format con "directory" en su
  // hook astro:config:setup (node_modules/@astrojs/vercel/dist/index.js:132), y
  // el build sale igual en dist/client/about-us/index.html lo pongas o no.
  // Quien da la paridad es la primera regla que el adapter escribe en
  // .vercel/output/config.json a partir de este trailingSlash:
  //   { "src": "^/(.*)/$", "headers": { "Location": "/$1" }, "status": 308 }
  // o sea, /about-us/ -> 308 -> /about-us, y el filesystem sirve el index.html.
  trailingSlash: "never",

  integrations: [
    sitemap({
      // R6: /es/ nace fuera del sitemap y con noindex, hasta que D3 este firmado.
      // Y fuera tambien las dos paginas legales: son BORRADORES pendientes de
      // revision de un abogado y ya llevan noindex (D4). Tenerlas en el sitemap
      // mientras dicen noindex es contradictorio y Search Console lo reporta.
      // Ojo con /es a secas: el indice en espanol sale SIN barra final, asi que
      // un filtro que busque "/es/" lo deja pasar. Se comprueba la ruta.
      filter: (page) => {
        const ruta = new URL(page).pathname.replace(/\/+$/, "") || "/";
        return (
          ruta !== "/es" &&
          !ruta.startsWith("/es/") &&
          ruta !== "/privacy-policy" &&
          ruta !== "/terms"
        );
      },
    }),
  ],
});
