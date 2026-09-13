/**
 * interpolation/linear.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: interpolación lineal. Cubre tanto la fórmula de
 * dos puntos como la interpolación lineal por tramos sobre un conjunto de
 * puntos ordenados (el caso típico de leer una tabla, como la tabla ISA
 * por altitud). Ninguna calculadora debe reimplementar esta fórmula.
 * ---------------------------------------------------------------------------
 */

import { InterpolationError } from '../errors/InterpolationError.js';
import { assertFiniteNumber } from '../validation/numbers.js';

/**
 * Interpolación lineal entre dos puntos (x0,y0) y (x1,y1), evaluada en x.
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} x
 * @returns {number}
 * @throws {InterpolationError} si x0 === x1
 * @example
 * linearInterpolate(0, 0, 10, 100, 4); // 40
 */
export function linearInterpolate(x0, y0, x1, y1, x) {
  [x0, y0, x1, y1, x].forEach((v, i) => assertFiniteNumber(v, ['x0', 'y0', 'x1', 'y1', 'x'][i]));
  if (x0 === x1) {
    throw new InterpolationError('linearInterpolate requiere x0 ≠ x1 (dos puntos con la misma abscisa no definen una recta).', { x0, x1 });
  }
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Interpolación lineal por tramos sobre un conjunto de puntos (xs, ys).
 * Los puntos no necesitan estar pre-ordenados: se ordenan internamente
 * por x antes de interpolar.
 * @param {number[]} xs - abscisas, sin duplicados
 * @param {number[]} ys - ordenadas (mismo largo que xs)
 * @param {number} x - punto a evaluar
 * @param {Object} [options={}]
 * @param {boolean} [options.allowExtrapolation=false] - si es false, lanza
 *   InterpolationError cuando x cae fuera de [min(xs), max(xs)]
 * @returns {number}
 * @throws {InterpolationError} si xs/ys tienen largos distintos, hay menos
 *   de 2 puntos, hay x duplicados, o x está fuera de dominio sin extrapolar
 * @example
 * piecewiseLinear([0, 1000, 2000], [15, 8.5, 2], 500); // 11.75
 */
export function piecewiseLinear(xs, ys, x, options = {}) {
  const { allowExtrapolation = false } = options;
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) {
    throw new InterpolationError('xs e ys deben ser arreglos del mismo largo.', { lengthXs: xs?.length, lengthYs: ys?.length });
  }
  if (xs.length < 2) {
    throw new InterpolationError('Se necesitan al menos 2 puntos para interpolar linealmente.', { count: xs.length });
  }
  assertFiniteNumber(x, 'x');

  const points = xs.map((xi, i) => [xi, ys[i]]).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] === points[i - 1][0]) {
      throw new InterpolationError('Hay valores de x duplicados; la interpolación no está definida en ese caso.', { duplicated: points[i][0] });
    }
  }

  const xMin = points[0][0];
  const xMax = points[points.length - 1][0];
  if ((x < xMin || x > xMax) && !allowExtrapolation) {
    throw new InterpolationError(`x = ${x} está fuera del dominio [${xMin}, ${xMax}]. Pasá options.allowExtrapolation = true si se busca extrapolar.`, { x, domain: [xMin, xMax] });
  }

  let i = 0;
  if (x <= xMin) i = 0;
  else if (x >= xMax) i = points.length - 2;
  else while (points[i + 1][0] < x) i++;

  const [x0, y0] = points[i];
  const [x1, y1] = points[i + 1];
  return linearInterpolate(x0, y0, x1, y1, x);
}
