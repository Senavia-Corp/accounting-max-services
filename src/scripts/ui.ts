/**
 * Sustituto de jQuery 3.5.1 + webflow.js (211 KB) + Splide desde unpkg.
 *
 * Solo cuatro comportamientos, cero dependencias:
 *   1. hamburguesa (<992px)
 *   2. desplegable de servicios del menu
 *   3. acordeon de FAQ
 *   4. carrusel de testimonios
 *
 * Todo es mejora progresiva: sin este fichero el sitio sigue siendo navegable.
 * El acordeon queda abierto (se lee todo) y el carrusel se desplaza a mano
 * porque .splide-track lleva overflow-x:auto en site.css.
 *
 * Lo carga Nav.astro, que esta en las 26 rutas.
 */

const MOVIL = window.matchMedia("(max-width: 991px)");

/**
 * Los elementos que de verdad pueden recibir foco dentro de `raiz`.
 * getClientRects() descarta lo que esta en display:none — que aqui es
 * justo lo que hay que descartar: el nivel 1 del cajon cuando se ve el 2, el
 * submenu cerrado, y en escritorio el boton de telefono y el de volver.
 */
const FOCO = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const focos = (raiz: HTMLElement): HTMLElement[] =>
  Array.from(raiz.querySelectorAll<HTMLElement>(FOCO)).filter(
    (el) => el.getClientRects().length > 0,
  );

/* ------------------------------------------------------------------ 1 y 2 --
 * Menu: hamburguesa + desplegable de servicios.
 * En produccion los dos eran <div> sin rol, sin foco y sin teclado. Aqui son
 * <button> (los emite Nav.astro) y esto solo gestiona estado y foco.
 * -------------------------------------------------------------------------*/
