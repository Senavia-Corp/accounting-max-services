// Comprobacion de los dos correos de /api/lead.
//
//   node tools/correo-check.mjs
//   node tools/correo-check.mjs --dump acuse-es > /tmp/acuse-es.html
//
// Sin red, sin SMTP, sin variables de entorno: los dos constructores de
// src/lib/correo.ts son puros. Lo unico que hace falta es node.
//
// Esta es la UNICA puerta automatica del repo para este codigo: `npm run build`
// NO comprueba tipos (no hay typescript ni @astrojs/check instalados), asi que
// un campo mal escrito o una clave que falta saldrian en verde. Correr los dos
// en la misma respiracion.
//
// El --dump escupe el HTML por stdout para abrirlo en el navegador a 320 px y
// con el modo oscuro emulado. No escribe ningun fichero.
//
// La extension .ts en los imports es OBLIGATORIA: node resuelve los .ts del
// repo por type-stripping, pero un especificador relativo sin extension da
// ERR_MODULE_NOT_FOUND. Por eso correo.ts va con cero imports.

import { JSDOM } from "jsdom";
import { NEGOCIO } from "../src/lib/sanity.ts";
import { construirAcuse, construirAvisoLead, esc, PLAZO } from "../src/lib/correo.ts";

let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos++;
    console.log("  FALLO  " + msg);
  } else {
    console.log("  ok     " + msg);
  }
};

const BENIGNO = {
  fullName: "Ana María Pérez",
  email: "ana@ejemplo.com",
  phone: "(754) 244-3993",
  message: "Necesito ayuda con mi declaración.\nTengo dos negocios.\nGracias & saludos.",
  lang: "es",
  consentCall: false,
  consentSms: false,
};

// TODO esto pasa hoy la validacion de /api/lead: limpiar() solo quita caracteres
// de control, RE_EMAIL no excluye la comilla doble, y el telefono solo se mide
// en digitos (aqui quedan 10). O sea: no es un caso inventado.
const HOSTIL = {
  fullName: `Ana "><script>alert(1)</script> & Cía`,
  email: `a"b@ejemplo.com`,
  phone: `754 244 3993" onmouseover="alert(1)`,
  message: `linea 1\n<img src=x onerror=alert(1)>\nlinea 3 & final`,
  lang: "en",
  consentCall: false,
  consentSms: false,
};

const EXTRAS = {
  consentAt: "2026-08-01T16:20:11.482Z",
  ip: "203.0.113.9",
  id: "aBcD-1234",
  dataset: "leads",
  source: "contact-us",
};

const acuseEn = construirAcuse({ ...BENIGNO, lang: "en" }, NEGOCIO);
const acuseEs = construirAcuse({ ...BENIGNO, lang: "es" }, NEGOCIO);
const aviso = construirAvisoLead({ ...BENIGNO, ...EXTRAS }, NEGOCIO);
const acuseMal = construirAcuse(HOSTIL, NEGOCIO);
const avisoMal = construirAvisoLead({ ...HOSTIL, ...EXTRAS }, NEGOCIO);

const iDump = process.argv.indexOf("--dump");
if (iDump > -1) {
  const cuales = {
    "acuse-en": acuseEn,
    "acuse-es": acuseEs,
    aviso,
    "acuse-hostil": acuseMal,
    "aviso-hostil": avisoMal,
  };
  const m = cuales[process.argv[iDump + 1]];
  if (!m) {
    console.error("uso: --dump " + Object.keys(cuales).join("|"));
    process.exit(2);
  }
  console.log(m.html);
  process.exit(0);
}

