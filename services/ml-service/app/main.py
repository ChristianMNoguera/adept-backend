# Servicio de Machine Learning de ADEPT.
# Más adelante va a exponer el clasificador de emociones (modelo BETO).
# Por ahora solo tiene un endpoint de salud para verificar que está corriendo.

from fastapi import FastAPI

# Crea la aplicación web.
app = FastAPI(title="ADEPT ml-service", version="0.1.0")


# Chequeo de salud: GET /health -> {"status": "ok"}
@app.get("/health")
def health():
    return {"status": "ok"}
