// Caso de error simulable: si algún id de la ruta vale "not-found",
// se responde 404 como si el recurso no existiera.

import { Request, Response, NextFunction } from "express";
import type { OpenApiRequest } from "express-openapi-validator/dist/framework/types";

export function notFoundId(req: Request, res: Response, next: NextFunction) {
  const pathParams = (req as OpenApiRequest).openapi?.pathParams ?? {};

  if (Object.values(pathParams).includes("not-found")) {
    return res.status(404).json({ error: "not_found", message: "Recurso no encontrado" });
  }
  next();
}
