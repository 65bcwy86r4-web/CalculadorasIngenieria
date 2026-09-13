/**
 * matrix-input.js
 * ---------------------------------------------------------------------------
 * Descripción: grillas de entrada. Genera las celdas, lee lo que el usuario
 *   escribió y resuelve el pegado desde planilla de cálculo.
 *
 *   La validación numérica se hace con `isFiniteNumber` del motor, no con un
 *   chequeo propio: si la calculadora aceptara como válido algo que el motor
 *   rechaza (o al revés), el usuario recibiría dos criterios distintos de qué
 *   es un número. Es la misma razón por la que existen las funciones de
 *   validación en la API pública (ENGINEERING_GUIDE.md §7).
 *
 *   El pegado acepta lo que producen Excel, Google Sheets y MATLAB: celdas
 *   separadas por tabulación, coma, punto y coma o espacios, filas separadas
 *   por salto de línea o por punto y coma, y corchetes alrededor.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (isFiniteNumber)
 *
 * Funciones exportadas: buildGrid, readGrid, fillGrid, parsePastedMatrix
 *
 * @example
 * import { buildGrid, readGrid } from './matrix-input.js';
 * buildGrid(document.getElementById('gridA'), 3, 3);
 * readGrid(document.getElementById('gridA')); // { data: [[0,0,0],...], errors: [] }
 * ---------------------------------------------------------------------------
 */

import { isFiniteNumber } from '../../../shared/math/index.js';

/**
 * Separadores de celda aceptados al pegar: tabulación, coma o espacios. El
 * punto y coma no está acá porque antes de separar celdas se convierte en
 * salto de línea, que es lo que significa en MATLAB.
 *
 * Consecuencia deliberada: al pegar, la coma separa celdas y no puede usarse
 * como separador decimal. Es la convención de todo CSV, y la alternativa
 * —adivinar según el contexto— produce errores silenciosos con "1,5" pegado
 * desde una planilla en español. Escribiendo a mano en una celda sí se acepta
 * la coma decimal, porque ahí no hay ambigüedad posible.
 *
 * @type {RegExp}
 */
const CELL_SEPARATORS = /[\t,]+|\s+/;

/**
 * Genera una grilla de entradas numéricas, inicializada en cero.
 *
 * @param {HTMLElement} container - Contenedor de la grilla.
 * @param {number} rows
 * @param {number} cols
 * @returns {void}
 *
 * @example
 * buildGrid(gridA, 2, 3); // 6 celdas en 2 filas
 */
export function buildGrid(container, rows, cols) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.className = 'matrix-input';
      input.value = '0';
      input.dataset.row = String(i);
      input.dataset.col = String(j);
      input.setAttribute('aria-label', `Fila ${i + 1}, columna ${j + 1}`);
      fragment.appendChild(input);
    }
  }

  container.style.setProperty('--grid-cols', String(cols));
  container.dataset.rows = String(rows);
  container.dataset.cols = String(cols);
  container.replaceChildren(fragment);
}

/**
 * Lee una grilla.
 *
 * Devuelve los errores en vez de lanzar: la interfaz quiere marcar TODAS las
 * celdas mal cargadas de una vez, no la primera y nada más.
 *
 * @param {HTMLElement} container
 * @returns {{data: number[][], errors: Array<{row: number, col: number}>}}
 *
 * @example
 * const { data, errors } = readGrid(gridA);
 * if (errors.length === 0) new Matrix(data);
 */
export function readGrid(container) {
  const rows = Number(container.dataset.rows);
  const cols = Number(container.dataset.cols);
  const inputs = container.querySelectorAll('.matrix-input');

  const data = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const errors = [];

  inputs.forEach((input) => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const raw = input.value.trim().replace(',', '.');
    const parsed = raw === '' ? 0 : Number(raw);

    input.classList.toggle('is-invalid', !isFiniteNumber(parsed));

    if (isFiniteNumber(parsed)) {
      data[row][col] = parsed;
    } else {
      errors.push({ row, col });
    }
  });

  return { data, errors };
}

/**
 * Escribe valores en una grilla ya generada. Las celdas que la matriz nueva no
 * cubre quedan en cero, y lo que sobra se descarta.
 *
 * @param {HTMLElement} container
 * @param {number[][]} data
 * @returns {void}
 */
export function fillGrid(container, data) {
  const inputs = container.querySelectorAll('.matrix-input');

  inputs.forEach((input) => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const value = data[row]?.[col];
    input.value = value === undefined ? '0' : String(value);
    input.classList.remove('is-invalid');
  });
}

/**
 * Interpreta un texto pegado desde una planilla como matriz.
 *
 * @param {string} text - Contenido del portapapeles.
 * @returns {number[][]} Filas de números. Vacío si no se pudo interpretar nada.
 *
 * @example
 * parsePastedMatrix('1\t2\n3\t4');   // [[1, 2], [3, 4]]
 * parsePastedMatrix('[1 2; 3 4]');   // [[1, 2], [3, 4]]
 */
export function parsePastedMatrix(text) {
  const normalized = text
    .replace(/[[\]{}]/g, ' ')
    .replace(/;\s*\n/g, '\n')
    .replace(/;/g, '\n')
    .trim();

  if (normalized === '') {
    return [];
  }

  return normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => line
      .split(CELL_SEPARATORS)
      .filter((cell) => cell !== '')
      .map((cell) => Number(cell)));
}
