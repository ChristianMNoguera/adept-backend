// Error de negocio con el status HTTP y el código que debe ver el cliente.
// Los servicios lo lanzan y el manejador final (middleware/errorHandler.ts) lo convierte en
// la respuesta { "error": codigo, "message": texto } del contrato.

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}
