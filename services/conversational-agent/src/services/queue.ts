// Cola de procesamiento de sesiones cerradas (ADR-0011): al cerrar una sesión se encola una
// única tarea por sesión. La cola real (SQS) llega en el tramo 4C; por ahora solo se deja un
// registro en el log, con el id de la sesión y nada de texto.

export interface SessionProcessingQueue {
  enqueue(sessionId: string): Promise<void>;
}

export class LogSessionProcessingQueue implements SessionProcessingQueue {
  async enqueue(sessionId: string): Promise<void> {
    console.log(`[cola] sesión encolada para procesamiento: ${sessionId}`);
  }
}
