/**
 * layout-view.js
 * ---------------------------------------------------------------------------
 * Descripción: arma las partes fijas de la pantalla — el menú lateral de
 *   operaciones, el selector de dimensión y la tabla de atajos.
 *
 *   Las tres se construyen desde datos (el catálogo de operaciones y el mapa
 *   de atajos) en vez de estar escritas en el HTML. La razón es concreta:
 *   agregar una operación al catálogo la hace aparecer en el menú sin tocar
 *   ni el HTML ni el controlador, que es lo que pide el principio abierto/
 *   cerrado de ENGINEERING_GUIDE.md §3. Y los atajos que se muestran son los
 *   que efectivamente están conectados, no una lista paralela que se puede
 *   desactualizar.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ../operations/catalog.js, ../services/keyboard.js
 *
 * Funciones exportadas: renderOperationMenu, renderSizeSelector,
 *   renderShortcutHelp, highlightOperation
 *
 * @example
 * import { renderOperationMenu } from './layout-view.js';
 * renderOperationMenu(document.getElementById('opMenu'), (id) => select(id));
 * ---------------------------------------------------------------------------
 */

import { listGroups } from '../operations/catalog.js';
import { SHORTCUT_HELP } from '../services/keyboard.js';

/**
 * Construye el menú lateral agrupado.
 *
 * @param {HTMLElement} container
 * @param {(operationId: string) => void} onSelect
 * @returns {void}
 */
export function renderOperationMenu(container, onSelect) {
  const fragment = document.createDocumentFragment();

  for (const group of listGroups()) {
    const section = document.createElement('div');
    section.className = 'op-group';

    const title = document.createElement('h3');
    title.textContent = group.name;
    section.appendChild(title);

    for (const operation of group.operations) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'op-btn';
      button.dataset.op = operation.id;
      button.textContent = operation.label;
      button.addEventListener('click', () => onSelect(operation.id));
      section.appendChild(button);
    }
    fragment.appendChild(section);
  }

  container.replaceChildren(fragment);
}

/**
 * Marca en el menú cuál es la operación elegida.
 *
 * @param {HTMLElement} container
 * @param {string} operationId
 * @returns {void}
 */
export function highlightOperation(container, operationId) {
  for (const button of container.querySelectorAll('.op-btn')) {
    button.classList.toggle('is-active', button.dataset.op === operationId);
  }
}

/**
 * Llena el selector de dimensión.
 *
 * @param {HTMLSelectElement} select
 * @param {number} minSize
 * @param {number} maxSize
 * @param {number} defaultSize
 * @returns {void}
 */
export function renderSizeSelector(select, minSize, maxSize, defaultSize) {
  const fragment = document.createDocumentFragment();

  for (let size = minSize; size <= maxSize; size += 1) {
    const option = document.createElement('option');
    option.value = String(size);
    option.textContent = `${size} × ${size}`;
    option.selected = size === defaultSize;
    fragment.appendChild(option);
  }
  select.replaceChildren(fragment);
}

/**
 * Muestra los atajos de teclado, tomados del propio servicio que los conecta.
 *
 * @param {HTMLElement} container - Un <dl>.
 * @returns {void}
 */
export function renderShortcutHelp(container) {
  const fragment = document.createDocumentFragment();

  for (const shortcut of SHORTCUT_HELP) {
    const term = document.createElement('dt');
    term.className = 'pairs-name';
    term.textContent = shortcut.keys;

    const description = document.createElement('dd');
    description.className = 'pairs-value';
    description.textContent = shortcut.description;

    fragment.append(term, description);
  }
  container.replaceChildren(fragment);
}
