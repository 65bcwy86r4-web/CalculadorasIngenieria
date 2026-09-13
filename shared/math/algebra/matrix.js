/**
 * algebra/matrix.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: representar una matriz numérica y sus operaciones
 * elementales (construcción, aritmética básica, transposición, potencia,
 * propiedades estructurales y normas). Los algoritmos "grandes"
 * (determinante, inversa, Gauss, LU, QR, Cholesky, autovalores) viven en
 * sus propios archivos y consumen esta clase; no se implementan acá para
 * mantener este módulo cohesivo y del tamaño justo.
 *
 * Ningún otro módulo del motor debe reimplementar suma, producto,
 * transposición, etc.: todos deben construir y operar sobre instancias
 * de Matrix definidas acá (DRY).
 * ---------------------------------------------------------------------------
 */

import { DimensionError } from '../errors/dimension-error.js';
import { MathError } from '../errors/math-error.js';
import { assertRectangularArray, assertSameDimensions, assertMultipliable, assertSquareMatrix } from '../validation/matrix.js';
import { assertInteger, assertNonNegative } from '../validation/numbers.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

export class Matrix {
  /**
   * @param {number[][]} data - arreglo 2D rectangular de números finitos.
   * @throws {DimensionError} si data no es rectangular o contiene valores no finitos
   * @example
   * const A = new Matrix([[1, 2], [3, 4]]);
   */
  constructor(data) {
    assertRectangularArray(data, 'data');
    this.rows = data.length;
    this.cols = data[0].length;
    this.data = data.map((row) => row.slice());
  }

  /* ------------------------------ Constructores estáticos ------------------------------ */

  /**
   * @param {number[][]} data
   * @returns {Matrix}
   * @example
   * Matrix.fromArray([[1, 0], [0, 1]]);
   */
  static fromArray(data) {
    return new Matrix(data);
  }

  /**
   * @param {number} n - dimensión (n >= 1)
   * @returns {Matrix} matriz identidad de n×n
   * @example
   * Matrix.identity(3);
   */
  static identity(n) {
    assertInteger(n, 'n');
    if (n < 1) throw new MathError('identity requiere n >= 1.', 'NOT_POSITIVE', { n });
    const data = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    return new Matrix(data);
  }

  /**
   * @param {number} rows
   * @param {number} [cols=rows]
   * @returns {Matrix} matriz de ceros
   * @example
   * Matrix.zeros(2, 3);
   */
  static zeros(rows, cols = rows) {
    assertInteger(rows, 'rows');
    assertInteger(cols, 'cols');
    if (rows < 1 || cols < 1) throw new MathError('zeros requiere rows y cols >= 1.', 'NOT_POSITIVE', { rows, cols });
    return new Matrix(Array.from({ length: rows }, () => new Array(cols).fill(0)));
  }

