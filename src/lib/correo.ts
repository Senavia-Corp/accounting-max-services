// Los dos correos HTML de los formularios.
//
//   construirAcuse()      -> al prospecto, a la direccion que escribio, en SU idioma.
//   construirAvisoLead()  -> al despacho (AVISOS_TO), etiquetas bilingues EN / ES.
//
// Los dos son PUROS: mismos datos, mismo correo. Ni red, ni env, ni reloj salvo
// el formateo de una fecha que llega como parametro. Eso es lo que permite que
// tools/correo-check.mjs los cargue con `node` a pelo y los compruebe de verdad,
// que es la unica puerta automatica que tiene este repo (`npm run build` NO
// comprueba tipos: no hay typescript ni @astrojs/check instalados).
//
// CERO IMPORTS, y es un requisito, no una preferencia:
//
//   - `import { NEGOCIO } from "./sanity"` no resuelve bajo node pelado
//     (ERR_MODULE_NOT_FOUND: los especificadores relativos necesitan extension),
//     y con extension el editor se queja bajo moduleResolution "bundler".
//     Por eso el NAP entra POR PARAMETRO. Es el patron que ya usa pii.ts con
//     mensajeCanalSeguro(lang, NEGOCIO.telefono): NEGOCIO (src/lib/sanity.ts)
//     sigue siendo la unica fuente del NAP, solo cambia quien lo pasa.
//   - `import.meta.env` aqui reventaria en `astro dev` (acceso dinamico en el
//     module runner de Vite) o hornearia valores en el artefacto si fuera
//     literal. Este fichero no lee ni una variable de entorno.
//
// COMO SE ESCRIBE UN CORREO QUE NO SE ROMPE. Esto no es la web; el cliente de
// correo mas usado del mundo renderiza como un navegador de 2003:
//
//   - Maqueta con TABLAS. Nada de flex, grid, position ni float.
//   - CSS EN LINEA en cada elemento. El <style> del <head> solo lleva media
//     queries, el bloque de modo oscuro y el reset de los data-detectors de
//     Apple: Gmail borra <style> en cuanto reenvias el mensaje.
//   - NI UNA CUSTOM PROPERTY. var(--verde) no existe en Outlook: hex literal.
//   - 600 px, con width="600" COMO ATRIBUTO ademas del max-width, porque el
//     renderizador de Word (Outlook de escritorio) ignora el estilo.
//   - Alternativa de texto plano SIEMPRE. No es opcional: hay quien lee en
//     texto plano y los filtros penalizan un correo solo-HTML.
//   - Nada critico dentro de una imagen. Con las imagenes bloqueadas los dos
//     correos tienen que seguir entendiendose enteros.

export type Lang = "en" | "es";

/** El NAP, tal cual sale de NEGOCIO en src/lib/sanity.ts. */
export type Negocio = Readonly<{
  nombre: string;
  telefono: string;
  telefonoHref: string;
  email: string;
  calle: string;
  ciudad: string;
  region: string;
  cp: string;
  horario: string;
}>;

export type Correo = { asunto: string; texto: string; html: string };

/** Lo que escribio el prospecto. Todo ya pasado por limpiar()/limpiarMultilinea(). */
export type DatosAcuse = {
  fullName: string;
  email: string;
  phone: string;
  /** "" si no escribio nada. */
  message: string;
  lang: Lang;
  consentCall: boolean;
  consentSms: boolean;
  /**
   * SLA de respuesta. `undefined` usa PLAZO; `null` fuerza el hueco visible.
   * El null existe para que la comprobacion pueda ejercitar las dos ramas sin
   * tocar la constante.
   */
  plazo?: string | null;
};

/** Lo anterior mas lo que anade el servidor. */
export type DatosAvisoLead = Omit<DatosAcuse, "plazo"> & {
  /** ISO. Es la prueba fechada del consentimiento: se imprime tal cual. */
  consentAt: string;
  ip: string;
  /** _id del documento en Sanity. */
  id: string;
  /** DATASET_LEADS. Llega por parametro y no por import: lead.ts ya importa
   *  este fichero, y traerselo de vuelta seria un ciclo ESM. */
  dataset: string;
  source: string;
};

