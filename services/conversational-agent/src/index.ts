// Punto de entrada del servicio: pone a escuchar la app armada en src/app.ts.

// Carga las variables del archivo .env (si existe) antes que cualquier otra cosa.
import "dotenv/config";

import { createApp } from "./app";
import { DATA_SOURCE } from "./config/dataSource";
import { getAuthMode } from "./config/auth";

const PORT = Number(process.env.PORT) || 3000;

// Si falta configuración (por ejemplo variables de Cognito), se muestra el mensaje y se sale.
try {
  createApp().listen(PORT, () => {
    console.log(
      `conversational-agent escuchando en http://localhost:${PORT} (DATA_SOURCE=${DATA_SOURCE}, AUTH_MODE=${getAuthMode()})`
    );
  });
} catch (err) {
  console.error(`No se pudo iniciar: ${(err as Error).message}`);
  process.exit(1);
}
