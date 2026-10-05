// Punto de entrada en AWS Lambda: envuelve la misma app Express de src/app.ts.
// La app se crea una sola vez, fuera del handler, así se reutiliza entre invocaciones.

import serverlessExpress from "@codegenie/serverless-express";
import { createApp } from "./app";

const app = createApp();

export const handler = serverlessExpress({ app });
