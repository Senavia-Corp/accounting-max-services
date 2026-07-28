// FASE 0.1 — Huella de identidad. Salida literal va a ACCOUNTS.md.
import { assertIdentity, ams } from "./ams.ts";

const id = await assertIdentity(execute);
console.log("IDENTITY_OK " + JSON.stringify(id, null, 2));

// Detalle del proyecto Sanity: miembros y roles (el gate B2).
const proj = await ams(execute, "SANITY_GET_PROJECT", { project_id: id.sanity.project });
const d = proj?.data ?? {};
console.log(
  "SANITY_PROJECT " +
    JSON.stringify(
      {
        id: d.id,
        displayName: d.displayName,
        organizationId: d.organizationId,
        studioHost: d.studioHost,
        createdAt: d.createdAt,
        members: d.members,
        privateDataset: (d.features ?? []).includes("privateDataset"),
      },
      null,
      2,
    ),
);

// Vercel: equipos y proyectos existentes bajo la cuenta del cliente.
const teams = await ams(execute, "VERCEL_GET_TEAMS");
console.log(
  "VERCEL_TEAMS " +
    JSON.stringify(
      (teams?.data?.teams ?? []).map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        plan: t.billing?.plan,
        billingEmail: t.billing?.email,
      })),
      null,
      2,
    ),
);

const projs = await ams(execute, "VERCEL_GET_PROJECTS");
console.log(
  "VERCEL_PROJECTS " +
    JSON.stringify((projs?.data?.projects ?? []).map((p) => ({ id: p.id, name: p.name })), null, 2),
);
