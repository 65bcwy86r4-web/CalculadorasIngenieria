# CalculadorasIngenieria

Engineering Guide

Versión: 1.0

Estado: Documento Rector del Proyecto

---

# 1. Filosofía del Proyecto

CalculadorasIngenieria es una plataforma modular de herramientas científicas y de ingeniería diseñada para acompañar a un estudiante y posteriormente a un profesional durante toda su carrera.

No es una colección de calculadoras independientes.

Es una única aplicación compuesta por módulos especializados que comparten una arquitectura común y un motor científico reutilizable.

Cada nueva funcionalidad deberá integrarse respetando esta filosofía.

---

# 2. Objetivos

El proyecto debe cumplir simultáneamente cuatro objetivos.

• Ser útil para resolver problemas reales de ingeniería.

• Servir como herramienta de aprendizaje.

• Mantener una arquitectura limpia y escalable.

• Poder evolucionar durante muchos años sin necesidad de reescrituras masivas.

---

# 3. Principios de Diseño

Todo el proyecto deberá respetar los siguientes principios.

## Modularidad

Cada disciplina constituye un módulo independiente.

Los módulos no deben depender entre sí.

Toda dependencia común deberá ubicarse en shared/.

---

## Bajo Acoplamiento

Los módulos nunca implementarán algoritmos científicos propios.

Toda lógica matemática pertenece al motor compartido.

---

## Alta Cohesión

Cada archivo tendrá una única responsabilidad.

No se permiten archivos "todoterreno".

---

## DRY

Nunca duplicar algoritmos.

Si una función puede reutilizarse, debe existir una sola implementación.

---

## Open/Closed Principle

El proyecto debe poder extenderse agregando módulos sin modificar los existentes.

---

## Single Responsibility

Cada clase, función o archivo debe resolver un único problema.

---

# 4. Arquitectura General

CalculadorasIngenieria/

assets/

css/

docs/

js/

modules/

shared/

tests/

index.html

---

# 5. Organización de Módulos

Cada módulo representa una disciplina.

Ejemplo

modules/

algebra/

matematica/

fisica/

aeronautica/

quimica/

electronica/

conversiones/

propulsion/

motores/

ecu/

Cada módulo posee únicamente:

interfaz

captura de datos

visualización

Toda lógica científica vive en shared/.

---

# 6. Motor Científico Compartido

Toda operación matemática deberá implementarse únicamente dentro de

shared/math/

Los módulos accederán exclusivamente mediante

shared/math/index.js

Está prohibido importar archivos internos.

Correcto

import { determinant } from shared/math/index.js

Incorrecto

import determinant from shared/math/algebra/determinant.js

---

# 7. Interfaz

La interfaz nunca realizará cálculos.

Su única responsabilidad será:

leer datos

validarlos

invocar el motor

mostrar resultados

---

# 8. API Pública

Toda función reutilizable deberá exponerse mediante la API pública.

La estructura interna podrá cambiar.

La API pública no.

---

# 9. Estilo de Código

JavaScript moderno.

ES Modules.

Funciones pequeñas.

Comentarios JSDoc.

Variables descriptivas.

Sin código duplicado.

Sin variables globales.

Sin dependencias externas salvo aprobación explícita.

---

# 10. Manejo de Errores

Nunca utilizar

throw "error"

Siempre crear excepciones propias.

DimensionError

MathError

SingularMatrixError

InterpolationError

etc.

---

# 11. Precisión Numérica

Nunca comparar números de punto flotante mediante ==.

Utilizar tolerancias.

Toda función deberá aceptar precisión configurable cuando sea apropiado.

---

# 12. Conversión de Unidades

Toda conversión deberá utilizar el sistema común ubicado en

shared/math/units/

No se permiten conversiones implementadas dentro de los módulos.

---

# 13. Interpolaciones

Toda interpolación deberá utilizar

shared/math/interpolation/

La futura calculadora ISA utilizará exactamente las mismas funciones que cualquier otra calculadora.

---

# 14. Métodos Numéricos

Todos los métodos deberán implementarse una única vez.

Ejemplos

Newton

Secante

Bisección

Simpson

Trapecios

Runge-Kutta (futuro)

---

# 15. Testing

Todo algoritmo nuevo deberá incluir pruebas unitarias.

Los tests forman parte del proyecto.

No son opcionales.

---

# 16. Documentación

Todo algoritmo deberá poseer

JSDoc

ejemplos

complejidad computacional

referencia bibliográfica cuando corresponda

---

# 17. Git

main

Siempre estable.

develop

Integración.

feature/...

Nuevas funcionalidades.

Nunca desarrollar directamente sobre main.

---

# 18. Convención de Commits

feat:

Nueva funcionalidad

fix:

Corrección

docs:

Documentación

refactor:

Refactorización

test:

Pruebas

style:

Formato

---

# 19. Roadmap

Versión 2

Arquitectura modular

Motor compartido

Dashboard

Versión 3

Historial

Favoritos

PWA

Exportación

Versión 4

Gráficos

Vectores

Planos

Visualización científica

Versión 5

ISA

Motores

Aerodinámica

Propulsión

Métodos numéricos

Versión 6

Herramientas aeroespaciales

Análisis estructural

Simulación

---

# 20. Reglas para IA

Toda IA que participe en este proyecto deberá respetar obligatoriamente las siguientes reglas.

Nunca duplicar algoritmos.

Nunca romper la arquitectura.

Nunca escribir código sin respetar shared/.

Nunca modificar la API pública sin justificarlo.

Nunca eliminar compatibilidad.

Nunca generar código resumido.

Nunca utilizar placeholders.

Siempre entregar archivos completos.

Siempre justificar decisiones arquitectónicas.

Cuando exista una duda entre una solución rápida y una solución escalable, elegir la solución escalable.

---

# 21. Visión del Proyecto

El objetivo final es desarrollar una plataforma científica comparable conceptualmente a una versión educativa y modular de MATLAB o Wolfram, enfocada en estudiantes y profesionales de ingeniería.

El proyecto deberá poder crecer durante muchos años incorporando nuevas disciplinas sin requerir cambios estructurales significativos.