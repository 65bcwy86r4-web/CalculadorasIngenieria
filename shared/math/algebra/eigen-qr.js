/**
 * algebra/eigen-qr.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: autovalores por el algoritmo QR iterativo, sin
 * desplazamientos.
 *
 * Es uno de los tres métodos de autovalores del motor. La entrada que elige
 * entre ellos según el tipo de matriz es `eigenvalues`, en eigen.js; este
 * archivo expone el método explícito, para cuando se lo quiere pedir por su
 * nombre o mostrarlo corriendo (ADR-005).
 *
 * Limitación conocida y deliberada: la iteración sin desplazamiento no
 * converge cuando dos autovalores tienen el mismo módulo. Está documentada
 * en el JSDoc de la función y fijada como prueba. Mejorarla con
 * desplazamientos de Wilkinson es la deuda D13, y este archivo existe en
 * parte para que esa mejora tenga dónde entrar sin volver a dividir nada.
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-12 (extraído de eigen.js por ADR-007 §3.5)
 * Dependencias: ./qr.js, ../validation/matrix.js, ../utils/constants.js
 * ---------------------------------------------------------------------------
 */

import { qrDecomposition } from './qr.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { DEFAULT_QR_ITERATIONS, DEFAULT_TOLERANCE } from '../utils/constants.js';

/** Umbral del elemento subdiagonal por debajo del cual se considera nulo. */
const SUBDIAGONAL_THRESHOLD = 1e-4;

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
 * Norma euclídea de la parte estrictamente subdiagonal: mide cuánto le falta a
 * la iterada para ser triangular superior, que es a lo que el método converge.
 *
 * Cuesta `O(n²)` frente al `O(n³)` de la factorización QR de ese mismo paso,
 * así que observar la convergencia no cambia el orden del algoritmo.
 *
 * @param {Matrix} matrix
 * @returns {number}
 * @private
 */
function subdiagonalNorm(matrix) {
  let total = 0;
  for (let i = 1; i < matrix.rows; i++) {
    for (let j = 0; j < i; j++) total += matrix.data[i][j] * matrix.data[i][j];
  }
  return Math.sqrt(total);
}

/**
 * Autovalores de una matriz cuadrada por el **algoritmo QR iterativo**,
 * siempre y sin despacho: Aₖ = QₖRₖ, Aₖ₊₁ = RₖQₖ. Como cada paso es una
 * transformación de semejanza ortogonal, `Aₖ` conserva los autovalores de
 * `A`, y bajo condiciones favorables converge a una forma triangular
 * superior cuya diagonal son esos autovalores.
 *
 * **Limitación del método, no defecto de esta función:** la iteración sin
 * desplazamiento no converge cuando dos autovalores tienen el mismo módulo
 * —`±λ`, o un par complejo conjugado—. En esos casos queda un bloque 2x2 sin
 * reducir, la diagonal no son los autovalores, y `hasComplexHint` se pone en
 * `true`. Si lo que se quiere son los autovalores y no este algoritmo, la
 * función es `eigenvalues`, que despacha a Jacobi en el caso simétrico.
 * Mejorar este camino con desplazamientos de Wilkinson es la deuda D13.
 *
 * `matrixT` es la iterada `Aₖ` al terminar, útil para mostrar el estado de
 * convergencia.
 *
 * **Cuántos pasos emite.** Un paso por iteración serían 500 siempre, con 499
 * indistinguibles entre sí. En su lugar se registra la primera iteración —para
 * ver una aplicación concreta de la transformación— y después solo los
 * **hitos**: las iteraciones en las que la norma subdiagonal cae un orden de
 * magnitud. La cantidad de pasos queda atada a cuántos dígitos de convergencia
 * hay entre el residuo inicial y la tolerancia del motor, no al tamaño de la
 * matriz ni a la cantidad de iteraciones: son del orden de una docena en el
 * peor caso, y **cero cuando el método no converge**, que es lo honesto.
 *
 * @param {Matrix} matrix
 * @param {number} [iterations=DEFAULT_QR_ITERATIONS] - pasos de la iteración
 * @returns {{ values: number[], matrixT: Matrix, hasComplexHint: boolean, steps: Array<Object> }}
 *   diagonal de la iterada, de mayor a menor
 * @throws {DimensionError} si la matriz no es cuadrada
 * @example
 * eigenvaluesQR(new Matrix([[2, 1], [1, 2]])).values; // [3, 1]
 * @example
 * // Autovalores de igual módulo: el método no converge y lo informa.
 * const salida = eigenvaluesQR(new Matrix([[0, 50], [50, 0]]));
 * salida.values;          // [0, 0] — no son los autovalores
 * salida.hasComplexHint;  // true  — la iteración no triangularizó
 */
