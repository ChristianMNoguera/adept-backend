// Configuración de CORS: permite que el panel web (que corre en un navegador)
// pueda llamar a esta API desde otro origen. La app mobile nativa no lo necesita.

import cors from "cors";
import { isMockMode } from "./dataSource";

// CORS_ORIGINS es una lista separada por comas, por ejemplo:
//   CORS_ORIGINS=http://localhost:5173,https://panel.adept.example   (o "*" para cualquiera)
function parseOrigins(): string[] | null {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || raw.trim() === "") return null;
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function createCors() {
  const origins = parseOrigins();

  // Sin lista: se permite cualquier origen, pero solo mientras estemos en modo mock.
  // En modo real y sin lista, no se permite ningún origen.
  // Un "*" en la lista también significa "cualquier origen" (lo usa el entorno de desarrollo en AWS).
  const origin = origins?.includes("*") ? true : origins ?? (isMockMode() ? true : false);

  // El paquete "cors" responde solo los pedidos de preflight (OPTIONS).
  return cors({
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "x-mock-role", "x-mock-user-id", "x-mock-consent"],
  });
}
