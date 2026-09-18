/**
 * app.js
 * ---------------------------------------------------------------------------
 * Descripción: controlador de la calculadora de álgebra. Cablea el DOM con el
 *   catálogo de operaciones, la vista y los servicios.
 *
 *   No calcula nada y no dibuja nada: lee entradas, arma los objetos Matrix,
 *   pide la operación al catálogo y le pasa el resultado al renderizador
 *   (ENGINEERING_GUIDE.md §7). Es el único archivo del módulo que conoce los
 *   identificadores del HTML.
 *
 *   Todas las matrices son de la dimensión elegida en la barra superior, igual
 *   que en la V1: un único selector para A, B y el vector b.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (Matrix), ./operations/catalog.js,
 *   ./view/matrix-input.js, ./view/result-view.js, ./view/steps-view.js,
 *   ./view/layout-view.js, ./view/history-view.js, ./view/feedback.js,
 *   ./input-error.js, ./services/history.js, ./services/exporters.js, ./services/keyboard.js
 *
 * Funciones exportadas: ninguna. Es el punto de entrada del módulo y se
 *   ejecuta al cargarse; no expone nada al resto de la plataforma.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from '../../shared/math/index.js';

import { InputError } from './input-error.js';

import { getOperation } from './operations/catalog.js';
import { buildGrid, readGrid, fillGrid, parsePastedMatrix } from './view/matrix-input.js';
import { renderResult, renderError, clearResult } from './view/result-view.js';
import { renderSteps, clearSteps } from './view/steps-view.js';
import {
  renderOperationMenu,
  renderSizeSelector,
  renderShortcutHelp,
  highlightOperation,
} from './view/layout-view.js';
import { renderHistoryList } from './view/history-view.js';
import { describeError, showToast } from './view/feedback.js';
import { createHistory } from './services/history.js';
import { exportAsText, exportAsCsv, exportAsPdf } from './services/exporters.js';
import { bindShortcuts } from './services/keyboard.js';

const MIN_SIZE = 2;
const MAX_SIZE = 15;
const DEFAULT_SIZE = 3;

const DOM_IDS = [
  'matSize', 'btnGenerate', 'btnHistory', 'btnCloseHistory', 'btnClearHistory',
  'historyDrawer', 'historyList', 'overlay', 'sidebar', 'btnToggleSidebar', 'opMenu',
  'cardA', 'gridA', 'cardB', 'gridB', 'cardVectorB', 'gridVectorB',
  'dimBadgeA', 'dimBadgeB', 'btnPasteA', 'btnPasteB',
  'scalarControl', 'scalarInput', 'powerControl', 'powerInput',
  'currentOpLabel', 'btnRun', 'resultBody', 'stepsBody',
  'btnExportTxt', 'btnExportCsv', 'btnExportPdf', 'printArea', 'toast', 'shortcutsList',
];

/** @type {Object<string, HTMLElement>} */
const dom = {};

/** Estado de la interfaz. Vive en el módulo, no en window (AI_RULES.md §9). */
const state = {
  size: DEFAULT_SIZE,
  operationId: null,
  lastResult: null,
  lastContext: null,
};

const history = createHistory();

/* ------------------------------ Entradas ------------------------------ */

/**
 * Regenera las tres grillas con la dimensión actual.
 *
 * @returns {void}
 */
function regenerateGrids() {
  buildGrid(dom.gridA, state.size, state.size);
  buildGrid(dom.gridB, state.size, state.size);
  buildGrid(dom.gridVectorB, state.size, 1);
  dom.dimBadgeA.textContent = `${state.size}×${state.size}`;
  dom.dimBadgeB.textContent = `${state.size}×${state.size}`;
}

/**
 * Muestra u oculta los paneles de entrada según lo que pida la operación.
 *
 * @param {Object|null} operation
 * @returns {void}
 */