// --- Paleta y constantes ---------------------------------------------------

// HEX LITERAL. Contraste MEDIDO (WCAG 2.1), no supuesto:
//
//   #ffffff sobre #243137 ......... 13.38:1  AA/AAA
//   #1f2b30 sobre #6da228 .........  4.73:1  AA   <- texto de boton sobre verde
//   #243137 sobre #6da228 .........  4.36:1  FALLA. El navy DE MARCA no llega.
//   #ffffff sobre #6da228 .........  3.07:1  solo texto grande. No se usa.
//   #4e751c sobre #ffffff .........  5.41:1  AA   <- el verde COMO TEXTO
//   #6da228 sobre #ffffff .........  3.07:1  FALLA. Solo como fondo o filete.
//   #5d6b70 sobre #ffffff .........  5.52:1  AA   <- letra pequena
//   #ffffff sobre #b3261e .........  6.54:1  AA   <- insignia "sin consentimiento"
//
// #1f2b30 NO esta en el CSS del sitio: es --bllue un paso mas oscuro, y existe
// solo porque #243137 se queda en 4.36 sobre el verde de marca. El verde
// #6da228 es INTOCABLE (es del cliente) y no admite ni blanco ni navy encima.

const FUENTE =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Ubuntu,Roboto,Arial,Helvetica,sans-serif";
// Sin webfonts: stix-two-text esta atado al dominio (Typekit) y no cargaria
// nunca en un cliente de correo, y Campton tiene la licencia PENDIENTE (D2).

/**
 * Logo en PNG. El original en Sanity es SVG y ningun cliente de correo serio lo
 * pinta; el CDN lo rasteriza con ?fm=png (comprobado: 200 image/png).
 * Se usa la variante de tinta BLANCA porque va sobre la banda navy, que es navy
 * en claro y en oscuro: ninguna inversion de tema la deja invisible.
 */
const LOGO =
  "https://cdn.sanity.io/images/ep5i6co1/production/fd46633765c3cb436b96e96e560c43fe51cf16f9-150x122.svg?w=240&fm=png";

/**
 * Plazo de respuesta que el despacho se compromete a cumplir.
 * Ponerlo a null hace que los dos idiomas pinten {{PENDIENTE: plazo}} A LA
 * VISTA, que es la convencion de la casa para un hueco real (ver i18n.ts:38).
 */
export const PLAZO: Readonly<Record<Lang, string>> | null = {
  en: "one business day",
  es: "un día hábil",
};
const HUECO_PLAZO = "{{PENDIENTE: plazo}}";

/**
 * Host del Studio de Sanity, para enlazar el documento desde el aviso.
 * HOY NO HAY NINGUNO: el proyecto ep5i6co1 no tiene studioHost reclamado, no
 * hay sanity.config.* en el repo ni ruta /studio, y desplegar uno esta bloqueado
 * por B2 (el token es Editor y no puede tocar CORS). No se enlaza a algo que no
 * existe: el aviso imprime el _id en texto, que es lo que se pega en una GROQ.
 * El dia que exista un Studio, esto es una linea y la fila se convierte en enlace.
 */
export const STUDIO_HOST: string | null = null;

// --- Helpers ---------------------------------------------------------------

/**
 * Escape de HTML. ESTO ES UNA FRONTERA DE SEGURIDAD, no una comodidad.
 *
 * fullName, message, email y phone los escribe un desconocido y acaban dentro
 * de HTML, y dos de ellos DENTRO DE UN ATRIBUTO href:
 *   - `email` admite comillas dobles: RE_EMAIL en lead.ts excluye < > @ y
 *     espacios, pero no la comilla, y a"b@ejemplo.com pasa la validacion.
 *   - `phone` solo se mide en digitos, asi que
 *     754244399<img src=x onerror=alert(1)>3 tiene 10 y pasa.
 * Se escapa tambien la comilla simple para que valga en atributos con ' .
 */
