// Capa de datos. Un unico cliente para todo el sitio.
//
// El token NO es opcional, aunque el dataset figure como aclMode "public".
// Verificado con peticiones HTTP directas contra el dataset real:
//   anonimo   -> count(*) = 63   (solo sanity.imageAsset), 0 servicios
//   con token -> count(*) = 117  (63 assets + 42 documentos + 12 system.group)
// Es decir, "public" hace publicos los ASSETS, no los documentos de contenido.
// Sin token el build saldria con 0 servicios, 0 posts y 0 testimonios — y en
// silencio, que es lo peligroso. De ahi el aserto de abajo.

import { createClient } from "@sanity/client";

// `import.meta.env` solo existe bajo Vite. Los scripts de tools/ importan este
// mismo modulo desde Node pelado, donde es undefined, asi que se cae a
// process.env en vez de reventar.
const env = (k: string): string | undefined =>
  (import.meta as any)?.env?.[k] ?? globalThis.process?.env?.[k];

export const projectId = env("PUBLIC_SANITY_PROJECT_ID") ?? "ep5i6co1";
export const dataset = env("PUBLIC_SANITY_DATASET") ?? "production";

const token = env("SANITY_READ_TOKEN") || env("SANITY_WRITE_TOKEN");

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion: "2021-06-07",
  useCdn: false, // en build queremos el dato fresco, no el cacheado
  token: token || undefined,
});

/**
 * Falla el build en voz alta si no hay token o si el dataset devuelve vacio.
 * Un sitio que se construye "bien" con 0 servicios es exactamente el fallo
 * silencioso que dejo a AB Aluminum sirviendo paginas rotas durante meses.
 */
export async function assertContenido() {
  if (!token) {
    throw new Error(
      "Falta SANITY_READ_TOKEN (o SANITY_WRITE_TOKEN).\n" +
        "El dataset no es legible sin token pese a figurar como aclMode public.\n" +
        "En local: .env  ·  En Vercel: variables de entorno del proyecto, por target.",
    );
  }
  const c = await sanity.fetch<{ s: number; p: number; r: number }>(
    '{"s":count(*[_type=="service"]),"p":count(*[_type=="post"]),"r":count(*[_type=="review"])}',
  );
  if (c.s !== 12 || c.p !== 10 || c.r !== 20) {
    throw new Error(
      `Contenido inesperado: ${c.s} servicios (12), ${c.p} posts (10), ${c.r} testimonios (20). ` +
        "Se aborta antes de construir un sitio incompleto.",
    );
  }
  return c;
}

const IMAGEN = `{
  "url": asset->url,
  "w": asset->metadata.dimensions.width,
  "h": asset->metadata.dimensions.height,
  "lqip": asset->metadata.lqip,
  alt, altEs
}`;

export type Imagen = {
  url: string; w: number; h: number; lqip?: string;
  alt?: string; altEs?: string;
} | null;

/**
 * URL de la imagen para `og:image`: 1200x630 recortado.
 *
 * NI WebP NI AVIF, nunca, aunque el resto del sitio sirva `fm=webp`: Facebook y
 * LinkedIn no los renderizan en las tarjetas y saldria una tarjeta rota. Es el
 * mismo motivo razonado en og-default.png.ts.
 *
 * JPEG y no PNG, que es lo unico que se aparta de aquella nota. PNG es sin
 * perdida y Sanity ignora `q` con `fm=png`: estas fotos salian de 402 KB a
 * 1,4 MB, y WhatsApp deja de pintar la miniatura pasados unos 300 KB — el
 * formato acabaria impidiendo justo lo que og:image venia a arreglar. En JPEG
 * son 39 KB y las cuatro plataformas lo renderizan. og-default.png sigue en PNG:
 * es un diseno plano y ahi PNG comprime mejor (23 KB).
 *
 * Devuelve undefined si no hay imagen, para que BaseLayout caiga a
 * /og-default.png sin que cada plantilla tenga que comprobarlo.
 */
export const ogUrl = (img: Imagen): string | undefined =>
  img ? `${img.url}?w=1200&h=630&fit=crop&q=80&fm=jpg` : undefined;

export type Servicio = {
  _id: string; title: string; slug: string; intro?: string; body?: any[];
  titleEs?: string; introEs?: string; bodyEs?: any[];
  feature: boolean; order?: number; icon: Imagen; picture: Imagen;
  metaTitle?: string; metaDescription?: string;
  metaTitleEs?: string; metaDescriptionEs?: string;
};

export type Post = {
  _id: string; title: string; slug: string; excerpt?: string; body?: any[];
  titleEs?: string; excerptEs?: string; bodyEs?: any[];
  heroImage: Imagen; publishedAt?: string; authorName?: string; order?: number;
  metaTitle?: string; metaDescription?: string;
  metaTitleEs?: string; metaDescriptionEs?: string;
};

/** Los testimonios NO se traducen: son palabras de clientes reales (FASE 5). */
export type Testimonio = { _id: string; author: string; quote: string };

// `order` es el orden de la coleccion en Webflow, recuperado del HTML de
// produccion (tools/restaurar-orden.mjs). El desempate por `title asc` NO es
// decoracion: mientras el campo este vacio en Sanity, GROQ ordenaria por nada y
// devolveria las 12 fichas en un orden arbitrario. Con el desempate, un dataset
// sin `order` se comporta exactamente como antes.
export const servicios = (): Promise<Servicio[]> =>
  sanity.fetch(`*[_type == "service"] | order(order asc, title asc){
    _id, title, "slug": slug.current, intro, body,
    titleEs, introEs, bodyEs, feature, order,
    icon ${IMAGEN}, picture ${IMAGEN},
    metaTitle, metaDescription, metaTitleEs, metaDescriptionEs
  }`);

export const posts = (): Promise<Post[]> =>
  sanity.fetch(`*[_type == "post"] | order(order asc, title asc){
    _id, title, "slug": slug.current, excerpt, body,
    titleEs, excerptEs, bodyEs, publishedAt, authorName, order,
    heroImage ${IMAGEN},
    metaTitle, metaDescription, metaTitleEs, metaDescriptionEs
  }`);

export const testimonios = (): Promise<Testimonio[]> =>
  sanity.fetch(`*[_type == "review"]{ _id, author, quote }`);

/**
 * NAP real, tomado del HTML en produccion. Vive en codigo y no en Sanity a
 * proposito: no debe pasar por el traductor ni por un editor por descuido
 * (FASE 5), y el JSON-LD de la FASE 6 depende de que sea exacto.
 */
export const NEGOCIO = {
  nombre: "Accounting Max Services",
  telefono: "+1 (754) 244-3993",
  telefonoHref: "tel:+17542443993",
  email: "info@accountingmaxservices.com",
  calle: "1700 N University Dr STE 210",
  ciudad: "Coral Springs",
  region: "FL",
  cp: "33071",
  pais: "US",
  horario: "Monday - Friday (8:00 AM - 5:00 PM)",
} as const;
