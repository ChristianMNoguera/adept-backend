# ADR-0005: LocalStack + AWS CDK para infraestructura local

- **Fecha:** 2026-09-28
- **Estado:** Aceptada
- **Nota de implementación:** esta pieza todavía no está construida —
  corresponde a un futuro desarrollo.

## Contexto

Se busca desarrollar y probar el backend localmente antes de desplegarlo a
AWS, con la condición explícita de que la migración a AWS real sea
transparente (el mismo código de negocio y la misma definición de
infraestructura deben funcionar en ambos entornos, sin reescritura).

## Decisión

- **LocalStack** emula localmente DynamoDB, S3, SQS y Lambda.
- **AWS CDK en TypeScript** define la infraestructura como código, con el
  mismo stack desplegable contra LocalStack (usando `cdklocal`) o contra AWS
  real, según una variable de entorno — sin mantener dos definiciones
  separadas.
- El SDK de AWS (tanto en Node como en Python) usa un `endpoint_url`
  configurable por variable de entorno: local apunta a LocalStack, en AWS
  real esa variable no se define y el SDK usa el endpoint real por default.

## Alternativas consideradas

- **Mocks individuales por servicio** (DynamoDB Local, `moto` para S3, etc.
  por separado): descartado por mayor fragmentación de herramientas y menor
  paridad de comportamiento entre sí.
- **Terraform o AWS SAM** para la infraestructura como código: descartado
  para mantener la definición de infraestructura en el mismo lenguaje que el
  backend (TypeScript), sin context-switching a HCL o YAML.

## Consecuencias

- El soporte de **Amazon Cognito en LocalStack Community (gratuito) es
  parcial**. Durante el desarrollo local, la autenticación se va a simular
  con un middleware stub; Cognito real recién se prueba al migrar a AWS, no
  antes. Esto es una limitación conocida, no un error a resolver localmente.
