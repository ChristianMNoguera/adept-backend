// Endpoints de sesiones de conversación (CU01, CU02, CU03).
// Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import { openSession, sendMessage, exerciseResult, closeSession } from "../mocks/sessions";

export const sessionsRouter = Router();

// 1. Abrir una nueva sesión. El paciente sale del token, no del body.
sessionsRouter.post("/sessions", (req, res) => {
  // Caso simulable: con "x-mock-consent: false" el paciente no aceptó el consentimiento.
  if (req.header("x-mock-consent") === "false") {
    return res.status(403).json({
      error: "consent_required",
      message: "Tenés que aceptar el consentimiento informado para usar ADEPT",
    });
  }
  res.status(201).json(openSession);
});

// 2. Enviar un mensaje dentro de una sesión.
sessionsRouter.post("/sessions/:sessionId/messages", (_req, res) => {
  res.status(200).json(sendMessage);
});

// 3. Responder un ejercicio cognitivo propuesto por el agente.
sessionsRouter.post("/sessions/:sessionId/exercises/:exerciseId/responses", (_req, res) => {
  res.status(200).json(exerciseResult);
});

// 4. Cerrar una sesión.
sessionsRouter.post("/sessions/:sessionId/close", (_req, res) => {
  res.status(200).json(closeSession);
});
