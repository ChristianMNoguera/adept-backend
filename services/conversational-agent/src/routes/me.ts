// Endpoints del usuario autenticado y del consentimiento informado (RF04).
// Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import { mePatient, meProfessional, consentTerms, consentStatus } from "../mocks/me";

export const meRouter = Router();

// Datos del usuario autenticado (devuelve el perfil según el rol simulado).
meRouter.get("/me", (req, res) => {
  res.status(200).json(req.user?.role === "professional" ? meProfessional : mePatient);
});

// Texto vigente del consentimiento.
meRouter.get("/consent/terms", (_req, res) => {
  res.status(200).json(consentTerms);
});

// Estado actual del consentimiento.
meRouter.get("/me/consent", (_req, res) => {
  res.status(200).json(consentStatus);
});

// Aceptar o revocar el consentimiento.
meRouter.put("/me/consent", (_req, res) => {
  res.status(200).json(consentStatus);
});
