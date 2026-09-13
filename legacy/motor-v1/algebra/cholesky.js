import { MathError } from "../errors/MathError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateLinearSystem, validateSquareMatrix } from "../validation/matrix.js";
import { isSymmetric, zeros } from "./matrix.js";

/**
 * Computes the Cholesky decomposition A = L * L^T.
 * A must be symmetric positive definite.
 *
 * @param {number[][]} matrix Symmetric positive definite matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[][]} Lower triangular matrix L.
 *
 * @example
 * choleskyDecomposition([[4, 2], [2, 3]]);
 */
export function choleskyDecomposition(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  if (!isSymmetric(matrix, tolerance)) {
    throw new MathError("Cholesky decomposition requires a symmetric matrix");
  }

  const n = matrix.length;
  const L = zeros(n, n);

  for (let row = 0; row < n; row++) {
    for (let col = 0; col <= row; col++) {
      let sum = 0;
      for (let index = 0; index < col; index++) {
        sum += L[row][index] * L[col][index];
      }

      if (row === col) {
        const value = matrix[row][row] - sum;
        if (value < -tolerance || isNearlyZero(value, tolerance)) {
          throw new MathError("Matrix is not positive definite", { row, value });
        }
        L[row][col] = cleanNumber(Math.sqrt(value));
      } else {
        L[row][col] = cleanNumber((matrix[row][col] - sum) / L[col][col]);
      }
    }
  }

  return L;
}

/**
 * Solves Ax = b using Cholesky decomposition.
 *
 * @param {number[][]} matrixA Symmetric positive definite matrix.
 * @param {number[]} vectorB Independent terms.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[]} Solution vector.
 *
 * @example
 * solveCholesky([[4, 2], [2, 3]], [1, 1]);
 */
export function solveCholesky(matrixA, vectorB, options = {}) {
  validateLinearSystem(matrixA, vectorB);
  const L = choleskyDecomposition(matrixA, options);
  const n = L.length;
  const y = new Array(n).fill(0);

  for (let row = 0; row < n; row++) {
    let sum = vectorB[row];
    for (let col = 0; col < row; col++) {
      sum -= L[row][col] * y[col];
    }
    y[row] = cleanNumber(sum / L[row][row]);
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = y[row];
    for (let col = row + 1; col < n; col++) {
      sum -= L[col][row] * x[col];
    }
    x[row] = cleanNumber(sum / L[row][row]);
  }
  return x;
}

export default Object.freeze({
  choleskyDecomposition,
  solveCholesky,
});
