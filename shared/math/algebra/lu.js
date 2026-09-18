/**
 * algebra/lu.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: descomposición LU con pivoteo parcial (P·A = L·U).
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { SingularMatrixError } from '../errors/singular-matrix-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Factorización LU con pivoteo parcial: P·A = L·U, con L triangular
 * inferior (diagonal de 1s), U triangular superior y P matriz de
 * permutación.
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * Cada paso lleva `snapshot` con el estado de `U` después de aplicarlo: es
 * el factor que se está construyendo, que es lo que ADR-007 §3.2 pide para
 * las factorizaciones. `L` y `P` se completan al final y no tienen estado
 * intermedio interesante que mostrar.
 *
 * @returns {{ L: Matrix, U: Matrix, P: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si la matriz no es cuadrada
 * @throws {SingularMatrixError} si la matriz es singular
 * @example
 * const { L, U, P } = luDecomposition(new Matrix([[4,3],[6,3]]));
 */
export function luDecomposition(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const U = matrix.clone();
  const L = Matrix.identity(n);
  const perm = Array.from({ length: n }, (_, i) => i);
  const steps = [];

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(U.data[r][col]) > Math.abs(U.data[maxRow][col])) maxRow = r;
    }
    if (Math.abs(U.data[maxRow][col]) < tolerance) {
      throw new SingularMatrixError(`La matriz es singular: no se encontró pivote no nulo en la columna ${col + 1}.`, { column: col + 1 });
    }
    if (maxRow !== col) {
      [U.data[col], U.data[maxRow]] = [U.data[maxRow], U.data[col]];
      [perm[col], perm[maxRow]] = [perm[maxRow], perm[col]];
      for (let c = 0; c < col; c++) [L.data[col][c], L.data[maxRow][c]] = [L.data[maxRow][c], L.data[col][c]];
      steps.push({ type: 'swap', text: `Intercambio F${col + 1} ↔ F${maxRow + 1} (pivoteo parcial).`, snapshot: U.toArray() });
    }
    for (let r = col + 1; r < n; r++) {
      const factor = U.data[r][col] / U.data[col][col];
      L.data[r][col] = factor;
      for (let c = col; c < n; c++) U.data[r][c] -= factor * U.data[col][c];
      steps.push({ type: 'elim', text: `F${r + 1} → F${r + 1} − (${factor.toFixed(4)})·F${col + 1}`, snapshot: U.toArray() });
    }
  }

  const P = Matrix.zeros(n, n);
  for (let i = 0; i < n; i++) P.data[i][perm[i]] = 1;
  return { L, U, P, steps };
}
