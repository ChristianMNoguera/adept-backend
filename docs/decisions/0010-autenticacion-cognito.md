# ADR-0010: Autenticación con Amazon Cognito

- **Fecha:** 2026-10-04
- **Estado:** Aceptada
- **Nota de implementación:** pieza todavía no construida; corresponde al esqueleto
  en AWS.

## Contexto

El RNF11 de la versión inicial de la tesis exigía almacenar las contrase. Eso agrega código y riesgo de seguridad sin aportar al objetivo del proyecto. Amazon Cognito resuelve el registro, la autenticación y la renovación de
sesión (RF01 y RF02), y no expone un algoritmo de hash configurable.

## Decisión

- La autenticación y la gestión de credenciales se delegan en un grupo de usuarios de
  Amazon Cognito, con autenticación SRP (la contraseña no se transmite por la red) y
  dos grupos: `patients` y `professionals`.
- El backend no almacena ni procesa contraseñas. Valida el token de acceso en cada
  solicitud dentro de la propia aplicación y obtiene de él la identidad (`userId`) y
  el rol. Así se mantiene una única forma de error en la API y se reutiliza el
  middleware de control de rol.
- El RNF11 y las secciones 3.3.2 y 3.3.4 de la tesis se ajustan a este diseño.

## Alternativas consideradas

- **Autenticación propia con Argon2id:** descartada por costo y riesgo.
- **Authorizer administrado del API Gateway:** descartado, porque sus respuestas de
  error no siguen el formato de error del contrato y no resuelve el control por rol
  de cada operación.

## Consecuencias

- El rol se elige en el registro (RF01) y lo asigna el backend al grupo. Un usuario
  podría registrarse como profesional, pero no accede a datos de ningún paciente sin
  su aprobación explícita (RF03). Queda como limitación a documentar.
- En desarrollo local la autenticación se simula (ADR-0004 y ADR-0005); Cognito real
  se prueba al desplegar.
