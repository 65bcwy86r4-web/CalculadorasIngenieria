/**
 * formatter/precision.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: precisión numérica en punto flotante — comparar
 * con tolerancia y redondear. No decide CÓMO se muestra un número en
 * pantalla (eso es formatter/format.js); solo resuelve el problema de
 * "¿son estos dos números iguales, para fines prácticos?" y "¿cuál es la
 * versión limpia de este número?".
 * ---------------------------------------------------------------------------
 */

import { assertFiniteNumber, assertNonNegative, assertInteger } from '../validation/numbers.js';
import { DEFAULT_TOLERANCE, DEFAULT_DISPLAY_DECIMALS } from '../utils/constants.js';

/**
 * Compara dos números con una tolerancia absoluta (apta para la mayoría
 * de los cálculos de esta librería, donde los valores no suelen ser
 * extremadamente grandes ni extremadamente pequeños a la vez).
 * @param {number} a
 * @param {number} b
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {boolean}
 * @example
 * approximatelyEqual(0.1 + 0.2, 0.3); // true
 */
export function approximatelyEqual(a, b, tolerance = DEFAULT_TOLERANCE) {
  assertFiniteNumber(a, 'a');
  assertFiniteNumber(b, 'b');
  assertNonNegative(tolerance, 'tolerance');
  return Math.abs(a - b) <= tolerance;
}

/**
 * @param {number} value
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {boolean} true si value está a menos de `tolerance` de 0
 * @example
 * isApproximatelyZero(1e-15); // true
 */
export function isApproximatelyZero(value, tolerance = DEFAULT_TOLERANCE) {
  return approximatelyEqual(value, 0, tolerance);
}

/**
 * Redondea value a la cantidad de decimales indicada.
 * @param {number} value
 * @param {number} [decimals=DEFAULT_DISPLAY_DECIMALS]
 * @returns {number}
 * @example
 * roundTo(3.14159, 2); // 3.14
 */
export function roundTo(value, decimals = DEFAULT_DISPLAY_DECIMALS) {
  assertFiniteNumber(value, 'value');
  assertInteger(decimals, 'decimals');
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * "Limpia" un valor: si está a menos de `tolerance` de 0, devuelve 0
 * exacto; si no, lo redondea a `decimals`. Útil después de eliminación de
 * Gauss, donde deberían aparecer ceros pero quedan residuos de punto
 * flotante como 1e-16.
 * @param {number} value
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @param {number} [decimals=DEFAULT_DISPLAY_DECIMALS]
 * @returns {number}
 * @example
 * clean(-1.2e-15, 1e-10, 4); // 0
 * clean(2.00004, 1e-10, 4); // 2.0
 */
export function clean(value, tolerance = DEFAULT_TOLERANCE, decimals = DEFAULT_DISPLAY_DECIMALS) {
  if (isApproximatelyZero(value, tolerance)) return 0;
  return roundTo(value, decimals);
}
