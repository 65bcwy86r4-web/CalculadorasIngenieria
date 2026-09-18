/**
 * units/pressure.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: conversión entre unidades de presión. Unidad
 * base interna: pascal (Pa). Relevante para ISA, mecánica de fluidos y
 * aeronáutica (altímetros, presión dinámica, etc.).
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-12
 * Modificado: 2026-09-13 — factores exactos de mmHg e inHg (H-02); alta de
 *   hPa (D12)
 * Dependencias: ../utils/helpers.js
 * ---------------------------------------------------------------------------
 */

import { createUnitConverter } from '../utils/helpers.js';

/**
 * Milímetro de mercurio, en Pa. Se define como el torr —una 760-ava parte
 * de la atmósfera estándar— en vez del valor convencional 133.322387415:
 * así 1 atm da 760 mmHg exactos, que es el valor que se verifica a mano.
 */
const PASCALS_PER_MMHG = 101325 / 760;

/**
 * Pulgada de mercurio, en Pa. Se deriva del milímetro de mercurio y no se
 * redondea por separado: una pulgada son 25.4 mm exactos, así que 1 inHg
 * tiene que dar 25.4 mmHg exactos. Redondear los dos factores por
 * separado era lo que rompía esa identidad (hallazgo H-02).
 */
const PASCALS_PER_INHG = 25.4 * PASCALS_PER_MMHG;

/**
 * Hectopascal y milibar, en Pa. Son numéricamente idénticos —1 hPa = 1 mbar
 * = 100 Pa por definición del prefijo—, y conviven a propósito: la
 * meteorología y la aeronáutica reportan la presión en hectopascales (el
 * QNH de un altímetro viene en hPa), mientras que `mbar` sigue en uso en
 * instrumental más viejo y en bibliografía. Exponer solo uno obligaría al
 * usuario a saber que el otro es lo mismo, que es justamente el tipo de
 * conversión mental que este módulo existe para evitar.
 *
 * Comparten factor y no se derivan uno del otro: no hay redondeo que
 * pueda desincronizarlos (a diferencia de mmHg/inHg, ver H-02).
 */
const PASCALS_PER_HECTOPASCAL = 100;

const definitions = {
  Pa: { toBase: (v) => v, fromBase: (v) => v },
  hPa: {
    toBase: (v) => v * PASCALS_PER_HECTOPASCAL,
    fromBase: (v) => v / PASCALS_PER_HECTOPASCAL,
  },
  kPa: { toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  atm: { toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
  bar: { toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
  mbar: {
    toBase: (v) => v * PASCALS_PER_HECTOPASCAL,
    fromBase: (v) => v / PASCALS_PER_HECTOPASCAL,
  },
  mmHg: { toBase: (v) => v * PASCALS_PER_MMHG, fromBase: (v) => v / PASCALS_PER_MMHG },
  psi: { toBase: (v) => v * 6894.757293168, fromBase: (v) => v / 6894.757293168 },
  inHg: { toBase: (v) => v * PASCALS_PER_INHG, fromBase: (v) => v / PASCALS_PER_INHG },
};

const converter = createUnitConverter(definitions, 'presión');

/**
 * @param {number} value
 * @param {string} from - una de: Pa, hPa, kPa, atm, bar, mbar, mmHg, psi, inHg
 * @param {string} to
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT'
 * @example
 * convert(1, 'atm', 'Pa'); // 101325
 * @example
 * convert(1, 'atm', 'hPa'); // 1013.25 — el QNH estándar
 */
export const convert = converter.convert;

/** @type {string[]} */
export const units = converter.units;
