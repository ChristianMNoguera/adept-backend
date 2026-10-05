// Decide cómo se identifica al usuario. Se controla con la variable AUTH_MODE:
//   - "mock" (valor por defecto): rol y usuario salen de headers de prueba (x-mock-*).
//   - "cognito": se verifica el token de acceso de Amazon Cognito.
// Es independiente de DATA_SOURCE: con AUTH_MODE=cognito y DATA_SOURCE=mock
// la identidad es real y los datos siguen siendo fijos.

export type AuthMode = "mock" | "cognito";

export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE ?? "mock";
  if (mode !== "mock" && mode !== "cognito") {
    throw new Error(`AUTH_MODE inválido: "${mode}". Los valores posibles son "mock" o "cognito".`);
  }
  return mode;
}
