// `window.dataLayer` para los tres pushes de conversion (contact-us EN, su
// gemelo ES y FooterSubscribe).
//
// El array lo crea el snippet de GTM en el <head> de BaseLayout, pero
// TypeScript no lo sabe: sin esta declaracion `astro check` falla en los tres
// sitios con «Property 'dataLayer' does not exist on type 'Window'». Y
// `npm run build` NO lo detectaria —esbuild transpila sin comprobar tipos—, que
// es exactamente el motivo por el que AGENTS.md exige correr las dos ordenes.
//
// `unknown[]` y no `any[]`: lo unico que se hace con el array es empujar, y
// `any` desactivaria la comprobacion de lo que se empuja.
interface Window {
  dataLayer: unknown[];
}
