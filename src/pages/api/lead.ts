// POST /api/lead — Lead Form de /contact-us.
//
// Ruta bajo demanda: el resto del sitio es estatico, esto sale como Vercel
// Function.
//
// ORDEN DE OPERACIONES, y el porque de cada paso:
//
//   1. tamano del cuerpo        -> techo antes de leer nada
//   2. R9: cero adjuntos        -> ningun valor que no sea texto
//   3. honeypot                 -> descarte SILENCIOSO (ok:true)
//   4. time-trap                -> 400
//   5. rate limit por IP        -> 429
//   6. validacion de campos     -> 400
//   7. filtro de PII            -> 422, NI se guarda NI se manda por correo
//   8. captcha (fail-open)      -> 403 solo si el proveedor dice que no
//   9. R7: GUARDAR en Sanity    -> si esto falla, 500 y se dice por telefono
//  10. correo, en try/catch     -> un fallo de correo NUNCA pierde un lead
//  11. { ok: true, id }
//
// R8: aqui no hay ni un redirect. /thank-you no existe, y contar su pageview
// como conversion es lo que dio seis meses de datos falsos en otro proyecto.
// La confirmacion es en linea y ya esta maquetada en contact-us.astro.
//
// Este fichero exporta ademas los ayudantes que comparte con /api/newsletter
// (guardarLead, enviarAviso, json, idiomaDe...). Viven aqui y no en src/lib/
// porque la FASE 4a solo posee estos cuatro ficheros; el sitio natural seria
// src/lib/correo.ts + src/lib/leads.ts y ahi deberian acabar cuando alguien
// tenga esos ficheros asignados.

import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { projectId, NEGOCIO } from "../../lib/sanity";
import {
  honeypotLleno,
  demasiadoRapido,
  limitePorIp,
  ipCliente,
  verificarCaptcha,
} from "../../lib/antibot";
import { detectarPii, resumenPii, mensajeCanalSeguro } from "../../lib/pii";

export const prerender = false;

// --- Variables de entorno: dos trampas verificadas, no supuestas ------------
//
// 1. `import.meta.env[k]` con clave DINAMICA lanza "Dynamic access of
//    import.meta.env is not supported" en el module runner de Vite y la ruta
//    devuelve 500 en `astro dev`. Por eso cada clave va literal.
//
// 2. `import.meta.env.CLAVE` con clave literal se SUSTITUYE EN BUILD por el
//    valor que tuviera la maquina que construye. Comprobado: el token de
//    escritura de Sanity aparecia en claro dentro de
//    .vercel/output/_functions/chunks/. Eso es hornear un secreto en el
//    artefacto: sobrevive a la rotacion del token y viaja a donde viaje el
//    build.
//
// Salida: en runtime manda SIEMPRE process.env (que es lo que Vercel inyecta);
// el acceso a import.meta.env queda encerrado en un `if (import.meta.env.DEV)`
// que Rollup elimina entero del bundle de produccion. Hace falta porque
// `astro dev` NO vuelca el .env a process.env — comprobado con una ruta de
// sonda: { procTieneToken: false, metaTieneToken: true }.
const PROC: Record<string, string | undefined> = (globalThis as any).process?.env ?? {};

let DEV_ENV: Record<string, string | undefined> = {};
if (import.meta.env.DEV) {
  DEV_ENV = {
    SANITY_LEADS_DATASET: import.meta.env.SANITY_LEADS_DATASET,
    SANITY_WRITE_TOKEN: import.meta.env.SANITY_WRITE_TOKEN,
    SMTP_HOST: import.meta.env.SMTP_HOST,
    SMTP_PORT: import.meta.env.SMTP_PORT,
    SMTP_USER: import.meta.env.SMTP_USER,
    SMTP_PASS: import.meta.env.SMTP_PASS,
    SMTP_FROM: import.meta.env.SMTP_FROM,
    AVISOS_TO: import.meta.env.AVISOS_TO,
  };
}

const ENV = {
  datasetLeads: PROC.SANITY_LEADS_DATASET ?? DEV_ENV.SANITY_LEADS_DATASET,
  tokenEscritura: PROC.SANITY_WRITE_TOKEN ?? DEV_ENV.SANITY_WRITE_TOKEN,
  smtpHost: PROC.SMTP_HOST ?? DEV_ENV.SMTP_HOST,
  smtpPort: PROC.SMTP_PORT ?? DEV_ENV.SMTP_PORT,
  smtpUser: PROC.SMTP_USER ?? DEV_ENV.SMTP_USER,
  smtpPass: PROC.SMTP_PASS ?? DEV_ENV.SMTP_PASS,
  smtpFrom: PROC.SMTP_FROM ?? DEV_ENV.SMTP_FROM,
  avisosTo: PROC.AVISOS_TO ?? DEV_ENV.AVISOS_TO,
} as const;