function iniciarMenu() {
  const navbar = document.querySelector<HTMLElement>(".navbar");
  if (!navbar) return;

  const hamburguesa = navbar.querySelector<HTMLButtonElement>("button.menu-button");
  // El selector de idioma entra por aqui: ensanchar este selector es TODO lo que
  // cuesta darle click, ArrowDown, Escape con devolucion de foco, exclusion mutua
  // con el desplegable de Services, click fuera, focusout y la trampa de Tab.
  // Reusar en vez de duplicar; el resto de la funcion no distingue cual es cual.
  const toggles = Array.from(
    navbar.querySelectorAll<HTMLButtonElement>("button.w-dropdown-toggle, button.selector-idioma"),
  );

  const cajon = navbar.querySelector<HTMLElement>(".block-items-menu");

  const lista = (t: HTMLElement) =>
    document.getElementById(t.getAttribute("aria-controls") ?? "");

  // Solo puede haber un desplegable abierto a la vez (cerrarDesplegables corre
  // antes de cada apertura), asi que un unico controlador cubre el listener vivo.
  let cierreScroll: AbortController | null = null;

  const desplegar = (t: HTMLElement, abierto: boolean) => {
    t.setAttribute("aria-expanded", String(abierto));
    t.classList.toggle("w--open", abierto);
    // .dropdown-list.w--open ya existe en el CSS portado: display:flex.
    lista(t)?.classList.toggle("w--open", abierto);
    // En movil el desplegable no se anida: ocupa el cajon entero como segundo
    // nivel. Doce enlaces planos son una lista, no una navegacion. En
    // escritorio data-nivel no lo lee nadie, asi que se deja siempre en 1.
    // El selector de idioma comparte toda esta maquinaria, pero NO es el submenu
    // de servicios: si pusiera nivel 2 secuestraria el segundo nivel del cajon.
    if (cajon && !t.classList.contains("selector-idioma"))
      cajon.dataset.nivel = abierto && MOVIL.matches ? "2" : "1";
    // Cerrar al hacer scroll, SOLO en escritorio. Desplazar DENTRO del panel no
    // lo dispara (los eventos de scroll de un elemento no burbujean, y
    // overscroll-behavior:contain corta el encadenado) — pero eso solo cubre el
    // scroll DEL USUARIO. En un telefono real el navegador emite `scroll` en
    // window por su cuenta, sin que nadie desplace nada: la barra de direcciones
    // que se contrae al tocar, el rebote de iOS, el viewport que se reasienta
    // cuando el cromo se asienta tras el toque. Cualquiera de esos llega justo
    // detras del click sintetizado y cerraba el submenu en el mismo frame en que
    // se abria — se percibia como "no funciona", y en escritorio no se reproduce
    // porque ahi no hay barra de direcciones que se mueva. Ademas en movil no
    // hay nada que cerrar al desplazar: el cajon es fixed y la pagina esta en
    // overflow:hidden.
    // El AbortController lo retira AL CERRAR, no solo al dispararse: `once` solo
    // lo quita cuando el evento LLEGA, asi que abrir/cerrar/abrir dejaba
    // listeners vivos acumulados y el fallo empeoraba con cada intento.
    cierreScroll?.abort();
    cierreScroll = null;
    if (abierto && !MOVIL.matches) {
      cierreScroll = new AbortController();
      addEventListener("scroll", () => cerrarDesplegables(), {
        passive: true,
        once: true,
        signal: cierreScroll.signal,
      });
    }
  };
  const cerrarDesplegables = () => toggles.forEach((t) => desplegar(t, false));

  const abrirMenu = (abierto: boolean) => {
    if (!hamburguesa) return;
    navbar.dataset.navOpen = String(abierto);
    hamburguesa.setAttribute("aria-expanded", String(abierto));
    hamburguesa.classList.toggle("w--open", abierto);
    // Bloqueo de scroll. La regla html.nav-abierto{overflow:hidden} vive DENTRO
    // del @media(max-width:991px) de site.css, asi que esto no puede tocar
    // escritorio ni aunque la clase se quede pegada. Sin el, la pagina de
    // detras (11 613px en la portada) se desplaza bajo el dedo.
    document.documentElement.classList.toggle("nav-abierto", abierto);
    // El cajon es fixed y cuelga del cromo (top:var(--menu-alto)): ese top solo
    // es exacto porque .menu esta siempre en y0. Si el header estuviera oculto
    // por (C) al abrirlo, quedaria un hueco por encima. No basta con la guarda
    // de "no ocultar mientras esta abierto": hay que devolverlo a la vista.
    if (abierto) navbar.closest<HTMLElement>(".menu")?.setAttribute("data-direccion", "visible");
    if (!abierto) cerrarDesplegables();
  };

  hamburguesa?.addEventListener("click", () => {
    const abrir = hamburguesa.getAttribute("aria-expanded") !== "true";
    abrirMenu(abrir);
    // El cajon es position:fixed y tapa la pagina entera: si el foco se queda
    // en la hamburguesa, lo que hay debajo sigue siendo tabulable a ciegas.
    if (abrir && cajon) focos(cajon)[0]?.focus();
  });

  // Vuelta al nivel 1 desde el listado de servicios.
  navbar.querySelectorAll<HTMLButtonElement>("button.nav-volver").forEach((b) => {
    b.addEventListener("click", () => {
      const abierto = toggles.find((t) => t.getAttribute("aria-expanded") === "true");
      cerrarDesplegables();
      abierto?.focus();
    });
  });

  toggles.forEach((t) => {
    t.addEventListener("click", () => {
      const abierto = t.getAttribute("aria-expanded") === "true";
      cerrarDesplegables();
      desplegar(t, !abierto);
    });

    // Flecha abajo abre y entra al submenu (patron disclosure de la APG).
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown") return;
      e.preventDefault();
      desplegar(t, true);
      lista(t)?.querySelector<HTMLAnchorElement>("a")?.focus();
    });
  });

  navbar.addEventListener("keydown", (e) => {
    // Escape cierra lo mas interior primero y devuelve el foco a quien abrio.
    if (e.key === "Escape") {
      const abierto = toggles.find((t) => t.getAttribute("aria-expanded") === "true");
      if (abierto) {
        cerrarDesplegables();
        abierto.focus();
        return;
      }
      if (navbar.dataset.navOpen === "true") {
        abrirMenu(false);
        hamburguesa?.focus();
      }
      return;
    }

    // Trampa de foco, SOLO con el cajon abierto. El cajon tapa la pagina entera:
    // salir tabulando seria tabular a ciegas por 11 613px de contenido invisible.
    // El limite es .navbar ENTERA (marca + telefono + hamburguesa + cajon), no
    // solo el cajon, para que la hamburguesa quede siempre a un Shift+Tab.
    if (e.key !== "Tab" || navbar.dataset.navOpen !== "true") return;
    const f = focos(navbar);
    if (f.length === 0) return;
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });

  // Click fuera del menu: se cierra todo.
  document.addEventListener("click", (e) => {
    if (navbar.contains(e.target as Node)) return;
    cerrarDesplegables();
    abrirMenu(false);
  });

  // Tabular fuera del menu tambien lo cierra. Se mira relatedTarget — A DONDE VA
  // el foco — y no document.activeElement tras un tick.
  //
  // relatedTarget null significa que el foco no va a ninguna parte, y eso NO es
  // "salir del menu": es justo lo que hace iOS Safari al tocar un <button>, que
  // no lo enfoca y ademas desenfoca lo que hubiera. Leyendo activeElement daba
  // <body>, o sea "fuera de la navbar", y el cajon entero se cerraba en el mismo
  // toque que abria Services; el submenu abria despues, ya oculto. Se veia como
  // "toco Services y no pasa nada". Reproducido en navegador con el foco del
  // sistema puesto: sin foco real el evento ni siquiera se emite, que es por lo
  // que un emulador no lo enseña.
  //
  // Salir con el raton a una zona no enfocable tambien da null; ese caso ya lo
  // cierra el listener de click de aqui arriba. Y llevarse el foco a otra
  // ventana deja el menu como estaba, que al volver es lo que se espera.
  navbar.addEventListener("focusout", (e) => {
    const destino = e.relatedTarget as Node | null;
    if (!destino || navbar.contains(destino)) return;
    cerrarDesplegables();
    abrirMenu(false);
  });

  toggles.forEach((t) => {
    // Hover-intent, solo escritorio: ~100ms al abrir y ~250ms al cerrar, para
    // que no parpadee cuando el puntero solo pasa de camino a otro sitio.
    let reloj = 0;
    const tras = (ms: number, abrir: boolean) => {
      clearTimeout(reloj);
      reloj = window.setTimeout(() => {
        if (MOVIL.matches) return;
        cerrarDesplegables();
        if (abrir) desplegar(t, true);
      }, ms);
    };
    t.parentElement?.addEventListener("pointerenter", () => tras(100, true));
    t.parentElement?.addEventListener("pointerleave", () => tras(250, false));

    // Flechas y Home/End dentro del panel. Escape, Tab y el ArrowDown que entra
    // desde el disparador ya estan resueltos mas arriba.
    lista(t)?.addEventListener("keydown", (e) => {
      const f = focos(lista(t)!).filter((x) => x.tagName === "A");
      const i = f.indexOf(document.activeElement as HTMLElement);
      const salto: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: f.length - 1 };
      if (!(e.key in salto) || !f.length) return;
      e.preventDefault();
      f[Math.max(0, Math.min(f.length - 1, salto[e.key]))]?.focus();
    });
  });

  // Antes esto solo contemplaba movil->escritorio: yendo a MOVIL con el
  // desplegable abierto se quedaban aria-expanded y w--open puestos con
  // data-nivel en "1", o sea la lista plana de 12 enlaces dentro del cajon —
  // justo lo que el nivel 2 existe para evitar. Se cierra en las dos.
  MOVIL.addEventListener("change", (e) => {
    cerrarDesplegables();
    if (!e.matches) abrirMenu(false);
  });
}