function syncInputPanels(operation) {
  // Sin operación elegida se muestra solo A: es la matriz que el usuario va a
  // cargar igual, cualquiera sea la operación que elija después.
  const needs = operation?.needs ?? { A: true };
  dom.cardA.classList.toggle('is-hidden', needs.A !== true);
  dom.cardB.classList.toggle('is-hidden', needs.B !== true);
  dom.cardVectorB.classList.toggle('is-hidden', needs.vectorB !== true);
  dom.scalarControl.classList.toggle('is-hidden', needs.scalar !== true);
  dom.powerControl.classList.toggle('is-hidden', needs.power !== true);
}

/**
 * Lee una grilla y la convierte en Matrix.
 *
 * @param {HTMLElement} container
 * @param {string} name - Para el mensaje de error.
 * @returns {import('../../shared/math/index.js').Matrix}
 * @throws {InputError} Si alguna celda no es un número finito.
 */
function readMatrix(container, name) {
  const { data, errors } = readGrid(container);
  if (errors.length > 0) {
    const positions = errors.map(({ row, col }) => `(${row + 1},${col + 1})`).join(' ');
    throw new InputError(`La matriz ${name} tiene celdas que no son números: ${positions}.`);
  }
  return new Matrix(data);
}

/**
 * Lee el número de un control suelto (escalar o exponente).
 *
 * @param {HTMLInputElement} input
 * @param {string} name
 * @returns {number}
 * @throws {InputError}
 */
function readScalarControl(input, name) {
  const value = Number(input.value.trim().replace(',', '.'));
  if (!Number.isFinite(value)) {
    throw new InputError(`El ${name} no es un número válido.`);
  }
  return value;
}

/**
 * Arma las entradas que necesita una operación.
 *
 * @param {Object} operation
 * @returns {Object}
 * @throws {InputError} Si falta un dato o si algo no es un número.
 */
function gatherInputs(operation) {
  const inputs = { size: state.size };
  const needs = operation.needs;

  if (needs.A === true) {
    inputs.A = readMatrix(dom.gridA, 'A');
    if (operation.requiresSquareA === true && !inputs.A.isSquare()) {
      throw new InputError(`"${operation.label}" necesita una matriz cuadrada.`);
    }
  }
  if (needs.B === true) {
    inputs.B = readMatrix(dom.gridB, 'B');
  }
  if (needs.vectorB === true) {
    inputs.vector = readMatrix(dom.gridVectorB, 'b').toArray().map((row) => row[0]);
  }
  if (needs.scalar === true) {
    inputs.scalar = readScalarControl(dom.scalarInput, 'escalar k');
  }
  if (needs.power === true) {
    inputs.power = readScalarControl(dom.powerInput, 'exponente n');
  }
  return inputs;
}

/* ------------------------------ Cálculo ------------------------------ */

/**
 * Habilita o deshabilita los tres botones de exportación.
 *
 * @param {boolean} enabled
 * @returns {void}
 */
function setExportEnabled(enabled) {
  for (const button of [dom.btnExportTxt, dom.btnExportCsv, dom.btnExportPdf]) {
    button.disabled = !enabled;
  }
}

/**
 * Muestra un problema en el panel de resultado y limpia el procedimiento.
 *
 * @param {string} message
 * @returns {void}
 */
function publishProblem(message) {
  renderError(dom.resultBody, message);
  clearSteps(dom.stepsBody);
  setExportEnabled(false);
}

/**
 * Ejecuta la operación elegida.
 *
 * @returns {void}
 */
function calculate() {
  const operation = getOperation(state.operationId);
  if (operation === undefined) {
    showToast(dom.toast, 'Elegí una operación del menú lateral.', 'info');
    return;
  }

  try {
    const inputs = gatherInputs(operation);

    const blocked = operation.precheck?.(inputs) ?? null;
    if (blocked !== null) {
      publishProblem(blocked);
      return;
    }

    const operationResult = operation.run(inputs);
    state.lastResult = operationResult;
    state.lastContext = { operationId: operation.id, operationLabel: operation.label };

    renderResult(dom.resultBody, operationResult);
    renderSteps(dom.stepsBody, operationResult.steps);
    setExportEnabled(true);
    recordInHistory(operation, inputs);
  } catch (error) {
    publishProblem(describeError(error));
  }
}

