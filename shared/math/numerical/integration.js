/**
 * numerical/integration.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: integración numérica de una función en [a, b]
 * mediante la regla del trapecio y la regla de Simpson.
 * ---------------------------------------------------------------------------
 */

import { assertFunction, assertFiniteNumber, assertInteger, assertPositive } from '../validation/numbers.js';
import { MathError } from '../errors/math-error.js';

/**
 * Regla del trapecio compuesta. Si a > b, se integra igual y se devuelve
 * el resultado con signo negativo (∫ₐᵇ f = −∫ᵦᵃ f), como es convención
 * en cálculo.
 * @param {(x:number)=>number} f
 * @param {number} a
 * @param {number} b
 * @param {number} [n=100] - cantidad de subintervalos (n >= 1)
 * @returns {number}
 * @throws {MathError} si n no es un entero positivo
 * @example
 * trapezoidal(x => x*x, 0, 1, 1000); // ≈ 0.3333
 */
export function trapezoidal(f, a, b, n = 100) {
  assertFunction(f, 'f');
  assertFiniteNumber(a, 'a');
  assertFiniteNumber(b, 'b');
  assertInteger(n, 'n');
  assertPositive(n, 'n');
  if (a === b) return 0;

  const sign = a > b ? -1 : 1;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const h = (hi - lo) / n;

  let sum = f(lo) + f(hi);
  for (let i = 1; i < n; i++) sum += 2 * f(lo + i * h);
  return sign * (h / 2) * sum;
}

/**
 * Regla de Simpson compuesta (1/3). Requiere una cantidad par de
 * subintervalos, condición necesaria para que la fórmula esté definida.
 * @param {(x:number)=>number} f
 * @param {number} a
 * @param {number} b
 * @param {number} [n=100] - cantidad de subintervalos (entero positivo y par)
 * @returns {number}
 * @throws {MathError} code 'INVALID_SUBINTERVALS' si n no es par
 * @example
 * simpson(x => x*x, 0, 1, 100); // ≈ 0.3333
 */
export function simpson(f, a, b, n = 100) {
  assertFunction(f, 'f');
  assertFiniteNumber(a, 'a');
  assertFiniteNumber(b, 'b');
  assertInteger(n, 'n');
  assertPositive(n, 'n');
  if (n % 2 !== 0) {
    throw new MathError('La regla de Simpson requiere una cantidad par de subintervalos.', 'INVALID_SUBINTERVALS', { n });
  }
  if (a === b) return 0;

  const sign = a > b ? -1 : 1;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const h = (hi - lo) / n;

  let sum = f(lo) + f(hi);
  for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * f(lo + i * h);
  return sign * (h / 3) * sum;
}
