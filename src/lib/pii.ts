// Filtro de PII fiscal para el texto libre de los formularios.
//
// Por que existe: el textarea de /contact-us admite 5000 caracteres y esta en
// el sitio de un despacho de Enrolled Agents. La gente PEGA ahi su SSN, su
// ITIN, el EIN de la LLC y el numero de cuenta. Ese dato no puede llegar ni a
// Sanity ni a un buzon de correo: se rechaza el envio y se indica el canal
// seguro (el telefono real del despacho, que llega por parametro — este modulo
// no importa nada, ver abajo).
//
// CERO DEPENDENCIAS Y CERO IMPORTS a proposito. Este fichero se ejecuta tal
// cual, sin compilar y sin instalar nada:
//
//   node --experimental-strip-types src/lib/pii.ts
//
// (Node 22.12+; aqui v24.14.0). Por eso no hay `enum`, ni `namespace`, ni
// propiedades de constructor: type-stripping BORRA los tipos, no los compila.
//
// ---------------------------------------------------------------------------
// EL METODO: primero lo SEGURO, luego lo peligroso.
//
// La tentacion es escribir regex de SSN y ya. El problema real es el reves: un
// telefono son 10 digitos, un ZIP+4 son 9 con guion, una cantidad lleva comas.
// Si el filtro bloquea un telefono el formulario es inutil, y un lead perdido
// cuesta mas que un SSN filtrado que nadie iba a pegar.
//
// Asi que se calculan primero los TRAMOS SEGUROS del texto (telefonos, ZIP,
// cantidades en dolares, anos, fechas) y despues se descarta cualquier
// coincidencia de PII que SOLAPE uno de ellos. No se enmascara el texto antes
// de buscar: enmascarar parte de "12-3456789" romperia el EIN y el filtro
// dejaria pasar justo lo que busca.
//
// Consecuencia asumida y documentada: un numero de cuenta de EXACTAMENTE 10
// digitos seguidos es indistinguible de un telefono de EE.UU., y gana el
// telefono. Se acepta.
// ---------------------------------------------------------------------------

export type TipoPii = "ssn" | "itin" | "ein" | "tarjeta" | "cuenta";

/**
 * Un hallazgo NUNCA lleva el texto encontrado, solo donde estaba y de que tipo.
 * Si el hallazgo llevase la muestra acabaria en un console.log, y un SSN en los
 * logs de Vercel es exactamente la fuga que este modulo evita.
 */
export type Hallazgo = { tipo: TipoPii; inicio: number; fin: number; digitos: number };

type Tramo = { inicio: number; fin: number };

// --- Tramos seguros --------------------------------------------------------

const SEGUROS: RegExp[] = [
  // Cantidad en dolares: $1,200 · $12,500.00 · $ 3200
  /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g,
  // Numero con separador de millares: 12,500.00 (nadie escribe un SSN con comas)
  /(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d+)?(?![\d,])/g,
  // Fecha: 04/15/2024 · 4-15-24
  /(?<!\d)\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?!\d)/g,
  // Telefono de EE.UU.: (754) 244-3993 · 754-244-3993 · 754.244.3993 ·
  // +1 754 244 3993 · 7542443993 · 1-800-555-0199
  // El (?<!\d) y el (?!\d) son lo que impide que se coma los primeros 10
  // digitos de una tarjeta de 16 y deje el resto suelto.
  /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g,
  // Codigo postal, con y sin +4: 33071 · 33071-1234
  /(?<!\d)\d{5}(?:-\d{4})?(?!\d)/g,
  // Ano: 2023 · 1999
  /(?<!\d)(?:19|20)\d{2}(?!\d)/g,
];

function tramosSeguros(texto: string): Tramo[] {
  const tramos: Tramo[] = [];
  for (const re of SEGUROS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto)) !== null) {
      tramos.push({ inicio: m.index, fin: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++; // seguro anti-bucle
    }
  }
  return tramos;
}

const solapa = (a: Tramo, b: Tramo): boolean => a.inicio < b.fin && b.inicio < a.fin;

// --- Deteccion -------------------------------------------------------------

