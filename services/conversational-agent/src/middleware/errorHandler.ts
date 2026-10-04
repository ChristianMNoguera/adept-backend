// Manejador final de errores: siempre responde JSON con la forma del esquema
// Error del contrato: { "error": "...", "message": "..." }.

import { Request, Response, NextFunction } from "express";

// Código estable según el status HTTP del error.
const CODES: Record<number, string> = {
  400: "bad_request",
  404: "not_found",
  405: "method_not_allowed",
};

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status: number = err.status || err.statusCode || 500;

  // 500 = una respuesta propia no cumple el contrato (el mock quedó desalineado).
  // El message del validador indica qué campo falla.
  if (status === 500) {
    console.error("Respuesta fuera de contrato:", err.message);
    return res.status(500).json({
      error: "contract_violation",
      message: err.message || "La respuesta no cumple el contrato",
    });
  }

  res.status(status).json({
    error: CODES[status] || "error",
    message: status === 404 ? "Ruta no encontrada" : err.message || "Error",
  });
}
