# API.md — Referencia de la API pública

Todo lo documentado acá se importa desde un único lugar:

```js
import { /* nombres que necesites */ } from "../../shared/math/index.js";
```

Convenciones de esta referencia:
- **Retorna** describe la forma exacta del valor de retorno (muchas
  funciones devuelven un objeto con varios campos, no solo un número,
  para poder mostrar el procedimiento paso a paso).
- **Excepciones** lista las subclases de `MathError` que la función
  puede lanzar y su `code` (ver `Architecture.md` sección 7 y
  `Algorithms.md` para más contexto). Toda excepción no listada
  explícitamente que provenga de una validación de entrada es
  `MathError` con algún código de `NOT_*` (`NOT_FINITE`, `NOT_INTEGER`,
  etc.), documentado en la sección de Validación más abajo.
- Los parámetros marcados `[opcional]` tienen valor por defecto, indicado
  entre paréntesis.

---

## El contrato de `steps`

Muchas funciones devuelven, además del resultado, el **procedimiento paso a paso** pensado para que una calculadora lo muestre. La forma está congelada por [ADR-007](adr/ADR-007-contrato-de-steps.md) y vale para todo `shared/math/`, no solo para el álgebra.

**Regla general.** Toda función alcanzada por el contrato devuelve un **objeto plano** con una clave `steps`, que es **siempre un arreglo** — vacío si esa función todavía no registra pasos, nunca `undefined`. Ninguna devuelve un número pelado, un arreglo pelado ni una `Matrix` como retorno completo.

**Forma del paso:**

```js
{
  type: string,           // obligatorio, del vocabulario cerrado de abajo
  text: string,           // obligatorio, en español, listo para mostrar
  snapshot?: number[][],  // opcional: estado después del paso
  detail?: object         // opcional: datos estructurados para resaltar
}
```

> **La regla que gobierna todo lo demás:** la interfaz tiene que poder renderizar cualquier procedimiento usando **solo `type` y `text`**. `snapshot` y `detail` son mejoras progresivas, nunca requisitos. Un renderizador que necesite `snapshot` para no romperse está mal escrito.

`snapshot` es un arreglo bidimensional de números comunes, no una `Matrix`. Es **la matriz que ese paso vuelve comprensible**: el estado resultante donde hay uno —en Gauss, Gauss-Jordan y LU, la matriz después de la operación; en las factorizaciones, el factor que se está construyendo— y **la submatriz sobre la que el paso opera donde no lo hay**, como el menor en la expansión de Laplace y en la matriz de cofactores. `detail` no tiene forma fija y ninguna calculadora debe depender de él.

**Vocabulario cerrado de `type`.** Un `type` fuera de esta lista es un error de contrato; ampliarla es una decisión de arquitectura, no de una función.

| Procedimiento | | Cierre | |
|---|---|---|---|
| `info` | nota que no modifica nada | `final` | resultado final |
| `swap` | intercambio de dos filas | | |
| `scale` | fila por un escalar | | |
| `elim` | combinación lineal de filas | | |
| `expand` | expansión por cofactores | | |
| `compute` | cálculo de un elemento o columna | | |
| `normalize` | normalización de un vector | | |
| `rotate` | rotación de Jacobi | | |
| `iterate` | una iteración de un método iterativo | | |

Son **diez**. `unique`, `infinite` e `incompatible` **no son tipos de paso**: son los valores del discriminante que devuelve `solveSystem`, que desde la enmienda de ADR-007 §3.3 se llama `classification` precisamente para que no se confundan con `step.type`.

**Estado actual.** Con procedimiento escrito: `rowEchelon`, `reducedRowEchelon`, `rank`, `solveSystem`, `determinantByGauss`, `determinantByCofactors`, `inverse`, `cofactorMatrix`, `adjugate`, `conditionNumber` y `luDecomposition`.

Todavía con `steps: []`, a la espera del Paso 2c-2 parte B: `qrDecomposition`, `choleskyDecomposition`, `eigenvalues`, `eigenvaluesQR`, `jacobiEigenDecomposition`, `eigenvalues2x2`, `eigenvectors` y `diagonalize`. Un `steps: []` se renderiza como "esta operación todavía no muestra el desarrollo", que es honesto y no obliga a esperar.

**Herencia de pasos.** Algunas funciones encadenan el procedimiento de lo que calculan internamente: `adjugate` el de la matriz de cofactores (o el de la inversa, si usó `det(A)·A⁻¹`), `conditionNumber` el de la inversión, `eigenvalues` el del método que despachó y `diagonalize` el de autovalores y autovectores. Mostrar el procedimiento que efectivamente corrió es lo correcto, pero **heredar no alcanza si el resultado no explica la operación que se pidió**: cada una agrega sus propios pasos de cierre. Es la regla que dejó la enmienda del 18/09 a ADR-007 §4.

**Un solo paso `final`, y es el último.** Cuando una función encadena los pasos de una auxiliar, el `final` heredado se degrada a `info`: deja de ser la conclusión en cuanto hay una posterior. Así una interfaz puede destacar el cierre sin ambigüedad. `tests/math/steps-contract.test.js` lo verifica en todas las funciones del contrato.

**Cota de legibilidad.** `cofactorMatrix` emite un paso por cofactor, o sea n². Arriba de 6×6 omite el desarrollo y deja un `info` explicándolo: para una 15×15 —tamaño que el selector de la calculadora permite— serían 225 pasos con menores de 196 celdas, que no es un procedimiento sino un volcado. El resultado numérico no cambia.

