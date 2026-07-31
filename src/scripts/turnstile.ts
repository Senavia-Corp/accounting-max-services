// Turnstile en FACHADA, para los tres formularios del sitio.
//
// POR QUE FACHADA. El formulario del boletin vive en el pie de las 54 rutas.
// Cargar api.js al pintar meteria un tercero en TODO el sitio para proteger un
// campo que casi nadie toca. Aqui no se habla con challenges.cloudflare.com
// hasta que alguien pone el foco en un formulario. Es el mismo criterio que la
// fachada de video de src/pages/index.astro: el tercero llega cuando la persona
// demuestra que lo va a usar, no antes.
//
// POR QUE render=explicit. Sin ese parametro api.js busca los `.cf-turnstile`
// de la pagina y pinta al cargar. Con la fachada el guion llega DESPUES del
// primer foco, asi que hay que decir a mano en que caja, con que clave y en que
// idioma se pinta. Efecto lateral util: ninguna caja lleva la clase
// .cf-turnstile, asi que si algun dia se cae el parametro no se pinta nada —
// falla en apagado, no en teatro.

// api.js busca este nombre en `window` por el ?onload=. Tiene que ser global.
const LISTO = "__amsTurnstileListo";
const URL_API = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${LISTO}`;

// Espera maxima para un reto que NO pide interaccion humana.
//
// Diez segundos no son "la persona es lenta": son api.js bloqueado por una
// extension, la clave publica equivocada o el dominio sin dar de alta en el
// panel. En cuanto Cloudflare avisa de que va a pedir un clic este reloj DEJA
// DE CONTAR: a una persona no se le pone cuenta atras. A partir de ahi corta el
// timeout-callback del propio widget, que es el unico que sabe cuando el reto
// ha caducado.
const ESPERA_MS = 10_000;

type Api = {
  render(caja: HTMLElement, opciones: Record<string, unknown>): string | undefined;
  reset(id: string): void;
};

type Espera = { ok: (t: string) => void; mal: (e: Error) => void };
type Estado = { id?: string; token: string | null; interactivo: boolean; espera: Espera | null };

const estados = new Map<HTMLElement, Estado>();
let api: Promise<Api> | null = null;

// Una sola carga de api.js por pagina aunque haya dos formularios: en
// /contact-us conviven el de contacto y el del pie. La promesa cacheada ES el
// candado; `??=` la crea la primera vez y la reutiliza siempre.
function cargar(): Promise<Api> {
  return (api ??= new Promise<Api>((ok, mal) => {
    (window as any)[LISTO] = () => ok((window as any).turnstile as Api);
    const s = document.createElement("script");
    s.src = URL_API;
    s.async = true;
    // Sin esto, un bloqueador de rastreadores deja la promesa colgada para
    // siempre: el envio no llegaria ni a fallar, se quedaria pensando con el
    // boton deshabilitado. Es el peor modo de fallo posible.
    s.onerror = () => mal(new Error("api.js bloqueado o inalcanzable"));
    document.head.appendChild(s);
  }));
}

// Lleva el reto a la vista y le da el foco. Hace falta cuando Cloudflare pide un
// clic con el envio YA en marcha: el boton acaba de quedar deshabilitado y el
// foco se ha ido al <body>, asi que si nadie lo mueve la persona se queda
// mirando un boton muerto sin saber que le toca a ella. Importa sobre todo en
// el pie, donde la caja va DESPUES del boton (ver FooterSubscribe.astro).
//
// Scroll seco, sin behavior:"smooth", por lo mismo que el carrusel: con
// movimiento reducido el scroll suave es un no-op silencioso.
function alFrente(caja: HTMLElement): void {
  caja.scrollIntoView({ block: "center" });
  caja.querySelector("iframe")?.focus();
}

// La caja del widget. No existe si el build salio sin PUBLIC_TURNSTILE_SITE_KEY.
const cajaDe = (form: HTMLFormElement) =>
  form.querySelector<HTMLElement>("[data-turnstile][data-sitekey]");

async function pintar(caja: HTMLElement): Promise<Estado> {
  const previo = estados.get(caja);
  if (previo) return previo;

  const t = await cargar();
  // Otra llamada pudo pintar mientras se cargaba api.js: en el mismo formulario
  // el focusin y el submit pueden solaparse. Sin esta segunda comprobacion
  // saldrian dos widgets en la misma caja.
  const entre = estados.get(caja);
  if (entre) return entre;

  const e: Estado = { token: null, interactivo: false, espera: null };
  estados.set(caja, e); // se registra ANTES de render(), por lo mismo de arriba

  e.id = t.render(caja, {
    sitekey: caja.dataset.sitekey,
    // El idioma lo manda la PAGINA, no el navegador: en /es/... el reto sale en
    // espanol aunque el navegador este en ingles. Mismo motivo que data-wait.
    language: caja.dataset.lang || "auto",
    // "auto" sigue a prefers-color-scheme y pintaria un widget oscuro sobre la
    // tarjeta blanca de /contact-us, o uno claro sobre el navy del pie. El tema
    // lo sabe la pagina, que es quien conoce el fondo.
    theme: caja.dataset.theme || "auto",
    callback: (tok: string) => {
      e.token = tok;
      e.espera?.ok(tok);
      e.espera = null;
    },
    // El token caduca a los 300 s. Turnstile lo renueva solo; aqui solo se
    // olvida el viejo para no mandar uno muerto y comerse un 403 que no explica
    // nada.
    "expired-callback": () => {
      e.token = null;
    },
    // Cloudflare avisa ANTES de pedir un clic. A partir de aqui manda la
    // persona: se para el reloj de ESPERA_MS y, si el envio ya esta en marcha,
    // se le ensena el reto en vez de dejarla esperando.
    "before-interactive-callback": () => {
      e.interactivo = true;
      if (e.espera) alFrente(caja);
    },
    "error-callback": () => {
      e.token = null;
      e.espera?.mal(new Error("captcha-error"));
      e.espera = null;
      // false = que Turnstile pinte su propio aviso y reintente por su cuenta
      // (cada 8 s por defecto). El siguiente intento se encuentra el token ya
      // hecho, asi que "vuelva a intentarlo" es verdad y no un adorno.
      return false;
    },
    // El reto interactivo caduco sin que nadie lo resolviera.
    "timeout-callback": () => {
      e.espera?.mal(new Error("captcha-timeout"));
      e.espera = null;
    },
  });

  return e;
}

// Precarga. En el PRIMER foco del formulario se carga api.js y se pinta el
// reto, para que el token este listo cuando la persona termine de escribir. Si
// falla aqui no se dice nada: quien avisa es tokenCaptcha, en el envio, que es
// cuando importa.
export function armarCaptcha(form: HTMLFormElement): void {
  const caja = cajaDe(form);
  if (!caja) return;
  form.addEventListener("focusin", () => void pintar(caja).catch(() => {}), { once: true });
}

/**
 * Token con el que enviar.
 *
 *   null  -> esta pagina no lleva widget (build sin PUBLIC_TURNSTILE_SITE_KEY).
 *            Se envia sin token y decide el servidor.
 *   LANZA -> no hay verificacion posible. NO se envia: el servidor responde 403
 *            a un envio sin token y se habria gastado uno de los intentos del
 *            limite por IP para acabar en el mismo error.
 *
 * Pinta el widget si el focusin no llego a dispararse: Safari no da foco a un
 * boton al pulsarlo, y hay autorrellenos que no tocan el campo. El focusin es
 * una OPTIMIZACION; la garantia esta aqui.
 */
export async function tokenCaptcha(form: HTMLFormElement): Promise<string | null> {
  const caja = cajaDe(form);
  if (!caja) return null;

  const e = await pintar(caja);
  if (e.token) return e.token;

  return new Promise<string>((ok, mal) => {
    const mio: Espera = { ok, mal };
    e.espera = mio;
    if (e.interactivo) alFrente(caja);
    setTimeout(() => {
      // Ya resuelto, sustituido por un envio posterior, o la persona esta
      // resolviendo el reto a mano: en los tres casos aqui no se corta nada.
      if (e.espera !== mio || e.interactivo) return;
      e.espera = null;
      mal(new Error("captcha-espera"));
    }, ESPERA_MS);
  });
}

/**
 * Pide un token nuevo. Se llama tras CADA envio fallido.
 *
 * Un token de Turnstile es de UN SOLO USO: en cuanto el endpoint lo verifica
 * contra siteverify, Cloudflare lo marca gastado. Y aqui el captcha es el paso
 * 8 mientras que guardar en Sanity es el 9, asi que un fallo POSTERIOR a la
 * verificacion es el caso normal, no un borde. Sin esto, reintentar da
 * "timeout-or-duplicate" -> 403 perpetuo: un fallo recuperable convertido en
 * callejon sin salida.
 */
export function reiniciarCaptcha(form: HTMLFormElement): void {
  const caja = cajaDe(form);
  const e = caja && estados.get(caja);
  if (!e?.id) return;
  e.token = null;
  void cargar().then((t) => t.reset(e.id!));
}
