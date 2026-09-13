/**
 * units/mass.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de masa. Unidad base
 * interna: kilogramo (kg). Incluye el slug, unidad de masa del sistema
 * técnico inglés usada en mecánica y aeronáutica.
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  kg: { toBase: (v) => v, fromBase: (v) => v },
  g: { toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  mg: { toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
  ton: { toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  lb: { toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
  oz: { toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
  slug: { toBase: (v) => v * 14.59390294, fromBase: (v) => v / 14.59390294 },
};

const converter = createUnitConverter(definitions, 'masa');

/**
 * @param {number} value
 * @param {string} from - una de: kg, g, mg, ton (métrica), lb, oz, slug
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(1, 'slug', 'kg'); // 14.5939...
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
