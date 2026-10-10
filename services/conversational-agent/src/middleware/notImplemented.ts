// Con DATA_SOURCE=real, las operaciones sin lógica real responden 501.
// /health y las operaciones marcadas como implementadas (src/config/operations.ts) pasan.
// Va antes del validador, así que identifica la operación por método y ruta.

import { Request, Response, NextFunction } from "express";
import { getDataSource } from "../config/dataSource";
import { findOperation } from "../config/operations";

export function notImplementedWhenReal(req: Request, res: Response, next: NextFunction) {
  if (getDataSource() !== "real" || req.path === "/health") return next();

  // Un pedido que no corresponde a ninguna operación sigue de largo: el validador responde 404.
  const operacion = findOperation(req.method, req.path);
  if (!operacion || operacion.implemented) return next();

  res.status(501).json({
    error: "not_implemented",
    message: "Lógica real pendiente de implementación",
  });
}
