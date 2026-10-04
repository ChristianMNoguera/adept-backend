// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

export const openSession = {
  sessionId: "sess_a93f0001",
  status: "active",
  agentGreeting: { text: "Hola Carlos, qué bueno verte de nuevo. ¿Cómo estuvo tu día?" },
};

export const sendMessage = {
  messageId: "msg_8f2a0001",
  agentReply: {
    text: "Qué lindo plan. ¿A dónde te gusta ir a caminar?",
    exerciseProposed: null,
  },
  sessionStatus: "active",
};

export const exerciseResult = {
  evaluation: { correct: true, feedback: "¡Exacto! Las otras tres son frutas." },
  agentReply: { text: "Muy bien hecho. Seguimos charlando entonces..." },
};

export const closeSession = {
  sessionId: "sess_a93f0001",
  status: "closed",
  summary: { messageCount: 12, exercisesCompleted: 2, durationSeconds: 340 },
};
