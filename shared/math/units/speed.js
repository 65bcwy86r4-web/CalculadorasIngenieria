import { createLinearUnitConverter } from "../utils/helpers.js";

/**
 * Speed conversion factors to meters per second.
 *
 * @example
 * import { convert } from "./shared/math/units/speed.js";
 * convert(36, "km/h", "m/s"); // 10
 */
export const speedUnits = Object.freeze({
  "m/s": 1,
  "km/h": 1000 / 3600,
  "cm/s": 0.01,
  "ft/s": 0.3048,
  mph: 0.44704,
  kt: 0.514444444444,
  knot: 0.514444444444,
});

/**
 * Converts speed values.
 *
 * @param {number} value Speed value.
 * @param {string} fromUnit Source unit.
 * @param {string} toUnit Target unit.
 * @returns {number} Converted speed.
 *
 * @example
 * convert(36, "km/h", "m/s"); // 10
 */
export const convert = createLinearUnitConverter(speedUnits, "speed");

export default Object.freeze({
  speedUnits,
  convert,
});
