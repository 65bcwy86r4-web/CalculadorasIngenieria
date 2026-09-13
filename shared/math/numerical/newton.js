/**
 * numerical/newton.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: método de Newton-Raphson para hallar raíces de
 * f(x) = 0.
 *
 * Decisión de diseño (aplica también a bisection.js y secant.js): si el
 * método no converge dentro de maxIterations, se lanza MathError en vez
 * de devolver silenciosamente la última estimación. A diferencia de
 * gauss.js::solveSystem (donde "sin solución única" es una respuesta
 * matemática legítima), acá "no convergió" es una falla del proceso
 * iterativo, no un resultado válido: devolverlo como si fuera un valor
 * normal invita a usarlo por error. El error incluye el historial
 * completo de iteraciones en `context` para diagnóstico.
 * ---------------------------------------------------------------------------
 */

import { assertFunction, assertFiniteNumber, assertPositive, assertInteger } from '../validation/numbers.js';
import { MathError } from '../errors/MathError.js';
import { DEFAULT_TOLERANCE, DEFAULT_MAX_ITERATIONS, DEFAULT_DERIVATIVE_STEP } from '../utils/constants.js';

/**
 * @param {(x:number)=>number} f - función continua y derivable
 * @param {number} x0 - estimación inicial
 * @param {Object} [options={}]
 * @param {(x:number)=>number} [options.fPrime] - derivada analítica; si se
 *   omite, se aproxima por diferencias finitas centradas
 * @param {number} [options.tolerance=DEFAULT_TOLERANCE] - se detiene cuando |f(x)| <= tolerance
 * @param {number} [options.maxIterations=DEFAULT_MAX_ITERATIONS]
 * @param {number} [options.derivativeStep=DEFAULT_DERIVATIVE_STEP] - paso h para la derivada numérica
 * @returns {{ root: number, iterations: number, history: Array<{iteration:number, x:number, fx:number}> }}
 * @throws {MathError} code 'ZERO_DERIVATIVE' si la derivada se anula durante la iteración
 * @throws {MathError} code 'DIVERGENCE' si x deja de ser finito
 * @throws {MathError} code 'CONVERGENCE_FAILURE' si no converge en maxIterations
 * @example
 * newtonRaphson(x => x*x - 2, 1).root; // ≈ 1.41421356 (√2)
 */
export function newtonRaphson(f, x0, options = {}) {
  assertFunction(f, 'f');
  assertFiniteNumber(x0, 'x0');
  const { fPrime = null, tolerance = DEFAULT_TOLERANCE, maxIterations = DEFAULT_MAX_ITERATIONS, derivativeStep = DEFAULT_DERIVATIVE_STEP } = options;
  assertPositive(tolerance, 'tolerance');
  assertInteger(maxIterations, 'maxIterations');
  assertPositive(maxIterations, 'maxIterations');
  if (fPrime !== null) assertFunction(fPrime, 'fPrime');

  const derivative = fPrime || ((x) => (f(x + derivativeStep) - f(x - derivativeStep)) / (2 * derivativeStep));
  let x = x0;
  const history = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    const fx = f(x);
    history.push({ iteration: iter, x, fx });
    if (Math.abs(fx) <= tolerance) return { root: x, iterations: iter, history };

    const dfx = derivative(x);
    if (Math.abs(dfx) < 1e-14) {
      throw new MathError('La derivada es ~0: Newton-Raphson no puede continuar (posible extremo local).', 'ZERO_DERIVATIVE', { x, iteration: iter, history });
    }
    x = x - fx / dfx;
    if (!Number.isFinite(x)) {
      throw new MathError('La iteración de Newton-Raphson diverge (x dejó de ser un número finito).', 'DIVERGENCE', { iteration: iter, history });
    }
  }
  throw new MathError(`Newton-Raphson no convergió en ${maxIterations} iteraciones con tolerancia ${tolerance}.`, 'CONVERGENCE_FAILURE', { maxIterations, tolerance, lastX: x, history });
}
