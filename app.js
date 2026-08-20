/* =========================================================
   River Plate - Partidos
   app.js
   - Consume data.json como si fuera una API (fetch)
   - Agrupa los partidos por categoría: Liga Argentina / Copa Sudamericana
   - Muestra una sección de "En vivo" con marcador y minuto
   - Se actualiza sola cada 30s para reflejar resultados en vivo
   - Guarda favoritos del usuario en localStorage (persistencia)
   - Registra el service worker y habilita "Instalar app"
   ========================================================= */

const API_URL = "data.json"; // Reemplazar por una URL remota si se aloja la API en otro servidor
const STORAGE_KEY = "river_favoritos";
const REFRESH_MS = 30000; // cada cuánto se revisan resultados en vivo

const CATEGORIAS = {
  liga_argentina: { titulo: "Liga Argentina", icono: "🇦🇷" },
  sudamericana: { titulo: "Copa Sudamericana", icono: "🌎" }
};

const state = {
  partidos: [],
  filtro: "proximos", // proximos | jugados | favoritos
  favoritos: cargarFavoritos()
};

const els = {
  status: document.getElementById("status"),
  filters: document.getElementById("filters"),
  updatedDate: document.getElementById("updatedDate"),
  template: document.getElementById("matchTemplate"),
  installBtn: document.getElementById("installBtn"),

  liveSection: document.getElementById("liveSection"),
  liveList: document.getElementById("liveList"),

  clasicoSection: document.getElementById("clasicoSection"),
  clasicoList: document.getElementById("clasicoList"),

  ligaSection: document.getElementById("ligaSection"),
  ligaList: document.getElementById("ligaList"),

  sudamericaSection: document.getElementById("sudamericaSection"),
  sudamericaList: document.getElementById("sudamericaList"),

  favoritosSection: document.getElementById("favoritosSection"),
  favoritosList: document.getElementById("favoritosList")
};

init();

async function init() {
  await cargarPartidos();
  configurarFiltros();
  configurarServiceWorker();
  configurarInstalacion();

  // Actualización automática de resultados en vivo, sin recargar la página
  setInterval(cargarPartidos, REFRESH_MS);
}

/* ---------- Datos (API) ---------- */

async function cargarPartidos() {
  try {
    const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo obtener la información");
    const data = await res.json();

    state.partidos = ordenarPorFecha(data.partidos || []);
    els.updatedDate.textContent = formatearFecha(data.actualizado) || data.actualizado || "-";

    render();
  } catch (err) {
    console.error(err);
    if (!state.partidos.length) {
      els.status.hidden = false;
      els.status.textContent =
        "No se pudieron cargar los partidos. Revisá tu conexión e intentá de nuevo.";
    }
  }
}

function ordenarPorFecha(partidos) {
  return [...partidos].sort((a, b) => {
    const fa = a.fecha === "A confirmar" ? "9999-99-99" : a.fecha;
    const fb = b.fecha === "A confirmar" ? "9999-99-99" : b.fecha;
    return fa.localeCompare(fb);
  });
}

/* ---------- Render ---------- */

function render() {
  els.status.hidden = true;

  const enVivo = state.partidos.filter((p) => p.estado === "en_vivo");
  renderGrupo(els.liveList, enVivo);
  els.liveSection.hidden = enVivo.length === 0;

  // Clásicos vs Boca: solo los que todavía no se jugaron, nunca los anteriores
  const clasicos = state.partidos.filter((p) => p.clasico && p.estado !== "finalizado");
  renderGrupo(els.clasicoList, clasicos, { esClasico: true });
  els.clasicoSection.hidden = clasicos.length === 0;

  if (state.filtro === "favoritos") {
    mostrarSolo("favoritos");
    const favoritos = state.partidos.filter((p) => state.favoritos.includes(p.id));
    renderGrupo(els.favoritosList, favoritos);
    toggleVacio("favoritos", favoritos.length === 0);
    return;
  }

  mostrarSolo("categorias");

  const filtroEstado = state.filtro === "jugados" ? "finalizado" : null;

  const liga = filtrarPorCategoriaYEstado("liga_argentina", filtroEstado, enVivo.length > 0);
  const sudamerica = filtrarPorCategoriaYEstado("sudamericana", filtroEstado, enVivo.length > 0);

  renderGrupo(els.ligaList, liga);
  renderGrupo(els.sudamericaList, sudamerica);

  toggleVacio("liga", liga.length === 0);
  toggleVacio("sudamericana", sudamerica.length === 0);
}

function filtrarPorCategoriaYEstado(categoria, estadoExacto, hayEnVivo) {
  return state.partidos.filter((p) => {
    if (p.categoria !== categoria) return false;
    if (p.estado === "en_vivo") return false; // ya se muestra arriba, en la sección "En vivo"
    if (p.clasico && p.estado !== "finalizado") return false; // ya se muestra en "Próximo Clásico"
    if (estadoExacto) return p.estado === estadoExacto;
    return p.estado === "programado"; // vista "Próximos y en vivo" -> acá solo próximos
  });
}

