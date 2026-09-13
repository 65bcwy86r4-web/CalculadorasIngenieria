# CODING_STANDARDS.md

Versión: 1.0

Estado: Obligatorio

---

# 1. Lenguaje

- HTML5
- CSS3
- JavaScript (ES2023+)
- ES Modules
- Sin dependencias externas salvo aprobación.

---

# 2. Nomenclatura

## Variables

camelCase

```js
engineSpeed
matrixSize
airDensity
```

## Funciones

camelCase

```js
calculateDeterminant()
linearInterpolation()
convertPressure()
```

## Clases

PascalCase

```js
Matrix
DimensionError
IsaAtmosphere
```

## Constantes

UPPER_SNAKE_CASE

```js
PI
STANDARD_GRAVITY
ISA_T0
```

## Archivos

kebab-case

```text
linear-interpolation.js
matrix-utils.js
isa-atmosphere.js
```

---

# 3. Imports

Orden obligatorio:

1. Librerías externas (si existen)
2. shared/
3. Módulo actual
4. Recursos locales

Separar cada grupo con una línea en blanco.

---

# 4. Exportaciones

Preferir named exports.

```js
export function determinant() {}
```

Evitar default exports salvo justificación.

---

# 5. Variables

Usar:

- const por defecto.
- let únicamente cuando exista reasignación.
- Nunca var.

---

# 6. Funciones

- Una única responsabilidad.
- Máximo recomendado: 50 líneas.
- Máximo 4 niveles de anidamiento.
- Máximo 5 parámetros.
- Si supera esos límites, refactorizar.

---

# 7. Comentarios

Obligatorio JSDoc en toda función pública.

```js
/**
 * Calcula el determinante de una matriz.
 *
 * @param {number[][]} matrix
 * @returns {number}
 * @throws {DimensionError}
 */
```

Los comentarios deben explicar **por qué**, no **qué**.

---

# 8. Manejo de errores

Nunca:

```js
throw "Error";
```

Siempre:

```js
throw new DimensionError(...)
```

---

# 9. Validaciones

Toda entrada externa debe validarse.

Nunca asumir datos válidos.

---

# 10. Precisión numérica

Nunca comparar flotantes con `==` o `===`.

Utilizar tolerancias.

---

# 11. API

Los módulos solo pueden importar desde:

```text
shared/math/index.js
```

Está prohibido importar archivos internos del motor.

---

# 12. Duplicación

No duplicar código.

Si un algoritmo puede reutilizarse, debe moverse a `shared/`.

---

# 13. Complejidad

Priorizar:

- legibilidad;
- mantenibilidad;
- claridad.

Optimizar únicamente cuando exista una necesidad real.

---

# 14. Estructura de archivos

Orden recomendado:

1. Imports
2. Constantes
3. Tipos/Clases
4. Funciones privadas
5. Funciones públicas
6. Exports

---

# 15. Testing

Todo algoritmo nuevo debe incluir:

- caso normal;
- casos límite;
- manejo de errores;
- valores conocidos.

---

# 16. Commits

Convención:

```text
feat:
fix:
refactor:
docs:
test:
style:
perf:
build:
chore:
```

Ejemplos:

```text
feat(algebra): agregar descomposición LU

fix(interpolation): corregir división por cero

docs(api): actualizar documentación
```

---

# 17. Pull Requests

Una PR solo podrá aceptarse si:

- compila;
- pasa todos los tests;
- no rompe la API pública;
- respeta ENGINEERING_GUIDE.md;
- respeta AI_RULES.md;
- no introduce código duplicado.

---

# 18. Calidad mínima

Todo código debe ser:

- modular;
- reutilizable;
- documentado;
- testeable;
- mantenible;
- consistente.

La calidad tiene prioridad sobre la velocidad de desarrollo.

---

# 19. Regla de Boy Scout

Toda modificación debe dejar el código en un estado igual o mejor que antes de comenzar.

Si durante una tarea se detecta código claramente mejorable, podrá refactorizarse siempre que:
- no rompa compatibilidad;
- no cambie el comportamiento esperado;
- quede documentado en el commit correspondiente.