export const esc = (v: string): string =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Texto multilinea -> HTML. ESCAPAR PRIMERO, PARTIR DESPUES. Al reves, el <br>
 * que acabas de meter se escapa y el texto hostil no.
 */
const parrafo = (v: string): string => esc(v).replace(/\r?\n/g, "<br>");

/**
 * href="tel:" a partir de texto de usuario. El escape solo no basta: se tira
 * todo lo que no sea digito o +, que ademas es lo unico que entiende un
 * marcador.
 */
const hrefTel = (v: string): string => "tel:" + v.replace(/[^0-9+]/g, "");

/**
 * href="mailto:" a partir de texto de usuario. Tampoco basta con escapar.
 * RE_EMAIL (lead.ts) excluye \s @ , ; : < > ( ) [ ] \ — pero NO excluye ? ni &,
 * y en un mailto esos dos son SEPARADORES DE CABECERA: `a?subject=X&body=Y@x.com`
 * pasa la validacion, y al pulsar el boton del aviso se le abriria al despacho
 * el cliente de correo con un asunto y un cuerpo escritos por un desconocido.
 * Se percent-codifica lo estructural, asi que la direccion sigue leyendose pero
 * deja de poder inventarse cabeceras. Tampoco excluye la comilla doble, que
 * aqui se va en el mismo barrido.
 */
const hrefMail = (v: string): string =>
  "mailto:" +
  v.replace(/[%?&#"'<>\s]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));

/** Fecha legible en hora de Florida. El ISO va al lado: ese es la prueba. */
const fechaEt = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return (
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/New_York",
      }).format(d) + " ET"
    );
  } catch {
    return "";
  }
};

/** Marcadores {clave}. Copia literal de interpola() en i18n.ts: una linea pura
 *  duplicada sale mas barata que importar 47 KB y perder el cero-imports. */
const interpola = (s: string, v: Record<string, string>): string =>
  s.replace(/\{(\w+)\}/g, (todo, k: string) => v[k] ?? todo);

// --- Piezas compartidas ----------------------------------------------------

/**
 * Banda de cabecera, en dos modos:
 *   logo:true  -> acuse: logo blanco sobre navy y el nombre del despacho DEBAJO,
 *                 como texto. Si el cliente bloquea la imagen, el correo sigue
 *                 diciendo de quien es.
 *   logo:false -> aviso interno: barra estrecha con titulo. El logo son ~118 px
 *                 de primera pantalla, y lo primero que hay que leer ahi es el
 *                 NOMBRE y el TELEFONO del lead, no la marca.
 * El filete verde de 4 px repite el de og-default.png.
 */
const cabecera = (n: Negocio, o: { logo: boolean; titulo?: string }): string => `
<tr>
  <td align="${o.logo ? "center" : "left"}" bgcolor="#243137" style="background-color:#243137;padding:${
    o.logo ? "24px 24px 8px" : "16px 24px"
  };">
    ${
      o.logo
        ? `<img src="${esc(LOGO)}" width="120" height="98" alt="${esc(n.nombre)}"
             style="display:block;border:0;outline:none;text-decoration:none;width:120px;max-width:120px;height:auto;">`
        : `<div style="margin:0;font-family:${FUENTE};font-size:15px;line-height:21px;font-weight:700;color:#ffffff;">${esc(
            o.titulo ?? n.nombre,
          )}</div>`
    }
  </td>
</tr>
${
  o.logo
    ? `<tr>
  <td align="center" bgcolor="#243137" style="background-color:#243137;padding:6px 24px 20px;">
    <div style="margin:0;font-family:${FUENTE};font-size:17px;line-height:24px;font-weight:700;color:#ffffff;">${esc(
      n.nombre,
    )}</div>
  </td>
</tr>`
    : ""
}
<tr>
  <td height="4" bgcolor="#6da228" style="height:4px;font-size:0;line-height:0;background-color:#6da228;mso-line-height-rule:exactly;">&#8203;</td>
</tr>`;

