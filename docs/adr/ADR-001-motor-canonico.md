# ADR-001 — Motor canónico y port de capacidades

- **Fecha:** 2026-09-12
- **Estado:** Aceptado
- **Decide:** responsable del proyecto

---

## 1. Contexto

El proyecto tenía **tres implementaciones del mismo álgebra lineal** en disco:

| Ubicación original | Estilo | Situación |
|---|---|---|
| `CalculadoraAlgebra/js/` | Namespace global, scripts clásicos | Lo único que corría realmente |
| `CalculadoraAlgebra/shared/math/` | ES Modules, estilo funcional sobre arrays planos, `export default`, **sin `index.js`** | Huérfana: ningún archivo la importaba |
| `CalculadorasIngenieria-v2-motor-hardening/shared/math/` | ES Modules, `class Matrix`, named exports, `index.js`, JSDoc con `@example`, documentación completa | La más avanzada, pero sin consumidores |

Las dos copias de `shared/math/` **no son versiones sucesivas de lo mismo**:
son APIs incompatibles. La v1 opera sobre arreglos planos
(`createMatrix`, `addMatrices`, `transpose`); la v2 sobre una clase
(`new Matrix(datos).add(otra)`). Migrar de una a otra es reescribir, no copiar.

Mantener ambas garantizaba, a corto plazo, que alguien corrigiera un bug en la
copia equivocada.

---

## 2. Alternativas consideradas

**A. Adoptar la v1.** Más completa en autovalores y más rica en funciones de
resolución. Pero: sin punto de entrada único (viola `AI_RULES.md` §6), con
`export default` (contra `CODING_STANDARDS.md` §4), sin documentación, y con
familias de validación en estilo `validateX` en vez de la familia dual
`isX`/`assertX`. Habría que rehacerle el trabajo de endurecimiento completo.

**B. Adoptar la v2.** Cumple los documentos rectores tal como están escritos:
`index.js` como superficie pública explícita, named exports, JSDoc con
`@example` en todo, cuatro documentos de arquitectura, familia dual de
validación, excepciones con `code` estable. Costo: pierde capacidades reales de
la v1 (§4).

**C. Adoptar la v2 y portar lo perdido.** El costo de B más un trabajo acotado
y enumerable de port.

---

## 3. Decisión

**Se adopta la opción C.**

El motor canónico es `shared/math/` proveniente de la v2, sin modificaciones.
Las capacidades identificadas como pérdida real se portan al estilo del motor
canónico (clase `Matrix`, named exports, JSDoc, excepciones propias, pruebas)
según la checklist de §5.

El motor v1 se conserva en `legacy/motor-v1/` **exclusivamente como fuente de
consulta para ese port**. No se importa desde ningún archivo del proyecto y se
elimina al completarse la checklist.

---

## 4. Análisis de diferencias

Se compararon los símbolos exportados archivo por archivo entre ambas copias.
La mayoría de las diferencias son renombres a mejor, no pérdidas:

| v1 | v2 | Veredicto |
|---|---|---|
| `createMatrix`, `addMatrices`, `transpose`, `trace`, `minor`, `isSymmetric`, `frobeniusNorm`… | métodos de `class Matrix` (+ `infinityNorm`, `power`, `isDiagonal`, `isUpperTriangular`, `isIdentity`, `equals`) | v2 es superior |
| `validateX` (familia única) | `isX` / `assertX` (familia dual) | v2 es superior |
| `determinantByGaussianElimination` | `determinantByGauss` | renombre |
| `piecewiseLinearInterpolate` | `piecewiseLinear` | renombre |
| `trapezoidalRule`, `simpsonRule` | `trapezoidal`, `simpson` | renombre |
| `isNearlyZero`, `cleanNumber`, `scientificNotation` | `isApproximatelyZero`, `clean`, `toScientific` | renombre |
| `distanceUnits`, `pressureUnits`… | `units/index.js` con `convert` y `categoryOf` | v2 es superior |
| `createLinearUnitConverter` | `createUnitConverter` (maneja además conversiones afines como temperatura) | v2 es superior |
| `addVectors`, `dotProduct`, `crossProduct` | `vectors.add`, `vectors.dot`, `vectors.cross` (+ `fromPolar`, `toPolar`, `projection`, `angleBetween`) | v2 es superior |
| `addTensors`, `scaleTensor`, `tensorTrace` | vía `Matrix` (+ `principalValues`, `vonMisesStress`, `doubleContraction`) | v2 es superior |

---

## 5. Checklist de port — pérdidas reales

Pendiente de ejecución en el **Paso 2**, por el Chat 2, con pruebas en la misma
entrega. Prerrequisito: la suite de pruebas del Paso 1.

### Prioridad alta

