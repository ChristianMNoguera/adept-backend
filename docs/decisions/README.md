# Decisiones de arquitectura (ADR)

Esta carpeta registra las decisiones de arquitectura y diseño tomadas durante
el desarrollo del backend de ADEPT, usando el formato **ADR** (Architecture
Decision Record).

## ¿Qué es un ADR y por qué lo usamos?

Un ADR es un archivo corto que documenta **una** decisión: qué problema
había que resolver, qué se decidió, qué otras opciones se consideraron y por
qué se descartaron, y qué consecuencias trae esa decisión a futuro.

La regla importante es: **un ADR, una vez aceptado, no se edita ni se
borra.** Si más adelante una decisión cambia, no se corrige el archivo
viejo — se crea un ADR nuevo que explica el cambio y dice qué decisión
reemplaza. Así el historial completo de "por qué el proyecto es como es"
queda documentado y trazable. Esto sirve como evidencia concreta del proceso de
diseño.

## Índice

| ADR | Título | Estado | Fecha |
|-----|--------|--------|-------|
| [0001](0001-monorepo.md) | Organización del repositorio como monorepo | Aceptada | 2026-09-24 |
| [0002](0002-proveedor-llm.md) | Proveedor de LLM externo vía interfaz adapter | Aceptada | 2026-09-24 |
| [0003](0003-contrato-openapi.md) | Contrato de API first con OpenAPI | Aceptada | 2026-09-25 |
| [0004](0004-data-source-mock-real.md) | Selección de origen de datos vía `DATA_SOURCE` | Aceptada | 2026-09-27 |
| [0005](0005-localstack-cdk.md) | LocalStack + AWS CDK para infraestructura local | Aceptada | 2026-09-28 |
| [0006](0006-alcance-mvp.md) | Alcance del MVP del backend | Aceptada | 2026-09-20 |
| [0007](0007-umbral-isolation-forest.md) | Umbral de Isolation Forest gestionado fuera de la app | Aceptada | 2026-09-30 |

## Cómo se suma un ADR nuevo

Cada vez que cerremos una etapa del desarrollo que implique una decisión
de arquitectura (no solo una tarea de código), se agrega un archivo nuevo
numerado correlativamente (`0008-...md`, `0009-...md`, etc.) y se agrega
una fila a esta tabla.
