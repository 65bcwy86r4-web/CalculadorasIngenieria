import { createLinearUnitConverter } from "../utils/helpers.js";

/**
 * Energy conversion factors to joules.
 *
 * @example
 * import { convert } from "./shared/math/units/energy.js";
 * convert(1, "kWh", "J"); // 3600000
 */
export const energyUnits = Object.freeze({
  J: 1,
  kJ: 1000,
  MJ: 1000000,
  Wh: 3600,
  kWh: 3600000,
  cal: 4.184,
  kcal: 4184,
  BTU: 1055.05585262,
  eV: 1.602176634e-19,
});

/**
 * Converts energy values.
 *
 * @param {number} value Energy value.
 * @param {string} fromUnit Source unit.
 * @param {string} toUnit Target unit.
 * @returns {number} Converted energy.
 *
 * @example
 * convert(1, "kWh", "J"); // 3600000
 */
export const convert = createLinearUnitConverter(energyUnits, "energy");

export default Object.freeze({
  energyUnits,
  convert,
});