`tests/math/steps-contract.test.js` verifica todo esto de forma genérica, así que el contrato falla solo cuando alguien se desvía.

---

## Álgebra (`algebra/`)

### `class Matrix`

Estructura de datos central de todo el motor. Se construye siempre a
partir de un arreglo 2D rectangular de números finitos.

```js
new Matrix([[1, 2], [3, 4]]);
```

**Constructor:** `new Matrix(data: number[][])`
**Excepciones:** `DimensionError` si `data` no es rectangular o contiene valores no finitos.

**Constructores estáticos:**

| Método | Retorna | Ejemplo |
|---|---|---|
| `Matrix.fromArray(data)` | `Matrix` | `Matrix.fromArray([[1,0],[0,1]])` |
| `Matrix.identity(n)` | `Matrix` identidad n×n | `Matrix.identity(3)` |
| `Matrix.zeros(rows, cols=rows)` | `Matrix` de ceros | `Matrix.zeros(2,3)` |
| `Matrix.diagonal(values)` | `Matrix` diagonal con `values` | `Matrix.diagonal([1,2,3])` |

**Métodos de instancia — utilidades:**

| Método | Retorna | Descripción |
|---|---|---|
| `.clone()` | `Matrix` | Copia independiente |
| `.isSquare()` | `boolean` | `rows === cols` |
| `.get(i, j)` | `number` | Elemento en fila i, columna j (0-indexado) |
| `.set(i, j, value)` | `void` | Modifica el elemento in-place |
| `.toArray()` | `number[][]` | Copia del contenido como arreglo plano |
| `.equals(other, tolerance=1e-10)` | `boolean` | Igualdad dimensional y numérica dentro de tolerancia |
| `.minor(i, j)` | `Matrix` | Submatriz sin la fila i ni la columna j. **Excepciones:** `DimensionError` si no es cuadrada |

**Métodos de instancia — aritmética:**

| Método | Retorna | Excepciones |
|---|---|---|
| `.add(other)` | `Matrix` | `DimensionError` si las dimensiones no coinciden |
| `.subtract(other)` | `Matrix` | `DimensionError` si las dimensiones no coinciden |
| `.scalarMultiply(k)` | `Matrix` | `MathError` (`NOT_FINITE`) si k no es finito |
| `.multiply(other)` | `Matrix` | `DimensionError` si `this.cols !== other.rows` |
| `.transpose()` | `Matrix` | — |
| `.power(n)` | `Matrix` | `DimensionError` si no es cuadrada; `MathError` si n no es entero ≥ 0 |
| `.trace()` | `number` | `DimensionError` si no es cuadrada |

**Métodos de instancia — propiedades estructurales** (todos aceptan
`tolerance = 1e-10` opcional y devuelven `false` si la matriz no es
cuadrada, en vez de lanzar):

| Método | Verifica |
|---|---|
| `.isSymmetric(tolerance)` | A = Aᵀ |
| `.isDiagonal(tolerance)` | Todo elemento fuera de la diagonal es ≈ 0 |
| `.isUpperTriangular(tolerance)` | Todo elemento bajo la diagonal es ≈ 0 |
| `.isLowerTriangular(tolerance)` | Todo elemento sobre la diagonal es ≈ 0 |
| `.isIdentity(tolerance)` | Diagonal, con 1s en la diagonal |

**Métodos de instancia — normas:**

| Método | Retorna |
|---|---|
| `.frobeniusNorm()` | `number` — √(Σ aᵢⱼ²) |
| `.infinityNorm()` | `number` — máxima suma absoluta de fila |

---

### `rowEchelon(matrix, tolerance = 1e-10)`
Lleva `matrix` a forma escalonada por filas con pivoteo parcial.
**Retorna:** `{ result: Matrix, steps: Array<{type, text, snapshot?}>, swapCount: number, pivots: Array<{row, col, value}> }`
**Ejemplo:** `rowEchelon(new Matrix([[2,1],[4,3]]))`

### `reducedRowEchelon(matrix, tolerance = 1e-10)`
Forma escalonada reducida (Gauss-Jordan): además de triangular, normaliza pivotes a 1 y limpia por encima de cada uno.
**Retorna:** igual forma que `rowEchelon`.
**Ejemplo:** `reducedRowEchelon(new Matrix([[2,4],[1,1]]))`

### `rank(matrix, tolerance = 1e-10)`
**Retorna:** `{ rank: number, echelon: Matrix, steps: Array }`
**Ejemplo:** `rank(new Matrix([[1,2],[2,4]])).rank // 1`

### `solveSystem(A, b, tolerance = 1e-10)`
Resuelve `Ax = b` mediante Gauss-Jordan. **No lanza** cuando el sistema
no tiene solución única (ver `Algorithms.md`): eso es un resultado
matemático válido, no un error de uso.
**Parámetros:** `A: Matrix`, `b: number[]` (largo = `A.rows`)
**Retorna (discriminado por `classification`):**
- `{ classification: 'unique', solution: number[], steps, rref, rankA, rankAug }`
- `{ classification: 'infinite', message, steps, rref, rankA, rankAug }`
- `{ classification: 'incompatible', message, steps, rankA, rankAug }`

> El discriminante se llama `classification` y no `type` desde la enmienda de ADR-007 §3.3: tener `result.type` y `step.type` con el mismo nombre y vocabularios distintos, en dos objetos que una interfaz recorre en la misma función de renderizado, era una confusión servida. **Los valores no cambiaron.**

