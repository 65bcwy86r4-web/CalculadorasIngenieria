/**
 * SingularMatrixError.js
 * ---------------------------------------------------------------------------
 * Error específico para operaciones que requieren que una matriz sea
 * invertible (rango completo / determinante distinto de cero) y la matriz
 * provista no lo es: inversa, LU con pivoteo que no encuentra pivote no
 * nulo, resolución de sistemas que exigen A invertible, etc.
 *
 * No se usa para "el sistema no tiene solución única" en un sentido más
 * amplio (eso lo maneja gauss.js devolviendo un resultado tipado, ver su
 * documentación), sino específicamente cuando la operación pedida no
 * puede definirse matemáticamente sin una matriz no singular.
 * ---------------------------------------------------------------------------
 */

import { MathError } from './MathError.js';

export class SingularMatrixError extends MathError {
  /**
   * @param {string} message - Descripción del problema.
   * @param {Object} [context={}] - Ej: { rank: 2, size: 3 }.
   *
   * @example
   * import { SingularMatrixError } from '../errors/SingularMatrixError.js';
   * throw new SingularMatrixError(
   *   'La matriz es singular: no tiene inversa.',
   *   { rank: 2, size: 3 }
   * );
   */
  constructor(message, context = {}) {
    super(message, 'SINGULAR_MATRIX', context);
    this.name = 'SingularMatrixError';
  }
}
