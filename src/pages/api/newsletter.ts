// POST /api/newsletter — formulario del pie (src/components/FooterSubscribe.astro).
//
// Un solo campo real: email. Todo lo demas (honeypot, rate limit, persistencia,
// correo) se reutiliza de /api/lead: misma politica, un solo sitio donde
// cambiarla. Ver la nota de propiedad de ficheros al principio de lead.ts.
//
// Diferencias con /api/lead, todas deliberadas:
//   - NO hay campo `ts`: el formulario del pie no lo lleva. El time-trap se
//     llama igual y falla-abierto (ver demasiadoRapido en antibot.ts).
//   - Limite por IP mas estrecho: 3 en 10 minutos. Nadie se suscribe cuatro
//     veces desde la misma conexion en diez minutos.
//   - CAN-SPAM: consentimiento expreso registrado con fecha e IP, y mecanismo
//     de baja desde el primer correo.
//
// R8: sin redirect. La confirmacion es en linea, ya maquetada en el pie.

import type { APIRoute } from "astro";
import { NEGOCIO } from "../../lib/sanity";
import { honeypotLleno, demasiadoRapido, limitePorIp, ipCliente, verificarCaptcha } from "../../lib/antibot";
import { detectarPii, resumenPii, mensajeCanalSeguro } from "../../lib/pii";
import {
  json,
  limpiar,
  emailValido,
  idiomaDe,
  guardarLead,
  enviarAviso,
  traeAdjuntos,
  cuerpoDemasiadoGrande,
  DATASET_LEADS,
} from "./lead";

export const prerender = false;

/**
 * CAN-SPAM — mecanismo de baja.
 *
 * La ley exige que TODO correo comercial lleve una via de baja clara y que se
 * atienda en 10 dias habiles. Aqui es un `mailto:` al buzon real del despacho,
 * no una URL de /unsubscribe: esa pagina NO existe (R3 — no se enlaza a algo
 * inventado, y R8 — no se fabrican rutas para contar conversiones). El mailto
 * es un mecanismo valido y funciona desde el dia uno.
 *
 * No lleva el correo del suscriptor en la query: el cliente de correo ya pone
 * el remitente, y meter PII en una URL es tirarla a logs y a historiales.
 *
 * PENDIENTE cuando exista SMTP: pagina o endpoint de baja de un clic
 * (List-Unsubscribe-Post) y doble opt-in. Hasta entonces NO SE PUEDE ENVIAR
 * ningun correo comercial a estas direcciones; lo unico que sale de aqui es el
 * aviso INTERNO al despacho.
 */
export const ENLACE_BAJA = `mailto:${NEGOCIO.email}?subject=${encodeURIComponent("Unsubscribe")}`;

