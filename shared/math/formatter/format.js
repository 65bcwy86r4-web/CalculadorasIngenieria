/**
 * formatter/format.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: convertir valores numéricos (o matrices "matrix-like")
 * en texto listo para mostrar. No hace matemática ni decide tolerancias
 * (eso es formatter/precision.js); solo formatea. Ninguna calculadora
 * debería tener su propia lógica de "cómo mostrar un número".
 * ---------------------------------------------------------------------------
 */

import { assertFiniteNumber, assertInteger } from '../validation/numbers.js';
import { assertMatrixLike } from '../validation/matrix.js';
import { roundTo } from './precision.js';
import { DEFAULT_DISPLAY_DECIMALS } from '../utils/constants.js';

/**
 * Formatea un número con una cantidad fija de decimales, recortando ceros
 * si el valor es un entero exacto una vez redondeado (para no mostrar
 * "3.0000" cuando alcanza con "3").
 * @param {number} value
 * @param {number} [decimals=DEFAULT_DISPLAY_DECIMALS]
 * @returns {string}
 * @example
 * toFixedSmart(3, 4); // "3"
 * toFixedSmart(3.14159, 4); // "3.1416"
 */
export function toFixedSmart(value, decimals = DEFAULT_DISPLAY_DECIMALS) {
  assertFiniteNumber(value, 'value');
  assertInteger(decimals, 'decimals');
  const rounded = roundTo(value, decimals);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Formatea un número en notación científica con una cantidad dada de
 * cifras significativas.
 * @param {number} value
 * @param {number} [significantDigits=4]
 * @returns {string}
 * @example
 * toScientific(123456, 3); // "1.235e+5"
 */
export function toScientific(value, significantDigits = 4) {
  assertFiniteNumber(value, 'value');
  assertInteger(significantDigits, 'significantDigits');
  return value.toExponential(Math.max(0, significantDigits - 1));
}

/**
 * Formatea un número eligiendo automáticamente notación fija o científica:
 * usa científica cuando el valor absoluto es muy grande o muy chico
 * (y distinto de cero), donde la notación fija sería poco legible.
 * @param {number} value
 * @param {Object} [options={}]
 * @param {number} [options.decimals=DEFAULT_DISPLAY_DECIMALS]
 * @param {number} [options.scientificBelow=1e-4] - umbral inferior
 * @param {number} [options.scientificAbove=1e8] - umbral superior
 * @returns {string}
 * @example
 * formatNumber(0.00000123); // "1.2300e-6"
 * formatNumber(42.5); // "42.5"
 */
export function formatNumber(value, options = {}) {
  assertFiniteNumber(value, 'value');
  const { decimals = DEFAULT_DISPLAY_DECIMALS, scientificBelow = 1e-4, scientificAbove = 1e8 } = options;
  const abs = Math.abs(value);
  if (value !== 0 && (abs < scientificBelow || abs > scientificAbove)) {
    return toScientific(value, decimals);
  }
  return toFixedSmart(value, decimals);
}

/**
 * Formatea una matriz "matrix-like" ({rows, cols, data}) como texto tabular
 * simple, útil para logs, exportación a TXT o depuración en consola.
 * @param {Object} matrix
 * @param {Object} [options={}]
 * @param {number} [options.decimals=DEFAULT_DISPLAY_DECIMALS]
 * @param {number} [options.columnWidth=10]
 * @returns {string}
 * @example
 * formatMatrix({ rows:2, cols:2, data:[[1,2],[3,4]] });
 * // "     1     2\n     3     4"
 */
export function formatMatrix(matrix, options = {}) {
  assertMatrixLike(matrix, 'matrix');
  const { decimals = DEFAULT_DISPLAY_DECIMALS, columnWidth = 10 } = options;
  return matrix.data
    .map((row) => row.map((v) => formatNumber(v, { decimals }).padStart(columnWidth)).join(''))
    .join('\n');
}
