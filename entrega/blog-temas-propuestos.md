# Temas propuestos — fuera del alcance de este encargo

**No he escrito ninguno de estos.** El encargo era mejorar los 10 posts que existen, y eso
es lo que está hecho. Esto es lo que la Fase 0 destapó de paso, con la evidencia al lado
para que se pueda decidir con criterio y no por intuición.

---

## El hallazgo

De los **12 servicios**, el blog reformado ahora alimenta a nueve. **Tres se quedan sin
ningún artículo que conduzca a ellos**, y son precisamente los tres con más intención
comercial para la clientela hispanohablante e internacional del despacho:

| servicio sin post | por qué duele |
|---|---|
| `itin-application-irs-tax-id` | Solicitud de ITIN. Es de los pocos servicios que se busca con intención directa y plazo encima |
| `employer-identification-number-application` | Solicitud de EIN. Entrada natural del dueño extranjero de una LLC |
| `notary-public-services` | Notary Public. Búsqueda hiperlocal, decisión inmediata |

Los tres aparecen ya **mencionados** dentro de los posts nuevos (el ITIN sale en cuatro de
los diez), así que el enlazado interno existe. Lo que no existe es una página que capte la
búsqueda de origen.

---

## Los cinco que propondría, por orden de retorno

### 1 · «How long does an ITIN take, and when to start» — ALTA

**Por qué.** Es una consulta con plazo incorporado: quien la busca tiene una fecha límite y
está decidiendo si le da tiempo. Es la definición de intención comercial.
**Qué la hace defendible.** El IRS publica tiempos de procesamiento; el despacho es
Certifying Acceptance Agent o no lo es, y eso hay que confirmarlo antes de escribir una
línea (ver abajo).
**Conduce a:** `itin-application-irs-tax-id`.
**Aviso de exactitud.** Los plazos que circulan en blogs de terceros (7–11 semanas, 14 en
temporada) **no los verifiqué en irs.gov** y por eso no entraron en ningún post. Un
artículo sobre esto se sostiene o se cae por esa cifra: hay que sacarla de la fuente.

### 2 · «EIN for a foreign-owned LLC in Florida» — ALTA

**Por qué.** Es la búsqueda del dueño extranjero que ya decidió montar la empresa. Cruza
tres servicios a la vez y casi ningún despacho local escribe sobre ello en serio.
**Conduce a:** `employer-identification-number-application` + `business-incorporation-in-florida` + `itin-application-irs-tax-id`.
**Aviso.** El procedimiento sin SSN (Form SS-4, responsible party, la vía por fax o
teléfono para solicitantes internacionales) cambia con cierta frecuencia. Es el tema de
esta lista donde más fácil es publicar algo desactualizado.

### 3 · «What a Florida Notary Public can and cannot do» — MEDIA

**Por qué.** Búsqueda local y decisión inmediata: la gente busca esto con el documento en
la mano.
**Y hay una razón de fondo mejor.** El artículo puede explicar en español, correctamente,
qué es un **Notary Public** y en qué se diferencia de un notario latinoamericano. Esa
confusión es real y perjudica al lector, que llega esperando fe pública y asesoría
jurídica y se encuentra otra cosa.
**Restricción innegociable.** En Florida está tipificado como infracción que un notary se
anuncie como «notario» en español. Un artículo sobre esto es **el sitio de mayor riesgo de
todo el sitio** para meter la pata, y a la vez el de mayor valor si se escribe bien. No lo
escribe nadie sin que un EA o un CPA del despacho revise el español palabra por palabra.
**Conduce a:** `notary-public-services`.

### 4 · «Sales tax when you sell across county lines in South Florida» — MEDIA

**Por qué.** El post de Sales Tax ya introduce la regla del condado de entrega y el cambio
de Palm Beach del 1-ene-2026. Da para un artículo propio con la tabla de condados vecinos.
**Ventaja.** La fuente (DR-15DSS) es estable, anual y verificable, y el tema es
inherentemente local: ninguna guía nacional lo cubre.
**Conduce a:** `sales-tax-filing-7k40q`.

### 5 · «Choosing a tax preparer: what the credentials mean» — MEDIA

**Por qué.** Convierte en contenido la ventaja real del despacho —EA y CPA de verdad— sin
que suene a folleto, explicando qué autoriza cada credencial ante el IRS.
**Efecto secundario que importa.** Es el artículo que más ayudaría a resolver `authorName`:
un texto que explica por qué la credencial importa, sin firma, se lee raro. Escribirlo
obliga a cerrar esa decisión.
**Conduce a:** `representation-before-the-irs` + `audit-assistance`.

---

## Lo que hay que resolver antes de encargar cualquiera de estos

1. **`authorName`.** Sigue sin firma. Ver `blog-revision-fiscal.md`. Cada artículo nuevo
   agranda el problema en vez de resolverlo.
2. **¿Es el despacho Certifying Acceptance Agent del IRS?** Cambia por completo lo que se
   puede prometer en el artículo de ITIN, y es un dato del cliente, no algo que yo pueda
   deducir del sitio.
3. **D3 — el español.** Estos cinco van dirigidos en buena parte a lectores
   hispanohablantes, y `/es` sigue `noindex`. **Escribir más contenido en español que Google
   no puede indexar es trabajo que no capta nada.** Si el plan es crecer por ese lado,
   cerrar D3 rinde más que cualquiera de los cinco artículos.
4. **Mantenimiento.** Cada post con cifras es un pasivo anual. Diez ya obligan a una
   revisión en diciembre. Quince, más. Conviene decidir quién la hace antes de encargar
   más.

---

## Lo que NO recomendaría escribir

- **Artículos genéricos de 2.500 palabras sobre «qué es una deducción».** IRS.gov ocupa las
  tres primeras posiciones en esas consultas y no se le gana con extensión.
- **Contenido con cifras en el titular sin dueño de mantenimiento.** «Tax brackets 2026» da
  tráfico un año y da vergüenza el siguiente.
- **Nada que dependa de reseñas, testimonios o estadísticas de clientes.** D5 sigue
  PENDIENTE y las 20 reseñas del CSV no tienen ni rating, ni fecha, ni fuente.
