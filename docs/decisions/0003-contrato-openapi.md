# ADR-0003: Contrato de API first con OpenAPI

- **Fecha:** 2026-09-25
- **Estado:** Aceptada

## Contexto

El frontend de ADEPT se desarrolla por separado del backend, en paralelo. Se busca que la integración entre ambos sea lo menos
dolorosa posible, sin que el frontend tenga que esperar a que el backend
esté terminado.

## Decisión

El contrato REST se define formalmente en OpenAPI 3.0, en
`contracts/openapi.yaml`, **antes** de implementar la lógica real de cada
endpoint. El frontend puede generar un servidor simulado (mock server) a
partir de ese archivo y empezar a desarrollarse sin depender del backend
real.

## Alternativas consideradas

- **Documentar la API de forma informal a medida que se construye:**
  descartado. Sin un contrato formal y verificable, es habitual que la
  documentación y el código real terminen desalineados, y ese desvío se
  descubre recién al integrar — el peor momento posible.

## Consecuencias

- Cualquier cambio en la forma de un request o response se define primero
  en `contracts/openapi.yaml`, no directamente en el código.
- El archivo de contrato es la fuente de verdad para ambos lados
  (backend y frontend); un desvío del código respecto del contrato se
  considera un error a corregir, no una variante aceptable.
