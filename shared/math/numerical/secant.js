/**
 * numerical/secant.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: método de la secante para hallar raíces de
 * f(x) = 0 a partir de dos estimaciones iniciales, sin requerir la
 * derivada de f (a diferencia de Newton-Raphson).
 * ---------------------------------------------------------------------------
 */

import { assertFunction, assertFiniteNumber, assertPositive, assertInteger } from '../validation/numbers.js';
import { MathError } from '../errors/math-error.js';
import { DEFAULT_TOLERANCE, DEFAULT_MAX_ITERATIONS } from '../utils/constants.js';

/**
 * @param {(x:number)=>number} f
 * @param {number} x0 - primera estimación
 * @param {number} x1 - segunda estimación
 * @param {Object} [options={}]
 * @param {number} [options.tolerance=DEFAULT_TOLERANCE]
 * @param {number} [options.maxIterations=DEFAULT_MAX_ITERATIONS]
 * @returns {{ root: number, iterations: number, history: Array<{iteration:number, x0:number, x1:number, fx1:number}> }}
 * @throws {MathError} code 'ZERO_DENOMINATOR' si f(x1) - f(x0) se anula
 * @throws {MathError} code 'CONVERGENCE_FAILURE' si no converge en maxIterations
 * @example
 * secant(x => x*x - 2, 1, 2).root; // ≈ 1.41421356 (√2)
 */
export function secant(f, x0, x1, options = {}) {
  assertFunction(f, 'f');
  assertFiniteNumber(x0, 'x0');
  assertFiniteNumber(x1, 'x1');
  const { tolerance = DEFAULT_TOLERANCE, maxIterations = DEFAULT_MAX_ITERATIONS } = options;
  assertPositive(tolerance, 'tolerance');
  assertInteger(maxIterations, 'maxIterations');
  assertPositive(maxIterations, 'maxIterations');

  let xPrev = x0,
    xCurr = x1;
  let fPrev = f(xPrev);
  const history = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    const fCurr = f(xCurr);
    history.push({ iteration: iter, x0: xPrev, x1: xCurr, fx1: fCurr });
    if (Math.abs(fCurr) <= tolerance) return { root: xCurr, iterations: iter, history };

    const denom = fCurr - fPrev;
    if (Math.abs(denom) < 1e-14) {
      throw new MathError('f(x1) - f(x0) es ~0: el método de la secante no puede continuar.', 'ZERO_DENOMINATOR', { x0: xPrev, x1: xCurr, iteration: iter, history });
    }
    const xNext = xCurr - (fCurr * (xCurr - xPrev)) / denom;
    if (!Number.isFinite(xNext)) {
      throw new MathError('La iteración de la secante diverge (x dejó de ser un número finito).', 'DIVERGENCE', { iteration: iter, history });
    }
    xPrev = xCurr;
    fPrev = fCurr;
    xCurr = xNext;
  }
  throw new MathError(`El método de la secante no convergió en ${maxIterations} iteraciones con tolerancia ${tolerance}.`, 'CONVERGENCE_FAILURE', { maxIterations, tolerance, lastX: xCurr, history });
}
