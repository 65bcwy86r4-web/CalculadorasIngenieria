/**
 * algebra/cholesky.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: descomposición de Cholesky (A = L·Lᵀ), válida
 * únicamente para matrices simétricas definidas positivas.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { DimensionError } from '../errors/dimension-error.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

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

/**
 * `steps` emite **un paso por fila de L**, no por elemento.
 *
 * Por qué por fila: el algoritmo calcula `n(n+1)/2` elementos, o sea 120 para
 * una matriz de 15×15 —el tamaño que el selector de la calculadora permite—, y
 * eso no es un procedimiento que alguien lea. La fila es la unidad natural: `L`
 * es triangular inferior y la fila `i` se completa de una vez, con su elemento
 * diagonal al final. Así el desarrollo tiene `n` pasos y crece linealmente con
 * el orden en vez de cuadráticamente.
 *
 * El `snapshot` de cada paso es la `L` parcial, que es el factor que se está
 * construyendo (ADR-007 §3.2).
 *
 * @param {Matrix} matrix - debe ser simétrica y definida positiva
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ L: Matrix, Lt: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si no es cuadrada o no es simétrica
 * @throws {MathError} code 'NOT_POSITIVE_DEFINITE' si no es definida positiva
 * @example
 * choleskyDecomposition(new Matrix([[4,2],[2,3]])).L.toArray();
 * // [[2, 0], [1, 1.4142...]]
 * @example
 * // Un paso por fila, más la apertura y el cierre.
 * choleskyDecomposition(new Matrix([[4,2],[2,3]])).steps.length; // 4
 */
export function choleskyDecomposition(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  if (!matrix.isSymmetric(tolerance)) {
    throw new DimensionError('Cholesky requiere una matriz simétrica (A = Aᵀ).', { size: matrix.rows });
  }
  const n = matrix.rows;
  const L = Matrix.zeros(n, n);
  const steps = [{
    type: 'info',
    text: `Se construye L triangular inferior fila por fila: lᵢⱼ = (aᵢⱼ − Σₖ lᵢₖ·lⱼₖ) / lⱼⱼ fuera de la diagonal, y lᵢᵢ = √(aᵢᵢ − Σₖ lᵢₖ²) en ella. ${n} fila(s).`,
    snapshot: matrix.toArray(),
  }];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L.data[i][k] * L.data[j][k];
      if (i === j) {
        const value = matrix.data[i][i] - sum;
        if (value <= tolerance) {
          throw new MathError('La matriz no es definida positiva: Cholesky no es aplicable.', 'NOT_POSITIVE_DEFINITE', { row: i });
        }
        L.data[i][j] = Math.sqrt(value);
      } else {
        L.data[i][j] = (matrix.data[i][j] - sum) / L.data[j][j];
      }
    }
    steps.push({
      type: 'compute',
      text: `Fila ${i + 1} de L: ${L.data[i].slice(0, i + 1).map(format).join(', ')}`
        + ` (l${i + 1}${i + 1} = √(a${i + 1}${i + 1} − Σ) = ${format(L.data[i][i])})`,
      snapshot: L.toArray(),
    });
  }

  const Lt = L.transpose();
  steps.push({
    type: 'final',
    text: 'A = L·Lᵀ: L queda triangular inferior con diagonal positiva.',
    snapshot: L.toArray(),
  });
  return { L, Lt, steps };
}
