# ADR-0008: Alcance del MVP del backend (corrige el ADR-0006)

- **Fecha:** 2026-09-30
- **Estado:** Aceptada
- **Reemplaza a:** ADR-0006

## Contexto

El ADR-0006 describió el alcance con una numeración incorrecta: llamó "CU01
(registro/perfil)" a un caso de uso que, según el documento de requisitos, es
"Iniciar sesión conversacional". El registro corresponde a los requerimientos
funcionales RF01 a RF04, no a un caso de uso. Además, el documento de la tesis
incluye un séptimo caso de uso (CU07, eliminar cuenta) y 20 requerimientos
funcionales que el ADR no recogía.

## Decisión

El MVP del backend cubre los siete casos de uso y los requerimientos funcionales
RF01 a RF20:

- Lado del adulto mayor: CU01 (iniciar sesión conversacional), CU02 (interactuar),
  CU03 (completar ejercicio integrado), CU04 (configurar privacidad) y CU07
  (eliminar cuenta).
- Lado del profesional: CU05 (consultar panel de seguimiento) y CU06 (recibir
  notificación de anomalía).
- Gestión de usuarios: registro y autenticación (RF01, RF02) con Amazon Cognito
  (ADR-0010); vinculación por código de invitación (RF03); consentimiento
  informado revocable (RF04).

Siguen fuera del MVP la configuración a nivel institucional (valores por defecto,
gestión de roles profesionales, política de retención) y las notificaciones push
(el RF18 pide la notificación en el módulo de reportería).

## Consecuencias

- El contrato OpenAPI se actualiza a la versión 0.3.0 con la operación de eliminar
  cuenta (`DELETE /me`).
- La entrada por voz (RF05) y la síntesis de voz (RF08) se resuelven en la app; el
  backend solo registra el tipo de entrada (`inputType`).
