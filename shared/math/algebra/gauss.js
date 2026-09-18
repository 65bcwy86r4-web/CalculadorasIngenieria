/**
 * algebra/gauss.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: eliminación de Gauss y Gauss-Jordan genéricas,
 * con seguimiento de pasos (pivoteo, intercambios, combinaciones), y las
 * operaciones que se derivan directamente de ellas: rango y resolución de
 * sistemas lineales Ax = b.
 *
 * Este es el módulo más reutilizado del motor: determinant.js, inverse.js,
 * eigen.js (autovectores) e interpolation/spline.js (sistema tridiagonal)
 * lo consumen en vez de reimplementar su propia eliminación.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { DimensionError } from '../errors/dimension-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Lleva una matriz a forma escalonada por filas usando pivoteo parcial
 * (se elige, en cada columna, la fila con mayor valor absoluto desde la
 * fila de pivote actual hacia abajo) para mayor estabilidad numérica.
 *
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - por debajo de este valor absoluto, un elemento se considera 0
 * @returns {{ result: Matrix, steps: Array<Object>, swapCount: number, pivots: Array<{row:number, col:number, value:number}> }}
 * @example
 * const { result, pivots } = rowEchelon(new Matrix([[2,1],[4,3]]));
 */
export function rowEchelon(matrix, tolerance = DEFAULT_TOLERANCE) {
  const m = matrix.clone();
  const steps = [];
  let swapCount = 0;
  const pivots = [];
  let pivotRow = 0;

  for (let col = 0; col < m.cols && pivotRow < m.rows; col++) {
    let maxRow = pivotRow;
    for (let r = pivotRow + 1; r < m.rows; r++) {
      if (Math.abs(m.data[r][col]) > Math.abs(m.data[maxRow][col])) maxRow = r;
    }
    if (Math.abs(m.data[maxRow][col]) < tolerance) {
      steps.push({ type: 'info', text: `Columna ${col + 1}: no hay pivote no nulo desde la fila ${pivotRow + 1}; se continúa con la siguiente columna.` });
      continue;
    }
    if (maxRow !== pivotRow) {
      [m.data[pivotRow], m.data[maxRow]] = [m.data[maxRow], m.data[pivotRow]];
      swapCount++;
      steps.push({ type: 'swap', text: `Intercambio F${pivotRow + 1} ↔ F${maxRow + 1} (pivoteo parcial).`, snapshot: m.toArray() });
    }
    const pivotVal = m.data[pivotRow][col];
    pivots.push({ row: pivotRow, col, value: pivotVal });
    for (let r = pivotRow + 1; r < m.rows; r++) {
      const factor = m.data[r][col] / pivotVal;
      if (Math.abs(factor) < tolerance) continue;
      for (let c = 0; c < m.cols; c++) m.data[r][c] -= factor * m.data[pivotRow][c];
      steps.push({ type: 'elim', text: `F${r + 1} → F${r + 1} − (${factor.toFixed(4)})·F${pivotRow + 1}`, snapshot: m.toArray() });
    }
    pivotRow++;
  }
  return { result: m, steps, swapCount, pivots };
}

/**
 * Forma escalonada reducida (Gauss-Jordan): además de triangular, normaliza
 * cada pivote a 1 y elimina los elementos por encima de cada pivote.
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ result: Matrix, steps: Array<Object>, swapCount: number, pivots: Array<Object> }}
 * @example
 * reducedRowEchelon(new Matrix([[2,4],[1,1]]));
 */