// --- Sanity: el dataset de leads NO es el de contenido ----------------------

/**
 * B3 — BLOQUEO. `production` esta hoy en aclMode "public": se lee entero desde
 * internet SIN token. Verificado, no supuesto. El primer lead que entrase ahi
 * seria PII de contribuyentes (nombre + telefono + correo + lo que cuenten de
 * su situacion fiscal) publicada en abierto.
 *
 * Por eso el destino se lee de SANITY_LEADS_DATASET. El fallback a
 * "production" existe para que el build y las previews no revienten, NO para
 * usarse: mientras SANITY_LEADS_DATASET no apunte a un dataset PRIVADO,
 * PUBLICAR ESTOS FORMULARIOS ESTA PROHIBIDO.
 *
 * Lo desbloquea el rol administrator del proyecto ep5i6co1 (B2), con una de
 * estas dos, no las dos:
 *   a) crear el dataset `leads` en privado y poner SANITY_LEADS_DATASET=leads
 *      en los tres targets de Vercel;   <- preferida: separa PII de contenido
 *   b) poner `production` en privado (feature privateDataset ya disponible en
 *      el proyecto, no hace falta subir de plan).
 *
 * Y D4 sigue abierto en paralelo: un preparador de impuestos no puede recoger
 * un dato sin publicar la politica de privacidad y el aviso GLBA.
 */
export const DATASET_LEADS = ENV.datasetLeads ?? "production";
export const DATASET_LEADS_ES_PUBLICO = DATASET_LEADS === "production";

if (DATASET_LEADS_ES_PUBLICO) {
  console.warn(
    "[lead] SANITY_LEADS_DATASET no esta definida: los leads irian a " +
      "'production', que es un dataset PUBLICO (B3). No publicar los " +
      "formularios en este estado.",
  );
}

const clienteLeads = createClient({
  projectId,
  dataset: DATASET_LEADS,
  apiVersion: "2021-06-07",
  useCdn: false,
  token: ENV.tokenEscritura,
});

// --- Utilidades compartidas ------------------------------------------------

export const json = (cuerpo: unknown, estado = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      // Ni buscadores ni IA deben indexar la respuesta de un endpoint de datos.
      "x-robots-tag": "noindex",
    },
  });

/** Techo de cuerpo. Un lead legitimo no pasa de unos pocos KB. */
export const MAX_CUERPO = 64 * 1024;

export function cuerpoDemasiadoGrande(request: Request, max = MAX_CUERPO): boolean {
  const n = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(n) && n > max;
}

/**
 * R9 — SIN SUBIDA DE FICHEROS, bajo ninguna circunstancia.
 *
 * Ninguna de las dos rutas tiene campo de archivo, pero el endpoint acepta
 * multipart (es lo que manda `fetch` con FormData), asi que un POST a mano
 * puede meter un fichero igualmente. Aqui se rechaza el envio entero sin leer
 * el contenido del Blob y sin guardarlo en ningun sitio. Un W-2 o un pasaporte
 * en un CDN publico es una brecha, y el CDN de assets de Sanity es publico.
 *
 * La otra mitad de la defensa es el techo de content-length, que corta antes
 * de que el fichero llegue a memoria.
 */
export function traeAdjuntos(datos: FormData): boolean {
  for (const [, valor] of datos.entries()) if (typeof valor !== "string") return true;
  return false;
}

/**
 * Recorta y quita caracteres de control. Ademas de higiene, esto es lo que
 * impide la inyeccion de cabeceras: un \r\n en el nombre acabaria dentro del
 * Subject: del aviso por correo.
 */
export const limpiar = (v: FormDataEntryValue | null, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "";

/** Igual, pero conserva los saltos de linea: el mensaje lleva parrafos. */
export const limpiarMultilinea = (v: string, max: number): string =>
  v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);

const RE_EMAIL = /^[^\s@,;:<>()[\]\\]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
export const emailValido = (v: string): boolean => v.length <= 254 && RE_EMAIL.test(v);

