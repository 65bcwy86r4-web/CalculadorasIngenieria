import { InterpolationError } from "../errors/InterpolationError.js";
import { validateFiniteNumber } from "../validation/numbers.js";
import { gaussSolve } from "../algebra/gauss.js";
import { zeros } from "../algebra/matrix.js";
import { normalizePoints } from "./linear.js";

function findSplineSegment(points, x, allowExtrapolation) {
  const first = points[0];
  const last = points[points.length - 1];
  if (!allowExtrapolation && (x < first.x || x > last.x)) {
    throw new InterpolationError("Spline evaluation point is outside the data range", {
      x,
      min: first.x,
      max: last.x,
    });
  }
  if (x <= first.x) return 0;
  if (x >= last.x) return points.length - 2;
  for (let index = 0; index < points.length - 1; index++) {
    if (x >= points[index].x && x <= points[index + 1].x) {
      return index;
    }
  }
  throw new InterpolationError("Could not locate spline segment", { x });
}

/**
 * Builds a natural cubic spline for a set of points.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @returns {{points:Array<{x:number,y:number}>, coefficients:Array<{a:number,b:number,c:number,d:number,x0:number,x1:number}>, evaluate:(x:number, options?:{allowExtrapolation?:boolean})=>number, derivative:(x:number, options?:{allowExtrapolation?:boolean})=>number}}
 *
 * @example
 * const spline = createNaturalCubicSpline([[0, 0], [1, 1], [2, 0]]);
 * spline.evaluate(0.5);
 */
export function createNaturalCubicSpline(points) {
  const sorted = normalizePoints(points);
  const n = sorted.length;
  if (n < 3) {
    throw new InterpolationError("Cubic spline interpolation requires at least three points", {
      count: n,
    });
  }

  const h = new Array(n - 1);
  for (let index = 0; index < n - 1; index++) {
    h[index] = sorted[index + 1].x - sorted[index].x;
    if (h[index] <= 0) {
      throw new InterpolationError("Spline x values must be strictly increasing");
    }
  }

  const system = zeros(n, n);
  const rhs = new Array(n).fill(0);
  system[0][0] = 1;
  system[n - 1][n - 1] = 1;

  for (let row = 1; row < n - 1; row++) {
    system[row][row - 1] = h[row - 1];
    system[row][row] = 2 * (h[row - 1] + h[row]);
    system[row][row + 1] = h[row];
    rhs[row] =
      6 *
      ((sorted[row + 1].y - sorted[row].y) / h[row] -
        (sorted[row].y - sorted[row - 1].y) / h[row - 1]);
  }

  const secondDerivatives = gaussSolve(system, rhs);
  const coefficients = [];
  for (let index = 0; index < n - 1; index++) {
    const a = sorted[index].y;
    const b =
      (sorted[index + 1].y - sorted[index].y) / h[index] -
      (h[index] * (2 * secondDerivatives[index] + secondDerivatives[index + 1])) / 6;
    const c = secondDerivatives[index] / 2;
    const d = (secondDerivatives[index + 1] - secondDerivatives[index]) / (6 * h[index]);
    coefficients.push({
      a,
      b,
      c,
      d,
      x0: sorted[index].x,
      x1: sorted[index + 1].x,
    });
  }

  return {
    points: sorted,
    coefficients,
    evaluate(x, options = {}) {
      const { allowExtrapolation = false } = options;
      validateFiniteNumber(x, "x");
      const index = findSplineSegment(sorted, x, allowExtrapolation);
      const segment = coefficients[index];
      const dx = x - segment.x0;
      return segment.a + segment.b * dx + segment.c * dx * dx + segment.d * dx * dx * dx;
    },
    derivative(x, options = {}) {
      const { allowExtrapolation = false } = options;
      validateFiniteNumber(x, "x");
      const index = findSplineSegment(sorted, x, allowExtrapolation);
      const segment = coefficients[index];
      const dx = x - segment.x0;
      return segment.b + 2 * segment.c * dx + 3 * segment.d * dx * dx;
    },
  };
}

/**
 * Evaluates a natural cubic spline at x.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @param {number} x Evaluation coordinate.
 * @param {{allowExtrapolation?:boolean}} [options] Evaluation options.
 * @returns {number} Interpolated value.
 *
 * @example
 * cubicSplineInterpolate([[0, 0], [1, 1], [2, 0]], 0.5);
 */
export function cubicSplineInterpolate(points, x, options = {}) {
  return createNaturalCubicSpline(points).evaluate(x, options);
}

export default Object.freeze({
  createNaturalCubicSpline,
  cubicSplineInterpolate,
});
