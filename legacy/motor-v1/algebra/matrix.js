import { DimensionError } from "../errors/DimensionError.js";
import { cleanNumber } from "../formatter/precision.js";
import { createArray, cloneArrayData } from "../utils/helpers.js";
import { validateFiniteNumber, validateInteger } from "../validation/numbers.js";
import {
  getShape,
  validateMatrix,
  validateMatrixIndex,
  validateMultipliable,
  validateSameDimensions,
  validateSquareMatrix,
  validateVector,
} from "../validation/matrix.js";

/**
 * Creates a matrix with fixed dimensions.
 *
 * @param {number} rows Row count.
 * @param {number} cols Column count.
 * @param {number|((row:number,col:number)=>number)} [fill=0] Fill value or initializer.
 * @returns {number[][]} Created matrix.
 *
 * @example
 * const A = createMatrix(2, 3, 0);
 */
export function createMatrix(rows, cols, fill = 0) {
  validateInteger(rows, "rows");
  validateInteger(cols, "cols");
  if (rows <= 0 || cols <= 0) {
    throw new DimensionError("Matrix dimensions must be positive", { rows, cols });
  }

  const isInitializer = typeof fill === "function";
  if (!isInitializer) {
    validateFiniteNumber(fill, "fill");
  }

  return createArray(rows, (row) =>
    createArray(cols, (col) => {
      const value = isInitializer ? fill(row, col) : fill;
      return validateFiniteNumber(value, `matrix[${row}][${col}]`);
    }),
  );
}

/**
 * Clones raw matrix data.
 *
 * @param {number[][]} matrix Matrix to clone.
 * @returns {number[][]} Cloned matrix.
 *
 * @example
 * const copy = cloneMatrix([[1, 2], [3, 4]]);
 */
export function cloneMatrix(matrix) {
  validateMatrix(matrix);
  return cloneArrayData(matrix);
}

/**
 * Creates a validated matrix from array data.
 *
 * @param {number[][]} data Source data.
 * @returns {number[][]} Cloned matrix.
 *
 * @example
 * const A = fromArray([[1, 2], [3, 4]]);
 */
export function fromArray(data) {
  return cloneMatrix(data);
}

/**
 * Creates a zero matrix.
 *
 * @param {number} rows Row count.
 * @param {number} cols Column count.
 * @returns {number[][]} Zero matrix.
 *
 * @example
 * zeros(2, 2); // [[0, 0], [0, 0]]
 */
export function zeros(rows, cols) {
  return createMatrix(rows, cols, 0);
}

/**
 * Creates an identity matrix.
 *
 * @param {number} size Matrix size.
 * @returns {number[][]} Identity matrix.
 *
 * @example
 * identity(3);
 */
export function identity(size) {
  validateInteger(size, "size");
  if (size <= 0) {
    throw new DimensionError("Identity matrix size must be positive", { size });
  }
  return createMatrix(size, size, (row, col) => (row === col ? 1 : 0));
}

/**
 * Transposes a matrix.
 *
 * @param {number[][]} matrix Matrix to transpose.
 * @returns {number[][]} Transposed matrix.
 *
 * @example
 * transpose([[1, 2, 3]]); // [[1], [2], [3]]
 */
export function transpose(matrix) {
  const { rows, cols } = getShape(matrix);
  return createMatrix(cols, rows, (row, col) => matrix[col][row]);
}

/**
 * Adds two matrices with the same dimensions.
 *
 * @param {number[][]} matrixA First matrix.
 * @param {number[][]} matrixB Second matrix.
 * @returns {number[][]} Matrix sum.
 *
 * @example
 * addMatrices([[1]], [[2]]); // [[3]]
 */
export function addMatrices(matrixA, matrixB) {
  const { rows, cols } = validateSameDimensions(matrixA, matrixB);
  return createMatrix(rows, cols, (row, col) => matrixA[row][col] + matrixB[row][col]);
}

/**
 * Subtracts two matrices with the same dimensions.
 *
 * @param {number[][]} matrixA First matrix.
 * @param {number[][]} matrixB Second matrix.
 * @returns {number[][]} Matrix difference.
 *
 * @example
 * subtractMatrices([[3]], [[2]]); // [[1]]
 */
export function subtractMatrices(matrixA, matrixB) {
  const { rows, cols } = validateSameDimensions(matrixA, matrixB);
  return createMatrix(rows, cols, (row, col) => matrixA[row][col] - matrixB[row][col]);
}

/**
 * Multiplies every matrix value by a scalar.
 *
 * @param {number[][]} matrix Matrix to scale.
 * @param {number} scalar Scalar value.
 * @returns {number[][]} Scaled matrix.
 *
 * @example
 * scaleMatrix([[1, 2]], 3); // [[3, 6]]
 */
