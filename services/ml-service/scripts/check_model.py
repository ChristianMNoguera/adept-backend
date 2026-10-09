# Verifica que el modelo cargado en esta máquina da los mismos resultados que en Colab.
# Se corre desde services/ml-service:  python scripts/check_model.py  [--model-dir RUTA]

import argparse
import platform
import sys
from pathlib import Path

import emoji
import torch
import transformers
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Permite importar app/preprocessing.py aunque el script se corra desde scripts/.
RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
from app.preprocessing import preprocess  # noqa: E402

# Orden de etiquetas con el que se entrenó el modelo (viene dentro de su config).
ORDEN_ESPERADO = {0: "anger", 1: "disgust", 2: "fear", 3: "joy", 4: "others", 5: "sadness", 6: "surprise"}

# Frases de prueba y lo que dio Colab: (frase, emoción principal, probabilidad).
# Valores del modelo final (corrida "final"), tomados de Colab el 2026-10-09
# (CPU, torch 2.11.0, transformers 5.18.0, emoji 2.16.0).
FRASES = [
    ("Hoy me levanté con ganas de salir a caminar", "joy", 0.58),
    ("Ayer vino mi nieto y pasamos una tarde hermosa", "joy", 0.99),
    ("Me siento muy solo desde que se fue mi esposa", "sadness", 0.99),
    ("No tengo ganas de hablar con nadie", "others", 0.99),
    ("Estoy muy nervioso por el resultado de los estudios", "fear", 0.93),
    ("Me da mucha bronca que no me atiendan en la obra social", "anger", 0.89),
    ("El otro día me olvidé dónde dejé las llaves y me asusté", "fear", 0.60),
    ("Hoy fue un día como cualquier otro", "others", 0.68),
]

# Diferencia máxima de probabilidad para dar OK.
TOLERANCIA = 0.03


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", default="models/beto-emoevent")
    args = parser.parse_args()

    # Rutas relativas se toman desde donde se corre el script.
    model_dir = Path(args.model_dir)
    # Si los archivos del modelo están en una subcarpeta "model", se usa esa.
    if not (model_dir / "config.json").exists() and (model_dir / "model" / "config.json").exists():
        model_dir = model_dir / "model"
    print(f"Modelo: {model_dir}")

    # 1. Versiones de las librerías.
    print(f"Python: {platform.python_version()}")
    print(f"torch: {torch.__version__}")
    print(f"transformers: {transformers.__version__}")
    print(f"emoji: {emoji.__version__}")

    # 2. Carga del tokenizador y del modelo (CPU, modo evaluación).
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.to("cpu")
    model.eval()

    # 3. El orden de las etiquetas tiene que ser exactamente el esperado.
    id2label = {int(i): nombre for i, nombre in model.config.id2label.items()}
    if id2label != ORDEN_ESPERADO:
        print("\nERROR: el orden de las etiquetas del modelo no es el esperado.")
        print(f"  Esperado: {ORDEN_ESPERADO}")
        print(f"  Recibido: {id2label}")
        print("El orden de las etiquetas viene dentro del modelo; un orden distinto daría resultados sin sentido.")
        sys.exit(1)
    print("Orden de etiquetas: OK")

    # 4. Clasificar cada frase y compararla con Colab.
    hay_diferencias = False
    print()
    for frase, emocion_colab, prob_colab in FRASES:
        texto = preprocess(frase)
        entrada = tokenizer(texto, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            logits = model(**entrada).logits
        probs = torch.softmax(logits, dim=-1)[0]

        # Las 2 emociones más probables.
        top = torch.topk(probs, 2)
        (p1, p2), (i1, i2) = top.values.tolist(), top.indices.tolist()
        emocion1, emocion2 = id2label[i1], id2label[i2]

        ok = emocion1 == emocion_colab and abs(p1 - prob_colab) < TOLERANCIA
        hay_diferencias = hay_diferencias or not ok
        print(f"[{'OK' if ok else 'DIFERENCIA'}] {frase}")
        print(f"    1) {emocion1} {p1:.2f}   2) {emocion2} {p2:.2f}")
        print(f"    Colab: {emocion_colab} {prob_colab:.2f}")

    # 5. Informativo: el preprocesamiento puede variar según la versión de emoji.
    prueba = preprocess("¡Qué alegría! 😭 https://t.co/x")
    esperado = "¡Qué alegría! cara llorando fuerte http"
    print(f"\npreprocess de prueba: {prueba!r}")
    print(f"Esperado:             {esperado!r}" + ("" if prueba == esperado else "  (difiere; puede ser la versión de emoji)"))

    # 6. Código de salida: distinto de cero si alguna frase dio DIFERENCIA.
    if hay_diferencias:
        print("\nResultado: HAY DIFERENCIAS con Colab.")
        sys.exit(1)
    print("\nResultado: todo coincide con Colab.")


if __name__ == "__main__":
    main()
