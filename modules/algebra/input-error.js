/**
 * input-error.js
 * ---------------------------------------------------------------------------
 * Descripción: excepción para los problemas de carga de datos que detecta la
 *   interfaz antes de llamar al motor — una celda que no es un número, una
 *   operación que pide matriz cuadrada y recibe otra cosa.
 *
 *   Por qué una clase propia y no `new Error(...)`: la interfaz distingue dos
 *   situaciones que se ven igual si las dos son Error. Un dato mal cargado es
 *   algo que el usuario puede arreglar, y se le muestra como tal. Un Error
 *   cualquiera que llegue hasta acá es un defecto de la calculadora, y
 *   corresponde decirle que lo reporte en vez de hacerle revisar datos que
 *   están bien. Con `new Error` para ambos, o mentimos en un caso o mentimos
 *   en el otro.
 *
 *   Por qué no se reutiliza `MathError` del motor, que está exportado: no es
 *   un error matemático. El motor ni se enteró de que esto pasó — la operación
 *   nunca llegó a invocarse. Colgarle al motor un error que no cometió
 *   confundiría cualquier diagnóstico posterior.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ninguna.
 *
 * Funciones exportadas: InputError
 *
 * @example
 * import { InputError } from './input-error.js';
 * throw new InputError('La matriz A tiene celdas que no son números: (1,1).');
 * ---------------------------------------------------------------------------
 */

export class InputError extends Error {
  /**
   * @param {string} message - Mensaje en español, listo para mostrar, que dice
   *   qué hay que corregir y dónde.
   */
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}
