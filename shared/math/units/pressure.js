/**
 * units/pressure.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de presión. Unidad
 * base interna: pascal (Pa). Relevante para ISA, mecánica de fluidos y
 * aeronáutica (altímetros, presión dinámica, etc.).
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  Pa: { toBase: (v) => v, fromBase: (v) => v },
  kPa: { toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  atm: { toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
  bar: { toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
  mbar: { toBase: (v) => v * 100, fromBase: (v) => v / 100 },
  mmHg: { toBase: (v) => v * 133.322368, fromBase: (v) => v / 133.322368 },
  psi: { toBase: (v) => v * 6894.757293168, fromBase: (v) => v / 6894.757293168 },
  inHg: { toBase: (v) => v * 3386.389, fromBase: (v) => v / 3386.389 },
};

const converter = createUnitConverter(definitions, 'presión');

/**
 * @param {number} value
 * @param {string} from - una de: Pa, kPa, atm, bar, mbar, mmHg, psi, inHg
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(1, 'atm', 'Pa'); // 101325
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