/** Luhn. Es lo unico que separa una tarjeta de 16 digitos cualesquiera. */
export function luhn(digitos: string): boolean {
  if (!/^\d+$/.test(digitos)) return false;
  let suma = 0;
  let doble = false;
  for (let i = digitos.length - 1; i >= 0; i--) {
    let n = digitos.charCodeAt(i) - 48;
    if (doble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
    doble = !doble;
  }
  return suma % 10 === 0;
}

// El orden IMPORTA: el primero que acierta en un tramo se queda con la
// etiqueta. ITIN antes que SSN porque un ITIN valido tambien casa el formato
// NNN-NN-NNNN, y decirle al usuario "ITIN" es mas util que decirle "SSN".
const REGLAS: { tipo: TipoPii; re: RegExp; luhn?: boolean }[] = [
  {
    // ITIN: empieza por 9 y los digitos 4-5 caen en 70-88, 90-92 o 94-99.
    tipo: "itin",
    re: /(?<!\d)9\d{2}[- ]?(?:7\d|8[0-8]|9[0-2]|9[4-9])[- ]?\d{4}(?!\d)/g,
  },
  {
    // SSN con formato: 123-45-6789 y 123 45 6789.
    tipo: "ssn",
    re: /(?<!\d)\d{3}[- ]\d{2}[- ]\d{4}(?!\d)/g,
  },
  {
    // EIN: 12-3456789. Antes que el SSN pelado porque el pelado no lleva guion.
    tipo: "ein",
    re: /(?<!\d)\d{2}-\d{7}(?!\d)/g,
  },
  {
    // 9 digitos seguidos. Es SSN, ITIN, EIN sin guion o routing bancario: los
    // cuatro son identificadores fiscales o financieros y los cuatro se
    // bloquean igual. Un telefono son 10, no 9 — de ahi el (?!\d).
    tipo: "ssn",
    re: /(?<!\d)\d{9}(?!\d)/g,
  },
  {
    // Tarjeta: 13-19 digitos, admitiendo espacios o guiones, y que pase Luhn.
    tipo: "tarjeta",
    re: /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g,
    luhn: true,
  },
  {
    // Numero de cuenta: cualquier rafaga larga de digitos que no sea nada de lo
    // anterior ni un tramo seguro.
    tipo: "cuenta",
    re: /(?<!\d)\d{8,}(?!\d)/g,
  },
];

/**
 * Devuelve los hallazgos de PII. Lista vacia = el texto se puede guardar.
 */
export function detectarPii(texto: string): Hallazgo[] {
  if (!texto) return [];
  const seguros = tramosSeguros(texto);
  const hallazgos: Hallazgo[] = [];

  for (const regla of REGLAS) {
    regla.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regla.re.exec(texto)) !== null) {
      const tramo: Tramo = { inicio: m.index, fin: m.index + m[0].length };
      if (m[0].length === 0) {
        regla.re.lastIndex++;
        continue;
      }
      // Un telefono, un ZIP o una cantidad ganan siempre.
      if (seguros.some((s) => solapa(tramo, s))) continue;
      // Ya etiquetado por una regla anterior, de mayor prioridad.
      if (hallazgos.some((h) => solapa(tramo, h))) continue;

      const digitos = m[0].replace(/\D/g, "");
      if (regla.luhn) {
        if (digitos.length < 13 || digitos.length > 19) continue;
        // Sin Luhn no es tarjeta; si aun asi son 12+ digitos seguidos la regla
        // "cuenta" lo cogera en la pasada siguiente.
        if (!luhn(digitos)) continue;
      }
      hallazgos.push({ tipo: regla.tipo, inicio: tramo.inicio, fin: tramo.fin, digitos: digitos.length });
    }
  }

  return hallazgos.sort((a, b) => a.inicio - b.inicio);
}

export const contienePii = (texto: string): boolean => detectarPii(texto).length > 0;

/** Solo los tipos, sin posiciones ni muestras. Esto SI puede ir a un log. */
export const resumenPii = (hallazgos: Hallazgo[]): string =>
  [...new Set(hallazgos.map((h) => h.tipo))].sort().join(",");

/**
 * Mensaje de rechazo. El telefono entra por parametro y NO se importa de
 * NEGOCIO: este modulo tiene que seguir ejecutandose con `node` pelado, y
 * ademas el NAP tiene una sola fuente valida (src/lib/sanity.ts).
 * R3: no promete un portal seguro que no existe. El canal es el telefono real.
 */
export function mensajeCanalSeguro(lang: "en" | "es", telefono: string): string {
  return lang === "es"
    ? `Por su seguridad, no incluya números de Seguro Social (SSN), ITIN, EIN, ` +
        `cuenta bancaria o tarjeta en este formulario. Quítelos y envíe el mensaje de nuevo. ` +
        `Para darnos esos números, llámenos al ${telefono}.`
    : `For your security, do not include Social Security (SSN), ITIN, EIN, bank account ` +
        `or card numbers in this form. Please remove them and send the message again. ` +
        `To give us those numbers, call us at ${telefono}.`;
}

// ---------------------------------------------------------------------------
// AUTOCOMPROBACION
//
//   node --experimental-strip-types src/lib/pii.ts
//
// Los casos de FALSO POSITIVO son la mitad importante: un filtro que bloquea un
// telefono, un codigo postal, una cantidad o un ano deja el formulario inutil.
// ---------------------------------------------------------------------------

