import { MathError } from "../errors/MathError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_MAX_ITERATIONS, DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateSquareMatrix } from "../validation/matrix.js";
import { cloneMatrix, identity, isSymmetric, multiplyMatrices, zeros } from "./matrix.js";
import { reducedRowEchelon } from "./gauss.js";

function normalizeVector(vector, tolerance) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (isNearlyZero(norm, tolerance)) {
    throw new MathError("Cannot normalize a zero eigenvector");
  }
  return vector.map((value) => cleanNumber(value / norm));
}

function offDiagonalNorm(matrix) {
  let sum = 0;
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix.length; col++) {
      if (row !== col) sum += matrix[row][col] * matrix[row][col];
    }
  }
  return Math.sqrt(sum);
}

function sortedEigenpairs(values, vectors) {
  return values
    .map((value, index) => ({ value, vector: vectors[index] }))
    .sort((a, b) => {
      const left = typeof a.value === "number" ? a.value : a.value.re;
      const right = typeof b.value === "number" ? b.value : b.value.re;
      return right - left;
    });
}

/**
 * Computes eigenvalues and eigenvectors of a real symmetric matrix using the
 * Jacobi rotation method.
 *
 * @param {number[][]} matrix Symmetric square matrix.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Numeric options.
 * @returns {{values:number[], vectors:number[][], iterations:number, converged:boolean, method:string}}
 *
 * @example
 * jacobiEigenDecomposition([[2, 1], [1, 2]]).values; // [3, 1]
 */
export function jacobiEigenDecomposition(matrix, options = {}) {
  const {
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS * 10,
  } = options;
  validateSquareMatrix(matrix);
  if (!isSymmetric(matrix, tolerance)) {
    throw new MathError("Jacobi eigen decomposition requires a symmetric matrix");
  }

  const n = matrix.length;
  const working = cloneMatrix(matrix);
  const vectorsMatrix = identity(n);
  let iterations = 0;
  let converged = false;

  for (; iterations < maxIterations; iterations++) {
    let p = 0;
    let q = 1;
    let max = 0;

    for (let row = 0; row < n; row++) {
      for (let col = row + 1; col < n; col++) {
        const value = Math.abs(working[row][col]);
        if (value > max) {
          max = value;
          p = row;
          q = col;
        }
      }
    }

    if (max <= tolerance || n === 1) {
      converged = true;
      break;
    }

    const app = working[p][p];
    const aqq = working[q][q];
    const apq = working[p][q];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    for (let index = 0; index < n; index++) {
      if (index !== p && index !== q) {
        const aip = working[index][p];
        const aiq = working[index][q];
        working[index][p] = cleanNumber(c * aip - s * aiq);
        working[p][index] = working[index][p];
        working[index][q] = cleanNumber(s * aip + c * aiq);
        working[q][index] = working[index][q];
      }
    }

    working[p][p] = cleanNumber(c * c * app - 2 * s * c * apq + s * s * aqq);
    working[q][q] = cleanNumber(s * s * app + 2 * s * c * apq + c * c * aqq);
    working[p][q] = 0;
    working[q][p] = 0;

    for (let row = 0; row < n; row++) {
      const vip = vectorsMatrix[row][p];
      const viq = vectorsMatrix[row][q];
      vectorsMatrix[row][p] = cleanNumber(c * vip - s * viq);
      vectorsMatrix[row][q] = cleanNumber(s * vip + c * viq);
    }
  }

  const values = working.map((row, index) => cleanNumber(row[index]));
  const vectors = values.map((_, col) =>
    normalizeVector(vectorsMatrix.map((row) => row[col]), tolerance),
  );
  const pairs = sortedEigenpairs(values, vectors);

  return {
    values: pairs.map((pair) => pair.value),
    vectors: pairs.map((pair) => pair.vector),
    iterations,
    converged,
    method: "jacobi",
  };
}

