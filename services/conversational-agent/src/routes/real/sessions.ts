// Versión REAL de abrir y cerrar sesiones (CU02, CU03).
// Deben coincidir con contracts/openapi.yaml.
// Enviar mensajes y responder ejercicios siguen en mock: se hacen en el tramo 4A-2.

import { Router } from "express";
import { AppDeps } from "../../deps";
import { asyncHandler } from "../../middleware/asyncHandler";
import { closeSession, openSession } from "../../services/sessions";

export function createRealSessionsRouter(deps: AppDeps) {
  const router = Router();

  // Abrir una sesión nueva (el paciente sale del token). Devuelve el saludo.
  router.post(
    "/sessions",
    asyncHandler(async (req, res) => {
      res.status(201).json(await openSession(deps, req.user!.userId));
    })
  );

  // Cerrar una sesión propia.
  router.post(
    "/sessions/:sessionId/close",
    asyncHandler(async (req, res) => {
      res.status(200).json(await closeSession(deps, req.user!.userId, req.params.sessionId));
    })
  );

  return router;
}
