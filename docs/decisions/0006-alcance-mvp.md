# ADR-0006: Alcance del MVP del backend

- **Fecha:** 2026-09-20
- **Estado:** Aceptada

## Contexto

ADEPT define 6 casos de uso. Era necesario decidir explícitamente cuáles
entran en el primer incremento ("MVP") del desarrollo del backend.

## Decisión

El MVP de backend cubre:

- El lado del adulto mayor: CU01 (registro/perfil) y CU02/CU03 (conversación
  y ejercicios).
- El panel profesional completo: lista de pacientes, dashboard de
  evolución, detalle de variación, evolución histórica, centro de alertas,
  y configuración de paciente (datos personales del paciente a nivel
  individual — ver ADR-0007 para la distinción con el umbral de detección).

Queda **fuera** del MVP la configuración a nivel institucional: valores por
defecto, gestión de roles profesionales, umbral de sensibilidad de
detección de anomalías, y política de retención de datos.

## Alternativas consideradas

- Dejar el panel profesional completo para una fase posterior al MVP:
  descartado — decisión explícita de incluirlo desde esta etapa.

## Consecuencias

- El modelo de datos de la fase de persistencia debe contemplar, además del
  historial de sesión y el motor de recomendación, las entidades propias
  del panel profesional (perfil de paciente, vista agregada de dashboard,
  alertas).
- La ausencia de configuración institucional significa que ciertos
  parámetros (como el umbral del Isolation Forest) necesitan otro mecanismo
  de ajuste — ver ADR-0007.