El procedimiento cierra con un paso `final` que enuncia la clasificación y los rangos que la justifican — Rouché-Frobenius escrito en el desarrollo, no solo en el objeto de retorno.

**Excepciones:** `DimensionError` si `b.length !== A.rows`.
**Ejemplo:** `solveSystem(new Matrix([[2,1],[1,3]]), [8, 13])`

### `determinantByGauss(matrix, tolerance = 1e-10)`
Determinante vía triangulación de Gauss — O(n³), método recomendado para cualquier tamaño.
**Retorna:** `{ value: number, steps: Array, swapCount: number }`
**Excepciones:** `DimensionError` si no es cuadrada.
**Ejemplo:** `determinantByGauss(new Matrix([[2,1],[1,3]])).value // 5`

### `determinantByCofactors(matrix)`
Expansión de Laplace — O(n!), solo con fines teóricos/didácticos.
**Retorna:** `{ value: number, steps: Array }`
`steps` muestra **solo el primer nivel** de la expansión: un paso `expand` por término de la primera fila, con su menor como `snapshot`. La función es recursiva y un trazado completo tendría `O(n!)` pasos.
**Excepciones:** `DimensionError` si no es cuadrada; `MathError` (`TOO_LARGE_FOR_COFACTORS`) si `n > 7`.
**Ejemplo:** `determinantByCofactors(new Matrix([[1,2],[3,4]])).value // -2`

### `inverse(matrix, tolerance = 1e-10)`
Inversa vía Gauss-Jordan sobre `[A | I]`.
**Retorna:** `{ inverse: Matrix, steps: Array }`
**Excepciones:** `DimensionError` si no es cuadrada; `SingularMatrixError` si no es invertible.
**Ejemplo:** `inverse(new Matrix([[4,7],[2,6]])).inverse`

### `cofactorMatrix(matrix)`
`Cᵢⱼ = (-1)^(i+j) · det(menor_ij)`. Caso base: la matriz de cofactores de una 1×1 es `[[1]]`, cualquiera sea su elemento.
**Retorna:** `{ matrix: Matrix, steps: Array }` — un paso `compute` por cofactor, con su menor como `snapshot`, **hasta 6×6**; arriba de ese tamaño el desarrollo se omite (ver la cota de legibilidad más arriba)
**Excepciones:** `DimensionError` si no es cuadrada.
**Ejemplo:** `cofactorMatrix(new Matrix([[1,2],[3,4]])).matrix.toArray() // [[4,-3],[-2,1]]`
**Ejemplo:** `cofactorMatrix(new Matrix([[7]])).matrix.toArray() // [[1]]`

### `adjugate(matrix)`
Transpuesta de la matriz de cofactores. Para n > 6 usa `det(A)·A⁻¹` internamente por eficiencia (mismo resultado).
**Retorna:** `{ matrix: Matrix, steps: Array }` — los pasos del camino que se usó, más un `final` propio con la transposición o con la identidad `det(A)·A⁻¹`
**Excepciones:** `DimensionError` si no es cuadrada; `SingularMatrixError` si es singular y n > 6.
**Ejemplo:** `adjugate(new Matrix([[1,2],[3,4]])).matrix.toArray() // [[4,-2],[-3,1]]`

### `conditionNumber(matrix)`
κ(A) = ‖A‖_F · ‖A⁻¹‖_F.
**Retorna:** `{ value: number, normA: number, normInverse: number, steps: Array }`
`steps` abre con un `info` que anuncia la inversión, encadena el procedimiento de `inverse` y cierra con `‖A‖_F`, `‖A⁻¹‖_F` y `κ(A)` como su producto.
**Excepciones:** `SingularMatrixError` si la matriz es singular.
**Ejemplo:** `conditionNumber(Matrix.identity(3)).value // 3`

### `luDecomposition(matrix, tolerance = 1e-10)`
`P·A = L·U` con pivoteo parcial.
**Retorna:** `{ L: Matrix, U: Matrix, P: Matrix, steps: Array }` — cada paso lleva `snapshot` con el estado de `U`
**Excepciones:** `DimensionError` si no es cuadrada; `SingularMatrixError` si es singular.
**Ejemplo:** `luDecomposition(new Matrix([[4,3],[6,3]]))`

### `qrDecomposition(matrix)`
`A = Q·R` vía Gram-Schmidt clásico.
**Retorna:** `{ Q: Matrix, R: Matrix, steps: Array }` — `steps` vacío por ahora
**Ejemplo:** `qrDecomposition(new Matrix([[1,1],[0,1],[1,0]]))`

### `choleskyDecomposition(matrix, tolerance = 1e-10)`
`A = L·Lᵀ`, solo para matrices simétricas definidas positivas.
**Retorna:** `{ L: Matrix, Lt: Matrix, steps: Array }` — `steps` vacío por ahora
**Excepciones:** `DimensionError` si no es cuadrada o no simétrica; `MathError` (`NOT_POSITIVE_DEFINITE`) si no es definida positiva.
**Ejemplo:** `choleskyDecomposition(new Matrix([[4,2],[2,3]]))`

### Autovalores: cuál de las cuatro funciones usar

