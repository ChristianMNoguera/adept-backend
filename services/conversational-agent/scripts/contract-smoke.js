// Prueba de humo del contrato: con el servidor corriendo, llama a cada operación
// de contracts/openapi.yaml y verifica que responda con el primer status 2xx declarado.
// Uso: npm run smoke   (la URL base sale de BASE_URL, por defecto http://localhost:3000)
// Si existen AUTH_TOKEN_PATIENT y AUTH_TOKEN_PROFESSIONAL se usan tokens reales de Cognito
// (Authorization: Bearer ...) en vez de los headers x-mock-*; sirve para probar la URL desplegada.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SPEC_PATH = path.resolve(__dirname, "../../../contracts/openapi.yaml");
const TOKEN_PATIENT = process.env.AUTH_TOKEN_PATIENT;
const TOKEN_PROFESSIONAL = process.env.AUTH_TOKEN_PROFESSIONAL;
const USAR_TOKENS = Boolean(TOKEN_PATIENT && TOKEN_PROFESSIONAL);
const METHODS = ["get", "post", "put", "patch", "delete"];

// Arma el "?a=1&b=2" con los parámetros de query requeridos de la operación.
// Valor: el primer elemento del enum si existe, y "x" si no.
function queryRequerida(spec, operation) {
  const partes = [];
  for (const param of operation.parameters || []) {
    // Un parámetro puede ser una referencia ($ref) a components/parameters.
    const def = param.$ref ? spec.components.parameters[param.$ref.split("/").pop()] : param;
    if (def.in !== "query" || !def.required) continue;
    const valor = def.schema?.enum ? def.schema.enum[0] : "x";
    partes.push(`${encodeURIComponent(def.name)}=${encodeURIComponent(valor)}`);
  }
  return partes.length ? "?" + partes.join("&") : "";
}

async function main() {
  const spec = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));
  let failures = 0;
  let total = 0;
  // Id de la sesión que devolvió POST /sessions en esta corrida: los pasos siguientes que
  // llevan {sessionId} lo usan (en modo mock el valor coincide con el del ejemplo).
  let sessionId = null;

  for (const [route, pathItem] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      total++;

      // Cada {parametro} de la ruta se reemplaza por x_1 (menos {sessionId}, que usa el id real
      // devuelto por POST /sessions). A eso se le suman los parámetros de query requeridos.
      const ruta = route.replace(/\{([^}]+)\}/g, (_, nombre) => (nombre === "sessionId" && sessionId ? sessionId : "x_1"));
      const url = BASE_URL + ruta + queryRequerida(spec, operation);

      // Rol que pide la operación (si es "any" o "none", se usa patient).
      const required = operation["x-required-role"];
      const role = required === "professional" ? "professional" : "patient";

      // Status esperado: el primer código 2xx declarado.
      const expected = Object.keys(operation.responses).find((code) => code.startsWith("2"));

      // Body: el example del requestBody, si existe.
      const bodyExample = operation.requestBody?.content?.["application/json"]?.example;
      const headers = USAR_TOKENS
        ? { Authorization: `Bearer ${role === "professional" ? TOKEN_PROFESSIONAL : TOKEN_PATIENT}` }
        : { "x-mock-role": role };
      if (bodyExample !== undefined) headers["Content-Type"] = "application/json";

      const label = `${method.toUpperCase().padEnd(6)} ${route}`;
      try {
        const res = await fetch(url, {
          method: method.toUpperCase(),
          headers,
          body: bodyExample !== undefined ? JSON.stringify(bodyExample) : undefined,
        });
        if (String(res.status) === expected) {
          console.log(`ok   ${label} -> ${res.status}`);
          // Guarda el id de la sesión creada para los pasos que vienen después.
          if (method === "post" && route === "/sessions") sessionId = (await res.json()).sessionId;
        } else {
          failures++;
          console.log(`FAIL ${label} -> ${res.status} (esperado ${expected}) ${await res.text()}`);
        }
      } catch (err) {
        failures++;
        console.log(`FAIL ${label} -> ${err.message}`);
      }
    }
  }

  console.log(`\n${total - failures}/${total} operaciones ok`);
  process.exit(failures > 0 ? 1 : 0);
}

main();
