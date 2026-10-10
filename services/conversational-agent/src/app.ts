// Arma la app Express (middlewares + rutas), pero NO la pone a escuchar.
// Así la misma app se puede usar con listen() (src/index.ts) o envuelta en una
// función Lambda (src/lambda.ts) sin tocar su lógica.

import fs from "fs";
import path from "path";
import express, { Router } from "express";
import * as OpenApiValidator from "express-openapi-validator";

import { createCors } from "./config/cors";
import { getAuthMode } from "./config/auth";
import { getDataSource } from "./config/dataSource";
import { AppDeps, createDefaultDeps } from "./deps";
import { mockAuth } from "./middleware/mockAuth";
import { cognitoAuth, createCognitoVerifier, TokenVerifier } from "./middleware/cognitoAuth";
import { requireRole } from "./middleware/requireRole";
import { notFoundId } from "./middleware/notFoundId";
import { notImplementedWhenReal } from "./middleware/notImplemented";
import { dataSourceSwitch } from "./middleware/dataSourceSwitch";
import { errorHandler } from "./middleware/errorHandler";

// Rutas mock (datos fijos del contrato).
import { meRouter } from "./routes/me";
import { linksRouter } from "./routes/links";
import { privacyRouter } from "./routes/privacy";
import { sessionsRouter } from "./routes/sessions";
import { professionalRouter } from "./routes/professional";
import { alertsRouter } from "./routes/alerts";
// Rutas con lógica real (se usan en los modos hybrid y real).
import { createRealRouter } from "./routes/real";

// El contrato es la fuente de verdad (ADR-0003). Por defecto se lee desde el repo
// (3 niveles arriba de src/ o dist/); en la Lambda se indica con OPENAPI_SPEC_PATH.
function specPath(): string {
  return process.env.OPENAPI_SPEC_PATH || path.resolve(__dirname, "../../../contracts/openapi.yaml");
}

// Opciones para inyectar piezas en las pruebas:
//   - verifier: verificador de tokens falso.
//   - deps: repositorios en memoria, reloj, etc. (si no se pasan, se usa DynamoDB).
export function createApp(options: { verifier?: TokenVerifier; deps?: AppDeps } = {}) {
  // Falla al arrancar, con un mensaje claro, si no está el contrato.
  const SPEC_PATH = specPath();
  if (!fs.existsSync(SPEC_PATH)) {
    throw new Error(
      `No se encontró el contrato OpenAPI en "${SPEC_PATH}". ` +
        "Revisá la variable OPENAPI_SPEC_PATH o que el archivo viaje dentro del paquete."
    );
  }

  // Con AUTH_MODE=cognito se crea el verificador ahora, para fallar al arrancar si falta configuración.
  const authMode = getAuthMode();
  const authMiddleware =
    authMode === "cognito" ? cognitoAuth(options.verifier ?? createCognitoVerifier()) : mockAuth;

  // Con hybrid o real hace falta la lógica real (y sus tablas); con mock no.
  const dataSource = getDataSource();
  const realRouter: express.RequestHandler =
    dataSource === "mock" ? (_req, _res, next) => next() : createRealRouter(options.deps ?? createDefaultDeps());

  // Rutas mock. Aquí vive el "id not-found" simulado: es una simulación solo del mock.
  const mockRouter = Router();
  mockRouter.use(notFoundId);
  mockRouter.use(meRouter);
  mockRouter.use(linksRouter);
  mockRouter.use(privacyRouter);
  mockRouter.use(sessionsRouter);
  mockRouter.use(professionalRouter);
  mockRouter.use(alertsRouter);

  const app = express();

  // CORS va primero: así los pedidos de preflight (OPTIONS) se responden antes que nada.
  app.use(createCors());

  // Permite leer cuerpos de pedidos en formato JSON (req.body).
  app.use(express.json());

  // Con DATA_SOURCE=real, lo que no tiene lógica real responde 501 (menos /health).
  app.use(notImplementedWhenReal);

  // Valida cada pedido y cada respuesta contra el contrato.
  // La seguridad no se valida acá: la verificación del token la hace authMiddleware.
  app.use(
    OpenApiValidator.middleware({
      apiSpec: SPEC_PATH,
      validateRequests: true,
      validateResponses: true,
      validateSecurity: false,
    })
  );

  // Identidad (simulada o de Cognito) -> chequeo de rol de la operación.
  app.use(authMiddleware);
  app.use(requireRole);

  // Chequeo de salud: sirve para confirmar rápidamente que el servidor está vivo.
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Según DATA_SOURCE y la operación, atiende la versión real o la mock (ver dataSourceSwitch.ts).
  app.use(dataSourceSwitch(mockRouter, realRouter));

  // Siempre al final: convierte cualquier error en JSON { error, message }.
  app.use(errorHandler);

  return app;
}
