// Pruebas de las operaciones reales del tramo 4A-1 (consentimiento, abrir y cerrar sesión),
// con repositorios en memoria. Cada pedido pasa por la app completa, así que el validador
// también comprueba que las respuestas cumplen el contrato.

import test from "node:test";
import assert from "node:assert/strict";
import { startTestApp, TestApp } from "./helpers";
import { buildGreeting, variantePara } from "../services/greeting";

// Prepara una app y le da un perfil de paciente con nombre conocido.
async function appConPaciente(now?: string): Promise<TestApp> {
  const app = await startTestApp({ now });
  await app.deps.users.putIfAbsent({
    userId: "user-1",
    role: "patient",
    username: "carlos",
    email: "carlos.perez@example.com",
    createdAt: "2026-10-01T10:00:00.000Z",
  });
  return app;
}

async function aceptarConsentimiento(app: TestApp, user = "user-1") {
  return app.call("PUT", "/me/consent", { user, body: { accepted: true, version: "1.0" } });
}

// ---------------------------------------------------------------------------
// Consentimiento
// ---------------------------------------------------------------------------
test("consentimiento: GET /me/consent sin respuesta previa devuelve no aceptado", async () => {
  const app = await appConPaciente();
  try {
    const res = await app.call("GET", "/me/consent");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { accepted: false, version: "1.0", acceptedAt: null });
  } finally {
    await app.close();
  }
});

test("consentimiento: aceptar, versión incorrecta y revocar", async () => {
  const app = await appConPaciente("2026-10-10T13:00:00.000Z");
  try {
    const aceptado = await aceptarConsentimiento(app);
    assert.equal(aceptado.status, 200);
    assert.equal(aceptado.body.accepted, true);
    assert.equal(aceptado.body.acceptedAt, "2026-10-10T13:00:00.000Z");

    // Se guardó: GET devuelve lo mismo.
    assert.deepEqual((await app.call("GET", "/me/consent")).body, aceptado.body);

    // Versión que no es la vigente -> 400 y no se modifica lo guardado.
    const mala = await app.call("PUT", "/me/consent", { body: { accepted: true, version: "9.9" } });
    assert.equal(mala.status, 400);
    assert.equal(mala.body.error, "invalid_consent_version");
    assert.deepEqual((await app.call("GET", "/me/consent")).body, aceptado.body);

    // Revocar se guarda como tal.
    const revocado = await app.call("PUT", "/me/consent", { body: { accepted: false, version: "1.0" } });
    assert.equal(revocado.status, 200);
    assert.deepEqual(revocado.body, { accepted: false, version: "1.0", acceptedAt: null });
    assert.equal((await app.call("GET", "/me/consent")).body.accepted, false);
  } finally {
    await app.close();
  }
});

test("GET /consent/terms devuelve la versión y el texto del archivo versionado", async () => {
  const app = await appConPaciente();
  try {
    const res = await app.call("GET", "/consent/terms");
    assert.equal(res.status, 200);
    assert.equal(res.body.version, "1.0");
    assert.match(res.body.text, /^ADEPT recopila indicadores/);
  } finally {
    await app.close();
  }
});

test("GET /me devuelve el perfil guardado con el consentimiento, y 404 si no hay perfil", async () => {
  const app = await appConPaciente();
  try {
    const res = await app.call("GET", "/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.username, "carlos");
    assert.equal(res.body.role, "patient");
    assert.equal(res.body.consent.accepted, false);

    const sinPerfil = await app.call("GET", "/me", { user: "otro-usuario" });
    assert.equal(sinPerfil.status, 404);
    assert.equal(sinPerfil.body.error, "profile_not_found");
  } finally {
    await app.close();
  }
});

// ---------------------------------------------------------------------------
// Abrir sesión
// ---------------------------------------------------------------------------
test("POST /sessions sin consentimiento responde 403 consent_required", async () => {
  const app = await appConPaciente();
  try {
    const res = await app.call("POST", "/sessions");
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "consent_required");

    // Con el consentimiento revocado o en otra versión tampoco alcanza.
    await aceptarConsentimiento(app);
    await app.call("PUT", "/me/consent", { body: { accepted: false, version: "1.0" } });
    assert.equal((await app.call("POST", "/sessions")).status, 403);
  } finally {
    await app.close();
  }
});

