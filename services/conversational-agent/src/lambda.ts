// Punto de entrada en AWS Lambda: envuelve la misma app Express de src/app.ts.
// La app se crea una sola vez, fuera del handler, así se reutiliza entre invocaciones.

import serverlessExpress from "@codegenie/serverless-express";
import { createApp } from "./app";
import { getDataSource } from "./config/dataSource";
import { describeRealOperations } from "./config/operations";

const app = createApp();

// Una línea al arrancar (en frío) con las operaciones que usan lógica real.
if (getDataSource() !== "mock") console.log(describeRealOperations());

export const handler = serverlessExpress({ app });
