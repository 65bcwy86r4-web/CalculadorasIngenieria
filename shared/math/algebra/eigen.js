/**
 * algebra/eigen.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: la entrada que elige método de autovalores, y todo
 * lo que se construye sobre los autovalores ya calculados — autovectores y
 * diagonalización.
 *
 * Los tres métodos viven cada uno en su archivo, porque cada uno es una
 * responsabilidad completa con su propia teoría, sus propias limitaciones y
 * su propio margen de mejora (ADR-007 §3.5):
 *
 *   algebra/eigen-qr.js       QR iterativo         eigenvaluesQR
 *   algebra/eigen-jacobi.js   rotaciones de Jacobi jacobiEigenDecomposition
 *   algebra/eigen-2x2.js      forma cerrada 2x2    eigenvalues2x2
 *
 * El despacho de `eigenvalues`:
 *
 *   | Caso                        | Método                                  |
 *   |-----------------------------|-----------------------------------------|
 *   | 1x1                         | trivial (el único elemento)             |
 *   | simétrica de cualquier orden| rotaciones de Jacobi                    |
 *   | 2x2 no simétrica            | polinomio característico (forma cerrada)|
 *   | general                     | QR iterativo sin desplazamiento         |
 *
 * Por qué el despacho y no solo QR: la iteración QR sin desplazamiento no
 * converge cuando dos autovalores tienen el mismo módulo y signo opuesto
 * —el caso de un tensor de corte puro, con autovalores ±τ—. En esas
 * matrices devuelve ceros y los señala como complejos, siendo que toda
 * matriz simétrica real tiene autovalores reales por el teorema espectral
 * (hallazgo H-03, y H-04 como consecuencia en vonMisesStress).
 *
 * Jacobi no tiene ese problema: aniquila de a un par de elementos fuera de
 * la diagonal por rotación ortogonal, y para matrices simétricas converge
 * siempre. El caso 2x2 se resuelve exacto por la fórmula cuadrática, que es
 * además el que un estudiante verifica a mano.
 *
 * `eigenvaluesQR` conserva esa limitación a propósito: es el algoritmo QR,
 * no "los autovalores". Quien lo llama pide ese método —para mostrarlo
 * corriendo, por ejemplo— y el nombre lo anuncia (ADR-005).
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-12
 * Modificado: 2026-09-13 — despacho por tipo (ADR-004); separación de
 *   `eigenvalues` y `eigenvaluesQR` (ADR-005); división por método y
 *   contrato de `steps` (ADR-007)
 * Dependencias: ./matrix.js, ./gauss.js, ./inverse.js, ./eigen-qr.js,
 *   ./eigen-jacobi.js, ./eigen-2x2.js, ../validation/matrix.js,
 *   ../errors/math-error.js, ../utils/constants.js
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { reducedRowEchelon } from './gauss.js';
import { inverse } from './inverse.js';
import { eigenvaluesQR } from './eigen-qr.js';
import { jacobiEigenDecomposition } from './eigen-jacobi.js';
import { eigenvalues2x2 } from './eigen-2x2.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_QR_ITERATIONS, DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Autovalores reales de una matriz cuadrada, de mayor a menor. **Es la
 * entrada recomendada**: elige el método adecuado según el tipo de matriz
 * (ver la tabla del encabezado del archivo) en vez de imponer uno.
 *
 * `method` dice cuál se usó —`'trivial'`, `'jacobi'`, `'closed-form-2x2'` o
 * `'qr'`—, que es lo que una calculadora necesita para explicar el
 * procedimiento. `hasComplexHint` avisa que el espectro puede tener pares
 * complejos conjugados, que el motor no representa todavía (deuda D5); para
 * una matriz simétrica es siempre `false`, porque el teorema espectral
 * garantiza autovalores reales.
 *
 * `steps` son los del método que se despachó, no unos propios: lo que hay
 * que mostrar de un cálculo de autovalores es el desarrollo del algoritmo
 * que efectivamente corrió. Hoy vienen vacíos en los cuatro caminos; se
 * llenan en el Paso 2c-2 (ADR-007 §4) y `eigenvalues` los hereda sin
 * cambiar una línea.
 *
 * Para pedir un algoritmo en particular —y ver sus iteraciones— están
 * `eigenvaluesQR`, `jacobiEigenDecomposition` y `eigenvalues2x2`.
 *
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - umbral de simetría y de
 *   convergencia de Jacobi
 * @param {number} [iterations=DEFAULT_QR_ITERATIONS] - pasos de la iteración
 *   QR; solo afecta al camino general
 * @returns {{ values: number[], method: string, hasComplexHint: boolean, steps: Array<Object> }}
 * @throws {DimensionError} si la matriz no es cuadrada
 * @example
 * eigenvalues(new Matrix([[2, 1], [1, 2]])).values; // [3, 1]
 * @example
 * // Simétrica con autovalores de igual módulo: va por Jacobi y sale exacta.
 * eigenvalues(new Matrix([[0, 50], [50, 0]])); // { values: [50, -50], method: 'jacobi', ... }
 */
