/**
 * feedback.js
 * ---------------------------------------------------------------------------
 * Descripción: avisos al usuario y traducción de las excepciones del motor a
 *   mensajes accionables.
 *
 *   Los mensajes de MathError ya vienen en español y listos para mostrar, así
 *   que no se reescriben: reescribirlos duplicaría un texto que el motor
 *   mantiene y quedaría desactualizado. Lo que agrega este archivo es la
 *   sugerencia de qué hacer, indexada por `code` —nunca por el texto del
 *   mensaje, que puede cambiar sin aviso, como advierte errors/math-error.js—.
 *
 *   Una excepción que no sea MathError no se disfraza de error de usuario: es
 *   un defecto de la calculadora y se muestra como tal, para que se reporte en
 *   vez de que el usuario crea que cargó mal los datos.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (MathError)
 *
 * Funciones exportadas: describeError, showToast
 *
 * @example
 * import { describeError } from './feedback.js';
 * try { inverse(A); } catch (error) { renderError(body, describeError(error)); }
 * ---------------------------------------------------------------------------
 */

import { MathError } from '../../../shared/math/index.js';

import { InputError } from '../input-error.js';

/**
 * Qué puede hacer el usuario ante cada código de error del motor.
 *
 * @type {Object<string, string>}
 */
const HINTS = {
  SINGULAR_MATRIX: 'La matriz es singular: su determinante es cero, así que no tiene inversa. '
    + 'Verificá si alguna fila es combinación lineal de otras.',
  DIMENSION_ERROR: 'Revisá las dimensiones de las matrices involucradas.',
  NOT_SYMMETRIC: 'Esta operación necesita una matriz simétrica (A = Aᵀ). '
    + 'Podés comprobarlo con la operación "Clasificar matriz".',
  NOT_POSITIVE_DEFINITE: 'Cholesky necesita una matriz simétrica y definida positiva. '
    + 'Para una matriz simétrica cualquiera, usá LU.',
  NOT_DIAGONALIZABLE: 'Los autovectores son linealmente dependientes, así que no existe P invertible. '
    + 'Podés ver los autovalores y autovectores por separado.',
  TOO_LARGE_FOR_COFACTORS: 'Usá el determinante por Gauss, que da el mismo valor en O(n³).',
  NOT_2X2: 'Esta operación solo aplica a matrices de 2×2.',
  NOT_FINITE: 'Alguna celda tiene un valor que no es un número finito.',
  NOT_INTEGER: 'El valor tiene que ser un número entero.',
  NOT_NON_NEGATIVE: 'El valor no puede ser negativo.',
};

const UNEXPECTED_PREFIX = 'Error inesperado de la calculadora (no del motor). '
  + 'Conviene reportarlo con la operación y los datos usados. Detalle: ';

/**
 * Convierte una excepción en el texto que se muestra en pantalla.
 *
 * @param {unknown} error
 * @returns {string}
 *
 * @example
 * describeError(new MathError('No es cuadrada.', 'DIMENSION_ERROR'));
 * // 'No es cuadrada. Revisá las dimensiones de las matrices involucradas.'
 */
export function describeError(error) {
  if (error instanceof InputError) {
    return error.message;
  }
  if (error instanceof MathError) {
    const hint = HINTS[error.code];
    return hint ? `${error.message} ${hint}` : error.message;
  }
  return UNEXPECTED_PREFIX + (error instanceof Error ? error.message : String(error));
}

/**
 * Identificador del temporizador del toast en curso. Se guarda en el módulo y
 * no en el objeto global: dos toasts encimados dejarían el primero colgado.
 *
 * @type {number|null}
 */
let toastTimer = null;

/**
 * Muestra un aviso breve.
 *
 * @param {HTMLElement} container - Elemento del toast.
 * @param {string} message
 * @param {'info'|'error'} [tone='info']
 * @param {number} [durationMs=3200]
 * @returns {void}
 */
export function showToast(container, message, tone = 'info', durationMs = 3200) {
  container.textContent = message;
  container.className = `toast toast--${tone} is-visible`;

  if (toastTimer !== null) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    container.className = 'toast';
    toastTimer = null;
  }, durationMs);
}
