/* =========================================================
   River Plate - Partidos
   app.js
   - Consume data.json como si fuera una API (fetch)
   - Guarda favoritos del usuario en localStorage (persistencia)
   - Filtra partidos (todos / próximos / jugados / favoritos)
   - Registra el service worker y habilita "Instalar app"
   ========================================================= */

const API_URL = "data.json"; // Reemplazar por una URL remota si se aloja la API en otro servidor
const STORAGE_KEY = "river_favoritos";

const state = {
  partidos: [],
  filtro: "todos",
  favoritos: cargarFavoritos()
};

const els = {
  status: document.getElementById("status"),
  list: document.getElementById("matchList"),
  filters: document.getElementById("filters"),
  updatedDate: document.getElementById("updatedDate"),
  template: document.getElementById("matchTemplate"),
  installBtn: document.getElementById("installBtn")
};

init();

async function init() {
  cargarPartidos();
  configurarFiltros();
  configurarServiceWorker();
  configurarInstalacion();
}

/* ---------- Datos (API) ---------- */

async function cargarPartidos() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo obtener la información");
    const data = await res.json();

    state.partidos = ordenarPorFecha(data.partidos || []);
    els.updatedDate.textContent = formatearFecha(data.actualizado) || data.actualizado || "-";

    render();
  } catch (err) {
    console.error(err);
    els.status.textContent =
      "No se pudieron cargar los partidos. Revisá tu conexión e intentá de nuevo.";
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
  const partidos = aplicarFiltro(state.partidos, state.filtro);

  els.list.innerHTML = "";

  if (partidos.length === 0) {
    els.status.hidden = false;
    els.status.textContent = "No hay partidos para mostrar en este filtro.";
    return;
  }

  els.status.hidden = true;

  partidos.forEach((partido) => {
    els.list.appendChild(crearTarjeta(partido));
  });
}

function crearTarjeta(partido) {
  const node = els.template.content.cloneNode(true);
  const card = node.querySelector(".match-card");

  node.querySelector(".competition").textContent =
    `${partido.competicion}${partido.fecha_torneo ? " · " + partido.fecha_torneo : ""}`;
  node.querySelector(".home").textContent = partido.local;
  node.querySelector(".away").textContent = partido.visitante;
  node.querySelector(".date").textContent = formatearFecha(partido.fecha) || partido.fecha;
  node.querySelector(".time").textContent = partido.hora ? `${partido.hora} hs (ARG)` : "A confirmar";
  node.querySelector(".stadium").textContent = partido.estadio || "A confirmar";

  const badge = node.querySelector(".status-badge");
  badge.textContent = partido.estado === "finalizado" ? "Jugado" : "Programado";
  badge.classList.add(partido.estado === "finalizado" ? "finalizado" : "programado");

  renderTags(node.querySelector(".tv-tags"), partido.tv);
  renderTags(node.querySelector(".streaming-tags"), partido.streaming);

  const favBtn = node.querySelector(".fav-btn");
  const esFavorito = state.favoritos.includes(partido.id);
  favBtn.textContent = esFavorito ? "★" : "☆";
  favBtn.classList.toggle("active", esFavorito);
  favBtn.addEventListener("click", () => toggleFavorito(partido.id, favBtn));

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

function aplicarFiltro(partidos, filtro) {
  switch (filtro) {
    case "programado":
      return partidos.filter((p) => p.estado === "programado");
    case "finalizado":
      return partidos.filter((p) => p.estado === "finalizado");
    case "favoritos":
      return partidos.filter((p) => state.favoritos.includes(p.id));
    default:
      return partidos;
  }
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
