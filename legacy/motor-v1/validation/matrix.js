import { DimensionError } from "../errors/DimensionError.js";
import { MathError } from "../errors/MathError.js";
import { validateFiniteNumber, validateInteger } from "./numbers.js";

/**
 * Returns the shape of a rectangular numeric matrix.
 *
 * @param {number[][]} matrix Matrix data.
 * @returns {{rows:number, cols:number}} Matrix shape.
 *
 * @example
 * getShape([[1, 2], [3, 4]]); // { rows: 2, cols: 2 }
 */
export function getShape(matrix) {
  validateMatrix(matrix);
  return { rows: matrix.length, cols: matrix[0].length };
}

/**
 * Validates a rectangular matrix of finite numbers.
 *
 * @param {*} matrix Value to validate.
 * @param {string} [name="matrix"] Parameter name.
 * @returns {number[][]} The validated matrix.
 *
 * @example
 * validateMatrix([[1, 2], [3, 4]], "A");
 */
export function validateMatrix(matrix, name = "matrix") {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new DimensionError(`${name} must be a non-empty matrix`, {
      name,
      value: matrix,
    });
  }
  if (!Array.isArray(matrix[0]) || matrix[0].length === 0) {
    throw new DimensionError(`${name} must have at least one column`, {
      name,
      value: matrix,
    });
  }
  const cols = matrix[0].length;
  for (let row = 0; row < matrix.length; row++) {
    if (!Array.isArray(matrix[row]) || matrix[row].length !== cols) {
      throw new DimensionError(`${name} must be rectangular`, {
        name,
        row,
        expectedColumns: cols,
        actualColumns: Array.isArray(matrix[row]) ? matrix[row].length : null,
      });
    }
    for (let col = 0; col < cols; col++) {
      validateFiniteNumber(matrix[row][col], `${name}[${row}][${col}]`);
    }
  }
  return matrix;
}

/**
 * Validates a square matrix.
 *
 * @param {number[][]} matrix Matrix to validate.
 * @param {string} [name="matrix"] Parameter name.
 * @returns {number[][]} The validated matrix.
 *
 * @example
 * validateSquareMatrix([[1, 0], [0, 1]], "A");
 */
export function validateSquareMatrix(matrix, name = "matrix") {
  validateMatrix(matrix, name);
  if (matrix.length !== matrix[0].length) {
    throw new DimensionError(`${name} must be square`, {
      name,
      rows: matrix.length,
      cols: matrix[0].length,
    });
  }
  return matrix;
}

/**
 * Validates that two matrices have the same shape.
 *
 * @param {number[][]} matrixA First matrix.
 * @param {number[][]} matrixB Second matrix.
 * @returns {{rows:number, cols:number}} Shared shape.
 *
 * @example
 * validateSameDimensions([[1]], [[2]]);
 */
export function validateSameDimensions(matrixA, matrixB) {
  const a = getShape(matrixA);
  const b = getShape(matrixB);
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new DimensionError("Matrices must have the same dimensions", {
      left: a,
      right: b,
    });
  }
  return a;
}

/**
 * Validates matrix dimensions for multiplication.
 *
 * @param {number[][]} matrixA Left matrix.
 * @param {number[][]} matrixB Right matrix.
 * @returns {{left:{rows:number, cols:number}, right:{rows:number, cols:number}}}
 *
 * @example
 * validateMultipliable([[1, 2]], [[3], [4]]);
 */
export function validateMultipliable(matrixA, matrixB) {
  const left = getShape(matrixA);
  const right = getShape(matrixB);
  if (left.cols !== right.rows) {
    throw new DimensionError("Matrices are not compatible for multiplication", {
      left,
      right,
    });
  }
  return { left, right };
}

/**
 * Validates a vector of finite numbers.
 *
 * @param {*} vector Value to validate.
 * @param {string} [name="vector"] Parameter name.
 * @returns {number[]} The validated vector.
 *
 * @example
 * validateVector([1, 2, 3], "velocity");
 */
export function validateVector(vector, name = "vector") {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new DimensionError(`${name} must be a non-empty vector`, {
      name,
      value: vector,
    });
  }
  for (let index = 0; index < vector.length; index++) {
    validateFiniteNumber(vector[index], `${name}[${index}]`);
  }
  return vector;
}

/**
 * Validates a vector length.
 *
 * @param {number[]} vector Vector to inspect.
 * @param {number} expectedLength Required length.
 * @param {string} [name="vector"] Parameter name.
 * @returns {number[]} The validated vector.
 *
 * @example
 * validateVectorLength([1, 2, 3], 3, "force");
 */
export function validateVectorLength(vector, expectedLength, name = "vector") {
  validateVector(vector, name);
  validateInteger(expectedLength, "expectedLength");
  if (vector.length !== expectedLength) {
    throw new DimensionError(`${name} must have length ${expectedLength}`, {
      name,
      expectedLength,
      actualLength: vector.length,
    });
  }
  return vector;
}

/**
 * Validates Ax = b dimensions for linear systems.
 *
 * @param {number[][]} matrixA Coefficient matrix.
 * @param {number[]} vectorB Independent terms.
 * @returns {{rows:number, cols:number}} Matrix shape.
 *
 * @example
 * validateLinearSystem([[2, 1], [1, 3]], [1, 2]);
 */
export function validateLinearSystem(matrixA, vectorB) {
  const shape = getShape(matrixA);
  validateVector(vectorB, "b");
  if (shape.rows !== vectorB.length) {
    throw new DimensionError("A row count must match b length", {
      rows: shape.rows,
      vectorLength: vectorB.length,
    });
  }
  return shape;
}

/**
 * Validates a matrix index.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {number} row Row index.
 * @param {number} col Column index.
 * @returns {{rows:number, cols:number}} Matrix shape.
 *
 * @example
 * validateMatrixIndex([[1]], 0, 0);
 */
export function validateMatrixIndex(matrix, row, col) {
  const shape = getShape(matrix);
  validateInteger(row, "row");
  validateInteger(col, "col");
  if (row < 0 || row >= shape.rows || col < 0 || col >= shape.cols) {
    throw new MathError("Matrix index out of bounds", { row, col, shape });
  }
  return shape;
}

export default Object.freeze({
  getShape,
  validateMatrix,
  validateSquareMatrix,
  validateSameDimensions,
  validateMultipliable,
  validateVector,
  validateVectorLength,
  validateLinearSystem,
  validateMatrixIndex,
});