/** Idioma del prospecto. Se guarda para responderle en su idioma (R6/FASE 5). */
export function idiomaDe(datos: FormData, request: Request): "en" | "es" {
  const explicito = String(datos.get("lang") ?? "").toLowerCase();
  if (explicito.startsWith("es")) return "es";
  if (explicito.startsWith("en")) return "en";
  try {
    const ruta = new URL(request.headers.get("referer") ?? "").pathname;
    if (ruta === "/es" || ruta.startsWith("/es/")) return "es";
  } catch {
    /* sin referer valido: se sigue */
  }
  const idioma = (request.headers.get("accept-language") ?? "").split(",")[0]?.trim().toLowerCase();
  return idioma?.startsWith("es") ? "es" : "en";
}

// --- Persistencia (R7: esto va SIEMPRE antes que el correo) ----------------

export type LeadNuevo = {
  fullName?: string;
  email: string;
  phone?: string;
  message?: string;
  lang: "en" | "es";
  source: string;
  consentCall: boolean;
  /**
   * FTSA/TCPA tratan llamada y SMS como consentimientos SEPARADOS, y el
   * formulario los pide por separado. `lead` en src/sanity/schemas.mjs solo
   * tiene `consentCall`, asi que este campo se escribe igualmente aunque el
   * Studio lo marque como desconocido: perder una prueba de consentimiento es
   * peor que un aviso en la UI. PENDIENTE: anadir `consentSms` (boolean) al
   * esquema — ese fichero no pertenece a la FASE 4a.
   */
  consentSms: boolean;
  /**
   * CAN-SPAM: consentimiento expreso para el boletin. Solo lo pone
   * /api/newsletter. Mismo PENDIENTE de esquema que `consentSms`.
   */
  consentEmailMarketing?: boolean;
  consentAt: string;
  consentIp: string;
};

export async function guardarLead(lead: LeadNuevo): Promise<string> {
  const doc = await clienteLeads.create({
    _type: "lead",
    ...lead,
    receivedAt: new Date().toISOString(),
  });
  return doc._id;
}

// --- Correo saliente -------------------------------------------------------

/**
 * Aviso por correo. Nunca lanza y nunca decide el resultado de la peticion.
 *
 * Si faltan variables SMTP registra un aviso y devuelve enviado:false. El lead
 * YA esta guardado en ese punto (R7), asi que no se pierde nada: se lee en
 * Sanity. Esto es lo que permite que el correo se conecte despues sin tocar el
 * endpoint.
 *
 * SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS · SMTP_FROM · AVISOS_TO
 *
 * El remitente tiene que ser del dominio del cliente y estar alineado con el
 * SPF/DKIM que ya vive en esa zona (B1: MX, SPF y DKIM no se tocan). NO se usa
 * un Gmail personal con App Password: es la cuenta de una persona, no del
 * despacho, se cae el dia que esa persona cambia la contrasena o activa 2FA
 * distinta, y en el traspaso el cliente no la recupera.
 *
 * nodemailer NO esta instalado hoy. El import es dinamico y con especificador
 * en variable para que el bundler no intente resolverlo en build; si el
 * paquete no esta, se registra el aviso y ya.
 */
export type Aviso = {
  asunto: string;
  texto: string;
  para?: string;
  responderA?: string;
  cabeceras?: Record<string, string>;
};

