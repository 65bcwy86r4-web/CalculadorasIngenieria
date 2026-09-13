/**
 * algebra/eigen.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: autovalores, autovectores y diagonalización.
 * Construido enteramente sobre qr.js (algoritmo QR iterativo) y gauss.js
 * (núcleo de A - λI), sin reimplementar ninguno de los dos.
 *
 * Nota pedagógica: el algoritmo QR sin shifts converge de forma confiable
 * para matrices simétricas y, en general, para matrices con autovalores
 * reales y distintos. Matrices con autovalores complejos conjugados (por
 * ejemplo, rotaciones puras) no se resuelven de forma exacta; se informa
 * cuando se detectan bloques 2×2 no triangularizados.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { qrDecomposition } from './qr.js';
import { reducedRowEchelon } from './gauss.js';
import { inverse } from './inverse.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/MathError.js';
import { DEFAULT_QR_ITERATIONS, DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Aproxima los autovalores reales de una matriz cuadrada mediante el
 * algoritmo QR iterativo (sin shifts): Aₖ = QₖRₖ, Aₖ₊₁ = RₖQₖ; la
 * diagonal de Aₖ converge a los autovalores cuando el espectro es real.
 * @param {Matrix} matrix
 * @param {number} [iterations=DEFAULT_QR_ITERATIONS]
 * @returns {{ values: number[], matrixT: Matrix, hasComplexHint: boolean }}
 * @throws {DimensionError} si la matriz no es cuadrada
 * @example
 * eigenvaluesQR(new Matrix([[2,1],[1,2]])).values; // [3, 1] (aprox.)
 */
export function eigenvaluesQR(matrix, iterations = DEFAULT_QR_ITERATIONS) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  let Ak = matrix.clone();

  for (let it = 0; it < iterations; it++) {
    const { Q, R } = qrDecomposition(Ak);
    Ak = R.multiply(Q);
  }

  const values = [];
  for (let i = 0; i < n; i++) values.push(Ak.data[i][i]);

  let hasComplexHint = false;
  for (let i = 0; i < n - 1; i++) if (Math.abs(Ak.data[i + 1][i]) > 1e-4) hasComplexHint = true;

  values.sort((a, b) => b - a);
  return { values, matrixT: Ak, hasComplexHint };
}

/**
 * Autovector asociado a un autovalor lambda: resuelve el sistema
 * homogéneo (A − λI)v = 0 mediante Gauss-Jordan sobre su núcleo.
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
 * @param {Matrix} matrix
 * @param {number[]} eigenvalues
 * @returns {Array<{ lambda: number, vector: number[]|null }>}
 * @example
 * eigenvectors(new Matrix([[2,1],[1,2]]), [3, 1]);
 */
export function eigenvectors(matrix, eigenvalues) {
  return eigenvalues.map((lambda) => ({ lambda, vector: eigenvectorFor(matrix, lambda) }));
}

/**
 * Diagonalización A = P·D·P⁻¹: P se construye con los autovectores como
 * columnas y D con los autovalores correspondientes en la diagonal.
 * @param {Matrix} matrix
 * @returns {{ P: Matrix, D: Matrix, Pinv: Matrix }}
 * @throws {MathError} code 'NOT_DIAGONALIZABLE' si P resulta singular
 * @example
 * const { P, D, Pinv } = diagonalize(new Matrix([[2,1],[1,2]]));
 */
export function diagonalize(matrix) {
  const { values } = eigenvaluesQR(matrix);
  const pairs = eigenvectors(matrix, values);
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

  return { P, D: Matrix.diagonal(values), Pinv: invResult.inverse };
}
