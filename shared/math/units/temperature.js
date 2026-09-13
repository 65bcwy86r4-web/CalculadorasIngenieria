/**
 * units/temperature.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de temperatura.
 * Unidad base interna: kelvin (K).
 *
 * A diferencia de distancia/masa/presión/velocidad/energía, la
 * temperatura no es una simple proporción: Celsius y Fahrenheit son
 * escalas afines (tienen un desplazamiento además de un factor de
 * escala). Gracias a que createUnitConverter (utils/helpers.js) recibe
 * funciones toBase/fromBase en vez de un factor numérico, este caso se
 * resuelve con el mismo mecanismo genérico, sin ninguna rama especial.
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  K: { toBase: (v) => v, fromBase: (v) => v },
  C: { toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
  F: { toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
  R: { toBase: (v) => (v * 5) / 9, fromBase: (v) => (v * 9) / 5 },
};

const converter = createUnitConverter(definitions, 'temperatura');

/**
 * @param {number} value
 * @param {string} from - una de: K (kelvin), C (celsius), F (fahrenheit), R (rankine)
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(32, 'F', 'C'); // 0
 * convert(0, 'C', 'K'); // 273.15
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
