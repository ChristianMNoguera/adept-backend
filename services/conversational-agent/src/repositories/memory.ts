// Repositorios en memoria: se usan en las pruebas (no necesitan AWS).
// Se comportan como los de DynamoDB (mismas reglas), pero los datos se pierden al cerrar el proceso.

import {
  Consent,
  ConsentRepository,
  CloseReason,
  Message,
  MessageRepository,
  MessageRole,
  Session,
  SessionRepository,
  UserProfile,
  UserRepository,
} from "./types";

export class MemoryUserRepository implements UserRepository {
  private perfiles = new Map<string, UserProfile>();

  async get(userId: string) {
    const perfil = this.perfiles.get(userId);
    return perfil ? { ...perfil } : null;
  }

  async putIfAbsent(profile: UserProfile) {
    if (this.perfiles.has(profile.userId)) return false;
    this.perfiles.set(profile.userId, { ...profile });
    return true;
  }
}

export class MemoryConsentRepository implements ConsentRepository {
  private consentimientos = new Map<string, Consent>();

  async get(userId: string) {
    const consentimiento = this.consentimientos.get(userId);
    return consentimiento ? { ...consentimiento } : null;
  }

  async put(userId: string, consent: Consent) {
    this.consentimientos.set(userId, { ...consent });
  }
}

export class MemorySessionRepository implements SessionRepository {
  private sesiones = new Map<string, Session>();

  async create(session: Session) {
    if (this.sesiones.has(session.sessionId)) throw new Error("La sesión ya existe");
    this.sesiones.set(session.sessionId, { ...session });
  }

  async get(sessionId: string) {
    const sesion = this.sesiones.get(sessionId);
    return sesion ? { ...sesion } : null;
  }

  async listByUser(userId: string, limit: number) {
    return [...this.sesiones.values()]
      .filter((s) => s.userId === userId)
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }

  async close(sessionId: string, closedAt: string, reason: CloseReason) {
    const sesion = this.sesiones.get(sessionId);
    if (!sesion) return null;
    if (sesion.status === "closed") return { session: { ...sesion }, changed: false };
    sesion.status = "closed";
    sesion.closedAt = closedAt;
    sesion.closeReason = reason;
    return { session: { ...sesion }, changed: true };
  }

  async reserveSeq(sessionId: string, role: MessageRole, nowIso: string) {
    const sesion = this.sesiones.get(sessionId);
    if (!sesion || sesion.status !== "active") return null;
    // Todo el cuerpo es síncrono: dos pedidos "simultáneos" nunca reciben el mismo número.
    const seq = sesion.nextSeq;
    sesion.nextSeq += 1;
    if (role === "user") sesion.userMessageCount += 1;
    else sesion.agentMessageCount += 1;
    sesion.lastActivityAt = nowIso;
    return seq;
  }
}

export class MemoryMessageRepository implements MessageRepository {
  private mensajes: Message[] = [];

  async put(message: Message) {
    this.mensajes.push({ ...message });
  }

  async list(sessionId: string, now: Date) {
    const ahoraSeg = Math.floor(now.getTime() / 1000);
    return this.mensajes
      .filter((m) => m.sessionId === sessionId && m.expiresAt > ahoraSeg)
      .sort((a, b) => a.seq - b.seq)
      .map((m) => ({ ...m }));
  }
}
