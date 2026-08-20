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

## ⚔️ Clásicos vs Boca

Hay una sección aparte, **"Próximo Clásico vs Boca"**, que muestra únicamente el Superclásico que todavía no se jugó (marcado con `"clasico": true` en `data.json`). Los clásicos ya jugados **no se muestran ahí** — pasan a verse como un partido normal dentro de "Jugados" en Liga Argentina, una vez que cambiás su `estado` a `"finalizado"`.

Para agregar o actualizar el próximo clásico, en `data.json`:

```json
{
  "id": "2026-CLAUSURA-F15-CLASICO",
  "categoria": "liga_argentina",
  "clasico": true,
  "competicion": "Torneo Clausura 2026",
  "fecha_torneo": "Fecha 15 - Superclásico",
  "local": "Boca Juniors",
  "visitante": "River Plate",
  "fecha": "A confirmar",
  "hora": "A confirmar",
  "estadio": "La Bombonera",
  "tv": ["A confirmar"],
  "streaming": ["A confirmar"],
  "estado": "programado",
  "marcador": null,
  "minuto": null
}
```

Apenas la Liga Profesional confirme día y horario, actualizá `fecha`, `hora`, `tv` y `streaming`. Cuando se juegue, cambiá `estado` a `"finalizado"` y completá `marcador` — automáticamente deja de aparecer en la sección de Clásicos.

## 🔴 Resultados en vivo y categorías

La app ya no muestra un listado plano con "todos los partidos". Ahora se organiza así:

- **🔴 En vivo:** aparece arriba de todo, solo cuando hay un partido en curso, con marcador y minuto.
- **🇦🇷 Liga Argentina** y **🌎 Copa Sudamericana:** dos secciones separadas por competencia.
- Chips de arriba (**Próximos y en vivo / Jugados / Favoritos**) filtran dentro de esas categorías, sin mezclar todo en una sola lista.

La app vuelve a consultar `data.json` cada 30 segundos en segundo plano, así que si actualizás el marcador de un partido en vivo, se refleja solo, sin recargar la página.

### Cómo marcar un partido como "en vivo" con marcador

En `data.json`, cambiá el partido correspondiente:

```json
{
  "estado": "en_vivo",
  "marcador": { "local": 1, "visitante": 0 },
  "minuto": "63'"
}
```

Cuando termine, volvé a poner `"estado": "finalizado"` y dejá el `marcador` final.

## 🗃️ Cómo actualizar los partidos

Todos los partidos están en **`data.json`**. Para agregar o modificar uno, edita este bloque:

```json
{
  "id": "2026-08-30-BAN",
  "categoria": "liga_argentina",
  "competicion": "Torneo Clausura 2026",
  "fecha_torneo": "Fecha 7",
  "local": "Banfield",
  "visitante": "River Plate",
  "fecha": "2026-08-30",
  "hora": "15:00",
  "estadio": "Estadio Florencio Sola",
  "tv": ["ESPN Premium"],
  "streaming": ["Flow", "DGO"],
  "estado": "programado",
  "marcador": null,
  "minuto": null
}
```

- `categoria`: `"liga_argentina"` o `"sudamericana"` — define en qué sección aparece.
- `estado`: `"programado"`, `"en_vivo"` o `"finalizado"`.
- `fecha`: formato `YYYY-MM-DD`. Si aún no está confirmada, usar `"A confirmar"`.
- `tv` / `streaming`: listas de texto, podés poner una o varias plataformas.
- `marcador`: `null` o `{ "local": 0, "visitante": 0 }`.
- `minuto`: texto libre como `"63'"`, solo se muestra si `estado` es `"en_vivo"`.

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
