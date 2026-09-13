/**
 * algebra/inverse.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: inversa de una matriz y las operaciones que se
 * derivan de ella (adjunta, matriz de cofactores, número de condición).
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { reducedRowEchelon } from './gauss.js';
import { determinantByGauss } from './determinant.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { SingularMatrixError } from '../errors/SingularMatrixError.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Inversa mediante Gauss-Jordan sobre la matriz aumentada [A | I]:
 * [A | I] → [I | A⁻¹].
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ inverse: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si la matriz no es cuadrada
 * @throws {SingularMatrixError} si la matriz no tiene inversa
 * @example
 * inverse(new Matrix([[4,7],[2,6]])).inverse.toArray();
 * // [[0.6, -0.7], [-0.2, 0.4]]
 */
export function inverse(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const identity = Matrix.identity(n);
  const augmented = new Matrix(matrix.data.map((row, i) => row.concat(identity.data[i])));

  const { result, steps, pivots } = reducedRowEchelon(augmented, tolerance);

  // Importante: solo cuentan como pivotes válidos para el rango de A los
  // que caen dentro de las primeras n columnas (el bloque original).
  // Un pivote hallado dentro del bloque identidad aumentado no aporta
  // rango a A; ignorarlo evita falsos positivos de invertibilidad.
  const pivotsInA = pivots.filter((p) => p.col < n).length;
  if (pivotsInA < n) {
    throw new SingularMatrixError(`La matriz es singular (rango ${pivotsInA} de ${n}): no tiene inversa.`, { rank: pivotsInA, size: n });
  }

  const inverseData = result.data.map((row) => row.slice(n, 2 * n));
  steps.push({ type: 'final', text: 'Se obtuvo la identidad en el bloque izquierdo: el bloque derecho es A⁻¹.' });
  return { inverse: new Matrix(inverseData), steps };
}

/**
 * Matriz de cofactores: C[i][j] = (-1)^(i+j) · det(menor_ij).
 * @param {Matrix} matrix
 * @returns {Matrix}
 * @throws {DimensionError} si no es cuadrada
 * @example
 * cofactorMatrix(new Matrix([[1,2],[3,4]])).toArray(); // [[4,-3],[-2,1]]
 */
export function cofactorMatrix(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const data = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      const sub = matrix.minor(i, j);
      const detMinor = sub.rows === 1 ? sub.data[0][0] : determinantByGauss(sub).value;
      data[i][j] = sign * detMinor;
    }
  }
  return new Matrix(data);
}

/**
 * Adjunta: adj(A) = transpuesta de la matriz de cofactores.
 * Para n > 6 se calcula de forma eficiente como adj(A) = det(A)·A⁻¹, en
 * vez de recalcular n² menores por cofactores (mismo resultado, mucho
 * más rápido para matrices grandes).
 * @param {Matrix} matrix
 * @returns {Matrix}
 * @throws {DimensionError} si no es cuadrada
 * @throws {SingularMatrixError} si es singular y n > 6 (no se puede usar det(A)·A⁻¹)
 * @example
 * adjugate(new Matrix([[1,2],[3,4]])).toArray(); // [[4,-2],[-3,1]]
 */
export function adjugate(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  if (matrix.rows <= 6) {
    return cofactorMatrix(matrix).transpose();
  }
  const det = determinantByGauss(matrix).value;
  const { inverse: inv } = inverse(matrix);
  return inv.scalarMultiply(det);
}

/**
 * Número de condición aproximado: κ(A) = ‖A‖_F · ‖A⁻¹‖_F. Valores altos
 * indican que el sistema Ax=b es numéricamente sensible a pequeños
 * errores en A o b.
 * @param {Matrix} matrix
 * @returns {{ value: number, normA: number, normInverse: number }}
 * @throws {SingularMatrixError} si la matriz es singular (condición infinita)
 * @example
 * conditionNumber(Matrix.identity(3)).value; // 3 (‖I‖_F · ‖I‖_F = √3·√3)
 */
export function conditionNumber(matrix) {
  const { inverse: inv } = inverse(matrix);
  const normA = matrix.frobeniusNorm();
  const normInverse = inv.frobeniusNorm();
  return { value: normA * normInverse, normA, normInverse };
}
