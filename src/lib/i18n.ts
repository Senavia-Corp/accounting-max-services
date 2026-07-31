// Cadenas de interfaz y de pagina, EN y ES. Fuente unica para las rutas /es/.
//
// QUE HAY AQUI: solo texto de PLANTILLA — el que hoy vive escrito a mano en los
// componentes y en las paginas. Lo que viene de Sanity (titulos e intros de los
// 12 servicios, los 10 posts) NO esta aqui: se traduce en el CMS con los campos
// titleEs/introEs/bodyEs/excerptEs que ya existen en src/lib/sanity.ts.
//
// QUE NO ESTA AQUI, A PROPOSITO:
//
//   - EL NAP. Telefono, correo, calle, ciudad, region, CP y HORARIO viven en
//     NEGOCIO (src/lib/sanity.ts) y son la unica fuente valida. No se traducen
//     ni se copian aqui: duplicarlos es garantizar que un dia diverjan. Eso
//     incluye "Monday - Friday (8:00 AM - 5:00 PM)": se pinta desde NEGOCIO.horario
//     igual en las dos lenguas.
//   - LOS 20 TESTIMONIOS. Son palabras de clientes reales: ni se traducen ni se
//     editan (regla de FASE 5).
//   - El nombre del negocio, "Accounting Max Services", que es NAP y va literal
//     en las dos lenguas (tambien dentro de las frases).
//
// GLOSARIO — NO SE TRADUCEN, NUNCA:
//   IRS · Enrolled Agent (y EA) · CPA · ITIN · EIN · LLC · S-Corp · C-Corp ·
//   W-2 · 1099 · Sales Tax · Form 1040 · Form 1120 · Form 1120-S · Form 1065 ·
//   Notary Public
//
//   Traducir "Enrolled Agent" o "CPA" fabrica una CREDENCIAL FALSA: "contador
//   publico certificado" no es un CPA de Florida y afirmarlo es riesgo legal.
//   "Notary Public" NO es "notario": en Florida esta tipificado como infraccion
//   que un notary se anuncie en espanol como notario o notario publico, porque
//   en Latinoamerica ese termino designa a un abogado. El servicio
//   'notary-public-services' se queda como "Notary Public" tambien en /es/.
//   Los nombres de formulario del IRS son identificadores, no palabras.
//
// REGISTRO: USTED en todo el sitio, sin mezclar con tu. Las unicas frases en
// primera persona son las casillas de consentimiento ("Acepto que...") y las
// preguntas del FAQ ("¿Qué documentos necesito...?"), que es la voz del propio
// usuario y asi esta en el original.
//
// R3: no hay ni una frase nueva. Todo lo de aqui es traduccion de copia que ya
// existe en produccion. Los {{PENDIENTE}} se mantienen visibles en las dos
// lenguas: son huecos reales, no texto que se pueda rellenar.
//
// TEXTO PLANO vs HTML. Las claves que acaban en `Html` (y features.items[].html)
// llevan <strong>/<br> y SOLO valen con set:html. Todas las demas son texto
// plano con caracteres reales (& y ' sin entidad) porque Astro escapa las
// expresiones: un "&amp;" en una clave de texto se veria literalmente como
// "&amp;" en la pagina. En el HTML de las paginas EN esas mismas cadenas si
// llevan entidad; es lo correcto alli y lo incorrecto aqui.

/** Misma forma que EN, pero con `string` donde EN tiene un literal. */
type Igual<T> = { readonly [K in keyof T]: T[K] extends string ? string : Igual<T[K]> };

// ---------------------------------------------------------------------------
// EN — copia real de produccion, migrada verbatim (comillas tipograficas,
// rayas, mayusculas erraticas y espacios finales incluidos). No se corrige.
// ---------------------------------------------------------------------------

