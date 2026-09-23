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
 * Como `format`, pero entre paréntesis si es negativo, para que una resta no
 * quede escrita como "0.0000 − -4.0000".
 * @param {number} value
 * @returns {string}
 * @private
 */
function signed(value) {
  return value < 0 ? `(${format(value)})` : format(value);
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
 * `steps` son siempre tres —coeficientes, discriminante y raíces— más el
 * cierre. No depende del tamaño porque la función solo acepta 2x2, y no es
 * iterativa: es la fórmula cuadrática, `O(1)`.
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

  const steps = [
    {
      type: 'compute',
      text: `Polinomio característico: λ² − tr(A)·λ + det(A) = 0, con tr(A) = ${format(trace)} y det(A) = ${format(determinant)}.`,
      snapshot: matrix.toArray(),
    },
    {
      type: 'compute',
      text: `Discriminante: Δ = tr(A)² − 4·det(A) = ${format(trace * trace)} − ${signed(4 * determinant)} = ${format(discriminant)}`,
    },
  ];

  if (discriminant < -tolerance) {
    const imaginaryPart = Math.sqrt(-discriminant) / 2;
    steps.push({
      type: 'final',
      text: `Δ < 0: las raíces son un par complejo conjugado, λ = ${format(realPart)} ± ${format(imaginaryPart)}i. `
        + 'El motor no representa números complejos, así que no devuelve autovalores reales.',
    });
    return { values: [], hasComplexPair: true, realPart, imaginaryPart, steps };
  }

  const root = Math.sqrt(Math.max(0, discriminant)) / 2;
  const values = [realPart + root, realPart - root];
  steps.push({
    type: 'final',
    text: discriminant <= tolerance
      ? `Δ ≈ 0: raíz doble, λ = ${format(values[0])} con multiplicidad 2.`
      : `λ = (tr(A) ± √Δ) / 2 = (${format(trace)} ± ${format(Math.sqrt(discriminant))}) / 2 `
        + `→ λ₁ = ${format(values[0])}, λ₂ = ${format(values[1])}`,
  });
  return { values, hasComplexPair: false, realPart, imaginaryPart: 0, steps };
}
