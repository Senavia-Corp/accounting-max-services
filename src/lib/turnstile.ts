// Clave PUBLICA del widget, leida en BUILD desde el frontmatter de las tres
// paginas con formulario.
//
// Aqui se hace lo CONTRARIO que en src/lib/antibot.ts, y a proposito. Alli el
// acceso literal a import.meta.env vive dentro de un `if (import.meta.env.DEV)`
// porque Vite sustituye la clave en build y hornearia el SECRETO en el
// artefacto. Esta clave es publica: viaja en el HTML de todas formas, asi que
// que Rollup la sustituya en build es exactamente lo que se busca.
export const SITE_KEY: string = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "";

// EL ESTADO PELIGROSO: las dos claves tienen que ir juntas.
//
//   secreto SI + publica NO -> ningun formulario emite token y el servidor
//     responde 403 a TODOS los envios. Apagon total y silencioso: el unico
//     sintoma seria que dejan de llegar leads, semanas despues.
//   secreto NO + publica SI -> se pinta un widget que no verifica nada. Teatro.
//
// Se comprueba en build porque en Vercel las dos salen del mismo juego de
// variables por entorno. No se imprime ningun valor, solo si esta o no.
let secretoEnDev = false;
if (import.meta.env.DEV) secretoEnDev = Boolean(import.meta.env.TURNSTILE_SECRET_KEY);
const HAY_SECRETO =
  Boolean((globalThis as any).process?.env?.TURNSTILE_SECRET_KEY) || secretoEnDev;

if (Boolean(SITE_KEY) !== HAY_SECRETO) {
  console.warn(
    `[turnstile] CLAVES DESPAREJADAS: PUBLIC_TURNSTILE_SITE_KEY ${SITE_KEY ? "si" : "NO"}, ` +
      `TURNSTILE_SECRET_KEY ${HAY_SECRETO ? "si" : "NO"}. Con secreto y sin clave ` +
      "publica el servidor rechaza TODOS los envios con 403.",
  );
}

// EL ESTADO QUE NADIE VIGILABA: las dos claves puestas, emparejadas... y las dos
// DE PRUEBA. El aviso de arriba solo mira si una falta, asi que este caso pasaba
// entero por debajo del radar. Y paso: el 2026-08-01 produccion servia
// `1x00000000000000000000AA` en las 54 rutas, que es la clave publica de prueba
// de Cloudflare cuyo comportamiento documentado es «siempre pasa». El widget se
// pintaba, el token se emitia, el servidor lo aceptaba, y el antibot no
// protegia de nada. Ni el build ni la consola dijeron una palabra.
//
// Las claves de prueba de Cloudflare son publicas y tienen forma reconocible:
// empiezan por 1x, 2x o 3x seguidas de ceros. La publica termina en AA/AB/FF y
// la secreta es mas larga. No hay riesgo en reconocerlas por patron — son parte
// de la documentacion, no un secreto.
const ES_DE_PRUEBA = (clave: string): boolean => /^[123]x0{20,}[A-F]{2}$/.test(clave.trim());

// `VERCEL_ENV` vale "production" SOLO en el despliegue de produccion; en las
// previsualizaciones vale "preview" y en local no existe. Por eso el aviso no
// salta en dev ni en preview: alli una clave de prueba es lo correcto y util.
const EN_PRODUCCION = (globalThis as any).process?.env?.VERCEL_ENV === "production";

if (EN_PRODUCCION && SITE_KEY && ES_DE_PRUEBA(SITE_KEY)) {
  // Banner y no una linea suelta: en un log de build de Vercel con cientos de
  // lineas, un console.warn de una linea es invisible. Este no lo es.
  console.warn(
    "\n" +
      "!".repeat(78) + "\n" +
      "!!  TURNSTILE: PRODUCCION ESTA USANDO UNA CLAVE DE PRUEBA DE CLOUDFLARE\n" +
      "!!\n" +
      `!!  PUBLIC_TURNSTILE_SITE_KEY = ${SITE_KEY}\n` +
      "!!\n" +
      "!!  Esa clave es publica, esta en la documentacion de Cloudflare y su\n" +
      "!!  comportamiento es SIEMPRE PASA. El widget se pinta y el reto se\n" +
      "!!  supera solo: los formularios del sitio NO tienen proteccion antibot.\n" +
      "!!\n" +
      "!!  COMO SE ARREGLA (no es un cambio de codigo):\n" +
      "!!   1. dash.cloudflare.com -> Turnstile -> Add widget\n" +
      "!!      dominio accountingmaxservices.com, modo Managed\n" +
      "!!   2. Copiar Site Key y Secret Key\n" +
      "!!   3. En Vercel, proyecto accounting-max-services -> Settings ->\n" +
      "!!      Environment Variables, sustituir PUBLIC_TURNSTILE_SITE_KEY y\n" +
      "!!      TURNSTILE_SECRET_KEY en el target Production\n" +
      "!!   4. Redesplegar\n" +
      "!!\n" +
      "!!  Las dos claves van JUNTAS. Cambiar solo una deja el sitio peor:\n" +
      "!!  secreto real + publica de prueba = 403 en TODOS los envios.\n" +
      "!".repeat(78) + "\n",
  );
}
