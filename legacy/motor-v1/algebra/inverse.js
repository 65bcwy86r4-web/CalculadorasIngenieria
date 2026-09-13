import { SingularMatrixError } from "../errors/SingularMatrixError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateSquareMatrix } from "../validation/matrix.js";
import { determinant } from "./determinant.js";
import {
  createMatrix,
  identity,
  minor,
  scaleMatrix,
  transpose,
} from "./matrix.js";
import { reducedRowEchelon } from "./gauss.js";

/**
 * Computes the inverse matrix using Gauss-Jordan elimination.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[][]} Inverse matrix.
 *
 * @example
 * inverse([[1, 2], [3, 4]]);
 */
export function inverse(matrix, options = {}) {
  return inverseGaussJordan(matrix, options);
}

/**
 * Computes inverse(A) by reducing [A | I] to [I | A^-1].
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[][]} Inverse matrix.
 *
 * @example
 * inverseGaussJordan([[2, 0], [0, 4]]); // [[0.5, 0], [0, 0.25]]
 */
export function inverseGaussJordan(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  const n = matrix.length;
  const unit = identity(n);
  const augmented = matrix.map((row, index) => [...row, ...unit[index]]);
  const rref = reducedRowEchelon(augmented, { tolerance });

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const expected = row === col ? 1 : 0;
      if (Math.abs(rref.matrix[row][col] - expected) > tolerance) {
        throw new SingularMatrixError("Matrix is singular and cannot be inverted", {
          row,
          col,
        });
      }
    }
  }

  return rref.matrix.map((row) => row.slice(n).map((value) => cleanNumber(value)));
}

/**
 * Computes the matrix of cofactors.
 *
 * @param {number[][]} matrix Square matrix.
 * @returns {number[][]} Cofactor matrix.
 *
 * @example
 * cofactorMatrix([[1, 2], [3, 4]]); // [[4, -3], [-2, 1]]
 */
export function cofactorMatrix(matrix) {
  validateSquareMatrix(matrix);
  const n = matrix.length;
  if (n === 1) {
    return [[1]];
  }
  return createMatrix(n, n, (row, col) => {
    const sign = (row + col) % 2 === 0 ? 1 : -1;
    return cleanNumber(sign * determinant(minor(matrix, row, col)));
  });
}

/**
 * Computes adj(A), the transpose of the cofactor matrix.
 *
 * @param {number[][]} matrix Square matrix.
 * @returns {number[][]} Adjugate matrix.
 *
 * @example
 * adjugate([[1, 2], [3, 4]]); // [[4, -2], [-3, 1]]
 */
export function adjugate(matrix) {
  return transpose(cofactorMatrix(matrix));
}

/**
 * Computes the inverse by adj(A) / det(A).
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[][]} Inverse matrix.
 *
 * @example
 * inverseByAdjugate([[1, 2], [3, 4]]);
 */
export function inverseByAdjugate(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  const det = determinant(matrix, { tolerance });
  if (isNearlyZero(det, tolerance)) {
    throw new SingularMatrixError("Matrix determinant is zero", { determinant: det });
  }
  return scaleMatrix(adjugate(matrix), 1 / det).map((row) =>
    row.map((value) => cleanNumber(value)),
  );
}

export default Object.freeze({
  inverse,
  inverseGaussJordan,
  cofactorMatrix,
  adjugate,
  inverseByAdjugate,
});