/* ------------------------------ Historial ------------------------------ */

/**
 * Guarda el cálculo recién hecho. Se guardan las entradas, no el resultado:
 * al reabrir se vuelve a calcular con el motor actual.
 *
 * @param {Object} operation
 * @param {Object} inputs
 * @returns {void}
 */
function recordInHistory(operation, inputs) {
  history.add({
    operationId: operation.id,
    label: operation.label,
    size: state.size,
    data: {
      A: inputs.A ? inputs.A.toArray() : null,
      B: inputs.B ? inputs.B.toArray() : null,
      vector: inputs.vector ?? null,
      scalar: inputs.scalar ?? null,
      power: inputs.power ?? null,
    },
  });
  refreshHistory();
}

/**
 * Vuelve a dibujar la lista del historial.
 *
 * @returns {void}
 */
function refreshHistory() {
  renderHistoryList(dom.historyList, history.list(), {
    onOpen: restoreFromHistory,
    onRemove: (id) => {
      history.remove(id);
      refreshHistory();
    },
  });
}

/**
 * Recarga las entradas de un cálculo guardado y lo vuelve a ejecutar.
 *
 * @param {string} id
 * @returns {void}
 */
function restoreFromHistory(id) {
  const entry = history.get(id);
  if (entry === undefined) {
    return;
  }

  state.size = entry.size;
  dom.matSize.value = String(entry.size);
  regenerateGrids();

  if (entry.data.A) fillGrid(dom.gridA, entry.data.A);
  if (entry.data.B) fillGrid(dom.gridB, entry.data.B);
  if (entry.data.vector) fillGrid(dom.gridVectorB, entry.data.vector.map((value) => [value]));
  if (entry.data.scalar !== null) dom.scalarInput.value = String(entry.data.scalar);
  if (entry.data.power !== null) dom.powerInput.value = String(entry.data.power);

  selectOperation(entry.operationId);
  toggleHistory(false);
  calculate();
}

/* ------------------------------ Menú y paneles ------------------------------ */

/**
 * Marca una operación como elegida y prepara los paneles de entrada.
 *
 * @param {string} id
 * @returns {void}
 */
function selectOperation(id) {
  const operation = getOperation(id);
  if (operation === undefined) {
    return;
  }

  state.operationId = id;
  dom.currentOpLabel.textContent = operation.label;
  dom.btnRun.disabled = false;
  highlightOperation(dom.opMenu, id);
  syncInputPanels(operation);
}

/**
 * Abre o cierra el cajón del historial.
 *
 * @param {boolean} [force] - Estado deseado; si se omite, alterna.
 * @returns {void}
 */
function toggleHistory(force) {
  const open = force ?? !dom.historyDrawer.classList.contains('is-open');
  dom.historyDrawer.classList.toggle('is-open', open);
  dom.overlay.classList.toggle('is-visible', open);
}

/* ------------------------------ Pegado ------------------------------ */

/**
 * Vuelca en una grilla lo que se pegó, si se pudo interpretar.
 *
 * @param {HTMLElement} container
 * @param {string} text
 * @returns {void}
 */
function applyPastedText(container, text) {
  const rows = parsePastedMatrix(text);
  const hasNumbers = rows.length > 0 && rows.every((row) => row.every(Number.isFinite));

  if (!hasNumbers) {
    showToast(dom.toast, 'No pude interpretar lo pegado como una matriz de números.', 'error');
    return;
  }

  fillGrid(container, rows);
  showToast(dom.toast, `Pegado: ${rows.length}×${rows[0].length}. Las celdas que sobran quedan en cero.`, 'info');
}

