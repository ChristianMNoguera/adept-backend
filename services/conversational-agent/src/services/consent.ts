// Lógica del consentimiento informado (RF04).
// Los textos y la versión vigente salen de un archivo versionado del repo.

import terms from "../content/consent-terms.es.json";
import { AppError } from "../errors";
import { AppDeps } from "../deps";
import { Consent } from "../repositories/types";

type ConsentDeps = Pick<AppDeps, "consents" | "clock">;

// Versión y texto vigentes.
export function currentTerms(): { version: string; text: string } {
  return { version: terms.version, text: terms.text };
}

// Estado del consentimiento. Si la persona todavía no respondió: no aceptado, con la versión vigente.
export async function getConsentStatus(deps: ConsentDeps, userId: string): Promise<Consent> {
  const guardado = await deps.consents.get(userId);
  return guardado ?? { accepted: false, version: terms.version, acceptedAt: null };
}

// Dice si hay un consentimiento aceptado y en la versión vigente.
export async function hasValidConsent(deps: ConsentDeps, userId: string): Promise<boolean> {
  const guardado = await deps.consents.get(userId);
  return guardado?.accepted === true && guardado.version === terms.version;
}

// Acepta o revoca el consentimiento. La versión enviada tiene que ser la vigente.
export async function updateConsent(
  deps: ConsentDeps,
  userId: string,
  accepted: boolean,
  version: string
): Promise<Consent> {
  if (version !== terms.version) {
    throw new AppError(400, "invalid_consent_version", "La versión del consentimiento no es la vigente");
  }

  const previo = await deps.consents.get(userId);
  const consentimiento: Consent = {
    accepted,
    version,
    // Si ya estaba aceptado en esta versión se conserva la fecha original; al revocar queda en null.
    acceptedAt: accepted ? (previo?.accepted && previo.version === version ? previo.acceptedAt : deps.clock().toISOString()) : null,
  };
  await deps.consents.put(userId, consentimiento);
  return consentimiento;
}
