// Autenticación real con Amazon Cognito: verifica el token de acceso que viene en
// "Authorization: Bearer <token>" y deja la identidad en req.user (igual que mockAuth).

import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { OpenApiRequest } from "express-openapi-validator/dist/framework/types";
import type { Role } from "./mockAuth";

// Lo mínimo que necesitamos de un verificador. Es una interfaz propia para poder
// inyectar uno falso en las pruebas (sin red).
export interface TokenVerifier {
  verify(token: string): Promise<{ sub: string; "cognito:groups"?: string[] }>;
}

// Crea el verificador real. Falla al arrancar si falta alguna variable.
export function createCognitoVerifier(): TokenVerifier {
  const userPoolId = process.env.USER_POOL_ID;
  const clientIds = (process.env.COGNITO_CLIENT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const faltan: string[] = [];
  if (!userPoolId) faltan.push("USER_POOL_ID");
  if (clientIds.length === 0) faltan.push("COGNITO_CLIENT_IDS");
  if (faltan.length > 0) {
    throw new Error(
      `AUTH_MODE=cognito necesita estas variables de entorno: ${faltan.join(", ")}. ` +
        "COGNITO_CLIENT_IDS es una lista separada por comas."
    );
  }

  return CognitoJwtVerifier.create({
    userPoolId: userPoolId as string,
    tokenUse: "access",
    clientId: clientIds,
  });
}

// Grupo de Cognito -> rol de la API.
function roleFromGroups(groups: string[] | undefined): Role | null {
  if (groups?.includes("patients")) return "patient";
  if (groups?.includes("professionals")) return "professional";
  return null;
}

export function cognitoAuth(verifier: TokenVerifier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Las operaciones públicas (x-required-role: none, ej. /health) no piden token.
    const operation = (req as OpenApiRequest).openapi?.schema as Record<string, unknown> | undefined;
    if (operation?.["x-required-role"] === "none") return next();

    // Token: "Authorization: Bearer <token>".
    const match = /^Bearer (.+)$/.exec(req.header("authorization") ?? "");
    if (!match) {
      return res.status(401).json({ error: "unauthorized", message: "Token ausente o inválido" });
    }

    let payload;
    try {
      payload = await verifier.verify(match[1]);
    } catch {
      // Firma inválida, token vencido, otro pool, etc.
      return res.status(401).json({ error: "unauthorized", message: "Token ausente o inválido" });
    }

    // Usuario válido, pero sin ninguno de los grupos conocidos.
    const role = roleFromGroups(payload["cognito:groups"]);
    if (!role) {
      return res.status(403).json({ error: "forbidden", message: "No tenés permiso para esta operación" });
    }

    req.user = { userId: payload.sub, role };
    next();
  };
}
