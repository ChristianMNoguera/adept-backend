# ADR-0014: Persistencia en DynamoDB, vencimiento del texto y modo de datos híbrido

- **Fecha:** 2026-10-10
- **Estado:** En revision
- **Extiende a:** ADR-0004 (no lo reemplaza: agrega un tercer valor)

## Contexto

Hasta el ADR-0013 el servicio desplegado responde con datos fijos. El Hito 4 incorpora
la lógica real. La tesis (sección 3.3.4) separa la base de sesiones, el almacenamiento
temporal del texto y la base de métricas, y el RNF07 prohíbe guardar el texto de forma
permanente. Además, el frontend integra contra el entorno desplegado mientras se migra, así
que un cambio de todo o nada (ADR-0004: `real` responde 501 en todo lo no implementado)
lo dejaría sin entorno usable.

## Decisión

- **Dos tablas DynamoDB ahora, una tercera en el tramo 4C.**
  - `core`: usuarios, consentimiento, sesiones (metadatos), resultados de ejercicios y,
    más adelante, vínculos y preferencias. Clave `pk`/`sk` y dos índices secundarios
    genéricos: GSI1 (sesiones de un usuario por fecha) y GSI2 (sesiones activas por última
    actividad, solo presente mientras la sesión está activa).
  - `text`: mensajes de la conversación (clave `sessionId`/`seq`), con vencimiento
    automático (TTL) en `expiresAt`.
  - `metrics` (tramo 4C): métricas derivadas, que son lo único permanente además de los
    metadatos (RF12).
- **Vencimiento del texto:** 72 horas desde su creación. DynamoDB puede demorar hasta 48 h
  en borrar un ítem vencido, por lo que el código ignora los ítems con `expiresAt` en el
  pasado. El procesamiento por lotes descarta el texto apenas termina (ADR-0011), sin
  esperar al TTL.
- **Pago por uso, cifrado en reposo por defecto, sin recuperación a un punto en el
  tiempo**, y política de borrado `DESTROY` (coherente con el ADR-0013).
- **`DATA_SOURCE=hybrid`:** un registro en el código lista las 25 operaciones del contrato
  y marca cuáles tienen implementación real. En modo híbrido se usa la real cuando existe y
  el mock en caso contrario; con `real` se mantiene el 501 en lo no implementado. Una
  prueba automática exige que el registro cubra todas las operaciones del contrato.
- **Autorización por pertenencia:** una sesión de otro usuario responde 404, no 403, para
  no revelar que existe.
- **Permisos mínimos:** la función de la API recibe solo las acciones que necesita sobre
  las tablas y sus índices.

## Alternativas consideradas

- **Una sola tabla:** más simple, pero mezcla el texto temporal con los datos permanentes y
  contradice la separación que describe la tesis.
- **Tres tablas desde ya:** la de métricas no tiene uso hasta el procesamiento por lotes.
- **`REAL_AREAS` por etiqueta del contrato:** granularidad insuficiente, porque `DELETE /me`
  está en la misma etiqueta que `GET /me` y necesita lógica de otro tramo.
- **Mantener todo mock hasta terminar:** deja el riesgo de integración al final.

## Consecuencias

- Mientras `DELETE /me` siga en mock, eliminar la cuenta no borra nada (se resuelve en el
  tramo 4B).
- En modo híbrido hay combinaciones inconsistentes entre operaciones reales y mock (por
  ejemplo, enviar un mensaje a una sesión real antes de que los mensajes sean reales). Se
  aceptan solo durante la migración.
- Las pruebas del servicio usan repositorios en memoria; la integración con DynamoDB se
  verifica con el despliegue real.
