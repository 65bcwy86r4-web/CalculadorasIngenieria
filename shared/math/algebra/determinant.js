/**
 * algebra/determinant.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: calcular el determinante de una matriz cuadrada.
 * Método principal: triangulación de Gauss (O(n³), reutiliza gauss.js).
 * Método secundario: expansión por cofactores (Laplace), ofrecido solo
 * como recurso teórico/didáctico para matrices pequeñas, ya que su costo
 * es O(n!) y se vuelve impracticable más allá de 7×7.
 * ---------------------------------------------------------------------------
 */

import { rowEchelon } from './gauss.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Determinante mediante triangulación de Gauss:
 * det(A) = (-1)^(cant. de intercambios) · producto de los pivotes.
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ value: number, steps: Array<Object>, swapCount: number }}
 * @throws {DimensionError} si la matriz no es cuadrada (vía assertSquareMatrix)
 * @example
 * determinantByGauss(new Matrix([[2,1],[1,3]])).value; // 5
 */
export function determinantByGauss(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  if (n === 1) {
    return { value: matrix.data[0][0], steps: [{ type: 'info', text: 'Matriz 1x1: el determinante es el único elemento.' }], swapCount: 0 };
  }
  const { result, steps, swapCount, pivots } = rowEchelon(matrix, tolerance);
  if (pivots.length < n) {
    steps.push({ type: 'info', text: 'Se obtuvo una columna sin pivote (fila de ceros): det(A) = 0.' });
    return { value: 0, steps, swapCount };
  }
  let product = 1;
  for (let i = 0; i < n; i++) product *= result.data[i][i];
  const sign = swapCount % 2 === 0 ? 1 : -1;
  const value = sign * product;
  steps.push({ type: 'final', text: `det(A) = ${sign === -1 ? '(-1)·' : ''}producto de la diagonal = ${value}` + (swapCount > 0 ? ` (${swapCount} intercambio(s) de fila)` : '') });
  return { value, steps, swapCount };
}

/**
 * Expansión por cofactores (recursiva), solo con fines teóricos/didácticos.
 * Limitada a n <= 7 por su complejidad O(n!); para matrices más grandes
 * usar determinantByGauss.
 *
 * **El procedimiento registra únicamente el primer nivel de la expansión.**
 * La función es recursiva, así que un trazado completo tendría O(n!) pasos —
 * miles para una 6x6— y sería ilegible además de caro. Lo que se muestra es
 * la fórmula de Laplace aplicada una vez sobre la primera fila: un paso
 * `expand` por término, con su menor como `snapshot` y el determinante de ese
 * menor ya resuelto en el texto. Es también el contenido didáctico real: lo
 * que se quiere ver es la definición en acción, no el árbol completo.
 *
 * @param {Matrix} matrix
 * @returns {{ value: number, steps: Array<Object> }}
 * @throws {DimensionError} si no es cuadrada
 * @throws {MathError} si n > 7 (code 'TOO_LARGE_FOR_COFACTORS')
 * @example
 * determinantByCofactors(new Matrix([[1,2],[3,4]])).value; // -2
 * @example
 * determinantByCofactors(new Matrix([[1,2,3],[4,5,6],[7,8,10]])).steps.length; // 5
 */
export function determinantByCofactors(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  if (matrix.rows > 7) {
    throw new MathError(
      'La expansión por cofactores solo está disponible como recurso teórico hasta 7x7 (su costo crece como n!). Usá determinantByGauss para matrices más grandes.',
      'TOO_LARGE_FOR_COFACTORS',
      { size: matrix.rows }
    );
  }
  return laplaceExpansion(matrix);
}

/**
 * Determinante por Laplace sobre la primera fila, con los pasos del primer
 * nivel de la expansión.
 *
 * El valor y los pasos salen de la misma pasada a propósito: calcular el
 * determinante por un lado y volver a expandir para narrarlo duplicaría un
 * algoritmo O(n!) solo para mostrarlo (`AI_RULES.md` §22). Los menores se
 * resuelven con `expand`, que es recursivo y no registra nada.
 *
 * @param {Matrix} matrix
 * @returns {{ value: number, steps: Array<Object> }}
 * @private
 */
function laplaceExpansion(matrix) {
  const n = matrix.rows;
  if (n === 1) {
    const only = matrix.data[0][0];
    return {
      value: only,
      steps: [{
        type: 'final',
        text: `El determinante de una matriz de 1x1 es su único elemento: det(A) = ${format(only)}`,
      }],
    };
  }

  const steps = [{
    type: 'info',
    text: `Se expande por la primera fila: det(A) = Σⱼ a₁ⱼ · (−1)^(1+j) · det(M₁ⱼ), con ${n} términos.`,
    snapshot: matrix.toArray(),
  }];

  const terms = [];
  let value = 0;
  for (let j = 0; j < n; j++) {
    const sign = j % 2 === 0 ? 1 : -1;
    const element = matrix.data[0][j];
    const minor = matrix.minor(0, j);
    const minorValue = expand(minor);
    const term = sign * element * minorValue;
    terms.push(term);
    value += term;
    steps.push({
      type: 'expand',
      text: `Término ${j + 1}: a₁${j + 1} · (${sign > 0 ? '+' : '−'}1) · det(M₁${j + 1}) = `
        + `${format(element)} · (${sign > 0 ? '+' : '−'}1) · ${format(minorValue)} = ${format(term)}`,
      snapshot: minor.toArray(),
    });
  }

  steps.push({
    type: 'final',
    text: `det(A) = ${terms.map(format).join(' + ').replace(/\+ -/g, '− ')} = ${format(value)}`,
  });
  return { value, steps };
}

/**
 * Formato de los números dentro del texto de un paso. Cuatro decimales, igual
 * que el resto del motor (gauss.js, lu.js).
 * @param {number} value
 * @returns {string}
 * @private
 */
function format(value) {
  return value.toFixed(4);
}

/** @param {Matrix} matrix @returns {number} @private */
function expand(matrix) {
  const n = matrix.rows;
  if (n === 1) return matrix.data[0][0];
  if (n === 2) return matrix.data[0][0] * matrix.data[1][1] - matrix.data[0][1] * matrix.data[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const cofactorSign = j % 2 === 0 ? 1 : -1;
    det += cofactorSign * matrix.data[0][j] * expand(matrix.minor(0, j));
  }
  return det;
}