const EN = {
  // <title> y meta description de las rutas fijas. Las 12 de servicio y las 10
  // de post se componen con `plantillaTitulo` a partir del dato del CMS.
  meta: {
    plantillaTitulo: "{pagina} | {negocio}",
    homeTitle: "Tax & Accounting, Coral Springs FL",
    homeDescription:
      "Bilingual tax and accounting in Coral Springs, FL for individuals and business owners across Broward County — and for clients filing from abroad.",
    aboutTitle: "About Our Coral Springs Tax Firm",
    aboutDescription:
      "Bilingual Enrolled Agents and CPAs in Coral Springs, FL, licensed to practice before the IRS. Founded in 2009, with over 17 years of combined experience.",
    contactTitle: "Contact Our Coral Springs Office",
    contactDescription:
      "Talk to a bilingual Enrolled Agent in Coral Springs, FL. We are at 1700 N University Dr STE 210, Monday to Friday, and the first consultation is free.",
    blogTitle: "Tax Blog & News",
    blogDescription:
      "Articles on taxes, accounting and financial strategy — IRS updates, Florida deadlines and small-business guidance from our Coral Springs, FL office.",
  },

  nav: {
    // Las dos credenciales de la barra superior. Van literales en ES: son la
    // credencial, no una descripcion (ver glosario).
    topCpa: "Certified Public Accounting",
    topEa: "Enrolled Agent (EA)",
    redes: "Follow us on our social networks:",
    logoAlt: "Accounting Max Services",
    home: "Home",
    services: "Services",
    about: "About Us",
    blog: "Blog & news",
    contact: "Contact Us",
    cta: "Book a consultation",
    menu: "Menu",
    navPrincipal: "Main",
    navContacto: "Contact",
    // Boton de telefono del cromo movil (<992px). El numero NO esta aqui: sale
    // de NEGOCIO.telefonoHref, que es la unica fuente valida de NAP.
    // {negocio} es NEGOCIO.nombre, que va literal en las dos lenguas.
    // SC 2.5.3 (Label in Name): el texto visible tiene que estar CONTENIDO en el
    // nombre accesible. "Call" esta dentro de "Call Accounting Max Services".
    llamar: "Call",
    llamarAria: "Call {negocio}",
    // Nivel 2 del cajon movil: vuelve del listado de servicios al menu.
    volver: "Back",
    volverAria: "Back to main menu",
    // SC 2.4.1 (Bypass Blocks): el cromo mete hasta 18 elementos focalizables
    // antes del contenido en escritorio. No existia ninguno en las 54 rutas.
    saltar: "Skip to content",
  },

  footer: {
    promoTitle: "Get Expert Advice – Book Your Free Call Today!",
    promoText:
      "Ready to take control of your finances? Schedule a free consultation call with our expert advisors today! We’ll help you uncover opportunities, tackle challenges, and set your business up for financial success.",
    promoCta: "Book a free Consultation",
    logoAlt: "Accounting Max Services",
    tagline:
      "Enrolled Agents (EAs) & CPAs offering bilingual tax and accounting services for individuals & businesses.",
    contactTitle: "Contact Information",
    servicesTitle: "Services",
    // El ano y la razon social NO se tocan (R3): solo se traduce la formula.
    copyright: "Copyright 2025 Accounting Max Services Inc. All rights reserved.",
  },

  newsletter: {
    title: "Subscribe to the newsletter",
    text: "Stay informed with tax tips, deadline reminders, and financial updates—all in your inbox. Join our newsletter and get expert insights to help you stay compliant and grow your business.",
    emailLabel: "Email address",
    emailPlaceholder: "Enter your email",
    submit: "Subscribe Now",
    wait: "Please wait...",
    honeypot: "Leave this field empty",
    done: "Thank you! Your submission has been received!",
    fail: "Oops! Something went wrong while submitting the form.",
  },

  form: {
    title: "Request an online consultation!",
    text: "Get a personalized quote for your tax or accounting needs—fast, confidential, and bilingual.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Full name",
    emailLabel: "Email",
    emailPlaceholder: "Email",
    phoneLabel: "Phone",
    phonePlaceholder: "Phone",
    messageLabel: "How can we help you? (optional)",
    messagePlaceholder: "How can we help you?",
    // FTSA + TCPA: consentimiento separado por canal, opcional y sin marcar.
    // {negocio} = NEGOCIO.nombre, que no se traduce.
    consentLegend: "Consent to phone calls and text messages",
    consentCalls:
      "I agree that {negocio} may call me at the phone number I provide, including calls placed with automated dialing technology, about this request and its services. Consent is not required to get a quote or to buy anything, and I can withdraw it at any time by telling the person who calls me to stop.",
    consentSms:
      "I agree that {negocio} may send me text messages (SMS) at the phone number I provide, including messages sent with automated technology, about this request and its services. Consent is not required to get a quote or to buy anything. Message frequency varies and message and data rates may apply. Reply STOP to opt out or HELP for help.",
    consentNote:
      "The phone number is required on this form. We only call or text you if you check a box above; if you leave both unchecked, we reply by email.",
    // D4: la politica de privacidad y el aviso GLBA no existen todavia. El
    // hueco va visible en las dos lenguas; no se enlaza a nada inventado.
    privacyBefore: "By submitting this form you agree to our ",
    privacyLink: "Privacy Policy and GLBA privacy notice",
    privacyAfter: ".",
    honeypot: "Leave this field empty",
    submit: "Request estimate",
    wait: "Please wait...",
    done: "Thank you! Your submission has been received!",
    fail: "Oops! Something went wrong while submitting the form.",
  },

  // Mensajes de error. Son copia EXACTA de los que ya emiten /api/lead y
  // /api/newsletter: si alguien cambia uno, tiene que cambiar los dos.
  // {telefono} = NEGOCIO.telefono, que no pasa por el traductor.
  errores: {
    metodo: "Method not allowed.",
    grande: "That message is too large.",
    grandePeticion: "That request is too large.",
    adjunto: "This form does not accept file attachments. Please send text only.",
    adjuntoBreve: "This form does not accept file attachments.",
    rapido: "That was submitted too quickly. Please try again.",
    demasiados:
      "Too many submissions from this connection. Please try again in a few minutes.",
    nombre: "Please enter your name.",
    email: "Please enter a valid email address.",
    telefono: "Please enter a valid phone number.",
    mensajeLargo: "The message is limited to 5000 characters.",
    captcha: "Verification failed. Please try again.",
    guardarLead: "We could not save your request. Please call us at {telefono}.",
    guardarBoletin: "We could not save your subscription. Please call us at {telefono}.",
    // Aviso del filtro de PII. Literal identico al de mensajeCanalSeguro() en
    // src/lib/pii.ts, que es quien lo emite en runtime (ese modulo no importa
    // nada a proposito). Si se toca aqui, hay que tocarlo alli.
    pii:
      "For your security, do not include Social Security (SSN), ITIN, EIN, bank account " +
      "or card numbers in this form. Please remove them and send the message again. " +
      "To give us those numbers, call us at {telefono}.",
  },

  home: {
    heroTitle: "Enrolled Agents & CPAs in Coral Springs, FL — Tax, Accounting & IRS Representation",
    heroIntro:
      "Bilingual tax and accounting in Coral Springs, FL for individuals and business owners across Broward County — and for clients filing from abroad.",
    heroCta: "Book a consultation",
    heroAlt:
      "Blank IRS Form 1040 and Form 1120 tax returns on a white desk with a pen, reading glasses and a calculator.",
    aboutTitle: "IRS Enrolled Agents & Certified Public Accountants In Coral Springs, FL ",
    // Lleva <strong> y <br>: se pinta con set:html, igual que los parrafos de
    // .features en /services/[slug].
    aboutHtml:
      "At Accounting Max Services, our team includes Enrolled Agents (EAs) licensed to practice before the IRS and Certified Public Accountants (CPAs), offering the highest level of tax expertise and compliance support.<br />We provide a full range of <strong>global tax and accounting solutions</strong>—serving both individuals and businesses in Coral Springs, FL, and internationally. Whether you’re managing cross-border finances, running a U.S. business, or dealing with complex international tax matters, our specialists deliver accurate, personalized guidance every step of the way.",
    aboutCta: "More About Us",
    // Titulo real del video de YouTube incrustado: es el nombre de una obra de
    // un tercero y esta en ingles. No se traduce en ninguna de las dos rutas.
    videoTitulo: "What Is a Financial Advisor?",
    videoCta: "Play the video: {titulo}",
    // Alt de las 3 ilustraciones de .features en la portada (en /services son
    // otros textos: ver service.featuresAlt).
    featuresAlt: [
      "Messaging app with a customer conversation, insets of two advisors on headset calls and a Book a call button.",
      "Accounting dashboard showing sales revenue and a Top Expenses breakdown by category, reviewed by an advisor on a tablet.",
      "Accounting dashboard with total revenue, total expenses and net profit next to a monthly revenue and profit chart.",
    ],
  },

  // Carrusel de testimonios. Lo comparten la portada y las 12 rutas de servicio.
  // D5: se muestran como testimonios y nada mas — prohibido JSON-LD Review o
  // aggregateRating. El "5.0 Ranking on Google reviews" es copia del sitio en
  // produccion; se migra, se traduce la formula y la cifra se copia tal cual.
  reviews: {
    title: "What Our Customers Are Saying About Us",
    text: "Trusted by small business owners nationwide, Accounting Max Services is known for delivering results. Discover how we’ve helped businesses succeed—read our customer success stories.",
    prev: "Previous testimonials",
    next: "Next testimonials",
    grupo: "Customer testimonials",
    googleAltPortada: "Google reviews icon",
    googleAltServicio: "Google Reviews",
    ranking: "5.0 Ranking on Google reviews",
    publicado: "Published on Google",
  },

  // Bloque .features: mismo texto en la portada y en las 12 rutas de servicio.
  // Los parrafos llevan <strong>: van con set:html.
  features: {
    title: "What to expect from accounting Max Services?",
    text: "At Accounting Max Services, we prioritize delivering exceptional service to our clients by offering personalized financial and tax solutions. When you work with us, you can expect expert guidance, transparent communication, and a commitment to your financial success.",
    items: [
      {
        title: "One-on-one expert support",
        html: "We believe in building strong, lasting relationships with our clients. With <strong>one-on-one expert support</strong>, you&#x27;ll have direct access to knowledgeable professionals who understand your unique financial needs. Whether you&#x27;re a business owner or an individual, we&#x27;ll work closely with you to ensure all your questions are answered and your goals are met with precision. Our personalized approach ensures you never feel lost in the process—you&#x27;re always in capable hands.",
      },
      {
        title: "Powerful financial reporting",
        html: "Our <strong>financial reporting</strong> services provide you with detailed, accurate insights into the health of your business or personal finances. We prepare <strong>customized financial statements</strong> such as income statements, balance sheets, and cash flow reports to help you make informed decisions. With our <strong>powerful financial reporting</strong>, you’ll gain a clear understanding of your financial position, giving you the tools to plan effectively, secure funding, and grow your business with confidence.",
      },
      {
        title: "Tax season, minus the stress",
        html: "Tax season can be overwhelming, but with Accounting Max Services, it doesn’t have to be. We handle every aspect of <strong>tax preparation</strong>—from gathering your documents to filing your returns—so you can relax. Our goal is to make the process as seamless and stress-free as possible, ensuring that your taxes are filed accurately, on time, and with maximum refunds or minimized liabilities. With our team by your side, you’ll never have to worry about tax season again.",
      },
    ],
  },

  // Llamada a la accion. Identica en portada, /about-us y las 12 de servicio.
  cta: {
    title: "Schedule a free consultation call Today!",
    text: "Take the first step towards stress-free accounting! Schedule your free 30-minute consultation call now and get tailored advice for your small business.",
    button: "Book A Consultation",
  },

  // FAQ de la portada. Contenido fiscal: el glosario manda (W-2, 1099, EIN,
  // ITIN, IRS, Enrolled Agent van literales). La numeracion "1." a "5." es del
  // original y se conserva.
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "1. What documents do I need to file my personal taxes?",
        a: "To file your personal taxes, you’ll typically need your W-2 or 1099 forms, ID, Social Security number, and any records of deductions, credits, or income. We’ll guide you through the checklist.",
      },
      {
        q: "2. How long does it take to get my EIN or ITIN?",
        a: "EINs can often be processed within 1–2 business days. ITINs may take a few weeks depending on IRS processing times. We handle the paperwork to avoid delays.",
      },
      {
        q: "3. Do you offer services in Spanish?",
        a: "Yes! All of our services are available in both English and Spanish. We’re proud to serve the Hispanic community with bilingual support.",
      },
      {
        q: "4. Can you help with IRS audits or letters?",
        a: "Absolutely. Our team includes Enrolled Agents licensed to practice before the IRS who represent you directly before the IRS to resolve audits, letters, or disputes.",
      },
      {
        q: "5. Do you only serve clients in Coral Springs?",
        a: "No. While we’re based in Coral Springs, FL, we serve clients nationwide through secure online consultations and document portals.",
      },
    ],
  },

  about: {
    title: "Trusted Tax & Accounting Experts in Coral Springs",
    heroAlt:
      "Aerial view of the three-story office building with a tile roof and teal awnings at 1700 N University Drive, Coral Springs, Florida",
    // Lleva <strong>: se pinta con set:html.
    introHtml:
      "At Accounting Max Services, we provide expert tax and accounting solutions for individuals and businesses across the U.S. and abroad. As Enrolled Agents licensed to practice before the IRS, and CPAs, our mission is to deliver accurate, timely, and personalized financial services to help you stay compliant and grow with confidence. Founded in 2009 and based in <strong>Coral Springs, Florida</strong>, our team brings over 17 years of combined professional experience to everything from tax preparation and business incorporation to bookkeeping, IRS representation, and audit assistance. All our services are available in <strong>English and Spanish</strong>, making financial clarity accessible to everyone. Whether you’re a business owner, freelancer, or international client, we’re here to help you navigate complex tax laws and achieve financial peace of mind.",
    // bar-features: `destacado` va en <em> y `texto` pegado detras.
    // OJO (R3): en los items 2, 3 y 4 el original NO tiene espacio entre el
    // </em> y la frase siguiente ("your choice.We proudly serve"). Es una
    // errata del cliente y en EN se migra tal cual. En ES no se reproduce: la
    // traduccion es texto nuevo y copiar la errata seria fabricar un defecto.
    features: [
      {
        title: "Certified Expertise",
        lead: "IRS Enrolled Agents & CPAs at your service. ",
        text: "Our team holds the highest credentials in the industry, ensuring you receive professional, compliant, and up-to-date tax and accounting guidance.",
      },
      {
        title: "Bilingual Support",
        lead: "English or Spanish—your language, your choice.",
        text: "We proudly serve a diverse client base with personalized financial services available in both English and Spanish for clear, confident communication.",
      },
      {
        title: "Full-financial services",
        lead: "One trusted partner for all your financial needs.",
        text: "From tax prep and bookkeeping to audits and incorporations, we offer end-to-end solutions for individuals and businesses, both local and international.",
      },
      {
        title: "Personalized Attention",
        lead: "We treat your finances like our own.",
        text: "Every client receives tailored support, fast response times, and a clear explanation of every step—so you’re never left in the dark.",
      },
    ],
    missionTitle: "Our Mission",
    missionText:
      "At Accounting Max Services, our mission is to empower individuals and businesses with reliable, accurate, and accessible tax and accounting solutions. We are committed to delivering expert guidance with integrity, professionalism, and personalized attention—ensuring our clients stay compliant, make informed decisions, and achieve financial peace of mind. As Enrolled Agents licensed to practice before the IRS, and CPAs, we proudly serve a diverse community with bilingual support, building long-term relationships based on trust, transparency, and results.",
    missionAlt:
      "A hand places a dart in the bullseye of a target resting on printed charts, beside a laptop",
    // El espacio final es del HTML de produccion; se conserva en EN.
    visionTitle: "Our Vision ",
    visionText:
      "To be a leading bilingual tax and accounting firm recognized for excellence, trust, and innovation—empowering individuals and businesses across the U.S. and beyond to thrive financially through expert, ethical, and personalized service.",
    visionAlt:
      "A person stands at a floor-to-ceiling office window looking out over a city skyline, with eyeglasses and documents on the desk in the foreground",
    cta: "Book A Consultation",
  },

  contact: {
    title: "Contact Our Tax & Accounting Experts in Coral Springs, FL",
    intro:
      "Have questions about your taxes, business, or finances? Our expert team is ready to assist you—bilingual, responsive, and always just a message away.",
    // Rotulos de los 4 bloques de contacto. El dato que va debajo (telefono,
    // correo, direccion y horario) sale de NEGOCIO y NO se traduce.
    telefonoLabel: "Let's talk!",
    emailLabel: "Send us a message!",
    direccionLabel: "Visit us!",
    horarioLabel: "Opening hours",
  },

  blog: {
    title: "Insights, Tips & Updates from Accounting Max Services",
    intro:
      "Stay informed with expert articles on taxes, accounting, and financial strategy. From IRS updates to small business tips, our blog helps you make smarter decisions all year round.",
    // Minuscula inicial: es literal el texto de las 10 tarjetas en produccion.
    readMore: "read More",
    // Solo para lector de pantalla, detras de "read More". Empieza por espacio.
    readMoreSobre: " about {titulo}",
    pendienteResumen: "{{PENDIENTE}} post summary",
  },

  post: {
    promoTitle: "📅 Schedule Your Free Consultation Today!",
    promoText:
      "Get a free consultation with our Enrolled Agents licensed to practice before the IRS, and CPAs. We’ll review your needs and provide expert guidance with a personalized estimate—no commitment required.",
    promoCta: "Book A Consultation",
    destacadosTitle: "Featured Blogs",
    asideLabel: "More from Accounting Max Services",
    heroAltFallback: "Illustration for the article “{titulo}”",
    pendienteResumen: "{{PENDIENTE}} post summary",
  },

  service: {
    heroCta: "Book A consultation",
    // En produccion es un <h1 class="h2"> en minusculas. Se conserva la caja.
    sidebarTitle: "global financial solutions",
    pendienteIntro: "{{PENDIENTE}} intro del servicio",
    pendienteCuerpo: "{{PENDIENTE}} cuerpo del servicio",
    // Alt de las 3 ilustraciones de .features en las rutas de servicio. Son
    // otros textos que los de la portada, aunque las imagenes sean las mismas.
    featuresAlt: [
      "Illustration of a chat window with a Book a call button and portraits of two people on the phone.",
      "Illustration of an accounting dashboard showing a sales revenue summary and a breakdown of top expenses.",
      "Illustration of an accounting dashboard with revenue, expense and net profit cards and a monthly trend chart.",
    ],
  },

  // Selector de idioma. Los dos nombres van SIEMPRE en su propia lengua (es lo
  // que espera quien no lee la otra), asi que no cambian entre en y es.
  common: {
    idiomaLabel: "Language",
    idiomaEn: "English",
    idiomaEs: "Español",
  },
} as const;

