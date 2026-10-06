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
│   │                           Expone la API que usa el frontend (25 operaciones, ver el contrato).
│   └── ml-service/             Servicio de Machine Learning (Python + FastAPI).
│                               Aloja el modelo de emociones (todavía no expuesto por la API) y su verificación.
├── contracts/
│   ├── openapi.yaml            Contrato de la API: lo que el frontend y el backend acuerdan.
│   └── CHANGELOG.md            Qué cambió en cada versión del contrato.
├── training/                   Entrenamiento del clasificador de emociones (notebook y resultados).
├── infra/                      Infraestructura en AWS (CDK en TypeScript): Cognito + API.
├── docs/                       Documentación técnica (decisiones de arquitectura).
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
como `.env` y editá `DATA_SOURCE` (`mock` o `real`). Con `real`, todos los endpoints
(salvo `GET /health`) responden `501 Not Implemented` porque la lógica real todavía no existe.

## API

La lista completa de endpoints (25 operaciones), con sus requests, responses y roles, está en
[`contracts/openapi.yaml`](contracts/openapi.yaml): es la fuente de verdad. Los cambios entre
versiones están en [`contracts/CHANGELOG.md`](contracts/CHANGELOG.md).

El servidor valida cada request y cada response contra ese contrato. Si un request no lo cumple
responde `400`; si una respuesta propia lo viola responde `500` con `error: contract_violation`
y en `message` el campo que falla (señal de que el mock quedó desalineado).

### Headers de prueba (modo mock)

Con `DATA_SOURCE=mock` no se valida el token de Cognito. En su lugar:

| Header | Valores | Por defecto |
|---|---|---|
| `x-mock-role` | `patient` o `professional` | `patient` |
| `x-mock-user-id` | cualquier texto | `pat_4471` (paciente) / `pro_0001` (profesional) |
| `x-mock-consent` | `false` simula consentimiento no aceptado | (no se envía) |

### Casos de error simulables

| Qué hacer | Resultado |
|---|---|
| `POST /me/professionals` con `invitationCode` distinto de `ADEPT-TEST` | `404 invitation_invalid` |
| `POST /sessions` con el header `x-mock-consent: false` | `403 consent_required` |
| Cualquier ruta con un id de path igual a `not-found` (ej. `GET /professional/alerts/not-found`) | `404 not_found` |
| Un rol que no corresponde a la operación (ej. paciente en `GET /professional/alerts`) | `403 forbidden` |
| `DELETE /me` sin `confirm=true` (en modo mock no borra nada) | `400 bad_request` |

### Autenticación (`AUTH_MODE`)

- `AUTH_MODE=mock` (valor por defecto): rol y usuario salen de los headers de prueba de arriba.
- `AUTH_MODE=cognito`: se verifica el token de acceso de Amazon Cognito que viene en
  `Authorization: Bearer <token>`. El usuario sale del token y el rol de su grupo
  (`patients` -> `patient`, `professionals` -> `professional`). Sin token o con token inválido responde
  `401 unauthorized`; con un usuario sin ninguno de esos grupos, `403 forbidden`. `GET /health` no pide token.

Es independiente de `DATA_SOURCE`: con `AUTH_MODE=cognito` y `DATA_SOURCE=mock` la identidad es real
y los datos siguen siendo fijos. Si faltan variables de Cognito, el servicio no arranca y dice cuáles faltan.

### Variables de entorno de `conversational-agent`

| Variable | Para qué sirve | Por defecto |
|---|---|---|
| `PORT` | Puerto del servidor local | `3000` |
| `DATA_SOURCE` | `mock` (datos fijos) o `real` (todavía responde 501) | `mock` |
| `AUTH_MODE` | `mock` o `cognito` | `mock` |
| `USER_POOL_ID` | Grupo de usuarios de Cognito (obligatoria con `AUTH_MODE=cognito`) | — |
| `COGNITO_CLIENT_IDS` | IDs de los clientes de Cognito permitidos, separados por comas (obligatoria con `AUTH_MODE=cognito`) | — |
| `CORS_ORIGINS` | Orígenes permitidos por CORS, separados por comas (`*` = cualquiera) | cualquiera, solo en modo mock |
| `OPENAPI_SPEC_PATH` | Ruta al contrato OpenAPI | `contracts/openapi.yaml` del repo |

### Pruebas

```bash
cd services/conversational-agent
npm test
```

Prueba el middleware de Cognito con un verificador falso (sin red ni credenciales de AWS).

### Despliegue en AWS

El mismo servicio se despliega como una función Lambda detrás de un API Gateway, con autenticación
real de Cognito y datos todavía fijos (mock). La infraestructura está en [`infra/`](infra/README.md),
que explica paso a paso, para Windows PowerShell, cómo desplegarla, crear usuarios de prueba, correr
`npm run smoke` contra la URL real y borrar todo.

### CORS

El panel profesional corre en un navegador, así que el servidor responde CORS (incluido el
preflight `OPTIONS`). La variable `CORS_ORIGINS` es una lista de orígenes separados por comas
(ej. `http://localhost:5173,https://panel.ejemplo.com`). Si no se define, se permite cualquier
origen, pero solo con `DATA_SOURCE=mock`.

### Prueba de humo del contrato

Con el servidor corriendo (`npm run dev`), en otra terminal:

```bash
cd services/conversational-agent
npm run smoke
```

Recorre las 25 operaciones del contrato y muestra `ok` o `FAIL` por cada una; termina con
código 1 si alguna falla. Usa `BASE_URL` (por defecto `http://localhost:3000`) si el servidor
está en otra dirección.

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

**Modelo de emociones.** El modelo entrenado se coloca en `services/ml-service/models/beto-emoevent/`
(esa carpeta no va a git porque pesa cientos de MB). Para comprobar que, cargado en tu máquina, da
los mismos resultados que en Colab, corré desde `services/ml-service`:

```bash
python scripts/check_model.py
```

Las versiones de `requirements.txt` están fijas a propósito: el modelo se entrenó con
`transformers` 4.57.6, y usar otra versión puede cambiar su comportamiento. Todavía no hay
ningún endpoint que use el clasificador; por ahora solo se verifica con ese script.

## Entrenamiento del clasificador

El clasificador de emociones (BETO ajustado con EmoEvent_es, siete categorías) se entrena en Google Colab.
El notebook, los resultados de cada corrida y cómo repetirla están en
[`training/beto-emoevent/`](training/beto-emoevent/README.md); los descubrimientos, errores corregidos y
decisiones están en el [registro de experimentación](docs/experimentos/registro-clasificador.md).
Los pesos del modelo no se versionan.

## Qué NO está implementado todavía

Todo esto se va a ir agregando en etapas siguientes, de a una por vez:

- Conexión a base de datos.
- Llamadas a un LLM externo.
- Clasificador de emociones expuesto por la API (el modelo ya se entrena y se verifica, pero ningún endpoint lo usa).
- Motor de recomendación de ejercicios.
- Infraestructura AWS completa: hoy solo existe el stack de desarrollo (Cognito + API con datos mock), sin base de datos ni colas.
