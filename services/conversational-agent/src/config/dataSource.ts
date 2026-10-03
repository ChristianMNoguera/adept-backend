// Decide de dónde salen los datos que devuelve la API.
// Se controla con la variable de entorno DATA_SOURCE:
//   - "mock" (valor por defecto): respuestas fijas, para que el frontend pueda integrarse ya.
//   - "real": lógica verdadera (todavía no implementada).

export const DATA_SOURCE = process.env.DATA_SOURCE ?? "mock";

// Devuelve true si estamos en modo mock.
export function isMockMode(): boolean {
  return DATA_SOURCE === "mock";
}
