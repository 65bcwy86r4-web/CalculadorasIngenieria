/**
 * interpolation/lagrange.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: interpolación polinómica de Lagrange sobre un
 * conjunto de n puntos con abscisas distintas.
 *
 * P(x) = Σᵢ yᵢ · Lᵢ(x),   Lᵢ(x) = Πⱼ≠ᵢ (x − xⱼ) / (xᵢ − xⱼ)
 * ---------------------------------------------------------------------------
 */

import { InterpolationError } from '../errors/InterpolationError.js';
import { assertFiniteNumber } from '../validation/numbers.js';

/**
 * Evalúa el i-ésimo polinomio base de Lagrange Lᵢ(x) para un conjunto de
 * abscisas dado. Se expone por separado porque es útil para mostrar el
 * procedimiento paso a paso (peso de cada punto en el resultado final).
 * @param {number[]} xs - abscisas, sin duplicados
 * @param {number} i - índice del punto base (0-indexado)
 * @param {number} x - punto a evaluar
 * @returns {number}
 * @example
 * lagrangeBasis([0, 1, 2], 1, 1.5); // L_1(1.5)
 */
export function lagrangeBasis(xs, i, x) {
  let result = 1;
  for (let j = 0; j < xs.length; j++) {
    if (j === i) continue;
    result *= (x - xs[j]) / (xs[i] - xs[j]);
  }
  return result;
}

/**
 * Interpola el valor en x usando el polinomio de Lagrange que pasa por
 * todos los puntos (xs, ys).
 * @param {number[]} xs - abscisas, sin duplicados (n >= 2)
 * @param {number[]} ys - ordenadas (mismo largo que xs)
 * @param {number} x - punto a evaluar
 * @returns {{ value: number, terms: Array<{ x: number, y: number, weight: number, contribution: number }> }}
 * @throws {InterpolationError} si xs/ys tienen largos distintos, hay menos
 *   de 2 puntos, o hay valores de x duplicados
 * @example
 * lagrangeInterpolate([0, 1, 2], [1, 3, 7], 1.5).value; // 4.75
 */
export function lagrangeInterpolate(xs, ys, x) {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) {
    throw new InterpolationError('xs e ys deben ser arreglos del mismo largo.', { lengthXs: xs?.length, lengthYs: ys?.length });
  }
  if (xs.length < 2) {
    throw new InterpolationError('Se necesitan al menos 2 puntos para interpolar con Lagrange.', { count: xs.length });
  }
  xs.forEach((xi, idx) => assertFiniteNumber(xi, `xs[${idx}]`));
  ys.forEach((yi, idx) => assertFiniteNumber(yi, `ys[${idx}]`));
  assertFiniteNumber(x, 'x');

  for (let a = 0; a < xs.length; a++) {
    for (let b = a + 1; b < xs.length; b++) {
      if (xs[a] === xs[b]) {
        throw new InterpolationError('Hay valores de x duplicados; Lagrange no está definido en ese caso (división por cero en los denominadores).', { duplicated: xs[a] });
      }
    }
  }

  const terms = xs.map((xi, i) => {
    const weight = lagrangeBasis(xs, i, x);
    return { x: xi, y: ys[i], weight, contribution: weight * ys[i] };
  });
  const value = terms.reduce((sum, t) => sum + t.contribution, 0);
  return { value, terms };
}
