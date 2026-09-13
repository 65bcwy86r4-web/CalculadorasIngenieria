import { MathError } from "../errors/MathError.js";

/**
 * Creates a deep clone for plain arrays used by matrices, vectors, and tensors.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Cloned value.
 *
 * @example
 * import { cloneArrayData } from "./shared/math/utils/helpers.js";
 * const copy = cloneArrayData([[1, 2], [3, 4]]);
 */
export function cloneArrayData(value) {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item) => cloneArrayData(item));
}

/**
 * Creates an array with a deterministic initializer.
 *
 * @param {number} length Array length.
 * @param {(index:number)=>*} initializer Function called for each index.
 * @returns {Array} Created array.
 *
 * @example
 * const row = createArray(3, () => 0);
 */
export function createArray(length, initializer) {
  return Array.from({ length }, (_, index) => initializer(index));
}

/**
 * Swaps two rows of a matrix in place.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {number} rowA First row index.
 * @param {number} rowB Second row index.
 * @returns {number[][]} The same matrix reference.
 *
 * @example
 * swapRows([[1], [2]], 0, 1);
 */
export function swapRows(matrix, rowA, rowB) {
  const temp = matrix[rowA];
  matrix[rowA] = matrix[rowB];
  matrix[rowB] = temp;
  return matrix;
}

/**
 * Generates a numeric range.
 *
 * @param {number} start First value, inclusive.
 * @param {number} end Last value, exclusive.
 * @param {number} [step=1] Increment.
 * @returns {number[]} Numeric range.
 *
 * @example
 * const indexes = range(0, 3); // [0, 1, 2]
 */
export function range(start, end, step = 1) {
  if (step === 0) {
    throw new MathError("Range step cannot be zero");
  }
  const values = [];
  if (step > 0) {
    for (let value = start; value < end; value += step) values.push(value);
  } else {
    for (let value = start; value > end; value += step) values.push(value);
  }
  return values;
}

/**
 * Returns a central finite-difference derivative approximation.
 *
 * @param {(x:number)=>number} fn Function to differentiate.
 * @param {number} x Evaluation point.
 * @param {number} [h=1e-6] Step size.
 * @returns {number} Approximate derivative.
 *
 * @example
 * const slope = numericalDerivative((x) => x * x, 2);
 */
export function numericalDerivative(fn, x, h = 1e-6) {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

/**
 * Creates a converter for unit systems whose units are linear multiples of a
 * base unit.
 *
 * @param {Record<string, number>} factorsToBase Unit-to-base factors.
 * @param {string} quantityName Quantity name used in error messages.
 * @returns {(value:number, fromUnit:string, toUnit:string)=>number} Converter.
 *
 * @example
 * const convert = createLinearUnitConverter({ m: 1, km: 1000 }, "distance");
 * convert(1000, "m", "km"); // 1
 */
export function createLinearUnitConverter(factorsToBase, quantityName) {
  const units = Object.freeze({ ...factorsToBase });

  return function convert(value, fromUnit, toUnit) {
    if (!Number.isFinite(value)) {
      throw new MathError("Unit conversion value must be a finite number", {
        value,
        quantity: quantityName,
      });
    }
    if (!Object.prototype.hasOwnProperty.call(units, fromUnit)) {
      throw new MathError(`Unknown ${quantityName} unit: ${fromUnit}`, {
        unit: fromUnit,
        availableUnits: Object.keys(units),
      });
    }
    if (!Object.prototype.hasOwnProperty.call(units, toUnit)) {
      throw new MathError(`Unknown ${quantityName} unit: ${toUnit}`, {
        unit: toUnit,
        availableUnits: Object.keys(units),
      });
    }
    return (value * units[fromUnit]) / units[toUnit];
  };
}

export default Object.freeze({
  cloneArrayData,
  createArray,
  swapRows,
  range,
  numericalDerivative,
  createLinearUnitConverter,
});
