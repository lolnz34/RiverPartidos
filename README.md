# River Plate — Partidos, horarios y plataformas 🔴⚪

App web (PWA) que muestra los próximos partidos de River Plate: rival, fecha, hora, estadio, canal de TV y plataforma de streaming. Se puede instalar como app en el celular o la PC.

## 📁 Estructura del repositorio

```
river-partidos/
├── index.html          # Página principal
├── style.css            # Estilos (responsive, mobile-first)
├── app.js                # Lógica: consume data.json, filtros, favoritos, PWA
├── data.json             # "Base de datos" / API estática con los partidos
├── manifest.json          # Configuración de la app instalable (ícono, nombre, colores)
├── service-worker.js       # Cache offline + instalación
├── server.js               # API opcional en Node/Express (no obligatoria)
├── package.json
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.png
└── README.md
```

## 🚀 Cómo publicarlo (GitHub Pages, gratis)

1. Subí todo el contenido de esta carpeta a un repositorio de GitHub.
2. Andá a **Settings → Pages**.
3. En "Branch" elegí `main` y carpeta `/root`, guardá.
4. En 1-2 minutos tu sitio queda en `https://TU-USUARIO.github.io/TU-REPO/`.
5. Entrá desde el celular o la PC: el navegador va a ofrecer **"Instalar app"** (o aparece el botón *Instalar app* arriba a la derecha).

No necesitás servidor, base de datos ni configurar nada: `index.html` lee directamente `data.json`.

## 📲 Instalación como app

- **Celular (Android/Chrome):** al entrar al sitio aparece el botón "Instalar app", o desde el menú ⋮ → "Agregar a pantalla de inicio".
- **iPhone (Safari):** botón compartir → "Agregar a pantalla de inicio".
- **PC (Chrome/Edge):** ícono de instalación en la barra de direcciones, o el botón "Instalar app" en la web.

Queda con su propio ícono, abre en ventana propia y funciona offline (con los últimos datos guardados en caché).

## 🗃️ Cómo actualizar los partidos

Todos los partidos están en **`data.json`**. Para agregar o modificar uno, edita este bloque:

```json
{
  "id": "2026-08-30-BAN",
  "competicion": "Torneo Clausura 2026",
  "fecha_torneo": "Fecha 7",
  "local": "Banfield",
  "visitante": "River Plate",
  "fecha": "2026-08-30",
  "hora": "15:00",
  "estadio": "Estadio Florencio Sola",
  "tv": ["ESPN Premium"],
  "streaming": ["Flow", "DGO"],
  "estado": "programado"
}
```

- `estado`: `"programado"` o `"finalizado"`.
- `fecha`: formato `YYYY-MM-DD`. Si aún no está confirmada, usar `"A confirmar"`.
- `tv` / `streaming`: listas de texto, podés poner una o varias plataformas.

Los cambios se ven apenas se sube el archivo, sin tocar el resto del código.

## ⭐ Favoritos (guardado de datos)

Cada partido tiene un botón de estrella. Al tocarlo, el partido se guarda como favorito en `localStorage` del navegador (persiste aunque cierres la app), y se puede filtrar con el chip "⭐ Favoritos".

## 🔌 API opcional (Node/Express)

`data.json` ya funciona como una API estática (se puede consumir con `fetch()` desde cualquier lado, incluso alojado en GitHub Pages/raw.githubusercontent.com). Si en cambio querés una API real con endpoints:

```bash
npm install
npm start
```

Endpoints disponibles en `http://localhost:3000`:

- `GET /api/partidos` — todos los partidos
- `GET /api/partidos?estado=programado` — solo los próximos
- `GET /api/partidos/:id` — un partido puntual

## 🛠️ Tecnologías

HTML, CSS y JavaScript puro (sin frameworks ni build). API opcional con Node + Express. Sin dependencias externas para el sitio principal, así que funciona en cualquier hosting estático.
