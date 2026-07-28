// Punto único de escritura remota para Accounting Max Services (regla R1).
//
// Contexto: hay 3 conexiones sanity y 4 vercel activas, y tres superficies
// (MCP Sanity, MCP Vercel, CLI local) resuelven a OTROS clientes. Solo
// `composio run` acepta fijar la cuenta, así que todo pasa por aquí.
//
// Se ejecuta siempre con:  composio run -f tools/<script>.ts
// donde execute() viene inyectado por el runtime de Composio.

export const ACCOUNT = "accounting-max-services";
export const SANITY_PROJECT = "ep5i6co1";
export const SANITY_ORG = "oNjtMB9UJ";
export const VERCEL_USER_ID = "38vIWRaJFIpicVCxmY5UXZna";

// Toolkits cuya conexión sabemos fijar. Cualquier otro se rechaza en vez de
// caer a la conexión por defecto, que es la de otro cliente.
const PINNABLE = ["SANITY_", "VERCEL_"];

export async function ams(execute, slug, data = {}) {
  if (!PINNABLE.some((p) => slug.startsWith(p))) {
    throw new Error(
      `RECHAZADO: ${slug} no pertenece a un toolkit fijable. ` +
        `Usarlo caeria en la conexion por defecto (otro cliente).`,
    );
  }
  return execute(slug, data, { account: ACCOUNT });
}

// Huella de identidad. Se llama ANTES de cualquier escritura.
// No confia en el alias: comprueba que los IDs devueltos son los esperados.
export async function assertIdentity(execute) {
  const s = await ams(execute, "SANITY_VALIDATE_CREDENTIAL");
  const projects = s?.data?.projects ?? [];
  const ids = projects.map((p) => p.id);
  if (!ids.includes(SANITY_PROJECT)) {
    throw new Error(
      `ABORTA: Sanity resolvio a [${ids}], se esperaba ${SANITY_PROJECT}`,
    );
  }
  const orgs = projects.map((p) => p.organizationId);
  if (!orgs.includes(SANITY_ORG)) {
    throw new Error(`ABORTA: Sanity org [${orgs}], se esperaba ${SANITY_ORG}`);
  }

  const v = await ams(execute, "VERCEL_GET_AUTH_USER");
  const user = v?.data?.user ?? v?.data ?? {};
  if (user.id !== VERCEL_USER_ID) {
    throw new Error(
      `ABORTA: Vercel resolvio a ${user.id} (${user.email}), se esperaba ${VERCEL_USER_ID}`,
    );
  }

  return {
    sanity: { project: SANITY_PROJECT, org: SANITY_ORG, token: s?.data?.user },
    vercel: { id: user.id, username: user.username, email: user.email },
  };
}