// --- 1. Escape: la frontera de seguridad -----------------------------------
console.log("\nescape de lo que escribe un desconocido");
for (const [nombre, c] of [
  ["acuse", acuseMal],
  ["aviso", avisoMal],
]) {
  const doc = new JSDOM(c.html).window.document;
  ok(doc.querySelectorAll("script").length === 0, `${nombre}: ningun <script> inyectado`);
  ok(doc.querySelectorAll("img[onerror]").length === 0, `${nombre}: ningun onerror`);
  ok(
    [...doc.querySelectorAll("*")].every(
      (el) => ![...el.attributes].some((a) => a.name.toLowerCase().startsWith("on")),
    ),
    `${nombre}: ningun atributo on*`,
  );
  const tels = [...doc.querySelectorAll('a[href^="tel:"]')];
  ok(
    tels.length > 0 && tels.every((a) => /^tel:\+?[0-9]+$/.test(a.getAttribute("href"))),
    `${nombre}: todos los href tel: son solo digitos`,
  );
  // Se mira el href YA DECODIFICADO por el parser: si ahi queda un ? o un &,
  // el mailto puede inventarse cabeceras (?subject=..&body=..) aunque el
  // atributo este perfectamente escapado. Y si queda una comilla, es que solo
  // se escapo y no se codifico.
  const mails = [...doc.querySelectorAll('a[href^="mailto:"]')];
  ok(mails.length > 0, `${nombre}: hay al menos un mailto que comprobar`);
  ok(
    mails.every((a) => !/["'<>?&#\s]/.test(a.getAttribute("href"))),
    `${nombre}: ningun mailto puede inyectar cabeceras ni salirse del atributo`,
  );
  ok(c.html.includes("&lt;script&gt;"), `${nombre}: el texto hostil se ve escapado, no se pierde`);
  const t = doc.body.textContent;
  ok(t.includes("linea 1") && t.includes("linea 3"), `${nombre}: las 3 lineas del mensaje sobreviven`);
  ok(doc.querySelectorAll("br").length >= 2, `${nombre}: los saltos de linea son <br>`);
}
ok(esc(`<a href="x">&'`) === "&lt;a href=&quot;x&quot;&gt;&amp;&#39;", `esc() cubre & < > " '`);

// Caso concreto de inyeccion de cabeceras en mailto. Esta direccion PASA hoy
// RE_EMAIL en lead.ts, que no excluye ni ? ni &.
const CABECERAS = { ...BENIGNO, email: `a?subject=Pago%20urgente&body=Transfiera@ejemplo.com` };
for (const [nombre, c] of [
  ["acuse", construirAcuse(CABECERAS, NEGOCIO)],
  ["aviso", construirAvisoLead({ ...CABECERAS, ...EXTRAS }, NEGOCIO)],
]) {
  const doc = new JSDOM(c.html).window.document;
  ok(
    [...doc.querySelectorAll('a[href^="mailto:"]')].every(
      (a) => !/[?&]/.test(a.getAttribute("href")),
    ),
    `${nombre}: un correo con ?subject=&body= no consigue prellenar nada`,
  );
}

// --- 2. Las dos lenguas ----------------------------------------------------
console.log("\nlas dos lenguas");
ok(acuseEn.asunto !== acuseEs.asunto, "el asunto cambia con el idioma");
ok(acuseEs.html.includes("Hemos recibido su solicitud"), "ES pinta el H1 en espanol");
ok(!acuseEs.html.includes("We received your request"), "ES no filtra ni una frase en ingles");
ok(!acuseEn.html.includes("Hemos recibido"), "EN no filtra ni una frase en espanol");
ok(acuseEn.html.includes('<html lang="en"'), "lang del documento = en");
ok(acuseEs.html.includes('<html lang="es"'), "lang del documento = es");
ok(
  acuseEn.html.includes(NEGOCIO.horario) && acuseEs.html.includes(NEGOCIO.horario),
  "el horario va en ingles en las DOS lenguas (regla del NAP)",
);
ok(
  acuseEs.texto.includes(NEGOCIO.calle) && acuseEs.texto.includes(NEGOCIO.telefono),
  "el NAP completo va tambien en el texto plano",
);

// --- 3. El hueco del plazo -------------------------------------------------
console.log("\nplazo de respuesta");
ok(PLAZO !== null, "hay un plazo configurado (si no, el hueco sale en produccion)");
for (const [nombre, c] of [
  ["en", acuseEn],
  ["es", acuseEs],
]) {
  ok(
    !c.html.includes("{{PENDIENTE") && !c.texto.includes("{{PENDIENTE"),
    `${nombre}: con plazo configurado NO queda ningun hueco`,
  );
  ok(c.html.includes(PLAZO[nombre]), `${nombre}: el plazo configurado se pinta ("${PLAZO[nombre]}")`);
  const sinPlazo = construirAcuse({ ...BENIGNO, lang: nombre, plazo: null }, NEGOCIO);
  ok(
    sinPlazo.html.includes("{{PENDIENTE: plazo}}") && sinPlazo.texto.includes("{{PENDIENTE: plazo}}"),
    `${nombre}: sin plazo el hueco se VE, en html y en texto`,
  );
}

// --- 4. La alternativa de texto y las reglas del HTML de correo ------------
console.log("\ntexto plano y reglas de correo");
for (const [nombre, c] of [
  ["acuse-en", acuseEn],
  ["acuse-es", acuseEs],
  ["aviso", aviso],
]) {
  ok(c.texto.trim().length > 150, `${nombre}: texto no vacio`);
  ok(!/<[a-z/]/i.test(c.texto), `${nombre}: el texto no lleva HTML`);
  ok(c.asunto.trim().length > 0 && !/[\r\n]/.test(c.asunto), `${nombre}: asunto no vacio y sin CR/LF`);
  ok(c.html.length < 100 * 1024, `${nombre}: por debajo del recorte de Gmail (102 KB)`);
  ok(c.html.includes('name="color-scheme" content="light dark"'), `${nombre}: declara color-scheme`);
  ok(c.html.includes("prefers-color-scheme:dark"), `${nombre}: tiene bloque de modo oscuro`);
  ok(c.html.includes("max-width:600px") && c.html.includes('width="600"'), `${nombre}: 600 px, estilo Y atributo`);
  ok(!/var\(--/.test(c.html), `${nombre}: ni una custom property`);
  ok(!/display:\s*(flex|grid)|position:\s*(absolute|fixed)|float:/.test(c.html), `${nombre}: ni flex, ni grid, ni position, ni float`);
  ok(!/<script|<form|<video|@font-face|fonts\.googleapis|use\.typekit/i.test(c.html), `${nombre}: sin JS, sin formulario, sin video, sin webfonts`);
  // El nombre del despacho va como NODO DE TEXTO en los dos correos: es lo que
  // hace que se entiendan enteros con las imagenes bloqueadas, que es como los
  // ve mucha gente por defecto.
  ok(c.html.includes(">Accounting Max Services<"), `${nombre}: el nombre esta como TEXTO (se entiende sin imagenes)`);
}

// El logo solo lo lleva el acuse. El aviso interno va A PROPOSITO sin el: son
// ~118 px de primera pantalla, y ahi lo primero que hay que leer es el nombre y
// el telefono del lead, no la marca.
for (const [nombre, c] of [
  ["acuse-en", acuseEn],
  ["acuse-es", acuseEs],
]) {
  ok(c.html.includes("&amp;fm=png"), `${nombre}: el logo es PNG (el SVG no lo pinta ningun cliente) y su & va como entidad`);
  ok(/<img[^>]+alt="Accounting Max Services"/.test(c.html), `${nombre}: el logo lleva alt real`);
}
ok(!/<img/i.test(aviso.html), "aviso: sin ninguna imagen, a proposito");

// --- 5. Consentimientos (FTSA/TCPA) ---------------------------------------
console.log("\nconsentimiento (FTSA/TCPA)");
const sinNada = construirAvisoLead({ ...BENIGNO, ...EXTRAS, consentCall: false, consentSms: false }, NEGOCIO);
ok(sinNada.html.includes("#b3261e"), "sin consentimiento: barra roja");
ok(
  /DO NOT CALL \/ NO LLAMAR/.test(sinNada.html) && /DO NOT TEXT \/ NO ENVIAR SMS/.test(sinNada.html),
  "sin consentimiento: las dos etiquetas, no solo el color",
);
ok(
  sinNada.texto.includes("NO — DO NOT CALL / NO LLAMAR") &&
    sinNada.texto.includes("NO — DO NOT TEXT / NO ENVIAR SMS"),
  "el texto plano dice exactamente lo mismo",
);

const conTodo = construirAvisoLead({ ...BENIGNO, ...EXTRAS, consentCall: true, consentSms: true }, NEGOCIO);
ok(!conTodo.html.includes("#b3261e"), "con los dos consentimientos: sin rojo");
ok(!/DO NOT/.test(conTodo.html), "con consentimiento: sin prohibiciones");
ok(/Calls \/ Llamadas: +YES \/ SÍ/.test(conTodo.texto), "el texto plano lo refleja");

const mixto = construirAvisoLead({ ...BENIGNO, ...EXTRAS, consentCall: true, consentSms: false }, NEGOCIO);
ok(
  mixto.html.includes("#b3261e") &&
    mixto.html.includes("#4e751c") &&
    /DO NOT TEXT/.test(mixto.html) &&
    !/DO NOT CALL/.test(mixto.html),
  "mixto: llamada si, SMS no, y cada barra con su color",
);

// --- 6. El aviso no pierde nada del de hoy --------------------------------
console.log("\nel aviso interno conserva lo que ya funcionaba");
for (const campo of [
  "Name / Nombre:",
  "Email / Correo:",
  "Phone / Teléfono:",
  "Language / Idioma:",
  "Calls / Llamadas:",
  "SMS:",
  "Date / Fecha:",
  "IP:",
  "Sanity:",
])
  ok(aviso.texto.includes(campo), `texto plano conserva el campo ${campo}`);
ok(aviso.texto.includes(EXTRAS.id) && aviso.texto.includes(EXTRAS.dataset), "id y dataset en el texto");
ok(aviso.texto.includes(EXTRAS.consentAt), "la fecha ISO va tal cual: es la prueba");
ok(aviso.asunto === `Nuevo lead: ${BENIGNO.fullName}`, "asunto igual que hoy");
ok(aviso.texto.indexOf("Name / Nombre") < aviso.texto.indexOf("Date / Fecha"), "el orden de campos es el de hoy");

const vacio = construirAvisoLead({ ...BENIGNO, ...EXTRAS, message: "" }, NEGOCIO);
ok(vacio.texto.trim().endsWith("(no message / sin mensaje)"), "sin mensaje: el texto lo dice");
ok(vacio.html.includes("(no message / sin mensaje)"), "sin mensaje: el HTML tambien");
ok(
  !construirAcuse({ ...BENIGNO, message: "" }, NEGOCIO).html.includes(">Mensaje<"),
  "acuse sin mensaje: no pinta una fila vacia",
);
ok(!aviso.html.includes("sanity.studio"), "no se inventa un enlace al Studio (no hay ninguno desplegado)");

// --- 7. El acuse: transaccional y sin datos de mas ------------------------
console.log("\nel acuse: CAN-SPAM y limites");
const todoAcuse = acuseEn.html + acuseEn.texto + acuseEs.html + acuseEs.texto;
ok(
  !/unsubscribe|list-unsubscribe|darse de baja|cancelar la suscrip/i.test(todoAcuse),
  "el acuse NO lleva baja: es transaccional, no comercial",
);
ok(/not tax advice/.test(acuseEn.html) && /no es asesoría fiscal/.test(acuseEs.html), "dice que no es asesoria fiscal");
ok(!acuseEs.html.includes(EXTRAS.ip) && !acuseEs.html.includes(EXTRAS.id), "el acuse no devuelve IP ni id de Sanity");
const largo = construirAcuse({ ...BENIGNO, message: "x".repeat(5000) }, NEGOCIO);
ok(!largo.html.includes("x".repeat(700)), "el eco del mensaje se recorta a 600 caracteres");
ok(largo.html.includes("…"), "el recorte se marca con puntos suspensivos");

console.log(fallos ? `\n${fallos} comprobacion(es) FALLARON` : "\nOK: todo pasa");
if (fallos) process.exitCode = 1;
