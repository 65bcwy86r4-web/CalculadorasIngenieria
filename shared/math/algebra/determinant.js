import { SingularMatrixError } from "../errors/SingularMatrixError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { cloneMatrix, minor } from "./matrix.js";
import { validateSquareMatrix } from "../validation/matrix.js";

/**
 * Computes a determinant using Gaussian elimination with partial pivoting.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number} Determinant.
 *
 * @example
 * determinant([[1, 2], [3, 4]]); // -2
 */
export function determinant(matrix, options = {}) {
  return determinantByGaussianElimination(matrix, options);
}

/**
 * Computes a determinant in O(n^3) using triangularization.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number} Determinant.
 *
 * @example
 * determinantByGaussianElimination([[2, 0], [0, 3]]); // 6
 */
export function determinantByGaussianElimination(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  const n = matrix.length;
  const working = cloneMatrix(matrix);
  let sign = 1;

  for (let pivot = 0; pivot < n; pivot++) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < n; row++) {
      if (Math.abs(working[row][pivot]) > Math.abs(working[pivotRow][pivot])) {
        pivotRow = row;
      }
    }

    if (isNearlyZero(working[pivotRow][pivot], tolerance)) {
      return 0;
    }

    if (pivotRow !== pivot) {
      const temp = working[pivot];
      working[pivot] = working[pivotRow];
      working[pivotRow] = temp;
      sign *= -1;
    }

    for (let row = pivot + 1; row < n; row++) {
      const factor = working[row][pivot] / working[pivot][pivot];
      working[row][pivot] = 0;
      for (let col = pivot + 1; col < n; col++) {
        working[row][col] -= factor * working[pivot][col];
      }
    }
  }

  let value = sign;
  for (let index = 0; index < n; index++) {
    value *= working[index][index];
  }
  return cleanNumber(value);
}

/**
 * Computes a determinant by recursive cofactor expansion.
 * This is useful for didactic output and small matrices only.
 *
 * @param {number[][]} matrix Square matrix.
 * @returns {number} Determinant.
 *
 * @example
 * determinantByCofactors([[1, 2], [3, 4]]); // -2
 */
export function determinantByCofactors(matrix) {
  validateSquareMatrix(matrix);
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return cleanNumber(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]);

  let value = 0;
  for (let col = 0; col < n; col++) {
    const sign = col % 2 === 0 ? 1 : -1;
    value += sign * matrix[0][col] * determinantByCofactors(minor(matrix, 0, col));
  }
  return cleanNumber(value);
}

/**
 * Asserts that a matrix has non-zero determinant.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Numeric tolerance.
 * @returns {number} Determinant when non-zero.
 *
 * @example
 * assertNonSingular([[1, 0], [0, 1]]);
 */
export function assertNonSingular(matrix, tolerance = DEFAULT_TOLERANCE) {
  const value = determinant(matrix, { tolerance });
  if (isNearlyZero(value, tolerance)) {
    throw new SingularMatrixError("Matrix is singular", { determinant: value });
  }
  return value;
}

export default Object.freeze({
  determinant,
  determinantByGaussianElimination,
  determinantByCofactors,
  assertNonSingular,
});
