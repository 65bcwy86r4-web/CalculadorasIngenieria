/**
 * algebra/eigen-2x2.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: autovalores de una matriz 2x2 por la forma cerrada
 * de su polinomio característico.
 *
 * Es uno de los tres métodos de autovalores del motor. La entrada que elige
 * entre ellos según el tipo de matriz es `eigenvalues`, en eigen.js; este
 * archivo expone el método explícito, para cuando se lo quiere pedir por su
 * nombre (ADR-005).
 *
 * Es el único de los tres que es exacto y no iterativo, y el único que
 * distingue con certeza el par complejo conjugado: sale del signo del
 * discriminante, no de mirar si quedó residuo después de iterar. Es además
 * el caso que un estudiante resuelve a mano en un parcial.
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-13 (portado desde legacy/motor-v1/ por ADR-004;
 *   extraído de eigen.js por ADR-007 §3.5)
 * Dependencias: ../validation/matrix.js, ../errors/math-error.js,
 *   ../utils/constants.js
 * ---------------------------------------------------------------------------
 */

import { assertSquareMatrix } from '../validation/matrix.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Autovalores de una matriz 2x2 por su polinomio característico:
 * λ² − tr(A)·λ + det(A) = 0, de donde λ = (tr ± √(tr² − 4·det)) / 2.
 *
 * Es exacto —no iterativo—, y distingue el caso de raíces complejas
 * conjugadas, que el motor no puede representar todavía (deuda D5): en ese
 * caso `values` viene vacío y el par se informa por partes en `realPart` e
 * `imaginaryPart`.
 *
 * `steps` viene vacío: el desarrollo del polinomio característico es el
 * Paso 2c-2 (ADR-007 §4).
 *
 * @param {Matrix} matrix - matriz de 2x2
 * @param {number} [tolerance=DEFAULT_TOLERANCE] - margen con el que un
 *   discriminante levemente negativo se trata como raíz doble real
 * @returns {{ values: number[], hasComplexPair: boolean, realPart: number, imaginaryPart: number, steps: Array<Object> }}
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
  const steps = [];

  if (discriminant < -tolerance) {
    return {
      values: [],
      hasComplexPair: true,
      realPart,
      imaginaryPart: Math.sqrt(-discriminant) / 2,
      steps,
    };
  }

  const root = Math.sqrt(Math.max(0, discriminant)) / 2;
  return {
    values: [realPart + root, realPart - root],
    hasComplexPair: false,
    realPart,
    imaginaryPart: 0,
    steps,
  };
}
