import { InterpolationError } from "../errors/InterpolationError.js";
import { validateFiniteNumber } from "../validation/numbers.js";
import { normalizePoints } from "./linear.js";

function multiplyPolynomialByLinear(polynomial, root) {
  const result = new Array(polynomial.length + 1).fill(0);
  for (let index = 0; index < polynomial.length; index++) {
    result[index] -= polynomial[index] * root;
    result[index + 1] += polynomial[index];
  }
  return result;
}

/**
 * Evaluates the Lagrange interpolation polynomial at x.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @param {number} x Evaluation coordinate.
 * @returns {number} Interpolated value.
 *
 * @example
 * lagrangeInterpolate([[0, 1], [1, 3], [2, 7]], 1.5);
 */
export function lagrangeInterpolate(points, x) {
  const sorted = normalizePoints(points);
  validateFiniteNumber(x, "x");
  let result = 0;

  for (let i = 0; i < sorted.length; i++) {
    let term = sorted[i].y;
    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      const denominator = sorted[i].x - sorted[j].x;
      if (denominator === 0) {
        throw new InterpolationError("Duplicate x value in Lagrange interpolation", {
          x: sorted[i].x,
        });
      }
      term *= (x - sorted[j].x) / denominator;
    }
    result += term;
  }

  return result;
}

/**
 * Builds Lagrange polynomial coefficients in ascending power order.
 * coefficients[0] + coefficients[1]x + coefficients[2]x^2 and higher powers.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @returns {number[]} Polynomial coefficients.
 *
 * @example
 * const coeffs = lagrangeCoefficients([[0, 1], [1, 3]]);
 */
export function lagrangeCoefficients(points) {
  const sorted = normalizePoints(points);
  const coefficients = new Array(sorted.length).fill(0);

  for (let i = 0; i < sorted.length; i++) {
    let basis = [1];
    let denominator = 1;

    for (let j = 0; j < sorted.length; j++) {
      if (i === j) continue;
      basis = multiplyPolynomialByLinear(basis, sorted[j].x);
      denominator *= sorted[i].x - sorted[j].x;
    }

    const scale = sorted[i].y / denominator;
    for (let degree = 0; degree < basis.length; degree++) {
      coefficients[degree] += basis[degree] * scale;
    }
  }

  return coefficients;
}

/**
 * Creates an evaluator function for a Lagrange polynomial.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @returns {{coefficients:number[], evaluate:(x:number)=>number}} Polynomial evaluator.
 *
 * @example
 * const polynomial = lagrangePolynomial([[0, 1], [1, 3]]);
 * polynomial.evaluate(0.5);
 */
export function lagrangePolynomial(points) {
  const coefficients = lagrangeCoefficients(points);
  return {
    coefficients,
    evaluate(x) {
      validateFiniteNumber(x, "x");
      return coefficients.reduceRight((sum, coefficient) => sum * x + coefficient, 0);
    },
  };
}

export default Object.freeze({
  lagrangeInterpolate,
  lagrangeCoefficients,
  lagrangePolynomial,
});