/**
 * Pie con el NAP completo, tal cual sale de NEGOCIO y SIN pasar por el
 * traductor — el horario incluido, que se pinta en ingles tambien en el correo
 * en espanol (regla de la cabecera de i18n.ts). Por eso va sin etiqueta
 * delante: un "Horario:" en ES delante de un valor en EN es peor que nada.
 */
const pie = (n: Negocio): string => `
<tr>
  <td class="ams-pad" style="padding:22px 32px 30px;font-family:${FUENTE};font-size:13px;line-height:20px;color:#5d6b70;">
    <div style="font-family:${FUENTE};font-size:14px;line-height:20px;font-weight:700;color:#243137;" class="ams-tinta">${esc(
      n.nombre,
    )}</div>
    <div class="ams-apagado" style="font-family:${FUENTE};font-size:13px;line-height:20px;color:#5d6b70;">${esc(
      n.calle,
    )}<br>${esc(n.ciudad)}, ${esc(n.region)} ${esc(n.cp)}</div>
    <div class="ams-apagado" style="font-family:${FUENTE};font-size:13px;line-height:20px;color:#5d6b70;"><a href="${esc(
      n.telefonoHref,
    )}" style="color:#4e751c;text-decoration:underline;">${esc(
      n.telefono,
    )}</a>&nbsp;&middot;&nbsp;<a href="${esc(
      hrefMail(n.email),
    )}" style="color:#4e751c;text-decoration:underline;">${esc(n.email)}</a></div>
    <div class="ams-apagado" style="font-family:${FUENTE};font-size:13px;line-height:20px;color:#5d6b70;">${esc(
      n.horario,
    )}</div>
  </td>
</tr>`;

/**
 * Boton: un <a> con padding sobre una celda con background-color. Ni <button>
 * ni JavaScript. Escapa href y texto EL PROPIO helper — un contrato mixto
 * ("este escapa, este no") es de donde salen los agujeros.
 */
const boton = (href: string, texto: string, fondo: string, tinta: string): string => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="ams-cta" style="border-collapse:collapse;margin:0 0 10px;">
  <tr>
    <td align="center" bgcolor="${fondo}" style="background-color:${fondo};border-radius:5px;mso-padding-alt:0;">
      <a href="${esc(
        href,
      )}" style="display:inline-block;padding:15px 30px;font-family:${FUENTE};font-size:17px;line-height:20px;font-weight:700;color:${tinta};text-decoration:none;border-radius:5px;">${esc(
        texto,
      )}</a>
    </td>
  </tr>
</table>`;

/**
 * Barra de consentimiento. FTSA/TCPA: "no consiente" no puede ser una linea
 * mas de una lista, porque decide si es legal descolgar el telefono. Va a
 * ancho completo, con COLOR, con SIMBOLO y con ETIQUETA — el color solo no
 * vale (WCAG SC 1.4.1) y ademas Gmail en oscuro puede invertirlo. Los
 * !important en linea son el truco estandar para que no se la de.
 */
const barraConsentimiento = (ok: boolean, etiqueta: string): string => {
  const fondo = ok ? "#4e751c" : "#b3261e";
  const simbolo = ok ? "&#10003;" : "&#10007;"; // ✓ / ✗
  return `
<tr>
  <td bgcolor="${fondo}" style="background-color:${fondo} !important;border-radius:5px;padding:12px 16px;font-family:${FUENTE};font-size:15px;line-height:21px;font-weight:700;color:#ffffff !important;">${simbolo}&nbsp;&nbsp;${esc(
    etiqueta,
  )}</td>
</tr>
<tr><td height="8" style="height:8px;font-size:0;line-height:0;">&#8203;</td></tr>`;
};

