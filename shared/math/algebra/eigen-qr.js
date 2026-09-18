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
import { DEFAULT_QR_ITERATIONS } from '../utils/constants.js';

/** Umbral del elemento subdiagonal por debajo del cual se considera nulo. */
const SUBDIAGONAL_THRESHOLD = 1e-4;

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
 * convergencia. `steps` viene vacío: el procedimiento iteración por
 * iteración es el Paso 2c-2 (ADR-007 §4).
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
  const steps = [];

  let matrixT = matrix.clone();
  for (let it = 0; it < iterations; it++) {
    const { Q, R } = qrDecomposition(matrixT);
    matrixT = R.multiply(Q);
  }

  const values = [];
  for (let i = 0; i < n; i++) values.push(matrixT.data[i][i]);

  let hasComplexHint = false;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(matrixT.data[i + 1][i]) > SUBDIAGONAL_THRESHOLD) hasComplexHint = true;
  }

  values.sort((a, b) => b - a);
  return { values, matrixT, hasComplexHint, steps };
}