export function eigenvaluesQR(matrix, iterations = DEFAULT_QR_ITERATIONS) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;

  let matrixT = matrix.clone();
  let residual = subdiagonalNorm(matrixT);
  const steps = [openingStep(matrixT, iterations, residual)];
  // Se registra la primera iteración y después solo los hitos: cada vez que el
  // residuo cruza un orden de magnitud hacia abajo. Un paso por iteración
  // serían 500, casi todos iguales entre sí.
  let decade = residual > 0 ? Math.floor(Math.log10(residual)) : -Infinity;

  for (let it = 0; it < iterations; it++) {
    const { Q, R } = qrDecomposition(matrixT);
    matrixT = R.multiply(Q);
    residual = subdiagonalNorm(matrixT);
    const current = residual > 0 ? Math.floor(Math.log10(residual)) : -Infinity;

    if (it === 0) {
      steps.push({
        type: 'iterate',
        text: `Iteración 1: norma subdiagonal ${format(residual)}.`,
        snapshot: matrixT.toArray(),
      });
    } else if (current < decade && residual > DEFAULT_TOLERANCE) {
      steps.push({
        type: 'iterate',
        text: `Iteración ${it + 1}: la norma subdiagonal baja a ${residual.toExponential(2)}.`,
        snapshot: matrixT.toArray(),
      });
    }
    if (current < decade) decade = current;
  }

  const values = [];
  for (let i = 0; i < n; i++) values.push(matrixT.data[i][i]);

  let hasComplexHint = false;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(matrixT.data[i + 1][i]) > SUBDIAGONAL_THRESHOLD) hasComplexHint = true;
  }

  values.sort((a, b) => b - a);
  steps.push(closingStep(matrixT, values, residual, iterations, hasComplexHint));
  return { values, matrixT, hasComplexHint, steps };
}

/**
 * Paso de apertura: qué método corre y de cuánto parte el residuo.
 * @param {Matrix} matrixT
 * @param {number} iterations
 * @param {number} residual
 * @returns {Object}
 * @private
 */
function openingStep(matrixT, iterations, residual) {
  return {
    type: 'info',
    text: `Iteración QR: Aₖ = QₖRₖ, Aₖ₊₁ = RₖQₖ. Se corren ${iterations} iteraciones; `
      + `la norma subdiagonal arranca en ${format(residual)} y tiene que tender a cero.`,
    snapshot: matrixT.toArray(),
  };
}

/**
 * Paso de cierre. Distingue los dos desenlaces posibles, porque un
 * procedimiento que termina anunciando autovalores que no son los autovalores
 * es peor que uno que admite no haber convergido.
 * @param {Matrix} matrixT
 * @param {number[]} values
 * @param {number} residual
 * @param {number} iterations
 * @param {boolean} hasComplexHint
 * @returns {Object}
 * @private
 */
function closingStep(matrixT, values, residual, iterations, hasComplexHint) {
  return {
    type: 'final',
    text: hasComplexHint
      ? `Tras ${iterations} iteraciones la norma subdiagonal sigue en ${format(residual)}: la iteración no triangularizó. `
        + 'La diagonal no son los autovalores — hay autovalores complejos o de igual módulo (deuda D13). '
        + 'Para obtenerlos, usar eigenvalues, que despacha a Jacobi en el caso simétrico.'
      : `La iterada quedó triangular superior (norma subdiagonal ${residual.toExponential(2)}): `
        + `su diagonal son los autovalores, ${values.map(format).join(', ')}.`,
    snapshot: matrixT.toArray(),
  };
}
