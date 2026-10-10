// Express 4 no atrapa los errores de las funciones async: este envoltorio los manda
// al manejador final de errores (middleware/errorHandler.ts).

import { Request, Response, NextFunction, RequestHandler } from "express";

export function asyncHandler(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}
