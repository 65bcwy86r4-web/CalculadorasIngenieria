import { MathError } from "../errors/MathError.js";

/**
 * Supported temperature units.
 *
 * @example
 * import { convert } from "./shared/math/units/temperature.js";
 * convert(32, "F", "C"); // 0
 */
export const temperatureUnits = Object.freeze(["C", "F", "K", "R"]);

const toKelvin = Object.freeze({
  C: (value) => value + 273.15,
  F: (value) => ((value - 32) * 5) / 9 + 273.15,
  K: (value) => value,
  R: (value) => (value * 5) / 9,
});

const fromKelvin = Object.freeze({
  C: (value) => value - 273.15,
  F: (value) => ((value - 273.15) * 9) / 5 + 32,
  K: (value) => value,
  R: (value) => (value * 9) / 5,
});

/**
 * Converts temperature values across C, F, K, and R.
 *
 * @param {number} value Temperature value.
 * @param {"C"|"F"|"K"|"R"} fromUnit Source unit.
 * @param {"C"|"F"|"K"|"R"} toUnit Target unit.
 * @returns {number} Converted value.
 *
 * @example
 * convert(32, "F", "C"); // 0
 */
export function convert(value, fromUnit, toUnit) {
  if (!Number.isFinite(value)) {
    throw new MathError("Temperature value must be a finite number", { value });
  }
  if (!toKelvin[fromUnit]) {
    throw new MathError(`Unknown temperature unit: ${fromUnit}`, {
      unit: fromUnit,
      availableUnits: temperatureUnits,
    });
  }
  if (!fromKelvin[toUnit]) {
    throw new MathError(`Unknown temperature unit: ${toUnit}`, {
      unit: toUnit,
      availableUnits: temperatureUnits,
    });
  }
  return fromKelvin[toUnit](toKelvin[fromUnit](value));
}

export default Object.freeze({
  temperatureUnits,
  convert,
});
