// Anti-bot para /api/lead y /api/newsletter.
//
// Version CORREGIDA: cuatro capas baratas, ninguna de las cuales puede tirar un
// lead real. El criterio de todo el fichero es el mismo que el del filtro de
// PII: un bot que cuela cuesta un correo de spam; un cliente rechazado cuesta
// un cliente.
//
// 1. honeypot   -> campo 'ref_id'
// 2. time-trap  -> envio inhumanamente rapido
// 3. rate limit -> por IP, en memoria de la funcion (ver D6)
// 4. captcha    -> si algun dia se conecta: FAIL-OPEN, y avisa al arrancar
//
// Sin imports: solo Web APIs (Request, fetch) y process.env.

// OJO con las variables de entorno: `import.meta.env[k]` con clave DINAMICA
// revienta en `astro dev` ("Dynamic access of import.meta.env is not
// supported", module runner de Vite) y la ruta devuelve 500. Detectado con una
// peticion real contra el servidor, no supuesto. Por eso cada clave se lee una
// a una y literal.
//
// process.env va PRIMERO a proposito: es el valor de runtime en Vercel, y evita
// que Vite hornee el secreto en el bundle del servidor en build.
// Y `import.meta.env.CLAVE` con clave literal se sustituye EN BUILD por el
// valor de la maquina que construye, o sea que hornea el secreto en el
// artefacto. Por eso el acceso vive dentro de un `if (import.meta.env.DEV)`,
// que Rollup borra del bundle de produccion. Ver la nota larga en
// src/pages/api/lead.ts.
const PROC: Record<string, string | undefined> = (globalThis as any).process?.env ?? {};

let DEV_ENV: Record<string, string | undefined> = {};
if (import.meta.env.DEV) {
  DEV_ENV = { TURNSTILE_SECRET_KEY: import.meta.env.TURNSTILE_SECRET_KEY };
}

// --- 1. Honeypot -----------------------------------------------------------

/**
 * Se llama 'ref_id' y NO 'company_url'.
 *
 * El nombre no es cosmetico: los gestores de contrasenas (1Password, iCloud
 * Keychain, Chrome) autocompletan cualquier campo cuyo name huela a empresa,
 * web o URL, aunque este oculto. Con 'company_url' el honeypot venia relleno
 * por PERSONAS REALES y sus leads se descartaban en silencio, que es el peor
 * modo de fallo posible: nadie se entera nunca.
 */
export const CAMPO_HONEYPOT = "ref_id";

export const honeypotLleno = (datos: FormData): boolean =>
  String(datos.get(CAMPO_HONEYPOT) ?? "").trim() !== "";

// --- 2. Time-trap ----------------------------------------------------------

export const CAMPO_TS = "ts";

/** Un humano no rellena tres campos en un segundo. */
export const MS_MINIMO = 1000;

export type Veredicto = { ok: boolean; motivo: string };

/**
 * Rechaza si el envio llega a <= MS_MINIMO ms del render.
 *
 * Tres casos que NO se rechazan, cada uno por una razon:
 *
 *  - `ts` ausente o no numerico -> el formulario del pie no lleva marca de
 *    tiempo, y sin JS el campo puede no actualizarse. Fail-open.
 *  - `ts` muy antiguo -> /contact-us es estatico: el value que viaja en el HTML
 *    es la hora del BUILD. Con la pagina cacheada, un valor de hace dias es
 *    legitimo. NUNCA se rechaza por antiguo.
 *  - `ts` en el futuro -> reloj del cliente adelantado. Pasa de verdad (minutos
 *    u horas). Se deja pasar y se anota; rechazarlo tira personas reales.
 *
 * NOTA: el comentario de src/pages/contact-us.astro habla de 3000 ms. Manda el
 * contrato de FASE 4a, que fija 1000 ms — mas permisivo, asi que ningun envio
 * que aquel daba por bueno se rechaza aqui.
 */
export function demasiadoRapido(datos: FormData, minMs: number = MS_MINIMO): Veredicto {
  const bruto = datos.get(CAMPO_TS);
  if (typeof bruto !== "string" || bruto.trim() === "") return { ok: true, motivo: "sin-ts" };
  const ts = Number(bruto);
  if (!Number.isFinite(ts) || ts <= 0) return { ok: true, motivo: "ts-invalido" };
  const delta = Date.now() - ts;
  if (delta < 0) return { ok: true, motivo: "reloj-adelantado" };
  if (delta <= minMs) return { ok: false, motivo: `enviado en ${delta} ms` };
  return { ok: true, motivo: `${delta} ms` };
}

