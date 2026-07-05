import { MathError } from "../errors/MathError.js";

/**
 * Checks whether a value is a JavaScript number.
 *
 * @param {*} value Value to inspect.
 * @returns {boolean} True when the value is a number.
 *
 * @example
 * isNumber(3.14); // true
 */
export function isNumber(value) {
  return typeof value === "number";
}

/**
 * Validates a numeric value.
 *
 * @param {*} value Value to validate.
 * @param {string} [name="value"] Parameter name.
 * @param {{allowNaN?:boolean, allowInfinity?:boolean}} [options] Validation options.
 * @returns {number} The validated number.
 *
 * @example
 * const n = validateNumber(12, "iterations");
 */
export function validateNumber(value, name = "value", options = {}) {
  const { allowNaN = false, allowInfinity = false } = options;
  if (!isNumber(value)) {
    throw new MathError(`${name} must be a number`, { name, value });
  }
  if (!allowNaN && Number.isNaN(value)) {
    throw new MathError(`${name} cannot be NaN`, { name, value });
  }
  if (!allowInfinity && !Number.isFinite(value)) {
    throw new MathError(`${name} must be finite`, { name, value });
  }
  return value;
}

/**
 * Validates a finite number.
 *
 * @param {*} value Value to validate.
 * @param {string} [name="value"] Parameter name.
 * @returns {number} The finite number.
 *
 * @example
 * validateFiniteNumber(9.81, "gravity");
 */
export function validateFiniteNumber(value, name = "value") {
  return validateNumber(value, name, { allowNaN: false, allowInfinity: false });
}

/**
 * Validates an integer.
 *
 * @param {*} value Value to validate.
 * @param {string} [name="value"] Parameter name.
 * @returns {number} The integer.
 *
 * @example
 * validateInteger(10, "subintervals");
 */
export function validateInteger(value, name = "value") {
  validateFiniteNumber(value, name);
  if (!Number.isInteger(value)) {
    throw new MathError(`${name} must be an integer`, { name, value });
  }
  return value;
}

/**
 * Validates a positive finite number.
 *
 * @param {*} value Value to validate.
 * @param {string} [name="value"] Parameter name.
 * @returns {number} The positive number.
 *
 * @example
 * validatePositiveNumber(0.01, "tolerance");
 */
export function validatePositiveNumber(value, name = "value") {
  validateFiniteNumber(value, name);
  if (value <= 0) {
    throw new MathError(`${name} must be greater than zero`, { name, value });
  }
  return value;
}

/**
 * Validates a non-negative finite number.
 *
 * @param {*} value Value to validate.
 * @param {string} [name="value"] Parameter name.
 * @returns {number} The non-negative number.
 *
 * @example
 * validateNonNegativeNumber(0, "lowerBound");
 */
export function validateNonNegativeNumber(value, name = "value") {
  validateFiniteNumber(value, name);
  if (value < 0) {
    throw new MathError(`${name} must be greater than or equal to zero`, {
      name,
      value,
    });
  }
  return value;
}

/**
 * Validates a callable function.
 *
 * @param {*} fn Value to validate.
 * @param {string} [name="function"] Parameter name.
 * @returns {Function} The validated function.
 *
 * @example
 * validateFunction((x) => x * x, "f");
 */
export function validateFunction(fn, name = "function") {
  if (typeof fn !== "function") {
    throw new MathError(`${name} must be a function`, { name, value: fn });
  }
  return fn;
}

export default Object.freeze({
  isNumber,
  validateNumber,
  validateFiniteNumber,
  validateInteger,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateFunction,
});