> Cada método vive en su propio archivo desde ADR-007 §3.5 —`algebra/eigen-qr.js`, `algebra/eigen-jacobi.js`, `algebra/eigen-2x2.js`, con `algebra/eigen.js` para el despacho, los autovectores y la diagonalización—. Es organización interna: los nombres públicos y sus firmas no cambiaron, y se siguen importando todos desde `shared/math/index.js`.


El problema admite varios algoritmos y ninguno es el mejor en todos los casos, así que la API expone **una entrada que elige** y **cada método por su nombre** (ADR-005):

| Función | Cuándo |
|---|---|
| **`eigenvalues`** | **Por defecto.** Quiero los autovalores y no me importa con qué método |
| `eigenvaluesQR` | Quiero el algoritmo QR en particular — para mostrarlo corriendo |
| `jacobiEigenDecomposition` | Quiero Jacobi en particular, o necesito los autovectores junto con los autovalores |
| `eigenvalues2x2` | Quiero la forma cerrada en particular, o necesito distinguir el par complejo |

Si estás eligiendo a ciegas, es `eigenvalues`.

### `eigenvalues(matrix, tolerance = 1e-10, iterations = 500)`
**Entrada recomendada.** Autovalores reales de una matriz cuadrada, de mayor a menor. Despacha al método adecuado según el tipo de matriz:

| Caso | Método | `method` |
|---|---|---|
| 1×1 | el único elemento | `'trivial'` |
| simétrica de cualquier orden | rotaciones de Jacobi | `'jacobi'` |
| 2×2 no simétrica | forma cerrada del polinomio característico | `'closed-form-2x2'` |
| general | QR iterativo | `'qr'` |

`method` dice cuál se usó, que es lo que una calculadora necesita para explicar el procedimiento. `hasComplexHint` avisa que el espectro puede tener pares complejos conjugados, que el motor no representa todavía; para una matriz simétrica es siempre `false`, por el teorema espectral. `iterations` solo afecta al camino QR.
**Retorna:** `{ values: number[], method: string, hasComplexHint: boolean, steps: Array }` — `steps` son los del método que se despachó
**Excepciones:** `DimensionError` si no es cuadrada.
**Ejemplo:** `eigenvalues(new Matrix([[2,1],[1,2]])).values // [3, 1]`
**Ejemplo:** `eigenvalues(new Matrix([[0,50],[50,0]])) // { values: [50, -50], method: 'jacobi', hasComplexHint: false }`

### `eigenvaluesQR(matrix, iterations = 500)`
Autovalores por el **algoritmo QR iterativo, siempre y sin despacho**: `Aₖ = QₖRₖ`, `Aₖ₊₁ = RₖQₖ`. Útil para mostrar ese algoritmo en particular, con su iterada y su estado de convergencia.

> **Limitación del método, no defecto de la función.** La iteración sin desplazamiento **no converge** cuando dos autovalores tienen el mismo módulo (`±λ`, o un par complejo conjugado): queda un bloque 2×2 sin reducir, la diagonal no son los autovalores y `hasComplexHint` se pone en `true`. Si lo que querés son los autovalores y no este algoritmo, usá **`eigenvalues`**, que despacha a Jacobi en el caso simétrico. Mejorar este camino con desplazamientos de Wilkinson es la deuda D13.

`matrixT` es la iterada `Aₖ` al terminar. `hasComplexHint` acá significa "la iteración no triangularizó", que puede deberse tanto a autovalores complejos como a autovalores reales de igual módulo.
**Retorna:** `{ values: number[], matrixT: Matrix, hasComplexHint: boolean, steps: Array }` — `steps` vacío por ahora
**Excepciones:** `DimensionError` si no es cuadrada.
**Ejemplo:** `eigenvaluesQR(new Matrix([[2,1],[1,2]])).values // [3, 1]`
**Ejemplo:** `eigenvaluesQR(new Matrix([[0,50],[50,0]])) // { values: [0, 0], hasComplexHint: true } — no convergió; usar eigenvalues`

### `jacobiEigenDecomposition(matrix, tolerance = 1e-10, maxRotations = 1000)`
Autovalores **y** autovectores de una matriz simétrica real por rotaciones de Jacobi. Converge siempre para matrices simétricas, incluso con autovalores repetidos o de igual módulo. Los autovectores salen ortonormales y en el mismo orden que los autovalores.
**Retorna:** `{ values: number[], vectors: number[][], rotations: number, converged: boolean, steps: Array }` — `steps` vacío por ahora
**Excepciones:** `DimensionError` si no es cuadrada; `MathError` (`NOT_SYMMETRIC`) si no es simétrica.
**Ejemplo:** `jacobiEigenDecomposition(new Matrix([[2,1],[1,2]])).values // [3, 1]`

### `eigenvalues2x2(matrix, tolerance = 1e-10)`
Autovalores de una matriz 2×2 por su polinomio característico `λ² − tr(A)·λ + det(A) = 0`. Exacto, no iterativo. Si las raíces son complejas conjugadas, `values` viene vacío y el par se informa por partes en `realPart` e `imaginaryPart` (el motor no representa números complejos todavía).
**Retorna:** `{ values: number[], hasComplexPair: boolean, realPart: number, imaginaryPart: number, steps: Array }` — `steps` vacío por ahora
**Excepciones:** `DimensionError` si no es cuadrada; `MathError` (`NOT_2X2`) si no es de 2×2.
**Ejemplo:** `eigenvalues2x2(new Matrix([[0,1],[1,0]])).values // [1, -1]`
**Ejemplo:** `eigenvalues2x2(new Matrix([[0,-1],[1,0]])).imaginaryPart // 1 (autovalores ±i)`