/** El armazon del documento. Aqui viven las UNICAS reglas no-en-linea. */
const documento = (lang: Lang, titulo: string, preheader: string, cuerpo: string): string =>
  `<!doctype html>
<html lang="${lang}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<title>${esc(titulo)}</title>
<style>
/* Solo media queries y resets: TODO lo demas va en linea, porque Gmail borra
   este bloque en cuanto alguien reenvia el mensaje. */
:root{color-scheme:light dark;supported-color-schemes:light dark;}
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table{border-collapse:collapse;}
img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
/* Apple Mail autodetecta telefonos y direcciones y les pinta su propio azul. */
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}

@media only screen and (max-width:620px){
  .ams-pad{padding-left:18px!important;padding-right:18px!important;}
  .ams-h1{font-size:21px!important;line-height:28px!important;}
  .ams-xl{font-size:22px!important;line-height:29px!important;}
  .ams-cta,.ams-cta table{width:100%!important;}
  .ams-cta a{display:block!important;padding-left:14px!important;padding-right:14px!important;}
}

/* Modo oscuro real: Apple Mail, iOS Mail, Outlook.com. Gmail NO lee esto —
   invierte por su cuenta—, y por eso todo elemento con color de texto lleva
   ademas su propio background-color: asi los dos se invierten juntos y nunca
   queda texto claro sobre fondo claro. */
@media (prefers-color-scheme:dark){
  .ams-body{background-color:#10171a!important;}
  .ams-card{background-color:#1b2429!important;}
  .ams-caja{background-color:#222d33!important;}
  .ams-tinta,.ams-tinta a{color:#e8eef0!important;}
  .ams-apagado,.ams-apagado a{color:#a9b5ba!important;}
  .ams-verde{color:#9dbf43!important;}
}
</style>
</head>
<body class="ams-body" style="margin:0;padding:0;background-color:#eef1f2;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(
    preheader,
  )}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ams-body" style="width:100%;background-color:#eef1f2;">
  <tr>
    <td align="center" style="padding:20px 10px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;">
${cuerpo}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

// --- Correo A: acuse al prospecto ------------------------------------------

// Mismas reglas que i18n.ts: registro USTED, glosario intraducible (IRS,
// Enrolled Agent, CPA...) y el NAP FUERA de la tabla — {telefono} lo pone
// NEGOCIO y la direccion, el correo y el horario los pinta pie().
//
// Lo que este correo NO puede llevar, y esta comprobado en correo-check.mjs:
//   - Ni un dato que no escribiera la persona. Es un eco, no un expediente.
//   - Nada que suene a asesoria fiscal. Lo dice ademas en voz alta.
//   - NI UN ENLACE DE BAJA: es correo transaccional, y bajo CAN-SPAM no lo
//     necesita. Ponerlo lo convierte en marketing.
const COPIA_ACUSE = {
  en: {
    asunto: "We received your request — Accounting Max Services",
    preheader: "A copy of what you sent us, and what happens next.",
    h1: "We received your request",
    saludo: "Hello {nombre},",
    intro:
      "Thank you for contacting Accounting Max Services. This message confirms that your request reached our office. It is a receipt only — it is not tax advice.",
    resumen: "What you sent us",
    etNombre: "Name",
    etEmail: "Email",
    etTelefono: "Phone",
    etMensaje: "Message",
    siguiente: "What happens next",
    plazoFrase: "A member of our team reviews your request and replies within {plazo}.",
    canalSolo:
      "We will reply by email. We will not call or text you, because you left both consent boxes unchecked on the form.",
    canalLlamada:
      "We will reply by email, and we may also call or text you at the number you gave us, because you agreed to it on the form.",
    urgente: "If your matter is urgent, call us:",
    ctaLlamar: "Call {telefono}",
    aviso:
      "You are receiving this message because the contact form at accountingmaxservices.com was submitted with this email address. It confirms receipt of that request and nothing else.",
  },
  es: {
    asunto: "Hemos recibido su solicitud — Accounting Max Services",
    preheader: "Una copia de lo que nos envió y qué pasa a continuación.",
    h1: "Hemos recibido su solicitud",
    saludo: "Hola, {nombre}:",
    intro:
      "Gracias por escribir a Accounting Max Services. Este mensaje confirma que su solicitud llegó a nuestra oficina. Es solo un acuse de recibo: no es asesoría fiscal.",
    resumen: "Lo que nos envió",
    etNombre: "Nombre",
    etEmail: "Correo electrónico",
    etTelefono: "Teléfono",
    etMensaje: "Mensaje",
    siguiente: "Qué pasa a continuación",
    plazoFrase: "Una persona del equipo revisa su solicitud y le responde en un plazo de {plazo}.",
    canalSolo:
      "Le responderemos por correo electrónico. No le llamaremos ni le escribiremos por mensaje de texto, porque dejó sin marcar las dos casillas de consentimiento del formulario.",
    canalLlamada:
      "Le responderemos por correo electrónico y, además, podemos llamarle o escribirle por mensaje de texto al número que nos facilitó, porque lo autorizó en el formulario.",
    urgente: "Si su asunto es urgente, llámenos:",
    ctaLlamar: "Llamar al {telefono}",
    aviso:
      "Este mensaje se le envía porque se completó el formulario de contacto de accountingmaxservices.com con esta dirección. Solo confirma la recepción de esa solicitud.",
  },
} as const;

/**
 * El eco del mensaje se RECORTA. Este correo sale a una direccion que escribio
 * un desconocido: alguien puede poner el correo de otra persona y usar el
 * textarea como megafono con el remitente del despacho. El captcha, el
 * honeypot, el time-trap y el limite por IP acotan el volumen; esto acota la
 * carga util. El texto integro esta en Sanity y en el aviso interno.
 */
const MAX_ECO = 600;

export function construirAcuse(d: DatosAcuse, n: Negocio): Correo {
  const c = COPIA_ACUSE[d.lang];
  const plazo = d.plazo === null ? HUECO_PLAZO : (d.plazo ?? PLAZO?.[d.lang] ?? HUECO_PLAZO);
  const canal = d.consentCall || d.consentSms ? c.canalLlamada : c.canalSolo;
  const eco = d.message.length > MAX_ECO ? d.message.slice(0, MAX_ECO) + "…" : d.message;

  const fila = (etiqueta: string, valorHtml: string): string => `