function mostrarSolo(modo) {
  const categorias = modo === "categorias";
  els.ligaSection.hidden = !categorias;
  els.sudamericaSection.hidden = !categorias;
  els.favoritosSection.hidden = categorias;
}

function toggleVacio(clave, esVacio) {
  const msg = document.querySelector(`[data-empty-for="${clave}"]`);
  if (msg) msg.hidden = !esVacio;
}

function renderGrupo(container, partidos, opciones) {
  container.innerHTML = "";
  partidos.forEach((partido) => container.appendChild(crearTarjeta(partido, opciones)));
}

function crearTarjeta(partido, opciones) {
  const node = els.template.content.cloneNode(true);

  const catInfo = CATEGORIAS[partido.categoria];
  node.querySelector(".competition").textContent =
    `${catInfo ? catInfo.icono + " " : ""}${partido.competicion}${partido.fecha_torneo ? " · " + partido.fecha_torneo : ""}`;

  node.querySelector(".home").textContent = partido.local;
  node.querySelector(".away").textContent = partido.visitante;
  node.querySelector(".date").textContent = formatearFecha(partido.fecha) || partido.fecha;
  node.querySelector(".time").textContent = partido.hora && partido.hora !== "A confirmar" ? `${partido.hora} hs (ARG)` : "A confirmar";
  node.querySelector(".stadium").textContent = partido.estadio || "A confirmar";

  const scoreEl = node.querySelector(".score");
  if (partido.marcador) {
    scoreEl.textContent = `${partido.marcador.local} - ${partido.marcador.visitante}`;
  } else {
    scoreEl.textContent = "vs";
  }

  const minutoEl = node.querySelector(".live-minute");
  if (partido.estado === "en_vivo" && partido.minuto) {
    minutoEl.textContent = `⏱️ ${partido.minuto}`;
    minutoEl.hidden = false;
  }

  const badge = node.querySelector(".status-badge");
  if (partido.estado === "en_vivo") {
    badge.textContent = "En vivo";
    badge.classList.add("en-vivo");
  } else if (partido.estado === "finalizado") {
    badge.textContent = "Jugado";
    badge.classList.add("finalizado");
  } else {
    badge.textContent = "Programado";
    badge.classList.add("programado");
  }

  renderTags(node.querySelector(".tv-tags"), partido.tv);
  renderTags(node.querySelector(".streaming-tags"), partido.streaming);

  const favBtn = node.querySelector(".fav-btn");
  const esFavorito = state.favoritos.includes(partido.id);
  favBtn.textContent = esFavorito ? "★" : "☆";
  favBtn.classList.toggle("active", esFavorito);
  favBtn.addEventListener("click", () => toggleFavorito(partido.id, favBtn));

  const card = node.querySelector(".match-card");
  if (partido.estado === "en_vivo") card.classList.add("card-en-vivo");
  if (partido.clasico) card.classList.add("card-clasico");

  return node;
}

function renderTags(container, items) {
  container.innerHTML = "";
  (items && items.length ? items : ["A confirmar"]).forEach((item) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = item;
    container.appendChild(span);
  });
}

/* ---------- Filtros ---------- */

function configurarFiltros() {
  els.filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;

    els.filters.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");

    state.filtro = btn.dataset.filter;
    render();
  });
}

/* ---------- Favoritos (persistencia con localStorage) ---------- */

function cargarFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarFavoritos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favoritos));
}

function toggleFavorito(id, btn) {
  const idx = state.favoritos.indexOf(id);
  if (idx >= 0) {
    state.favoritos.splice(idx, 1);
    btn.textContent = "☆";
    btn.classList.remove("active");
  } else {
    state.favoritos.push(id);
    btn.textContent = "★";
    btn.classList.add("active");
  }
  guardarFavoritos();

  if (state.filtro === "favoritos") render();
}

/* ---------- Utilidades ---------- */

function formatearFecha(fechaISO) {
  if (!fechaISO || fechaISO === "A confirmar") return null;
  const [y, m, d] = fechaISO.split("-");
  if (!y || !m || !d) return fechaISO;
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const fecha = new Date(Number(y), Number(m) - 1, Number(d));
  return `${dias[fecha.getDay()]} ${d}/${m}/${y}`;
}

/* ---------- PWA: Service Worker ---------- */

function configurarServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .catch((err) => console.warn("Service worker no registrado:", err));
    });
  }
}

/* ---------- PWA: botón de instalación ---------- */

let deferredPrompt = null;

function configurarInstalacion() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    els.installBtn.hidden = false;
  });

  els.installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    els.installBtn.hidden = true;
  });
}
