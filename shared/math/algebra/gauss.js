import { DimensionError } from "../errors/DimensionError.js";
import { SingularMatrixError } from "../errors/SingularMatrixError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { cloneMatrix } from "./matrix.js";
import {
  getShape,
  validateLinearSystem,
  validateMatrix,
  validateSquareMatrix,
} from "../validation/matrix.js";

/**
 * Computes row echelon form using partial pivoting.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {{matrix:number[][], pivots:Array<{row:number,col:number,value:number}>, swapCount:number, rank:number}}
 *
 * @example
 * rowEchelon([[1, 2], [2, 4]]).rank; // 1
 */
export function rowEchelon(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateMatrix(matrix);
  const working = cloneMatrix(matrix);
  const { rows, cols } = getShape(working);
  const pivots = [];
  let swapCount = 0;
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let maxRow = pivotRow;
    for (let row = pivotRow + 1; row < rows; row++) {
      if (Math.abs(working[row][col]) > Math.abs(working[maxRow][col])) {
        maxRow = row;
      }
    }

    if (isNearlyZero(working[maxRow][col], tolerance)) {
      continue;
    }

    if (maxRow !== pivotRow) {
      const temp = working[pivotRow];
      working[pivotRow] = working[maxRow];
      working[maxRow] = temp;
      swapCount++;
    }

    const pivotValue = working[pivotRow][col];
    pivots.push({ row: pivotRow, col, value: pivotValue });

    for (let row = pivotRow + 1; row < rows; row++) {
      const factor = working[row][col] / pivotValue;
      working[row][col] = 0;
      for (let currentCol = col + 1; currentCol < cols; currentCol++) {
        working[row][currentCol] -= factor * working[pivotRow][currentCol];
        working[row][currentCol] = cleanNumber(working[row][currentCol]);
      }
    }
    pivotRow++;
  }

  return { matrix: working, pivots, swapCount, rank: pivots.length };
}

/**
 * Computes reduced row echelon form using Gauss-Jordan elimination.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {{matrix:number[][], pivots:Array<{row:number,col:number,value:number}>, swapCount:number, rank:number}}
 *
 * @example
 * reducedRowEchelon([[1, 2], [2, 4]]).matrix;
 */
export function reducedRowEchelon(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  const echelon = rowEchelon(matrix, { tolerance });
  const working = echelon.matrix;
  const cols = working[0].length;

  for (let index = echelon.pivots.length - 1; index >= 0; index--) {
    const { row, col } = echelon.pivots[index];
    const pivotValue = working[row][col];
    if (isNearlyZero(pivotValue, tolerance)) {
      continue;
    }

    for (let currentCol = col; currentCol < cols; currentCol++) {
      working[row][currentCol] = cleanNumber(working[row][currentCol] / pivotValue);
    }

    for (let upperRow = 0; upperRow < row; upperRow++) {
      const factor = working[upperRow][col];
      if (isNearlyZero(factor, tolerance)) continue;
      working[upperRow][col] = 0;
      for (let currentCol = col + 1; currentCol < cols; currentCol++) {
        working[upperRow][currentCol] -= factor * working[row][currentCol];
        working[upperRow][currentCol] = cleanNumber(working[upperRow][currentCol]);
      }
    }
  }

  return {
    matrix: working,
    pivots: echelon.pivots,
    swapCount: echelon.swapCount,
    rank: echelon.pivots.length,
  };
}

/**
 * Computes matrix rank.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number} Matrix rank.
 *
 * @example
 * rank([[1, 2], [2, 4]]); // 1
 */
export function rank(matrix, options = {}) {
  return rowEchelon(matrix, options).rank;
}

/**
 * Solves Ax = b using Gaussian elimination and back substitution.
 *
 * @param {number[][]} matrixA Square coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[]} Solution vector.
 *
 * @example
 * gaussSolve([[2, 1], [1, 3]], [1, 2]);
 */
export function gaussSolve(matrixA, vectorB, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrixA, "A");
  validateLinearSystem(matrixA, vectorB);
  const n = matrixA.length;
  const augmented = matrixA.map((row, index) => [...row, vectorB[index]]);

  for (let pivot = 0; pivot < n; pivot++) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < n; row++) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
        pivotRow = row;
      }
    }
    if (isNearlyZero(augmented[pivotRow][pivot], tolerance)) {
      throw new SingularMatrixError("System matrix is singular or nearly singular", {
        pivot,
      });
    }
    if (pivotRow !== pivot) {
      const temp = augmented[pivot];
      augmented[pivot] = augmented[pivotRow];
      augmented[pivotRow] = temp;
    }
    for (let row = pivot + 1; row < n; row++) {
      const factor = augmented[row][pivot] / augmented[pivot][pivot];
      augmented[row][pivot] = 0;
      for (let col = pivot + 1; col <= n; col++) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  const solution = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = augmented[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= augmented[row][col] * solution[col];
    }
    solution[row] = cleanNumber(sum / augmented[row][row]);
  }
  return solution;
}

/**
 * Solves Ax = b with Gauss-Jordan elimination.
 *
 * @param {number[][]} matrixA Coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {{type:"unique"|"infinite"|"none", solution?:number[], rref:number[][], rankA:number, rankAugmented:number}}
 *
 * @example
 * gaussJordanSolve([[1, 1], [1, -1]], [3, 1]).solution; // [2, 1]
 */
export function gaussJordanSolve(matrixA, vectorB, options = {}) {
  validateLinearSystem(matrixA, vectorB);
  const { cols } = getShape(matrixA);
  const augmented = matrixA.map((row, index) => [...row, vectorB[index]]);
  const rref = reducedRowEchelon(augmented, options);
  const rankA = rank(matrixA, options);
  const rankAugmented = rref.rank;

  if (rankA < rankAugmented) {
    return {
      type: "none",
      rref: rref.matrix,
      rankA,
      rankAugmented,
    };
  }

  if (rankA < cols) {
    return {
      type: "infinite",
      rref: rref.matrix,
      rankA,
      rankAugmented,
    };
  }

  const solution = new Array(cols).fill(0);
  for (const pivot of rref.pivots) {
    if (pivot.col < cols) {
      solution[pivot.col] = cleanNumber(rref.matrix[pivot.row][cols]);
    }
  }

  return {
    type: "unique",
    solution,
    rref: rref.matrix,
    rankA,
    rankAugmented,
  };
}

/**
 * Creates an augmented matrix [A | b].
 *
 * @param {number[][]} matrixA Coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @returns {number[][]} Augmented matrix.
 *
 * @example
 * createAugmentedMatrix([[1, 2]], [3]); // [[1, 2, 3]]
 */
export function createAugmentedMatrix(matrixA, vectorB) {
  validateLinearSystem(matrixA, vectorB);
  return matrixA.map((row, index) => [...row, vectorB[index]]);
}

/**
 * Validates that a linear system has a unique solution.
 *
 * @param {ReturnType<typeof gaussJordanSolve>} result Result from gaussJordanSolve.
 * @returns {number[]} Unique solution.
 *
 * @example
 * assertUniqueSolution(gaussJordanSolve([[1]], [2]));
 */
export function assertUniqueSolution(result) {
  if (result.type !== "unique") {
    throw new DimensionError("Linear system does not have a unique solution", {
      type: result.type,
      rankA: result.rankA,
      rankAugmented: result.rankAugmented,
    });
  }
  return result.solution;
}

export default Object.freeze({
  rowEchelon,
  reducedRowEchelon,
  rank,
  gaussSolve,
  gaussJordanSolve,
  createAugmentedMatrix,
  assertUniqueSolution,
});
