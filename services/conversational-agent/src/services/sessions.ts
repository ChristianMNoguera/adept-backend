// Lógica de las sesiones de conversación: abrir y cerrar (tramo 4A-1).
// Los mensajes y los ejercicios llegan en el tramo 4A-2.

import { AppError } from "../errors";
import { AppDeps } from "../deps";
import { Session } from "../repositories/types";
import { hasValidConsent } from "./consent";
import { buildGreeting } from "./greeting";

type SessionDeps = Pick<AppDeps, "consents" | "sessions" | "messages" | "queue" | "clock" | "newSessionId" | "textTtlHours">;

// Cuántas sesiones recientes del usuario se revisan al abrir una nueva.
// Solo puede haber una activa y siempre es de las más nuevas.
const SESIONES_A_REVISAR = 20;

export interface SessionSummary {
  messageCount: number;
  exercisesCompleted: number;
  durationSeconds: number;
}

// Resumen de una sesión cerrada. messageCount suma los mensajes de ambos lados (con el saludo).
function resumen(sesion: Session): SessionSummary {
  const duracionMs = new Date(sesion.closedAt as string).getTime() - new Date(sesion.startedAt).getTime();
  return {
    messageCount: sesion.userMessageCount + sesion.agentMessageCount,
    exercisesCompleted: 0, // los ejercicios llegan en el tramo 4A-2
    durationSeconds: Math.max(0, Math.round(duracionMs / 1000)),
  };
}

// Abre una sesión nueva y devuelve el saludo.
export async function openSession(deps: SessionDeps, userId: string) {
  if (!(await hasValidConsent(deps, userId))) {
    throw new AppError(403, "consent_required", "Tenés que aceptar el consentimiento antes de conversar");
  }

  // Si ya hay una sesión activa se cierra antes (motivo "replaced") y se encola para procesarla.
  const previas = await deps.sessions.listByUser(userId, SESIONES_A_REVISAR);
  for (const previa of previas.filter((s) => s.status === "active")) {
    const cierre = await deps.sessions.close(previa.sessionId, deps.clock().toISOString(), "replaced");
    if (cierre?.changed) await deps.queue.enqueue(previa.sessionId);
  }

  const ahora = deps.clock();
  const ahoraIso = ahora.toISOString();
  const sessionId = deps.newSessionId();

  await deps.sessions.create({
    sessionId,
    userId,
    status: "active",
    startedAt: ahoraIso,
    lastActivityAt: ahoraIso,
    closedAt: null,
    closeReason: null,
    nextSeq: 1,
    userMessageCount: 0,
    agentMessageCount: 0,
  });

  // El saludo sale de una plantilla; la variante depende de si es la primera sesión del usuario.
  const text = buildGreeting({ sessionId, ahora, primeraSesion: previas.length === 0 });

  // El número del mensaje se reserva de forma atómica; el texto va a la tabla temporal.
  const seq = await deps.sessions.reserveSeq(sessionId, "agent", ahoraIso);
  if (seq === null) throw new Error("No se pudo reservar el número del saludo");
  await deps.messages.put({
    sessionId,
    seq,
    role: "agent",
    text,
    inputType: "greeting",
    createdAt: ahoraIso,
    expiresAt: Math.floor(ahora.getTime() / 1000) + Math.round(deps.textTtlHours * 3600),
  });

  return { sessionId, status: "active" as const, agentGreeting: { text } };
}

// Cierra una sesión del usuario. Es idempotente: si ya estaba cerrada devuelve el mismo resumen.
export async function closeSession(deps: SessionDeps, userId: string, sessionId: string) {
  const sesion = await deps.sessions.get(sessionId);
  // Si no existe o es de otro usuario: 404 (no 403), para no revelar que existe.
  if (!sesion || sesion.userId !== userId) {
    throw new AppError(404, "not_found", "Recurso no encontrado");
  }

  if (sesion.status === "closed") {
    return { sessionId, status: "closed" as const, summary: resumen(sesion) };
  }

  const cierre = await deps.sessions.close(sessionId, deps.clock().toISOString(), "user");
  if (!cierre) throw new AppError(404, "not_found", "Recurso no encontrado");
  // Solo quien efectivamente la cerró la encola: si dos pedidos cierran a la vez, se encola una vez.
  if (cierre.changed) await deps.queue.enqueue(sessionId);

  return { sessionId, status: "closed" as const, summary: resumen(cierre.session) };
}
