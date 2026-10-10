// Corre todas las pruebas compiladas (dist/test/*.test.js) con el runner de Node.
// Se usa un script (y no un glob) para que funcione igual en Windows y en cualquier versión de Node.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const carpeta = path.resolve(__dirname, "../dist/test");
const archivos = fs
  .readdirSync(carpeta)
  .filter((nombre) => nombre.endsWith(".test.js"))
  .map((nombre) => path.join(carpeta, nombre));

const resultado = spawnSync(process.execPath, ["--test", ...archivos], { stdio: "inherit" });
process.exit(resultado.status ?? 1);
