/**
 * history-view.js
 * ---------------------------------------------------------------------------
 * Descripción: dibuja la lista del cajón de historial.
 *
 *   Recibe las entradas ya guardadas y dos callbacks —abrir y eliminar—, así
 *   que no conoce el servicio de historial ni el controlador: se le puede
 *   pasar cualquier lista con la misma forma.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ninguna.
 *
 * Funciones exportadas: renderHistoryList
 *
 * @example
 * import { renderHistoryList } from './history-view.js';
 * renderHistoryList(list, history.list(), { onOpen: restore, onRemove: drop });
 * ---------------------------------------------------------------------------
 */

const EMPTY_MESSAGE = 'Todavía no hay cálculos guardados.';

/**
 * Crea uno de los dos botones de una entrada.
 *
 * @param {string} text
 * @param {() => void} onClick
 * @returns {HTMLButtonElement}
 */
function actionButton(text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'link-btn';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Dibuja una entrada.
 *
 * @param {{id: string, label: string, size: number, savedAt: string}} entry
 * @param {{onOpen: (id: string) => void, onRemove: (id: string) => void}} handlers
 * @returns {HTMLElement}
 */
function buildEntry(entry, handlers) {
  const item = document.createElement('article');
  item.className = 'history-item';

  const meta = document.createElement('span');
  meta.className = 'history-meta';
  meta.textContent = `${entry.size}×${entry.size} · ${new Date(entry.savedAt).toLocaleString('es-AR')}`;

  item.append(
    actionButton(entry.label, () => handlers.onOpen(entry.id)),
    meta,
    actionButton('Eliminar', () => handlers.onRemove(entry.id)),
  );
  return item;
}

/**
 * Renderiza la lista completa.
 *
 * @param {HTMLElement} container
 * @param {Array<Object>} entries - Del más reciente al más viejo.
 * @param {{onOpen: (id: string) => void, onRemove: (id: string) => void}} handlers
 * @returns {void}
 */
export function renderHistoryList(container, entries, handlers) {
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = EMPTY_MESSAGE;
    container.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    fragment.appendChild(buildEntry(entry, handlers));
  }
  container.replaceChildren(fragment);
}
