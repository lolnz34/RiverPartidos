/**
 * API opcional (Node + Express).
 * No es necesaria para usar la app: index.html funciona solo,
 * leyendo data.json directamente. Este servidor es útil si en el
 * futuro se quiere separar el sitio del origen de datos, o servir
 * los datos a otras apps.
 *
 * Uso:
 *   npm install
 *   npm start
 *   -> http://localhost:3000/api/partidos
 *   -> http://localhost:3000/api/partidos?estado=programado
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.static(__dirname)); // sirve también index.html, app.js, etc.

function leerDatos() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

// GET /api/partidos  -> lista completa (soporta ?estado=programado|finalizado)
app.get("/api/partidos", (req, res) => {
  try {
    const data = leerDatos();
    let partidos = data.partidos;

    if (req.query.estado) {
      partidos = partidos.filter((p) => p.estado === req.query.estado);
    }

    res.json({
      equipo: data.equipo,
      actualizado: data.actualizado,
      total: partidos.length,
      partidos
    });
  } catch (err) {
    res.status(500).json({ error: "No se pudieron leer los datos." });
  }
});

// GET /api/partidos/:id -> un partido puntual
app.get("/api/partidos/:id", (req, res) => {
  try {
    const data = leerDatos();
    const partido = data.partidos.find((p) => p.id === req.params.id);
    if (!partido) return res.status(404).json({ error: "Partido no encontrado" });
    res.json(partido);
  } catch (err) {
    res.status(500).json({ error: "No se pudieron leer los datos." });
  }
});

app.listen(PORT, () => {
  console.log(`API de River Plate corriendo en http://localhost:${PORT}/api/partidos`);
});