export async function enviarAviso(aviso: Aviso): Promise<{ enviado: boolean; motivo: string }> {
  const cfg = {
    host: ENV.smtpHost,
    port: Number(ENV.smtpPort ?? 587),
    user: ENV.smtpUser,
    pass: ENV.smtpPass,
    from: ENV.smtpFrom,
    to: aviso.para || ENV.avisosTo || NEGOCIO.email,
  };

  const faltan = (["host", "user", "pass", "from"] as const).filter((k) => !cfg[k]);
  if (faltan.length) {
    // Sin el cuerpo: lleva nombre, correo y telefono de una persona real, y los
    // logs de Vercel los ve cualquiera con acceso al proyecto.
    console.warn(
      `[correo] sin enviar "${aviso.asunto}": faltan ${faltan
        .map((k) => `SMTP_${k.toUpperCase()}`)
        .join(", ")}. El lead esta guardado en Sanity (dataset ${DATASET_LEADS}).`,
    );
    return { enviado: false, motivo: "sin-configuracion" };
  }

  try {
    // Especificador LITERAL, no una variable. El original usaba
    // `await import(modulo)` con @vite-ignore porque nodemailer NO estaba
    // instalado y una importacion literal habria roto el build. Ya lo esta,
    // y ahora el literal es lo correcto: con la variable, el rastreador de
    // dependencias del adaptador de Vercel no ve el paquete y NO lo empaqueta
    // en la funcion — el envio fallaria en produccion con "Cannot find module
    // nodemailer", y como enviarAviso() traga sus errores, el sintoma seria un
    // lead guardado del que nunca llega aviso. Sigue siendo dinamico para no
    // pagar ~1 MB de arranque en frio en las peticiones que no envian correo.
    const { default: nodemailer } = await import("nodemailer");
    const transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporte.sendMail({
      from: cfg.from,
      to: cfg.to,
      subject: aviso.asunto,
      text: aviso.texto,
      replyTo: aviso.responderA,
      headers: aviso.cabeceras,
    });
    return { enviado: true, motivo: "ok" };
  } catch (e) {
    console.warn(`[correo] fallo al enviar "${aviso.asunto}": ${(e as Error).message}`);
    return { enviado: false, motivo: "error-envio" };
  }
}

// --- Mensajes de error (bilingues: el prospecto los lee) --------------------

const T = {
  metodo: { en: "Method not allowed.", es: "Método no permitido." },
  grande: { en: "That message is too large.", es: "El mensaje es demasiado grande." },
  adjunto: {
    en: "This form does not accept file attachments. Please send text only.",
    es: "Este formulario no acepta archivos adjuntos. Envíe solo texto.",
  },
  rapido: {
    en: "That was submitted too quickly. Please try again.",
    es: "El envío llegó demasiado rápido. Inténtelo de nuevo.",
  },
  demasiados: {
    en: "Too many submissions from this connection. Please try again in a few minutes.",
    es: "Demasiados envíos desde esta conexión. Inténtelo de nuevo en unos minutos.",
  },
  nombre: { en: "Please enter your name.", es: "Escriba su nombre." },
  email: { en: "Please enter a valid email address.", es: "Escriba un correo electrónico válido." },
  telefono: { en: "Please enter a valid phone number.", es: "Escriba un teléfono válido." },
  mensajeLargo: {
    en: "The message is limited to 5000 characters.",
    es: "El mensaje está limitado a 5000 caracteres.",
  },
  captcha: { en: "Verification failed. Please try again.", es: "La verificación falló. Inténtelo de nuevo." },
  guardar: {
    en: `We could not save your request. Please call us at ${NEGOCIO.telefono}.`,
    es: `No pudimos guardar su solicitud. Llámenos al ${NEGOCIO.telefono}.`,
  },
} as const;

