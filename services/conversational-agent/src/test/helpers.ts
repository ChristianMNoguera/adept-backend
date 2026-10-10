// Ayudas para las pruebas: arman la app completa con repositorios en memoria, un reloj
// controlable y una cola falsa, y la ponen a escuchar en un puerto libre.

import { AddressInfo } from "net";
import { Server } from "http";
import { createApp } from "../app";
import { AppDeps, randomSessionId } from "../deps";
import {
  MemoryConsentRepository,
  MemoryMessageRepository,
  MemorySessionRepository,
  MemoryUserRepository,
} from "../repositories/memory";
import { SessionProcessingQueue } from "../services/queue";

// Cola falsa: guarda los ids encolados para poder revisarlos.
export class FakeQueue implements SessionProcessingQueue {
  enqueued: string[] = [];
  async enqueue(sessionId: string) {
    this.enqueued.push(sessionId);
  }
}

export interface TestApp {
  baseUrl: string;
  deps: AppDeps;
  queue: FakeQueue;
  setNow(fecha: string): void;
  close(): Promise<void>;
  // Pedido HTTP con los headers de prueba (AUTH_MODE=mock).
  call(method: string, path: string, opciones?: { user?: string; role?: string; body?: unknown }): Promise<{ status: number; body: any }>;
}

export async function startTestApp(opciones: { dataSource?: string; now?: string } = {}): Promise<TestApp> {
  process.env.DATA_SOURCE = opciones.dataSource ?? "hybrid";
  process.env.AUTH_MODE = "mock";

  let ahora = new Date(opciones.now ?? "2026-10-10T13:00:00.000Z");
  const queue = new FakeQueue();
  const deps: AppDeps = {
    users: new MemoryUserRepository(),
    consents: new MemoryConsentRepository(),
    sessions: new MemorySessionRepository(),
    messages: new MemoryMessageRepository(),
    queue,
    clock: () => ahora,
    newSessionId: randomSessionId,
    textTtlHours: 72,
  };

  const app = createApp({ deps });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    baseUrl,
    deps,
    queue,
    setNow: (fecha: string) => {
      ahora = new Date(fecha);
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
    call: async (method, path, o = {}) => {
      const res = await fetch(baseUrl + path, {
        method,
        headers: {
          "x-mock-role": o.role ?? "patient",
          "x-mock-user-id": o.user ?? "user-1",
          ...(o.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      });
      const texto = await res.text();
      return { status: res.status, body: texto ? JSON.parse(texto) : undefined };
    },
  };
}
