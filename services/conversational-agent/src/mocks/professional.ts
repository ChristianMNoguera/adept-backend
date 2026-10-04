// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

export const invitation = {
  code: "ADEPT-TEST",
  expiresAt: "2026-10-12T15:00:00Z",
};

export const patientsList = {
  items: [
    {
      patientId: "pat_4471",
      displayName: "Carlos Pérez",
      lastSessionAt: "2026-10-05T14:40:00Z",
      sessionsProcessed: 12,
      openAlerts: 1,
      latestEmotion: "neutral",
    },
  ],
};

export const patientProfile = {
  patientId: "pat_4471",
  fullName: "Carlos Pérez",
  birthDate: "1948-03-14",
  phone: "+54 11 5555-0101",
  notes: "Prefiere sesiones por la mañana.",
};

export const dashboard = {
  patientId: "pat_4471",
  period: { from: "2026-09-05", to: "2026-10-05" },
  sessionsProcessed: 12,
  usage: { sessionsInPeriod: 12, activeDays: 10, lastSessionAt: "2026-10-05T14:40:00Z" },
  linguisticIndicators: { ttrLatest: 0.52, ttrBaseline: 0.58, variationPct: -10.3 },
  emotionalState: {
    latestLabel: "neutral",
    distribution: { positive_active: 4, neutral: 6, withdrawn_sad: 2, anxious: 0 },
  },
  anomalySignals: { openAlerts: 1, lastDetectedAt: "2026-10-05T14:45:00Z" },
};

export const history = {
  patientId: "pat_4471",
  points: [
    {
      sessionId: "sess_a93f0001",
      startedAt: "2026-10-05T14:30:00Z",
      ttr: 0.52,
      emotionLabel: "neutral",
      anomalyScore: 0.71,
      durationSeconds: 340,
      messageCount: 12,
    },
  ],
};

export const sessionIndicators = {
  sessionId: "sess_a93f0001",
  startedAt: "2026-10-05T14:30:00Z",
  indicators: [
    {
      key: "ttr",
      label: "Diversidad léxica (TTR)",
      value: 0.52,
      baselineMean: 0.58,
      deviationPct: -10.3,
      isOutlier: false,
    },
  ],
};