const T = {
  metodo: { en: "Method not allowed.", es: "Método no permitido." },
  grande: { en: "That request is too large.", es: "La petición es demasiado grande." },
  adjunto: {
    en: "This form does not accept file attachments.",
    es: "Este formulario no acepta archivos adjuntos.",
  },
  email: { en: "Please enter a valid email address.", es: "Escriba un correo electrónico válido." },
  demasiados: {
    en: "Too many submissions from this connection. Please try again in a few minutes.",
    es: "Demasiados envíos desde esta conexión. Inténtelo de nuevo en unos minutos.",
  },
  captcha: { en: "Verification failed. Please try again.", es: "La verificación falló. Inténtelo de nuevo." },
  guardar: {
    en: `We could not save your subscription. Please call us at ${NEGOCIO.telefono}.`,
    es: `No pudimos guardar su suscripción. Llámenos al ${NEGOCIO.telefono}.`,
  },
} as const;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = ipCliente(request, clientAddress);

  // Un correo son 254 caracteres como mucho: 8 KB sobran de largo.
  if (cuerpoDemasiadoGrande(request, 8 * 1024)) return json({ ok: false, error: T.grande.en }, 413);

  let datos: FormData;
  try {
    datos = await request.formData();
  } catch {
    return json({ ok: false, error: T.metodo.en }, 400);
  }

  const lang = idiomaDe(datos, request);

  // R9 — sin adjuntos, tampoco aqui.
  if (traeAdjuntos(datos)) return json({ ok: false, error: T.adjunto[lang] }, 400);

  // Honeypot 'ref_id': descarte silencioso.
  if (honeypotLleno(datos)) {
    console.warn(`[newsletter] honeypot relleno, descartado (ip ${ip})`);
    return json({ ok: true, id: null });
  }

  // Time-trap: el pie no manda `ts`, asi que esto pasa siempre hoy. Se deja
  // llamado para que el dia que el campo exista funcione sin tocar la ruta.
  const tiempo = demasiadoRapido(datos);
  if (!tiempo.ok) {
    console.warn(`[newsletter] time-trap: ${tiempo.motivo} (ip ${ip})`);
    return json({ ok: false, error: T.demasiados[lang] }, 400);
  }

  const limite = limitePorIp("newsletter", ip, 3, 10 * 60 * 1000);
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

  const email = limpiar(datos.get("email"), 254).toLowerCase();
  if (!emailValido(email)) return json({ ok: false, error: T.email[lang] }, 400);

  // Un correo no deberia contener un SSN, pero el campo lo acepta todo hasta que
  // se valida y el filtro es barato. Mismo trato: no se guarda ni se envia.
  const hallazgos = detectarPii(email);
  if (hallazgos.length) {
    console.warn(`[newsletter] rechazado por PII (${resumenPii(hallazgos)}) — nada persistido`);
    return json({ ok: false, error: mensajeCanalSeguro(lang, NEGOCIO.telefono), pii: true }, 422);
  }

  const captcha = await verificarCaptcha(
    typeof datos.get("cf-turnstile-response") === "string"
      ? String(datos.get("cf-turnstile-response"))
      : null,
    ip,
  );
  // Igual que en /api/lead: se registra siempre, para tener el denominador.
  console.warn(`[newsletter] captcha ${captcha.motivo} (ip ${ip})`);
  if (!captcha.ok) return json({ ok: false, error: T.captcha[lang] }, 403);

  // R7 — guardar primero.
  const consentAt = new Date().toISOString();
  let id: string;
  try {
    id = await guardarLead({
      email,
      lang,
      source: "newsletter-footer",
      // El pie NO pide telefono: no hay consentimiento de llamada ni de SMS que
      // registrar, y darlo por bueno seria fabricar un consentimiento (R3).
      consentCall: false,
      consentSms: false,
      // El acto de enviar ESTE formulario es el consentimiento expreso para el
      // boletin, y queda fechado y con IP. Ver la nota de LeadNuevo: el campo
      // aun no esta en src/sanity/schemas.mjs.
      consentEmailMarketing: true,
      consentAt,
      consentIp: ip,
    });
  } catch (e) {
    console.error(`[newsletter] Sanity rechazo la escritura: ${(e as Error).message}`);
    return json({ ok: false, error: T.guardar[lang] }, 500);
  }

  // Correo despues y en try/catch: la suscripcion ya esta guardada.
  //
  // Esto es el aviso INTERNO. La bienvenida al suscriptor no se manda todavia
  // (ver ENLACE_BAJA arriba): sin doble opt-in ni pagina de baja no se envia
  // correo comercial. La cabecera List-Unsubscribe va puesta desde ya para que
  // el dia que se conecte el envio no dependa de que alguien se acuerde.
  try {
    await enviarAviso({
      asunto: "Nueva suscripcion al boletin",
      cabeceras: { "List-Unsubscribe": `<${ENLACE_BAJA}>` },
      texto: [
        `Correo:  ${email}`,
        `Idioma:  ${lang}`,
        `Fecha:   ${consentAt}`,
        `IP:      ${ip}`,
        `Origen:  newsletter-footer`,
        `Sanity:  ${id} (dataset ${DATASET_LEADS})`,
        "",
        `Baja: ${ENLACE_BAJA}`,
      ].join("\n"),
    });
  } catch (e) {
    console.error(`[newsletter] aviso no enviado, ${id} guardado igualmente: ${(e as Error).message}`);
  }

  return json({ ok: true, id });
};

export const GET: APIRoute = () => json({ ok: false, error: T.metodo.en }, 405);
