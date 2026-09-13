/**
 * steps-view.js
 * ---------------------------------------------------------------------------
 * Descripción: panel de procedimiento paso a paso.
 *
 *   Implementa la regla central de ADR-007 §3.2: **un paso se renderiza con
 *   solo `type` y `text`**. `snapshot` y `detail` son mejoras progresivas.
 *   Concretamente:
 *
 *   - `text` se muestra siempre y es lo único que hace falta para entender el
 *     paso.
 *   - `type` elige un rótulo del vocabulario cerrado de §3.3. Un `type`
 *     desconocido no rompe nada: se muestra tal cual vino. Preferimos mostrar
 *     un paso con un rótulo feo antes que ocultarle el desarrollo al usuario
 *     porque el motor incorporó un tipo que esta versión de la interfaz
 *     todavía no conoce.
 *   - `snapshot` se dibuja solo si está presente y es un arreglo bidimensional
 *     de números finitos. Si falta, el paso se ve igual de completo.
 *   - `detail` no se lee. El ADR dice explícitamente que ninguna calculadora
 *     debe depender de él, y esta no lo hace.
 *
 *   El panel distingue tres estados, no dos, porque son tres situaciones
 *   distintas y decirle al usuario "no hay desarrollo" en las tres sería
 *   mentirle sobre si conviene volver más adelante:
 *
 *   1. Hay pasos            → se muestran.
 *   2. `steps: []`          → la función tiene el contrato y el motor todavía
 *                             no escribió su desarrollo (ADR-007 §4, Paso 2c-2).
 *   3. `steps === null`     → la operación está fuera del contrato: es un
 *                             método de Matrix, y no va a tener desarrollo acá.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ../format-values.js
 *
 * Funciones exportadas: renderSteps, clearSteps
 *
 * @example
 * import { renderSteps } from './steps-view.js';
 * renderSteps(document.getElementById('stepsBody'), outcome.steps);
 * ---------------------------------------------------------------------------
 */

import { formatCell } from '../format-values.js';

/**
 * Vocabulario cerrado de `type` de ADR-007 §3.3, con la enmienda del
 * 2026-09-13 ya aplicada: `unique`, `infinite` e `incompatible` NO son tipos
 * de paso —son el discriminante del retorno de `solveSystem`, que es otra
 * cosa— y por eso no están acá.
 *
 * La tabla se transcribe del ADR y no se importa del motor a propósito: si se
 * importara, la interfaz diría "conozco los tipos que el motor declara", que
 * es exactamente la verificación que no sirve de nada.
 *
 * @type {Object<string, string>}
 */
const STEP_LABELS = {
  info: 'Nota',
  swap: 'Intercambio',
  scale: 'Escala',
  elim: 'Eliminación',
  expand: 'Cofactores',
  compute: 'Cálculo',
  normalize: 'Normalización',
  rotate: 'Rotación',
  iterate: 'Iteración',
  final: 'Resultado',
};

const EMPTY_CONTRACT_MESSAGE = 'Esta operación todavía no muestra el desarrollo. '
  + 'El motor devuelve el procedimiento vacío a propósito: el contrato ya está fijado '
  + 'y los pasos se escriben más adelante.';

const NOT_APPLICABLE_MESSAGE = 'Esta operación se resuelve con un cálculo directo sobre la matriz, '
  + 'sin un desarrollo intermedio que mostrar.';

const PLACEHOLDER_MESSAGE = 'Elegí una operación y presioná Calcular: el desarrollo completo aparece acá.';

/**
 * Verifica que un `snapshot` sea dibujable. No alcanza con que exista: el
 * contrato dice que es `number[][]`, y un renderizador que confíe sin mirar
 * rompe la página entera por un paso mal formado.
 *
 * @param {unknown} snapshot
 * @returns {boolean}
 */
function isDrawableSnapshot(snapshot) {
  return Array.isArray(snapshot)
    && snapshot.length > 0
    && snapshot.every((row) => Array.isArray(row) && row.every((cell) => Number.isFinite(cell)));
}

/**
 * Dibuja una matriz chica dentro de un paso.
 *
 * @param {number[][]} rows
 * @returns {HTMLTableElement}
 */
function buildSnapshotTable(rows) {
  const table = document.createElement('table');
  table.className = 'step-snapshot';

  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.textContent = formatCell(cell);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}

/**
 * Construye el elemento de un paso.
 *
 * @param {{type: string, text: string, snapshot?: number[][]}} step
 * @param {number} position - Número visible del paso, empezando en 1.
 * @returns {HTMLLIElement}
 */
function buildStep(step, position) {
  const item = document.createElement('li');
  item.className = 'step';

  const badge = document.createElement('span');
  badge.className = `step-badge step-badge--${step.type}`;
  badge.textContent = STEP_LABELS[step.type] ?? step.type;
  item.appendChild(badge);

  const number = document.createElement('span');
  number.className = 'step-number';
  number.textContent = String(position);
  item.appendChild(number);

  const text = document.createElement('p');
  text.className = 'step-text';
  text.textContent = step.text || '(el motor no envió texto para este paso)';
  item.appendChild(text);

  if (isDrawableSnapshot(step.snapshot)) {
    item.appendChild(buildSnapshotTable(step.snapshot));
  }
  return item;
}

/**
 * Escribe un mensaje de panel vacío.
 *
 * @param {HTMLElement} container
 * @param {string} message
 * @returns {void}
 */
function renderMessage(container, message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'panel-empty';
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}

/**
 * Renderiza el procedimiento de una operación.
 *
 * @param {HTMLElement} container - Cuerpo del panel de procedimiento.
 * @param {Array<{type: string, text: string, snapshot?: number[][]}>|null} steps
 *   Los pasos tal como los devolvió el motor, o null si la operación está
 *   fuera del contrato.
 * @returns {void}
 *
 * @example
 * renderSteps(body, [{ type: 'elim', text: 'F2 → F2 − 0.5·F1' }]);
 */
export function renderSteps(container, steps) {
  if (steps === null || steps === undefined) {
    renderMessage(container, NOT_APPLICABLE_MESSAGE);
    return;
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    renderMessage(container, EMPTY_CONTRACT_MESSAGE);
    return;
  }

  const list = document.createElement('ol');
  list.className = 'steps-list';
  steps.forEach((step, index) => list.appendChild(buildStep(step, index + 1)));
  container.replaceChildren(list);
}

/**
 * Deja el panel en su estado inicial.
 *
 * @param {HTMLElement} container
 * @returns {void}
 */
export function clearSteps(container) {
  renderMessage(container, PLACEHOLDER_MESSAGE);
}