/** Forma que ES tiene que cumplir exactamente: falta o sobra una clave y el build cae. */
export type Cadenas = Igual<typeof EN>;

// ---------------------------------------------------------------------------
// ES — espanol neutro orientado a Florida, publico hispanohablante de EE.UU.
// Trato de USTED en todo. Glosario aplicado. Nada inventado (R3).
// ---------------------------------------------------------------------------

const ES: Cadenas = {
  meta: {
    plantillaTitulo: "{pagina} | {negocio}",
    homeTitle: "Contador bilingüe en Coral Springs",
    homeDescription:
      "Impuestos y contabilidad en inglés y español en Coral Springs, FL, para personas y dueños de negocio de Broward y para quienes declaran desde fuera.",
    aboutTitle: "Quiénes somos en Coral Springs",
    aboutDescription:
      "Enrolled Agents autorizados a ejercer ante el IRS y CPAs en Coral Springs, FL. Fundada en 2009, con más de 17 años de experiencia profesional acumulada.",
    contactTitle: "Contáctenos en Coral Springs",
    contactDescription:
      "Hable con un Enrolled Agent bilingüe en Coral Springs, FL. Estamos en 1700 N University Dr STE 210, de lunes a viernes, y la primera consulta es gratis.",
    blogTitle: "Blog de impuestos y noticias",
    blogDescription:
      "Artículos sobre impuestos, contabilidad y estrategia financiera: novedades del IRS, plazos de Florida y consejos para pequeños negocios en Broward.",
  },

  nav: {
    // Credenciales: literales. "Contaduría pública certificada" no es lo mismo
    // que "Certified Public Accounting" y afirmarlo es riesgo legal.
    topCpa: "Certified Public Accounting",
    topEa: "Enrolled Agent (EA)",
    redes: "Síganos en nuestras redes sociales:",
    logoAlt: "Accounting Max Services",
    home: "Inicio",
    services: "Servicios",
    about: "Sobre nosotros",
    blog: "Blog y noticias",
    contact: "Contáctenos",
    cta: "Reserve una consulta",
    menu: "Menú",
    navPrincipal: "Principal",
    navContacto: "Contacto",
    llamar: "Llamar",
    // "Llamar a {negocio}" y no "Llamar {negocio}": el nombre del negocio va
    // literal porque es NAP, pero la preposicion es de la frase, no del nombre.
    // "Llamar" sigue contenido en "Llamar a Accounting Max Services" (SC 2.5.3).
    llamarAria: "Llamar a {negocio}",
    volver: "Volver",
    volverAria: "Volver al menú principal",
    saltar: "Saltar al contenido",
  },

  footer: {
    promoTitle: "Reciba asesoría experta – ¡Reserve hoy su llamada gratuita!",
    promoText:
      "¿Listo para tomar el control de sus finanzas? ¡Agende hoy una llamada de consulta gratuita con nuestros asesores expertos! Le ayudaremos a descubrir oportunidades, afrontar los retos y encaminar su negocio hacia el éxito financiero.",
    promoCta: "Reserve una consulta gratuita",
    logoAlt: "Accounting Max Services",
    tagline:
      "EAs autorizados a ejercer ante el IRS y CPAs que ofrecen servicios bilingües de impuestos y contabilidad para personas y empresas.",
    contactTitle: "Información de contacto",
    servicesTitle: "Servicios",
    copyright: "Copyright 2025 Accounting Max Services Inc. Todos los derechos reservados.",
  },

  newsletter: {
    title: "Suscríbase al boletín",
    text: "Manténgase al día con consejos fiscales, recordatorios de fechas límite y novedades financieras, todo en su bandeja de entrada. Suscríbase a nuestro boletín y reciba información experta que le ayudará a cumplir con sus obligaciones y a hacer crecer su negocio.",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "Escriba su correo electrónico",
    submit: "Suscribirse",
    wait: "Espere un momento...",
    honeypot: "Deje este campo vacío",
    done: "¡Gracias! Hemos recibido su envío.",
    fail: "Vaya, algo salió mal al enviar el formulario.",
  },

  form: {
    title: "¡Solicite una consulta en línea!",
    text: "Reciba un presupuesto personalizado para sus necesidades fiscales o contables: rápido, confidencial y bilingüe.",
    fullNameLabel: "Nombre completo",
    fullNamePlaceholder: "Nombre completo",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "Correo electrónico",
    phoneLabel: "Teléfono",
    phonePlaceholder: "Teléfono",
    messageLabel: "¿Cómo podemos ayudarle? (opcional)",
    messagePlaceholder: "¿Cómo podemos ayudarle?",
    consentLegend: "Consentimiento para llamadas y mensajes de texto",
    // Primera persona: es la declaracion del propio usuario, igual que en EN.
    consentCalls:
      "Acepto que {negocio} me llame al número de teléfono que facilito, incluidas las llamadas realizadas con tecnología de marcación automática, en relación con esta solicitud y sus servicios. El consentimiento no es necesario para recibir un presupuesto ni para contratar nada, y puedo retirarlo en cualquier momento pidiéndole a la persona que me llame que deje de hacerlo.",
    consentSms:
      "Acepto que {negocio} me envíe mensajes de texto (SMS) al número de teléfono que facilito, incluidos los mensajes enviados con tecnología automatizada, en relación con esta solicitud y sus servicios. El consentimiento no es necesario para recibir un presupuesto ni para contratar nada. La frecuencia de los mensajes varía y pueden aplicarse tarifas de mensajes y datos. Responda STOP para darse de baja o HELP para obtener ayuda.",
    consentNote:
      "El teléfono es obligatorio en este formulario. Solo le llamamos o le escribimos por mensaje de texto si marca una casilla de arriba; si deja las dos sin marcar, le respondemos por correo electrónico.",
    privacyBefore: "Al enviar este formulario acepta nuestra ",
    privacyLink: "Política de Privacidad y aviso de privacidad GLBA",
    privacyAfter: ".",
    honeypot: "Deje este campo vacío",
    submit: "Solicite un presupuesto",
    wait: "Espere un momento...",
    done: "¡Gracias! Hemos recibido su envío.",
    fail: "Vaya, algo salió mal al enviar el formulario.",
  },

  errores: {
    metodo: "Método no permitido.",
    grande: "El mensaje es demasiado grande.",
    grandePeticion: "La petición es demasiado grande.",
    adjunto: "Este formulario no acepta archivos adjuntos. Envíe solo texto.",
    adjuntoBreve: "Este formulario no acepta archivos adjuntos.",
    rapido: "El envío llegó demasiado rápido. Inténtelo de nuevo.",
    demasiados: "Demasiados envíos desde esta conexión. Inténtelo de nuevo en unos minutos.",
    nombre: "Escriba su nombre.",
    email: "Escriba un correo electrónico válido.",
    telefono: "Escriba un teléfono válido.",
    mensajeLargo: "El mensaje está limitado a 5000 caracteres.",
    captcha: "La verificación falló. Inténtelo de nuevo.",
    guardarLead: "No pudimos guardar su solicitud. Llámenos al {telefono}.",
    guardarBoletin: "No pudimos guardar su suscripción. Llámenos al {telefono}.",
    pii:
      "Por su seguridad, no incluya números de Seguro Social (SSN), ITIN, EIN, " +
      "cuenta bancaria o tarjeta en este formulario. Quítelos y envíe el mensaje de nuevo. " +
      "Para darnos esos números, llámenos al {telefono}.",
  },

  home: {
    heroTitle: "Enrolled Agents y CPAs en Coral Springs, FL — Impuestos, contabilidad y representación ante el IRS",
    heroIntro:
      "Impuestos y contabilidad en inglés y español en Coral Springs, FL, para personas y dueños de negocio de Broward y para quienes declaran desde el extranjero.",
    heroCta: "Reserve una consulta",
    heroAlt:
      "Declaraciones de impuestos en blanco Form 1040 y Form 1120 del IRS sobre un escritorio blanco, junto a un bolígrafo, unas gafas de lectura y una calculadora.",
    aboutTitle: "Enrolled Agents del IRS y Certified Public Accountants en Coral Springs, FL",
    aboutHtml:
      "En Accounting Max Services, nuestro equipo está formado por Enrolled Agents (EAs) autorizados a ejercer ante el IRS y Certified Public Accountants (CPAs), con el máximo nivel de experiencia fiscal y de apoyo en el cumplimiento de sus obligaciones.<br />Ofrecemos una gama completa de <strong>soluciones globales de impuestos y contabilidad</strong>, para personas y empresas de Coral Springs, FL, y de todo el mundo. Ya sea que maneje finanzas transfronterizas, dirija un negocio en EE. UU. o enfrente asuntos fiscales internacionales complejos, nuestros especialistas le dan orientación precisa y personalizada en cada paso.",
    aboutCta: "Conozca más sobre nosotros",
    // Titulo real del video en YouTube: obra de un tercero, no se traduce.
    videoTitulo: "What Is a Financial Advisor?",
    videoCta: "Reproducir el vídeo: {titulo}",
    featuresAlt: [
      "Aplicación de mensajería con una conversación de cliente, con recuadros de dos asesores atendiendo llamadas con auriculares y un botón para reservar una llamada.",
      "Panel de contabilidad que muestra los ingresos por ventas y un desglose de los principales gastos por categoría, revisado por un asesor en una tableta.",
      "Panel de contabilidad con ingresos totales, gastos totales y utilidad neta junto a una gráfica mensual de ingresos y utilidad.",
    ],
  },

  reviews: {
    title: "Lo que dicen nuestros clientes sobre nosotros",
    text: "Los dueños de pequeños negocios de todo el país confían en Accounting Max Services por sus resultados. Descubra cómo hemos ayudado a otras empresas a tener éxito: lea las historias de nuestros clientes.",
    prev: "Testimonios anteriores",
    next: "Testimonios siguientes",
    grupo: "Testimonios de clientes",
    googleAltPortada: "Icono de reseñas de Google",
    googleAltServicio: "Google Reviews",
    // La cifra se copia tal cual; solo se traduce la formula que la rodea.
    ranking: "5.0 de calificación en reseñas de Google",
    publicado: "Publicado en Google",
  },

  features: {
    title: "¿Qué puede esperar de Accounting Max Services?",
    text: "En Accounting Max Services damos prioridad a un servicio excepcional para nuestros clientes, con soluciones financieras y fiscales personalizadas. Al trabajar con nosotros, puede esperar orientación experta, comunicación transparente y un compromiso con su éxito financiero.",
    items: [
      {
        title: "Atención experta uno a uno",
        html: "Creemos en construir relaciones sólidas y duraderas con nuestros clientes. Con <strong>atención experta uno a uno</strong>, tendrá acceso directo a profesionales con experiencia que entienden sus necesidades financieras particulares. Ya sea empresario o particular, trabajaremos estrechamente con usted para resolver todas sus preguntas y cumplir sus objetivos con precisión. Nuestro enfoque personalizado hace que nunca se sienta perdido en el proceso: siempre estará en buenas manos.",
      },
      {
        title: "Informes financieros sólidos",
        html: "Nuestros servicios de <strong>informes financieros</strong> le ofrecen información detallada y precisa sobre la salud de su negocio o de sus finanzas personales. Preparamos <strong>estados financieros personalizados</strong> —como estados de resultados, balances generales e informes de flujo de caja— que le ayudan a tomar decisiones informadas. Con nuestros <strong>informes financieros sólidos</strong>, entenderá con claridad su posición financiera y tendrá las herramientas para planificar con eficacia, conseguir financiación y hacer crecer su negocio con confianza.",
      },
      {
        title: "La temporada de impuestos, sin el estrés",
        html: "La temporada de impuestos puede ser abrumadora, pero con Accounting Max Services no tiene por qué serlo. Nos ocupamos de cada parte de la <strong>preparación de impuestos</strong> —desde reunir sus documentos hasta presentar sus declaraciones— para que usted pueda estar tranquilo. Nuestro objetivo es que el proceso sea lo más fluido y libre de estrés posible, y que sus impuestos se presenten con exactitud, a tiempo y con el máximo reembolso o la menor deuda posible. Con nuestro equipo a su lado, no volverá a preocuparse por la temporada de impuestos.",
      },
    ],
  },

  cta: {
    title: "¡Agende hoy su llamada de consulta gratuita!",
    text: "¡Dé el primer paso hacia una contabilidad sin estrés! Agende ahora su llamada de consulta gratuita de 30 minutos y reciba asesoría a la medida para su pequeño negocio.",
    button: "Reserve una consulta",
  },

  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        // Primera persona: es la pregunta del visitante, igual que en EN.
        q: "1. ¿Qué documentos necesito para presentar mis impuestos personales?",
        a: "Para presentar sus impuestos personales normalmente necesitará sus formularios W-2 o 1099, una identificación, su número de Seguro Social y los registros de deducciones, créditos o ingresos. Le guiamos por la lista completa.",
      },
      {
        q: "2. ¿Cuánto tarda en obtenerse mi EIN o mi ITIN?",
        a: "Los EIN suelen tramitarse en 1–2 días hábiles. Los ITIN pueden tardar algunas semanas, según los tiempos de procesamiento del IRS. Nosotros nos encargamos del papeleo para evitar retrasos.",
      },
      {
        q: "3. ¿Ofrecen servicios en español?",
        a: "¡Sí! Todos nuestros servicios están disponibles en inglés y en español. Nos enorgullece atender a la comunidad hispana con apoyo bilingüe.",
      },
      {
        q: "4. ¿Pueden ayudarme con auditorías o cartas del IRS?",
        a: "Por supuesto. Nuestro equipo cuenta con Enrolled Agents autorizados a ejercer ante el IRS, que le representan directamente ante el IRS para resolver auditorías, cartas o disputas.",
      },
      {
        q: "5. ¿Solo atienden a clientes en Coral Springs?",
        a: "No. Aunque estamos en Coral Springs, FL, atendemos a clientes de todo el país mediante consultas en línea seguras y portales de documentos.",
      },
    ],
  },

  about: {
    title: "Expertos de confianza en impuestos y contabilidad en Coral Springs",
    heroAlt:
      "Vista aérea del edificio de oficinas de tres plantas, con tejado de teja y toldos color verde azulado, en 1700 N University Drive, Coral Springs, Florida",
    introHtml:
      "En Accounting Max Services ofrecemos soluciones expertas de impuestos y contabilidad para personas y empresas de todo EE. UU. y del extranjero. Como Enrolled Agents autorizados a ejercer ante el IRS y CPAs, nuestra misión es prestar servicios financieros precisos, puntuales y personalizados para ayudarle a cumplir con sus obligaciones y a crecer con confianza. Fundada en 2009 y con sede en <strong>Coral Springs, Florida</strong>, nuestro equipo aporta más de 17 años de experiencia profesional acumulada, desde la preparación de impuestos y la constitución de empresas hasta la contabilidad, la representación ante el IRS y la asistencia en auditorías. Todos nuestros servicios están disponibles en <strong>inglés y español</strong>, para que la claridad financiera esté al alcance de todos. Ya sea empresario, trabajador independiente o cliente internacional, estamos aquí para ayudarle a entender leyes fiscales complejas y a alcanzar tranquilidad financiera.",
    features: [
      {
        title: "Experiencia certificada",
        lead: "Enrolled Agents del IRS y CPAs a su servicio. ",
        text: "Nuestro equipo tiene las credenciales más altas del sector, para que reciba orientación fiscal y contable profesional, actualizada y conforme a la normativa.",
      },
      {
        title: "Atención bilingüe",
        lead: "Inglés o español: su idioma, su elección. ",
        text: "Atendemos con orgullo a una clientela diversa, con servicios financieros personalizados disponibles en inglés y en español para una comunicación clara y con confianza.",
      },
      {
        title: "Servicios financieros completos",
        lead: "Un solo aliado de confianza para todas sus necesidades financieras. ",
        text: "Desde la preparación de impuestos y la contabilidad hasta las auditorías y la constitución de empresas, ofrecemos soluciones de principio a fin para personas y empresas, locales e internacionales.",
      },
      {
        title: "Atención personalizada",
        lead: "Tratamos sus finanzas como si fueran nuestras. ",
        text: "Cada cliente recibe apoyo a la medida, respuestas rápidas y una explicación clara de cada paso, para que nunca se quede a oscuras.",
      },
    ],
    missionTitle: "Nuestra misión",
    missionText:
      "En Accounting Max Services, nuestra misión es dar a las personas y a las empresas soluciones de impuestos y contabilidad fiables, precisas y accesibles. Nos comprometemos a ofrecer orientación experta con integridad, profesionalidad y atención personalizada, para que nuestros clientes cumplan con sus obligaciones, tomen decisiones informadas y alcancen tranquilidad financiera. Como Enrolled Agents autorizados a ejercer ante el IRS y CPAs, atendemos con orgullo a una comunidad diversa con apoyo bilingüe, y construimos relaciones a largo plazo basadas en la confianza, la transparencia y los resultados.",
    missionAlt:
      "Una mano coloca un dardo en el centro de una diana apoyada sobre gráficas impresas, junto a una computadora portátil",
    visionTitle: "Nuestra visión",
    visionText:
      "Ser un despacho bilingüe de impuestos y contabilidad de referencia, reconocido por su excelencia, su confianza y su innovación, que ayude a personas y empresas de EE. UU. y de fuera a prosperar financieramente mediante un servicio experto, ético y personalizado.",
    visionAlt:
      "Una persona de pie ante un ventanal de oficina de suelo a techo mira la silueta de la ciudad, con unas gafas y unos documentos sobre el escritorio en primer plano",
    cta: "Reserve una consulta",
  },

  contact: {
    title: "Contacte con nuestros expertos en impuestos y contabilidad en Coral Springs, FL",
    intro:
      "¿Tiene preguntas sobre sus impuestos, su negocio o sus finanzas? Nuestro equipo experto está listo para ayudarle: bilingüe, atento y siempre a un mensaje de distancia.",
    telefonoLabel: "¡Hablemos!",
    emailLabel: "¡Escríbanos!",
    direccionLabel: "¡Visítenos!",
    horarioLabel: "Horario de atención",
  },

  blog: {
    title: "Ideas, consejos y novedades de Accounting Max Services",
    intro:
      "Manténgase informado con artículos expertos sobre impuestos, contabilidad y estrategia financiera. Desde novedades del IRS hasta consejos para pequeños negocios, nuestro blog le ayuda a tomar mejores decisiones durante todo el año.",
    readMore: "Leer más",
    readMoreSobre: " sobre {titulo}",
    pendienteResumen: "{{PENDIENTE}} resumen del artículo",
  },

  post: {
    promoTitle: "📅 ¡Agende hoy su consulta gratuita!",
    promoText:
      "Reciba una consulta gratuita con nuestros Enrolled Agents autorizados a ejercer ante el IRS y nuestros CPAs. Revisaremos sus necesidades y le daremos orientación experta con un presupuesto personalizado, sin ningún compromiso.",
    promoCta: "Reserve una consulta",
    destacadosTitle: "Artículos destacados",
    asideLabel: "Más de Accounting Max Services",
    heroAltFallback: "Ilustración del artículo “{titulo}”",
    pendienteResumen: "{{PENDIENTE}} resumen del artículo",
  },

  service: {
    heroCta: "Reserve una consulta",
    sidebarTitle: "soluciones financieras globales",
    pendienteIntro: "{{PENDIENTE}} intro del servicio",
    pendienteCuerpo: "{{PENDIENTE}} cuerpo del servicio",
    featuresAlt: [
      "Ilustración de una ventana de chat con un botón para reservar una llamada y los retratos de dos personas hablando por teléfono.",
      "Ilustración de un panel de contabilidad que muestra un resumen de ingresos por ventas y un desglose de los principales gastos.",
      "Ilustración de un panel de contabilidad con tarjetas de ingresos, gastos y utilidad neta, y una gráfica de tendencia mensual.",
    ],
  },

  common: {
    idiomaLabel: "Idioma",
    idiomaEn: "English",
    idiomaEs: "Español",
  },
};