/**
 * Computes eigenvalues of a 2x2 matrix using the characteristic polynomial.
 *
 * @param {number[][]} matrix 2x2 matrix.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {Array<number|{re:number,im:number}>} Eigenvalues.
 *
 * @example
 * eigenvalues2x2([[2, 0], [0, 3]]); // [3, 2]
 */
export function eigenvalues2x2(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  if (matrix.length !== 2) {
    throw new MathError("Closed-form 2x2 eigenvalues require a 2x2 matrix");
  }

  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][0];
  const d = matrix[1][1];
  const tr = a + d;
  const det = a * d - b * c;
  const discriminant = tr * tr - 4 * det;

  if (discriminant >= -tolerance) {
    const root = Math.sqrt(Math.max(0, discriminant));
    return [cleanNumber((tr + root) / 2), cleanNumber((tr - root) / 2)].sort((x, y) => y - x);
  }

  const real = cleanNumber(tr / 2);
  const imaginary = cleanNumber(Math.sqrt(-discriminant) / 2);
  return [
    { re: real, im: imaginary },
    { re: real, im: -imaginary },
  ];
}

function householderQR(matrix, tolerance) {
  const n = matrix.length;
  const R = cloneMatrix(matrix);
  const Q = identity(n);

  for (let k = 0; k < n - 1; k++) {
    const x = [];
    for (let row = k; row < n; row++) {
      x.push(R[row][k]);
    }
    const normX = Math.sqrt(x.reduce((sum, value) => sum + value * value, 0));
    if (isNearlyZero(normX, tolerance)) {
      continue;
    }

    const alpha = x[0] >= 0 ? -normX : normX;
    const u = [...x];
    u[0] -= alpha;
    const normU = Math.sqrt(u.reduce((sum, value) => sum + value * value, 0));
    if (isNearlyZero(normU, tolerance)) {
      continue;
    }
    const v = u.map((value) => value / normU);

    for (let col = k; col < n; col++) {
      let projection = 0;
      for (let index = 0; index < v.length; index++) {
        projection += v[index] * R[k + index][col];
      }
      for (let index = 0; index < v.length; index++) {
        R[k + index][col] = cleanNumber(R[k + index][col] - 2 * v[index] * projection);
      }
    }

    for (let row = 0; row < n; row++) {
      let projection = 0;
      for (let index = 0; index < v.length; index++) {
        projection += Q[row][k + index] * v[index];
      }
      for (let index = 0; index < v.length; index++) {
        Q[row][k + index] = cleanNumber(Q[row][k + index] - 2 * projection * v[index]);
      }
    }
  }

  return { Q, R };
}

/**
 * Estimates real eigenvalues with unshifted QR iteration.
 * For non-symmetric matrices with complex pairs, prefer the 2x2 closed form
 * or a domain-specific complex solver.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Numeric options.
 * @returns {{values:number[], iterations:number, converged:boolean, method:string}}
 *
 * @example
 * qrEigenvalues([[2, 0], [0, 3]]).values; // [3, 2]
 */
export function qrEigenvalues(matrix, options = {}) {
  const {
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS * 20,
  } = options;
  validateSquareMatrix(matrix);

  let working = cloneMatrix(matrix);
  let iterations = 0;
  let converged = false;

  for (; iterations < maxIterations; iterations++) {
    if (offDiagonalNorm(working) <= tolerance) {
      converged = true;
      break;
    }
    const { Q, R } = householderQR(working, tolerance);
    working = multiplyMatrices(R, Q);
  }

  const values = working.map((row, index) => cleanNumber(row[index])).sort((a, b) => b - a);
  return { values, iterations, converged, method: "qr" };
}

/**
 * Computes a real eigenvector for a real eigenvalue by solving
 * (A - lambda I)v = 0.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {number} eigenvalue Real eigenvalue.
 * @param {{tolerance?:number}} [options] Numeric options.
 * @returns {number[]} Normalized eigenvector.
 *
 * @example
 * eigenvectorForEigenvalue([[2, 0], [0, 3]], 3); // [0, 1]
 */
