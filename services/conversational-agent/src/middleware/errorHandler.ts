// Manejador final de errores: siempre responde JSON con la forma del esquema
// Error del contrato: { "error": "...", "message": "..." }.

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

// Código estable según el status HTTP del error.
const CODES: Record<number, string> = {
  400: "bad_request",
  404: "not_found",
  405: "method_not_allowed",
};

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Error de negocio lanzado por un servicio (consent_required, not_found, etc.).
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }

  const status: number | undefined = err.status || err.statusCode;

  // 500 con status explícito = el validador detectó que una respuesta propia no cumple el contrato
  // (el mock quedó desalineado). El message indica qué campo falla; no contiene datos del usuario.
  if (status === 500) {
    console.error("Respuesta fuera de contrato:", err.message);
    return res.status(500).json({
      error: "contract_violation",
      message: err.message || "La respuesta no cumple el contrato",
    });
  }

  // Error inesperado (por ejemplo una falla de la base de datos): sin status. Se registra solo el
  // tipo de error, nunca el cuerpo del pedido ni textos, y el cliente recibe un mensaje genérico.
  if (!status) {
    console.error("Error inesperado:", err?.name ?? "Error");
    return res.status(500).json({ error: "internal_error", message: "Ocurrió un error inesperado" });
  }

  res.status(status).json({
    error: CODES[status] || "error",
    message: status === 404 ? "Ruta no encontrada" : err.message || "Error",
  });
}
