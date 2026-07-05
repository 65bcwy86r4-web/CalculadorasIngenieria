import { MathError } from "../errors/MathError.js";
import { DEFAULT_MAX_ITERATIONS, DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateFiniteNumber, validateFunction, validateInteger } from "../validation/numbers.js";

/**
 * Finds a root in [lower, upper] using bisection.
 *
 * @param {(x:number)=>number} fn Function whose root is wanted.
 * @param {number} lower Lower bound.
 * @param {number} upper Upper bound.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Solver options.
 * @returns {{root:number, iterations:number, converged:boolean, value:number}}
 *
 * @example
 * bisection((x) => x * x - 2, 1, 2).root;
 */
export function bisection(fn, lower, upper, options = {}) {
  validateFunction(fn, "fn");
  validateFiniteNumber(lower, "lower");
  validateFiniteNumber(upper, "upper");
  if (lower >= upper) {
    throw new MathError("Bisection lower bound must be less than upper bound", {
      lower,
      upper,
    });
  }
  const {
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
  } = options;
  validateFiniteNumber(tolerance, "tolerance");
  validateInteger(maxIterations, "maxIterations");

  let a = lower;
  let b = upper;
  let fa = fn(a);
  let fb = fn(b);
  validateFiniteNumber(fa, "fn(lower)");
  validateFiniteNumber(fb, "fn(upper)");
  if (fa * fb > 0) {
    throw new MathError("Bisection requires a sign change in the interval", {
      lower,
      upper,
      fa,
      fb,
    });
  }

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const mid = (a + b) / 2;
    const fm = fn(mid);
    validateFiniteNumber(fm, "fn(mid)");
    if (Math.abs(fm) <= tolerance || Math.abs(b - a) / 2 <= tolerance) {
      return { root: mid, iterations: iteration, converged: true, value: fm };
    }
    if (fa * fm < 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }

  const root = (a + b) / 2;
  return { root, iterations: maxIterations, converged: false, value: fn(root) };
}

export default Object.freeze({
  bisection,
});
