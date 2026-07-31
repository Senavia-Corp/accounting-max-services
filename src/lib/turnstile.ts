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
