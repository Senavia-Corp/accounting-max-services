# Revisión fiscal — lo que debe validar un EA o CPA antes de publicar

Accounting Max Services, Inc. · Última actualización: 2026-07-29
Cubre las **12 páginas de servicio**, EN y ES.

Nada está publicado. El contenido vive en ficheros locales (`baseline/contenido/`)
y **no se ha escrito una sola línea en Sanity**. La producción sigue mostrando el
texto viejo.

## Cómo se verificó

Cada afirmación comprobable de las 12 páginas se contrastó contra la fuente
primaria (irs.gov, floridarevenue.com, flsenate.gov, sunbiz.org), una auditoría
por página, sin dar por buena la propia página:

| Veredicto | Nº | Qué se hizo |
|---|--:|---|
| **CONFIRMADA** | 235 | La fuente dice exactamente eso. Se deja. |
| **DESVIADA** | 24 | La fuente decía otra cosa. **Corregidas** (menos las de fundación, ver §1). |
| **SIN_FUENTE** | 13 | Comprobable pero sin cita. **Se les añadió fuente o se reformularon.** |
| **NO_VERIFICABLE** | 32 | Datos del propio despacho. **Los tiene que confirmar usted** (§4). |
| **TOTAL** | **304** | |

---

## 1. 🔴 BLOQUEANTE — La fecha de fundación no cuadra con el registro de Florida

El encargo fijaba como regla de hecho innegociable que **la firma es de 2019** y
que decir «since 2009» era una afirmación falsa. Escribí las 12 páginas con esa
regla. **El registro mercantil de Florida dice lo contrario.**

Sunbiz, Florida Division of Corporations:

| Campo | Valor |
|---|---|
| Razón social | ACCOUNTING MAX SERVICES, INC. |
| Nº de documento | **P09000081031** (el prefijo `P09` codifica el año 2009) |
| Date Filed | **09/30/2009** · Effective **09/29/2009** |
| Estado | ACTIVE, con informes anuales ininterrumpidos desde 05/03/2010 |
| Domicilio principal | **1700 N University Dr STE 210, Coral Springs, FL 33071** — el mismo de la web |
| FEI/EIN | 27-1058966 |
| Cambio de nombre | **26/04/2023** |

Y el dato que lo vuelve incómodo: **de 2009 a 2026 son exactamente 17 años**, que
es justo la cifra que el encargo atribuye a «experiencia profesional acumulada
del equipo».

**No lo he cambiado.** El texto sigue diciendo «founded in 2019» / «fundada en
2019» en las cuatro páginas donde aparece, porque usted lo fijó como dato
verificado y porque hay explicaciones posibles que solo usted puede confirmar:

- La sociedad de 2009 se compró o se reactivó, y la práctica actual empezó en 2019.
- La entidad existe desde 2009 pero con **otro nombre** hasta el 26/04/2023, y
  «2019» marca el inicio del despacho tal como opera hoy.
- Es una errata de dígito (2009 → 2019) heredada.

**Qué hay que decidir, y por qué corre prisa.** «Founded in 2019» es tan
comprobable como lo era «since 2009»: cualquiera lo contrasta en sunbiz.org en
treinta segundos, y el domicilio coincide. Si la sociedad es de 2009, la web
estaría restando diez años de antigüedad a un despacho de EAs y CPAs, y además
desperdiciando el argumento. Dígame cuál de los tres casos es y lo ajusto en las
dos lenguas en una pasada.

> `tools/services-build.mjs` sigue rechazando «since 2009» y «15+ years serving»
> mientras la regla actual esté vigente. Si la respuesta cambia la regla, se
> cambia también el comprobador.

---

## 2. 🔴 CORREGIDO — «IRS Certified Enrolled Agent» incumple la Circular 230

Esto no es estilo: es la norma que regula cómo puede anunciarse un EA.

> **31 CFR §10.30(a)(1):** los enrolled agents, al describir su designación
> profesional, *«may not utilize the term "certified" or imply an employer/employee
> relationship with the Internal Revenue Service»*.
>
> Fórmulas que el propio IRS da por admitidas: *«enrolled to practice before the
> Internal Revenue Service»*, *«licensed to practice before the Internal Revenue
> Service»*, *«admitted to practice before the Internal Revenue Service»*.

«IRS Certified Enrolled Agent» incurre en las **dos** prohibiciones a la vez: usa
«certified» y antepone «IRS» al título. Estaba en 21 sitios del sitio vivo —la
barra de navegación, la portada, about-us, el FAQ, el pie de los posts— y yo mismo
la había propagado al contenido nuevo por venir en el encargo.

**Corregido en 21 cadenas**, EN y ES:

| Antes | Ahora |
|---|---|
| `IRS Certified Enrolled Agent` (barra de navegación) | `Enrolled Agent (EA)` |
| `IRS Certified Enrolled Agents and CPAs` | `Enrolled Agents licensed to practice before the IRS, and CPAs` |
| `Enrolled Agents certificados por el IRS` | `Enrolled Agents autorizados a ejercer ante el IRS` |

**La credencial no cambia** — siguen siendo Enrolled Agents; cambia cómo se puede
nombrar. «Certified Public Accountant» **sí** es correcto: la prohibición afecta
solo al EA. Es un cambio mecánico y reversible; si su EA discrepa, se revierte.

Queda uno sin tocar, por ser copia literal suya y caso más débil:
`about-us.astro:120` dice «IRS Enrolled Agents & CPAs at your service» — sin
«certified», pero anteponiendo «IRS». **Decida usted.**

