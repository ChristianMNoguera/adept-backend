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
      latestEmotion: "others",
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
  linguisticIndicators: {
    indicators: [
      { key: "ttr", label: "Diversidad léxica (TTR)", value: 0.52, personalMedian: 0.58, robustDistance: 1.4, affected: false },
      {
        key: "avg_length_words",
        label: "Longitud promedio de respuesta (palabras)",
        value: 14.2,
        personalMedian: 16.0,
        robustDistance: 0.9,
        affected: false,
      },
      {
        key: "avg_response_seconds",
        label: "Tiempo promedio de respuesta (segundos)",
        value: 6.8,
        personalMedian: 5.1,
        robustDistance: 1.1,
        affected: false,
      },
      { key: "coherence", label: "Coherencia discursiva", value: 0.61, personalMedian: 0.66, robustDistance: 0.7, affected: false },
    ],
  },
  emotionalState: {
    latestLabel: "others",
    distribution: { joy: 4, others: 5, sadness: 2, anger: 1, fear: 0, disgust: 0, surprise: 0 },
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
      avgLengthWords: 14.2,
      avgResponseSeconds: 6.8,
      coherence: 0.61,
      emotionLabel: "others",
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
      personalMedian: 0.58,
      robustDistance: 1.4,
      affected: false,
    },
  ],
};
