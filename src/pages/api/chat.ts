// POST /api/chat — same-origin proxy in front of the n8n chat webhook.
//
// NOT a dumb byte-passthrough (unlike senavia-corp's /api/chat.ts), por dos
// razones distintas:
//
// 1. Inyecta la IP REAL del visitante en el cuerpo antes de reenviarlo. La
//    llamada que n8n hace luego a /api/chat-lead lleva SIEMPRE la IP de n8n,
//    nunca la del visitante: este proxy es el unico salto de toda la cadena
//    que toca la conexion real del navegador, asi que es el unico sitio donde
//    `consentIp` se puede resolver con la verdad.
//
// 2. NO devuelve al visitante lo que conteste n8n sin mirarlo. Esto no es
//    teorico: con el workflow sin publicar, n8n contesta
//    `{"message":"The requested webhook \"POST <uuid>/chat\" is not
//    registered."}` — y el relay tal cual le enseño ese UUID a un visitante
//    dentro de la burbuja del chat, que es EXACTAMENTE lo que este proxy
//    existe para esconder. El mismo fallo de forma distinta ya paso en
//    senavia-corp: con el workspace de n8n caducado el host entero devolvia
//    una pagina HTML de 404 y el chat pintaba el HTML en crudo.
//
//    Regla que queda: solo se relaya una respuesta que TENGA FORMA de
//    respuesta de chat (2xx + JSON + `output` o `data`). Cualquier otra cosa
//    se registra entera del lado del servidor y al visitante le llega un
//    mensaje util con el telefono del despacho.
//
// Ademas exige la cookie de Turnstile que pone /api/chat-verify. Falla
// ABIERTO mientras TURNSTILE_SECRET_KEY y CHAT_COOKIE_SECRET no esten las dos
// configuradas, para que el chat nunca se rompa durante el montaje — misma
// filosofia que el captcha del formulario de contacto.
export const prerender = false;

import type { APIRoute } from "astro";
import { NEGOCIO } from "../../lib/sanity";
import { ipCliente } from "../../lib/antibot";
import { verifyToken } from "../../lib/chatAuth";

// UUID que acuño n8n al crear el nodo trigger "Website Chat" (workflow
// xdZYxSYTDCigzobb, "AMS — Website Sales Chat"). Estable mientras no se borre
// y se recree ese nodo. No es un secreto de alto valor, pero tampoco tiene por
// que salir del servidor: ver la razon 2 de la cabecera.
const N8N_WEBHOOK = "https://senavia.app.n8n.cloud/webhook/303bd375-63ad-4579-a7ec-f14c4686e847/chat";

const PROC: Record<string, string | undefined> = (globalThis as any).process?.env ?? {};
let DEV_ENV: Record<string, string | undefined> = {};
if (import.meta.env.DEV) {
  DEV_ENV = {
    TURNSTILE_SECRET_KEY: import.meta.env.TURNSTILE_SECRET_KEY,
    CHAT_COOKIE_SECRET: import.meta.env.CHAT_COOKIE_SECRET,
  };
}
const TURNSTILE_SECRET_KEY = PROC.TURNSTILE_SECRET_KEY ?? DEV_ENV.TURNSTILE_SECRET_KEY;
const CHAT_COOKIE_SECRET = PROC.CHAT_COOKIE_SECRET ?? DEV_ENV.CHAT_COOKIE_SECRET;

/**
 * Respuesta al widget. SIEMPRE 200, aunque por dentro sea una averia.
 *
 * El unico consumidor es @n8n/chat, que pinta `output` como un mensaje del
 * bot; con un codigo de error el widget puede tragarse el cuerpo y enseñar su
 * propio mensaje generico, y entonces el telefono del despacho —que es lo
 * unico util que le queda al visitante cuando el asistente no responde— no
 * llega nunca. El error de verdad se registra del lado del servidor.
 */
const respuestaChat = (texto: string): Response =>
  new Response(JSON.stringify({ output: texto }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** El NAP sale de NEGOCIO (src/lib/sanity.ts), unica fuente, nunca a mano. */
const AVERIA = {
  en: `Sorry — our assistant is not available right now. Please call us at ${NEGOCIO.telefono} or email ${NEGOCIO.email} and a member of our team will help you.`,
  es: `Lo sentimos: el asistente no está disponible en este momento. Llámenos al ${NEGOCIO.telefono} o escríbanos a ${NEGOCIO.email} y le atenderá una persona del equipo.`,
} as const;

const VERIFICAR = {
  en: "Please refresh the page so we can verify you are human.",
  es: "Recargue la página para que podamos verificar que es una persona.",
} as const;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const raw = await request.text();

  // El idioma sale del metadata que manda el widget (site_lang). Se resuelve
  // ANTES de cualquier rama de error para que todas puedan contestar en el
  // idioma de la pagina; sin el, cae a ingles.
  let lang: "en" | "es" = "en";
  let cuerpo: Record<string, any> | null = null;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") {
      cuerpo = parsed;
      if (parsed.metadata?.site_lang === "es") lang = "es";
    }
  } catch {
    /* cuerpo no-JSON: se reenvia tal cual mas abajo */
  }

  const gate = !!TURNSTILE_SECRET_KEY && !!CHAT_COOKIE_SECRET;
  if (gate && !verifyToken(cookies.get("chat_ok")?.value, CHAT_COOKIE_SECRET!)) {
    return respuestaChat(VERIFICAR[lang]);
  }

  // Inyecta metadata.visitor_ip antes de reenviar. Si el cuerpo no era JSON
  // (sonda, o un cliente roto) se reenvia intacto: el If de n8n justo despues
  // del trigger ya corta eso sin gastar una llamada al modelo, asi que fallar
  // abierto aqui no cuesta nada.
  let forwardBody = raw;
  if (cuerpo) {
    cuerpo.metadata = { ...(cuerpo.metadata ?? {}), visitor_ip: ipCliente(request, clientAddress) };
    forwardBody = JSON.stringify(cuerpo);
  }

  let res: Response;
  let texto: string;
  try {
    res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: forwardBody,
    });
    texto = await res.text();
  } catch (e) {
    console.error(`[chat] n8n inalcanzable: ${(e as Error).message}`);
    return respuestaChat(AVERIA[lang]);
  }

  // ¿Tiene forma de respuesta de chat? `{output: "..."}` es la del agente con
  // responseMode:lastNode; `{data: []}` es la del nodo "Ignore probe" y la que
  // el widget espera para loadPreviousSession. Cualquier otra cosa —un 404 de
  // webhook sin registrar, un 500 del workflow, una pagina HTML del propio
  // n8n— NO se le enseña a nadie.
  let datos: any = null;
  try {
    datos = JSON.parse(texto);
  } catch {
    /* no era JSON */
  }
  const tieneFormaDeChat =
    res.ok && !!datos && typeof datos === "object" && ("output" in datos || "data" in datos);

  if (!tieneFormaDeChat) {
    // Truncado: una pagina de error de n8n son kilobytes de HTML y esto va a
    // los logs de la funcion en Vercel.
    console.error(`[chat] respuesta inesperada de n8n (HTTP ${res.status}): ${texto.slice(0, 300)}`);
    return respuestaChat(AVERIA[lang]);
  }

  return new Response(texto, {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};
