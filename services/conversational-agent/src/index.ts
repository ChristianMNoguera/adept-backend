// Punto de entrada del servicio: pone a escuchar la app armada en src/app.ts.

// Carga las variables del archivo .env (si existe) antes que cualquier otra cosa.
import "dotenv/config";

import { createApp } from "./app";
import { DATA_SOURCE } from "./config/dataSource";

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.log(`conversational-agent escuchando en http://localhost:${PORT} (DATA_SOURCE=${DATA_SOURCE})`);
});
