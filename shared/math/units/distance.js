/**
 * units/distance.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de distancia. Unidad
 * base interna: metro (m). Incluye la milla náutica (nmi), relevante para
 * las futuras calculadoras de aeronáutica.
 *
 * No reimplementa el motor de conversión: usa createUnitConverter de
 * utils/helpers.js, igual que el resto de los módulos de units/.
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

const definitions = {
  m: { toBase: (v) => v, fromBase: (v) => v },
  km: { toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  cm: { toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  mm: { toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  mi: { toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  yd: { toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  ft: { toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  in: { toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  nmi: { toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
};

const converter = createUnitConverter(definitions, 'distancia');

/**
 * @param {number} value
 * @param {string} from - una de: m, km, cm, mm, mi, yd, ft, in, nmi
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT' si from/to no son reconocidas
 * @throws {MathError} code 'NOT_FINITE' si value no es un número finito
 * @example
 * convert(1000, 'm', 'km'); // 1
 * convert(1, 'nmi', 'km'); // 1.852
 */
export const convert = converter.convert;

/** @type {string[]} unidades soportadas por este módulo */
export const units = converter.units;
