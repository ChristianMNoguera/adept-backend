// Dependencias de la lógica real: repositorios, cola, reloj y generador de ids.
// Las rutas y los servicios las reciben por parámetro; las pruebas pasan versiones en memoria.

import { randomBytes } from "crypto";
import {
  ConsentRepository,
  MessageRepository,
  SessionRepository,
  UserRepository,
} from "./repositories/types";
import { LogSessionProcessingQueue, SessionProcessingQueue } from "./services/queue";

export interface AppDeps {
  users: UserRepository;
  consents: ConsentRepository;
  sessions: SessionRepository;
  messages: MessageRepository;
  queue: SessionProcessingQueue;
  // Reloj inyectable: las pruebas lo fijan para controlar la hora.
  clock: () => Date;
  // Id de sesión aleatorio y no adivinable.
  newSessionId: () => string;
  // Horas que vive el texto antes de vencer (variable TEXT_TTL_HOURS, 72 por defecto).
  textTtlHours: number;
}

export function randomSessionId(): string {
  return `sess_${randomBytes(16).toString("hex")}`;
}

export function textTtlHoursFromEnv(): number {
  const valor = Number(process.env.TEXT_TTL_HOURS ?? 72);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`TEXT_TTL_HOURS inválida: "${process.env.TEXT_TTL_HOURS}". Tiene que ser un número mayor que 0.`);
  }
  return valor;
}

// Dependencias reales (DynamoDB). Falla al arrancar si faltan los nombres de las tablas.
export function createDefaultDeps(): AppDeps {
  const coreTable = process.env.CORE_TABLE;
  const textTable = process.env.TEXT_TABLE;
  const faltan: string[] = [];
  if (!coreTable) faltan.push("CORE_TABLE");
  if (!textTable) faltan.push("TEXT_TABLE");
  if (faltan.length > 0) {
    throw new Error(`DATA_SOURCE=hybrid o real necesita estas variables de entorno: ${faltan.join(", ")}.`);
  }

  // Se carga el SDK de AWS recién acá: en modo mock no hace falta.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dynamo = require("./repositories/dynamo") as typeof import("./repositories/dynamo");
  const doc = dynamo.createDocClient();

  return {
    users: new dynamo.DynamoUserRepository(doc, coreTable as string),
    consents: new dynamo.DynamoConsentRepository(doc, coreTable as string),
    sessions: new dynamo.DynamoSessionRepository(doc, coreTable as string),
    messages: new dynamo.DynamoMessageRepository(doc, textTable as string),
    queue: new LogSessionProcessingQueue(),
    clock: () => new Date(),
    newSessionId: randomSessionId,
    textTtlHours: textTtlHoursFromEnv(),
  };
}
