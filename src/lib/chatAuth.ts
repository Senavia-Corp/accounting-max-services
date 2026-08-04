// Comparacion en tiempo constante para la cabecera compartida de
// /api/chat-lead (X-Chat-Lead-Secret).
//
// A diferencia del resto de puertas del sitio —el captcha de antibot.ts falla
// ABIERTO, porque un captcha caido no puede dejar al despacho sin leads—, esta
// falla CERRADA: /api/chat-lead escribe directo en Sanity y manda dos correos,
// y no tiene detras ni honeypot, ni time-trap, ni origen de navegador que la
// respalde. Sin secreto, o con uno que no coincide, 401 siempre.
//
// Este fichero tenia ademas signToken/verifyToken, que firmaban la cookie
// "humano verificado" de 30 min del chat de IA. Se fueron con el: al cambiar
// el widget por el acceso a WhatsApp (WhatsAppWidget.astro) desaparecieron
// /api/chat y /api/chat-verify, que eran sus dos unicos llamantes. Siguen en
// el historial de git si algun dia vuelve un chat de verdad.
import { timingSafeEqual } from "node:crypto";

export function secretoValido(candidato: string | null, real: string | undefined): boolean {
  if (!candidato || !real) return false;
  const a = Buffer.from(candidato);
  const b = Buffer.from(real);
  // timingSafeEqual lanza si las longitudes no coinciden, asi que se comparan
  // antes. La longitud no es el secreto.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