function autocomprobacion(): void {
  let fallos = 0;
  let pasadas = 0;

  const afirmar = (cond: boolean, etiqueta: string, detalle = ""): void => {
    pasadas++;
    if (cond) {
      console.log(`  ok   ${etiqueta}`);
    } else {
      fallos++;
      console.log(`  FALLA ${etiqueta}${detalle ? ` -> ${detalle}` : ""}`);
    }
  };

  // --- Deben BLOQUEARSE ---
  console.log("\nDEBE BLOQUEAR");
  const bloquear: [string, TipoPii][] = [
    ["My SSN is 123-45-6789.", "ssn"],
    ["ssn 123 45 6789 thanks", "ssn"],
    ["social security number: 123456789", "ssn"],
    ["My ITIN is 912-70-1234.", "itin"],
    ["itin 900701234 for my spouse", "itin"],
    ["The EIN of the LLC is 12-3456789.", "ein"],
    ["card 4111 1111 1111 1111 exp 09/28", "tarjeta"],
    ["my visa is 4012888888881881", "tarjeta"],
    ["account number 000123456789012", "cuenta"],
    ["routing 021000021 checking 5301234567890", "cuenta"],
    ["please wire to 12345678", "cuenta"],
  ];
  for (const [texto, tipo] of bloquear) {
    const h = detectarPii(texto);
    afirmar(
      h.length > 0 && h.some((x) => x.tipo === tipo),
      `${JSON.stringify(texto)} -> ${tipo}`,
      h.length === 0 ? "no detecto nada" : `detecto ${resumenPii(h)}`,
    );
  }

  // --- NO deben bloquearse (falsos positivos) ---
  console.log("\nNO DEBE BLOQUEAR (falsos positivos)");
  const permitir: string[] = [
    // telefono, en los formatos que la gente escribe de verdad
    "Call me at (754) 244-3993 tomorrow morning.",
    "my number is 754-244-3993",
    "phone 754.244.3993",
    "+1 754 244 3993",
    "7542443993",
    "Toll free 1-800-555-0199 ext 12",
    // codigo postal
    "Our office is at 1700 N University Dr STE 210, Coral Springs, FL 33071.",
    "zip 33071-1234",
    // cantidad en dolares
    "I owe about $12,500.00 from last year.",
    "The refund was $3,200 and the fee $450.",
    "Total 12,500.00 in expenses.",
    // ano y fecha
    "I need help with my 2024 return.",
    "for tax year 2023 and 2022",
    "Filed on 04/15/2024.",
    // combinacion realista: telefono + ZIP + cantidad + ano en un solo mensaje
    "Hi, I'm at 33071, my phone is 754-244-3993, I owe $12,500.00 for 2023.",
    // dos telefonos seguidos: la regla de tarjeta podria unirlos en una rafaga
    // de 19 digitos y colar por Luhn. El solape con tramo seguro lo impide.
    "Reach me at 754-244-3993 or 305-555-1234.",
    // sin digitos
    "Do you handle sales tax filing for a small LLC?",
    "",
  ];
  for (const texto of permitir) {
    const h = detectarPii(texto);
    afirmar(h.length === 0, JSON.stringify(texto), h.length ? `bloqueo por ${resumenPii(h)}` : "");
  }

  // --- Invariantes ---
  console.log("\nINVARIANTES");
  afirmar(luhn("4111111111111111"), "luhn acepta 4111111111111111");
  afirmar(!luhn("4111111111111112"), "luhn rechaza 4111111111111112");
  afirmar(
    JSON.stringify(detectarPii("ssn 123-45-6789")[0]) ===
      JSON.stringify({ tipo: "ssn", inicio: 4, fin: 15, digitos: 9 }),
    "el hallazgo no lleva el texto encontrado, solo tipo/posicion/longitud",
  );
  afirmar(
    mensajeCanalSeguro("en", "+1 (754) 244-3993").includes("+1 (754) 244-3993") &&
      mensajeCanalSeguro("es", "+1 (754) 244-3993").includes("+1 (754) 244-3993"),
    "el mensaje inyecta el telefono real en EN y ES",
  );

  console.log(`\n${pasadas - fallos}/${pasadas} correctas, ${fallos} fallos`);
  if (fallos > 0) (globalThis as any).process.exitCode = 1;
}

// Solo cuando se ejecuta el fichero a mano. Importado desde /api/lead no corre.
const argv1 = (globalThis as any).process?.argv?.[1];
if (typeof argv1 === "string" && /(^|[/\\])pii\.ts$/.test(argv1)) autocomprobacion();
