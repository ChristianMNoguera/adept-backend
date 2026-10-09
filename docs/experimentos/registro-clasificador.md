# Registro de experimentación: clasificador emocional (BETO + EmoEvent_es)

Documento vivo del equipo. Ubicación sugerida en el repositorio:
`docs/experimentos/registro-clasificador.md`. Cada corrida, hallazgo o decisión se agrega
como una entrada nueva, con su fecha real y su evidencia. Las entradas ya escritas no se
reescriben: si algo se corrige, se agrega una entrada que lo explica.

- **Última actualización:** 2026-10-09
- **Ejecución de los entrenamientos:** Christian Noguera (Google Colab, GPU T4)
- **Estado:** corrida final completada (2026-10-09); criterio de aceptación (F1 macro ≥ 0,70) no alcanzado; la tesis lo informa tal cual (decisión del equipo, entrada 4.10)
- **Convención de fechas:** las horas son UTC y salen de los archivos que generó cada
  corrida (`metrics.json`, `runs_log.csv`). En Buenos Aires son 3 horas menos.

## 1. Objetivo

Entrenar el clasificador de estado emocional de ADEPT (RF10): BETO ajustado sobre las
siete categorías nativas de EmoEvent_es (ira, asco, miedo, alegría, tristeza, sorpresa y
otros), con la configuración y el criterio de aceptación definidos en la tesis
(sección 3.3.3 y Tabla 3.XII). Este registro documenta el proceso: qué se hizo, qué se
encontró, qué se decidió y qué errores se corrigieron.

## 2. Estado actual de las corridas

Las filas de la tabla de abajo salen de `results/runs_log.csv`. Solo las corridas de la
configuración final evalúan el conjunto de prueba.

| Corrida | Fecha (UTC) | Configuración | Dev: accuracy | Dev: F1 macro | Dev: F1 ponderado | Notas |
|---|---|---|---|---|---|---|
| v1 (inicial) | 2026-10-05 00:47 | lote 32, 3×10⁻⁵, pesos `sqrt`, máx. 6 épocas | 0,7239 | 0,5628 | 0,7208 | Evaluó un test mal alineado (ver 4.2) |
| v2 | 2026-10-05 01:14 | igual a v1, con datos reparados | 0,7227 | 0,5618 | 0,7195 | Evaluó el test reparado (ver 4.3) |
| `base` (v3) | 2026-10-05 04:08 | lote 16, 2×10⁻⁵, sin pesos, máx. 5 épocas, semilla 42 | 0,6979 | 0,5551 | 0,6913 | Configuración de la tesis; solo desarrollo |
| `base_s43` | 2026-10-05 17:52 | igual a `base`, semilla 43 | 0,6991 | 0,5532 | 0,6894 | Solo desarrollo |
| `sqrt_s42` | 2026-10-05 18:07 | `base` con pesos `sqrt`, semilla 42 | 0,7085 | 0,5571 | 0,7060 | Mejor época: 3 |
| `sqrt_s43` | 2026-10-05 18:23 | `base` con pesos `sqrt`, semilla 43 | 0,7133 | 0,5685 | 0,7069 | Mejor época: 4 |
| `final` | 2026-10-09 19:27 | igual a `base` (configuración de la tesis), semilla 42 | 0,6979 | 0,5551 | 0,6913 | Única corrida que evalúa el test: accuracy 0,7005, F1 macro 0,5281, F1 ponderado 0,6953 |

Regla de selección, fijada antes de ver los resultados de las variantes: se compara el
promedio entre semillas de la F1 macro de desarrollo; si la diferencia entre
configuraciones es menor a 0,01, se mantiene la configuración base (la de la tesis).

## 3. Datos

- **Corpus:** EmoEvent_es (Plaza-del-Arco et al., 2020), particiones oficiales de
  EmoEvalEs: 5.723 instancias de entrenamiento, 844 de desarrollo y 1.656 de prueba.
- **Fuente:** repositorio oficial del corpus (`fmplaza/EmoEvent`).
- **Distribución (entrenamiento):** others 2.800, joy 1.227, sadness 693, anger 589,
  surprise 238, disgust 111, fear 65. En desarrollo hay solo 9 ejemplos de `fear` y 16 de
  `disgust`, por lo que las métricas de esas clases son muy ruidosas.

## 4. Cronología

