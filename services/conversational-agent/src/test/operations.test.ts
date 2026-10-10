// Pruebas del registro de operaciones y de la elección del origen de datos.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { OPERATIONS, findOperation } from "../config/operations";
import { getDataSource } from "../config/dataSource";
import { createApp } from "../app";
import { startTestApp } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require("js-yaml");

// Desde dist/test hasta contracts/openapi.yaml.
const CONTRATO = path.resolve(__dirname, "../../../../contracts/openapi.yaml");

function operacionesDelContrato(): string[] {
  const spec = yaml.load(fs.readFileSync(CONTRATO, "utf8"));
  const lista: string[] = [];
  for (const [ruta, item] of Object.entries<any>(spec.paths)) {
    for (const metodo of ["get", "post", "put", "delete"]) {
      if (item[metodo]) lista.push(`${metodo.toUpperCase()} ${ruta}`);
    }
  }
  return lista.sort();
}

test("el registro cubre exactamente las 25 operaciones del contrato", () => {
  const delContrato = operacionesDelContrato();
  const delRegistro = OPERATIONS.map((op) => `${op.method} ${op.path}`).sort();
  assert.equal(delContrato.length, 25);
  // Falta en el registro:
  assert.deepEqual(delContrato.filter((o) => !delRegistro.includes(o)), []);
  // Sobra en el registro (no existe en el contrato):
  assert.deepEqual(delRegistro.filter((o) => !delContrato.includes(o)), []);
  assert.equal(new Set(delRegistro).size, delRegistro.length, "hay operaciones repetidas");
});

test("findOperation encuentra operaciones con parámetros", () => {
  assert.equal(findOperation("POST", "/sessions/sess_abc/close")?.implemented, true);
  assert.equal(findOperation("POST", "/sessions/sess_abc/messages")?.implemented, false);
  assert.equal(findOperation("GET", "/nada"), undefined);
});

test("DATA_SOURCE inválido falla con un mensaje claro", () => {
  process.env.DATA_SOURCE = "otro";
  assert.throws(() => getDataSource(), /DATA_SOURCE inválido/);
  assert.throws(() => createApp(), /DATA_SOURCE inválido/);
});

test("hybrid: lo implementado usa la lógica real y el resto sigue en mock", async () => {
  const app = await startTestApp({ dataSource: "hybrid" });
  try {
    // Real: sin perfil guardado responde 404 profile_not_found.
    const real = await app.call("GET", "/me");
    assert.equal(real.status, 404);
    assert.equal(real.body.error, "profile_not_found");
    // Mock: devuelve el dato fijo del contrato.
    const mock = await app.call("GET", "/me/privacy");
    assert.equal(mock.status, 200);
    assert.equal(mock.body.linguisticIndicators, true);
  } finally {
    await app.close();
  }
});

test("real: lo no implementado responde 501 y lo implementado funciona", async () => {
  const app = await startTestApp({ dataSource: "real" });
  try {
    const noImpl = await app.call("GET", "/me/privacy");
    assert.equal(noImpl.status, 501);
    assert.equal(noImpl.body.error, "not_implemented");
    const impl = await app.call("GET", "/consent/terms");
    assert.equal(impl.status, 200);
    const salud = await app.call("GET", "/health");
    assert.equal(salud.status, 200);
  } finally {
    await app.close();
  }
});

test("mock: todo responde con datos fijos aunque haya lógica real", async () => {
  const app = await startTestApp({ dataSource: "mock" });
  try {
    const res = await app.call("GET", "/me");
    assert.equal(res.status, 200);
    assert.equal(res.body.userId, "pat_4471");
  } finally {
    await app.close();
  }
});