---

## 3. 🟠 El estatus de Certifying Acceptance Agent no aparece en la lista del IRS

Usted confirmó el 2026-07-29 que el despacho es **Certifying Acceptance Agent**, y
la página de ITIN lo usa como argumento principal: es lo que permite prometer que
*«su pasaporte se verifica aquí y se lo lleva a casa el mismo día»*.

La verificación **no encontró al despacho** en el listado público *Acceptance
Agents – Florida* de irs.gov: ni «Accounting Max Services» ni ninguna entrada en
1700 N University Dr. Coral Springs sí tiene 22 agentes listados.

**Aviso honesto:** el listado puede ir con retraso frente a altas recientes, y la
firma podría figurar bajo otra razón social o a nombre del EA como persona física.

**Antes de publicar:** confirme el número de acuerdo CAA vigente y el nombre
exacto bajo el que figura. Si el nombre inscrito no es el comercial, la página
debería decirlo — un cliente que lo verifique en irs.gov no va a encontrarles.
Afirmar el estatus CAA sin tenerlo es exposición disciplinaria bajo la Circular 230.

---

## 4. Afirmaciones sobre el negocio — solo usted puede confirmarlas (32)

Ninguna es verificable desde fuera. Aparecen repartidas por las 12 páginas.

| # | Afirmación | Dónde aparece |
|---|---|---|
| N-1 | **«The first consultation is free»** | En las **12** páginas, en el cierre |
| N-2 | **«Over 17 years of combined professional experience»** | 5 páginas — y ver §1 |
| N-3 | **Hay EA y CPA en plantilla, hoy, ambas credenciales activas** | 6 páginas |
| N-4 | NAP: 1700 N University Dr STE 210 · +1 (754) 244-3993 · info@accountingmaxservices.com · L-V 8:00–17:00 | Todas |
| N-5 | **Zona atendida**: Coral Springs, Coconut Creek, Parkland, Margate, Tamarac, Sunrise, Pompano Beach, Fort Lauderdale | 3 páginas |
| N-6 | «Somos EAs y CPAs, **no abogados**» (dónde acaba nuestro trabajo y empieza el de un abogado) | incorporación, notary |
| N-7 | Plazos propios: estados financieros «en días» con libros al día, «semanas» si hay que reconstruir; respuesta a un requerimiento de auditoría «in days» | estados financieros, auditoría |
| N-8 | «En la primera llamada leemos su carta del IRS sin cargo» | representación |

**N-7 es el de más riesgo**: es la única promesa de plazo propio del despacho en
todo el sitio. Todos los demás plazos citados son del IRS o del estado, con su
fuente. Si no quiere comprometerse, dígamelo y lo reformulo como cualitativo.

---

## 5. Correcciones aplicadas tras la auditoría (24 + 13)

Las más importantes, por si quiere revisarlas una a una:

| Página | Qué decía | Qué dice ahora |
|---|---|---|
| ITIN | Presentar con ITIN vencido «solo retrasa» el trámite | El IRS advierte de **créditos denegados, reembolso reducido y multas e intereses** |
| Impuestos personales | Tras pedir prórroga, la multa por pago tardío se presentaba como automática | Form 4868: hay **causa razonable** si pagó ≥90 % en abril y liquida el resto al declarar |
| Incorporación | En LLC de un solo miembro «no existe declaración separada» | Solo a efectos de **impuesto sobre la renta**: para *employment* y ciertos *excise taxes* es entidad separada con su propio EIN |
| Notary | Cita del límite de honorarios y de la prohibición de traducir «Notary Public» | Contrastadas literalmente contra **s. 117.05(2)(a) y (11), Florida Statutes 2024** |
| Bilingüe | «Su declaración federal se presenta en inglés» y «siete idiomas por teléfono» | Existe el **Form 1040 (sp)** en español; el 833-553-9895 es para **todos** los demás idiomas, con intérpretes en **más de 350** |

La página de servicios bilingües la había escrito yo, y dos de sus afirmaciones
estaban mal. Las cazó la auditoría, no yo.

---

## 6. Decisión abierta — longitud

La FASE 0 fijó 550–900 palabras por página a partir del SERP. Tras las
correcciones, **las 12 están por encima**: de 918 a 1.327 palabras (13.037 en
total, frente a las ~8.350 previstas).

No es relleno: las correcciones exigían más matiz, y el matiz ocupa. Pero
contradice mi propia investigación y el techo de 1.100 que el blog justificó por
mantenibilidad — en enero, cuando cambien las cifras, alguien tiene que poder
actualizar esto. `tools/services-build.mjs` lo marca como **aviso, no como fallo**,
a propósito.

Si quiere ceñirlas a la banda, se recortan sin tocar ni un dato ni una fuente.

---

## 7. Lo que NO se ha hecho, por regla

- **Cero estadísticas inventadas.** Ni «el 90 % de las solicitudes…» ni «hemos
  tramitado X ITIN».
- **Cero testimonios, casos de cliente, premios o acreditaciones inventadas.**
- **Cero promesas de resultado.** No se dice que una solicitud será aprobada ni se
  promete reembolso. Los únicos plazos citados son del IRS o del estado, con fuente
  — salvo N-7, que está marcado arriba.
- **Sin `Review` ni `aggregateRating`** en datos estructurados: las 20 reseñas del
  CSV no tienen calificación, fecha real ni fuente (D5).
- **139 citas textuales** en las 12 páginas EN, todas con su fuente nombrada.