/**
 * Pide el portapapeles al navegador. Si lo niega, no insiste: el usuario puede
 * pegar con Ctrl+V dentro de la grilla, que no necesita permiso.
 *
 * @param {HTMLElement} container
 * @returns {Promise<void>}
 */
async function pasteFromClipboard(container) {
  try {
    applyPastedText(container, await navigator.clipboard.readText());
  } catch {
    showToast(dom.toast, 'El navegador no dio acceso al portapapeles. Pegá con Ctrl+V sobre la grilla.', 'error');
  }
}

/**
 * Intercepta un Ctrl+V hecho sobre una celda cuando trae varias celdas.
 *
 * @param {ClipboardEvent} event
 * @param {HTMLElement} container
 * @returns {void}
 */
function handleGridPaste(event, container) {
  const text = event.clipboardData?.getData('text') ?? '';
  if (!text.includes('\t') && !text.includes('\n') && !text.includes(';')) {
    return;
  }
  event.preventDefault();
  applyPastedText(container, text);
}

/* ------------------------------ Arranque ------------------------------ */

/**
 * Conecta los eventos de las entradas y del historial.
 *
 * @returns {void}
 */
function bindInputEvents() {
  dom.btnGenerate.addEventListener('click', () => {
    state.size = Number(dom.matSize.value);
    regenerateGrids();
    showToast(dom.toast, `Matrices de ${state.size}×${state.size} generadas.`, 'info');
  });

  dom.btnRun.addEventListener('click', calculate);
  dom.btnHistory.addEventListener('click', () => toggleHistory());
  dom.btnCloseHistory.addEventListener('click', () => toggleHistory(false));
  dom.overlay.addEventListener('click', () => toggleHistory(false));
  dom.btnClearHistory.addEventListener('click', () => {
    history.clear();
    refreshHistory();
  });

  dom.btnToggleSidebar.addEventListener('click', () => dom.sidebar.classList.toggle('is-hidden'));

  dom.btnPasteA.addEventListener('click', () => pasteFromClipboard(dom.gridA));
  dom.btnPasteB.addEventListener('click', () => pasteFromClipboard(dom.gridB));
  for (const grid of [dom.gridA, dom.gridB, dom.gridVectorB]) {
    grid.addEventListener('paste', (event) => handleGridPaste(event, grid));
  }
}

/**
 * Conecta la exportación y los atajos de teclado.
 *
 * @returns {void}
 */
function bindOutputEvents() {
  dom.btnExportTxt.addEventListener('click', () => exportAsText(state.lastResult, state.lastContext));
  dom.btnExportCsv.addEventListener('click', () => exportAsCsv(state.lastResult, state.lastContext));
  dom.btnExportPdf.addEventListener('click', () => exportAsPdf(dom.printArea, state.lastResult, state.lastContext));

  bindShortcuts(document, {
    generate: () => dom.btnGenerate.click(),
    run: calculate,
    determinant: () => {
      selectOperation('det-gauss');
      calculate();
    },
    exportText: () => {
      if (state.lastResult !== null) {
        exportAsText(state.lastResult, state.lastContext);
      }
    },
    toggleHistory: () => toggleHistory(),
    toggleSidebar: () => dom.sidebar.classList.toggle('is-hidden'),
  });
}

/**
 * Punto de entrada.
 *
 * @returns {void}
 */
function init() {
  for (const id of DOM_IDS) {
    dom[id] = document.getElementById(id);
  }

  renderSizeSelector(dom.matSize, MIN_SIZE, MAX_SIZE, DEFAULT_SIZE);
  regenerateGrids();
  renderOperationMenu(dom.opMenu, selectOperation);
  renderShortcutHelp(dom.shortcutsList);
  bindInputEvents();
  bindOutputEvents();
  refreshHistory();

  clearResult(dom.resultBody);
  clearSteps(dom.stepsBody);
  syncInputPanels(null);

  if (!history.isPersistent()) {
    showToast(dom.toast, 'El navegador no permite guardar el historial: se va a perder al recargar.', 'error');
  }
}

init();