<tr>
  <td class="ams-apagado" style="padding:10px 0 0;font-family:${FUENTE};font-size:13px;line-height:18px;color:#5d6b70;">${esc(
    etiqueta,
  )}</td>
</tr>
<tr>
  <td class="ams-tinta" style="padding:1px 0 0;font-family:${FUENTE};font-size:15px;line-height:22px;color:#333333;word-break:break-word;">${valorHtml}</td>
</tr>`;

  const cuerpo = `
${cabecera(n, { logo: true })}

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:30px 32px 4px;">
    <h1 class="ams-h1 ams-tinta" style="margin:0 0 16px;font-family:${FUENTE};font-size:24px;line-height:32px;font-weight:700;color:#243137;">${esc(
      c.h1,
    )}</h1>
    <p class="ams-tinta" style="margin:0 0 14px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;">${esc(
      interpola(c.saludo, { nombre: d.fullName }),
    )}</p>
    <p class="ams-tinta" style="margin:0 0 24px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;">${esc(
      c.intro,
    )}</p>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ams-caja" bgcolor="#f4f6f6" style="width:100%;background-color:#f4f6f6;border-radius:6px;">
      <tr>
        <td class="ams-verde" style="padding:16px 18px 4px;font-family:${FUENTE};font-size:12px;line-height:16px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#4e751c;">${esc(
          c.resumen,
        )}</td>
      </tr>
      <tr>
        <td style="padding:0 18px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            ${fila(c.etNombre, esc(d.fullName))}
            ${fila(
              c.etEmail,
              `<a href="${esc(hrefMail(d.email))}" style="color:#4e751c;text-decoration:underline;">${esc(
                d.email,
              )}</a>`,
            )}
            ${fila(
              c.etTelefono,
              `<a href="${esc(hrefTel(d.phone))}" style="color:#4e751c;text-decoration:underline;">${esc(
                d.phone,
              )}</a>`,
            )}
            ${d.message ? fila(c.etMensaje, parrafo(eco)) : ""}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:26px 32px 0;">
    <div class="ams-verde" style="font-family:${FUENTE};font-size:12px;line-height:16px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#4e751c;">${esc(
      c.siguiente,
    )}</div>
    <p class="ams-tinta" style="margin:10px 0 8px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;">${esc(
      interpola(c.plazoFrase, { plazo }),
    )}</p>
    <p class="ams-tinta" style="margin:0 0 22px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;">${esc(
      canal,
    )}</p>
    <p class="ams-tinta" style="margin:0 0 12px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;">${esc(
      c.urgente,
    )}</p>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:0 32px 8px;">
    ${boton(n.telefonoHref, interpola(c.ctaLlamar, { telefono: n.telefono }), "#6da228", "#1f2b30")}
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:14px 32px 26px;">
    <div style="height:1px;font-size:0;line-height:0;background-color:#dedede;">&#8203;</div>
    <p class="ams-apagado" style="margin:14px 0 0;font-family:${FUENTE};font-size:12px;line-height:18px;color:#5d6b70;">${esc(
      c.aviso,
    )}</p>
  </td>
