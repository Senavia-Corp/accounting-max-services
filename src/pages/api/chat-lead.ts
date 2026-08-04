// POST /api/chat-lead — lead endpoint for the n8n AI chat widget.
//
// Mirrors /api/lead's storage/notification pipeline exactly (source:"chat"
// instead of "contact-us", same Sanity dataset, same two emails) so the chat
// and the Contact Us form are indistinguishable downstream. What differs:
// JSON body instead of multipart, a shared-secret header instead of
// Turnstile/honeypot/time-trap, and its own rate-limit bucket keyed by the
// chat session_id instead of IP (the caller here is always n8n's server, not
// the visitor's browser, so an IP-keyed limit would just throttle n8n).
//
// ORDER:
//   1. shared-secret header      -> 401, FAIL-CLOSED. Every other gate in
//      this codebase fails open (see antibot.ts) because an outage should
//      never cost a real lead. This one is the exception: it is a privileged
//      direct-write path with no honeypot/time-trap/browser-origin signal
//      behind it, so a missing or wrong secret has to be a hard no.
//   2. body size ceiling         -> 413
//   3. field validation          -> 400
//   4. rate limit by session_id  -> 429
//   5. PII filter                -> 422, nothing saved or emailed
//   6. guardarLead (Sanity)      -> 500 on failure
//   7. two emails, in try/catch
//   8. { ok: true, id }

import type { APIRoute } from "astro";
import { NEGOCIO } from "../../lib/sanity";
import { limitePorIp } from "../../lib/antibot";
import { detectarPii, resumenPii, mensajeCanalSeguro } from "../../lib/pii";
import { construirAcuse, construirAvisoLead } from "../../lib/correo";
import { secretoValido } from "../../lib/chatAuth";
import {
  json,
  cuerpoDemasiadoGrande,
  limpiarMultilinea,
  emailValido,
  guardarLead,
  enviarAviso,
  DATASET_LEADS,
  T,
} from "./lead";

export const prerender = false;

// Mismo patron PROC/DEV_ENV que lead.ts y antibot.ts: process.env manda en
// runtime (lo que Vercel inyecta), y el acceso a import.meta.env queda
// encerrado en un `if (import.meta.env.DEV)` que Rollup borra del bundle de
// produccion, para no hornear el secreto en el artefacto.
const PROC: Record<string, string | undefined> = (globalThis as any).process?.env ?? {};
let DEV_ENV: Record<string, string | undefined> = {};
if (import.meta.env.DEV) {
  DEV_ENV = { CHAT_LEAD_SECRET: import.meta.env.CHAT_LEAD_SECRET };
}
const CHAT_LEAD_SECRET = PROC.CHAT_LEAD_SECRET ?? DEV_ENV.CHAT_LEAD_SECRET;

/** Igual que limpiar() en lead.ts, pero para un valor de JSON en vez de
 *  FormDataEntryValue: misma logica, tipo mas ancho. */
const limpiarTexto = (v: unknown, max: number): string => {
  if (typeof v !== "string") return "";
  let out = "";
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0;
    out += code <= 31 || code === 127 ? " " : ch;
  }
  return out.trim().slice(0, max);
};

/** El body del tool submit_request del agente puede mandar consent_calls /
 *  consent_sms como booleano JSON o como el string "true" segun como
 *  $fromAI() los resuelva n8n; se aceptan las dos formas. */
const esVerdadero = (v: unknown): boolean => v === true || v === "true";

type CuerpoChatLead = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  consent_calls?: unknown;
  consent_sms?: unknown;
  lang?: unknown;
  session_id?: unknown;
  consent_ip?: unknown;
};

