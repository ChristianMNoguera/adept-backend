// Pruebas del texto del consentimiento: tiene que ser texto plano y estar completo.

import test from "node:test";
import assert from "node:assert/strict";
import { currentTerms } from "../services/consent";
import { consentTerms } from "../mocks/me";

const { version, text } = currentTerms();

test("el texto del consentimiento no tiene marcadores pendientes ni símbolos de Markdown", () => {
  assert.equal(text.includes("[COMPLETAR"), false, "quedó un marcador [COMPLETAR");
  assert.equal(text.includes("*"), false, "hay un asterisco");
  assert.equal(text.includes("#"), false, "hay un numeral");
  assert.equal(text.includes("`"), false, "hay una comilla invertida");
});

test("el texto del consentimiento tiene las 8 secciones y las listas con guion", () => {
  for (let n = 1; n <= 8; n++) assert.match(text, new RegExp(`(^|\n)${n}\. [^\n]+\n\n`), `falta el título ${n}`);
  assert.equal(text.split("\n").filter((l) => l.startsWith("- ")).length, 4);
  assert.match(text, /Contacto: adept@adept\.com\.$/);
});

test("el mock devuelve la misma versión y el mismo texto que la lógica real", () => {
  assert.deepEqual(consentTerms, { version, text });
  assert.equal(version, "1.1");
});
