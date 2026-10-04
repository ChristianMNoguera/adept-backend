# ADR-0004: Selección de origen de datos vía `DATA_SOURCE`

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto

El backend se construye antes de que el frontend real exista, y necesita
soportar datos simulados (mock) para pruebas tempranas y para que el
frontend pueda integrarse sin depender de que la lógica real esté lista.
Es necesario que la separación entre datos mock y datos reales esté bien
identificada en el código, no implícita.

## Decisión

Una variable de entorno `DATA_SOURCE` (`mock` por defecto, o `real`), leída
por cada servicio al arrancar. En modo `mock`, los endpoints devuelven
respuestas fijas y predecibles. En modo `real`, los endpoints devuelven
`501 Not Implemented` hasta que exista la lógica verdadera detrás.

## Alternativas consideradas

- **Dos ramas (branches) de código separadas, una mock y otra real:**
  descartado. El riesgo de que las dos ramas diverjan con el tiempo es alto,
  y mezclar cambios de una a la otra es trabajo extra sin necesidad.

## Consecuencias

- Cada endpoint nuevo debe implementar explícitamente la respuesta en modo
  mock (y, cuando corresponda, la respuesta `501` en modo real) siguiendo
  este mismo patrón, antes de o junto con la implementación real.
- Un endpoint que no respeta este patrón es una desviación a corregir.
