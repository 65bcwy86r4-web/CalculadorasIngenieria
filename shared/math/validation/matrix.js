/**
 * validation/matrix.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: validar la "forma" de datos matriciales y
 * vectoriales, ya sea como arreglos 2D crudos (number[][]) o como
 * objetos "matrix-like" que exponen { rows, cols, data }.
 *
 * Este módulo NO importa algebra/matrix.js a propósito: si lo hiciera,
 * algebra/matrix.js (que usa estas validaciones para construirse) y
 * validation/matrix.js se necesitarían mutuamente, generando una
 * dependencia circular. En vez de eso, se valida por "duck typing": si
 * el objeto tiene la forma correcta, se acepta, sin importar si es una
 * instancia real de Matrix.
 * ---------------------------------------------------------------------------
 */

import { DimensionError } from '../errors/DimensionError.js';
import { MathError } from '../errors/MathError.js';
import { isFiniteNumber } from './numbers.js';

/**
 * @param {*} data
 * @returns {boolean} true si data es un arreglo de arreglos, todas las
 *   filas de igual longitud y con solo números finitos.
 * @example
 * isRectangularArray([[1,2],[3,4]]); // true
 * isRectangularArray([[1,2],[3]]); // false
 */
export function isRectangularArray(data) {
  if (!Array.isArray(data) || data.length === 0) return false;
  if (!Array.isArray(data[0])) return false;
  const cols = data[0].length;
  if (cols === 0) return false;
  return data.every((row) => Array.isArray(row) && row.length === cols && row.every(isFiniteNumber));
}

/**
 * @param {*} data - arreglo 2D
 * @returns {boolean} true si es rectangular y además cuadrado (rows === cols)
 * @example
 * isSquareData([[1,2],[3,4]]); // true
 * isSquareData([[1,2,3],[4,5,6]]); // false
 */
export function isSquareData(data) {
  return isRectangularArray(data) && data.length === data[0].length;
}

/**
 * @param {*} value
 * @returns {boolean} true si value expone { rows:number, cols:number, data:number[][] }
 *   con dimensiones consistentes entre sí (duck typing de "matrix-like").
 * @example
 * isMatrixLike({ rows: 2, cols: 2, data: [[1,0],[0,1]] }); // true
 * isMatrixLike({ rows: 2, cols: 2, data: [[1,0]] }); // false
 */
export function isMatrixLike(value) {
  if (!value || typeof value !== 'object') return false;
  const { rows, cols, data } = value;
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) return false;
  if (!Array.isArray(data) || data.length !== rows) return false;
  return data.every((row) => Array.isArray(row) && row.length === cols);
}

/**
 * @param {*} data
 * @param {string} [paramName='data']
 * @returns {number[][]}
 * @throws {DimensionError} si no es un arreglo 2D rectangular de números finitos
 * @example
 * assertRectangularArray([[1,2],[3,4]], 'A'); // ok
 * assertRectangularArray([[1,2],[3]], 'A'); // lanza DimensionError
 */
export function assertRectangularArray(data, paramName = 'data') {
  if (!isRectangularArray(data)) {
    throw new DimensionError(
      `El parámetro "${paramName}" debe ser un arreglo rectangular (todas las filas de igual longitud) con solo números finitos.`,
      { paramName }
    );
  }
  return data;
}

/**
 * @param {*} data
 * @param {string} [paramName='data']
 * @returns {number[][]}
 * @throws {DimensionError}
 * @example
 * assertSquareData([[1,2],[3,4]], 'A'); // ok
 * assertSquareData([[1,2,3],[4,5,6]], 'A'); // lanza DimensionError
 */
export function assertSquareData(data, paramName = 'data') {
  assertRectangularArray(data, paramName);
  if (data.length !== data[0].length) {
    throw new DimensionError(
      `El parámetro "${paramName}" debe ser una matriz cuadrada (se recibió ${data.length}x${data[0].length}).`,
      { paramName, rows: data.length, cols: data[0].length }
    );
  }
  return data;
}

/**
 * @param {*} value
 * @param {string} [paramName='matriz']
 * @returns {Object}
 * @throws {MathError} code 'NOT_MATRIX_LIKE'
 * @example
 * assertMatrixLike({ rows: 2, cols: 2, data: [[1,0],[0,1]] }, 'A'); // ok
 */
