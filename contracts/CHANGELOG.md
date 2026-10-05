# Changelog del contrato (`openapi.yaml`)

Para el frontend: qué cambió entre versiones de la API.

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
