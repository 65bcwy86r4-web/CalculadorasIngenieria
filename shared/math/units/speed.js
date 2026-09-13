/**
 * units/speed.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de velocidad. Unidad
 * base interna: metros por segundo (m/s). Incluye el nudo (kt), relevante
 * para aeronáutica.
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  'm/s': { toBase: (v) => v, fromBase: (v) => v },
  'km/h': { toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
  mph: { toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
  kt: { toBase: (v) => v * 0.514444444, fromBase: (v) => v / 0.514444444 },
  'ft/s': { toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
};

const converter = createUnitConverter(definitions, 'velocidad');

/**
 * @param {number} value
 * @param {string} from - una de: 'm/s', 'km/h', 'mph', 'kt' (nudos), 'ft/s'
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(100, 'km/h', 'm/s'); // 27.777...
 * convert(120, 'kt', 'km/h'); // 222.24
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
