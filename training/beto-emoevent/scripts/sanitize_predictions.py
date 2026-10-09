# Quita el texto de los tuits de un archivo de predicciones.
# El corpus EmoEvent_es tiene licencia de uso académico y no se redistribuye en el repositorio:
# el archivo queda solo con las columnas id, emotion, predicted y confidence.
#
# Uso:  python sanitize_predictions.py RUTA/test_predictions.csv
# OJO: reescribe el archivo indicado (se trabaja sobre la copia que está en el repo).

import csv
import sys
from pathlib import Path

# Columnas que se conservan, en este orden.
COLUMNAS = ["id", "emotion", "predicted", "confidence"]


def main():
    if len(sys.argv) != 2:
        sys.exit("Uso: python sanitize_predictions.py RUTA/test_predictions.csv")

    ruta = Path(sys.argv[1])
    if not ruta.is_file():
        sys.exit(f"ERROR: no existe el archivo {ruta}")

    # Se lee todo en memoria (son pocas filas).
    with open(ruta, newline="", encoding="utf-8") as f:
        lector = csv.DictReader(f)
        faltan = [c for c in COLUMNAS if c not in (lector.fieldnames or [])]
        if faltan:
            sys.exit(f"ERROR: al archivo {ruta} le faltan las columnas: {', '.join(faltan)}")
        filas = [{c: fila[c] for c in COLUMNAS} for fila in lector]

    # Se reescribe el mismo archivo solo con las columnas conservadas.
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=COLUMNAS)
        escritor.writeheader()
        escritor.writerows(filas)

    print(f"Listo: {ruta} ahora tiene {len(filas)} filas y las columnas {', '.join(COLUMNAS)}.")


if __name__ == "__main__":
    main()
