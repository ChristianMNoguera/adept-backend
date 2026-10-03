// Punto de entrada del servicio: crea el servidor web y lo pone a escuchar.

// Carga las variables del archivo .env (si existe) antes que cualquier otra cosa.
import "dotenv/config";

import express from "express";
import { sessionsRouter } from "./routes/sessions";
import { DATA_SOURCE } from "./config/dataSource";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Permite leer cuerpos de pedidos en formato JSON (req.body).
app.use(express.json());

// Chequeo de salud: sirve para confirmar rápidamente que el servidor está vivo.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Rutas de sesiones (ver src/routes/sessions.ts).
app.use(sessionsRouter);

app.listen(PORT, () => {
  console.log(`conversational-agent escuchando en http://localhost:${PORT} (DATA_SOURCE=${DATA_SOURCE})`);
});
