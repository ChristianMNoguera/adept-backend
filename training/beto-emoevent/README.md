# Entrenamiento del clasificador emocional de ADEPT

Esta carpeta guarda todo lo necesario para entender y repetir el entrenamiento del clasificador de emociones de ADEPT: **BETO** (un modelo de lenguaje en español) ajustado con el corpus **EmoEvent_es**, con las siete categorías nativas del corpus: `anger`, `disgust`, `fear`, `joy`, `sadness`, `surprise` y `others`.

El entrenamiento se hace en **Google Colab** y forma parte del entregable de la tesis: el notebook, los resultados de cada corrida y el registro de experimentación.

## Estructura

```
training/beto-emoevent/
├── notebooks/            El notebook de entrenamiento (para Colab).
├── runs/                 Copias ejecutadas del notebook de las corridas importantes (se agregan con la corrida final).
├── results/
│   ├── runs_log.csv      Una fila por corrida de ajuste (configuración y métricas de desarrollo).
│   ├── training_log_*.csv   Curva de entrenamiento de cada corrida de ajuste.
│   ├── preliminary/      Resultados de la primera corrida (v2), sin texto de tuits.
│   └── final/            Resultados de la corrida final: metrics.json, training_log_final.csv, matriz de confusión y predicciones (sin texto de tuits).
└── scripts/
    └── sanitize_predictions.py   Quita el texto de los tuits de un archivo de predicciones.
```

`results/final/` ya existe. `runs/` va a guardar la copia ejecutada del notebook de la corrida final y todavía no está en el repo.

## Cómo repetir una corrida en Colab

1. Subí el notebook de `notebooks/` a Colab y abrilo.
2. Elegí la GPU: *Entorno de ejecución → Cambiar tipo de entorno → GPU (T4)*.
3. En la celda de configuración fijá:
   - `RUN_NAME`: un nombre para la corrida (por ejemplo `sqrt_s43`).
   - `SEED`: la semilla aleatoria (42 o 43, por ejemplo).
   - `CLASS_WEIGHTS`: pesos por clase (sin pesos, que es el valor por defecto, o `"sqrt"`).
   - `FINAL_RUN`: `False` para una corrida de ajuste, `True` para la corrida final.
4. *Entorno de ejecución → Ejecutar todo* (unos 4 a 6 minutos por corrida).

**Con `FINAL_RUN = False` no se toca el test:** el modelo se evalúa solo con el conjunto de desarrollo. La corrida final (`FINAL_RUN = True`) usa el test una única vez, para que el resultado sea honesto.

## Dónde queda cada resultado

- En Colab, todo se guarda en Google Drive: `Mi unidad/ADEPT/beto-emoevent/`.
- En este repo se copian solo los resultados livianos: `results/runs_log.csv`, los `training_log_*.csv` y, de cada corrida con test, `metrics.json`, la matriz de confusión y las predicciones (**sin el texto de los tuits**, ver abajo).

## Resultado de la corrida final

Evaluación en el conjunto de test (1.656 instancias, siete categorías), tomada de `results/final/metrics.json`:

| Métrica | Valor |
|---|---|
| Accuracy | 0,7005 |
| F1 macro | 0,5281 |
| F1 ponderado | 0,6953 |

## Los pesos del modelo no se versionan

La carpeta `model/` (los pesos, cientos de MB) **no va a git**: está en el `.gitignore`. Vive en Google Drive y, para que lo use el servicio, en S3. Para probarlo en tu máquina, copiá la carpeta del modelo a `services/ml-service/models/beto-emoevent/` y corré `python scripts/check_model.py` (ver el README raíz).

## Sobre el corpus

El corpus es **EmoEvent_es** (la parte en español de EmoEvent), de Plaza-del-Arco et al. (2020): *EmoEvent: A Multilingual Emotion Corpus based on different Events*, Proceedings of LREC 2020. Tiene licencia de uso académico, por eso **este repositorio no redistribuye los tuits**: `scripts/sanitize_predictions.py` deja en las predicciones solo `id`, `emotion`, `predicted` y `confidence`.

Además, el archivo de prueba público del corpus tiene un defecto: una fila contiene otros 30 registros fusionados y, desde esa fila, cada texto queda con la etiqueta de otro. El notebook lo detecta, lo repara y verifica el resultado contra el corpus completo antes de seguir.

## Registro de experimentación

Los descubrimientos, errores corregidos y decisiones de cada corrida están en [`docs/experimentos/registro-clasificador.md`](../../docs/experimentos/registro-clasificador.md).