### 4.1 Selección del corpus (hasta el 2026-09-04)
- **Hecho:** se detectó que el corpus citado originalmente (eRisk) es inglés y de Reddit,
  incompatible con BETO (español). Se evaluaron eRisk, MentalRiskES y EmoEvalEs/EmoEvent.
- **Decisión:** EmoEvent_es, por ser español, tener etiquetas humanas de emociones
  finas y no requerir pseudo-etiquetado.
- **Evidencia:** conversación de análisis previa del proyecto; ADR-0012.

### 4.2 Corrida inicial (2026-10-05 00:47 UTC, notebook v1)
- **Resultado:** dev accuracy 0,7239 y F1 macro 0,5628; test accuracy **0,3354** y F1
  macro **0,1764**.
- **Hallazgo:** una brecha de casi 40 puntos entre dos particiones de la misma
  distribución no es un problema del modelo. Las predicciones eran casi independientes de
  las etiquetas, y la matriz de confusión tenía todas las filas parecidas.
- **Diagnóstico:** se probó desplazar las etiquetas contra las predicciones; el accuracy
  subió de 0,335 a 0,671 con un corrimiento de 30 posiciones. Las 91 filas anteriores a
  una fila fusionada del archivo no estaban afectadas (accuracy 0,703 sin corregir).
- **Causa:** el archivo público `test.tsv` tiene una fila que contiene fusionados otros 30
  registros, con los tabuladores convertidos en espacios, y 30 filas finales con solo la
  etiqueta. La columna de etiquetas conservó todas sus filas y la de textos perdió 30,
  así que desde esa fila cada texto quedó con la etiqueta de 30 posiciones más abajo.
- **Evidencia:** las cifras de este registro. Los archivos de esta corrida (`metrics.json`,
  `test_predictions.csv`) se sobrescribieron en Drive al correr v2, porque ambas escriben en
  la misma carpeta de salida; solo se conservan si el equipo los había descargado.

### 4.3 Verificación y reparación de los datos (2026-10-05)
- **Verificación independiente:** se cruzaron los tuits con el corpus completo
  `emoevent_es.csv`. Coincidencia de etiquetas: train 100 % (4.554 emparejados), dev 100 %
  (665), test **sin reparar 34,7 %** y **reparado 100 %** (1.286).
- **Reparación:** realineado de etiquetas y recuperación de los 31 registros fusionados,
  separados por sus identificadores. Los 8 recuperados que no se pudieron emparejar con el
  corpus completo (por diferencias de normalización) quedan con la etiqueta de su propia
  posición; en los 23 que sí se emparejaron coincide el 100 %.
- **Decisión:** el notebook repara y verifica los datos en cada corrida y se detiene si la
  coincidencia con el corpus completo es menor al 99 %. El test queda en las 1.656 filas
  oficiales (en v1 y v2 se habían descartado 31, quedando 1.625).

### 4.4 Corrida v2 con datos reparados (2026-10-05 01:14 UTC)
- **Configuración:** la misma que v1 (lote 32, 3×10⁻⁵, pesos `sqrt`), con test de 1.625 filas.
- **Resultado:** dev accuracy 0,7227, F1 macro 0,5618; **test accuracy 0,7058, F1 macro
  0,5472, F1 ponderado 0,7026**.
- **F1 por categoría (test):** others 0,779; sadness 0,770; joy 0,658; anger 0,629;
  fear 0,596 (21 ejemplos); surprise 0,353; **disgust 0,047** (33 ejemplos; el modelo la
  predijo solo 10 veces y confundió 24 de 33 con `anger`).
- **Coherencia dev/test:** 0,7227 frente a 0,7058 de accuracy, sin señal de sobreajuste
  en la brecha (dev se usó para elegir la mejor época, por lo que está levemente favorecido).
- **Evidencia:** `results/preliminary/metrics_v2.json`,
  `results/preliminary/test_predictions_v2.csv` (sin el texto de los tuits),
  `results/preliminary/confusion_matrix_test_v2.png` y
  `results/preliminary/training_log_v2.csv`.
- **Nota:** esta corrida no es el resultado final: su configuración difiere de la de la
  tesis (ver 4.6).

### 4.5 Prueba cualitativa con frases conversacionales (modelo v2)
- **Hecho:** ocho frases escritas para parecerse a lo que diría un adulto mayor.
- **Resultado:** seis coinciden con lo esperado (alegría, tristeza, miedo). Dos son
  relevantes para ADEPT:
  - "No tengo ganas de hablar con nadie" → `others` con 0,89 de confianza. El retraimiento
    sin palabras emocionales explícitas no se detecta.
  - "Me da mucha bronca que no me atiendan en la obra social" → `anger` 0,62 y `disgust` 0,27.
