// Control de rol: cada operación del contrato declara su rol en "x-required-role"
// (patient, professional, any o none). Acá se compara con el rol de req.user.

import { Request, Response, NextFunction } from "express";
import type { OpenApiRequest } from "express-openapi-validator/dist/framework/types";

export function requireRole(req: Request, res: Response, next: NextFunction) {
  // El validador deja la operación del contrato en req.openapi.schema.
  const operation = (req as OpenApiRequest).openapi?.schema as Record<string, unknown> | undefined;
  const required = operation?.["x-required-role"];

  // "any", "none" o sin declarar: cualquier rol puede pasar.
  if (required !== "patient" && required !== "professional") return next();

  if (req.user?.role !== required) {
    return res.status(403).json({
      error: "forbidden",
      message: "No tenés permiso para esta operación",
    });
  }
  next();
}
