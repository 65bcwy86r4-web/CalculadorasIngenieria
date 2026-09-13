import { MathError } from "../errors/MathError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateLinearSystem, validateMatrix, validateVector } from "../validation/matrix.js";
import { createMatrix, multiplyMatrices, transpose, zeros } from "./matrix.js";

function getColumn(matrix, col) {
  return matrix.map((row) => row[col]);
}

function setColumn(matrix, col, vector) {
  for (let row = 0; row < matrix.length; row++) {
    matrix[row][col] = vector[row];
  }
}

function dot(vectorA, vectorB) {
  let sum = 0;
  for (let index = 0; index < vectorA.length; index++) {
    sum += vectorA[index] * vectorB[index];
  }
  return sum;
}

function norm(vector) {
  return Math.sqrt(dot(vector, vector));
}

/**
 * Computes a QR decomposition with modified Gram-Schmidt.
 * The result satisfies A = Q * R for matrices with independent columns.
 *
 * @param {number[][]} matrix Matrix with rows >= cols.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {{Q:number[][], R:number[][]}}
 *
 * @example
 * const { Q, R } = qrDecomposition([[1, 0], [1, 1], [0, 1]]);
 */
export function qrDecomposition(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateMatrix(matrix);
  const rows = matrix.length;
  const cols = matrix[0].length;
  if (rows < cols) {
    throw new MathError("QR decomposition requires row count >= column count", {
      rows,
      cols,
    });
  }

  const Q = zeros(rows, cols);
  const R = zeros(cols, cols);

  for (let col = 0; col < cols; col++) {
    let vector = getColumn(matrix, col);
    for (let previous = 0; previous < col; previous++) {
      const q = getColumn(Q, previous);
      R[previous][col] = cleanNumber(dot(q, vector));
      vector = vector.map((value, row) => value - R[previous][col] * q[row]);
    }

    const length = norm(vector);
    if (isNearlyZero(length, tolerance)) {
      throw new MathError("QR decomposition failed because columns are linearly dependent", {
        col,
      });
    }

    R[col][col] = cleanNumber(length);
    setColumn(Q, col, vector.map((value) => cleanNumber(value / length)));
  }

  return { Q, R };
}

/**
 * Solves a least-squares problem min ||Ax - b|| using QR.
 *
 * @param {number[][]} matrixA Coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[]} Least-squares solution.
 *
 * @example
 * solveQRLeastSquares([[1, 1], [1, 2], [1, 3]], [1, 2, 2]);
 */
export function solveQRLeastSquares(matrixA, vectorB, options = {}) {
  validateLinearSystem(matrixA, vectorB);
  validateVector(vectorB, "b");
  const { Q, R } = qrDecomposition(matrixA, options);
  const qt = transpose(Q);
  const qtb = multiplyMatrices(qt, vectorB.map((value) => [value])).map((row) => row[0]);
  const n = R.length;
  const solution = new Array(n).fill(0);

  for (let row = n - 1; row >= 0; row--) {
    let sum = qtb[row];
    for (let col = row + 1; col < n; col++) {
      sum -= R[row][col] * solution[col];
    }
    solution[row] = cleanNumber(sum / R[row][row]);
  }
  return solution;
}

export default Object.freeze({
  qrDecomposition,
  solveQRLeastSquares,
});
