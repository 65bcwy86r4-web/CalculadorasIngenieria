/**
 * result-view.js
 * ---------------------------------------------------------------------------
 * Descripción: renderiza el panel de resultado a partir del modelo de
 *   presentación que devuelve el catálogo de operaciones.
 *
 *   Conoce seis tipos de bloque —matrix, scalar, vector, pairs, text, flags— y
 *   nada más. No sabe qué operación se ejecutó ni le importa: por eso agregar
 *   una operación nueva no toca este archivo. Si alguna vez hace falta un
 *   séptimo tipo de bloque, se agrega acá una vez y queda disponible para
 *   todas.
 *
 *   Todo el texto se escribe con textContent, nunca con innerHTML: los rótulos
 *   y los mensajes de error vienen del motor y de la entrada del usuario, y no
 *   hay ninguna razón para interpretarlos como HTML.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ../format-values.js
 *
 * Funciones exportadas: renderResult, renderError, clearResult
 *
 * @example
 * import { renderResult } from './result-view.js';
 * renderResult(document.getElementById('resultBody'), operationResult);
 * ---------------------------------------------------------------------------
 */

import { formatValue, formatCell, formatAny } from '../format-values.js';

const PLACEHOLDER_MESSAGE = 'Acá va a aparecer el resultado de la operación.';

/**
 * Crea un elemento con clase y, opcionalmente, texto.
 *
 * @param {string} tag
 * @param {string} className
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * @param {number[][]} rows
 * @returns {HTMLTableElement}
 */
function buildMatrix(rows) {
  const table = element('table', 'matrix-table');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      tr.appendChild(element('td', 'matrix-cell', formatCell(cell)));
    }
    table.appendChild(tr);
  }
  return table;
}

/**
 * @param {number[]} values
 * @param {'row'|'column'} orientation
 * @returns {HTMLElement}
 */
function buildVector(values, orientation) {
  const list = element('ul', `vector-list vector-list--${orientation}`);
  for (const value of values) {
    list.appendChild(element('li', 'vector-item', formatCell(value)));
  }
  return list;
}

/**
 * @param {Array<{name: string, value: string|number}>} entries
 * @returns {HTMLDListElement}
 */
function buildPairs(entries) {
  const list = element('dl', 'pairs-list');
  for (const entry of entries) {
    list.appendChild(element('dt', 'pairs-name', entry.name));
    list.appendChild(element('dd', 'pairs-value', formatAny(entry.value)));
  }
  return list;
}

/**
 * @param {Array<{name: string, active: boolean}>} flags
 * @returns {HTMLUListElement}
 */
function buildFlags(flags) {
  const list = element('ul', 'flags-list');
  for (const flag of flags) {
    const item = element('li', `flag ${flag.active ? 'flag--on' : 'flag--off'}`);
    item.appendChild(element('span', 'flag-mark', flag.active ? 'Sí' : 'No'));
    item.appendChild(element('span', 'flag-name', flag.name));
    list.appendChild(item);
  }
  return list;
}

/**
 * Construye el contenido de un bloque según su `kind`.
 *
 * @param {Object} block
 * @returns {HTMLElement}
 */
function buildBlockBody(block) {
  switch (block.kind) {
    case 'matrix':
      return buildMatrix(block.rows);
    case 'scalar':
      return element('p', 'scalar-value', formatValue(block.value) + (block.unit ? ` ${block.unit}` : ''));
    case 'vector':
      return buildVector(block.values, block.orientation);
    case 'pairs':
      return buildPairs(block.entries);
    case 'flags':
      return buildFlags(block.flags);
    case 'text':
      return element('p', 'block-text', block.text);
    default:
      // No debería ocurrir: el catálogo solo usa las fábricas de
      // presentation.js. Se avisa en pantalla en vez de dejar un hueco mudo.
      return element('p', 'block-text', `Tipo de bloque no reconocido: ${block.kind}`);
  }
}

/**
 * Renderiza el resultado completo de una operación.
 *
 * @param {HTMLElement} container - Cuerpo del panel de resultado.
 * @param {{title: string, blocks: Array<Object>, notes: string[]}} operationResult
 * @returns {void}
 */
export function renderResult(container, operationResult) {
  const fragment = document.createDocumentFragment();

  for (const note of operationResult.notes) {
    fragment.appendChild(element('p', 'note note--warning', note));
  }

  for (const block of operationResult.blocks) {
    const wrapper = element('section', 'block');
    if (block.label) {
      wrapper.appendChild(element('h4', 'block-label', block.label));
    }
    wrapper.appendChild(buildBlockBody(block));
    fragment.appendChild(wrapper);
  }

  container.replaceChildren(fragment);
}

/**
 * Muestra un error de cálculo en el panel de resultado.
 *
 * @param {HTMLElement} container
 * @param {string} message - Mensaje ya legible (ver view/feedback.js).
 * @returns {void}
 */
export function renderError(container, message) {
  container.replaceChildren(element('p', 'note note--error', message));
}

/**
 * Deja el panel en su estado inicial.
 *
 * @param {HTMLElement} container
 * @returns {void}
 */
export function clearResult(container) {
  container.replaceChildren(element('p', 'panel-empty', PLACEHOLDER_MESSAGE));
}
