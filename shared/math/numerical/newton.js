import { MathError } from "../errors/MathError.js";
import { isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_MAX_ITERATIONS, DEFAULT_TOLERANCE } from "../utils/constants.js";
import { numericalDerivative } from "../utils/helpers.js";
import { validateFiniteNumber, validateFunction, validateInteger } from "../validation/numbers.js";

/**
 * Finds a root with the Newton-Raphson method.
 *
 * @param {(x:number)=>number} fn Function whose root is wanted.
 * @param {(x:number)=>number|null} derivative Derivative function. If null, a numeric derivative is used.
 * @param {number} initialGuess Initial value.
 * @param {{tolerance?:number, maxIterations?:number}} [options] Solver options.
 * @returns {{root:number, iterations:number, converged:boolean, value:number}}
 *
 * @example
 * newtonRaphson((x) => x * x - 2, (x) => 2 * x, 1).root;
 */
export function newtonRaphson(fn, derivative, initialGuess, options = {}) {
  validateFunction(fn, "fn");
  if (derivative !== null && derivative !== undefined) validateFunction(derivative, "derivative");
  validateFiniteNumber(initialGuess, "initialGuess");
  const {
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
  } = options;
  validateFiniteNumber(tolerance, "tolerance");
  validateInteger(maxIterations, "maxIterations");

  let x = initialGuess;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const y = fn(x);
    validateFiniteNumber(y, "fn(x)");
    if (Math.abs(y) <= tolerance) {
      return { root: x, iterations: iteration - 1, converged: true, value: y };
    }

    const slope = derivative ? derivative(x) : numericalDerivative(fn, x);
    validateFiniteNumber(slope, "derivative(x)");
    if (isNearlyZero(slope, tolerance)) {
      throw new MathError("Newton-Raphson derivative is zero or nearly zero", {
        x,
        iteration,
      });
    }

    const next = x - y / slope;
    validateFiniteNumber(next, "next");
    if (Math.abs(next - x) <= tolerance) {
      return { root: next, iterations: iteration, converged: true, value: fn(next) };
    }
    x = next;
  }

  return { root: x, iterations: maxIterations, converged: false, value: fn(x) };
}

export default Object.freeze({
  newtonRaphson,
});
