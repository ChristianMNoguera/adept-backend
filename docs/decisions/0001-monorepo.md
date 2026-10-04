# ADR-0001: Organización del repositorio como monorepo

- **Fecha:** 2026-09-24
- **Estado:** Aceptada

## Contexto

El backend de ADEPT se compone de dos servicios en lenguajes distintos: el
agente conversacional (Node.js/TypeScript) y el servicio de Machine Learning
(Python). Ambos necesitan compartir contratos de datos exactos (formato de
mensajes, resultados de clasificación emocional, etc.), y hay un único
desarrollador a cargo del backend.

## Decisión

Un solo repositorio (monorepo) con los dos servicios como carpetas
independientes bajo `services/`, más carpetas compartidas `contracts/`,
`infra/` y `docs/` en la raíz.

## Alternativas consideradas

- **Polyrepo** (un repositorio por servicio): descartado. El costo (contratos de datos que se desincronizan entre
  repos, cambios que tocan ambos servicios requiriendo dos PRs coordinados)
  no se justifica sin ese beneficio.

## Consecuencias

- Los contratos en `contracts/` son la fuente de verdad única, referenciada
  por ambos servicios.
- A futuro, si se arma integración continua (CI), va a haber que configurarla
  para que solo reconstruya el servicio que cambió, no los dos — queda
  anotado como tarea pendiente para cuando se llegue a esa etapa.
