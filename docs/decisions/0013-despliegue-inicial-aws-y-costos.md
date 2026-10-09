# ADR-0013: Despliegue inicial en AWS y control de costos

- **Fecha:** 2026-10-06
- **Estado:** Aceptada

## Contexto

El Hito 3 lleva a AWS el servicio que hasta entonces respondía en modo mock, para que el
frontend (app móvil y panel web) integre contra una URL real y con autenticación real. El proyecto usa la capa gratuita y tiene alertas de presupuesto creadas antes del primer despliegue.

## Decisión

- **Región y herramienta:** `sa-east-1` (São Paulo) y AWS CDK en TypeScript, con un stack de
  desarrollo (`AdeptDevStack`) en `infra/`. Los comandos que crean recursos
  (`cdk bootstrap` y `cdk deploy`) los ejecuta el equipo; la herramienta de
  generación de código no usa credenciales de AWS.
- **Cómputo:** una función Lambda (Node.js 22, 512 MB, 10 s, sin VPC) que ejecuta la
  aplicación Express a través de `@codegenie/serverless-express`, detrás de una API de
  API Gateway de tipo HTTP con ruta por defecto. Límite de 20 solicitudes por segundo con
  ráfaga de 40. Sin concurrencia reservada.
- **Identidad:** Amazon Cognito (ADR-0010). La aplicación verifica el token en cada
  solicitud. `AUTH_MODE` (`mock` o `cognito`) es independiente de `DATA_SOURCE`: el
  entorno desplegado usa identidad real y datos todavía fijos.
- **Cliente de pruebas:** el cliente `adept-dev-test` figura entre los aceptados por la API
  solo en el stack de desarrollo. Solo emite tokens a quien tenga credenciales de
  administrador sobre el grupo de usuarios.
- **Costos:** sin NAT Gateway, sin VPC y sin servicios con cargo por hora; logs con
  retención de 7 días; recursos con política de borrado para poder eliminar todo con
  `cdk destroy`. Los secretos futuros se guardarán en Parameter Store estándar y no en
  Secrets Manager.
- **Credenciales de desarrollo:** usuario de IAM que no es el usuario raíz, con sesión
  temporal (`aws login`); las claves de acceso de larga duración quedan como plan B y se
  eliminan al terminar.

## Verificación

Prueba de humo contra la API desplegada el 2026-10-06: 25 de 25 operaciones del contrato
v0.3.0, con tokens reales de Cognito de un paciente y un profesional de prueba. La función
arrancó con Node.js 22 aunque la librería declara Node 24 como requisito;
no fue necesario cambiar el runtime.

## Alternativas consideradas

- **Authorizer de API Gateway:** descartado en el ADR-0010.
- **API de tipo REST en API Gateway:** más costosa y con funciones que el MVP no usa.
- **Contenedores (Fargate) o servidores (EC2):** introducen costos fijos por hora.
- **Runtime Node.js 24:** innecesario, porque Node.js 22 funcionó.

## Consecuencias

- **Riesgos aceptados solo en desarrollo:** CORS abierto a cualquier origen, registro de
  usuarios abierto a quien conozca el identificador del cliente de la app, correo
  remitente por defecto de Cognito (con tope diario) y rol elegido por el usuario al
  registrarse (ADR-0010).
- **Antes de cualquier uso fuera de desarrollo:** limitar CORS, excluir el cliente de
  pruebas de la lista de clientes aceptados, evaluar un servicio de correo propio y una
  protección adicional contra tráfico abusivo.
- Todavía no hay base de datos ni servicio de clasificación desplegados; el servicio de
  ML llegará como función con contenedor en un hito posterior.

