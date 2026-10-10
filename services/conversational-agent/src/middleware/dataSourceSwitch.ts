// Elige, para cada pedido, si lo atiende la versión real o la mock de la operación:
//   - mock:   siempre el mock.
//   - hybrid: el real si la operación está implementada, el mock si no.
//   - real:   siempre el real (las no implementadas ya recibieron 501 antes, ver notImplemented.ts).

import { Request, Response, NextFunction, RequestHandler } from "express";
import { getDataSource } from "../config/dataSource";
import { findOperation } from "../config/operations";

export function dataSourceSwitch(mockHandler: RequestHandler, realHandler: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    const modo = getDataSource();
    const implementada = findOperation(req.method, req.path)?.implemented === true;
    const usarReal = modo === "real" || (modo === "hybrid" && implementada);
    return (usarReal ? realHandler : mockHandler)(req, res, next);
  };
}
