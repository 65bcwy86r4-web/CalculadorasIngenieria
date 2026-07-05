/**
 * matrix.js
 * ---------------------------------------------------------------------------
 * Clase Matrix: estructura de datos central de la calculadora.
 * Contiene operaciones algebraicas básicas (suma, resta, producto, potencia,
 * transposición) y utilidades de detección de propiedades (simetría,
 * triangularidad, diagonalidad) junto con normas matriciales.
 *
 * Todas las clases del proyecto operan sobre instancias de Matrix, por lo
 * que este archivo debe cargarse antes que cualquier otro módulo js/*.js.
 * ---------------------------------------------------------------------------
 */

class MatrixError extends Error {
  constructor(message) {
    super(message);
    this.name = "MatrixError";
  }
}

class Matrix {
  /**
   * @param {number} rows
   * @param {number} cols
   * @param {number[][]} [data] - si no se provee, se inicializa en ceros
   */
  constructor(rows, cols, data = null) {
    this.rows = rows;
    this.cols = cols;
    if (data) {
      this.data = data.map((row) => row.slice());
    } else {
      this.data = Array.from({ length: rows }, () => new Array(cols).fill(0));
    }
  }

  /* ------------------------- Constructores estáticos ------------------------- */

  static fromArray(arr) {
    const rows = arr.length;
    const cols = arr[0] ? arr[0].length : 0;
    return new Matrix(rows, cols, arr);
  }

  static identity(n) {
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) m.data[i][i] = 1;
    return m;
  }

  static zeros(rows, cols) {
    return new Matrix(rows, cols);
  }

  static diagonal(values) {
    const n = values.length;
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) m.data[i][i] = values[i];
    return m;
  }

  /* ------------------------------- Utilidades -------------------------------- */

  clone() {
    return new Matrix(this.rows, this.cols, this.data);
  }

  isSquare() {
    return this.rows === this.cols;
  }

  get(i, j) {
    return this.data[i][j];
  }

  set(i, j, v) {
    this.data[i][j] = v;
  }

  /** Compara si otra matriz es dimensionalmente compatible para suma/resta */
  sameSizeAs(other) {
    return this.rows === other.rows && this.cols === other.cols;
  }

  /* ------------------------------ Operaciones -------------------------------- */

  add(other) {
    if (!this.sameSizeAs(other)) {
      throw new MatrixError(
        `No se pueden sumar matrices de tamaños distintos (${this.rows}x${this.cols} y ${other.rows}x${other.cols}).`
      );
    }
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        result.data[i][j] = this.data[i][j] + other.data[i][j];
    return result;
  }

  subtract(other) {
    if (!this.sameSizeAs(other)) {
      throw new MatrixError(
        `No se pueden restar matrices de tamaños distintos (${this.rows}x${this.cols} y ${other.rows}x${other.cols}).`
      );
    }
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        result.data[i][j] = this.data[i][j] - other.data[i][j];
    return result;
  }

  scalarMultiply(k) {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++) result.data[i][j] = this.data[i][j] * k;
    return result;
  }

  multiply(other) {
    if (this.cols !== other.rows) {
      throw new MatrixError(
        `Producto no definido: la matriz A es ${this.rows}x${this.cols} y B es ${other.rows}x${other.cols}. Las columnas de A deben ser igual a las filas de B.`
      );
    }
    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) sum += this.data[i][k] * other.data[k][j];
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  transpose() {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++) result.data[j][i] = this.data[i][j];
    return result;
  }

  power(n) {
    if (!this.isSquare()) throw new MatrixError("Solo se pueden potenciar matrices cuadradas.");
    if (!Number.isInteger(n) || n < 0)
      throw new MatrixError("El exponente debe ser un entero no negativo.");
    let result = Matrix.identity(this.rows);
    for (let i = 0; i < n; i++) result = result.multiply(this);
    return result;
  }

  trace() {
    if (!this.isSquare()) throw new MatrixError("La traza solo está definida para matrices cuadradas.");
    let sum = 0;
    for (let i = 0; i < this.rows; i++) sum += this.data[i][i];
    return sum;
  }

  /* --------------------------- Detección de propiedades ----------------------- */

  isSymmetric(tol = 1e-9) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = i + 1; j < this.cols; j++)
        if (Math.abs(this.data[i][j] - this.data[j][i]) > tol) return false;
    return true;
  }

  isDiagonal(tol = 1e-9) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        if (i !== j && Math.abs(this.data[i][j]) > tol) return false;
    return true;
  }

  isUpperTriangular(tol = 1e-9) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < i; j++)
        if (Math.abs(this.data[i][j]) > tol) return false;
    return true;
  }

  isLowerTriangular(tol = 1e-9) {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++)
      for (let j = i + 1; j < this.cols; j++)
        if (Math.abs(this.data[i][j]) > tol) return false;
    return true;
  }

  /** Norma de Frobenius: raíz de la suma de cuadrados de todos los elementos */
  frobeniusNorm() {
    let sum = 0;
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++) sum += this.data[i][j] * this.data[i][j];
    return Math.sqrt(sum);
  }

  /** Norma infinito: máxima suma absoluta de fila */
  infinityNorm() {
    let max = 0;
    for (let i = 0; i < this.rows; i++) {
      let sum = 0;
      for (let j = 0; j < this.cols; j++) sum += Math.abs(this.data[i][j]);
      max = Math.max(max, sum);
    }
    return max;
  }

  /* --------------------------------- Formato ---------------------------------- */

  /** Redondea valores muy cercanos a enteros para una presentación más limpia */
  static fmt(v, decimals = 4) {
    if (Math.abs(v) < 1e-10) v = 0;
    const rounded = Number(v.toFixed(decimals));
    return rounded;
  }

  toArray() {
    return this.data.map((row) => row.slice());
  }
}

// Namespace global (no se usan módulos ES para poder ejecutar vía file://)
window.MatrixLib = { Matrix, MatrixError };
