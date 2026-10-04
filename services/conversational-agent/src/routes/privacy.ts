// Preferencias de privacidad del paciente (CU04).
// Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import { privacyPreferences, privacyPreferencesUpdated } from "../mocks/privacy";

export const privacyRouter = Router();

// Preferencias vigentes.
privacyRouter.get("/me/privacy", (_req, res) => {
  res.status(200).json(privacyPreferences);
});

// Actualizar preferencias.
privacyRouter.put("/me/privacy", (_req, res) => {
  res.status(200).json(privacyPreferencesUpdated);
});
