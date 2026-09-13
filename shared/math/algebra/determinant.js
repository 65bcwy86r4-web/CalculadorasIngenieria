/**
 * algebra/determinant.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: calcular el determinante de una matriz cuadrada.
 * Método principal: triangulación de Gauss (O(n³), reutiliza gauss.js).
 * Método secundario: expansión por cofactores (Laplace), ofrecido solo
 * como recurso teórico/didáctico para matrices pequeñas, ya que su costo
 * es O(n!) y se vuelve impracticable más allá de 7×7.
 * ---------------------------------------------------------------------------
 */

import { rowEchelon } from './gauss.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/MathError.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Determinante mediante triangulación de Gauss:
 * det(A) = (-1)^(cant. de intercambios) · producto de los pivotes.
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ value: number, steps: Array<Object>, swapCount: number }}
 * @throws {DimensionError} si la matriz no es cuadrada (vía assertSquareMatrix)
 * @example
 * determinantByGauss(new Matrix([[2,1],[1,3]])).value; // 5
 */
export function determinantByGauss(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  if (n === 1) {
    return { value: matrix.data[0][0], steps: [{ type: 'info', text: 'Matriz 1x1: el determinante es el único elemento.' }], swapCount: 0 };
  }
  const { result, steps, swapCount, pivots } = rowEchelon(matrix, tolerance);
  if (pivots.length < n) {
    steps.push({ type: 'info', text: 'Se obtuvo una columna sin pivote (fila de ceros): det(A) = 0.' });
    return { value: 0, steps, swapCount };
  }
  let product = 1;
  for (let i = 0; i < n; i++) product *= result.data[i][i];
  const sign = swapCount % 2 === 0 ? 1 : -1;
  const value = sign * product;
  steps.push({ type: 'final', text: `det(A) = ${sign === -1 ? '(-1)·' : ''}producto de la diagonal = ${value}` + (swapCount > 0 ? ` (${swapCount} intercambio(s) de fila)` : '') });
  return { value, steps, swapCount };
}

/**
 * Expansión por cofactores (recursiva), solo con fines teóricos/didácticos.
 * Limitada a n <= 7 por su complejidad O(n!); para matrices más grandes
 * usar determinantByGauss.
 * @param {Matrix} matrix
 * @returns {number}
 * @throws {DimensionError} si no es cuadrada
 * @throws {MathError} si n > 7 (code 'TOO_LARGE_FOR_COFACTORS')
 * @example
 * determinantByCofactors(new Matrix([[1,2],[3,4]])); // -2
 */
export function determinantByCofactors(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  if (matrix.rows > 7) {
    throw new MathError(
      'La expansión por cofactores solo está disponible como recurso teórico hasta 7x7 (su costo crece como n!). Usá determinantByGauss para matrices más grandes.',
      'TOO_LARGE_FOR_COFACTORS',
      { size: matrix.rows }
    );
  }
  return expand(matrix);
}

/** @param {Matrix} matrix @returns {number} @private */
function expand(matrix) {
  const n = matrix.rows;
  if (n === 1) return matrix.data[0][0];
  if (n === 2) return matrix.data[0][0] * matrix.data[1][1] - matrix.data[0][1] * matrix.data[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const cofactorSign = j % 2 === 0 ? 1 : -1;
    det += cofactorSign * matrix.data[0][j] * expand(matrix.minor(0, j));
  }
  return det;
}
