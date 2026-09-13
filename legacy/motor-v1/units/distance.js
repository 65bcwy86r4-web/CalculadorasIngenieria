import { createLinearUnitConverter } from "../utils/helpers.js";

/**
 * Distance conversion factors to meters.
 *
 * @example
 * import { convert } from "./shared/math/units/distance.js";
 * convert(1000, "m", "km"); // 1
 */
export const distanceUnits = Object.freeze({
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  um: 1e-6,
  nm: 1e-9,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
  nmi: 1852,
});

/**
 * Converts distance values.
 *
 * @param {number} value Distance value.
 * @param {string} fromUnit Source unit.
 * @param {string} toUnit Target unit.
 * @returns {number} Converted distance.
 *
 * @example
 * convert(1000, "m", "km"); // 1
 */
export const convert = createLinearUnitConverter(distanceUnits, "distance");

export default Object.freeze({
  distanceUnits,
  convert,
});