// ---------------------------------------------------------------------------

export const T = { en: EN, es: ES } as const;

export type Lang = keyof typeof T;

/** Las dos lenguas del sitio, en orden. Util para hreflang y para el selector. */
export const IDIOMAS = ["en", "es"] as const;

/**
 * El espanol esta publicado: el selector de idioma se pinta en las 54 rutas.
 *
 * D3 quedo firmado el 2026-07-31 y con el las CUATRO cosas que iban juntas o
 * ninguna: sin noindex, dentro del sitemap, hreflang reciproco en las dos
 * direcciones (BaseLayout.astro) y `Disallow: /es/` borrado de robots.txt. El
 * detalle esta en DECISIONS.md D3 y D13.
 *
 * La constante se conserva porque sigue siendo el interruptor: ponerla en
 * `false` esconde el selector, pero YA NO despublica nada — las 26 rutas /es
 * quedan indexables y en el sitemap. Dar marcha atras de verdad son las cuatro
 * cosas al reves, otra vez juntas.
 */
export const ES_PUBLICO = true;

/** `es` solo si la ruta empieza por /es; todo lo demas es `en`. */
export const idiomaDeRuta = (pathname: string): Lang =>
  pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";

/** Atajo: `t("es").nav.home`. */
export const t = (lang: Lang): Cadenas => T[lang];

/**
 * Sustituye los marcadores {clave} de una cadena.
 *
 *   interpola(t(lang).errores.guardarLead, { telefono: NEGOCIO.telefono })
 *
 * Los valores NO se traducen: son NAP (telefono, nombre del negocio) o dato del
 * CMS (titulo del post). Un marcador sin valor se deja tal cual, a la vista, en
 * vez de dejar un hueco silencioso.
 */
export const interpola = (cadena: string, valores: Record<string, string>): string =>
  cadena.replace(/\{(\w+)\}/g, (todo, clave: string) => valores[clave] ?? todo);
