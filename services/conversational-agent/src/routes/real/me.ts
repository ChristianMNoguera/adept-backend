// Versión REAL de las operaciones del usuario y del consentimiento (RF04).
// Deben coincidir con contracts/openapi.yaml. Los datos salen de los repositorios.

import { Router } from "express";
import { AppDeps } from "../../deps";
import { AppError } from "../../errors";
import { asyncHandler } from "../../middleware/asyncHandler";
import { currentTerms, getConsentStatus, updateConsent } from "../../services/consent";

export function createRealMeRouter(deps: AppDeps) {
  const router = Router();

  // Datos del usuario autenticado: perfil guardado y, si es paciente, el estado del consentimiento.
  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const user = req.user!;
      const perfil = await deps.users.get(user.userId);
      if (!perfil) throw new AppError(404, "profile_not_found", "El perfil todavía no existe");

      const respuesta: Record<string, unknown> = {
        userId: perfil.userId,
        role: perfil.role,
        username: perfil.username,
        email: perfil.email,
      };
      if (perfil.role === "patient") respuesta.consent = await getConsentStatus(deps, perfil.userId);
      res.status(200).json(respuesta);
    })
  );

  // Versión y texto vigentes del consentimiento.
  router.get("/consent/terms", (_req, res) => {
    res.status(200).json(currentTerms());
  });

  // Estado actual del consentimiento.
  router.get(
    "/me/consent",
    asyncHandler(async (req, res) => {
      res.status(200).json(await getConsentStatus(deps, req.user!.userId));
    })
  );

  // Aceptar o revocar el consentimiento (la versión tiene que ser la vigente).
  router.put(
    "/me/consent",
    asyncHandler(async (req, res) => {
      const { accepted, version } = req.body as { accepted: boolean; version: string };
      res.status(200).json(await updateConsent(deps, req.user!.userId, accepted, version));
    })
  );

  return router;
}
