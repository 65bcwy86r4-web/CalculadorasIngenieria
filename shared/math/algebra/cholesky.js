/**
 * algebra/cholesky.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: descomposición de Cholesky (A = L·Lᵀ), válida
 * únicamente para matrices simétricas definidas positivas.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { DimensionError } from '../errors/dimension-error.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * `steps` viene vacío: el desarrollo elemento a elemento es el Paso 2c-2
 * (ADR-007 §4). La clave existe desde ya para que la interfaz pueda
 * escribirse contra el contrato definitivo.
 *
 * @param {Matrix} matrix - debe ser simétrica y definida positiva
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ L: Matrix, Lt: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si no es cuadrada o no es simétrica
 * @throws {MathError} code 'NOT_POSITIVE_DEFINITE' si no es definida positiva
 * @example
 * choleskyDecomposition(new Matrix([[4,2],[2,3]])).L.toArray();
 * // [[2, 0], [1, 1.4142...]]
 */
export function choleskyDecomposition(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  if (!matrix.isSymmetric(tolerance)) {
    throw new DimensionError('Cholesky requiere una matriz simétrica (A = Aᵀ).', { size: matrix.rows });
  }
  const n = matrix.rows;
  const L = Matrix.zeros(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L.data[i][k] * L.data[j][k];
      if (i === j) {
        const value = matrix.data[i][i] - sum;
        if (value <= tolerance) {
          throw new MathError('La matriz no es definida positiva: Cholesky no es aplicable.', 'NOT_POSITIVE_DEFINITE', { row: i });
        }
        L.data[i][j] = Math.sqrt(value);
      } else {
        L.data[i][j] = (matrix.data[i][j] - sum) / L.data[j][j];
      }
    }
  }
  return { L, Lt: L.transpose(), steps: [] };
}
