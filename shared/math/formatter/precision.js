import { DEFAULT_DECIMALS, DEFAULT_TOLERANCE } from "../utils/constants.js";

/**
 * Compares two numbers with a configurable tolerance.
 *
 * @param {number} a First number.
 * @param {number} b Second number.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Numeric tolerance.
 * @returns {boolean} True when both values are approximately equal.
 *
 * @example
 * approximatelyEqual(0.1 + 0.2, 0.3);
 */
export function approximatelyEqual(a, b, tolerance = DEFAULT_TOLERANCE) {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Tests whether a value is numerically close to zero.
 *
 * @param {number} value Value to inspect.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Numeric tolerance.
 * @returns {boolean} True when the absolute value is small enough.
 *
 * @example
 * isNearlyZero(1e-12);
 */
export function isNearlyZero(value, tolerance = DEFAULT_TOLERANCE) {
  return Math.abs(value) <= tolerance;
}

/**
 * Rounds a number to a fixed amount of decimal places.
 *
 * @param {number} value Number to round.
 * @param {number} [decimals=DEFAULT_DECIMALS] Decimal places.
 * @returns {number} Rounded number.
 *
 * @example
 * roundTo(1.23456, 2); // 1.23
 */
export function roundTo(value, decimals = DEFAULT_DECIMALS) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Converts tiny floating point noise to exact zero and rounds the rest.
 *
 * @param {number} value Number to clean.
 * @param {number} [decimals=DEFAULT_DECIMALS] Decimal places.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Zero tolerance.
 * @returns {number} Clean number.
 *
 * @example
 * cleanNumber(1e-12); // 0
 */
export function cleanNumber(value, decimals = DEFAULT_DECIMALS, tolerance = DEFAULT_TOLERANCE) {
  if (isNearlyZero(value, tolerance)) return 0;
  return roundTo(value, decimals);
}

/**
 * Rounds every value in a matrix.
 *
 * @param {number[][]} matrix Matrix data.
 * @param {number} [decimals=DEFAULT_DECIMALS] Decimal places.
 * @returns {number[][]} Rounded matrix.
 *
 * @example
 * roundMatrix([[1 / 3]], 4); // [[0.3333]]
 */
export function roundMatrix(matrix, decimals = DEFAULT_DECIMALS) {
  return matrix.map((row) => row.map((value) => roundTo(value, decimals)));
}

/**
 * Formats a number in scientific notation.
 *
 * @param {number} value Number to format.
 * @param {number} [decimals=6] Decimal places.
 * @returns {string} Scientific notation.
 *
 * @example
 * scientificNotation(12345, 2); // "1.23e+4"
 */
export function scientificNotation(value, decimals = 6) {
  return Number(value).toExponential(decimals);
}

export default Object.freeze({
  approximatelyEqual,
  isNearlyZero,
  roundTo,
  cleanNumber,
  roundMatrix,
  scientificNotation,
});
