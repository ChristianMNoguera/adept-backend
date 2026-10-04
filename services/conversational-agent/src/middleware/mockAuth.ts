// Autenticación simulada (solo modo mock): en vez de validar un token de Cognito,
// el rol y el usuario se leen de headers de prueba.

import { Request, Response, NextFunction } from "express";

export type Role = "patient" | "professional";

// Agrega req.user al tipo Request de Express.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: Role };
    }
  }
}

// Usuario por defecto de cada rol (coinciden con los ejemplos del contrato).
const DEFAULT_USER_ID: Record<Role, string> = {
  patient: "pat_4471",
  professional: "pro_0001",
};

export function mockAuth(req: Request, _res: Response, next: NextFunction) {
  // Si el header trae algo distinto de "professional", se usa "patient".
  const role: Role = req.header("x-mock-role") === "professional" ? "professional" : "patient";
  const userId = req.header("x-mock-user-id") || DEFAULT_USER_ID[role];

  req.user = { userId, role };
  next();
}
