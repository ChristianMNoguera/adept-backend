# ADR-0002: Proveedor de LLM externo vía interfaz adapter

- **Fecha:** 2026-09-24
- **Estado:** Aceptada
- **Nota de implementación:** esta pieza todavía no está construida — hoy
  el agente conversacional responde en modo mock (ver ADR-0004). Esta
  decisión aplica cuando se implemente la integración real con el LLM.

## Contexto

El agente conversacional necesita un LLM externo para sostener la
conversación con el usuario. Los dos candidatos evaluados fueron OpenAI y
Amazon Bedrock.

## Decisión

Para el MVP, se usa **OpenAI** como proveedor. En el código, el agente
conversacional no llama directamente al SDK de OpenAI: lo hace a través de
una interfaz propia (`LLMProvider`), de la que OpenAI es una implementación
concreta.

## Alternativas consideradas

- **Amazon Bedrock directo:** descartado para el MVP. Requiere solicitar
  acceso a cada modelo foundation por separado (demoras de aprobación en
  cuentas nuevas) y no todos los modelos están disponibles en la región de
  Buenos Aires (`sa-east-1`), con lo cual terminaría invocándose desde otra
  región igual. Además, acoplaría el desarrollo del flujo conversacional a
  credenciales y configuración de AWS desde el día 1, rompiendo la
  estrategia de desarrollo local-first.

## Consecuencias

- Si en el futuro se necesita migrar a Bedrock (por costos o requisito
  institucional), el cambio queda acotado a una nueva implementación de
  `LLMProvider`, sin tocar el resto del agente conversacional.
- El sistema puede documentarse en la tesis como *provider-agnostic* a nivel
  de arquitectura, aunque el MVP use un solo proveedor concreto.
