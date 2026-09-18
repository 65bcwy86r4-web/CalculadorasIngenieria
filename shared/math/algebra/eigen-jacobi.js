/**
 * algebra/eigen-jacobi.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: autovalores y autovectores de matrices simétricas
 * reales por el método de rotaciones de Jacobi.
 *
 * Es uno de los tres métodos de autovalores del motor. La entrada que elige
 * entre ellos según el tipo de matriz es `eigenvalues`, en eigen.js; este
 * archivo expone el método explícito, para cuando se lo quiere pedir por su
 * nombre (ADR-005).
 *
 * Por qué Jacobi existe además del QR: la iteración QR sin desplazamiento no
 * converge cuando dos autovalores tienen el mismo módulo —el caso de un
 * tensor de corte puro, con autovalores ±τ—. Jacobi no tiene esa
 * limitación, porque no separa subespacios por dominancia sino que aniquila
 * elementos concretos.
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-13 (portado desde legacy/motor-v1/ por ADR-004;
 *   extraído de eigen.js por ADR-007 §3.5)
 * Dependencias: ./matrix.js, ../validation/matrix.js, ../errors/math-error.js,
 *   ../utils/constants.js
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_MAX_ITERATIONS, DEFAULT_TOLERANCE } from '../utils/constants.js';

/** Cantidad de rotaciones de Jacobi antes de darse por no convergido. */
const JACOBI_MAX_ROTATIONS = DEFAULT_MAX_ITERATIONS * 10;

/* --------------------------------- Privadas --------------------------------- */

/**
 * Ubica el elemento fuera de la diagonal de mayor valor absoluto en el
 * triángulo superior. Es el que Jacobi elige aniquilar en cada rotación
 * (estrategia clásica: siempre el mayor, no un barrido cíclico).
 * @param {number[][]} data
 * @returns {{ p: number, q: number, magnitude: number }}
 */
function largestOffDiagonal(data) {
  let p = 0;
  let q = 1;
  let magnitude = 0;
  for (let row = 0; row < data.length; row++) {
    for (let col = row + 1; col < data.length; col++) {
      const value = Math.abs(data[row][col]);
      if (value > magnitude) {
        magnitude = value;
        p = row;
        q = col;
      }
    }
  }
  return { p, q, magnitude };
}

/**
 * Aplica in situ una rotación de Jacobi que anula el elemento (p, q) de
 * `data`, y acumula la misma rotación en `basis` para ir construyendo la
 * matriz de autovectores.
 * @param {number[][]} data - matriz simétrica en curso de diagonalización
 * @param {number[][]} basis - acumulador ortogonal (arranca en la identidad)
 * @param {number} p
 * @param {number} q
 * @returns {void}
 */
function applyJacobiRotation(data, basis, p, q) {
  const n = data.length;
  const app = data[p][p];
  const aqq = data[q][q];
  const apq = data[p][q];
  const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  for (let i = 0; i < n; i++) {
    if (i === p || i === q) continue;
    const aip = data[i][p];
    const aiq = data[i][q];
    data[i][p] = c * aip - s * aiq;
    data[p][i] = data[i][p];
    data[i][q] = s * aip + c * aiq;
    data[q][i] = data[i][q];
  }

  data[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
  data[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
  // Se fuerza a cero en vez de recalcularlo: la rotación lo anula por
  // construcción y el residuo sería solo ruido de punto flotante.
  data[p][q] = 0;
  data[q][p] = 0;

  for (let i = 0; i < n; i++) {
    const vip = basis[i][p];
    const viq = basis[i][q];
    basis[i][p] = c * vip - s * viq;
    basis[i][q] = s * vip + c * viq;
  }
}

/**
 * Ordena autovalores de mayor a menor arrastrando sus autovectores.
 * @param {number[]} values
 * @param {number[][]} vectors
 * @returns {{ values: number[], vectors: number[][] }}
 */
function sortEigenpairs(values, vectors) {
  const pairs = values
    .map((value, index) => ({ value, vector: vectors[index] }))
    .sort((a, b) => b.value - a.value);
  return {
    values: pairs.map((pair) => pair.value),
    vectors: pairs.map((pair) => pair.vector),
  };
}

/**
 * Columna `index` de `basis`, normalizada a norma 1.
 * @param {number[][]} basis
 * @param {number} index
 * @returns {number[]}
 */
function normalizedColumn(basis, index) {
  const column = basis.map((row) => row[index]);
  let sumOfSquares = 0;
  for (const value of column) sumOfSquares += value * value;
  const norm = Math.sqrt(sumOfSquares) || 1;
  return column.map((value) => value / norm);
}

/* ---------------------------------- Pública ---------------------------------- */

/**
 * Autovalores y autovectores de una matriz simétrica real por el método de
 * rotaciones de Jacobi: se aplica una sucesión de rotaciones ortogonales
 * que anulan de a un par de elementos fuera de la diagonal, hasta que la
 * matriz queda diagonal. Al ser una sucesión de transformaciones de
 * semejanza ortogonales, los autovalores se preservan exactamente y los
 * autovectores salen acumulados en la base.
 *
 * Converge siempre para matrices simétricas, incluso con autovalores
 * repetidos o de igual módulo, que es donde la iteración QR sin
 * desplazamiento falla.
 *
 * `steps` viene vacío: el procedimiento rotación por rotación es el Paso
 * 2c-2 (ADR-007 §4). La clave existe desde ya para que la interfaz pueda
 * escribirse contra el contrato definitivo.
 *
 * @param {Matrix} matrix - matriz simétrica
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - umbral bajo el cual el mayor
 *   elemento fuera de la diagonal se considera nulo
 * @param {number} [maxRotations=JACOBI_MAX_ROTATIONS] - tope de rotaciones
 * @returns {{ values: number[], vectors: number[][], rotations: number, converged: boolean, steps: Array<Object> }}
 *   autovalores de mayor a menor y sus autovectores normalizados, en el mismo orden
 * @throws {DimensionError} si la matriz no es cuadrada
 * @throws {MathError} code 'NOT_SYMMETRIC' si la matriz no es simétrica
 * @example
 * jacobiEigenDecomposition(new Matrix([[2, 1], [1, 2]])).values; // [3, 1]
 * @example
 * // Corte puro: autovalores exactamente ±τ, donde el QR sin shift fallaba.
 * jacobiEigenDecomposition(new Matrix([[0, 50], [50, 0]])).values; // [50, -50]
 */
export function jacobiEigenDecomposition(
  matrix,
  tolerance = DEFAULT_TOLERANCE,
  maxRotations = JACOBI_MAX_ROTATIONS,
) {
  assertSquareMatrix(matrix, 'matrix');
  if (!matrix.isSymmetric(tolerance)) {
    throw new MathError(
      'El método de Jacobi requiere una matriz simétrica.',
      'NOT_SYMMETRIC',
      { size: matrix.rows },
    );
  }

  const n = matrix.rows;
  const data = matrix.data.map((row) => [...row]);
  const basis = Matrix.identity(n).data;
  const steps = [];
  let rotations = 0;
  let converged = false;

  while (rotations < maxRotations) {
    const { p, q, magnitude } = largestOffDiagonal(data);
    if (n === 1 || magnitude <= tolerance) {
      converged = true;
      break;
    }
    applyJacobiRotation(data, basis, p, q);
    rotations++;
  }

  const rawValues = data.map((row, i) => row[i]);
  const rawVectors = rawValues.map((_, index) => normalizedColumn(basis, index));
  const { values, vectors } = sortEigenpairs(rawValues, rawVectors);
  return { values, vectors, rotations, converged, steps };
}