### `eigenvectorFor(matrix, lambda, tolerance = 1e-10)`
Autovector para un autovalor dado, vía núcleo de `(A - λI)`. Es una pieza de construcción de `eigenvectors`, no una operación que una calculadora ofrezca por separado, así que queda fuera del contrato de `steps` y devuelve el vector pelado.
**Retorna:** `number[] | null`
**Ejemplo:** `eigenvectorFor(new Matrix([[2,1],[1,2]]), 3)`

### `eigenvectors(matrix, values)`
Empareja cada autovalor con su autovector.
**Retorna:** `{ vectors: Array<{ lambda: number, vector: number[]|null }>, steps: Array }` — `steps` vacío por ahora
**Ejemplo:** `eigenvectors(new Matrix([[2,1],[1,2]]), [3, 1]).vectors`

### `diagonalize(matrix)`
`A = P·D·P⁻¹`.
**Retorna:** `{ P: Matrix, D: Matrix, Pinv: Matrix, steps: Array }` — `steps` encadena los de autovalores y autovectores
**Excepciones:** `MathError` (`NOT_DIAGONALIZABLE`) si los autovectores son linealmente dependientes.
**Ejemplo:** `diagonalize(new Matrix([[2,1],[1,2]]))`

---

## Interpolación (`interpolation/`)

### `linearInterpolate(x0, y0, x1, y1, x)`
Interpolación lineal de dos puntos.
**Retorna:** `number`
**Excepciones:** `InterpolationError` si `x0 === x1`.
**Ejemplo:** `linearInterpolate(0, 0, 10, 100, 4) // 40`

### `piecewiseLinear(xs, ys, x, options = {})`
Interpolación lineal por tramos sobre una tabla de puntos (no hace falta que `xs` venga ordenado: se ordena internamente).
**Parámetros:** `xs: number[]`, `ys: number[]`, `x: number`, `options.allowExtrapolation: boolean` (`false`)
**Retorna:** `number`
**Excepciones:** `InterpolationError` si `xs`/`ys` no coinciden en largo, hay menos de 2 puntos, hay `x` duplicados, o `x` cae fuera de dominio sin `allowExtrapolation`.
**Ejemplo:** `piecewiseLinear([0, 1000, 2000], [15, 8.5, 2], 500) // 11.75`

### `lagrangeInterpolate(xs, ys, x)`
Polinomio de Lagrange que pasa exactamente por todos los puntos dados.
**Retorna:** `{ value: number, terms: Array<{x, y, weight, contribution}> }` — `terms` sirve para mostrar el peso de cada punto en el resultado.
**Excepciones:** `InterpolationError` si hay menos de 2 puntos, largos distintos, o `x` duplicados.
**Ejemplo:** `lagrangeInterpolate([0, 1, 2], [1, 3, 7], 1.5).value // 4.75`

### `lagrangeBasis(xs, i, x)`
Evalúa el i-ésimo polinomio base `Lᵢ(x)` por separado (usado internamente por `lagrangeInterpolate`, expuesto para mostrar el paso a paso).
**Retorna:** `number`
**Ejemplo:** `lagrangeBasis([0, 1, 2], 1, 1.5)`

### `cubicSplineInterpolate(xs, ys, x, options = {})`
Spline cúbico natural (segunda derivada nula en los extremos).
**Parámetros:** `xs: number[]` (≥ 3, estrictamente creciente), `ys: number[]`, `x: number`, `options.allowExtrapolation: boolean` (`false`)
**Retorna:** `{ value: number, secondDerivatives: number[], segmentIndex: number }`
**Excepciones:** `InterpolationError` si hay menos de 3 puntos, `xs` no es estrictamente creciente, o `x` cae fuera de dominio sin `allowExtrapolation`.
**Ejemplo:** `cubicSplineInterpolate([0, 1, 2, 3], [0, 1, 0, 1], 1.5).value`

---

## Métodos numéricos (`numerical/`)

Los tres métodos de búsqueda de raíces comparten una decisión de diseño:
si no convergen dentro de `maxIterations`, **lanzan** `MathError`
(`CONVERGENCE_FAILURE`) en vez de devolver silenciosamente la última
estimación (ver justificación en `Algorithms.md`). El error siempre
incluye `context.history` con el registro completo de iteraciones.

### `newtonRaphson(f, x0, options = {})`
**Parámetros:** `f: (x:number)=>number`, `x0: number`, `options.fPrime?: (x)=>number` (si se omite, se aproxima por diferencias finitas centradas), `options.tolerance` (`1e-10`), `options.maxIterations` (`100`), `options.derivativeStep` (`1e-6`)
**Retorna:** `{ root: number, iterations: number, history: Array<{iteration, x, fx}> }`
**Excepciones:** `MathError` (`ZERO_DERIVATIVE`, `DIVERGENCE`, `CONVERGENCE_FAILURE`)
**Ejemplo:** `newtonRaphson(x => x*x - 2, 1).root // ≈1.41421356`

### `bisection(f, a, b, options = {})`
**Parámetros:** `f`, `a: number`, `b: number` (con `f(a)` y `f(b)` de signos opuestos), `options.tolerance` (`1e-10`), `options.maxIterations` (`100`)
**Retorna:** `{ root: number, iterations: number, history: Array<{iteration, a, b, mid, fMid}> }`
**Excepciones:** `MathError` (`INVALID_INTERVAL`, `CONVERGENCE_FAILURE`)
**Ejemplo:** `bisection(x => x*x - 2, 0, 2).root`

