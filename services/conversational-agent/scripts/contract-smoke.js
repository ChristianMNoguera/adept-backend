// Prueba de humo del contrato: con el servidor corriendo, llama a cada operación
// de contracts/openapi.yaml y verifica que responda con el primer status 2xx declarado.
// Uso: npm run smoke   (la URL base sale de BASE_URL, por defecto http://localhost:3000)

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SPEC_PATH = path.resolve(__dirname, "../../../contracts/openapi.yaml");
const METHODS = ["get", "post", "put", "patch", "delete"];

async function main() {
  const spec = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));
  let failures = 0;
  let total = 0;

  for (const [route, pathItem] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      total++;

      // Cada {parametro} de la ruta se reemplaza por x_1.
      const url = BASE_URL + route.replace(/\{[^}]+\}/g, "x_1");

      // Rol que pide la operación (si es "any" o "none", se usa patient).
      const required = operation["x-required-role"];
      const role = required === "professional" ? "professional" : "patient";

      // Status esperado: el primer código 2xx declarado.
      const expected = Object.keys(operation.responses).find((code) => code.startsWith("2"));

      // Body: el example del requestBody, si existe.
      const bodyExample = operation.requestBody?.content?.["application/json"]?.example;
      const headers = { "x-mock-role": role };
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
