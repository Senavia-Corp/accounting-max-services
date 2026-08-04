// POST /api/chat — same-origin proxy in front of the n8n chat webhook.
//
// NOT a dumb byte-passthrough (unlike senavia-corp's /api/chat.ts): this
// proxy has to parse the widget's JSON body and inject the visitor's real IP
// before forwarding to n8n. n8n's own outgoing call to /api/chat-lead always
// carries n8n's IP, never the visitor's — this proxy is the only hop in the
// whole pipeline that ever touches the real browser connection, so it is the
// only place `consentIp` can be resolved truthfully.
//
// Also gates on the Turnstile-verified cookie set by /api/chat-verify, same
// mechanism as senavia-corp. Fail-open until TURNSTILE_SECRET_KEY and
// CHAT_COOKIE_SECRET are both configured, so the chat never breaks during
// setup — same philosophy as the Contact Us form's captcha.
export const prerender = false;

import type { APIRoute } from "astro";
import { ipCliente } from "../../lib/antibot";
import { verifyToken } from "../../lib/chatAuth";

// UUID minted by n8n when the "Website Chat" trigger node was created
// (workflow xdZYxSYTDCigzobb, "AMS — Website Sales Chat"). Stable unless the
// trigger node is deleted and recreated.
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

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const gate = !!TURNSTILE_SECRET_KEY && !!CHAT_COOKIE_SECRET;
  if (gate) {
    const ok = verifyToken(cookies.get("chat_ok")?.value, CHAT_COOKIE_SECRET!);
    if (!ok) {
      return new Response(JSON.stringify({ output: "Please refresh the page to verify you are human." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const raw = await request.text();
  const ip = ipCliente(request, clientAddress);

  // Inyecta metadata.visitor_ip en el cuerpo antes de reenviarlo. Si el
  // cuerpo no es JSON valido (sonda, o un cliente roto) se reenvia tal cual:
  // el If de n8n justo despues del trigger ya filtra eso sin gastar una
  // llamada al modelo, asi que fallar abierto aqui no cuesta nada.
  let forwardBody = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.metadata = { ...(parsed.metadata ?? {}), visitor_ip: ip };
    forwardBody = JSON.stringify(parsed);
  } catch {
    /* cuerpo no-JSON: se reenvia sin tocar */
  }

  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: forwardBody,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ output: "Chat is temporarily unavailable. Please try again." }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
};
