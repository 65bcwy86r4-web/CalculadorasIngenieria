# WORKFLOW.md

Versión: 1.0

Este documento define el flujo de trabajo obligatorio para cualquier tarea de desarrollo dentro del proyecto CalculadorasIngenieria.

---

# Fase 1 - Comprensión

Antes de escribir código:

1. Leer completamente:

- ENGINEERING_GUIDE.md
- AI_RULES.md
- CODING_STANDARDS.md

2. Analizar el estado actual del proyecto.

3. Comprender completamente la tarea solicitada.

No asumir requisitos que no fueron especificados.

---

# Fase 2 - Análisis

Antes de implementar:

- Revisar si la funcionalidad ya existe.
- Revisar si existe código reutilizable.
- Revisar si la funcionalidad pertenece al motor compartido.
- Detectar posibles duplicaciones.

Si detectas una mejora arquitectónica importante:

NO la implementes.

Primero explícala y espera aprobación.

---

# Fase 3 - Planificación

Antes de escribir código:

Presenta un plan técnico breve indicando:

- archivos nuevos;
- archivos modificados;
- dependencias;
- impacto sobre el proyecto.

Espera aprobación si el cambio afecta la arquitectura o la API pública.

---

# Fase 4 - Implementación

Implementa únicamente la funcionalidad solicitada.

Respeta estrictamente:

- ENGINEERING_GUIDE.md
- AI_RULES.md
- CODING_STANDARDS.md

No agregues funcionalidades no solicitadas.

No refactorices partes no relacionadas salvo que sea imprescindible.

---

# Fase 5 - Verificación

Al finalizar:

- verificar imports;
- verificar ES Modules;
- verificar compatibilidad;
- verificar API pública;
- verificar ausencia de código duplicado;
- verificar JSDoc;
- verificar validaciones;
- verificar manejo de errores.

---

# Fase 6 - Entrega

Entregar únicamente:

- archivos nuevos;
- archivos modificados.

Para cada uno indicar:

- motivo;
- dependencias;
- impacto.

No regenerar archivos sin cambios.

No resumir código.

No utilizar placeholders.

---

# Fase 7 - Informe

Finalizar siempre con un informe que incluya:

## Resumen

Qué se implementó.

## Arquitectura

Qué decisiones se tomaron.

## Compatibilidad

Confirmar que no se rompió la API pública.

## Próximos pasos

Sugerencias para la siguiente versión (sin implementarlas).