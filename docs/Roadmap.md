# Roadmap.md — Planificación técnica de CalculadorasIngenieria

## Dónde estamos parados

Aunque este documento nace pidiendo planificar "a partir de la Versión
3", vale dejar registrado qué se considera ya completado, para que los
números de versión tengan sentido en el tiempo:

- **Versión 1 — Calculadora de Álgebra Lineal (standalone).** Aplicación
  de una sola página, JavaScript vainilla, con sus propios algoritmos
  embebidos (no compartidos). Sirvió como prueba de concepto de qué
  operaciones hacían falta y cómo mostrarlas paso a paso.
- **Versión 2 — Motor matemático compartido (`shared/math/`).** Extracción
  y generalización de esos algoritmos (y muchos nuevos: interpolación,
  métodos numéricos, física, unidades) a una biblioteca pura,
  desacoplada de cualquier interfaz, con punto único de entrada
  (`shared/math/index.js`), API pública explícita, y documentación
  (`docs/Architecture.md`, `API.md`, `Algorithms.md`, este Roadmap).

Toda calculadora a partir de acá — empezando por reescribir la propia
calculadora de álgebra de la Versión 1 para que consuma el motor en vez
de reimplementarlo — es, en ese sentido, "Versión 3 en adelante".

## Principio rector de todo el roadmap

**Cada versión nueva de la plataforma agrega calculadoras (interfaz);
no necesariamente agrega algoritmos (motor).** Antes de escribir la
interfaz de una calculadora nueva, la primera pregunta siempre es: ¿el
motor ya tiene lo que hace falta? Si la respuesta es no, ESO es un
ítem de motor (una extensión de `shared/math/`, con su propio ciclo de
diseño/documentación/pruebas como el de este mismo proyecto), separado
del ítem de interfaz que lo va a consumir. Mezclar ambas cosas en una
sola tarea es exactamente el patrón que este proyecto evitó desde el
principio.

---

## Versión 3 — Interfaz profesional

**Objetivo:** dar a la plataforma una cara real: dashboard, navegación
entre calculadoras, historial de cálculos, favoritos. Es la versión
donde el motor construido hasta acá empieza a usarse de verdad desde
una interfaz, en vez de solo desde pruebas en Node.

**Alcance previsto:**
- Dashboard / landing con las calculadoras disponibles agrupadas por
  disciplina (Álgebra, Matemática, ... — ver estructura de carpetas
  sugerida más abajo).
- Sistema de navegación entre calculadoras (routing simple, sin
  frameworks, coherente con "JavaScript Vainilla" como restricción de
  todo el proyecto).
- Historial de cálculos persistente (candidato natural: `localStorage`,
  ya usado en la Versión 1 para el mismo fin).
- Favoritos / accesos rápidos a operaciones usadas frecuentemente.
- Primera calculadora real construida sobre el motor: reemplazar la
  Versión 1 (álgebra standalone) por una que importe exclusivamente
  desde `shared/math/index.js`.

**El motor ya provee, sin cambios:** todo `algebra/`, la validación de
entradas (`assertSquareMatrix`, etc.) para dar mensajes de error
amigables en formularios, y `formatMatrix`/`formatNumber` para mostrar
resultados. Los objetos `{ value, steps }` que devuelven casi todos los
algoritmos de `algebra/` están pensados exactamente para alimentar un
panel de "procedimiento paso a paso" como el de la Versión 1, sin
tener que recalcular nada del lado de la interfaz.

**Qué NO requiere tocar el motor:** nada de esta versión debería
necesitar una función nueva en `shared/math/`. Si durante la
implementación aparece la necesidad de una, es señal de que algo quedó
mal cubierto en la Versión 2 y merece revisarse ahí, no parchearse
desde la interfaz.

---

## Versión 4 — Gráficos, vectores, planos, funciones

**Objetivo:** incorporar representación visual: graficar funciones
(2D), visualizar vectores y operaciones vectoriales, y trabajar con
planos y geometría analítica.

**Alcance previsto:**
- Graficador de funciones (canvas / SVG, sin librerías externas).
- Visualización de vectores 2D/3D (suma gráfica, producto vectorial,
  ángulos) sobre `physics/vectors.js`.
- Geometría analítica: rectas y planos, distancia punto-plano,
  intersecciones — candidato a un nuevo módulo de motor (`geometry/` o
  extensión de `physics/`), **a diseñar cuando llegue esta versión**, no
  antes.

**El motor ya provee:** `physics/vectors.js` completo (incluye
`fromPolar`/`toPolar`, pensado justamente para graficar vectores por
magnitud y ángulo). `formatter/` para los ejes y etiquetas numéricas.

**Qué probablemente falte en el motor:** operaciones de geometría
analítica pura (ecuación de una recta/plano a partir de puntos,
intersecciones, distancias) no tienen todavía un módulo propio. Se
evaluará en su momento si viven en un `physics/geometry.js` nuevo o en
un módulo `algebra/` de nivel superior — decisión de arquitectura para
cuando se llegue a esta versión, siguiendo el mismo proceso de diseño
documentado en `Architecture.md`.

---

## Versión 5 — ISA, atmósfera estándar, métodos numéricos, motores, electrónica, ECU

Esta es la versión donde más calculadoras de dominio específico entran
en juego, y donde más se nota el valor de tener un motor compartido:
varias de ellas no necesitan ni un algoritmo nuevo.