### `secant(f, x0, x1, options = {})`
**Parámetros:** `f`, `x0: number`, `x1: number`, `options.tolerance` (`1e-10`), `options.maxIterations` (`100`)
**Retorna:** `{ root: number, iterations: number, history: Array<{iteration, x0, x1, fx1}> }`
**Excepciones:** `MathError` (`ZERO_DENOMINATOR`, `DIVERGENCE`, `CONVERGENCE_FAILURE`)
**Ejemplo:** `secant(x => x*x - 2, 1, 2).root`

### `trapezoidal(f, a, b, n = 100)`
Regla del trapecio compuesta. Si `a > b`, integra igual y devuelve el resultado con signo negativo.
**Retorna:** `number`
**Excepciones:** `MathError` si `n` no es entero positivo.
**Ejemplo:** `trapezoidal(x => x*x, 0, 1, 1000) // ≈0.3333`

### `simpson(f, a, b, n = 100)`
Regla de Simpson 1/3 compuesta. Requiere `n` par.
**Retorna:** `number`
**Excepciones:** `MathError` (`INVALID_SUBINTERVALS`) si `n` es impar.
**Ejemplo:** `simpson(x => x*x, 0, 1, 100) // ≈0.3333 (casi exacto)`

---

## Física (`physics/` — reexportado agrupado como `vectors` y `tensors`)

Ver `Architecture.md` sección 6 para la razón por la que estas dos van
agrupadas en vez de aplanadas como el resto del motor.

### `vectors.add(a, b)` → `number[]` — suma componente a componente. `DimensionError` si difieren en longitud.
### `vectors.sum(vectors)` → `number[]` — resultante de una lista de vectores. `DimensionError` si la lista está vacía o hay longitudes distintas.
### `vectors.subtract(a, b)` → `number[]`. `DimensionError` si difieren en longitud.
### `vectors.scale(v, k)` → `number[]` — `v` multiplicado por el escalar `k`.
### `vectors.dot(a, b)` → `number` — producto escalar. `DimensionError` si difieren en longitud.
### `vectors.cross(a, b)` → `number[]` — producto vectorial, **solo 3D**. `DimensionError` si no son de longitud 3.
### `vectors.magnitude(v)` → `number` — norma euclídea.
### `vectors.normalize(v)` → `number[]` — vector unitario. `DimensionError` si `|v| ≈ 0`.
### `vectors.angleBetween(a, b, options = {})` → `number` — ángulo entre vectores; `options.inDegrees` (`false`).
### `vectors.projection(a, b)` → `number[]` — proyección de `a` sobre `b`. `DimensionError` si `b` es el vector nulo.
### `vectors.fromPolar(magnitude, angleRad)` → `[x, y]` — coordenadas polares a cartesianas (2D).
### `vectors.toPolar(v)` → `{ magnitude, angleRad }` — cartesianas a polares. `DimensionError` si `v` no es de longitud 2.

**Ejemplo combinado:**
```js
vectors.add([1, 2], [3, 4]);              // [4, 6]
vectors.magnitude([3, 4]);                // 5
vectors.angleBetween([1,0],[0,1],{inDegrees:true}); // 90
```

### `tensors.symmetricPart(tensor)` → `Matrix` — `(T + Tᵀ)/2`. `DimensionError` si no es cuadrado.
### `tensors.antisymmetricPart(tensor)` → `Matrix` — `(T − Tᵀ)/2`.
### `tensors.doubleContraction(a, b)` → `number` — `Σᵢⱼ Aᵢⱼ·Bᵢⱼ`. `DimensionError` si las dimensiones no coinciden.
### `tensors.meanValue(tensor)` → `number` — `traza(T)/n` (ej: tensión hidrostática).
### `tensors.principalValues(tensor)` → `number[]` — autovalores del tensor (reutiliza `eigenvaluesQR`).
### `tensors.principalDirections(tensor)` → `Array<{value, direction}>` — autovalores y autovectores.
### `tensors.vonMisesStress(stressTensor)` → `number` — tensión equivalente de Von Mises. Acepta tensores de 2×2 (tensión plana, σ₃=0) o 3×3. `DimensionError` si no es 2×2 ni 3×3.
**Ejemplo:** `tensors.vonMisesStress(new Matrix([[100,0],[0,0]])) // 100`

---

## Conversión de unidades (`units/index.js`)

### `convert(value, from, to)`
Determina automáticamente la categoría física de `from` y `to` y delega
en el conversor correspondiente.
**Retorna:** `number`
**Excepciones:** `MathError` (`UNKNOWN_UNIT`) si `from`/`to` no existen en ninguna categoría; `DimensionError` si pertenecen a categorías distintas.
**Ejemplos:**
```js
convert(1000, 'm', 'km');   // 1
convert(32, 'F', 'C');      // 0
convert(1, 'atm', 'Pa');    // 101325
convert(250, 'kt', 'm/s');  // 128.6111...
convert(5, 'kg', 'm');      // lanza DimensionError
```

### `convertDistance(value, from, to)`
Unidades: `m, km, cm, mm, mi, yd, ft, in, nmi`. **Ejemplo:** `convertDistance(1, 'nmi', 'km') // 1.852`

