// Registro de las 25 operaciones del contrato (contracts/openapi.yaml).
// "implemented" dice si la operación ya tiene lógica real:
//   - DATA_SOURCE=hybrid: usa la versión real si implemented es true y el mock si no.
//   - DATA_SOURCE=real: lo no implementado responde 501 (salvo /health).
// Una prueba automática exige que este registro tenga exactamente las operaciones del contrato.

export interface OperationEntry {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string; // igual que en el contrato, con {parametros}
  implemented: boolean;
}

export const OPERATIONS: OperationEntry[] = [
  { method: "GET", path: "/health", implemented: false }, // siempre responde igual, no tiene versión mock aparte
  { method: "GET", path: "/me", implemented: true },
  { method: "DELETE", path: "/me", implemented: false }, // tramo 4B
  { method: "GET", path: "/consent/terms", implemented: true },
  { method: "GET", path: "/me/consent", implemented: true },
  { method: "PUT", path: "/me/consent", implemented: true },
  { method: "GET", path: "/me/professionals", implemented: false },
  { method: "POST", path: "/me/professionals", implemented: false },
  { method: "DELETE", path: "/me/professionals/{professionalId}", implemented: false },
  { method: "GET", path: "/me/privacy", implemented: false },
  { method: "PUT", path: "/me/privacy", implemented: false },
  { method: "POST", path: "/sessions", implemented: true },
  // Mensajes y respuestas a ejercicios se hacen en el tramo 4A-2 (necesitan el LLM).
  { method: "POST", path: "/sessions/{sessionId}/messages", implemented: false },
  { method: "POST", path: "/sessions/{sessionId}/exercises/{exerciseId}/responses", implemented: false },
  { method: "POST", path: "/sessions/{sessionId}/close", implemented: true },
  { method: "POST", path: "/professional/invitations", implemented: false },
  { method: "GET", path: "/professional/patients", implemented: false },
  { method: "GET", path: "/professional/patients/{patientId}", implemented: false },
  { method: "PUT", path: "/professional/patients/{patientId}", implemented: false },
  { method: "GET", path: "/professional/patients/{patientId}/dashboard", implemented: false },
  { method: "GET", path: "/professional/patients/{patientId}/history", implemented: false },
  { method: "GET", path: "/professional/patients/{patientId}/sessions/{sessionId}/indicators", implemented: false },
  { method: "GET", path: "/professional/alerts", implemented: false },
  { method: "GET", path: "/professional/alerts/{alertId}", implemented: false },
  { method: "POST", path: "/professional/alerts/{alertId}/review", implemented: false },
];

// Convierte "/me/professionals/{professionalId}" en una expresión regular.
function patronDe(path: string): RegExp {
  const escapado = path.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[^}]+\}/g, "[^/]+");
  return new RegExp(`^${escapado}/?$`);
}

const PATRONES = OPERATIONS.map((op) => ({ op, patron: patronDe(op.path) }));

// Busca la operación que corresponde a un pedido (método y ruta reales). Devuelve undefined si no hay.
export function findOperation(method: string, urlPath: string): OperationEntry | undefined {
  const metodo = method.toUpperCase();
  return PATRONES.find((p) => p.op.method === metodo && p.patron.test(urlPath))?.op;
}

// Texto para el log de arranque: las operaciones que usan lógica real.
export function describeRealOperations(): string {
  const reales = OPERATIONS.filter((op) => op.implemented).map((op) => `${op.method} ${op.path}`);
  return `Operaciones reales (${reales.length}): ${reales.join(", ")}`;
}