test("POST /sessions con consentimiento crea la sesión y el saludo no tiene datos personales", async () => {
  const app = await appConPaciente();
  try {
    await aceptarConsentimiento(app);
    const res = await app.call("POST", "/sessions");
    assert.equal(res.status, 201);
    assert.match(res.body.sessionId, /^sess_[0-9a-f]{32}$/);
    assert.equal(res.body.status, "active");

    const saludo: string = res.body.agentGreeting.text;
    assert.ok(saludo.length > 0);
    assert.doesNotMatch(saludo, /carlos|perez|example\.com/i);
    assert.doesNotMatch(saludo, /!!/);

    // El saludo quedó guardado como mensaje del agente con seq 1 (en la tabla de texto).
    const mensajes = await app.deps.messages.list(res.body.sessionId, new Date("2026-10-10T13:00:00.000Z"));
    assert.equal(mensajes.length, 1);
    assert.equal(mensajes[0].seq, 1);
    assert.equal(mensajes[0].role, "agent");
    assert.equal(mensajes[0].inputType, "greeting");
    assert.equal(mensajes[0].text, saludo);
  } finally {
    await app.close();
  }
});

test("POST /sessions cierra la sesión anterior con motivo replaced y la encola", async () => {
  const app = await appConPaciente();
  try {
    await aceptarConsentimiento(app);
    const primera = (await app.call("POST", "/sessions")).body.sessionId;
    const segunda = (await app.call("POST", "/sessions")).body.sessionId;
    assert.notEqual(primera, segunda);

    const vieja = await app.deps.sessions.get(primera);
    assert.equal(vieja?.status, "closed");
    assert.equal(vieja?.closeReason, "replaced");
    assert.equal((await app.deps.sessions.get(segunda))?.status, "active");
    assert.deepEqual(app.queue.enqueued, [primera]);
  } finally {
    await app.close();
  }
});

test("el saludo cambia según la hora de Buenos Aires (reloj inyectado)", async () => {
  const casos: Array<[string, RegExp]> = [
    ["2026-10-10T14:59:00.000Z", /^Buen(os)? d[ií]as?/], // 11:59 en Buenos Aires
    ["2026-10-10T15:00:00.000Z", /^Buenas tardes/], // 12:00
    ["2026-10-10T22:59:00.000Z", /^Buenas tardes/], // 19:59
    ["2026-10-10T23:00:00.000Z", /^Buenas noches/], // 20:00
    ["2026-10-10T05:00:00.000Z", /^Buen(os)? d[ií]as?/], // 02:00: antes de las 12 es "día" (ver decisión)
  ];
  for (const [hora, esperado] of casos) {
    const app = await appConPaciente(hora);
    try {
      await aceptarConsentimiento(app);
      const res = await app.call("POST", "/sessions");
      assert.match(res.body.agentGreeting.text, esperado, `hora ${hora}`);
    } finally {
      await app.close();
    }
  }
});

test("el saludo distingue la primera sesión de las posteriores", async () => {
  const app = await appConPaciente("2026-10-10T13:00:00.000Z");
  try {
    await aceptarConsentimiento(app);
    const primera = (await app.call("POST", "/sessions")).body.agentGreeting.text;
    const segunda = (await app.call("POST", "/sessions")).body.agentGreeting.text;
    assert.match(primera, /Soy ADEPT|gusto conocerte/);
    assert.match(segunda, /de nuevo|otra vez/);
  } finally {
    await app.close();
  }
});

test("la variante del saludo es determinística a partir del sessionId", () => {
  const ahora = new Date("2026-10-10T13:00:00.000Z");
  const id = "sess_0123456789abcdef0123456789abcdef";
  const a = buildGreeting({ sessionId: id, ahora, primeraSesion: false });
  const b = buildGreeting({ sessionId: id, ahora, primeraSesion: false });
  assert.equal(a, b);
  // Entre muchos ids aparecen las dos redacciones.
  const variantes = new Set(Array.from({ length: 20 }, (_, i) => variantePara(`sess_${i}`)));
  assert.deepEqual([...variantes].sort(), [0, 1]);
});

// ---------------------------------------------------------------------------
// Mensajes: numeración y vencimiento
// ---------------------------------------------------------------------------
test("seq: con pedidos simultáneos los números son correlativos y no se repiten", async () => {
  const app = await appConPaciente();
  try {
    await aceptarConsentimiento(app);
    const { sessionId } = (await app.call("POST", "/sessions")).body; // el saludo usa el seq 1
    const pedidos = Array.from({ length: 25 }, (_, i) =>
      app.deps.sessions.reserveSeq(sessionId, i % 2 === 0 ? "user" : "agent", "2026-10-10T13:00:01.000Z")
    );
    const numeros = (await Promise.all(pedidos)) as number[];
    assert.equal(new Set(numeros).size, 25);
    assert.deepEqual([...numeros].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 2));

    const sesion = await app.deps.sessions.get(sessionId);
    assert.equal(sesion?.nextSeq, 27);
    assert.equal((sesion?.userMessageCount ?? 0) + (sesion?.agentMessageCount ?? 0), 26);
  } finally {
    await app.close();
  }
});

