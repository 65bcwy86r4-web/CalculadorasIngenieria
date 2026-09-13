/**
 * format-values.js
 * ---------------------------------------------------------------------------
 * Descripción: cómo se escribe un número en esta calculadora. Único lugar del
 *   módulo donde se decide eso, para que la pantalla, el TXT, el CSV y el PDF
 *   muestren exactamente el mismo valor.
 *
 *   No implementa formato: delega en `clean`, `formatNumber` y `toFixedSmart`
 *   del motor (AI_RULES.md §4). Lo único que agrega es la política del módulo:
 *   limpiar antes de mostrar, para que un −1.2e−16 producto del punto flotante
 *   se vea como 0 y no como ruido en el medio de una matriz.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (clean, formatNumber, toFixedSmart,
 *   DEFAULT_DISPLAY_DECIMALS)
 *
 * Funciones exportadas: formatValue, formatCell, formatAny
 *
 * @example
 * import { formatValue } from './format-values.js';
 * formatValue(-1.2e-16); // '0'
 * formatValue(0.5);      // '0.5'
 * ---------------------------------------------------------------------------
 */

import {
  clean,
  formatNumber,
  toFixedSmart,
  DEFAULT_DISPLAY_DECIMALS,
} from '../../shared/math/index.js';

/**
 * Escribe un número para mostrarlo suelto (un determinante, una traza, κ(A)).
 * Usa `formatNumber`, que elige notación fija o científica según la magnitud.
 *
 * @param {number} value
 * @returns {string}
 *
 * @example
 * formatValue(1234.5);   // '1234.5'
 * formatValue(0.0000012) // '1.2000e-6'
 */
export function formatValue(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return formatNumber(clean(value, undefined, DEFAULT_DISPLAY_DECIMALS));
}

/**
 * Escribe un número para una celda de matriz o de vector. A diferencia de
 * `formatValue`, evita la notación científica salvo que haga falta: en una
 * grilla, alternar formatos entre celdas vecinas hace ilegible la tabla.
 *
 * @param {number} value
 * @returns {string}
 *
 * @example
 * formatCell(3);       // '3'
 * formatCell(1/3);     // '0.3333'
 */
export function formatCell(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const cleaned = clean(value, undefined, DEFAULT_DISPLAY_DECIMALS);
  if (cleaned !== 0 && Math.abs(cleaned) < 1e-4) {
    return formatNumber(cleaned);
  }
  return toFixedSmart(cleaned, DEFAULT_DISPLAY_DECIMALS);
}

/**
 * Escribe un valor que puede venir como número o como texto ya listo. Lo usan
 * los bloques de pares nombre/valor, donde conviven las dos cosas.
 *
 * @param {string|number} value
 * @returns {string}
 *
 * @example
 * formatAny('Jacobi'); // 'Jacobi'
 * formatAny(2.5);      // '2.5'
 */
export function formatAny(value) {
  return typeof value === 'number' ? formatValue(value) : String(value);
}
