/**
 * interpolation/spline.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: interpolación por splines cúbicos naturales.
 *
 * El sistema tridiagonal que determina las segundas derivadas en cada
 * nodo se arma como una Matrix densa y se resuelve con
 * algebra/gauss.js::solveSystem, en vez de escribir un solver tridiagonal
 * (Thomas) aparte. Esto es intencional: el motor no debe tener una
 * segunda implementación de "resolver un sistema lineal" solo para
 * splines. Para la cantidad de puntos que manejan las calculadoras de
 * esta plataforma (tablas de decenas de filas, no miles), el costo
 * adicional de usar Gauss denso en vez de Thomas es irrelevante.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from '../algebra/matrix.js';
import { solveSystem } from '../algebra/gauss.js';
import { InterpolationError } from '../errors/interpolation-error.js';
import { assertFiniteNumber } from '../validation/numbers.js';

/**
 * Construye un spline cúbico natural (segunda derivada nula en los
 * extremos) que pasa por todos los puntos (xs, ys), y lo evalúa en x.
 * @param {number[]} xs - abscisas estrictamente crecientes (n >= 3)
 * @param {number[]} ys - ordenadas (mismo largo que xs)
 * @param {number} x - punto a evaluar
 * @param {Object} [options={}]
 * @param {boolean} [options.allowExtrapolation=false]
 * @returns {{ value: number, secondDerivatives: number[], segmentIndex: number }}
 * @throws {InterpolationError} si hay menos de 3 puntos, xs no es
 *   estrictamente creciente, o x está fuera de dominio sin extrapolar
 * @example
 * cubicSplineInterpolate([0, 1, 2, 3], [0, 1, 0, 1], 1.5).value;
 */
export function cubicSplineInterpolate(xs, ys, x, options = {}) {
  const { allowExtrapolation = false } = options;
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length) {
    throw new InterpolationError('xs e ys deben ser arreglos del mismo largo.', { lengthXs: xs?.length, lengthYs: ys?.length });
  }
  const n = xs.length;
  if (n < 3) {
    throw new InterpolationError('El spline cúbico natural necesita al menos 3 puntos (para 2 puntos, usar interpolation/linear.js).', { count: n });
  }
  xs.forEach((xi, idx) => assertFiniteNumber(xi, `xs[${idx}]`));
  ys.forEach((yi, idx) => assertFiniteNumber(yi, `ys[${idx}]`));
  assertFiniteNumber(x, 'x');
  for (let i = 1; i < n; i++) {
    if (xs[i] <= xs[i - 1]) {
      throw new InterpolationError('xs debe ser estrictamente creciente para construir el spline.', { index: i, xPrev: xs[i - 1], xCurr: xs[i] });
    }
  }
  if ((x < xs[0] || x > xs[n - 1]) && !allowExtrapolation) {
    throw new InterpolationError(`x = ${x} está fuera del dominio [${xs[0]}, ${xs[n - 1]}]. Pasá options.allowExtrapolation = true si se busca extrapolar.`, { x, domain: [xs[0], xs[n - 1]] });
  }

  const h = [];
  for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);

  // Condición natural: M[0] = M[n-1] = 0. Se arma y resuelve el sistema
  // tridiagonal solo para las incógnitas interiores M[1..n-2].
  const interiorCount = n - 2;
  const M = new Array(n).fill(0);

  if (interiorCount > 0) {
    const A = Matrix.zeros(interiorCount, interiorCount);
    const b = new Array(interiorCount);
    for (let k = 0; k < interiorCount; k++) {
      const i = k + 1;
      A.data[k][k] = 2 * (h[i - 1] + h[i]);
      if (k > 0) A.data[k][k - 1] = h[i - 1];
      if (k < interiorCount - 1) A.data[k][k + 1] = h[i];
      b[k] = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
    }
    const solved = solveSystem(A, b);
    if (solved.classification !== 'unique') {
      throw new InterpolationError('No se pudo resolver el sistema tridiagonal del spline (esto no debería ocurrir con xs estrictamente creciente).', { solverResult: solved.classification });
    }
    for (let k = 0; k < interiorCount; k++) M[k + 1] = solved.solution[k];
  }

  // Ubicar el tramo [xs[i], xs[i+1]] que contiene a x (o el más cercano si se extrapola).
  let i = 0;
  if (x <= xs[0]) i = 0;
  else if (x >= xs[n - 1]) i = n - 2;
  else while (xs[i + 1] < x) i++;

  const hi = h[i];
  const a = xs[i + 1] - x;
  const bTerm = x - xs[i];
  const value =
    (M[i] * a * a * a) / (6 * hi) +
    (M[i + 1] * bTerm * bTerm * bTerm) / (6 * hi) +
    (ys[i] / hi - (M[i] * hi) / 6) * a +
    (ys[i + 1] / hi - (M[i + 1] * hi) / 6) * bTerm;

  return { value, secondDerivatives: M, segmentIndex: i };
}