export function reducedRowEchelon(matrix, tolerance = DEFAULT_TOLERANCE) {
  const first = rowEchelon(matrix, tolerance);
  const m = first.result;
  const steps = first.steps.slice();

  for (let p = first.pivots.length - 1; p >= 0; p--) {
    const { row, col } = first.pivots[p];
    const pivotVal = m.data[row][col];
    if (Math.abs(pivotVal - 1) > tolerance) {
      for (let c = 0; c < m.cols; c++) m.data[row][c] /= pivotVal;
      steps.push({ type: 'scale', text: `F${row + 1} → F${row + 1} / (${pivotVal.toFixed(4)})`, snapshot: m.toArray() });
    }
    for (let r = 0; r < row; r++) {
      const factor = m.data[r][col];
      if (Math.abs(factor) < tolerance) continue;
      for (let c = 0; c < m.cols; c++) m.data[r][c] -= factor * m.data[row][c];
      steps.push({ type: 'elim', text: `F${r + 1} → F${r + 1} − (${factor.toFixed(4)})·F${row + 1}`, snapshot: m.toArray() });
    }
  }
  return { result: m, steps, pivots: first.pivots, swapCount: first.swapCount };
}

/**
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ rank: number, echelon: Matrix, steps: Array<Object> }}
 * @example
 * rank(new Matrix([[1,2],[2,4]])).rank; // 1
 */
export function rank(matrix, tolerance = DEFAULT_TOLERANCE) {
  const { result, pivots, steps } = rowEchelon(matrix, tolerance);
  return { rank: pivots.length, echelon: result, steps };
}

/**
 * Resuelve Ax = b mediante Gauss-Jordan sobre la matriz aumentada [A|b].
 * A diferencia de la mayoría de las funciones del motor, esta función NO
 * lanza una excepción cuando el sistema no tiene solución única: un
 * sistema incompatible o con infinitas soluciones es un resultado
 * matemático válido, no un error de uso, así que se devuelve un objeto
 * con `type` discriminado para que el llamador decida qué hacer.
 * Sí se lanza DimensionError si A y b son incompatibles en tamaño, porque
 * eso sí es un error de uso (los arreglos no representan el mismo sistema).
 *
 * @param {Matrix} A - matriz de coeficientes (n×n o m×n)
 * @param {number[]} b - vector de términos independientes (largo = A.rows)
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ type: 'unique', solution: number[], steps: Array, rref: Matrix }
 *         | { type: 'infinite', message: string, steps: Array, rref: Matrix }
 *         | { type: 'incompatible', message: string, steps: Array }}
 * @throws {DimensionError} si b.length !== A.rows
 * @example
 * solveSystem(new Matrix([[2,1],[1,3]]), [8, 13]);
 * // { type: 'unique', solution: [3.4, 3.2], ... } (aprox.)
 */
export function solveSystem(A, b, tolerance = DEFAULT_TOLERANCE) {
  if (!Array.isArray(b) || b.length !== A.rows) {
    throw new DimensionError(`El vector "b" (largo ${Array.isArray(b) ? b.length : 'inválido'}) debe tener la misma cantidad de filas que A (${A.rows}).`, { rowsA: A.rows, lengthB: Array.isArray(b) ? b.length : null });
  }
  const augmentedData = A.data.map((row, i) => row.concat([b[i]]));
  const augmented = new Matrix(augmentedData);

  const rrefResult = reducedRowEchelon(augmented, tolerance);
  const rankA = rank(A, tolerance).rank;
  const rankAug = rrefResult.pivots.length;
  const n = A.cols;

  if (rankA < rankAug) {
    return {
      type: 'incompatible',
      message: 'El sistema es incompatible (no tiene solución): el rango de A es menor que el rango de la matriz ampliada [A|b].',
      steps: rrefResult.steps,
      rankA,
      rankAug,
    };
  }
  if (rankA < n) {
    return {
      type: 'infinite',
      message: `El sistema es compatible indeterminado: tiene infinitas soluciones (rango = ${rankA} < ${n} incógnitas).`,
      steps: rrefResult.steps,
      rref: rrefResult.result,
      rankA,
      rankAug,
    };
  }
  const solution = rrefResult.result.data.map((row) => row[row.length - 1]);
  return { type: 'unique', solution, steps: rrefResult.steps, rref: rrefResult.result, rankA, rankAug };
}