export function assertMatrixLike(value, paramName = 'matriz') {
  if (!isMatrixLike(value)) {
    throw new MathError(
      `El parámetro "${paramName}" debe ser una matriz (objeto con rows, cols y data consistentes).`,
      'NOT_MATRIX_LIKE',
      { paramName }
    );
  }
  return value;
}

/**
 * @param {Object} matrix - objeto matrix-like
 * @param {string} [paramName='matriz']
 * @returns {Object} la misma matriz recibida
 * @throws {DimensionError} si matrix.rows !== matrix.cols
 * @example
 * assertSquareMatrix({ rows: 2, cols: 2, data: [[1,0],[0,1]] }, 'A'); // ok
 */
export function assertSquareMatrix(matrix, paramName = 'matriz') {
  assertMatrixLike(matrix, paramName);
  if (matrix.rows !== matrix.cols) {
    throw new DimensionError(
      `El parámetro "${paramName}" debe ser cuadrada (se recibió ${matrix.rows}x${matrix.cols}).`,
      { paramName, rows: matrix.rows, cols: matrix.cols }
    );
  }
  return matrix;
}

/**
 * Verifica que dos matrices tengan exactamente las mismas dimensiones
 * (requerido para suma y resta).
 * @param {Object} a
 * @param {Object} b
 * @param {string} [nameA='A']
 * @param {string} [nameB='B']
 * @throws {DimensionError}
 * @example
 * assertSameDimensions({ rows: 2, cols: 2, data: [[1,0],[0,1]] }, { rows: 2, cols: 2, data: [[1,1],[1,1]] }); // ok
 */
export function assertSameDimensions(a, b, nameA = 'A', nameB = 'B') {
  assertMatrixLike(a, nameA);
  assertMatrixLike(b, nameB);
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new DimensionError(
      `Las matrices "${nameA}" (${a.rows}x${a.cols}) y "${nameB}" (${b.rows}x${b.cols}) deben tener las mismas dimensiones.`,
      { nameA, nameB, dimsA: [a.rows, a.cols], dimsB: [b.rows, b.cols] }
    );
  }
}

/**
 * Verifica que a.cols === b.rows (requerido para el producto A·B).
 * @param {Object} a
 * @param {Object} b
 * @throws {DimensionError}
 * @example
 * assertMultipliable({ rows: 2, cols: 3, data: [[1,2,3],[4,5,6]] }, { rows: 3, cols: 1, data: [[1],[1],[1]] }); // ok
 */
export function assertMultipliable(a, b) {
  assertMatrixLike(a, 'A');
  assertMatrixLike(b, 'B');
  if (a.cols !== b.rows) {
    throw new DimensionError(
      `Producto no definido: A es ${a.rows}x${a.cols} y B es ${b.rows}x${b.cols}. Las columnas de A deben ser iguales a las filas de B.`,
      { dimsA: [a.rows, a.cols], dimsB: [b.rows, b.cols] }
    );
  }
}

/**
 * @param {*} data - arreglo plano
 * @param {string} [paramName='vector']
 * @returns {number[]}
 * @throws {DimensionError}
 * @example
 * assertVectorData([1,2,3], 'b'); // ok
 */
export function assertVectorData(data, paramName = 'vector') {
  if (!Array.isArray(data) || data.length === 0 || !data.every(isFiniteNumber)) {
    throw new DimensionError(`El parámetro "${paramName}" debe ser un arreglo no vacío de números finitos.`, { paramName });
  }
  return data;
}

/**
 * Verifica que dos vectores (arreglos planos) tengan la misma longitud.
 * @param {number[]} a
 * @param {number[]} b
 * @param {string} [nameA='a']
 * @param {string} [nameB='b']
 * @throws {DimensionError}
 * @example
 * assertSameLength([1, 2], [3, 4]); // ok
 * assertSameLength([1, 2], [3, 4, 5]); // lanza DimensionError
 */
export function assertSameLength(a, b, nameA = 'a', nameB = 'b') {
  assertVectorData(a, nameA);
  assertVectorData(b, nameB);
  if (a.length !== b.length) {
    throw new DimensionError(`Los vectores "${nameA}" (largo ${a.length}) y "${nameB}" (largo ${b.length}) deben tener la misma longitud.`, { nameA, nameB });
  }
}
