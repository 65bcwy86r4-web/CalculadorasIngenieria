import { SingularMatrixError } from "../errors/SingularMatrixError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateLinearSystem, validateSquareMatrix } from "../validation/matrix.js";
import { cloneMatrix, identity, zeros } from "./matrix.js";

/**
 * Computes an LU decomposition with partial pivoting.
 * The result satisfies P * A = L * U.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {{L:number[][], U:number[][], P:number[][], swaps:number}}
 *
 * @example
 * const { L, U, P } = luDecomposition([[2, 1], [4, 3]]);
 */
export function luDecomposition(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  const n = matrix.length;
  const U = cloneMatrix(matrix);
  const L = identity(n);
  const P = identity(n);
  let swaps = 0;

  for (let pivot = 0; pivot < n; pivot++) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < n; row++) {
      if (Math.abs(U[row][pivot]) > Math.abs(U[pivotRow][pivot])) {
        pivotRow = row;
      }
    }

    if (isNearlyZero(U[pivotRow][pivot], tolerance)) {
      throw new SingularMatrixError("LU decomposition failed because matrix is singular", {
        pivot,
      });
    }

    if (pivotRow !== pivot) {
      [U[pivot], U[pivotRow]] = [U[pivotRow], U[pivot]];
      [P[pivot], P[pivotRow]] = [P[pivotRow], P[pivot]];
      for (let col = 0; col < pivot; col++) {
        [L[pivot][col], L[pivotRow][col]] = [L[pivotRow][col], L[pivot][col]];
      }
      swaps++;
    }

    for (let row = pivot + 1; row < n; row++) {
      const factor = U[row][pivot] / U[pivot][pivot];
      L[row][pivot] = cleanNumber(factor);
      U[row][pivot] = 0;
      for (let col = pivot + 1; col < n; col++) {
        U[row][col] = cleanNumber(U[row][col] - factor * U[pivot][col]);
      }
    }
  }

  return { L, U, P, swaps };
}

/**
 * Solves Ax = b using LU decomposition.
 *
 * @param {number[][]} matrixA Square coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[]} Solution vector.
 *
 * @example
 * solveLU([[2, 1], [1, 3]], [1, 2]);
 */
export function solveLU(matrixA, vectorB, options = {}) {
  validateLinearSystem(matrixA, vectorB);
  const { L, U, P } = luDecomposition(matrixA, options);
  const n = matrixA.length;
  const pb = new Array(n).fill(0);

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      pb[row] += P[row][col] * vectorB[col];
    }
  }

  const y = new Array(n).fill(0);
  for (let row = 0; row < n; row++) {
    let sum = pb[row];
    for (let col = 0; col < row; col++) {
      sum -= L[row][col] * y[col];
    }
    y[row] = cleanNumber(sum / L[row][row]);
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = y[row];
    for (let col = row + 1; col < n; col++) {
      sum -= U[row][col] * x[col];
    }
    x[row] = cleanNumber(sum / U[row][row]);
  }
  return x;
}

/**
 * Computes the determinant from an LU decomposition.
 *
 * @param {{U:number[][], swaps:number}} decomposition LU decomposition result.
 * @returns {number} Determinant.
 *
 * @example
 * determinantFromLU(luDecomposition([[1, 2], [3, 4]]));
 */
export function determinantFromLU(decomposition) {
  const { U, swaps } = decomposition;
  let value = swaps % 2 === 0 ? 1 : -1;
  for (let index = 0; index < U.length; index++) {
    value *= U[index][index];
  }
  return cleanNumber(value);
}

export default Object.freeze({
  luDecomposition,
  solveLU,
  determinantFromLU,
});
