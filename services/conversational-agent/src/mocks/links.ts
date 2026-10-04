// MOCK (ADR-0004): datos fijos, se reemplazan por lógica real.
// Cada valor es idéntico al example del contrato (contracts/openapi.yaml).

export const professionalLink = {
  professionalId: "pro_0001",
  displayName: "Dra. Laura Gómez",
  linkedAt: "2026-10-05T15:00:00Z",
};

export const professionalLinks = { items: [professionalLink] };

// Único código de invitación que acepta el mock.
export const VALID_INVITATION_CODE = "ADEPT-TEST";