export const POST: APIRoute = async ({ request }) => {
  // 1. Secreto compartido. FAIL-CLOSED: sin el, o si no coincide, 401 siempre.
  const secreto = request.headers.get("x-chat-lead-secret");
  if (!secretoValido(secreto, CHAT_LEAD_SECRET)) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  // 2. Techo de cuerpo, antes de leer nada.
  if (cuerpoDemasiadoGrande(request)) return json({ ok: false, error: T.grande.en }, 413);

  let body: CuerpoChatLead;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: T.metodo.en }, 400);
  }

  const langBruto = limpiarTexto(body.lang, 5).toLowerCase();
  const lang: "en" | "es" = langBruto === "es" ? "es" : "en";

  // 3. Validacion. full_name y al menos uno de {email, phone} son
  //    obligatorios; el resto no, porque el agente puede llamar a esta
  //    herramienta antes de tener todos los datos (system prompt en n8n).
  const fullName = limpiarTexto(body.full_name, 120);
  const emailBruto = limpiarTexto(body.email, 254).toLowerCase();
  const phoneBruto = limpiarTexto(body.phone, 40);
  const mensajeBruto = typeof body.message === "string" ? body.message : "";
  const sessionId = limpiarTexto(body.session_id, 200) || "sin-sesion";
  const consentIp = limpiarTexto(body.consent_ip, 100) || "desconocida";

  if (fullName.length < 2) return json({ ok: false, error: T.nombre[lang] }, 400);

  const email = emailBruto && emailValido(emailBruto) ? emailBruto : "";
  if (emailBruto && !email) return json({ ok: false, error: T.email[lang] }, 400);

  const digitosTel = phoneBruto.replace(/\D/g, "");
  const phone = phoneBruto && digitosTel.length >= 10 && digitosTel.length <= 15 ? phoneBruto : "";
  if (phoneBruto && !phone) return json({ ok: false, error: T.telefono[lang] }, 400);

  if (!email && !phone) {
    return json(
      {
        ok: false,
        error:
          lang === "es"
            ? "Escriba un correo electrónico o un teléfono."
            : "Please provide an email address or a phone number.",
      },
      400,
    );
  }

  if (mensajeBruto.length > 5000) return json({ ok: false, error: T.mensajeLargo[lang] }, 400);
  const message = limpiarMultilinea(mensajeBruto, 5000);

  // 4. Rate limit, bucket propio ("chat-lead"), por session_id: aqui la IP
  //    de la peticion siempre seria la de n8n, nunca la del visitante.
  const limite = limitePorIp("chat-lead", sessionId, 5, 10 * 60 * 1000);
  if (!limite.ok) {
    return new Response(JSON.stringify({ ok: false, error: T.demasiados[lang] }), {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(Math.ceil(limite.esperaMs / 1000)),
      },
    });
  }

  // 5. Filtro de PII, identico al de /api/lead. NI se guarda NI se manda.
  const hallazgos = detectarPii(`${fullName}\n${message}`);
  if (hallazgos.length) {
    console.warn(`[chat-lead] rechazado por PII (${resumenPii(hallazgos)}) — nada persistido`);
    return json({ ok: false, error: mensajeCanalSeguro(lang, NEGOCIO.telefono), pii: true }, 422);
  }

  const consentCall = esVerdadero(body.consent_calls);
  const consentSms = esVerdadero(body.consent_sms);
  const consentAt = new Date().toISOString();

  // 6. R7 — guardar antes de enviar.
  let id: string;
  try {
    id = await guardarLead({
      fullName,
      // LeadNuevo.email es string obligatorio (a diferencia de phone, que es
      // opcional) — "" es el valor honesto cuando el visitante solo dejo
      // telefono, no undefined, que rompe el tipo.
      email,
      phone: phone || undefined,
      message: message || undefined,
      lang,
      source: "chat",
      consentCall,
      consentSms,
      consentAt,
      consentIp,
    });
  } catch (e) {
    console.error(`[chat-lead] Sanity rechazo la escritura: ${(e as Error).message}`);
    return json({ ok: false, error: T.guardar[lang] }, 500);
  }

  // 7. Correo despues y en try/catch: un fallo de correo nunca pierde un lead.
  try {
    const base = { fullName, email, phone, message, lang, consentCall, consentSms };

    const aviso = construirAvisoLead(
      { ...base, consentAt, ip: consentIp, id, dataset: DATASET_LEADS, source: "chat" },
      NEGOCIO,
    );
    await enviarAviso({ ...aviso, responderA: email || undefined });

    // Sin email no hay a donde mandar el acuse; el aviso al despacho de
    // arriba ya cubre el caso "solo dejo telefono".
    if (email) {
      const acuse = construirAcuse({ ...base, channel: "chat" }, NEGOCIO);
      await enviarAviso({
        ...acuse,
        para: email,
        responderA: NEGOCIO.email,
        cabeceras: { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" },
      });
    }
  } catch (e) {
    console.error(`[chat-lead] aviso no enviado, lead ${id} guardado igualmente: ${(e as Error).message}`);
  }

  return json({ ok: true, id });
};

// Astro devolveria 404 para GET; un 405 explicito dice la verdad.
export const GET: APIRoute = () => json({ ok: false, error: T.metodo.en }, 405);