/* ---------------------------------------------------------------------- 3 --
 * Acordeon de FAQ.
 *
 * Marcado esperado (lo emite la pagina, no este fichero):
 *   <div class="faq-item">
 *     <button type="button" class="faq-question">
 *       <h3 class="h3 title-faq">...</h3>
 *       <span class="p-m-wrap" aria-hidden="true">
 *         <span class="minus"></span><span class="plus"></span>
 *       </span>
 *     </button>
 *     <div class="faq-answer"><div class="faq-answer-inner">...</div></div>
 *   </div>
 *
 * En produccion el disparador es <a href="#">: si aun llega asi, se le pone
 * role/tabindex y teclado para no dejarlo roto.
 * -------------------------------------------------------------------------*/
function iniciarFaq() {
  document.querySelectorAll<HTMLElement>(".faq-item").forEach((item, i) => {
    const disparador = item.querySelector<HTMLElement>(".faq-question");
    const panel = item.querySelector<HTMLElement>(".faq-answer");
    if (!disparador || !panel) return;

    if (!panel.id) panel.id = `faq-answer-${i + 1}`;
    disparador.setAttribute("aria-controls", panel.id);
    disparador.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    item.dataset.open = "false";

    const esBoton = disparador.tagName === "BUTTON";
    if (!esBoton) {
      disparador.setAttribute("role", "button");
      disparador.setAttribute("tabindex", "0");
    }

    const alternar = () => {
      const abierto = disparador.getAttribute("aria-expanded") === "true";
      disparador.setAttribute("aria-expanded", String(!abierto));
      panel.hidden = abierto;
      // Lo usa site.css para tapar el aspa del + cuando esta abierto.
      item.dataset.open = String(!abierto);
    };

    disparador.addEventListener("click", (e) => {
      e.preventDefault();
      alternar();
    });
    if (!esBoton) {
      disparador.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        alternar();
      });
    }
  });
}

