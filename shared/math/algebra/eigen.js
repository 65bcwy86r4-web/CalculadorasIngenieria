/**
 * algebra/eigen.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: autovalores, autovectores y diagonalización.
 *
 * El cálculo de autovalores no usa un único algoritmo: despacha según el
 * tipo de matriz, porque no existe un método que sea simultáneamente el
 * más exacto y el más general (ADR-004).
 *
 *   | Caso                        | Método                                  |
 *   |-----------------------------|-----------------------------------------|
 *   | 1x1                         | trivial (el único elemento)             |
 *   | simétrica de cualquier orden| rotaciones de Jacobi                    |
 *   | 2x2 no simétrica            | polinomio característico (forma cerrada)|
 *   | general                     | QR iterativo sin desplazamiento         |
 *
 * Por qué el despacho y no solo QR: la iteración QR sin desplazamiento no
 * converge cuando dos autovalores tienen el mismo módulo y signo opuesto
 * —el caso de un tensor de corte puro, con autovalores ±τ—. En esas
 * matrices devolvía ceros y los señalaba como complejos, siendo que toda
 * matriz simétrica real tiene autovalores reales por el teorema espectral
 * (hallazgo H-03, y H-04 como consecuencia en vonMisesStress).
 *
 * Jacobi no tiene ese problema: aniquila de a un par de elementos fuera de
 * la diagonal por rotación ortogonal, y para matrices simétricas converge
 * siempre. El caso 2x2 se resuelve exacto por la fórmula cuadrática, que es
 * además el que un estudiante verifica a mano.
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-12 (despacho por tipo: 2026-09-13)
 * Dependencias: ./matrix.js, ./qr.js, ./gauss.js, ./inverse.js,
 *   ../validation/matrix.js, ../errors/MathError.js, ../utils/constants.js
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { qrDecomposition } from './qr.js';
import { reducedRowEchelon } from './gauss.js';
import { inverse } from './inverse.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/MathError.js';
import {
  DEFAULT_QR_ITERATIONS,
  DEFAULT_MAX_ITERATIONS,
  DEFAULT_TOLERANCE,
} from '../utils/constants.js';

/** Cantidad de barridos de Jacobi antes de darse por no convergido. */
const JACOBI_MAX_ROTATIONS = DEFAULT_MAX_ITERATIONS * 10;

/** Umbral del elemento subdiagonal por debajo del cual se considera nulo. */
const SUBDIAGONAL_THRESHOLD = 1e-4;

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

/**
 * Iteración QR sin desplazamiento: Aₖ = QₖRₖ, Aₖ₊₁ = RₖQₖ.
 * @param {Matrix} matrix
 * @param {number} iterations
 * @returns {Matrix} la matriz semejante a A tras `iterations` pasos
 */
function qrIteration(matrix, iterations) {
  let current = matrix.clone();
  for (let it = 0; it < iterations; it++) {
    const { Q, R } = qrDecomposition(current);
    current = R.multiply(Q);
  }
  return current;
}

/* ---------------------------------- Públicas ---------------------------------- */

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
 * @param {Matrix} matrix - matriz simétrica
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - umbral bajo el cual el mayor
 *   elemento fuera de la diagonal se considera nulo
 * @param {number} [maxRotations=JACOBI_MAX_ROTATIONS] - tope de rotaciones
 * @returns {{ values: number[], vectors: number[][], rotations: number, converged: boolean }}
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
  return { values, vectors, rotations, converged };
}

/**
 * Autovalores de una matriz 2x2 por su polinomio característico:
 * λ² − tr(A)·λ + det(A) = 0, de donde λ = (tr ± √(tr² − 4·det)) / 2.
 *
 * Es exacto —no iterativo—, y distingue el caso de raíces complejas
 * conjugadas, que el motor no puede representar todavía (deuda D5): en ese
 * caso `values` viene vacío y el par se informa por partes en `realPart` e
 * `imaginaryPart`.
 *
 * @param {Matrix} matrix - matriz de 2x2
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - margen con el que un
 *   discriminante levemente negativo se trata como raíz doble real
 * @returns {{ values: number[], hasComplexPair: boolean, realPart: number, imaginaryPart: number }}
 *   `values` de mayor a menor si las raíces son reales, vacío si son complejas
 * @throws {DimensionError} si la matriz no es cuadrada
 * @throws {MathError} code 'NOT_2X2' si la matriz no es de 2x2
 * @example
 * eigenvalues2x2(new Matrix([[0, 1], [1, 0]])).values; // [1, -1]
 * @example
 * // Rotación de 90°: autovalores ±i, sin parte real.
 * const giro = eigenvalues2x2(new Matrix([[0, -1], [1, 0]]));
 * giro.hasComplexPair; // true
 * giro.imaginaryPart;  // 1
 */
export function eigenvalues2x2(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  if (matrix.rows !== 2) {
    throw new MathError(
      'La forma cerrada de autovalores requiere una matriz de 2x2.',
      'NOT_2X2',
      { size: matrix.rows },
    );
  }

  const [[a, b], [c, d]] = matrix.data;
  const trace = a + d;
  const determinant = a * d - b * c;
  const discriminant = trace * trace - 4 * determinant;
  const realPart = trace / 2;

  if (discriminant < -tolerance) {
    return {
      values: [],
      hasComplexPair: true,
      realPart,
      imaginaryPart: Math.sqrt(-discriminant) / 2,
    };
  }

  const root = Math.sqrt(Math.max(0, discriminant)) / 2;
  return {
    values: [realPart + root, realPart - root],
    hasComplexPair: false,
    realPart,
    imaginaryPart: 0,
  };
}

