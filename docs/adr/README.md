# Registro de Decisiones de Arquitectura (ADR)

Un ADR documenta una decisión de arquitectura: el problema, las alternativas
que se evaluaron, qué se eligió y qué consecuencias tiene. `AI_RULES.md` §24 ya
exige que toda decisión importante se explique antes de implementarse; este
directorio es dónde queda esa explicación.

## Por qué

Dentro de seis meses, la pregunta "¿por qué el motor usa una clase `Matrix` y
no arreglos planos?" va a tener una respuesta en algún lado o no va a tenerla.
Si no la tiene, alguien —una persona o una IA— va a proponer cambiarlo, y no
habrá forma de saber si ya se discutió.

Un ADR no se borra ni se edita cuando queda obsoleto: se marca como
**Reemplazado por ADR-XXX** y se escribe uno nuevo. El historial de decisiones
descartadas es tan útil como el de las vigentes.

## Formato

```markdown
# ADR-XXX — Título

- Fecha:
- Estado: Propuesto | Aceptado | Reemplazado por ADR-YYY
- Decide:

## 1. Contexto
Qué problema hay y por qué hay que decidir ahora.

## 2. Alternativas consideradas
Cada una con sus ventajas y desventajas reales, no de compromiso.

## 3. Decisión
Qué se eligió, en concreto.

## 4. Consecuencias
A favor / En contra / Impacto futuro.
```

## Quién los escribe

El Chat 1 (Arquitectura y Gobernanza). Ningún otro chat modifica este
directorio (`CHAT_ROLES.md` §4).

## Índice

| ADR | Título | Estado |
|---|---|---|
| [001](ADR-001-motor-canonico.md) | Motor canónico y port de capacidades | Aceptado |
| [002](ADR-002-ejecucion-esm.md) | ES Modules servidos por HTTP | Aceptado |
| [003](ADR-003-organizacion-chats.md) | Organización del trabajo en chats por capa | Aceptado |
| [004](ADR-004-correccion-autovalores.md) | Corregir los autovalores portando Jacobi, no parcheando el QR | Aceptado |
| [005](ADR-005-api-de-autovalores.md) | Nombres de la API de autovalores | Aceptado |
| [006](ADR-006-interfaz-antes-que-port.md) | La primera calculadora va antes que el resto del port | Aceptado |
