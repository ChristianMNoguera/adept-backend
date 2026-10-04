// Con DATA_SOURCE=real la lógica verdadera todavía no existe:
// todo responde 501, salvo el chequeo de salud.

import { Request, Response, NextFunction } from "express";
import { isMockMode } from "../config/dataSource";

export function notImplementedWhenReal(req: Request, res: Response, next: NextFunction) {
  if (isMockMode() || req.path === "/health") return next();

  res.status(501).json({
    error: "not_implemented",
    message: "Lógica real pendiente de implementación",
  });
}
