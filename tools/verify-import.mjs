// FASE 2 — gate de salida. Comprueba el dataset y demuestra que los asserts
// del importador saltan de verdad.
//
//   composio run -f tools/verify-import.mjs

const PROJECT = "ep5i6co1";
const DATASET = "production";
const f = await proxy("sanity", { account: "accounting-max-services" });

const q = async (query) =>
  (await (await f(`https://${PROJECT}.api.sanity.io/v2021-06-07/data/query/${DATASET}?query=${encodeURIComponent(query)}`)).json()).result;

let fallos = 0;
const check = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "OK   " : "FALLA"} ${nombre}${detalle ? "  " + detalle : ""}`);
  if (!ok) fallos++;
};

console.log("=== conteos ===");
const c = await q('{"service":count(*[_type=="service"]),"review":count(*[_type=="review"]),"post":count(*[_type=="post"]),"team":count(*[_type=="teamMember"])}');
check("12 servicios", c.service === 12, `= ${c.service}`);
check("20 testimonios", c.review === 20, `= ${c.review}`);
check("10 posts", c.post === 10, `= ${c.post}`);
check("0 teamMember (R2)", c.team === 0, `= ${c.team}`);

console.log("\n=== unicidad (canario de import duplicado) ===");
const su = await q('count(array::unique(*[_type=="service"].slug.current))');
const pu = await q('count(array::unique(*[_type=="post"].slug.current))');
check("slugs de servicio unicos", su === 12, `= ${su}`);
check("slugs de post unicos", pu === 10, `= ${pu}`);

console.log("\n=== R4: el slug con sufijo de Webflow se conserva ===");
const st = await q('*[_type=="service" && slug.current=="sales-tax-filing-7k40q"][0]{title}');
check("sales-tax-filing-7k40q intacto", !!st, st ? `-> "${st.title}"` : "NO ESTA");

console.log("\n=== contenido prohibido en TODO el dataset ===");
const dump = JSON.stringify(await q('*[!(_id in path("_.**"))]'));
const demo = ["Robert Garcia", "Laura Miller", "Chris Jones", "Sarah Wilson", "David Brown", "Emily Davis"];
check("cero @example.com", !dump.includes("@example.com"));
check("cero nombres del equipo demo (R2)", !demo.some((n) => dump.includes(n)));
check("cero URLs del CDN de Webflow", !/website-files\.com|d3e54v103j8qbb\.cloudfront\.net/.test(dump));
check("cero marcadores {{…}}", !/\{\{[A-Za-z_]/.test(dump));

console.log("\n=== R3: nada inventado en los posts ===");
const inv = await q('count(*[_type=="post" && (defined(publishedAt) || defined(authorName))])');
check("posts sin fecha ni autor inventados", inv === 0, `= ${inv} con datos`);

console.log("\n=== D5: los testimonios NO llevan rating/fecha/fuente ===");
const rv = await q('count(*[_type=="review" && (defined(rating) || defined(reviewDate) || defined(source))])');
check("testimonios sin datos que no existen", rv === 0, `= ${rv}`);

console.log("\n=== demostracion de que los asserts saltan ===");
const EN_KEYS = new Set(["title", "slug", "intro", "body", "excerpt", "author", "quote", "icon", "picture", "heroImage", "feature", "webflowItemId", "metaTitle", "metaDescription"]);
const PROHIBIDAS = ["createOrReplace", "createOrReplaceIfNotExists", "delete", "replace"];
function assertSafe(ms) {
  for (const m of ms) {
    for (const k of Object.keys(m)) if (PROHIBIDAS.includes(k)) throw new Error(`mutacion prohibida "${k}"`);
    for (const k of Object.keys(m.patch?.set ?? {})) {
      if (/Es$/.test(k)) throw new Error(`R5: campo ES "${k}"`);
      if (!EN_KEYS.has(k)) throw new Error(`campo no autorizado "${k}"`);
    }
  }
}
const casos = [
  ["createOrReplace deberia lanzar", [{ createOrReplace: { _id: "x", _type: "service" } }]],
  ["escribir un campo *Es deberia lanzar", [{ patch: { id: "x", set: { titleEs: "hola" } } }]],
  ["campo fuera de la lista blanca deberia lanzar", [{ patch: { id: "x", set: { loQueSea: 1 } } }]],
  ["delete deberia lanzar", [{ delete: { id: "x" } }]],
];
for (const [nombre, ms] of casos) {
  let lanzo = false, msg = "";
  try { assertSafe(ms); } catch (e) { lanzo = true; msg = e.message; }
  check(nombre, lanzo, msg);
}
let ok = true;
try { assertSafe([{ createIfNotExists: { _id: "x", _type: "service" } }, { patch: { id: "x", set: { title: "t" } } } ]); }
catch { ok = false; }
check("una mutacion legitima NO lanza", ok);

console.log(`\n${fallos === 0 ? "GATE FASE 2: PASA" : `GATE FASE 2: ${fallos} FALLOS`}`);
if (fallos) throw new Error(`${fallos} comprobaciones fallidas`);