### `convertPressure(value, from, to)`
Unidades: `Pa, hPa, kPa, atm, bar, mbar, mmHg, psi, inHg`. El milímetro de mercurio se define como el torr (`101325/760` Pa) y la pulgada de mercurio se deriva de él (`25.4 mmHg`), de modo que `1 atm = 760 mmHg` y `1 inHg = 25.4 mmHg` son exactos. `hPa` y `mbar` son la misma unidad (100 Pa) y conviven a propósito: la aeronáutica y la meteorología reportan en hectopascales — el QNH de un altímetro viene en hPa — y `mbar` sigue en uso en instrumental más viejo. **Ejemplos:** `convertPressure(1, 'atm', 'Pa') // 101325`, `convertPressure(1, 'atm', 'hPa') // 1013.25`

### `convertTemperature(value, from, to)`
Unidades: `K, C, F, R`. Conversión afín (no solo proporcional). **Ejemplo:** `convertTemperature(32, 'F', 'C') // 0`

### `convertSpeed(value, from, to)`
Unidades: `m/s, km/h, mph, kt, ft/s`. El nudo usa el factor exacto `1852/3600` m/s (una milla náutica por hora). **Ejemplo:** `convertSpeed(120, 'kt', 'km/h') // 222.24`

### `convertMass(value, from, to)`
Unidades: `kg, g, mg, ton, lb, oz, slug`. **Ejemplo:** `convertMass(1, 'slug', 'kg') // 14.5939...`

### `convertEnergy(value, from, to)`
Unidades: `J, kJ, cal, kcal, Wh, kWh, BTU, ftlb`. **Ejemplo:** `convertEnergy(1, 'kWh', 'J') // 3600000`

### `categoryOf(unit)`
**Retorna:** `string` — nombre de la categoría física de `unit`.
**Excepciones:** `MathError` (`UNKNOWN_UNIT`).
**Ejemplo:** `categoryOf('kt') // 'velocidad'`

### `unitsByCategory`
**Tipo:** `Object<string, string[]>` — no es función, es un objeto de datos. Pensado para que una futura interfaz arme selectores de unidades.
**Ejemplo:** `unitsByCategory.velocidad // ['m/s', 'km/h', 'mph', 'kt', 'ft/s']`

---

## Formato (`formatter/`)

### `approximatelyEqual(a, b, tolerance = 1e-10)` → `boolean` — compara con tolerancia absoluta. **Ejemplo:** `approximatelyEqual(0.1 + 0.2, 0.3) // true`
### `isApproximatelyZero(value, tolerance = 1e-10)` → `boolean`. **Ejemplo:** `isApproximatelyZero(1e-15) // true`
### `roundTo(value, decimals = 4)` → `number`. **Ejemplo:** `roundTo(3.14159, 2) // 3.14`
### `clean(value, tolerance = 1e-10, decimals = 4)` → `number` — 0 exacto si `|value| < tolerance`, si no `roundTo`. **Ejemplo:** `clean(-1.2e-15) // 0`
### `toFixedSmart(value, decimals = 4)` → `string` — recorta ceros sobrantes. **Ejemplo:** `toFixedSmart(3, 4) // "3"`
### `toScientific(value, significantDigits = 4)` → `string`. **Ejemplo:** `toScientific(123456, 3) // "1.235e+5"`
### `formatNumber(value, options = {})` → `string` — elige automáticamente notación fija o científica. `options.decimals` (4), `options.scientificBelow` (1e-4), `options.scientificAbove` (1e8). **Ejemplo:** `formatNumber(0.000001) // "1.0000e-6"`
### `formatMatrix(matrix, options = {})` → `string` — texto tabular simple. `options.decimals` (4), `options.columnWidth` (10). **Ejemplo:** `formatMatrix(Matrix.identity(2))`

---

## Validación (`validation/`)

Familias `isX` (booleanas, nunca lanzan) y `assertX` (lanzan `MathError`
o `DimensionError` si la condición falla; si es válida, devuelven el
valor recibido sin modificar, para poder encadenar
`const n = assertInteger(n, 'n');`).

### Números

| Función | Verifica | Code de error (assert) |
|---|---|---|
| `isNumber(value)` / `assertNumber(value, paramName?)` | `typeof value === 'number'` | `NOT_A_NUMBER` |
| `isFiniteNumber(value)` / `assertFiniteNumber(value, paramName?)` | number, no NaN, finito | `NOT_FINITE` |
| `isInteger(value)` / `assertInteger(value, paramName?)` | entero finito | `NOT_INTEGER` |
| `isPositive(value)` / `assertPositive(value, paramName?)` | finito y > 0 | `NOT_POSITIVE` |
| `isNonNegative(value)` / `assertNonNegative(value, paramName?)` | finito y ≥ 0 | `NOT_NON_NEGATIVE` |
| `isInRange(value, min, max)` / `assertInRange(value, min, max, paramName?)` | finito y en `[min, max]` | `OUT_OF_RANGE` |
| — / `assertFunction(value, paramName?)` | `typeof value === 'function'` | `NOT_A_FUNCTION` |

**Ejemplo:** `assertInteger(4.5, 'n') // lanza MathError code 'NOT_INTEGER'`

### Matrices y vectores

