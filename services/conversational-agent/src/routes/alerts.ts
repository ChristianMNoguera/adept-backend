// Centro de alertas de anomalía (CU06).
// Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import { alertsList, alertDetail, alertReviewed } from "../mocks/alerts";

export const alertsRouter = Router();

// Lista de alertas.
alertsRouter.get("/professional/alerts", (_req, res) => {
  res.status(200).json(alertsList);
});

// Detalle de una alerta.
alertsRouter.get("/professional/alerts/:alertId", (_req, res) => {
  res.status(200).json(alertDetail);
});

// Marcar una alerta como revisada.
alertsRouter.post("/professional/alerts/:alertId/review", (_req, res) => {
  res.status(200).json(alertReviewed);
});
