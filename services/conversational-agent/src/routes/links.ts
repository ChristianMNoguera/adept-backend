// Vinculación paciente-profesional (RF03).
// Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import { professionalLink, professionalLinks, VALID_INVITATION_CODE } from "../mocks/links";

export const linksRouter = Router();

// Profesionales vinculados al paciente.
linksRouter.get("/me/professionals", (_req, res) => {
  res.status(200).json(professionalLinks);
});

// Vincularse con un profesional mediante código de invitación.
linksRouter.post("/me/professionals", (req, res) => {
  // Solo el código de prueba es válido; cualquier otro simula "código inexistente o vencido".
  if (req.body.invitationCode !== VALID_INVITATION_CODE) {
    return res.status(404).json({
      error: "invitation_invalid",
      message: "El código de invitación no existe o venció",
    });
  }
  res.status(201).json(professionalLink);
});

// Desvincular a un profesional.
linksRouter.delete("/me/professionals/:professionalId", (_req, res) => {
  res.status(204).end();
});
