// POST /api/chat-verify — verifies a Turnstile token from the chat widget
// and, on success, sets the short-lived HMAC-signed "human verified" cookie
// that /api/chat requires. Called once when the widget opens.
//
// Reuses verificarCaptcha()/ipCliente() from antibot.ts — the same
// Cloudflare siteverify call, the same fail-open/fail-closed semantics, and
// the same TURNSTILE_SECRET_KEY the Contact Us form already trusts — instead
// of reimplementing the Cloudflare call a second time.
export const prerender = false;

import type { APIRoute } from "astro";
import { verificarCaptcha, ipCliente } from "../../lib/antibot";
import { signToken } from "../../lib/chatAuth";

const PROC: Record<string, string | undefined> = (globalThis as any).process?.env ?? {};
let DEV_ENV: Record<string, string | undefined> = {};
if (import.meta.env.DEV) {
  DEV_ENV = { CHAT_COOKIE_SECRET: import.meta.env.CHAT_COOKIE_SECRET };
}
const CHAT_COOKIE_SECRET = PROC.CHAT_COOKIE_SECRET ?? DEV_ENV.CHAT_COOKIE_SECRET;
const TTL_MS = 30 * 60 * 1000;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!CHAT_COOKIE_SECRET) {
    // Sin secreto de firma no hay forma segura de emitir la cookie: se deja
    // pasar (fail-open), igual que /api/chat cuando el gate no esta
    // configurado todavia.
    return new Response(JSON.stringify({ ok: true, mode: "open" }), {
      headers: { "content-type": "application/json" },
    });
  }

  let token: string | null = null;
  try {
    const body = await request.json();
    token = typeof body?.token === "string" ? body.token : null;
  } catch {
    /* sin cuerpo valido: token queda null y verificarCaptcha lo rechaza si hay clave configurada */
  }

  const ip = ipCliente(request, clientAddress);
  const captcha = await verificarCaptcha(token, ip);
  if (!captcha.ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  cookies.set("chat_ok", signToken(Date.now() + TTL_MS, CHAT_COOKIE_SECRET), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: TTL_MS / 1000,
  });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
