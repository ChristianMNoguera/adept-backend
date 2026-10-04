// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

export const mePatient = {
  userId: "pat_4471",
  role: "patient",
  username: "carlos",
  email: "carlos@example.com",
  consent: { accepted: true, version: "1.0", acceptedAt: "2026-10-05T14:30:00Z" },
};

// El contrato solo trae el ejemplo del paciente; este es el equivalente para el profesional
// (el mismo esquema, sin "consent" porque es opcional).
export const meProfessional = {
  userId: "pro_0001",
  role: "professional",
  username: "laura",
  email: "laura@example.com",
};

export const consentTerms = {
  version: "1.0",
  text: "ADEPT recopila indicadores de tus conversaciones para acompañar tu estimulación cognitiva...",
};

export const consentStatus = {
  accepted: true,
  version: "1.0",
  acceptedAt: "2026-10-05T14:30:00Z",
};