- **Alcance:** son ocho frases, no una medición; sirven como señal de validez externa.
- **Servicio:** el modelo v2 se cargó en `ml-service` con las versiones fijadas y reprodujo
  las ocho salidas de Colab con la misma emoción y la misma probabilidad a dos decimales.

### 4.6 Contraste con la especificación de la tesis (2026-10-05)
- **Hecho:** se comparó la configuración usada con la de la tesis (versión del documento del
  2026-10-04).
- **Diferencias encontradas:** lote 32 frente a 16; tasa 3×10⁻⁵ frente a 2×10⁻⁵; máximo 6
  épocas frente a 5; pesos por clase `sqrt` (la tesis no los menciona); y un mapeo
  provisional a cuatro categorías que no correspondía, porque la tesis usa las siete nativas.
- **Decisión:** el notebook v3 adopta la configuración de la tesis, las siete categorías y
  un flujo en dos tiempos: las corridas de ajuste solo evalúan desarrollo y la corrida
  final evalúa el test una única vez. Las variantes se registran en `runs_log.csv`.

### 4.7 Corrida `base` del notebook v3 (2026-10-05 04:08 UTC)
- **Resultado (desarrollo):** accuracy 0,6979, F1 macro 0,5551, F1 ponderado 0,6913;
  entrenamiento de 4,5 minutos.
- **Por época:**

| Época | Pérdida de entrenamiento | Pérdida de validación | Accuracy | F1 macro |
|---|---|---|---|---|
| 1 | 1,016 | 0,834 | 0,712 | 0,497 |
| 2 | 0,661 | 0,782 | 0,720 | 0,541 |
| 3 | 0,411 | 0,933 | 0,711 | 0,551 |
| 4 | 0,250 | 1,183 | 0,686 | 0,545 |
| 5 | 0,169 | 1,291 | 0,698 | 0,555 |

- **Lectura:** la pérdida de validación sube desde la época 2 mientras la de entrenamiento
  baja, es decir, el modelo empieza a memorizar. La F1 macro casi no cambia entre las
  épocas 3 y 5 (diferencias de 0,005 en una partición con 9 ejemplos de `fear`), por lo
  que elegir la "mejor época" 5 es en buena parte ruido. La detención temprana no se
  activó porque la F1 macro no tuvo dos épocas seguidas sin mejora.
- **Evidencia:** `results/runs_log.csv` y `results/training_log_base.csv`.

### 4.8 Variantes en desarrollo (2026-10-05, 17:52 a 18:24 UTC)
- **Hecho:** tres corridas adicionales, solo con desarrollo: `base_s43`, `sqrt_s42` y
  `sqrt_s43`. El test no se evaluó.
- **Resultado (media de dos semillas):**

| Configuración | Accuracy | F1 macro | F1 ponderado |
|---|---|---|---|
| Sin pesos (`base`) | 0,6985 | 0,5542 | 0,6904 |
| Pesos `sqrt` | 0,7109 | 0,5628 | 0,7064 |
| Diferencia | +0,0124 | +0,0086 | +0,0161 |

- **Lectura:** la diferencia de F1 macro (0,0086) es menor al umbral de 0,01 fijado de
  antemano y queda dentro de la dispersión entre semillas de `sqrt` (0,008), así que no
  hay evidencia de mejora en esa métrica. En accuracy y F1 ponderado, `sqrt` supera a
  `base` en las dos semillas (entre 0,015 y 0,018 de F1 ponderado), pero esa no era la
  métrica de selección.
- **Observaciones:** la detención temprana no se activó en ninguna corrida (las cuatro
  corrieron las 5 épocas); la F1 macro oscila unos ±0,02 entre épocas, y la pérdida de
  validación sube desde la época 2 o 3 en las cuatro.
- **Decisión (a confirmar por el equipo):** por la regla fijada de antemano, queda la
  configuración base, que es la de la tesis. Adoptar `sqrt` sería una desviación de esa
  regla y, de hacerse, debe registrarse como tal, con la justificación de la mejora
  consistente en accuracy y F1 ponderado.
- **Evidencia:** `results/runs_log.csv` y `results/training_log_<corrida>.csv`. No se
  guardaron copias ejecutadas del notebook de estas tres corridas; los registros
  contienen la configuración y los resultados de cada una.

