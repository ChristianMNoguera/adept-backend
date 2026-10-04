// Panel de seguimiento del profesional (CU05): invitaciones, pacientes,
// dashboard, historial e indicadores. Deben coincidir con contracts/openapi.yaml.

import { Router } from "express";
import {
  invitation,
  patientsList,
  patientProfile,
  dashboard,
  history,
  sessionIndicators,
} from "../mocks/professional";

export const professionalRouter = Router();

// Generar un código de invitación para vincular a un paciente.
professionalRouter.post("/professional/invitations", (_req, res) => {
  res.status(201).json(invitation);
});

// Pacientes vinculados al profesional.
professionalRouter.get("/professional/patients", (_req, res) => {
  res.status(200).json(patientsList);
});

// Datos personales del paciente.
professionalRouter.get("/professional/patients/:patientId", (_req, res) => {
  res.status(200).json(patientProfile);
});

// Actualizar datos personales del paciente.
professionalRouter.put("/professional/patients/:patientId", (_req, res) => {
  res.status(200).json(patientProfile);
});

// Dashboard de evolución.
professionalRouter.get("/professional/patients/:patientId/dashboard", (_req, res) => {
  res.status(200).json(dashboard);
});

// Evolución histórica por sesión.
professionalRouter.get("/professional/patients/:patientId/history", (_req, res) => {
  res.status(200).json(history);
});

// Detalle de variación de una sesión frente a la línea de base.
professionalRouter.get(
  "/professional/patients/:patientId/sessions/:sessionId/indicators",
  (_req, res) => {
    res.status(200).json(sessionIndicators);
  }
);
