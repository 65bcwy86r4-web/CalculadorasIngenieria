import { createLinearUnitConverter } from "../utils/helpers.js";

/**
 * Mass conversion factors to kilograms.
 *
 * @example
 * import { convert } from "./shared/math/units/mass.js";
 * convert(1000, "g", "kg"); // 1
 */
export const massUnits = Object.freeze({
  kg: 1,
  g: 0.001,
  mg: 1e-6,
  ug: 1e-9,
  t: 1000,
  lb: 0.45359237,
  oz: 0.028349523125,
  slug: 14.59390294,
});

/**
 * Converts mass values.
 *
 * @param {number} value Mass value.
 * @param {string} fromUnit Source unit.
 * @param {string} toUnit Target unit.
 * @returns {number} Converted mass.
 *
 * @example
 * convert(1000, "g", "kg"); // 1
 */
export const convert = createLinearUnitConverter(massUnits, "mass");

export default Object.freeze({
  massUnits,
  convert,
});
