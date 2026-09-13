/**
 * math-error.js
 * ---------------------------------------------------------------------------
 * Clase base de todos los errores del motor matemático compartido
 * (shared/math). Ninguna parte del motor debe usar `throw "texto"` ni
 * lanzar errores genéricos: toda condición excepcional debe expresarse
 * como una instancia de MathError o de una subclase suya.
 *
 * Además del mensaje, cada MathError lleva:
 *  - `code`: identificador estable y legible por máquina (para lógica de
 *    manejo de errores en la interfaz, sin tener que parsear el mensaje).
 *  - `context`: objeto libre con datos adicionales útiles para depurar
 *    (valores recibidos, nombres de parámetros, dimensiones, etc.).
 *
 * Las calculadoras que consuman el motor pueden capturar MathError para
 * mostrar mensajes amigables, y usar `error.code` para distinguir casos
 * sin acoplarse al texto exacto del mensaje (que puede cambiar).
 *
 * @example
 * import { MathError } from '../errors/math-error.js';
 * try {
 *   throw new MathError('El valor no es un número finito.', 'NOT_FINITE', { value: NaN });
 * } catch (e) {
 *   if (e instanceof MathError) console.log(e.code); // 'NOT_FINITE'
 * }
 * ---------------------------------------------------------------------------
 */

export class MathError extends Error {
  /**
   * @param {string} message - Descripción legible del problema (en español,
   *   pensada para mostrarse directamente en la interfaz si hace falta).
   * @param {string} [code='MATH_ERROR'] - Código estable para lógica de manejo.
   * @param {Object} [context={}] - Datos adicionales para depuración.
   */
  constructor(message, code = 'MATH_ERROR', context = {}) {
    super(message);
    this.name = 'MathError';
    this.code = code;
    this.context = context;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
