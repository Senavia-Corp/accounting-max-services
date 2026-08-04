// Ayudantes de firma HMAC para el chat de IA.
//
//   signToken/verifyToken -> la cookie "humano verificado" que exige
//     /api/chat, emitida por /api/chat-verify tras pasar Turnstile. Puerto
//     casi literal de src/lib/chatAuth.ts en senavia-corp: no tiene ningun
//     acoplo a este sitio, es seguro copiarlo tal cual.
//
//   secretoValido -> comparacion en tiempo constante para la cabecera
//     compartida de /api/chat-lead. A diferencia de la cookie de arriba (que
//     falla abierto cuando no esta configurada, igual que el resto del sitio),
//     este gate falla CERRADO: es una via de escritura directa a Sanity y
//     correo, sin honeypot ni time-trap detras que la proteja.
import { createHmac, timingSafeEqual } from "node:crypto";

export function signToken(expiryMs: number, secret: string): string {
  const payload = String(expiryMs);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = parseInt(payload, 10);
  return Number.isFinite(exp) && Date.now() < exp;
}

export function secretoValido(candidato: string | null, real: string | undefined): boolean {
  if (!candidato || !real) return false;
  const a = Buffer.from(candidato);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
