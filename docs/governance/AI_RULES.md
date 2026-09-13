# AI_RULES.md

Versión: 1.0

Estado: Documento Rector para Inteligencias Artificiales

---

# 1. Objetivo

Este documento define las reglas obligatorias que debe respetar cualquier Inteligencia Artificial que participe en el desarrollo del proyecto CalculadorasIngenieria.

Estas reglas tienen prioridad sobre cualquier decisión automática que la IA considere conveniente.

Si existe un conflicto entre una optimización propuesta por la IA y este documento, deberá prevalecer este documento.

---

# 2. Filosofía

La IA no desarrolla calculadoras.

La IA desarrolla una plataforma de ingeniería.

Cada decisión debe tomarse pensando en la evolución del proyecto durante muchos años.

Las soluciones temporales o rápidas deben evitarse si comprometen la arquitectura futura.

---

# 3. Antes de escribir código

Antes de generar cualquier código, la IA debe responder internamente las siguientes preguntas:

• ¿Ya existe esta funcionalidad?

• ¿Existe una implementación reutilizable?

• ¿Estoy duplicando código?

• ¿La nueva funcionalidad pertenece realmente a este módulo?

• ¿Debería formar parte del motor compartido?

Si alguna respuesta indica una duplicación o una violación de la arquitectura, deberá detenerse y proponer una alternativa.

---

# 4. Principio Fundamental

Ningún módulo implementa algoritmos científicos.

Toda la lógica matemática pertenece al motor compartido.

La interfaz únicamente:

• recibe datos

• valida entradas

• invoca el motor

• muestra resultados

---

# 5. Arquitectura

Toda modificación deberá respetar la arquitectura definida en ENGINEERING_GUIDE.md.

La IA nunca deberá modificar la estructura general del proyecto sin autorización explícita.

---

# 6. API Pública

Los módulos solo pueden importar funciones desde:

shared/math/index.js

Nunca deberán acceder directamente a archivos internos.

Incorrecto:

shared/math/algebra/determinant.js

Correcto:

shared/math/index.js

---

# 7. Motor Compartido

Antes de implementar cualquier algoritmo, la IA deberá comprobar si ya existe.

Si existe:

Debe reutilizarlo.

Si no existe:

Debe proponer incorporarlo al motor compartido.

Nunca implementarlo únicamente dentro de un módulo.

---

# 8. Nuevos Algoritmos

Todo algoritmo nuevo deberá incluir:

JSDoc

validación

manejo de errores

ejemplo de uso

complejidad computacional

referencias bibliográficas cuando corresponda

pruebas unitarias

---

# 9. Calidad del Código

Toda función debe cumplir:

Una única responsabilidad.

Nombre descriptivo.

Código legible.

Sin efectos secundarios innecesarios.

Sin duplicaciones.

Sin variables globales.

---

# 10. Límites de Tamaño

Como regla general:

Funciones:

máximo 50 líneas.

Archivos:

máximo 500 líneas.

Si resulta necesario superar esos valores, la IA deberá justificar técnicamente la decisión.

---

# 11. Dependencias

Está prohibido incorporar:

Frameworks.

Librerías externas.

CDN.

Dependencias npm.

Salvo autorización explícita.

El proyecto debe permanecer basado en:

HTML5

CSS3

JavaScript Vanilla

ES Modules

---

# 12. Compatibilidad

Toda modificación deberá mantener compatibilidad con el resto del proyecto.

No se deberán eliminar funciones públicas sin autorización.

---

# 13. Manejo de Errores

Nunca utilizar:

throw "error"

Siempre utilizar clases específicas.

Ejemplo:

DimensionError

InterpolationError

SingularMatrixError

MathError

---

# 14. Precisión Numérica

Nunca comparar números reales mediante ==.

Siempre utilizar tolerancias.

Las funciones deberán aceptar precisión configurable cuando corresponda.

---

# 15. Conversión de Unidades

Toda conversión deberá utilizar exclusivamente:

shared/math/units/

No se permiten conversiones locales.

---

# 16. Interpolación

Toda interpolación deberá utilizar:

shared/math/interpolation/

La calculadora ISA no implementará interpolación propia.

---

# 17. Métodos Numéricos

Todo método numérico deberá implementarse una única vez.

Posteriormente será reutilizado por cualquier módulo.

---

# 18. Documentación

Todo archivo deberá contener:

Descripción.

Autor.

Fecha de creación.

Dependencias.

Funciones exportadas.

Ejemplos de uso.

---

# 19. Comentarios

No comentar qué hace JavaScript.

Comentar por qué se tomó una decisión.

Evitar comentarios redundantes.

---

# 20. Pruebas Unitarias

Todo algoritmo nuevo deberá incluir pruebas.

Las pruebas deberán verificar:

Casos normales.

Casos límite.

Errores esperados.

Valores conocidos.

---

# 21. Seguridad

Validar todas las entradas provenientes del usuario.

Nunca asumir que los datos son correctos.

---

# 22. Rendimiento

La IA deberá elegir algoritmos eficientes.

No deberá utilizar algoritmos exponenciales cuando exista una alternativa polinómica razonable.

---

# 23. Refactorización

Si durante el desarrollo la IA detecta código duplicado:

No deberá ignorarlo.

Deberá proponer una refactorización.

---

# 24. Decisiones Arquitectónicas

Toda decisión importante deberá ser explicada antes de implementarse.

La explicación deberá incluir:

Problema.

Alternativas.

Ventajas.

Desventajas.

Impacto futuro.

---

# 25. Restricciones

La IA nunca deberá:

Romper la arquitectura.

Duplicar algoritmos.

Modificar la API pública sin justificación.

Eliminar compatibilidad.

Crear dependencias innecesarias.

Implementar soluciones temporales.

---

# 26. Calidad Profesional

El código generado deberá ser comparable al de un proyecto profesional de ingeniería.

Debe priorizar:

Legibilidad.

Escalabilidad.

Mantenibilidad.

Reutilización.

Robustez.

---

# 27. Entrega

La IA nunca deberá entregar:

Código resumido.

Fragmentos incompletos.

Comentarios como:

"..."

"Aquí continúa..."

"Resto del código..."

Todos los archivos deberán entregarse completos.

---

# 28. Rol de la IA

La IA actúa como desarrollador.

No como arquitecto.

Las decisiones de arquitectura corresponden al documento ENGINEERING_GUIDE.md y al responsable del proyecto.

Si considera conveniente modificar la arquitectura, deberá proponer el cambio y esperar aprobación antes de implementarlo.

---

# 29. Objetivo Final

El objetivo no es únicamente desarrollar calculadoras.

El objetivo es construir una plataforma científica modular, escalable y mantenible que pueda evolucionar durante muchos años e incorporar nuevas disciplinas de ingeniería sin reestructuraciones importantes.

Toda decisión deberá evaluarse considerando ese objetivo.