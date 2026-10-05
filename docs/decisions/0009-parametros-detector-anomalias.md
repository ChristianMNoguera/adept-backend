# ADR-0009: Parámetros del detector de anomalías (reemplaza al ADR-0007)

- **Fecha:** 2026-10-04
- **Estado:** Aceptada
- **Reemplaza a:** ADR-0007
- **Nota de implementación:** pieza todavía no construida; corresponde a la fase del
  detector de anomalías.

## Contexto

El ADR-0007 asumía un umbral absoluto del puntaje de anomalía, ajustable por el
equipo de desarrollo. El documento de la tesis (RF11, sección 3.3.3 y Tabla 3.XII)
define otro diseño: el umbral no es un valor fijo, sino el percentil 95 de los
puntajes de la línea de base del propio usuario, recalculado en cada reentrenamiento.
Una alerta exige que dos sesiones consecutivas superen ese umbral, y los indicadores
afectados se señalan cuando su distancia robusta a la mediana personal es de 2,5 MAD
o más.

## Decisión

El detector sigue la especificación de la tesis:

- Isolation Forest por usuario, con 200 árboles, muestra máxima igual al menor valor
  entre 256 y la cantidad de sesiones disponibles, y semilla fija.
- Vector de seis características: TTR, coherencia discursiva, longitud promedio,
  tiempo promedio de respuesta, puntaje en ejercicios y etiqueta emocional
  codificada. La hora del día es metadato y no integra el vector.
- Se activa a las 10 sesiones y se reentrena cada 5 sesiones nuevas.
- Umbral: percentil 95 de los puntajes de la línea de base, recalculado en cada
  reentrenamiento. Alerta: dos sesiones consecutivas por encima del umbral.

Los parámetros que no son datos del usuario se leen de AWS Systems Manager Parameter
Store (o de variables de entorno de la función, como mínimo viable) y no se exponen
en ninguna pantalla: el percentil (95), la exigencia de sesiones consecutivas (2), el
corte de indicador afectado (2,5 MAD), el número de árboles (200) y el mínimo de
sesiones para activarse (10). El equipo de desarrollo puede modificarlos sin
redesplegar código.

## Alternativas consideradas

- **Hardcodear los parámetros:** descartado, porque cada ajuste implicaría un
  redespliegue.
- **Exponerlos en una pantalla de configuración institucional:** fuera del alcance
  del MVP (ADR-0008).

## Consecuencias

- Los valores vigentes no quedan versionados en git. Los usados en cada evaluación
  deben registrarse en la documentación de la prueba técnica del detector.
- El contrato informa por indicador la distancia robusta (`robustDistance`) y la
  marca `affected` (OpenAPI 0.3.0).
