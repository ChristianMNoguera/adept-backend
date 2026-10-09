# Decisiones de arquitectura (ADR)

Esta carpeta registra las decisiones de arquitectura y diseño tomadas durante
el desarrollo del backend de ADEPT, usando el formato **ADR** (Architecture
Decision Record).

## ¿Qué es un ADR y por qué lo usamos?

Un ADR es un archivo corto que documenta **una** decisión: qué problema
había que resolver, qué se decidió, qué otras opciones se consideraron y por
qué se descartaron, y qué consecuencias trae esa decisión a futuro.

La regla importante es: **un ADR, una vez aceptado, no se edita ni se
borra.** Lo único que cambia es su estado. Si más adelante una decisión cambia,
no se corrige el archivo viejo: se crea un ADR nuevo que explica el cambio y dice
qué decisión reemplaza, y el viejo pasa a "Reemplazada por ADR-XXXX". Así el
historial completo de "por qué el proyecto es como es" queda documentado y
trazable, en vez de perderse cada vez que algo se actualiza.

## Índice

| ADR | Título | Estado | Fecha |
|-----|--------|--------|-------|
| [0001](0001-monorepo.md) | Organización del repositorio como monorepo | Aceptada | 2026-10-03 |
| [0002](0002-proveedor-llm.md) | Proveedor de LLM externo vía interfaz adapter | Aceptada | 2026-10-03 |
| [0003](0003-contrato-openapi.md) | Contrato de API first con OpenAPI | Aceptada | 2026-10-03 |
| [0004](0004-data-source-mock-real.md) | Selección de origen de datos vía `DATA_SOURCE` | Aceptada | 2026-10-03 |
| [0005](0005-localstack-cdk.md) | LocalStack + AWS CDK para infraestructura local | Aceptada | 2026-10-03 |
| [0006](0006-alcance-mvp.md) | Alcance del MVP del backend | Reemplazada por ADR-0008 | 2026-10-03 |
| [0007](0007-umbral-isolation-forest.md) | Umbral de Isolation Forest gestionado fuera de la app | Reemplazada por ADR-0009 | 2026-10-03 |
| [0008](0008-alcance-mvp-corregido.md) | Alcance del MVP del backend (corrige el 0006) | Aceptada | 2026-10-04 |
| [0009](0009-parametros-detector-anomalias.md) | Parámetros del detector de anomalías (reemplaza al 0007) | Aceptada | 2026-10-04 |
| [0010](0010-autenticacion-cognito.md) | Autenticación con Amazon Cognito | Aceptada | 2026-10-04 |
| [0011](0011-transporte-rest-y-cierre-de-sesion.md) | Transporte REST y procesamiento por lotes al cerrar la sesión | Aceptada | 2026-10-04 |
| [0012](0012-clasificador-emocional.md) | Clasificador emocional (BETO sobre EmoEvent_es) | Aceptada | 2026-10-04 |
| [0013](0013-despliegue-inicial-aws-y-costos.md) | Despliegue inicial en AWS y control de costos | Aceptada | 2026-10-06 |

## Cómo se suma un ADR nuevo

Cada vez que cerremos un ladrillo del desarrollo que implique una decisión
de arquitectura (no solo una tarea de código), se agrega un archivo nuevo
numerado correlativamente y se agrega una fila a esta tabla.