</tr>

${pie(n)}`;

  const texto = [
    c.h1,
    n.nombre,
    "",
    interpola(c.saludo, { nombre: d.fullName }),
    "",
    c.intro,
    "",
    c.resumen.toUpperCase(),
    `${c.etNombre}: ${d.fullName}`,
    `${c.etEmail}: ${d.email}`,
    `${c.etTelefono}: ${d.phone}`,
    ...(d.message ? [`${c.etMensaje}:`, eco.replace(/^/gm, "  ")] : []),
    "",
    c.siguiente.toUpperCase(),
    interpola(c.plazoFrase, { plazo }),
    canal,
    "",
    `${c.urgente} ${n.telefono}`,
    "",
    c.aviso,
    "",
    "--",
    n.nombre,
    n.calle,
    `${n.ciudad}, ${n.region} ${n.cp}`,
    `${n.telefono} · ${n.email}`,
    n.horario,
  ].join("\n");

  return { asunto: c.asunto, texto, html: documento(d.lang, c.asunto, c.preheader, cuerpo) };
}

// --- Correo B: aviso al despacho -------------------------------------------

// Etiquetas BILINGUES EN / ES: va a info@, que es un despacho bilingue.
// Jerarquia, y el orden importa:
//   1. Nombre, telefono y correo arriba del todo, grandes y pulsables. Es lo
//      unico que hace falta para actuar.
//   2. El mensaje de la persona.
//   3. Los consentimientos, destacados. Bajo FTSA/TCPA determinan si es legal
//      llamar o mandar un SMS.
//   4. Fecha, IP e id de Sanity al final y en letra pequena: es la prueba
//      fechada del consentimiento, tiene que estar, pero no manda.

/** Ancho de la etiqueta en la version de texto. La mas larga es
 *  "Language / Idioma:" con 18. */
const ANCHO_ET = 19;

export function construirAvisoLead(d: DatosAvisoLead, n: Negocio): Correo {
  // limpiar() ya quito los CR/LF del nombre, asi que no hay inyeccion de cabecera.
  // Se deja igual que hoy: si el despacho tiene un filtro de Gmail montado sobre
  // esta cadena, cambiarla lo rompe en silencio.
  const asunto = `Nuevo lead: ${d.fullName}`;
  const idioma = d.lang === "es" ? "Español" : "English";
  const et = fechaEt(d.consentAt);

  const filaPequena = (etiqueta: string, valorHtml: string): string => `
<tr>
  <td width="120" valign="top" style="width:120px;padding:3px 10px 3px 0;font-family:${FUENTE};font-size:12px;line-height:18px;color:#5d6b70;">${esc(
    etiqueta,
  )}</td>
  <td valign="top" style="padding:3px 0;font-family:${FUENTE};font-size:12px;line-height:18px;color:#333333;word-break:break-all;">${valorHtml}</td>
</tr>`;

  const cuerpo = `
${cabecera(n, { logo: false, titulo: `New lead / Nuevo lead · ${d.source} · ${idioma}` })}

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 28px 6px;">
    <div class="ams-xl ams-tinta" style="font-family:${FUENTE};font-size:25px;line-height:33px;font-weight:700;color:#243137;word-break:break-word;">${esc(
      d.fullName,
    )}</div>
  </td>
