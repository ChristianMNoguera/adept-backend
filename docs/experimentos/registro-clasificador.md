# Registro de experimentación: clasificador emocional (BETO + EmoEvent_es)

Documento vivo del equipo. Ubicación sugerida en el repositorio:
`docs/experimentos/registro-clasificador.md`. Cada corrida, hallazgo o decisión se agrega
como una entrada nueva, con su fecha real y su evidencia. Las entradas ya escritas no se
reescriben: si algo se corrige, se agrega una entrada que lo explica.

- **Última actualización:** 2026-10-05
- **Ejecución de los entrenamientos:** Google Colab, GPU T4
- **Estado:** variantes en desarrollo completadas; configuración a confirmar; corrida final pendiente


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
| `final` | pendiente | configuración elegida con desarrollo, semilla 42 | | | | Única corrida que evalúa el test |

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

### 4.1 Selección del corpus
- **Hecho:** se detectó que el corpus citado originalmente (eRisk) es inglés y de Reddit,
  incompatible con BETO (español). Se evaluaron eRisk, MentalRiskES y EmoEvalEs/EmoEvent.
- **Decisión:** EmoEvent_es, por ser español, tener etiquetas humanas de emociones
  finas y no requerir pseudo-etiquetado.
- **Evidencia:** conversación de análisis previa del proyecto; ADR-0012.

### 4.2 Corrida inicial
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

### 4.3 Verificación y reparación de los datos
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

### 4.4 Corrida v2 con datos reparados
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

### 4.6 Contraste con la especificación de la tesis
- **Hecho:** se comparó la configuración usada con la de la tesis (versión del documento del
  2026-10-04).
- **Diferencias encontradas:** lote 32 frente a 16; tasa 3×10⁻⁵ frente a 2×10⁻⁵; máximo 6
  épocas frente a 5; pesos por clase `sqrt` (la tesis no los menciona); y un mapeo
  provisional a cuatro categorías que no correspondía, porque la tesis usa las siete nativas.
- **Decisión:** el notebook v3 adopta la configuración de la tesis, las siete categorías y
  un flujo en dos tiempos: las corridas de ajuste solo evalúan desarrollo y la corrida
  final evalúa el test una única vez. Las variantes se registran en `runs_log.csv`.

### 4.7 Corrida `base` del notebook v3
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

### 4.8 Variantes en desarrollo
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

### 4.9 Pendiente
Confirmación de la configuración, corrida final con evaluación única del test (y copia
ejecutada del notebook), y copia del modelo a `ml-service`.

## 5. Hallazgos

1. **El archivo público de prueba está corrupto** (31 registros fusionados y 30 etiquetas
   corridas). Con los datos sin reparar, cualquier modelo parecería azaroso en test.
2. **Las etiquetas de entrenamiento y desarrollo son consistentes** con el corpus
   completo; la verificación cruzada está incorporada al notebook.
3. **La columna "MacroF1" del ranking de EmoEvalEs es en realidad un F1 ponderado.** En los
   cinco sistemas listados, el recall coincide exactamente con el accuracy, algo que solo
   ocurre con el promedio ponderado por soporte. El criterio de la tesis (F1 macro ≥ 0,70)
   se construyó sobre esa cifra, y con el modelo actual la F1 macro ronda 0,55 y la
   ponderada 0,70. Acción pendiente: decidir el criterio y reportar siempre ambas.
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
| Configuración base para la corrida final (propuesta) | Regla de selección fijada de antemano: diferencia de F1 macro menor a 0,01 | 2026-10-05 | Entrada 4.8 |

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

## 11. Plantilla para nuevas entradas

```
### 4.x Título (fecha y hora UTC)
- **Hecho:**
- **Resultado:**
- **Hallazgo:**
- **Decisión:**
- **Evidencia:** archivo y ubicación
```