### 4.9 Corrida final (2026-10-09 19:27 UTC)
- **Configuración:** la de la tesis y la elegida por la regla de selección (entrada 4.8):
  lote 16, 2×10⁻⁵, sin pesos por clase, máx. 5 épocas, semilla 42, siete categorías.
  Test de 1.656 filas (reparado y verificado), evaluado por única vez. Entrenamiento de
  4,8 minutos en Tesla T4 (torch 2.11.0+cu130, transformers 4.57.6, emoji 2.16.0).
- **Reproducibilidad:** las métricas de desarrollo coinciden con las de la corrida `base`
  (misma configuración y semilla) a cuatro decimales: accuracy 0,6979, F1 macro 0,5551,
  F1 ponderado 0,6913.
- **Resultado en test:** accuracy **0,7005**, F1 macro **0,5281**, F1 ponderado **0,6953**.
- **F1 por categoría (test):**

| Categoría | Precisión | Recall | F1 | Ejemplos |
|---|---|---|---|---|
| others | 0,781 | 0,759 | 0,770 | 814 |
| sadness | 0,772 | 0,749 | 0,760 | 199 |
| joy | 0,638 | 0,706 | 0,670 | 354 |
| anger | 0,578 | 0,661 | 0,617 | 168 |
| fear | 0,542 | 0,619 | 0,578 | 21 |
| surprise | 0,322 | 0,284 | 0,302 | 67 |
| disgust | 0,000 | 0,000 | 0,000 | 33 |

- **Criterio de aceptación (F1 macro ≥ 0,70):** **no se cumple** (0,5281). El F1
  ponderado (0,6953) tampoco llega a 0,70, por 0,005. La accuracy (0,7005) lo supera por
  poco, pero no es la métrica del criterio.
- **Lectura:** el desempeño en las cinco categorías con más ejemplos es razonable
  (F1 entre 0,58 y 0,77); la F1 macro queda baja por `disgust`, que el modelo no acierta
  en ninguno de sus 33 ejemplos, y por `surprise` (0,30). Sin esas dos clases el promedio
  sería 0,68, pero ese número no se usa para reportar el resultado: el criterio se evalúa
  sobre las siete categorías.
- **Comparación con v2 (entrada 4.4):** v2 había dado F1 macro 0,5472 y ponderado 0,7026
  con otra configuración y un test de 1.625 filas; no son corridas comparables en sentido
  estricto. La diferencia se concentra en `disgust` (0,047 a 0,000) y `surprise` (0,353 a
  0,302). Por la regla fijada de antemano, no se cambia de configuración a la vista del
  test; los pesos `sqrt` quedan como mejora posible (sección 9).
- **Decisión:** el resultado se informa tal cual. La enmienda del criterio (F1 ponderado)
  se consulta con el tutor; con este resultado no lo alcanzaría, por lo que cambiar la
  métrica no resuelve el incumplimiento y, hecho después de ver el test, debe declararse
  como tal.
- **Evidencia:** `results/final/` (`metrics.json`, `test_predictions.csv` sin el texto de
  los tuits, `confusion_matrix_test.png`, `training_log.csv`), `results/runs_log.csv` y la
  copia ejecutada del notebook en `runs/`.

### 4.10 Matriz de confusión, aclaración sobre la evidencia y decisión del criterio (2026-10-09)
- **Matriz de confusión del test (normalizada por fila):** `disgust` se predice como
  `anger` en 0,45 de los casos, como `others` en 0,24 y como `joy` en 0,12; casi nunca se
  predice `disgust` (la columna es prácticamente cero). Los errores van sobre todo hacia
  `others`: `surprise` 0,40, `fear` 0,24, `joy` 0,22, `anger` 0,18 y `sadness` 0,13.
  `surprise` también se confunde con `joy` (0,22). Las diagonales coinciden con los
  recalls de `metrics.json`.
- **Lectura:** la dificultad de `disgust` no es solo la cantidad de ejemplos: el modelo no
  la distingue de `anger`. Y el error dominante es subdetectar emoción (caer en `others`),
  que coincide con lo observado en la frase de retraimiento (entrada 4.5).