test("los mensajes vencen a las 72 h y las lecturas ignoran los vencidos", async () => {
  const app = await appConPaciente("2026-10-10T13:00:00.000Z");
  try {
    await aceptarConsentimiento(app);
    const { sessionId } = (await app.call("POST", "/sessions")).body;

    const creado = new Date("2026-10-10T13:00:00.000Z");
    const vigentes = await app.deps.messages.list(sessionId, creado);
    assert.equal(vigentes.length, 1);
    assert.equal(vigentes[0].expiresAt, Math.floor(creado.getTime() / 1000) + 72 * 3600);

    // Justo antes de vencer se ve; después de vencer no, aunque el ítem siga guardado.
    assert.equal((await app.deps.messages.list(sessionId, new Date("2026-10-13T12:59:59.000Z"))).length, 1);
    assert.equal((await app.deps.messages.list(sessionId, new Date("2026-10-13T13:00:01.000Z"))).length, 0);
  } finally {
    await app.close();
  }
});

// ---------------------------------------------------------------------------
// Cerrar sesión
// ---------------------------------------------------------------------------
test("close: el dueño cierra, otro usuario recibe 404 y repetir devuelve el mismo resumen", async () => {
  const app = await appConPaciente("2026-10-10T13:00:00.000Z");
  try {
    await aceptarConsentimiento(app);
    const { sessionId } = (await app.call("POST", "/sessions")).body;

    // Otro usuario: 404 (no 403) y no se cierra nada.
    const ajeno = await app.call("POST", `/sessions/${sessionId}/close`, { user: "user-2" });
    assert.equal(ajeno.status, 404);
    assert.equal(ajeno.body.error, "not_found");
    assert.equal((await app.deps.sessions.get(sessionId))?.status, "active");

    // Una sesión que no existe también da 404.
    assert.equal((await app.call("POST", "/sessions/sess_inexistente/close")).status, 404);

    // El dueño cierra 90 segundos después.
    app.setNow("2026-10-10T13:01:30.000Z");
    const cierre = await app.call("POST", `/sessions/${sessionId}/close`);
    assert.equal(cierre.status, 200);
    assert.equal(cierre.body.status, "closed");
    assert.deepEqual(cierre.body.summary, { messageCount: 1, exercisesCompleted: 0, durationSeconds: 90 });
    assert.deepEqual(app.queue.enqueued, [sessionId]);

    // Repetido: mismo resumen, aunque pase el tiempo, y no se vuelve a encolar.
    app.setNow("2026-10-10T14:00:00.000Z");
    const repetido = await app.call("POST", `/sessions/${sessionId}/close`);
    assert.deepEqual(repetido.body, cierre.body);
    assert.deepEqual(app.queue.enqueued, [sessionId]);

    // Quedó cerrada con motivo "user" y sin las claves del índice de activas (en memoria: closedAt fijo).
    const guardada = await app.deps.sessions.get(sessionId);
    assert.equal(guardada?.closeReason, "user");
    assert.equal(guardada?.closedAt, "2026-10-10T13:01:30.000Z");
  } finally {
    await app.close();
  }
});

test("close: el rol profesional no puede cerrar sesiones (403)", async () => {
  const app = await appConPaciente();
  try {
    const res = await app.call("POST", "/sessions/sess_x/close", { role: "professional" });
    assert.equal(res.status, 403);
  } finally {
    await app.close();
  }
});

// ---------------------------------------------------------------------------
// Errores inesperados
// ---------------------------------------------------------------------------
test("una falla inesperada de la base responde 500 internal_error sin detalles", async () => {
  const app = await appConPaciente();
  try {
    app.deps.users.get = async () => {
      throw new Error("detalle interno que el cliente no debe ver");
    };
    const res = await app.call("GET", "/me");
    assert.equal(res.status, 500);
    assert.equal(res.body.error, "internal_error");
    assert.doesNotMatch(JSON.stringify(res.body), /detalle interno/);
  } finally {
    await app.close();
  }
});