/* ---------------------------------------------------------------------- 4 --
 * Carrusel de testimonios.
 *
 * La pista ya se desplaza sin JS (overflow-x:auto + scroll-snap en site.css).
 * Aqui solo se enganchan las flechas y se hace la pista alcanzable con teclado,
 * que es obligatorio: una zona con scroll que no recibe foco incumple 2.1.1.
 *
 * Marcado esperado: .splide > .splide-track > .splide-list > .splide-slide,
 * con .prev-splide / .next-splide en cualquier ancestro comun.
 * -------------------------------------------------------------------------*/
function iniciarCarrusel() {
  document.querySelectorAll<HTMLElement>(".splide").forEach((raiz) => {
    const pista = raiz.querySelector<HTMLElement>(".splide-track");
    if (!pista) return;

    // Una zona con scroll tiene que poder recibir foco (2.1.1) y, si lo recibe,
    // necesita rol y nombre para no ser un <div> tabulable y mudo.
    pista.tabIndex = 0;
    if (!pista.getAttribute("role")) pista.setAttribute("role", "group");
    if (!pista.getAttribute("aria-label") && !pista.getAttribute("aria-labelledby")) {
      pista.setAttribute("aria-label", "Testimonials");
    }

    // Las flechas viven fuera de .splide (en .wrapper-header-slider): se busca
    // hacia arriba hasta el primer ancestro que las contenga.
    let anterior: HTMLElement | null = null;
    let siguiente: HTMLElement | null = null;
    for (let n: HTMLElement | null = raiz; n && !anterior; n = n.parentElement) {
      anterior = n.querySelector<HTMLElement>(".prev-splide");
      siguiente = n.querySelector<HTMLElement>(".next-splide");
    }
    if (!anterior || !siguiente) return;

    const paso = () => {
      const slide = pista.querySelector<HTMLElement>(".splide-slide");
      return slide ? slide.getBoundingClientRect().width : pista.clientWidth;
    };

    const inhabilitar = (el: HTMLElement, valor: boolean) => {
      if (el instanceof HTMLButtonElement) el.disabled = valor;
      else el.setAttribute("aria-disabled", String(valor));
    };

    const refrescar = () => {
      const tope = pista.scrollWidth - pista.clientWidth - 1;
      inhabilitar(anterior!, pista.scrollLeft <= 0);
      inhabilitar(siguiente!, pista.scrollLeft >= tope);
    };

    const preparar = (el: HTMLElement, direccion: number, etiqueta: string) => {
      // Red de seguridad por si la pagina aun sirve el <div> de Webflow.
      if (!(el instanceof HTMLButtonElement)) {
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          el.click();
        });
      }
      if (!el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) {
        el.setAttribute("aria-label", etiqueta);
      }
      // Desplazamiento seco, sin behavior:"smooth". Verificado en navegador:
      // donde la animacion de scroll esta desactivada, el scroll suave (por JS
      // o por CSS) es un no-op SILENCIOSO y deja el carrusel congelado. Ver la
      // nota de .splide-track en site.css.
      el.addEventListener("click", () => {
        pista.scrollLeft += direccion * paso();
        // Se refresca aqui y no solo desde el evento `scroll`: el estado de las
        // flechas no puede depender de un evento que el navegador quiza no
        // emita para un scroll hecho por codigo.
        refrescar();
      });
    };

    preparar(anterior, -1, "Previous testimonials");
    preparar(siguiente, 1, "Next testimonials");

    pista.addEventListener("scroll", refrescar, { passive: true });
    window.addEventListener("resize", refrescar, { passive: true });
    refrescar();
  });
}

/* ---------------------------------------------------------------------- 5 --
 * El cromo reacciona al scroll (DECISIONS.md D13).
 *   (A) ancho del desplegable, para que no llegue nunca a la cupula
 *   (B) >=992: se condensa al bajar. Sin un solo listener de scroll.
 *   (C) <992: se oculta al bajar y vuelve al subir.
 * El JS solo conmuta atributos y publica medidas; TODO el aspecto es CSS.
 * -------------------------------------------------------------------------*/