- **Aclaración sobre la evidencia (corrige 4.9):** la copia del notebook en
  `runs/final_executed.ipynb` **no tiene salidas guardadas**: guarda la configuración de la
  corrida, no su ejecución. La evidencia de la ejecución es `metrics.json` (fecha, entorno,
  configuración y resultados), `training_log_final.csv`, `runs_log.csv`, la matriz y las
  predicciones. Por eso la salida de la prueba de las ocho frases en Colab con el modelo
  final no quedó guardada.
- **Prueba de las ocho frases con el modelo final (en CPU local, torch 2.14.1; no es la
  salida de Colab):**

| Frase | Emoción principal | Probabilidad |
|---|---|---|
| Hoy me levanté con ganas de salir a caminar | joy | 0,58 |
| Ayer vino mi nieto y pasamos una tarde hermosa | joy | 0,99 |
| Me siento muy solo desde que se fue mi esposa | sadness | 0,99 |
| No tengo ganas de hablar con nadie | others | 0,99 |
| Estoy muy nervioso por el resultado de los estudios | fear | 0,93 |
| Me da mucha bronca que no me atiendan en la obra social | anger | 0,89 |
| El otro día me olvidé dónde dejé las llaves y me asusté | fear | 0,60 |
| Hoy fue un día como cualquier otro | others | 0,68 |

- **Lectura:** las ocho emociones principales coinciden con las del modelo v2, pero con
  probabilidades más altas (por ejemplo, 0,99 contra 0,89 en el retraimiento y 0,99 contra
  0,84 en la frase del nieto). Una posible causa es que este modelo se entrenó sin pesos y
  hasta la época 5, con la pérdida de validación subiendo desde la época 2; no está
  demostrado. En cualquier caso, las probabilidades no deben tratarse como calibradas.
- **Decisión sobre el criterio (2026-10-09):** no se enmienda. La tesis informa el
  resultado tal cual (F1 macro 0,5281, F1 ponderado 0,6953, accuracy 0,7005) y declara el
  objetivo como parcialmente cumplido, con el F1 ponderado agregado como métrica
  complementaria por la razón externa del hallazgo 3.
- **Evidencia:** `results/final/` y `results/runs_log.csv`.

### 4.11 Pendiente
Comprobar en Colab, con el modelo final guardado en Drive y sin volver a entrenar, que las
ocho frases dan lo mismo que en CPU local, y actualizar los valores esperados de
`check_model.py`.

## 5. Hallazgos

1. **El archivo público de prueba está corrupto** (31 registros fusionados y 30 etiquetas
   corridas). Con los datos sin reparar, cualquier modelo parecería azaroso en test.
2. **Las etiquetas de entrenamiento y desarrollo son consistentes** con el corpus
   completo; la verificación cruzada está incorporada al notebook.
3. **La columna "MacroF1" del ranking de EmoEvalEs es en realidad un F1 ponderado.** En los
   cinco sistemas listados, el recall coincide exactamente con el accuracy, algo que solo
   ocurre con el promedio ponderado por soporte. El criterio de la tesis (F1 macro ≥ 0,70)
   se construyó sobre esa cifra. Con el modelo final (corrida del 2026-10-09) la F1 macro
   es 0,528 y la ponderada 0,695: ninguna alcanza 0,70. Se reportan siempre ambas.
4. **Las clases minoritarias limitan la F1 macro.** `fear`, `disgust` y `surprise` tienen
   pocos ejemplos; `disgust` casi no se predice.
5. **Brecha de dominio.** El corpus son tuits de abril de 2019 sobre eventos; ADEPT
   procesará conversaciones con adultos mayores. El caso del retraimiento muestra que una
   buena métrica en el corpus no garantiza buen desempeño en ADEPT.

## 6. Decisiones

| Decisión | Motivo | Fecha | Referencia |
|---|---|---|---|
| Usar EmoEvent_es en lugar de eRisk | Idioma y etiquetas finas | hasta 2026-09-04 | ADR-0012 |
| Siete categorías nativas, sin mapeo | La tesis las define así | 2026-10-05 | ADR-0012 |
| Reparar y verificar el test en cada corrida | Defecto del archivo público | 2026-10-05 | Entrada 4.3 |
| Test evaluado una sola vez, en la corrida final | Metodología de la tesis | 2026-10-05 | Notebook v3 |
| Variantes elegidas solo con desarrollo y por promedio de semillas | Evitar ajustar sobre el test | 2026-10-05 | Sección 2 |
| Configuración base para la corrida final | Regla de selección fijada de antemano: diferencia de F1 macro menor a 0,01 | 2026-10-09 | Entradas 4.8 y 4.9 |
| Informar el resultado final sin cambiar configuración ni criterio a la vista del test | Evitar ajustar sobre el test | 2026-10-09 | Entradas 4.9 y 4.10 |