// --- 3. Rate limit por IP --------------------------------------------------

/**
 * D6: el rate limiting de verdad (Vercel Firewall / Attack Challenge Mode) es
 * de tier PRO y el proyecto esta hoy en Hobby. Esto es la version EN FUNCION y
 * es mas debil, con dos limitaciones que hay que tener presentes:
 *
 *  - la memoria vive en la instancia: cada arranque en frio la vacia, y varias
 *    instancias en paralelo NO comparten contador;
 *  - un atacante con IPs rotatorias lo esquiva entero.
 *
 * Sirve para lo que sirve: cortar el bucle de un script que dispara 500 envios
 * desde una IP. Cuando D6 se resuelva y haya Pro, la regla se sube al firewall
 * y esto se queda como red de seguridad, no como unica defensa.
 */
const memoria = new Map<string, number[]>();

export function limitePorIp(
  clave: string,
  ip: string,
  max: number,
  ventanaMs: number,
): { ok: boolean; esperaMs: number } {
  const ahora = Date.now();
  const k = `${clave}:${ip}`;

  // Barrido perezoso: sin esto el Map crece sin techo mientras viva la instancia.
  if (memoria.size > 5000) {
    for (const [otra, sellos] of memoria) {
      if (sellos.every((t) => ahora - t > ventanaMs)) memoria.delete(otra);
    }
  }

  const sellos = (memoria.get(k) ?? []).filter((t) => ahora - t < ventanaMs);
  if (sellos.length >= max) {
    const esperaMs = ventanaMs - (ahora - sellos[0]);
    memoria.set(k, sellos);
    return { ok: false, esperaMs: Math.max(esperaMs, 0) };
  }
  sellos.push(ahora);
  memoria.set(k, sellos);
  return { ok: true, esperaMs: 0 };
}

/**
 * IP del cliente. En Vercel la real es el PRIMER salto de x-forwarded-for; los
 * siguientes son proxies. `clientAddress` de Astro ya la resuelve con el
 * adapter, y se usa como primera opcion.
 */
export function ipCliente(request: Request, direccionCliente?: string): string {
  const xff = request.headers.get("x-forwarded-for");
  const primera = xff?.split(",")[0]?.trim();
  return (
    direccionCliente ||
    primera ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "desconocida"
  );
}

// --- 4. Captcha (opcional, FAIL-OPEN) --------------------------------------

const CLAVE_CAPTCHA = PROC.TURNSTILE_SECRET_KEY ?? DEV_ENV.TURNSTILE_SECRET_KEY;
const URL_CAPTCHA = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * AVISO DE ARRANQUE. Si manana alguien anade el widget al formulario y olvida
 * la variable en Vercel, la verificacion queda desactivada. Que quede
 * desactivada esta bien (fail-open); que quede desactivada EN SILENCIO no.
 * Este console.warn sale en los logs de la funcion en cada arranque en frio.
 */
if (!CLAVE_CAPTCHA) {
  console.warn(
    "[antibot] TURNSTILE_SECRET_KEY no esta definida: la verificacion externa " +
      "queda DESACTIVADA (fail-open). Es un estado valido y esperado mientras el " +
      "formulario no lleve widget; deja de serlo en cuanto lo lleve.",
  );
}

/**
 * FAIL-OPEN a proposito: solo rechaza si el proveedor dice explicitamente que
 * el token es invalido. Sin clave, sin token, con la red caida o con un 500 de
 * Cloudflare -> pasa. Un captcha caido no puede dejar al despacho sin leads.
 */
export async function verificarCaptcha(
  token: string | null,
  ip: string,
): Promise<{ ok: boolean; verificado: boolean; motivo: string }> {
  if (!CLAVE_CAPTCHA) return { ok: true, verificado: false, motivo: "sin-clave" };
  if (!token) return { ok: true, verificado: false, motivo: "sin-token" };
  try {
    const cuerpo = new URLSearchParams({ secret: CLAVE_CAPTCHA, response: token, remoteip: ip });
    const res = await fetch(URL_CAPTCHA, {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn(`[antibot] captcha HTTP ${res.status}: se deja pasar (fail-open)`);
      return { ok: true, verificado: false, motivo: `http-${res.status}` };
    }
    const datos = (await res.json()) as { success?: boolean };
    if (datos.success === false) return { ok: false, verificado: true, motivo: "token-invalido" };
    return { ok: true, verificado: true, motivo: "ok" };
  } catch (e) {
    console.warn(`[antibot] captcha inalcanzable, se deja pasar (fail-open): ${(e as Error).message}`);
    return { ok: true, verificado: false, motivo: "error-red" };
  }
}