function iniciarCromo() {
  const menu = document.querySelector<HTMLElement>(".menu");
  const navbar = menu?.querySelector<HTMLElement>(".navbar");
  const barra = menu?.querySelector<HTMLElement>(".top-bar");
  const marca = menu?.querySelector<HTMLElement>(".brand");
  if (!menu || !navbar || !barra || !marca) return;

  // Todo con offset* y NUNCA con getBoundingClientRect(): el rect devuelve la
  // caja YA transformada, y aqui .menu se traslada y .brand se escala, asi que
  // daria un hueco mas ancho del real y el panel volveria a invadir la cupula.
  const medir = () => {
    // No se escribe 43,75 como constante: .top-bar es el 35% de .menu y alguien
    // puede tocar ese 35% sin que salte nada.
    // Aqui SI vale el rect y no offsetHeight, que redondea a entero y dejaba una
    // astilla de 0,25px: a .menu solo se le aplica translate, y trasladar no
    // cambia la ALTURA de un descendiente. Lo que no vale es el rect para el
    // calculo horizontal de mas abajo, donde .brand si esta escalada.
    menu.style.setProperty("--barra-verde", `${barra.getBoundingClientRect().height}px`);
    if (MOVIL.matches) return;
    // 125/150: la cupula condensada cuelga justo la altura de la barra que
    // acaba de desaparecer.
    if (marca.offsetHeight)
      menu.style.setProperty("--brand-escala", String(menu.offsetHeight / marca.offsetHeight));
    // El hueco hasta la cupula depende del contenedor Y del idioma: el
    // disparador arranca en 83,45 en EN y 78,47 en ES ("Home" != "Inicio").
    const caja = navbar.querySelector<HTMLElement>(".dropdown");
    if (caja)
      menu.style.setProperty(
        "--panel-ancho",
        `${Math.max(260, Math.round(marca.offsetLeft - caja.offsetLeft - 16))}px`,
      );
  };
  medir();
  addEventListener("resize", medir, { passive: true });

  // (B) HISTERESIS: condensa por encima de 88, expande solo por debajo de 24.
  // Con un umbral unico, pararse justo en el limite hace parpadear el header.
  let dentro24 = true;
  let dentro88 = true;
  let estado = menu.dataset.cromo || "expandido";
  let listo = false;
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if ((e.target as HTMLElement).dataset.cromoUmbral === "24") dentro24 = e.isIntersecting;
      else dentro88 = e.isIntersecting;
    }
    // En la banda muerta se mantiene lo que habia, leido de esta variable y no
    // del DOM: un atributo ausente escribiria la cadena "undefined".
    const nuevo = !dentro88 ? "condensado" : dentro24 ? "expandido" : estado;
    if (nuevo !== estado) menu.dataset.cromo = estado = nuevo;
    // La transicion se habilita cuando el estado inicial ya esta asentado: el
    // primer callback llega DESPUES del primer pintado, asi que volver por
    // bfcache con la pagina desplazada animaria 220ms al aterrizar.
    if (!listo) {
      listo = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => menu.setAttribute("data-cromo-listo", "")),
      );
    }
  });
  // No se desconectan en movil: no cuestan nada si nada cruza, y reconectarlos
  // obligaria a esperar un callback asincrono al volver a escritorio.
  document.querySelectorAll(".cromo-centinela").forEach((c) => io.observe(c));

  // (C) Direccional en movil.
  let ultimoY = 0;
  let pedido = false;
  const direccion = () => {
    pedido = false;
    if (!MOVIL.matches) return;
    // Clamp de los dos extremos: el rubber-band de iOS da scrollY negativo
    // arriba y sobredesplazamiento abajo, y ambos fabrican deltas falsos.
    const tope = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const y = Math.min(Math.max(0, scrollY), tope);
    const delta = y - ultimoY;
    if (Math.abs(delta) < 8) return; // sin umbral, el pulso del dedo lo hace vibrar
    ultimoY = y;
    // Las tres condiciones en las que no se oculta jamas.
    const fijo =
      navbar.dataset.navOpen === "true" ||
      menu.contains(document.activeElement) ||
      y <= menu.offsetHeight;
    menu.dataset.direccion = !fijo && delta > 0 ? "oculto" : "visible";
  };
  addEventListener("scroll", () => {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(direccion);
  }, { passive: true });

  // Cruzar los 992 o girar limpia el modo anterior. `data-cromo` no se toca: en
  // movil no lo lee nadie y al volver ya esta en su valor correcto.
  MOVIL.addEventListener("change", () => {
    menu.dataset.direccion = "visible";
    ultimoY = Math.max(0, scrollY);
    medir();
  });
}

const iniciar = () => {
  iniciarMenu();
  iniciarFaq();
  iniciarCarrusel();
  iniciarCromo();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
