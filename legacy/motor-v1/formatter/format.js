import { DEFAULT_DECIMALS } from "../utils/constants.js";
import { cleanNumber, scientificNotation } from "./precision.js";

/**
 * Formats a number using fixed or scientific notation.
 *
 * @param {number} value Number to format.
 * @param {{decimals?:number, scientific?:boolean, tolerance?:number}} [options] Format options.
 * @returns {string} Formatted number.
 *
 * @example
 * formatNumber(1 / 3, { decimals: 3 }); // "0.333"
 */
export function formatNumber(value, options = {}) {
  const {
    decimals = DEFAULT_DECIMALS,
    scientific = false,
    tolerance,
  } = options;
  if (scientific) {
    return scientificNotation(value, decimals);
  }
  const cleaned = tolerance === undefined
    ? cleanNumber(value, decimals)
    : cleanNumber(value, decimals, tolerance);
  return Number(cleaned).toFixed(decimals).replace(/\.?0+$/, "");
}

/**
 * Formats a vector as a compact string.
 *
 * @param {number[]} vector Vector values.
 * @param {{decimals?:number, scientific?:boolean}} [options] Format options.
 * @returns {string} Formatted vector.
 *
 * @example
 * formatVector([1, 2.5]); // "[1, 2.5]"
 */
export function formatVector(vector, options = {}) {
  return `[${vector.map((value) => formatNumber(value, options)).join(", ")}]`;
}

/**
 * Formats a matrix as a multiline string.
 *
 * @param {number[][]} matrix Matrix values.
 * @param {{decimals?:number, scientific?:boolean}} [options] Format options.
 * @returns {string} Formatted matrix.
 *
 * @example
 * formatMatrix([[1, 2], [3, 4]]);
 */
export function formatMatrix(matrix, options = {}) {
  return matrix.map((row) => formatVector(row, options)).join("\n");
}

export default Object.freeze({
  formatNumber,
  formatVector,
  formatMatrix,
});
