import { MathError } from "../errors/MathError.js";
import { isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_MAX_ITERATIONS, DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateFiniteNumber, validateFunction, validateInteger } from "../validation/numbers.js";

/**
 * Finds a root using the secant method.
 *
 * @param {(x:number)=>number} fn Function whose root is wanted.
 * @param {number} x0 First initial value.
 * @param {number} x1 Second initial value.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Solver options.
 * @returns {{root:number, iterations:number, converged:boolean, value:number}}
 *
 * @example
 * secant((x) => x * x - 2, 1, 2).root;
 */
export function secant(fn, x0, x1, options = {}) {
  validateFunction(fn, "fn");
  validateFiniteNumber(x0, "x0");
  validateFiniteNumber(x1, "x1");
  const {
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
  } = options;
  validateFiniteNumber(tolerance, "tolerance");
  validateInteger(maxIterations, "maxIterations");

  let previous = x0;
  let current = x1;
  let fPrevious = fn(previous);
  let fCurrent = fn(current);
  validateFiniteNumber(fPrevious, "fn(x0)");
  validateFiniteNumber(fCurrent, "fn(x1)");

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const denominator = fCurrent - fPrevious;
    if (isNearlyZero(denominator, tolerance)) {
      throw new MathError("Secant method denominator is zero or nearly zero", {
        previous,
        current,
      });
    }

    const next = current - (fCurrent * (current - previous)) / denominator;
    validateFiniteNumber(next, "next");
    const fNext = fn(next);
    validateFiniteNumber(fNext, "fn(next)");
    if (Math.abs(fNext) <= tolerance || Math.abs(next - current) <= tolerance) {
      return { root: next, iterations: iteration, converged: true, value: fNext };
    }

    previous = current;
    fPrevious = fCurrent;
    current = next;
    fCurrent = fNext;
  }

  return { root: current, iterations: maxIterations, converged: false, value: fCurrent };
}

export default Object.freeze({
  secant,
});
