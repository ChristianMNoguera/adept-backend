# ADR-0012: Clasificador emocional (BETO sobre EmoEvent_es)

- **Fecha:** 2026-09-15
- **Estado:** Aceptada
- **Nota de implementación:** entrenamiento en Colab (notebook versionado); el
  servicio de inferencia todavía no está expuesto por la API.

## Contexto

El clasificador de estado emocional es una de las dos contribuciones técnicas
propias del proyecto (RF10). La tesis especifica el corpus, las categorías, la
configuración inicial de entrenamiento y el criterio de aceptación.

## Decisión

- **Corpus y particiones:** EmoEvent_es (EmoEvalEs), con las particiones oficiales de
  5.723 instancias de entrenamiento, 844 de desarrollo y 1.656 de prueba.
- **Categorías:** las siete nativas (ira, asco, miedo, alegría, tristeza, sorpresa y
  otros). No se traducen a una taxonomía propia.
- **Configuración inicial:** BETO (`dccuchile/bert-base-spanish-wwm-cased`), 128
  tokens, lotes de 16, AdamW, tasa de aprendizaje 2×10⁻⁵, máximo 5 épocas, semilla
  fija y detención temprana con paciencia 2 sobre la F1 macro de desarrollo.
- **Uso del test:** el conjunto de prueba se evalúa una sola vez, en la corrida final.
  Cualquier variante se elige solo con desarrollo y se registra.
- **Preprocesamiento:** URLs normalizadas y emojis convertidos a texto, con el mismo
  código en entrenamiento y servicio (`preprocessing.py`).
- **Operación:** se clasifica cada intervención del usuario por separado y la etiqueta
  de la sesión es la categoría con mayor probabilidad media entre sus intervenciones.
- **Criterio de aceptación:** F1 macro mínima de 0,70 sobre la partición oficial de
  prueba (RF10). Se informa el resultado tal cual, junto con precisión, exhaustividad
  y F1 por categoría y la matriz de confusión.

## Calidad de los datos

El archivo público de prueba tiene un defecto: un registro contiene otros 30
fusionados y la columna de etiquetas quedó corrida 30 posiciones para casi todo el
conjunto. El notebook lo repara (realinea las etiquetas y recupera los 31 registros) y
verifica el resultado contra el corpus completo. Esto debe describirse en la tesis.

## Consecuencias

- Dominio: el corpus son tuits de 2019 y no conversaciones con adultos mayores. Es una
  limitación ya reconocida en el análisis FODA de la tesis.
- Las versiones de `transformers`, `torch` y `emoji` quedan fijadas en el servicio, y
  `metrics.json` registra las usadas en el entrenamiento.
