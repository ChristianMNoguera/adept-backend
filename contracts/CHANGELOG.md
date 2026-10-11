# Changelog del contrato (`openapi.yaml`)

Para el frontend: qué cambió entre versiones de la API.

## 0.3.2

### Cambio de contenido (sin cambio de forma)

- **Consentimiento informado, versión `1.1`:** `GET /consent/terms` ahora devuelve la versión `1.1` y el texto completo (qué es ADEPT, qué información se recopila, cómo se usa, qué se guarda y por cuánto tiempo, el envío de mensajes a un proveedor externo, quién ve los indicadores, los derechos de la persona y los avisos). Los ejemplos de `GET /consent/terms`, `GET /me/consent`, `PUT /me/consent` (pedido y respuesta) y el campo `consent` de `GET /me` pasan de `1.0` a `1.1`.
- **Qué tiene que hacer el frontend:** no hay campos nuevos ni cambios de esquema. Como `PUT /me/consent` solo acepta la versión vigente, quien aceptó la `1.0` tiene que volver a aceptar: la app debe mostrar el texto que devuelve `GET /consent/terms` y enviar su `version` al aceptar. Mientras no lo haga, `POST /sessions` responde `403` con `consent_required`.
- El texto todavía tiene un dato pendiente: el correo de contacto del equipo figura como `[COMPLETAR: correo del equipo]`.

## 0.3.1

### Cambios aditivos (no rompen clientes existentes)

1. **Nuevos códigos de error en `POST /sessions/{sessionId}/messages` y `POST /sessions/{sessionId}/exercises/{exerciseId}/responses`:** `409` (`error: session_closed`, la sesión ya está cerrada) y `503` (`error: llm_unavailable`, el servicio que genera las respuestas no está disponible). Ambos con ejemplo.
2. **`GET /me`:** nuevo `404` (`error: profile_not_found`) cuando el usuario está autenticado pero su perfil todavía no existe.
3. **`PUT /me/consent`:** el `400` ahora tiene dos ejemplos; el nuevo es `error: invalid_consent_version` (la versión enviada no es la vigente). El código y el esquema del `400` no cambian.
4. **`500` (`error: internal_error`)** declarado en las operaciones que ya tienen lógica real: `GET /me`, `GET /consent/terms`, `GET /me/consent`, `PUT /me/consent`, `POST /sessions` y `POST /sessions/{sessionId}/close`.
5. **Aclaraciones de texto, sin cambio de comportamiento:** `POST /sessions/{sessionId}/close` es idempotente (cerrar una sesión ya cerrada devuelve el mismo resumen; si no existe o es de otro usuario, `404`) y `messageCount` cuenta los mensajes de ambos lados, incluido el saludo. `GET /me/consent` sin respuesta previa devuelve `accepted: false`.

### Cambio restrictivo (puede romper clientes)

6. **Largo de los textos:** `SendMessageRequest.text` ahora exige entre 1 y 1000 caracteres, y `ExerciseResponseRequest.response` entre 1 y 500. Un cliente que envíe un texto vacío o más largo recibe `400`.

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
