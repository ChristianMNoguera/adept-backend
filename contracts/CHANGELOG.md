# Changelog del contrato (`openapi.yaml`)

Para el frontend: qué cambió entre versiones de la API.

## 0.3.0

### Cambios incompatibles (cambian formas de respuesta; el frontend tiene que adaptarse)

1. **Categorías emocionales:** ahora son siete: `anger`, `disgust`, `fear`, `joy`, `sadness`, `surprise` y `others`. Se eliminan `positive_active`, `neutral`, `withdrawn_sad` y `anxious`. Afecta a `latestEmotion` (lista de pacientes), `latestLabel` y `distribution` (dashboard, que ahora trae las siete claves) y `emotionLabel` (historial).
2. **Indicadores en MAD:** `IndicatorComparison` pierde `baselineMean`, `deviationPct` e `isOutlier`, y gana `personalMedian`, `robustDistance` y `affected`. Se usa en el detalle de sesión (`.../indicators`) y en `affectedIndicators` de las alertas.
3. **Dashboard:** `linguisticIndicators` ya no tiene `ttrLatest`, `ttrBaseline` ni `variationPct`; ahora es `{ "indicators": [...] }` con cuatro indicadores (`ttr`, `avg_length_words`, `avg_response_seconds`, `coherence`).
4. **Historial:** cada punto agrega `avgLengthWords`, `avgResponseSeconds` y `coherence` (opcionales).

### Agregado

5. **`DELETE /me`** (eliminar cuenta, CU07): rol `patient`, exige el parámetro de query `confirm=true` (si falta o no es `true`, responde 400) y responde 204 sin cuerpo. Operación nueva: el contrato pasa a tener 25 operaciones.

### Otros cambios

6. El saludo de `POST /sessions` ya no incluye el nombre del usuario (RNF12).
7. `info.description` documenta el cierre de sesión, las siete categorías y el significado de MAD (solo texto).

## 0.2.1

- Declara la respuesta 400 (bad_request) en las 15 operaciones con body o parámetros.
- Agrega el ejemplo consent_required al 403 de POST /sessions.
- Quita info.x-changelog (este archivo es la única fuente).
Sin cambios de comportamiento.

## 0.2.0

### Agregado

- **Usuario y consentimiento:** `GET /me`, `GET /consent/terms`, `GET /me/consent`, `PUT /me/consent`.
- **Vinculación paciente-profesional:** `GET /me/professionals`, `POST /me/professionals` (por código de invitación), `DELETE /me/professionals/{professionalId}`, `POST /professional/invitations`.
- **Privacidad:** `GET /me/privacy`, `PUT /me/privacy`.
- **Panel profesional:** `GET /professional/patients`, `GET` y `PUT /professional/patients/{patientId}`, `GET` de `dashboard`, `history` e `indicators` por paciente/sesión.
- **Alertas:** `GET /professional/alerts`, `GET /professional/alerts/{alertId}`, `POST /professional/alerts/{alertId}/review`.
- Autenticación con JWT de Cognito (`Authorization: Bearer`) y rol por operación (`x-required-role`).
- `POST /sessions` puede responder `403` con `error: consent_required` si falta aceptar el consentimiento.

### Cambio incompatible

- `POST /sessions` **ya no recibe `patientId` en el body**: el paciente se identifica por el token. Hay que dejar de enviarlo.

## 0.1.0

- Primera versión: `POST /sessions`, `POST /sessions/{sessionId}/messages`, `POST /sessions/{sessionId}/exercises/{exerciseId}/responses` y `POST /sessions/{sessionId}/close`.
