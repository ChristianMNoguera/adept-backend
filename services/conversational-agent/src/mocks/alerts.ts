// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

const alertBase = {
  alertId: "alert_0001",
  patientId: "pat_4471",
  patientDisplayName: "Carlos Pérez",
  sessionId: "sess_a93f0001",
  detectedAt: "2026-10-05T14:45:00Z",
};

const affectedIndicators = [
  {
    key: "ttr",
    label: "Diversidad léxica (TTR)",
    value: 0.41,
    personalMedian: 0.58,
    robustDistance: 3.1,
    affected: true,
  },
];

export const alertsList = { items: [{ ...alertBase, status: "pending" }] };

export const alertDetail = { ...alertBase, status: "pending", reviewedAt: null, affectedIndicators };

export const alertReviewed = {
  ...alertBase,
  status: "reviewed",
  reviewedAt: "2026-10-06T09:10:00Z",
  affectedIndicators,
};
