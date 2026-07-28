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
  const toggles = Array.from(
    navbar.querySelectorAll<HTMLButtonElement>("button.w-dropdown-toggle"),
  );

  const cajon = navbar.querySelector<HTMLElement>(".block-items-menu");

  const lista = (t: HTMLElement) =>
    document.getElementById(t.getAttribute("aria-controls") ?? "");

  const desplegar = (t: HTMLElement, abierto: boolean) => {
    t.setAttribute("aria-expanded", String(abierto));
    t.classList.toggle("w--open", abierto);
    // .dropdown-list.w--open ya existe en el CSS portado: display:flex.
    lista(t)?.classList.toggle("w--open", abierto);
    // En movil el desplegable no se anida: ocupa el cajon entero como segundo
    // nivel. Doce enlaces planos son una lista, no una navegacion. En
    // escritorio data-nivel no lo lee nadie, asi que se deja siempre en 1.
    if (cajon) cajon.dataset.nivel = abierto && MOVIL.matches ? "2" : "1";
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

  // Tabular fuera del menu tambien lo cierra. El foco tarda un tick en
  // asentarse, de ahi el setTimeout.
  navbar.addEventListener("focusout", () => {
    setTimeout(() => {
      if (navbar.contains(document.activeElement)) return;
      cerrarDesplegables();
      abrirMenu(false);
    }, 0);
  });

  // Al pasar a escritorio el panel movil deja de tener sentido.
  MOVIL.addEventListener("change", (e) => {
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

const iniciar = () => {
  iniciarMenu();
  iniciarFaq();
  iniciarCarrusel();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
