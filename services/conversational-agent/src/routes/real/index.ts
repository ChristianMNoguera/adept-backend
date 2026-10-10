// Junta las rutas con lógica real. Se usan cuando DATA_SOURCE es hybrid (operaciones implementadas)
// o real (ver src/middleware/dataSourceSwitch.ts).

import { Router } from "express";
import { AppDeps } from "../../deps";
import { createRealMeRouter } from "./me";
import { createRealSessionsRouter } from "./sessions";

export function createRealRouter(deps: AppDeps) {
  const router = Router();
  router.use(createRealMeRouter(deps));
  router.use(createRealSessionsRouter(deps));
  return router;
}