export function eigenvalues(
  matrix,
  tolerance = DEFAULT_TOLERANCE,
  iterations = DEFAULT_QR_ITERATIONS,
) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;

  if (n === 1) {
    return {
      values: [matrix.data[0][0]],
      method: 'trivial',
      hasComplexHint: false,
      steps: [],
    };
  }

  if (matrix.isSymmetric(tolerance)) {
    const { values, steps } = jacobiEigenDecomposition(matrix, tolerance);
    return { values, method: 'jacobi', hasComplexHint: false, steps };
  }

  if (n === 2) {
    const { values, hasComplexPair, steps } = eigenvalues2x2(matrix, tolerance);
    // Con raíces complejas no hay autovalores reales que devolver. Se
    // informa la diagonal de la iterada QR, que es lo que el método
    // general daría, y el hint queda en true: es exacto acá, sale del
    // signo del discriminante y no de mirar la subdiagonal.
    const fallback = hasComplexPair ? eigenvaluesQR(matrix, iterations).values : values;
    return {
      values: fallback,
      method: 'closed-form-2x2',
      hasComplexHint: hasComplexPair,
      steps,
    };
  }

  const { values, hasComplexHint, steps } = eigenvaluesQR(matrix, iterations);
  return { values, method: 'qr', hasComplexHint, steps };
}

/**
 * Autovector asociado a un autovalor lambda: resuelve el sistema
 * homogéneo (A − λI)v = 0 mediante Gauss-Jordan sobre su núcleo.
 *
 * Devuelve el vector pelado y no un objeto con `steps` a propósito: es una
 * pieza de construcción de `eigenvectors`, no una operación que una
 * calculadora ofrezca por separado, y ADR-007 §3.4 no la alcanza. El
 * procedimiento del cálculo de autovectores se muestra desde `eigenvectors`.
 *
 * @param {Matrix} matrix
 * @param {number} lambda
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {number[]|null} vector normalizado, o null si no se pudo aislar una variable libre
 * @example
 * eigenvectorFor(new Matrix([[2,1],[1,2]]), 3); // [0.7071, 0.7071] (aprox.)
 */
export function eigenvectorFor(matrix, lambda, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const shifted = matrix.subtract(Matrix.identity(n).scalarMultiply(lambda));
  const { result, pivots } = reducedRowEchelon(shifted, tolerance);

  const pivotCols = new Set(pivots.map((p) => p.col));
  const freeCols = [];
  for (let c = 0; c < n; c++) if (!pivotCols.has(c)) freeCols.push(c);
  if (freeCols.length === 0) return null;

  const freeCol = freeCols[0];
  const vector = new Array(n).fill(0);
  vector[freeCol] = 1;
  for (const { row, col } of pivots) vector[col] = -result.data[row][freeCol];

  let sumSq = 0;
  for (const v of vector) sumSq += v * v;
  const mag = Math.sqrt(sumSq) || 1;
  return vector.map((v) => v / mag);
}

/**
 * Empareja cada autovalor con su autovector. El parámetro se llama `values`
 * y no `eigenvalues` para no tapar dentro de esta función a la función
 * homónima del módulo.
 *
 * `steps` viene vacío: el desarrollo de (A − λI)v = 0 para cada autovalor
 * es el Paso 2c-2 (ADR-007 §4).
 *
 * @param {Matrix} matrix
 * @param {number[]} values - autovalores, típicamente de `eigenvalues(A).values`
 * @returns {{ vectors: Array<{ lambda: number, vector: number[]|null }>, steps: Array<Object> }}
 * @example
 * eigenvectors(new Matrix([[2,1],[1,2]]), [3, 1]).vectors;
 */
export function eigenvectors(matrix, values) {
  const vectors = values.map((lambda) => ({ lambda, vector: eigenvectorFor(matrix, lambda) }));
  return { vectors, steps: [] };
}

/**
 * Diagonalización A = P·D·P⁻¹: P se construye con los autovectores como
 * columnas y D con los autovalores correspondientes en la diagonal.
 *
 * `steps` encadena los del cálculo de autovalores y los del de
 * autovectores, que son las dos mitades del procedimiento. Hoy vienen
 * vacíos los dos; se llenan en el Paso 2c-2 (ADR-007 §4).
 *
 * @param {Matrix} matrix
 * @returns {{ P: Matrix, D: Matrix, Pinv: Matrix, steps: Array<Object> }}
 * @throws {MathError} code 'NOT_DIAGONALIZABLE' si P resulta singular
 * @example
 * const { P, D, Pinv } = diagonalize(new Matrix([[2,1],[1,2]]));
 */
export function diagonalize(matrix) {
  const { values, steps: valueSteps } = eigenvalues(matrix);
  const { vectors: pairs, steps: vectorSteps } = eigenvectors(matrix, values);
  const n = matrix.rows;

  const P = Matrix.zeros(n, n);
  for (let j = 0; j < n; j++) {
    const v = pairs[j].vector;
    if (!v) throw new MathError('No se pudo construir un autovector completo; la matriz podría no ser diagonalizable.', 'NOT_DIAGONALIZABLE', { lambda: pairs[j].lambda });
    for (let i = 0; i < n; i++) P.data[i][j] = v[i];
  }

  let invResult;
  try {
    invResult = inverse(P);
  } catch (e) {
    throw new MathError('La matriz de autovectores es singular: A no es diagonalizable (autovectores linealmente dependientes).', 'NOT_DIAGONALIZABLE', { cause: e.message });
  }

  return {
    P,
    D: Matrix.diagonal(values),
    Pinv: invResult.inverse,
    steps: [...valueSteps, ...vectorSteps],
  };
}
