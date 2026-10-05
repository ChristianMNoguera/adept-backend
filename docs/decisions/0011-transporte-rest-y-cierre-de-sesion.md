# ADR-0011: Transporte REST sobre HTTPS y procesamiento por lotes al cerrar la sesión

- **Fecha:** 2026-10-01
- **Estado:** Aceptada

## Contexto

La sección 3.3.2 de la tesis describía un gateway bidireccional en tiempo real, pero el
contrato de la API es REST. Además, el documento decía en un pasaje que el texto se
encola "al concluir cada turno" y en otro que el procesamiento se activa "al finalizar
la sesión" (RF09, RNF07, sección 3.3.5).

## Decisión

- La app móvil se comunica con el backend mediante solicitudes HTTPS: una por cada
  intervención del usuario, con la respuesta del agente en la misma solicitud. El
  RNF01 (3 s para texto, 5 s para voz) se cumple con este esquema.
- El procesamiento por lotes se dispara una sola vez, al **cerrar la sesión**. Se
  encola una tarea por sesión con las intervenciones del usuario; la tarea calcula los
  indicadores, clasifica la emoción por intervención, persiste las métricas derivadas
  y descarta el texto (RNF07).
- Una sesión se cierra por pedido del usuario o por inactividad prolongada, para que
  una sesión abandonada no quede sin procesar. El texto temporal de una sesión tiene
  un vencimiento automático como resguardo.

## Alternativas consideradas

- **WebSocket bidireccional:** descartado para el MVP; agrega infraestructura sin
  beneficio medible para el RNF01.
- **Encolar en cada turno:** descartado; contradice el RF09 y obliga a consolidar
  resultados parciales.

## Consecuencias

- Las secciones 3.3.2 y 3.3.5 de la tesis se unifican en el cierre de sesión.
- El valor del tiempo de inactividad es un parámetro operativo que se fija al
  implementar el cierre automático.
