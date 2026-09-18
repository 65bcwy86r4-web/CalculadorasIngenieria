/**
 * dimension-error.js
 * ---------------------------------------------------------------------------
 * Error para toda incompatibilidad de "forma": matrices que no se pueden
 * sumar, multiplicar o comparar por tener filas/columnas distintas,
 * vectores de longitud incorrecta, o intentos de convertir entre unidades
 * de magnitudes físicas distintas (por ejemplo, longitud contra masa).
 *
 * Se reutiliza para ambos casos (álgebra y unidades) porque el problema de
 * fondo es el mismo: dos objetos no son "dimensionalmente" compatibles
 * para la operación pedida.
 * ---------------------------------------------------------------------------
 */

import { MathError } from './math-error.js';

export class DimensionError extends MathError {
  /**
   * @param {string} message - Descripción del problema de dimensión.
   * @param {Object} [context={}] - Ej: { expected: '3x3', received: '2x4' }.
   *
   * @example
   * import { DimensionError } from '../errors/dimension-error.js';
   * throw new DimensionError(
   *   'No se pueden sumar matrices de tamaños distintos.',
   *   { expected: '3x3', received: '2x4' }
   * );
   */
  constructor(message, context = {}) {
    super(message, 'DIMENSION_ERROR', context);
    this.name = 'DimensionError';
  }
}
