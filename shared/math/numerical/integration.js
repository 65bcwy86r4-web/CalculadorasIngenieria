import { MathError } from "../errors/MathError.js";
import { validateFiniteNumber, validateFunction, validateInteger } from "../validation/numbers.js";

/**
 * Integrates a function using the composite trapezoidal rule.
 *
 * @param {(x:number)=>number} fn Function to integrate.
 * @param {number} a Lower bound.
 * @param {number} b Upper bound.
 * @param {number} [subintervals=100] Number of subintervals.
 * @returns {number} Approximate integral.
 *
 * @example
 * trapezoidalRule((x) => x, 0, 1, 100); // about 0.5
 */
export function trapezoidalRule(fn, a, b, subintervals = 100) {
  validateFunction(fn, "fn");
  validateFiniteNumber(a, "a");
  validateFiniteNumber(b, "b");
  validateInteger(subintervals, "subintervals");
  if (subintervals <= 0) {
    throw new MathError("subintervals must be positive", { subintervals });
  }

  const h = (b - a) / subintervals;
  let sum = (fn(a) + fn(b)) / 2;
  validateFiniteNumber(sum, "endpoint sum");

  for (let index = 1; index < subintervals; index++) {
    const value = fn(a + index * h);
    validateFiniteNumber(value, `fn(x_${index})`);
    sum += value;
  }

  return sum * h;
}

/**
 * Integrates a function using composite Simpson 1/3 rule.
 *
 * @param {(x:number)=>number} fn Function to integrate.
 * @param {number} a Lower bound.
 * @param {number} b Upper bound.
 * @param {number} [subintervals=100] Even number of subintervals.
 * @returns {number} Approximate integral.
 *
 * @example
 * simpsonRule((x) => x * x, 0, 1, 100); // about 0.333333
 */
export function simpsonRule(fn, a, b, subintervals = 100) {
  validateFunction(fn, "fn");
  validateFiniteNumber(a, "a");
  validateFiniteNumber(b, "b");
  validateInteger(subintervals, "subintervals");
  if (subintervals <= 0 || subintervals % 2 !== 0) {
    throw new MathError("Simpson rule requires a positive even number of subintervals", {
      subintervals,
    });
  }

  const h = (b - a) / subintervals;
  let sum = fn(a) + fn(b);
  validateFiniteNumber(sum, "endpoint sum");

  for (let index = 1; index < subintervals; index++) {
    const value = fn(a + index * h);
    validateFiniteNumber(value, `fn(x_${index})`);
    sum += (index % 2 === 0 ? 2 : 4) * value;
  }

  return (sum * h) / 3;
}

/**
 * Integrates a function with a selected numeric method.
 *
 * @param {(x:number)=>number} fn Function to integrate.
 * @param {number} a Lower bound.
 * @param {number} b Upper bound.
 * @param {{method?:"simpson"|"trapezoidal", subintervals?:number}} [options] Options.
 * @returns {number} Approximate integral.
 *
 * @example
 * integrate((x) => Math.sin(x), 0, Math.PI, { method: "simpson" });
 */
export function integrate(fn, a, b, options = {}) {
  const { method = "simpson", subintervals = 100 } = options;
  if (method === "simpson") {
    return simpsonRule(fn, a, b, subintervals);
  }
  if (method === "trapezoidal" || method === "trapecios") {
    return trapezoidalRule(fn, a, b, subintervals);
  }
  throw new MathError("Unknown integration method", { method });
}

export default Object.freeze({
  trapezoidalRule,
  simpsonRule,
  integrate,
});
