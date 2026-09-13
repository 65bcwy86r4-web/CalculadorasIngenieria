/**
 * keyboard.js
 * ---------------------------------------------------------------------------
 * Descripción: los seis atajos de teclado de la calculadora, los mismos que
 *   documenta legacy/calculadora-algebra-v1/README.md.
 *
 *   El servicio no sabe qué hace cada atajo: recibe las acciones y las
 *   dispara. Así, el mapa de teclas queda en un solo lugar y agregar o cambiar
 *   uno no toca el controlador.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ninguna.
 *
 * Funciones exportadas: bindShortcuts, SHORTCUT_HELP
 *
 * @example
 * import { bindShortcuts } from './keyboard.js';
 * bindShortcuts(document, { run: () => calculate(), toggleHistory: () => {} });
 * ---------------------------------------------------------------------------
 */

/**
 * Tecla (en minúscula) → nombre de la acción. Todos se disparan con Ctrl o
 * Cmd; Enter es el único que además se acepta con el foco dentro de una celda,
 * que es donde el usuario está mientras carga la matriz.
 *
 * @type {Object<string, string>}
 */
const KEY_TO_ACTION = {
  n: 'generate',
  enter: 'run',
  d: 'determinant',
  e: 'exportText',
  h: 'toggleHistory',
  b: 'toggleSidebar',
};

/**
 * Descripción de los atajos, para mostrarla en la interfaz sin repetir el mapa.
 *
 * @type {Array<{keys: string, description: string}>}
 */
export const SHORTCUT_HELP = [
  { keys: 'Ctrl/Cmd + N', description: 'Generar una nueva matriz' },
  { keys: 'Ctrl/Cmd + Enter', description: 'Calcular la operación elegida' },
  { keys: 'Ctrl/Cmd + D', description: 'Calcular el determinante por Gauss' },
  { keys: 'Ctrl/Cmd + E', description: 'Exportar el resultado como TXT' },
  { keys: 'Ctrl/Cmd + H', description: 'Abrir o cerrar el historial' },
  { keys: 'Ctrl/Cmd + B', description: 'Mostrar u ocultar el menú lateral' },
];

/**
 * Conecta los atajos.
 *
 * @param {Document|HTMLElement} target - Dónde escuchar; normalmente document.
 * @param {Object<string, Function>} actions - Un callback por acción del mapa.
 *   Las acciones que falten simplemente no hacen nada.
 * @returns {() => void} Función para desconectar los atajos.
 */
export function bindShortcuts(target, actions) {
  /**
   * @param {KeyboardEvent} event
   * @returns {void}
   */
  const handler = (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    const action = KEY_TO_ACTION[event.key.toLowerCase()];
    if (action === undefined || typeof actions[action] !== 'function') {
      return;
    }
    // Ctrl+N, Ctrl+D y Ctrl+E tienen significado en el navegador; sin esto,
    // el atajo abriría una ventana nueva o un marcador en vez de calcular.
    event.preventDefault();
    actions[action]();
  };

  target.addEventListener('keydown', handler);
  return () => target.removeEventListener('keydown', handler);
}