- [ ] **`jacobiEigenDecomposition`** (`legacy/motor-v1/algebra/eigen.js`).
      Método de Jacobi para matrices simétricas. Notablemente más estable que
      el QR iterativo, y las matrices simétricas son precisamente el caso de
      `physics/tensors.js` (tensiones principales, Von Mises) y del futuro
      análisis estructural de la Versión 6.

- [ ] **`eigenvalues2x2`** — solución analítica exacta del caso 2×2, con
      detección de autovalores complejos conjugados. El QR iterativo no los
      resuelve y hoy el motor no los detecta: los devuelve mal en silencio.

- [ ] **`solveQRLeastSquares`** — resolución por mínimos cuadrados de sistemas
      sobredeterminados. Capacidad genuina y ausente por completo en el motor
      canónico; es la base de todo ajuste de curvas y regresión, que las
      Versiones 4, 5 y 6 van a necesitar.

- [ ] **Spline reutilizable.** El motor canónico expone `cubicSplineInterpolate(xs, ys, x)`,
      que arma y resuelve el sistema tridiagonal **en cada evaluación**.
      Graficar una spline con 500 puntos resolvería 500 sistemas lineales. La
      v1 tenía `createNaturalCubicSpline(points)` devolviendo un objeto con
      `coefficients`, `evaluate(x)` y `derivative(x)`. Hay que agregar esa
      forma, conservando `cubicSplineInterpolate` como atajo por compatibilidad.
      Bloqueante para la Versión 4 (gráficos).

### Prioridad media

- [ ] **`solveLU(L, U, P, b)`** y **`determinantFromLU`** — aprovechar una
      descomposición ya calculada. Hoy `luDecomposition` descompone pero no hay
      forma de usar el resultado para resolver, lo que obliga a recalcular por
      Gauss.

- [ ] **`solveCholesky(L, b)`** — mismo caso para Cholesky.

- [ ] **`numericalDerivative(f, x, h)`** como función pública. Hoy la derivada
      numérica está embebida dentro de `newtonRaphson`, y la constante
      `DEFAULT_DERIVATIVE_STEP` queda exportada sin una función pública que la
      use. Deuda D4 del HANDOFF.

- [ ] **`lagrangePolynomial` / `lagrangeCoefficients`** — obtener los
      coeficientes del polinomio interpolante, no solo evaluarlo en un punto.
      Necesario para mostrar el polinomio al usuario y para graficarlo sin
      recalcular.

### Prioridad baja

- [ ] **`formatVector`** — el motor tiene `formatMatrix` pero no su equivalente
      para vectores.
- [ ] **`roundMatrix`** — `roundTo` existe solo para escalares.
- [ ] **`outerProduct`** de tensores — no es expresable con los métodos
      actuales de `Matrix`.
- [ ] **`inverseByAdjugate`** — la inversa por adjunta como camino didáctico
      explícito, distinto de Gauss-Jordan. Componible a partir de `adjugate` y
      `determinantByCofactors`, pero vale exponerla para mostrar el
      procedimiento.

### Descartado deliberadamente

- `createMatrix`, `addMatrices`, `zeros`, `identity`, `fromArray`,
  `cloneMatrix`, `multiplyMatrixVector` y compañía: reemplazados por `Matrix`.
- `validateX`: reemplazados por la familia dual `isX` / `assertX`.
- `gaussSolve`, `gaussJordanSolve`, `createAugmentedMatrix`: cubiertos por
  `solveSystem`, `rowEchelon` y `reducedRowEchelon`.
- `PI`, `E`: `Math.PI` y `Math.E` alcanzan. `EPSILON` está cubierta por
  `DEFAULT_TOLERANCE`.

---

## 6. Consecuencias

**A favor**

- Una sola implementación de cada algoritmo, que es el principio fundacional
  del proyecto (`ENGINEERING_GUIDE.md` §3, DRY).
- El motor canónico ya cumple los documentos rectores; no hay que rehacer el
  endurecimiento.
- Las pérdidas quedan enumeradas y con fecha, no descubiertas por sorpresa
  dentro de seis meses.

**En contra**

- Hasta que se cierre el Paso 2, el motor es funcionalmente **menos capaz** que
  la v1 en autovalores, mínimos cuadrados y splines evaluadas muchas veces.
- `legacy/motor-v1/` es duplicación temporal en el repositorio. Se acepta a
  cambio de no perder el código fuente del port, y se elimina al completar §5.

**Impacto futuro**

- Toda calculadora nueva importa exclusivamente desde `shared/math/index.js`.
- Si durante la Versión 3 aparece la necesidad de una función que no está, el
  camino es un pedido al motor (`CHAT_ROLES.md` §5), nunca implementarla en la
  interfaz.
