// Punto de entrada del servicio: pone a escuchar la app armada en src/app.ts.

// Carga las variables del archivo .env (si existe) antes que cualquier otra cosa.
import "dotenv/config";

import { createApp } from "./app";
import { getDataSource } from "./config/dataSource";
import { getAuthMode } from "./config/auth";
import { describeRealOperations } from "./config/operations";

const PORT = Number(process.env.PORT) || 3000;

// Si falta configuración (por ejemplo variables de Cognito), se muestra el mensaje y se sale.
try {
  const app = createApp();
  const dataSource = getDataSource();
  app.listen(PORT, () => {
    console.log(
      `conversational-agent escuchando en http://localhost:${PORT} (DATA_SOURCE=${dataSource}, AUTH_MODE=${getAuthMode()})`
    );
    if (dataSource !== "mock") console.log(describeRealOperations());
  });
} catch (err) {
  console.error(`No se pudo iniciar: ${(err as Error).message}`);
  process.exit(1);
}
