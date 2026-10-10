// Repositorios sobre DynamoDB. La estructura de los ítems está descrita en types.ts.
// Los nombres de las tablas salen de las variables CORE_TABLE y TEXT_TABLE.

import { DynamoDBClient, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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

type Item = Record<string, any>;

// Cliente de documentos: convierte los tipos de JavaScript a los de DynamoDB.
export function createDocClient(): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
}

function esCondicionFallida(err: unknown): boolean {
  return err instanceof ConditionalCheckFailedException || (err as Item)?.name === "ConditionalCheckFailedException";
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------
export class DynamoUserRepository implements UserRepository {
  constructor(private doc: DynamoDBDocumentClient, private coreTable: string) {}

  async get(userId: string): Promise<UserProfile | null> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.coreTable, Key: { pk: `USER#${userId}`, sk: "PROFILE" } })
    );
    if (!res.Item) return null;
    const { userId: id, role, username, email, createdAt } = res.Item;
    return { userId: id, role, username, email, createdAt };
  }

  async putIfAbsent(profile: UserProfile): Promise<boolean> {
    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.coreTable,
          Item: { pk: `USER#${profile.userId}`, sk: "PROFILE", ...profile },
          ConditionExpression: "attribute_not_exists(pk)",
        })
      );
      return true;
    } catch (err) {
      if (esCondicionFallida(err)) return false;
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Consentimiento
// ---------------------------------------------------------------------------
export class DynamoConsentRepository implements ConsentRepository {
  constructor(private doc: DynamoDBDocumentClient, private coreTable: string) {}

  async get(userId: string): Promise<Consent | null> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.coreTable, Key: { pk: `USER#${userId}`, sk: "CONSENT" } })
    );
    if (!res.Item) return null;
    return { accepted: res.Item.accepted, version: res.Item.version, acceptedAt: res.Item.acceptedAt ?? null };
  }

  async put(userId: string, consent: Consent): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.coreTable,
        Item: { pk: `USER#${userId}`, sk: "CONSENT", ...consent },
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Sesiones
// ---------------------------------------------------------------------------
function aSesion(item: Item): Session {
  return {
    sessionId: String(item.pk).replace("SESSION#", ""),
    userId: item.userId,
    status: item.status,
    startedAt: item.startedAt,
    lastActivityAt: item.lastActivityAt,
    closedAt: item.closedAt ?? null,
    closeReason: item.closeReason ?? null,
    nextSeq: item.nextSeq,
    userMessageCount: item.userMessageCount,
    agentMessageCount: item.agentMessageCount,
  };
}

export class DynamoSessionRepository implements SessionRepository {
  constructor(private doc: DynamoDBDocumentClient, private coreTable: string) {}

  private key(sessionId: string) {
    return { pk: `SESSION#${sessionId}`, sk: "META" };
  }

  async create(session: Session): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.coreTable,
        Item: {
          ...this.key(session.sessionId),
          userId: session.userId,
          status: session.status,
          startedAt: session.startedAt,
          lastActivityAt: session.lastActivityAt,
          closedAt: session.closedAt,
          closeReason: session.closeReason,
          nextSeq: session.nextSeq,
          userMessageCount: session.userMessageCount,
          agentMessageCount: session.agentMessageCount,
          // Siempre: sesiones del usuario por fecha.
          gsi1pk: `USER#${session.userId}#SESSIONS`,
          gsi1sk: session.startedAt,
          // Solo mientras está activa: índice disperso de sesiones activas.
          ...(session.status === "active" ? { gsi2pk: "ACTIVE", gsi2sk: session.lastActivityAt } : {}),
        },
        ConditionExpression: "attribute_not_exists(pk)",
      })
    );
  }

  async get(sessionId: string): Promise<Session | null> {
    const res = await this.doc.send(new GetCommand({ TableName: this.coreTable, Key: this.key(sessionId) }));
    return res.Item ? aSesion(res.Item) : null;
  }

  async listByUser(userId: string, limit: number): Promise<Session[]> {
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.coreTable,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${userId}#SESSIONS` },
        ScanIndexForward: false, // la más nueva primero
        Limit: limit,
      })
    );
    return (res.Items ?? []).map(aSesion);
  }

  async close(sessionId: string, closedAt: string, reason: CloseReason) {
    try {
      const res = await this.doc.send(
        new UpdateCommand({
          TableName: this.coreTable,
          Key: this.key(sessionId),
          // Se cierra y se quitan las claves del índice de sesiones activas.
          UpdateExpression: "SET #status = :closed, closedAt = :t, closeReason = :r REMOVE gsi2pk, gsi2sk",
          // Solo si estaba activa: así un cierre repetido no modifica nada.
          ConditionExpression: "#status = :active",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":closed": "closed", ":active": "active", ":t": closedAt, ":r": reason },
          ReturnValues: "ALL_NEW",
        })
      );
      return { session: aSesion(res.Attributes as Item), changed: true };
    } catch (err) {
      if (!esCondicionFallida(err)) throw err;
      // No estaba activa: o ya estaba cerrada, o no existe.
      const actual = await this.get(sessionId);
      return actual ? { session: actual, changed: false } : null;
    }
  }

  async reserveSeq(sessionId: string, role: MessageRole, nowIso: string): Promise<number | null> {
    const contador = role === "user" ? "userMessageCount" : "agentMessageCount";
    try {
      const res = await this.doc.send(
        new UpdateCommand({
          TableName: this.coreTable,
          Key: this.key(sessionId),
          // ADD es atómico: dos pedidos simultáneos reciben números distintos.
          UpdateExpression: `ADD nextSeq :one, ${contador} :one SET lastActivityAt = :now, gsi2sk = :now`,
          ConditionExpression: "#status = :active",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":one": 1, ":now": nowIso, ":active": "active" },
          // Devuelve los valores anteriores: el nextSeq viejo es el número que me toca.
          ReturnValues: "UPDATED_OLD",
        })
      );
      return res.Attributes?.nextSeq as number;
    } catch (err) {
      if (esCondicionFallida(err)) return null;
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Mensajes (texto temporal)
// ---------------------------------------------------------------------------
export class DynamoMessageRepository implements MessageRepository {
  constructor(private doc: DynamoDBDocumentClient, private textTable: string) {}

  async put(message: Message): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.textTable, Item: { ...message } }));
  }

  async list(sessionId: string, now: Date): Promise<Message[]> {
    const ahoraSeg = Math.floor(now.getTime() / 1000);
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.textTable,
        KeyConditionExpression: "sessionId = :s",
        // DynamoDB puede tardar hasta 48 h en borrar un ítem vencido: se ignora igual.
        FilterExpression: "expiresAt > :ahora",
        ExpressionAttributeValues: { ":s": sessionId, ":ahora": ahoraSeg },
        ScanIndexForward: true,
      })
    );
    return (res.Items ?? []) as Message[];
  }
}
