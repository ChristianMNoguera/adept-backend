# ADEPT — Backend

ADEPT es un sistema conversacional de estimulación cognitiva para adultos mayores,
desarrollado como tesis de Ingeniería en Informática. Este repositorio contiene el
backend: los servicios que el frontend consume. Por ahora es el esqueleto inicial,
con respuestas fijas (mock) que respetan el contrato de la API.

## Estructura

```
adept-backend/
├── services/
│   ├── conversational-agent/   Servicio principal (Node.js + TypeScript + Express).
│   │                           Expone los endpoints de sesiones que usa el frontend.
│   └── ml-service/             Servicio de Machine Learning (Python + FastAPI).
│                               Más adelante alojará el clasificador de emociones.
├── contracts/
│   └── openapi.yaml            Contrato de la API: lo que el frontend y el backend acuerdan.
├── infra/                      Infraestructura (AWS) — fase futura.
├── docs/                       Documentación técnica — fase futura.
├── .gitignore                  Archivos que Git no debe guardar.
└── README.md                   Este archivo.
```

## Cómo levantar `conversational-agent` en local

Requiere Node.js 18 o superior.

```bash
cd services/conversational-agent
npm install
npm run dev
```

Queda escuchando en `http://localhost:3000`. Para probar: `curl http://localhost:3000/health`.

Modo de datos: por defecto responde con datos mock. Para cambiarlo, copiá `.env.example`
como `.env` y editá `DATA_SOURCE` (`mock` o `real`). Con `real`, los endpoints de
sesiones responden `501 Not Implemented` porque la lógica real todavía no existe.

## Cómo levantar `ml-service` en local

Requiere Python 3.10 o superior.

```bash
cd services/ml-service
python -m venv venv
# Activar el entorno virtual:
#   Windows (PowerShell): venv\Scripts\Activate.ps1
#   Linux / macOS:        source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Queda escuchando en `http://localhost:8000`. Para probar: `curl http://localhost:8000/health`.

## Qué NO está implementado todavía

Todo esto se va a ir agregando en etapas siguientes, de a una por vez:

- Conexión a base de datos.
- Llamadas a un LLM externo.
- Clasificador de emociones (modelo BETO).
- Motor de recomendación de ejercicios.
- Infraestructura AWS.