**Tabla ISA / atmósfera estándar.** El motor ya tiene, a propósito,
todo lo necesario: `STANDARD_PRESSURE`, `STANDARD_TEMPERATURE`,
`ISA_LAPSE_RATE`, `GAS_CONSTANT_AIR`, `STANDARD_GRAVITY` en
`utils/constants.js`; `piecewiseLinear` y `cubicSplineInterpolate` para
interpolar tablas por altitud (recordando la restricción explícita de
la Versión 2: **la calculadora ISA debe usar exclusivamente estas
funciones de interpolación**, ninguna propia); `convertDistance`,
`convertPressure`, `convertTemperature`, `convertSpeed` para trabajar
con pies, nudos, °C, hPa, etc. Es, en gran medida, una calculadora de
Versión 5 que **no debería requerir tocar el motor en absoluto**.

**Métodos numéricos (como calculadora en sí misma).** `numerical/`
completo ya está listo: Newton-Raphson, bisección, secante, trapecio,
Simpson. Esta calculadora es, en esencia, una interfaz directa sobre lo
que ya existe.

**Motores (de combustión) y ECU.** Ciclos termodinámicos (Otto, Diesel),
relación de compresión, rendimiento volumétrico, mapas de inyección:
en su mayoría, matemática de fórmulas cerradas (no requieren
necesariamente algoritmos iterativos) más conversión de unidades
(`convertPressure`, `convertTemperature`, `convertEnergy` ya cubren
buena parte). Es esperable que necesiten algunas fórmulas específicas
del dominio que no son responsabilidad de `shared/math/` (que es
matemática pura, no conocimiento de motores) sino de la propia
calculadora, apoyada en el motor para lo genérico (interpolar curvas de
un mapa de inyección con `piecewiseLinear`, por ejemplo).

**Electrónica.** El análisis de circuitos por nodos o mallas (leyes de
Kirchhoff) es, matemáticamente, resolver un sistema lineal —
`solveSystem` aplica directamente, sin cambios. **Limitación a tener en
cuenta desde ya:** circuitos de corriente alterna (fasores, impedancias
complejas) requieren aritmética compleja, y ni `Matrix` ni
`eigenvaluesQR` la soportan hoy (asumen entradas reales en todo el
motor). Si esta calculadora necesita AC, es una extensión real de
motor —no un ajuste menor— a diseñar explícitamente cuando se llegue a
esta versión, probablemente como una capa paralela a `algebra/` para
aritmética compleja, no como un parche dentro de los archivos actuales.

---

## Versión 6 — Simulaciones, herramientas aeroespaciales, estructuras, análisis

**Objetivo:** las calculadoras más exigentes en cuanto a acoplar varios
módulos del motor a la vez.

**Estructuras y análisis (estático).** `physics/tensors.js` fue
diseñado pensando exactamente en esto: `principalValues`,
`principalDirections` y `vonMisesStress` ya calculan tensiones
principales y el criterio de Von Mises reutilizando `algebra/eigen.js`
sin ningún algoritmo propio. Un análisis por elementos finitos
simplificado necesitaría, además, ensamblar y resolver sistemas
grandes dispersos (*sparse*) — con matrices densas como las de este
motor, viable para modelos chicos/educativos, no para mallas grandes;
otra decisión de arquitectura a tomar explícitamente si se llega a ese
nivel de ambición.

**Aerodinámica y propulsión aeroespacial.** Combinación de `units/`
(velocidad, presión, temperatura — números de Mach, presión dinámica),
`interpolation/` (curvas de coeficientes aerodinámicos tabuladas), y
`numerical/` (por ejemplo, hallar el ángulo de ataque para una
sustentación objetivo, con `bisection` o `newtonRaphson` sobre una
curva de sustentación). Mayormente cobertura ya existente del motor.

**Simulaciones.** Cualquier simulación temporal (por ejemplo, la
trayectoria de un proyectil, o la respuesta dinámica de un sistema
masa-resorte) va a necesitar integración de ecuaciones diferenciales
ordinarias (Euler, Runge-Kutta) — **no implementadas todavía**. Es la
extensión de motor más previsible de esta versión: un módulo nuevo,
posiblemente `numerical/ode.js`, siguiendo exactamente el mismo patrón
que `newton.js`/`bisection.js` (validación, excepciones propias,
historial de pasos, JSDoc completo).

---

## Más allá de la Versión 6

Este roadmap está pensado para orientar los próximos años, no para
agotar el proyecto en la Versión 6. Cuando se llegue ahí, es esperable
que existan ya suficientes calculadoras reales como para que aparezcan
patrones de uso que hoy no se pueden anticipar (por ejemplo, necesidad
de aritmética compleja para electrónica de AC, o de solvers dispersos
para estructuras a mayor escala — ambos ya señalados arriba). El
proceso para incorporarlos es siempre el mismo, y es el que sostuvo
todo este documento: identificar si es motor o interfaz, diseñar el
motor primero (con su propia documentación y pruebas) y recién después
construir la calculadora que lo consume — nunca al revés.

## Checklist de arquitectura para cada nueva versión

Antes de dar por cerrada una versión, vale repasar:

- [ ] ¿Toda calculadora nueva importa únicamente desde
      `shared/math/index.js`?
- [ ] ¿Algún algoritmo nuevo quedó implementado dentro de una
      calculadora en vez de en `shared/math/`?
- [ ] ¿`shared/math/index.js` quedó actualizado con todo lo nuevo que
      deba ser público?
- [ ] ¿`docs/API.md` y `docs/Algorithms.md` se actualizaron junto con
      el motor, no después?
- [ ] ¿Se agregaron pruebas para cualquier algoritmo nuevo, con el
      mismo rigor que las de la Versión 2 (casos de éxito, casos de
      error, verificación cruzada entre métodos cuando hay más de uno)?
