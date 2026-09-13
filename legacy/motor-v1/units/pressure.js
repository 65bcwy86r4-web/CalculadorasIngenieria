import { createLinearUnitConverter } from "../utils/helpers.js";

/**
 * Pressure conversion factors to pascals.
 *
 * @example
 * import { convert } from "./shared/math/units/pressure.js";
 * convert(1, "atm", "Pa"); // 101325
 */
export const pressureUnits = Object.freeze({
  Pa: 1,
  kPa: 1000,
  MPa: 1000000,
  bar: 100000,
  mbar: 100,
  atm: 101325,
  psi: 6894.757293168,
  torr: 133.3223684211,
  mmHg: 133.322387415,
});

/**
 * Converts pressure values.
 *
 * @param {number} value Pressure value.
 * @param {string} fromUnit Source unit.
 * @param {string} toUnit Target unit.
 * @returns {number} Converted pressure.
 *
 * @example
 * convert(1, "atm", "Pa"); // 101325
 */
export const convert = createLinearUnitConverter(pressureUnits, "pressure");

export default Object.freeze({
  pressureUnits,
  convert,
});