</tr>
<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 28px 0;">
    ${boton(hrefTel(d.phone), `Call / Llamar ${d.phone}`, "#6da228", "#1f2b30")}
    ${boton(hrefMail(d.email), d.email, "#243137", "#ffffff")}
    <p class="ams-apagado" style="margin:2px 0 0;font-family:${FUENTE};font-size:12px;line-height:18px;color:#5d6b70;">Reply goes straight to the lead / Al responder este correo le escribe a la persona.</p>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:20px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ams-caja" bgcolor="#f4f6f6" style="width:100%;background-color:#f4f6f6;border-radius:6px;">
      <tr>
        <td class="ams-tinta" style="padding:16px 18px;font-family:${FUENTE};font-size:16px;line-height:24px;color:#333333;word-break:break-word;">${
          d.message
            ? parrafo(d.message)
            : `<span style="color:#5d6b70;font-style:italic;">(no message / sin mensaje)</span>`
        }</td>
      </tr>
    </table>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:22px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      ${barraConsentimiento(
        d.consentCall,
        d.consentCall
          ? "CAN CALL / PUEDE LLAMAR — consintió llamadas"
          : "DO NOT CALL / NO LLAMAR — sin consentimiento",
      )}
      ${barraConsentimiento(
        d.consentSms,
        d.consentSms
          ? "CAN TEXT / PUEDE ENVIAR SMS — consintió mensajes"
          : "DO NOT TEXT / NO ENVIAR SMS — sin consentimiento",
      )}
    </table>
  </td>
</tr>

<tr>
  <td class="ams-card ams-pad" bgcolor="#ffffff" style="background-color:#ffffff;padding:8px 28px 24px;">
    <div style="height:1px;font-size:0;line-height:0;background-color:#dedede;">&#8203;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="ams-apagado" style="width:100%;margin-top:12px;">
      ${filaPequena("Language / Idioma", esc(idioma))}
      ${filaPequena("Date / Fecha", `${esc(d.consentAt)}${et ? `<br>${esc(et)}` : ""}`)}
      ${filaPequena("IP", esc(d.ip))}
      ${filaPequena(
        "Sanity",
        STUDIO_HOST
          ? `<a href="${esc(
              `https://${STUDIO_HOST}/intent/edit/id=${encodeURIComponent(d.id)};type=lead`,
            )}" style="color:#4e751c;text-decoration:underline;">${esc(d.id)}</a> (dataset ${esc(
              d.dataset,
            )})`
          : `${esc(d.id)} (dataset ${esc(d.dataset)})`,
      )}
      ${filaPequena("Source / Origen", esc(d.source))}
    </table>
  </td>
</tr>

${pie(n)}`;

  // La alternativa de texto es EL AVISO DE HOY: los mismos nueve campos y en el
  // mismo orden, con la etiqueta ampliada a EN / ES. Lo unico que cambia de
  // fondo son los dos consentimientos, que pasan a gritar. Escanea igual de
  // rapido en el movil que el de hoy porque es el de hoy.
  const linea = (etiqueta: string, v: string) => `${(etiqueta + ":").padEnd(ANCHO_ET)}${v}`;
  const texto = [
    linea("Name / Nombre", d.fullName),
    linea("Email / Correo", d.email),
    linea("Phone / Teléfono", d.phone),
    linea("Language / Idioma", idioma),
    linea("Calls / Llamadas", d.consentCall ? "YES / SÍ" : "NO — DO NOT CALL / NO LLAMAR"),
    linea("SMS", d.consentSms ? "YES / SÍ" : "NO — DO NOT TEXT / NO ENVIAR SMS"),
    linea("Date / Fecha", `${d.consentAt}${et ? ` (${et})` : ""}`),
    linea("IP", d.ip),
    linea("Sanity", `${d.id} (dataset ${d.dataset})`),
    linea("Source / Origen", d.source),
    "",
    d.message || "(no message / sin mensaje)",
  ].join("\n");

  return { asunto, texto, html: documento("es", asunto, `${d.phone} · ${d.email}`, cuerpo) };
}
