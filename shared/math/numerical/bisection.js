/**
 * numerical/bisection.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: método de bisección para hallar raíces de
 * f(x) = 0 en un intervalo [a, b] donde f cambia de signo (teorema de
 * Bolzano). Ver numerical/newton.js para la justificación de por qué
 * "no convergió" se modela como excepción.
 * ---------------------------------------------------------------------------
 */

import { assertFunction, assertFiniteNumber, assertPositive, assertInteger } from '../validation/numbers.js';
import { MathError } from '../errors/math-error.js';
import { sign } from '../utils/helpers.js';
import { DEFAULT_TOLERANCE, DEFAULT_MAX_ITERATIONS } from '../utils/constants.js';

/**
 * @param {(x:number)=>number} f - función continua en [a, b]
 * @param {number} a - extremo inferior
 * @param {number} b - extremo superior
 * @param {Object} [options={}]
 * @param {number} [options.tolerance=DEFAULT_TOLERANCE]
 * @param {number} [options.maxIterations=DEFAULT_MAX_ITERATIONS]
 * @returns {{ root: number, iterations: number, history: Array<{iteration:number, a:number, b:number, mid:number, fMid:number}> }}
 * @throws {MathError} code 'INVALID_INTERVAL' si f(a) y f(b) no tienen signos opuestos
 * @throws {MathError} code 'CONVERGENCE_FAILURE' si no converge en maxIterations
 * @example
 * bisection(x => x*x - 2, 0, 2).root; // ≈ 1.41421356 (√2)
 */
export function bisection(f, a, b, options = {}) {
  assertFunction(f, 'f');
  assertFiniteNumber(a, 'a');
  assertFiniteNumber(b, 'b');
  const { tolerance = DEFAULT_TOLERANCE, maxIterations = DEFAULT_MAX_ITERATIONS } = options;
  assertPositive(tolerance, 'tolerance');
  assertInteger(maxIterations, 'maxIterations');
  assertPositive(maxIterations, 'maxIterations');

  let lo = a,
    hi = b;
  let fLo = f(lo),
    fHi = f(hi);
  if (Math.abs(fLo) <= tolerance) return { root: lo, iterations: 0, history: [{ iteration: 0, a: lo, b: hi, mid: lo, fMid: fLo }] };
  if (Math.abs(fHi) <= tolerance) return { root: hi, iterations: 0, history: [{ iteration: 0, a: lo, b: hi, mid: hi, fMid: fHi }] };
  if (sign(fLo) === sign(fHi)) {
    throw new MathError('f(a) y f(b) deben tener signos opuestos para garantizar una raíz en [a,b] (teorema de Bolzano).', 'INVALID_INTERVAL', { a, b, fa: fLo, fb: fHi });
  }

  const history = [];
  for (let iter = 0; iter < maxIterations; iter++) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    history.push({ iteration: iter, a: lo, b: hi, mid, fMid });
    if (Math.abs(fMid) <= tolerance || (hi - lo) / 2 <= tolerance) {
      return { root: mid, iterations: iter + 1, history };
    }
    if (sign(fMid) === sign(fLo)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
      fHi = fMid;
    }
  }
  throw new MathError(`Bisección no convergió en ${maxIterations} iteraciones con tolerancia ${tolerance}.`, 'CONVERGENCE_FAILURE', { maxIterations, tolerance, lastInterval: [lo, hi], history });
}