// --- Ruta ------------------------------------------------------------------

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = ipCliente(request, clientAddress);

  // 1. Techo de cuerpo, antes de leer nada.
  if (cuerpoDemasiadoGrande(request)) return json({ ok: false, error: T.grande.en }, 413);

  let datos: FormData;
  try {
    datos = await request.formData();
  } catch {
    return json({ ok: false, error: T.metodo.en }, 400);
  }

  const lang = idiomaDe(datos, request);

  // 2. R9 — cero adjuntos.
  if (traeAdjuntos(datos)) return json({ ok: false, error: T.adjunto[lang] }, 400);

  // 3. Honeypot: descarte SILENCIOSO. Se responde ok para no ensenarle al bot
  //    cual de los campos lo delato; el lead no se guarda ni se envia.
  if (honeypotLleno(datos)) {
    console.warn(`[lead] honeypot relleno, descartado (ip ${ip})`);
    return json({ ok: true, id: null });
  }

  // 4. Time-trap.
  const tiempo = demasiadoRapido(datos);
  if (!tiempo.ok) {
    console.warn(`[lead] time-trap: ${tiempo.motivo} (ip ${ip})`);
    return json({ ok: false, error: T.rapido[lang] }, 400);
  }

  // 5. Rate limit por IP (D6: version en-funcion, ver src/lib/antibot.ts).
  const limite = limitePorIp("lead", ip, 5, 10 * 60 * 1000);
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

  // 6. Validacion. Los names salen de contact-us.astro tal cual:
  //    full_name · email · phone · message · consent_calls · consent_sms
  const fullName = limpiar(datos.get("full_name"), 120);
  const email = limpiar(datos.get("email"), 254).toLowerCase();
  const phone = limpiar(datos.get("phone"), 40);
  const mensajeBruto = typeof datos.get("message") === "string" ? String(datos.get("message")) : "";

  if (fullName.length < 2) return json({ ok: false, error: T.nombre[lang] }, 400);
  if (!emailValido(email)) return json({ ok: false, error: T.email[lang] }, 400);
  const digitosTel = phone.replace(/\D/g, "");
  if (digitosTel.length < 10 || digitosTel.length > 15)
    return json({ ok: false, error: T.telefono[lang] }, 400);
  // El maxlength del HTML es 5000. Se rechaza en vez de truncar: cortar el
  // mensaje a la mitad sin decirlo pierde justo la parte que el cliente
  // consideraba importante.
  if (mensajeBruto.length > 5000) return json({ ok: false, error: T.mensajeLargo[lang] }, 400);
  const message = limpiarMultilinea(mensajeBruto, 5000);

  // 7. Filtro de PII sobre el texto que escribe la persona. Si hay SSN, ITIN,
  //    EIN, tarjeta o cuenta: NO se guarda, NO se manda por correo, y se
  //    responde indicando el canal seguro. El texto rechazado no se registra
  //    en ningun log; del hallazgo solo viaja el tipo.
  const hallazgos = detectarPii(`${fullName}\n${message}`);
  if (hallazgos.length) {
    console.warn(`[lead] rechazado por PII (${resumenPii(hallazgos)}) — nada persistido`);
    return json({ ok: false, error: mensajeCanalSeguro(lang, NEGOCIO.telefono), pii: true }, 422);
  }

  // 8. Captcha, si algun dia se conecta. FAIL-OPEN.
  const captcha = await verificarCaptcha(
    typeof datos.get("cf-turnstile-response") === "string"
      ? String(datos.get("cf-turnstile-response"))
      : null,
    ip,
  );
  // Se registra SIEMPRE, pase o no. Si manana caen los leads hay que poder
  // distinguir "menos spam" de "estamos bloqueando gente", y para eso no basta
  // con contar rechazos: hace falta el denominador.
  console.warn(`[lead] captcha ${captcha.motivo} (ip ${ip})`);
  if (!captcha.ok) return json({ ok: false, error: T.captcha[lang] }, 403);

  // 9. R7 — GUARDAR ANTES DE ENVIAR.
  const consentCall = String(datos.get("consent_calls") ?? "") === "yes";
  const consentSms = String(datos.get("consent_sms") ?? "") === "yes";
  const consentAt = new Date().toISOString();

  let id: string;
  try {
    id = await guardarLead({
      fullName,
      email,
      phone,
      message: message || undefined,
      lang,
      source: "contact-us",
      consentCall,
      consentSms,
      // Fecha e IP se guardan SIEMPRE, marquen o no las casillas: son la prueba
      // de cuando y desde donde se envio el formulario, y para FTSA/TCPA la
      // prueba del consentimiento tiene que ir fechada. Las dos casillas
      // califican QUE se consintio.
      consentAt,
      consentIp: ip,
    });
  } catch (e) {
    console.error(`[lead] Sanity rechazo la escritura: ${(e as Error).message}`);
    return json({ ok: false, error: T.guardar[lang] }, 500);
  }

  // 10. Correo DESPUES y en try/catch. Que falle no puede tocar la respuesta:
  //     el lead ya esta guardado.
  try {
    await enviarAviso({
      asunto: `Nuevo lead: ${fullName}`,
      responderA: email,
      texto: [
        `Nombre:   ${fullName}`,
        `Correo:   ${email}`,
        `Telefono: ${phone}`,
        `Idioma:   ${lang}`,
        `Llamadas: ${consentCall ? "SI consiente" : "no"}`,
        `SMS:      ${consentSms ? "SI consiente" : "no"}`,
        `Fecha:    ${consentAt}`,
        `IP:       ${ip}`,
        `Sanity:   ${id} (dataset ${DATASET_LEADS})`,
        "",
        message || "(sin mensaje)",
      ].join("\n"),
    });
  } catch (e) {
    console.error(`[lead] aviso no enviado, lead ${id} guardado igualmente: ${(e as Error).message}`);
  }

  return json({ ok: true, id });
};

// Astro devolveria 404 para GET; un 405 explicito dice la verdad.
export const GET: APIRoute = () => json({ ok: false, error: T.metodo.en }, 405);
