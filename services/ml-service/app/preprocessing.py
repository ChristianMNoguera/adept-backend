import re
import emoji

_URL_RE = re.compile(r"https?://\S+")

def preprocess(text, demojize=True):
    # Normaliza un texto antes de tokenizarlo (mismo código en entrenamiento y producción).
    text = str(text)
    text = _URL_RE.sub("http", text)
    if demojize:
        text = emoji.demojize(text, language="es", delimiters=(" ", " "))
        text = text.replace("_", " ")
    return re.sub(r"\s+", " ", text).strip()
