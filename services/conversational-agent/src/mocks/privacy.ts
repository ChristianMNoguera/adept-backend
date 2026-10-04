// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

export const privacyPreferences = {
  linguisticIndicators: true,
  emotionalState: true,
  anomalySignals: true,
};

// Lo que devuelve PUT /me/privacy (en el contrato, con emotionalState en false).
export const privacyPreferencesUpdated = {
  linguisticIndicators: true,
  emotionalState: false,
  anomalySignals: true,
};
