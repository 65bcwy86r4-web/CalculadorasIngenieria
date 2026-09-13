/**
 * Shared numeric constants for the math engine.
 *
 * @example
 * import { EPSILON } from "./shared/math/utils/constants.js";
 * const isZero = Math.abs(value) <= EPSILON;
 */
export const EPSILON = 1e-10;
export const DEFAULT_DECIMALS = 10;
export const DEFAULT_MAX_ITERATIONS = 100;
export const DEFAULT_TOLERANCE = 1e-10;

export const PI = Math.PI;
export const E = Math.E;

export const STANDARD_GRAVITY = 9.80665;
export const STANDARD_ATMOSPHERE_PA = 101325;
export const ABSOLUTE_ZERO_CELSIUS = -273.15;

export default Object.freeze({
  EPSILON,
  DEFAULT_DECIMALS,
  DEFAULT_MAX_ITERATIONS,
  DEFAULT_TOLERANCE,
  PI,
  E,
  STANDARD_GRAVITY,
  STANDARD_ATMOSPHERE_PA,
  ABSOLUTE_ZERO_CELSIUS,
});
