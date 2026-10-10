// Interfaces de los repositorios (acceso a datos) y estructura de los ítems en DynamoDB.
// Las rutas y los servicios dependen SOLO de estas interfaces. Hay dos implementaciones:
// DynamoDB (dynamo.ts, para AWS) y en memoria (memory.ts, para las pruebas).
//
// ESTRUCTURA DE ÍTEMS
//
// Tabla CoreTable (adept-dev-core), clave pk + sk, índices gsi1 y gsi2:
//   Perfil        pk=USER#<userId>      sk=PROFILE
//                 userId, role, username, email, createdAt
//   Consentimiento pk=USER#<userId>     sk=CONSENT
//                 accepted, version, acceptedAt
//   Sesión        pk=SESSION#<sessionId> sk=META
//                 userId, status (active | closed), startedAt, lastActivityAt, closedAt,
//                 closeReason (user | inactivity | replaced), nextSeq,
//                 userMessageCount, agentMessageCount
//                 gsi1pk=USER#<userId>#SESSIONS, gsi1sk=<startedAt>   (siempre)
//                 gsi2pk=ACTIVE, gsi2sk=<lastActivityAt>              (solo mientras está activa;
//                                                                       al cerrar se quitan)
//   Por eso gsi1 sirve para listar las sesiones de un usuario por fecha y gsi2 (índice disperso)
//   para encontrar las sesiones activas por última actividad.
//
// Tabla TextTable (adept-dev-text), clave sessionId (String) + seq (Number):
//   sessionId, seq, role (agent | user), text, inputType (text | voice | greeting),
//   createdAt (ISO con milisegundos), expiresAt (segundos desde la época; TTL de DynamoDB).
//   El texto de los mensajes vive SOLO acá, nunca en CoreTable (RNF07).

export type Role = "patient" | "professional";
export type SessionStatus = "active" | "closed";
export type CloseReason = "user" | "inactivity" | "replaced";
export type MessageRole = "agent" | "user";
export type InputType = "text" | "voice" | "greeting";

export interface UserProfile {
  userId: string;
  role: Role;
  username: string;
  email: string;
  createdAt: string;
}

export interface Consent {
  accepted: boolean;
  version: string;
  acceptedAt: string | null;
}

export interface Session {
  sessionId: string;
  userId: string;
  status: SessionStatus;
  startedAt: string;
  lastActivityAt: string;
  closedAt: string | null;
  closeReason: CloseReason | null;
  nextSeq: number; // próximo número de mensaje a entregar (empieza en 1)
  userMessageCount: number;
  agentMessageCount: number;
}

export interface Message {
  sessionId: string;
  seq: number;
  role: MessageRole;
  text: string;
  inputType: InputType;
  createdAt: string;
  expiresAt: number;
}

export interface UserRepository {
  get(userId: string): Promise<UserProfile | null>;
  // Guarda el perfil solo si no existe. Devuelve false si ya existía (no lo pisa).
  putIfAbsent(profile: UserProfile): Promise<boolean>;
}

export interface ConsentRepository {
  get(userId: string): Promise<Consent | null>;
  put(userId: string, consent: Consent): Promise<void>;
}

export interface SessionRepository {
  create(session: Session): Promise<void>;
  get(sessionId: string): Promise<Session | null>;
  // Sesiones de un usuario, de la más nueva a la más vieja (usa gsi1).
  listByUser(userId: string, limit: number): Promise<Session[]>;
  // Cierra una sesión activa. "changed" es false si ya estaba cerrada (no se modifica nada).
  // Devuelve null si la sesión no existe.
  close(
    sessionId: string,
    closedAt: string,
    reason: CloseReason
  ): Promise<{ session: Session; changed: boolean } | null>;
  // Reserva el próximo número de mensaje con una actualización atómica de nextSeq, suma el
  // mensaje al contador del rol y actualiza la última actividad. Devuelve null si la sesión no
  // existe o no está activa.
  reserveSeq(sessionId: string, role: MessageRole, nowIso: string): Promise<number | null>;
}

export interface MessageRepository {
  put(message: Message): Promise<void>;
  // Mensajes de una sesión en orden, ignorando los que ya vencieron (expiresAt <= ahora).
  list(sessionId: string, now: Date): Promise<Message[]>;
}