  /**
   * @param {number[]} values - valores de la diagonal principal
   * @returns {Matrix} matriz diagonal n×n con `values` en la diagonal
   * @example
   * Matrix.diagonal([1, 2, 3]);
   */
  static diagonal(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new MathError('diagonal requiere un arreglo no vacío de valores.', 'NOT_A_NUMBER', { values });
    }
    const n = values.length;
    const data = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? values[i] : 0)));
    return new Matrix(data);
  }

  /* ----------------------------------- Utilidades básicas ----------------------------------- */

  /** @returns {Matrix} copia independiente de esta matriz */
  clone() {
    return new Matrix(this.data);
  }

  /** @returns {boolean} true si rows === cols */
  isSquare() {
    return this.rows === this.cols;
  }

  /**
   * @param {number} i - fila (0-indexada)
   * @param {number} j - columna (0-indexada)
   * @returns {number}
   */
  get(i, j) {
    return this.data[i][j];
  }

  /**
   * @param {number} i
   * @param {number} j
   * @param {number} value
   */
  set(i, j, value) {
    this.data[i][j] = value;
  }

  /** @returns {number[][]} copia del contenido como arreglo 2D plano */
  toArray() {
    return this.data.map((row) => row.slice());
  }

  /**
   * @param {Matrix} other
   * @param {number} [tolerance=DEFAULT_TOLERANCE]
   * @returns {boolean} true si ambas matrices tienen la misma forma y
   *   todos sus elementos son iguales dentro de la tolerancia dada
   */
  equals(other, tolerance = DEFAULT_TOLERANCE) {
    if (!(other instanceof Matrix) || this.rows !== other.rows || this.cols !== other.cols) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        if (Math.abs(this.data[i][j] - other.data[i][j]) > tolerance) return false;
    return true;
  }

  /**
   * Extrae el menor complementario: la submatriz que resulta de eliminar
   * la fila i y la columna j. Usado por determinant.js (cofactores) e
   * inverse.js (adjunta/cofactores) para no reimplementar esta operación
   * en cada archivo.
   * @param {number} i - fila a eliminar (0-indexada)
   * @param {number} j - columna a eliminar (0-indexada)
   * @returns {Matrix}
   * @throws {DimensionError} si la matriz no es cuadrada
   * @example
   * new Matrix([[1,2,3],[4,5,6],[7,8,9]]).minor(0, 0);
   * // Matrix [[5,6],[8,9]]
   */
  minor(i, j) {
    assertSquareMatrix(this, 'this');
    const data = [];
    for (let r = 0; r < this.rows; r++) {
      if (r === i) continue;
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (c === j) continue;
        row.push(this.data[r][c]);
      }
      data.push(row);
    }
    return new Matrix(data);
  }

  /* --------------------------------------- Aritmética --------------------------------------- */

  /**
   * @param {Matrix} other
   * @returns {Matrix}
   * @throws {DimensionError}
   * @example
   * new Matrix([[1,2]]).add(new Matrix([[3,4]])); // [[4,6]]
   */
  add(other) {
    assertSameDimensions(this, other, 'A', 'B');
    const data = this.data.map((row, i) => row.map((v, j) => v + other.data[i][j]));
    return new Matrix(data);
  }

  /**
   * @param {Matrix} other
   * @returns {Matrix}
   * @throws {DimensionError}
   */
  subtract(other) {
    assertSameDimensions(this, other, 'A', 'B');
    const data = this.data.map((row, i) => row.map((v, j) => v - other.data[i][j]));
    return new Matrix(data);
  }

  /**
   * @param {number} k
   * @returns {Matrix}
   * @example
   * new Matrix([[1,2],[3,4]]).scalarMultiply(2); // [[2,4],[6,8]]
   */
  scalarMultiply(k) {
    if (typeof k !== 'number' || !Number.isFinite(k)) {
      throw new MathError('scalarMultiply requiere un escalar numérico finito.', 'NOT_FINITE', { k });
    }
    return new Matrix(this.data.map((row) => row.map((v) => v * k)));
  }

  /**
   * @param {Matrix} other
   * @returns {Matrix}
   * @throws {DimensionError} si this.cols !== other.rows
   * @example
   * new Matrix([[1,2],[3,4]]).multiply(Matrix.identity(2)); // igual a la original
   */
  multiply(other) {
    assertMultipliable(this, other);
    const result = Matrix.zeros(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) sum += this.data[i][k] * other.data[k][j];
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  /** @returns {Matrix} transpuesta (Aᵀ) */
  transpose() {
    const data = Array.from({ length: this.cols }, (_, j) => Array.from({ length: this.rows }, (_, i) => this.data[i][j]));
    return new Matrix(data);
  }

  /**
   * @param {number} n - exponente entero no negativo
   * @returns {Matrix} A elevada a la n mediante productos sucesivos
   * @throws {DimensionError} si la matriz no es cuadrada
   * @throws {MathError} si n no es entero no negativo
   * @example
   * new Matrix([[2,0],[0,2]]).power(3); // [[8,0],[0,8]]
   */
  power(n) {
    assertSquareMatrix(this, 'this');
    assertInteger(n, 'n');
    assertNonNegative(n, 'n');
    let result = Matrix.identity(this.rows);
    for (let i = 0; i < n; i++) result = result.multiply(this);
    return result;
  }

  /**
   * @returns {number} suma de la diagonal principal
   * @throws {DimensionError} si la matriz no es cuadrada
   */
  trace() {
    assertSquareMatrix(this, 'this');
    let sum = 0;
    for (let i = 0; i < this.rows; i++) sum += this.data[i][i];
    return sum;
  }

  /* ------------------------------- Propiedades estructurales ------------------------------- */

  /** @param {number} [tolerance=DEFAULT_TOLERANCE] @returns {boolean} true si A === Aᵀ */
  isSymmetric(tolerance = DEFAULT_TOLERANCE) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = i + 1; j < this.cols; j++)
        if (Math.abs(this.data[i][j] - this.data[j][i]) > tolerance) return false;
    return true;
  }

  /** @param {number} [tolerance=DEFAULT_TOLERANCE] @returns {boolean} */
  isDiagonal(tolerance = DEFAULT_TOLERANCE) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        if (i !== j && Math.abs(this.data[i][j]) > tolerance) return false;
    return true;
  }

  /** @param {number} [tolerance=DEFAULT_TOLERANCE] @returns {boolean} */
  isUpperTriangular(tolerance = DEFAULT_TOLERANCE) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < i; j++)
        if (Math.abs(this.data[i][j]) > tolerance) return false;
    return true;
  }

  /** @param {number} [tolerance=DEFAULT_TOLERANCE] @returns {boolean} */
  isLowerTriangular(tolerance = DEFAULT_TOLERANCE) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = i + 1; j < this.cols; j++)
        if (Math.abs(this.data[i][j]) > tolerance) return false;
    return true;
  }

  /**
   * @param {number} [tolerance=DEFAULT_TOLERANCE]
   * @returns {boolean} true si es diagonal y todos los elementos de la diagonal son 1
   */
  isIdentity(tolerance = DEFAULT_TOLERANCE) {
    if (!this.isDiagonal(tolerance)) return false;
    for (let i = 0; i < this.rows; i++) if (Math.abs(this.data[i][i] - 1) > tolerance) return false;
    return true;
  }

  /** @returns {number} norma de Frobenius: raíz de la suma de los cuadrados de todos los elementos */
  frobeniusNorm() {
    let sum = 0;
    for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) sum += this.data[i][j] * this.data[i][j];
    return Math.sqrt(sum);
  }

  /** @returns {number} norma infinito: máxima suma absoluta de fila */
  infinityNorm() {
    let max = 0;
    for (let i = 0; i < this.rows; i++) {
      let sum = 0;
      for (let j = 0; j < this.cols; j++) sum += Math.abs(this.data[i][j]);
      max = Math.max(max, sum);
    }
    return max;
  }
}