export function eigenvectorForEigenvalue(matrix, eigenvalue, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  if (typeof eigenvalue !== "number" || !Number.isFinite(eigenvalue)) {
    throw new MathError("Eigenvector computation requires a real finite eigenvalue", {
      eigenvalue,
    });
  }

  const n = matrix.length;
  const shifted = zeros(n, n);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      shifted[row][col] = matrix[row][col] - (row === col ? eigenvalue : 0);
    }
  }

  const rref = reducedRowEchelon(shifted, { tolerance });
  const pivotColumns = new Set(
    rref.pivots.filter((pivot) => pivot.col < n).map((pivot) => pivot.col),
  );
  const freeColumns = [];
  for (let col = 0; col < n; col++) {
    if (!pivotColumns.has(col)) freeColumns.push(col);
  }

  if (freeColumns.length === 0) {
    throw new MathError("No free variable found for eigenvector", { eigenvalue });
  }

  const vector = new Array(n).fill(0);
  vector[freeColumns[freeColumns.length - 1]] = 1;

  for (let index = rref.pivots.length - 1; index >= 0; index--) {
    const { row, col } = rref.pivots[index];
    if (col >= n) continue;
    let sum = 0;
    for (let currentCol = col + 1; currentCol < n; currentCol++) {
      sum += rref.matrix[row][currentCol] * vector[currentCol];
    }
    vector[col] = cleanNumber(-sum);
  }

  return normalizeVector(vector, tolerance);
}

/**
 * Computes eigenvalues for supported real matrix families.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Numeric options.
 * @returns {Array<number|{re:number,im:number}>} Eigenvalues.
 *
 * @example
 * eigenvalues([[2, 1], [1, 2]]); // [3, 1]
 */
export function eigenvalues(matrix, options = {}) {
  return eigenDecomposition(matrix, options).values;
}

/**
 * Computes eigenvectors for real eigenvalues.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {number[]} [values] Optional real eigenvalues.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Numeric options.
 * @returns {number[][]} Eigenvectors as an array of vectors.
 *
 * @example
 * eigenvectors([[2, 0], [0, 3]]);
 */
export function eigenvectors(matrix, values = undefined, options = {}) {
  if (values === undefined) {
    return eigenDecomposition(matrix, options).vectors;
  }
  return values.map((value) => eigenvectorForEigenvalue(matrix, value, options));
}

/**
 * Computes an eigen decomposition for real matrices.
 *
 * @param {number[][]} matrix Square matrix.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Numeric options.
 * @returns {{values:Array<number|{re:number,im:number}>, vectors:number[][], iterations:number, converged:boolean, method:string}}
 *
 * @example
 * const result = eigenDecomposition([[2, 1], [1, 2]]);
 * result.values; // [3, 1]
 */
export function eigenDecomposition(matrix, options = {}) {
  const { tolerance = DEFAULT_TOLERANCE } = options;
  validateSquareMatrix(matrix);
  const n = matrix.length;

  if (n === 1) {
    return {
      values: [matrix[0][0]],
      vectors: [[1]],
      iterations: 0,
      converged: true,
      method: "scalar",
    };
  }

  if (isSymmetric(matrix, tolerance)) {
    return jacobiEigenDecomposition(matrix, options);
  }

  if (n === 2) {
    const values = eigenvalues2x2(matrix, options);
    const realValues = values.filter((value) => typeof value === "number");
    return {
      values,
      vectors: realValues.length === values.length
        ? realValues.map((value) => eigenvectorForEigenvalue(matrix, value, options))
        : [],
      iterations: 0,
      converged: true,
      method: "closed-form-2x2",
    };
  }

  const qr = qrEigenvalues(matrix, options);
  const vectors = qr.values.map((value) => eigenvectorForEigenvalue(matrix, value, options));
  return { ...qr, vectors };
}

export default Object.freeze({
  jacobiEigenDecomposition,
  eigenvalues2x2,
  qrEigenvalues,
  eigenvectorForEigenvalue,
  eigenvalues,
  eigenvectors,
  eigenDecomposition,
});
