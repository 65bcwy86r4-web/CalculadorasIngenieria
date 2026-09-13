/**
 * history.js
 * ---------------------------------------------------------------------------
 * Descripción: historial de cálculos de la calculadora de álgebra.
 *
 *   Guarda, para cada cálculo, lo necesario para reabrirlo: la operación, las
 *   matrices de entrada y el título del resultado. **No guarda el resultado**:
 *   reabrir una entrada vuelve a cargar los datos y a invocar al motor, así
 *   que lo que se muestra siempre lo produjo la versión actual del motor. Un
 *   historial que guardara resultados mostraría, después de una corrección
 *   como H-03, valores viejos e incorrectos sin ninguna señal.
 *
 *   Persiste en localStorage. Toda lectura y escritura va envuelta: el
 *   navegador puede tener el almacenamiento bloqueado o lleno, y en ese caso
 *   la calculadora sigue funcionando con el historial en memoria y lo avisa
 *   una vez.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ninguna.
 *
 * Funciones exportadas: createHistory
 *
 * @example
 * import { createHistory } from './history.js';
 * const history = createHistory();
 * history.add({ operationId: 'inverse', title: 'Matriz inversa', inputs: {...} });
 * history.list();
 * ---------------------------------------------------------------------------
 */

const STORAGE_KEY = 'calculadoras-ingenieria:algebra:historial';
const MAX_ENTRIES = 40;

/**
 * Lee el historial guardado.
 *
 * @returns {{entries: Array<Object>, available: boolean}}
 */
function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? [] : JSON.parse(raw);
    return { entries: Array.isArray(parsed) ? parsed : [], available: true };
  } catch {
    // Almacenamiento bloqueado, lleno o con contenido corrupto. Ninguno de los
    // tres es motivo para que la calculadora deje de calcular.
    return { entries: [], available: false };
  }
}

/**
 * Persiste el historial.
 *
 * @param {Array<Object>} entries
 * @returns {boolean} true si se pudo guardar.
 */
function writeStorage(entries) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea el servicio de historial.
 *
 * Es una fábrica y no un módulo con estado suelto porque el estado global es
 * exactamente lo que prohíbe ENGINEERING_GUIDE.md §9: quien lo necesita lo
 * recibe, y en las pruebas se puede crear uno limpio.
 *
 * @returns {{
 *   add: (entry: Object) => Object,
 *   list: () => Array<Object>,
 *   get: (id: string) => Object|undefined,
 *   remove: (id: string) => void,
 *   clear: () => void,
 *   isPersistent: () => boolean
 * }}
 */
export function createHistory() {
  const initial = readStorage();
  let entries = initial.entries;
  let persistent = initial.available;

  /**
   * Guarda el estado actual, degradando a memoria si el navegador rechaza.
   *
   * @returns {void}
   */
  const persist = () => {
    if (persistent && !writeStorage(entries)) {
      persistent = false;
    }
  };

  return {
    /**
     * Agrega un cálculo al principio del historial.
     *
     * @param {{operationId: string, title: string, inputs: Object}} entry
     * @returns {Object} La entrada guardada, con id y fecha.
     */
    add(entry) {
      const stored = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        savedAt: new Date().toISOString(),
      };
      entries = [stored, ...entries].slice(0, MAX_ENTRIES);
      persist();
      return stored;
    },

    /**
     * @returns {Array<Object>} Del más reciente al más viejo.
     */
    list() {
      return [...entries];
    },

    /**
     * @param {string} id
     * @returns {Object|undefined}
     */
    get(id) {
      return entries.find((entry) => entry.id === id);
    },

    /**
     * @param {string} id
     * @returns {void}
     */
    remove(id) {
      entries = entries.filter((entry) => entry.id !== id);
      persist();
    },

    /**
     * @returns {void}
     */
    clear() {
      entries = [];
      persist();
    },

    /**
     * @returns {boolean} false si el historial vive solo en memoria y se va a
     *   perder al recargar.
     */
    isPersistent() {
      return persistent;
    },
  };
}