/**
 * Autovalores reales de una matriz cuadrada. Despacha al método adecuado
 * según el tipo de matriz (ver la tabla del encabezado del archivo);
 * `iterations` solo afecta al camino QR, que es el de las matrices
 * generales no simétricas de orden mayor que 2.
 *
 * `matrixT` es la matriz semejante a A que produjo el método elegido —
 * diagonal en Jacobi, la iterada Aₖ en QR— y `hasComplexHint` avisa que el
 * espectro puede tener pares complejos conjugados, que el motor no
 * representa todavía (deuda D5). Para una matriz simétrica es siempre
 * `false`: el teorema espectral garantiza autovalores reales.
 *
 * @param {Matrix} matrix
 * @param {number} [iterations=DEFAULT_QR_ITERATIONS] - pasos de la iteración QR
 * @returns {{ values: number[], matrixT: Matrix, hasComplexHint: boolean }}
 *   autovalores de mayor a menor
 * @throws {DimensionError} si la matriz no es cuadrada
 * @example
 * eigenvaluesQR(new Matrix([[2, 1], [1, 2]])).values; // [3, 1]
 * @example
 * // Simétrica con autovalores de igual módulo: resuelta por Jacobi.
 * eigenvaluesQR(new Matrix([[0, 50], [50, 0]])).values; // [50, -50]
 */
export function eigenvaluesQR(matrix, iterations = DEFAULT_QR_ITERATIONS) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;

  if (n === 1) {
    return { values: [matrix.data[0][0]], matrixT: matrix.clone(), hasComplexHint: false };
  }

  if (matrix.isSymmetric()) {
    const { values } = jacobiEigenDecomposition(matrix);
    return { values, matrixT: Matrix.diagonal(values), hasComplexHint: false };
  }

  const matrixT = qrIteration(matrix, iterations);

  if (n === 2) {
    const { values, hasComplexPair } = eigenvalues2x2(matrix);
    return {
      values: hasComplexPair ? matrixT.data.map((row, i) => row[i]) : values,
      matrixT,
      hasComplexHint: hasComplexPair,
    };
  }

  const values = [];
  for (let i = 0; i < n; i++) values.push(matrixT.data[i][i]);
  let hasComplexHint = false;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(matrixT.data[i + 1][i]) > SUBDIAGONAL_THRESHOLD) hasComplexHint = true;
  }

  values.sort((a, b) => b - a);
  return { values, matrixT, hasComplexHint };
}

/**
 * Autovector asociado a un autovalor lambda: resuelve el sistema
 * homogéneo (A − λI)v = 0 mediante Gauss-Jordan sobre su núcleo.
 * @param {Matrix} matrix
 * @param {number} lambda
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {number[]|null} vector normalizado, o null si no se pudo aislar una variable libre
 * @example
 * eigenvectorFor(new Matrix([[2,1],[1,2]]), 3); // [0.7071, 0.7071] (aprox.)
 */
export function eigenvectorFor(matrix, lambda, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const shifted = matrix.subtract(Matrix.identity(n).scalarMultiply(lambda));
  const { result, pivots } = reducedRowEchelon(shifted, tolerance);

  const pivotCols = new Set(pivots.map((p) => p.col));
  const freeCols = [];
  for (let c = 0; c < n; c++) if (!pivotCols.has(c)) freeCols.push(c);
  if (freeCols.length === 0) return null;

  const freeCol = freeCols[0];
  const vector = new Array(n).fill(0);
  vector[freeCol] = 1;
  for (const { row, col } of pivots) vector[col] = -result.data[row][freeCol];

  let sumSq = 0;
  for (const v of vector) sumSq += v * v;
  const mag = Math.sqrt(sumSq) || 1;
  return vector.map((v) => v / mag);
}

/**
 * @param {Matrix} matrix
 * @param {number[]} eigenvalues
 * @returns {Array<{ lambda: number, vector: number[]|null }>}
 * @example
 * eigenvectors(new Matrix([[2,1],[1,2]]), [3, 1]);
 */
export function eigenvectors(matrix, eigenvalues) {
  return eigenvalues.map((lambda) => ({ lambda, vector: eigenvectorFor(matrix, lambda) }));
}

/**
 * Diagonalización A = P·D·P⁻¹: P se construye con los autovectores como
 * columnas y D con los autovalores correspondientes en la diagonal.
 * @param {Matrix} matrix
 * @returns {{ P: Matrix, D: Matrix, Pinv: Matrix }}
 * @throws {MathError} code 'NOT_DIAGONALIZABLE' si P resulta singular
 * @example
 * const { P, D, Pinv } = diagonalize(new Matrix([[2,1],[1,2]]));
 */
export function diagonalize(matrix) {
  const { values } = eigenvaluesQR(matrix);
  const pairs = eigenvectors(matrix, values);
  const n = matrix.rows;

  const P = Matrix.zeros(n, n);
  for (let j = 0; j < n; j++) {
    const v = pairs[j].vector;
    if (!v) throw new MathError('No se pudo construir un autovector completo; la matriz podría no ser diagonalizable.', 'NOT_DIAGONALIZABLE', { lambda: pairs[j].lambda });
    for (let i = 0; i < n; i++) P.data[i][j] = v[i];
  }

  let invResult;
  try {
    invResult = inverse(P);
  } catch (e) {
    throw new MathError('La matriz de autovectores es singular: A no es diagonalizable (autovectores linealmente dependientes).', 'NOT_DIAGONALIZABLE', { cause: e.message });
  }

  return { P, D: Matrix.diagonal(values), Pinv: invResult.inverse };
}