export function scaleMatrix(matrix, scalar) {
  const { rows, cols } = getShape(matrix);
  validateFiniteNumber(scalar, "scalar");
  return createMatrix(rows, cols, (row, col) => matrix[row][col] * scalar);
}

/**
 * Multiplies two matrices.
 *
 * @param {number[][]} matrixA Left matrix.
 * @param {number[][]} matrixB Right matrix.
 * @returns {number[][]} Matrix product.
 *
 * @example
 * multiplyMatrices([[1, 2]], [[3], [4]]); // [[11]]
 */
export function multiplyMatrices(matrixA, matrixB) {
  const { left, right } = validateMultipliable(matrixA, matrixB);
  return createMatrix(left.rows, right.cols, (row, col) => {
    let sum = 0;
    for (let index = 0; index < left.cols; index++) {
      sum += matrixA[row][index] * matrixB[index][col];
    }
    return cleanNumber(sum);
  });
}

/**
 * Multiplies a matrix by a vector.
 *
 * @param {number[][]} matrix Matrix.
 * @param {number[]} vector Vector.
 * @returns {number[]} Product vector.
 *
 * @example
 * multiplyMatrixVector([[2, 0], [0, 3]], [4, 5]); // [8, 15]
 */
export function multiplyMatrixVector(matrix, vector) {
  const { rows, cols } = getShape(matrix);
  validateVector(vector);
  if (cols !== vector.length) {
    throw new DimensionError("Matrix columns must match vector length", {
      cols,
      vectorLength: vector.length,
    });
  }
  return createArray(rows, (row) => {
    let sum = 0;
    for (let col = 0; col < cols; col++) {
      sum += matrix[row][col] * vector[col];
    }
    return cleanNumber(sum);
  });
}

/**
 * Returns the trace of a square matrix.
 *
 * @param {number[][]} matrix Square matrix.
 * @returns {number} Matrix trace.
 *
 * @example
 * trace([[1, 2], [3, 4]]); // 5
 */
export function trace(matrix) {
  validateSquareMatrix(matrix);
  let sum = 0;
  for (let index = 0; index < matrix.length; index++) {
    sum += matrix[index][index];
  }
  return cleanNumber(sum);
}

/**
 * Builds the minor matrix that excludes one row and one column.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {number} rowToRemove Row index to remove.
 * @param {number} colToRemove Column index to remove.
 * @returns {number[][]} Minor matrix.
 *
 * @example
 * minor([[1, 2], [3, 4]], 0, 0); // [[4]]
 */
export function minor(matrix, rowToRemove, colToRemove) {
  validateMatrixIndex(matrix, rowToRemove, colToRemove);
  const result = [];
  for (let row = 0; row < matrix.length; row++) {
    if (row === rowToRemove) continue;
    const values = [];
    for (let col = 0; col < matrix[row].length; col++) {
      if (col !== colToRemove) values.push(matrix[row][col]);
    }
    if (values.length > 0) result.push(values);
  }
  return result;
}

/**
 * Checks whether a matrix is square.
 *
 * @param {number[][]} matrix Matrix data.
 * @returns {boolean} True when row count equals column count.
 *
 * @example
 * isSquare([[1, 2], [3, 4]]); // true
 */
export function isSquare(matrix) {
  const { rows, cols } = getShape(matrix);
  return rows === cols;
}

/**
 * Checks whether a matrix is symmetric.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {number} [tolerance=1e-10] Numeric tolerance.
 * @returns {boolean} True when A equals A transposed within tolerance.
 *
 * @example
 * isSymmetric([[1, 2], [2, 1]]);
 */
export function isSymmetric(matrix, tolerance = 1e-10) {
  validateSquareMatrix(matrix);
  for (let row = 0; row < matrix.length; row++) {
    for (let col = row + 1; col < matrix.length; col++) {
      if (Math.abs(matrix[row][col] - matrix[col][row]) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Computes the Frobenius norm.
 *
 * @param {number[][]} matrix Matrix data.
 * @returns {number} Frobenius norm.
 *
 * @example
 * frobeniusNorm([[3, 4]]); // 5
 */
export function frobeniusNorm(matrix) {
  validateMatrix(matrix);
  let sum = 0;
  for (const row of matrix) {
    for (const value of row) {
      sum += value * value;
    }
  }
  return Math.sqrt(sum);
}

export default Object.freeze({
  createMatrix,
  cloneMatrix,
  fromArray,
  zeros,
  identity,
  transpose,
  addMatrices,
  subtractMatrices,
  scaleMatrix,
  multiplyMatrices,
  multiplyMatrixVector,
  trace,
  minor,
  isSquare,
  isSymmetric,
  frobeniusNorm,
});
