import { InterpolationError } from "../errors/InterpolationError.js";
import { validateFiniteNumber } from "../validation/numbers.js";

/**
 * Validates and normalizes interpolation points.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Points as objects or pairs.
 * @returns {Array<{x:number,y:number}>} Sorted point objects.
 *
 * @example
 * normalizePoints([[0, 0], [1, 2]]);
 */
export function normalizePoints(points) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new InterpolationError("At least two interpolation points are required", {
      points,
    });
  }

  const normalized = points.map((point, index) => {
    const x = Array.isArray(point) ? point[0] : point.x;
    const y = Array.isArray(point) ? point[1] : point.y;
    validateFiniteNumber(x, `points[${index}].x`);
    validateFiniteNumber(y, `points[${index}].y`);
    return { x, y };
  });

  normalized.sort((a, b) => a.x - b.x);
  for (let index = 1; index < normalized.length; index++) {
    if (normalized[index].x === normalized[index - 1].x) {
      throw new InterpolationError("Interpolation x values must be unique", {
        x: normalized[index].x,
      });
    }
  }
  return normalized;
}

/**
 * Performs linear interpolation between two points.
 *
 * @param {number} x0 First x coordinate.
 * @param {number} y0 First y coordinate.
 * @param {number} x1 Second x coordinate.
 * @param {number} y1 Second y coordinate.
 * @param {number} x Evaluation coordinate.
 * @returns {number} Interpolated value.
 *
 * @example
 * linearInterpolate(0, 0, 10, 100, 4); // 40
 */
export function linearInterpolate(x0, y0, x1, y1, x) {
  validateFiniteNumber(x0, "x0");
  validateFiniteNumber(y0, "y0");
  validateFiniteNumber(x1, "x1");
  validateFiniteNumber(y1, "y1");
  validateFiniteNumber(x, "x");
  if (x0 === x1) {
    throw new InterpolationError("Linear interpolation requires distinct x values", {
      x0,
      x1,
    });
  }
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Performs piecewise linear interpolation over a sorted set of points.
 *
 * @param {Array<{x:number,y:number}>|number[][]} points Interpolation points.
 * @param {number} x Evaluation coordinate.
 * @param {{allowExtrapolation?:boolean}} [options] Interpolation options.
 * @returns {number} Interpolated value.
 *
 * @example
 * piecewiseLinearInterpolate([[0, 0], [10, 100]], 2); // 20
 */
export function piecewiseLinearInterpolate(points, x, options = {}) {
  const { allowExtrapolation = false } = options;
  const sorted = normalizePoints(points);
  validateFiniteNumber(x, "x");

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!allowExtrapolation && (x < first.x || x > last.x)) {
    throw new InterpolationError("Interpolation point is outside the data range", {
      x,
      min: first.x,
      max: last.x,
    });
  }

  if (x <= first.x) {
    return linearInterpolate(sorted[0].x, sorted[0].y, sorted[1].x, sorted[1].y, x);
  }
  if (x >= last.x) {
    const beforeLast = sorted[sorted.length - 2];
    return linearInterpolate(beforeLast.x, beforeLast.y, last.x, last.y, x);
  }

  for (let index = 0; index < sorted.length - 1; index++) {
    const left = sorted[index];
    const right = sorted[index + 1];
    if (x >= left.x && x <= right.x) {
      return linearInterpolate(left.x, left.y, right.x, right.y, x);
    }
  }

  throw new InterpolationError("Could not locate interpolation segment", { x });
}

export default Object.freeze({
  normalizePoints,
  linearInterpolate,
  piecewiseLinearInterpolate,
});
