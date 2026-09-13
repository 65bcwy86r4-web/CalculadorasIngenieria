/**
 * presentation.js
 * ---------------------------------------------------------------------------
 * Descripción: fábricas del modelo de presentación que toda operación de la
 *   calculadora de álgebra devuelve. Es la pieza que desacopla el catálogo de
 *   operaciones del renderizador: una operación no sabe qué es un <table> ni
 *   una clase CSS; describe QUÉ hay que mostrar (una matriz, un escalar, una
 *   lista de propiedades) y el renderizador decide CÓMO.
 *
 *   Sin esta capa intermedia, view/result-view.js sería un switch de 27 ramas
 *   —un archivo "todoterreno" de los que prohíbe ENGINEERING_GUIDE.md §3— y
 *   agregar una operación obligaría a tocar el renderizador.
 *
 *   Los bloques llevan números crudos, nunca texto ya formateado: el formato
 *   es responsabilidad de la vista, que usa las funciones del motor
 *   (formatNumber, toFixedSmart) para que toda la plataforma muestre los
 *   números igual.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ninguna. Este archivo no importa del motor a propósito: es
 *   estructura de presentación pura.
 *
 * Funciones exportadas:
 *   matrixBlock, scalarBlock, vectorBlock, pairsBlock, textBlock, flagsBlock,
 *   result, STEPS_NOT_APPLICABLE
 *
 * @example
 * import { result, matrixBlock } from './presentation.js';
 * return result('Transpuesta (Aᵀ)', [matrixBlock('Aᵀ', T.toArray())], STEPS_NOT_APPLICABLE);
 * ---------------------------------------------------------------------------
 */

/**
 * Valor de `steps` para las operaciones que están fuera del contrato de
 * ADR-007 §3.1 —los métodos de la clase Matrix, que devuelven una Matrix o un
 * número pelados y no tienen dónde llevar un procedimiento—.
 *
 * Es distinto de `[]`: un arreglo vacío significa "esta función tiene el
 * contrato y todavía no registra pasos" (Paso 2c-2), y la interfaz lo dice
 * con esas palabras. `null` significa "esta operación nunca va a tener
 * procedimiento por acá". Confundirlos le mentiría al usuario sobre si
 * conviene volver más adelante.
 *
 * @type {null}
 */
export const STEPS_NOT_APPLICABLE = null;

/**
 * Bloque de matriz.
 *
 * @param {string} label - Rótulo visible, ej. 'Aᵀ', 'L', 'Inversa (A⁻¹)'.
 * @param {number[][]} rows - Contenido como arreglo plano, nunca una Matrix:
 *   el renderizador no debe depender de la clase del motor.
 * @returns {{kind: 'matrix', label: string, rows: number[][]}}
 */
export function matrixBlock(label, rows) {
  return { kind: 'matrix', label, rows };
}

/**
 * Bloque de un único número (determinante, traza, norma, κ(A)…).
 *
 * @param {string} label
 * @param {number} value
 * @param {string} [unit=''] - Sufijo opcional, ej. '' o 'rad'.
 * @returns {{kind: 'scalar', label: string, value: number, unit: string}}
 */
export function scalarBlock(label, value, unit = '') {
  return { kind: 'scalar', label, value, unit };
}

/**
 * Bloque de vector (solución de un sistema, un autovector, la diagonal…).
 *
 * @param {string} label
 * @param {number[]} values
 * @param {'row'|'column'} [orientation='column']
 * @returns {{kind: 'vector', label: string, values: number[], orientation: string}}
 */
export function vectorBlock(label, values, orientation = 'column') {
  return { kind: 'vector', label, values, orientation };
}

/**
 * Bloque de pares nombre/valor, para datos que no son ni matriz ni número
 * suelto: el método que despachó `eigenvalues`, el rango, la cantidad de
 * intercambios de fila.
 *
 * `value` puede ser texto o número. Si es número, lo formatea la vista con
 * las funciones del motor, igual que cualquier otro número de la pantalla;
 * convertirlo a texto acá lo dejaría fuera de esa regla.
 *
 * @param {string} label
 * @param {Array<{name: string, value: string|number}>} entries
 * @returns {{kind: 'pairs', label: string, entries: Array<{name: string, value: string|number}>}}
 */
export function pairsBlock(label, entries) {
  return { kind: 'pairs', label, entries };
}

/**
 * Bloque de texto plano, para conclusiones en palabras (por ejemplo, la
 * clasificación de un sistema incompatible).
 *
 * @param {string} label
 * @param {string} text
 * @returns {{kind: 'text', label: string, text: string}}
 */
export function textBlock(label, text) {
  return { kind: 'text', label, text };
}

/**
 * Bloque de propiedades booleanas (clasificación de una matriz: simétrica,
 * diagonal, triangular…).
 *
 * @param {string} label
 * @param {Array<{name: string, active: boolean}>} flags
 * @returns {{kind: 'flags', label: string, flags: Array<{name: string, active: boolean}>}}
 */
export function flagsBlock(label, flags) {
  return { kind: 'flags', label, flags };
}

/**
 * Arma el resultado completo de una operación.
 *
 * @param {string} title - Título del panel de resultado.
 * @param {Array<Object>} blocks - Bloques construidos con las fábricas de arriba.
 * @param {Array<{type: string, text: string}>|null} steps - Los `steps` tal
 *   como los devolvió el motor, o STEPS_NOT_APPLICABLE. Se pasan sin tocar:
 *   normalizarlos acá escondería el estado real del contrato.
 * @param {string[]} [notes=[]] - Advertencias para mostrar junto al resultado
 *   (ej.: el aviso de posible espectro complejo).
 * @returns {{title: string, blocks: Array<Object>, steps: Array|null, notes: string[]}}
 */
export function result(title, blocks, steps, notes = []) {
  return { title, blocks, steps, notes };
}