## 7. Errores cometidos y corregidos

1. **La primera evaluación usó un test mal alineado.** No se verificaron los datos antes de
   entrenar; el resultado de 33,5 % llevó a detectar el defecto. Corrección: verificación
   automática contra el corpus completo.
2. **Se propuso un mapeo a cuatro categorías que no estaba validado** contra la tesis y que
   se basaba en una versión anterior del documento. Corrección: se descartó.
3. **La primera configuración no era la de la tesis** y la diferencia no se detectó hasta
   cruzar el notebook con el documento. Corrección: notebook v3.

## 8. Riesgos para la validez

- **El test se miró antes de la corrida final**, en v1 y v2, con una configuración
  preliminar. Ninguna decisión de configuración se tomó con esos resultados. Lo que sí
  surgió después de verlos fue la revisión del criterio de aceptación (hallazgo 3), aunque
  la evidencia que la respalda es externa (la definición de las columnas del ranking).
  Ambas cosas deben declararse en la tesis.
- **Desarrollo es chico en las clases minoritarias** (9 y 16 ejemplos), por lo que la
  elección de la mejor época y de las variantes tiene ruido. Se mitiga con dos semillas.
- **El resultado final dependerá de una sola semilla.** Se reporta como tal.
- **Validez externa limitada** (hallazgo 5).
- **Cualquier cambio del criterio de aceptación se decidiría después de ver el test.** Por eso, si se enmienda, debe declararse así y respaldarse con la evidencia externa (hallazgo 3), no con el resultado.

## 9. Mejoras detectadas

- Armar un conjunto propio de validación con frases conversacionales de adultos mayores,
  etiquetado por el equipo, para medir la brecha de dominio.
- Estudiar cómo detectar el retraimiento sin vocabulario emocional explícito, que hoy no
  cubre el clasificador; en ADEPT lo complementan los indicadores conductuales del
  detector de anomalías (longitud de respuesta, tiempo de respuesta, TTR).
- Revisar `disgust` y `surprise`: más datos, umbrales por clase o agrupación documentada.
- Ablación del preprocesamiento de emojis (`USE_EMOJI_TEXT`) para justificarlo.
- Repetir la corrida final con más semillas para informar media y desvío.

## 10. Evidencia y reproducibilidad

Estructura sugerida en el repositorio:

```
training/beto-emoevent/
  README.md                         cómo reproducir
  notebooks/                        notebook v3 (sin ejecutar)
  runs/                             copias ejecutadas (.ipynb con salidas), una por corrida disponible
  results/
    runs_log.csv                    una fila por corrida
    training_log_<corrida>.csv      detalle por época de cada corrida de ajuste
    preliminary/                    resultados de v2 (configuración preliminar, no definitivos)
    final/                          metrics.json, test_predictions.csv, matriz y log de la corrida final
docs/experimentos/registro-clasificador.md
```

- Los pesos del modelo no van al repositorio (se guardan en Drive y, para el servicio, en S3).
- En `test_predictions*.csv` conviene guardar solo identificador, etiqueta real, predicción
  y confianza, sin el texto de los tuits, para no redistribuir el corpus (sus tarjetas
  indican licencias distintas; se cita el artículo del corpus).
- **Entorno de las corridas v1 y v2:** Python 3.13.15, torch 2.11.0+cu130, transformers
  4.57.6, GPU Tesla T4. La versión de `emoji` del entrenamiento se registra desde v3.
- **Reproducción:** abrir el notebook en Colab con GPU T4, fijar `RUN_NAME`, `SEED` y
  `CLASS_WEIGHTS`, y ejecutar todo. Con `FINAL_RUN = False` no se toca el test.

## 11. Uso de herramientas de IA en esta etapa

El diseño del notebook, el análisis de resultados y la redacción de este registro se
hicieron con asistencia de Claude (Anthropic); las corridas las ejecuta y revisa el
equipo. Redacción a conciliar con la declaración de uso de IA de la tesis y con la
normativa de la universidad.

## 12. Plantilla para nuevas entradas

```
### 4.x Título (fecha y hora UTC)
- **Hecho:**
- **Resultado:**
- **Hallazgo:**
- **Decisión:**
- **Evidencia:** archivo y ubicación
```
