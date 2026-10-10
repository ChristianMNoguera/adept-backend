// Decide de dónde salen los datos que devuelve la API.
// Se controla con la variable de entorno DATA_SOURCE (ADR-0004, extendido por el ADR-0014):
//   - "mock" (valor por defecto): respuestas fijas, para que el frontend pueda integrarse ya.
//   - "hybrid": cada operación usa su versión real si está marcada como implementada
//     en src/config/operations.ts, y el mock si no.
//   - "real": solo responden las operaciones implementadas; el resto da 501 (menos /health).

export type DataSource = "mock" | "hybrid" | "real";

const VALORES: DataSource[] = ["mock", "hybrid", "real"];

// Lee DATA_SOURCE cada vez que se llama (así las pruebas pueden cambiarlo).
// Un valor desconocido es un error de configuración y el servicio no arranca.
export function getDataSource(): DataSource {
  const valor = process.env.DATA_SOURCE ?? "mock";
  if (!VALORES.includes(valor as DataSource)) {
    throw new Error(`DATA_SOURCE inválido: "${valor}". Los valores posibles son "mock", "hybrid" o "real".`);
  }
  return valor as DataSource;
}

// Devuelve true si estamos en modo mock.
export function isMockMode(): boolean {
  return getDataSource() === "mock";
}
