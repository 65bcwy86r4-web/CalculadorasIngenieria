/**
 * InterpolationError.js
 * ---------------------------------------------------------------------------
 * Error específico del módulo de interpolación: puntos duplicados en x,
 * cantidad insuficiente de puntos para el método elegido, arreglos x/y de
 * longitudes distintas, o evaluación fuera del dominio cuando se pide modo
 * estricto (sin extrapolar).
 * ---------------------------------------------------------------------------
 */

import { MathError } from './MathError.js';

export class InterpolationError extends MathError {
  /**
   * @param {string} message - Descripción del problema.
   * @param {Object} [context={}] - Ej: { x: 12, domain: [0, 10] }.
   *
   * @example
   * import { InterpolationError } from '../errors/InterpolationError.js';
   * throw new InterpolationError(
   *   'Hay valores de x duplicados; Lagrange no está definido en ese caso.',
   *   { duplicated: 2.5 }
   * );
   */
  constructor(message, context = {}) {
    super(message, 'INTERPOLATION_ERROR', context);
    this.name = 'InterpolationError';
  }
}