| Función | Verifica | Excepción |
|---|---|---|
| `isMatrixLike(value)` / `assertMatrixLike(value, paramName?)` | expone `{rows, cols, data}` consistentes | `MathError` (`NOT_MATRIX_LIKE`) |
| `assertSquareMatrix(matrix, paramName?)` | `matrix.rows === matrix.cols` | `DimensionError` |
| `assertSameDimensions(a, b, nameA?, nameB?)` | mismas `rows`/`cols` (suma/resta) | `DimensionError` |
| `assertMultipliable(a, b)` | `a.cols === b.rows` (producto) | `DimensionError` |
| `assertVectorData(data, paramName?)` | arreglo no vacío de números finitos | `DimensionError` |
| `assertSameLength(a, b, nameA?, nameB?)` | misma longitud | `DimensionError` |

**Ejemplo:** `assertSquareMatrix({rows:2,cols:3,data:[[1,2,3],[4,5,6]]}, 'A') // lanza DimensionError`

*(`isRectangularArray`, `isSquareData`, `assertRectangularArray` y
`assertSquareData` existen en `validation/matrix.js` pero son
implementación interna — ver `Architecture.md` sección 6 — y no se
reexportan desde `index.js`.)*

---

## Errores (`errors/`)

Todas extienden `Error` (directa o indirectamente) y agregan `code`
(string estable) y `context` (objeto con datos de depuración).

Los archivos que las definen están en kebab-case, como todo el resto del
proyecto (`CODING_STANDARDS.md` §2): `math-error.js`, `dimension-error.js`,
`singular-matrix-error.js`, `interpolation-error.js`. Es implementación
interna — las clases se importan desde `shared/math/index.js` y sus nombres
no cambiaron.

| Clase | Extiende | `code` por defecto | Uso típico |
|---|---|---|---|
| `MathError` | `Error` | `'MATH_ERROR'` (o el que se pase) | Base de todo el motor; también se usa directamente para validaciones genéricas y fallos de convergencia |
| `DimensionError` | `MathError` | `'DIMENSION_ERROR'` | Matrices/vectores incompatibles, o unidades de categorías físicas distintas |
| `SingularMatrixError` | `MathError` | `'SINGULAR_MATRIX'` | Una operación requería una matriz invertible y no lo es |
| `InterpolationError` | `MathError` | `'INTERPOLATION_ERROR'` | Datos de interpolación inválidos (x duplicados, fuera de dominio, etc.) |

**Ejemplo de manejo en una calculadora:**
```js
import { inverse, SingularMatrixError } from "../../shared/math/index.js";

try {
  const { inverse: Ainv } = inverse(A);
} catch (e) {
  if (e instanceof SingularMatrixError) {
    mostrarMensaje("Esta matriz no tiene inversa.");
  } else {
    throw e; // no lo esperábamos, que se propague
  }
}
```

---

## Constantes (`utils/constants.js`)

| Constante | Valor | Descripción |
|---|---|---|
| `DEFAULT_TOLERANCE` | `1e-10` | Tolerancia numérica por defecto en todo el motor |
| `RELAXED_TOLERANCE` | `1e-6` | Tolerancia relajada, para verificaciones con más margen |
| `DEFAULT_MAX_ITERATIONS` | `100` | Iteraciones máximas por defecto (Newton, bisección, secante) |
| `DEFAULT_QR_ITERATIONS` | `500` | Iteraciones del algoritmo QR para autovalores |
| `DEFAULT_DISPLAY_DECIMALS` | `4` | Decimales por defecto al formatear resultados |
| `DEFAULT_DERIVATIVE_STEP` | `1e-6` | Paso h para derivada numérica (diferencias finitas) |
| `STANDARD_GRAVITY` | `9.80665` | m/s² |
| `STANDARD_PRESSURE` | `101325` | Pa (ISA, nivel del mar) |
| `STANDARD_TEMPERATURE` | `288.15` | K (ISA, 15 °C) |
| `GAS_CONSTANT_AIR` | `287.05287` | J/(kg·K), aire seco |
| `UNIVERSAL_GAS_CONSTANT` | `8.31446261815324` | J/(mol·K) |
| `AVOGADRO_NUMBER` | `6.02214076e23` | mol⁻¹ |
| `SPEED_OF_LIGHT` | `299792458` | m/s |
| `ISA_LAPSE_RATE` | `-0.0065` | K/m, troposfera estándar |

---

## Utilidades genéricas (`utils/helpers.js`)

### `factorial(n)` → `number` — `n!`. `MathError` si `n` no es entero ≥ 0. **Ejemplo:** `factorial(5) // 120`
### `sign(x)` → `number` — -1, 0 o 1. **Ejemplo:** `sign(-4.2) // -1`
### `clamp(x, min, max)` → `number`. **Ejemplo:** `clamp(15, 0, 10) // 10`
### `linspace(a, b, n)` → `number[]` — `n` valores equiespaciados, `n ≥ 2`. **Ejemplo:** `linspace(0, 1, 5) // [0, 0.25, 0.5, 0.75, 1]`
### `range(start, end, step = 1)` → `number[]` — `[start, end)`. `MathError` si `step === 0`. **Ejemplo:** `range(0, 10, 2) // [0, 2, 4, 6, 8]`
### `isCallable(value)` → `boolean`. **Ejemplo:** `isCallable(Math.sqrt) // true`
### `deepCloneArray(arr)` → `Array` — clona un arreglo (o arreglo de arreglos) de valores planos.

*(`createUnitConverter` también vive en este archivo pero es
implementación interna — la fábrica que usan los propios módulos de
`units/*.js` para construirse — y no se reexporta desde `index.js`; ver
`Architecture.md` sección 6.)*
