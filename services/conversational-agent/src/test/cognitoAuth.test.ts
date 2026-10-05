// Pruebas del middleware de Cognito con un verificador falso (sin red).
// Se corren con: npm test

import test from "node:test";
import assert from "node:assert/strict";
import { cognitoAuth, TokenVerifier } from "../middleware/cognitoAuth";

// Verificador falso: acepta solo el token "valido" y devuelve los grupos indicados.
function fakeVerifier(groups?: string[]): TokenVerifier {
  return {
    async verify(token: string) {
      if (token !== "valido") throw new Error("token inválido");
      return { sub: "user-123", "cognito:groups": groups };
    },
  };
}

// Pedido falso: solo lo que usa el middleware (header Authorization y la operación del contrato).
function fakeReq(authorization: string | undefined, requiredRole: string = "patient") {
  return {
    header: (name: string) => (name.toLowerCase() === "authorization" ? authorization : undefined),
    openapi: { schema: { "x-required-role": requiredRole } },
  } as any;
}

// Respuesta falsa: guarda el status y el cuerpo.
function fakeRes() {
  const res: any = { statusCode: 0, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

// Ejecuta el middleware y dice si llamó a next().
async function run(verifier: TokenVerifier, req: any) {
  const res = fakeRes();
  let nextCalled = false;
  await cognitoAuth(verifier)(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("sin token responde 401", async () => {
  const { res, nextCalled } = await run(fakeVerifier(["patients"]), fakeReq(undefined));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "unauthorized");
  assert.equal(nextCalled, false);
});

test("token inválido responde 401", async () => {
  const { res } = await run(fakeVerifier(["patients"]), fakeReq("Bearer cualquiera"));
  assert.equal(res.statusCode, 401);
});

test("token con grupo patients -> rol patient", async () => {
  const req = fakeReq("Bearer valido");
  const { nextCalled } = await run(fakeVerifier(["patients"]), req);
  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { userId: "user-123", role: "patient" });
});

test("token con grupo professionals -> rol professional", async () => {
  const req = fakeReq("Bearer valido");
  await run(fakeVerifier(["professionals"]), req);
  assert.equal(req.user.role, "professional");
});

test("grupo desconocido responde 403", async () => {
  const { res, nextCalled } = await run(fakeVerifier(["otro"]), fakeReq("Bearer valido"));
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "forbidden");
  assert.equal(nextCalled, false);
});

test("usuario sin grupos responde 403", async () => {
  const { res } = await run(fakeVerifier(undefined), fakeReq("Bearer valido"));
  assert.equal(res.statusCode, 403);
});

test("operación pública sin token pasa", async () => {
  const { res, nextCalled } = await run(fakeVerifier(["patients"]), fakeReq(undefined, "none"));
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 0);
});
