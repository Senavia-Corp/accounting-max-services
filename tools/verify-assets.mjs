// Comprueba que los assets del mapa existen de verdad en Sanity y no llegaron
// corruptos. Sanity re-lee las dimensiones del binario al subirlo: si falta
// `metadata.dimensions`, el fichero no era una imagen valida al llegar.
//
//   node tools/verify-assets.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

process.loadEnvFile(".env");
const client = createClient({
  projectId: "ep5i6co1", dataset: "production",
  token: process.env.SANITY_WRITE_TOKEN, apiVersion: "2021-06-07", useCdn: false,
});

const mapa = JSON.parse(readFileSync("baseline/import/assets-sanity.json", "utf8"));
const ids = Object.values(mapa);

const docs = await client.fetch(
  '*[_id in $ids]{_id, originalFilename, size, "w": metadata.dimensions.width, "h": metadata.dimensions.height}',
  { ids },
);

const faltan = ids.filter((i) => !docs.some((d) => d._id === i));
const sinDim = docs.filter((d) => !d.w);
const total = docs.reduce((s, d) => s + (d.size || 0), 0);

console.log(`en el mapa: ${ids.length}   encontrados en Sanity: ${docs.length}`);
console.log(`sin dimensiones (llegaron corruptos): ${sinDim.length}`);
console.log(`peso en Sanity: ${(total / 1024 / 1024).toFixed(2)} MB`);
for (const d of docs.slice(0, 4)) {
  console.log(`  ${d.w}x${d.h}  ${d.originalFilename}`);
}
if (faltan.length) {
  console.log("FALTAN:", faltan.slice(0, 5));
  throw new Error(`${faltan.length} assets del mapa no existen en Sanity`);
}
if (sinDim.length) throw new Error(`${sinDim.length} assets sin dimensiones`);
console.log("\nOK: los 63 assets existen y tienen dimensiones validas");
