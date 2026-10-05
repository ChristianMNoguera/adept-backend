# ADR-0007: Umbral de Isolation Forest gestionado fuera de la aplicación

- **Fecha:** 2026-99-29
- **Estado:** Reemplazada por ADR-0009
- **Nota de implementación:** esta pieza todavía no está construida —
  corresponde a la fase de desarrollo del Isolation Forest.

## Contexto

El umbral de sensibilidad de detección de anomalías necesita poder
ajustarse durante los tests reales del sistema, a medida que el equipo de
desarrollo evalúa resultados. Por decisión de alcance (ADR-0006), no existe
ninguna pantalla en el panel profesional para configurar este valor — eso
sería configuración institucional, fuera del MVP.

## Decisión

El umbral se gestiona como un parámetro operativo externo al código de la
aplicación: **AWS Systems Manager Parameter Store** (o, como mínimo viable
antes de llegar a esa infraestructura, una variable de entorno de la
función Lambda). El equipo de desarrollo lo modifica directamente ahí, sin
necesidad de una interfaz de usuario ni de un redeploy de código.

## Alternativas consideradas

- **Hardcodear el valor en el código del microservicio Python:** descartado
  porque cada ajuste implicaría modificar código y volver a desplegar la
  función completa.
- **Tabla de configuración en DynamoDB con pantalla propia:** descartado
  porque no hay ninguna pantalla del panel profesional que corresponda
  exponerlo (ver ADR-0006) — construir una UI para esto sería alcance no
  pedido.

## Consecuencias

- El valor del umbral no queda versionado en el repositorio de código; su
  historial de cambios vive en AWS (Parameter Store), no en git. Si se
  necesita trazabilidad de qué umbral se usó en qué momento para la tesis,
  hay que registrarlo manualmente (por ejemplo, anotando cada ajuste en esta
  misma carpeta de documentación).
