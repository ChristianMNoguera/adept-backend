// Endpoints de sesiones de conversación.
// Deben coincidir con lo definido en contracts/openapi.yaml.
// Por ahora, en modo mock devuelven siempre las mismas respuestas fijas.

import { Router, Request, Response } from "express";
import { isMockMode } from "../config/dataSource";

// Un "Router" agrupa varias rutas para después montarlas todas juntas en el servidor.
export const sessionsRouter = Router();

// Respuesta que se usa cuando DATA_SOURCE=real y la lógica todavía no existe.
function notImplemented(res: Response) {
  return res.status(501).json({
    error: "not_implemented",
    message: "Lógica real pendiente de implementación",
  });
}

// 1. Crear una nueva sesión de conversación.
sessionsRouter.post("/sessions", (_req: Request, res: Response) => {
  if (!isMockMode()) return notImplemented(res);

  // MOCK: respuesta fija
  res.status(201).json({
    sessionId: "sess_mock_0001",
    status: "active",
    agentGreeting: { text: "Hola, qué bueno verte de nuevo. ¿Cómo estuvo tu día?" },
  });
});

// 2. Enviar un mensaje del usuario dentro de una sesión.
sessionsRouter.post("/sessions/:sessionId/messages", (_req: Request, res: Response) => {
  if (!isMockMode()) return notImplemented(res);

  // MOCK: respuesta fija
  res.status(200).json({
    messageId: "msg_mock_0001",
    agentReply: {
      text: "Qué interesante lo que contás. Contame más.",
      exerciseProposed: null,
    },
    sessionStatus: "active",
  });
});

// 3. Responder un ejercicio cognitivo propuesto por el agente.
sessionsRouter.post(
  "/sessions/:sessionId/exercises/:exerciseId/responses",
  (_req: Request, res: Response) => {
    if (!isMockMode()) return notImplemented(res);

    // MOCK: respuesta fija
    res.status(200).json({
      evaluation: { correct: true, feedback: "¡Muy bien!" },
      agentReply: { text: "Seguimos charlando entonces..." },
    });
  }
);

// 4. Cerrar una sesión.
sessionsRouter.post("/sessions/:sessionId/close", (_req: Request, res: Response) => {
  if (!isMockMode()) return notImplemented(res);

  // MOCK: respuesta fija
  res.status(200).json({
    sessionId: "sess_mock_0001",
    status: "closed",
    summary: { messageCount: 12, exercisesCompleted: 2, durationSeconds: 340 },
  });
});
