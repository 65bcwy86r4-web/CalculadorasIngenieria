/**
 * catalog.js
 * ---------------------------------------------------------------------------
 * Descripción: catálogo único de las operaciones de la calculadora de álgebra.
 *   Une los seis grupos, verifica que no haya identificadores repetidos y
 *   expone las consultas que necesita la interfaz.
 *
 *   app.js nunca importa un grupo directamente: pide el catálogo. Agregar una
 *   operación es agregar un descriptor a su archivo de grupo, y nada más — ni
 *   el controlador ni el renderizador se enteran (Open/Closed,
 *   ENGINEERING_GUIDE.md §3).
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ./basic-ops.js, ./determinant-ops.js, ./system-ops.js,
 *   ./matrix-ops.js, ./special-ops.js, ./eigen-ops.js
 *
 * Funciones exportadas: OPERATIONS, getOperation, listGroups
 *
 * @example
 * import { getOperation, listGroups } from './operations/catalog.js';
 * getOperation('det-gauss').label; // 'Determinante (Gauss)'
 * listGroups()[0].operations.length; // 5
 * ---------------------------------------------------------------------------
 */

import { BASIC_OPS } from './basic-ops.js';
import { DETERMINANT_OPS } from './determinant-ops.js';
import { SYSTEM_OPS } from './system-ops.js';
import { MATRIX_OPS } from './matrix-ops.js';
import { SPECIAL_OPS } from './special-ops.js';
import { EIGEN_OPS } from './eigen-ops.js';

/**
 * Orden en que los grupos aparecen en el menú lateral. Es el mismo de
 * legacy/calculadora-algebra-v1, que ya estaba pensado de lo más simple a lo
 * más específico.
 *
 * @type {Array<Array<Object>>}
 */
const GROUPS_IN_ORDER = [
  BASIC_OPS,
  DETERMINANT_OPS,
  SYSTEM_OPS,
  MATRIX_OPS,
  SPECIAL_OPS,
  EIGEN_OPS,
];

/**
 * Todas las operaciones, aplanadas y en orden de menú.
 *
 * @type {Array<Object>}
 */
export const OPERATIONS = GROUPS_IN_ORDER.flat();

/**
 * Índice por id, construido una sola vez al importar el módulo.
 *
 * @type {Map<string, Object>}
 */
const BY_ID = new Map();

for (const operation of OPERATIONS) {
  // Un id repetido dejaría una operación inalcanzable desde el menú sin que
  // nada falle a la vista: mejor que rompa al cargar el módulo.
  if (BY_ID.has(operation.id)) {
    throw new Error(`Catálogo de álgebra: el identificador "${operation.id}" está repetido.`);
  }
  BY_ID.set(operation.id, operation);
}

/**
 * Busca una operación por su identificador.
 *
 * @param {string} id
 * @returns {Object|undefined} El descriptor, o undefined si no existe.
 *
 * @example
 * getOperation('inverse').requiresSquareA; // true
 */
export function getOperation(id) {
  return BY_ID.get(id);
}

/**
 * Devuelve las operaciones agrupadas, para construir el menú lateral.
 *
 * @returns {Array<{name: string, operations: Array<Object>}>}
 *
 * @example
 * listGroups().map((group) => group.name);
 * // ['Propiedades básicas', 'Determinante e inversa', ...]
 */
export function listGroups() {
  return GROUPS_IN_ORDER.map((operations) => ({
    name: operations[0].group,
    operations,
  }));
}
