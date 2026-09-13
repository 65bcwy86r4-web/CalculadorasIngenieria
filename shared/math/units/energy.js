/**
 * units/energy.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de energía. Unidad
 * base interna: joule (J).
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  J: { toBase: (v) => v, fromBase: (v) => v },
  kJ: { toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  cal: { toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
  kcal: { toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
  Wh: { toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
  kWh: { toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
  BTU: { toBase: (v) => v * 1055.05585262, fromBase: (v) => v / 1055.05585262 },
  ftlb: { toBase: (v) => v * 1.3558179483314, fromBase: (v) => v / 1.3558179483314 },
};

const converter = createUnitConverter(definitions, 'energía');

/**
 * @param {number} value
 * @param {string} from - una de: J, kJ, cal, kcal, Wh, kWh, BTU, ftlb
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(1, 'kWh', 'J'); // 3600000
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
