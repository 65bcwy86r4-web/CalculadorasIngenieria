/**
 * matrix-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: operaciones entre matrices y con escalares — suma, resta,
 *   producto, multiplicación por escalar y potencia. Grupo "Operaciones entre
 *   matrices" del menú.
 *
 *   Las cinco son métodos de la clase Matrix, que quedan fuera del contrato de
 *   `steps` (ADR-007 §3.4 no las alcanza): devuelven STEPS_NOT_APPLICABLE.
 *   La validación de compatibilidad dimensional la hace el motor y lanza
 *   DimensionError; acá no se reimplementa (AI_RULES.md §12 y §21).
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ./presentation.js. No importa funciones del motor: opera sobre
 *   las instancias de Matrix que app.js ya construyó.
 *
 * Funciones exportadas: MATRIX_OPS
 *
 * @example
 * import { MATRIX_OPS } from './matrix-ops.js';
 * MATRIX_OPS.find((op) => op.id === 'multiply').run({ A, B });
 * ---------------------------------------------------------------------------
 */

import {
  matrixBlock,
  pairsBlock,
  result,
  STEPS_NOT_APPLICABLE,
} from './presentation.js';

const GROUP = 'Operaciones entre matrices';

/**
 * Arma el resultado de una operación que devuelve una sola matriz.
 *
 * @param {string} title
 * @param {string} label
 * @param {import('../../../shared/math/index.js').Matrix} matrix
 * @param {Array<{name: string, value: string|number}>} [details=[]]
 * @returns {Object}
 */
function singleMatrixResult(title, label, matrix, details = []) {
  const blocks = [matrixBlock(label, matrix.toArray())];
  if (details.length > 0) {
    blocks.push(pairsBlock('Detalle', details));
  }
  return result(title, blocks, STEPS_NOT_APPLICABLE);
}

/**
 * @type {Array<Object>}
 */
export const MATRIX_OPS = [
  {
    id: 'add',
    label: 'Suma (A + B)',
    group: GROUP,
    needs: { A: true, B: true },
    requiresSquareA: false,
    run: ({ A, B }) => singleMatrixResult('Suma A + B', 'A + B', A.add(B)),
  },

  {
    id: 'subtract',
    label: 'Resta (A − B)',
    group: GROUP,
    needs: { A: true, B: true },
    requiresSquareA: false,
    run: ({ A, B }) => singleMatrixResult('Resta A − B', 'A − B', A.subtract(B)),
  },

  {
    id: 'multiply',
    label: 'Producto (A · B)',
    group: GROUP,
    needs: { A: true, B: true },
    requiresSquareA: false,
    run: ({ A, B }) => singleMatrixResult(
      'Producto A · B',
      'A · B',
      A.multiply(B),
      [{ name: 'Dimensiones', value: `(${A.rows}×${A.cols}) · (${B.rows}×${B.cols}) = ${A.rows}×${B.cols}` }],
    ),
  },

  {
    id: 'scalar',
    label: 'Multiplicación por escalar',
    group: GROUP,
    needs: { A: true, scalar: true },
    requiresSquareA: false,
    run: ({ A, scalar }) => singleMatrixResult(
      'Multiplicación por escalar',
      `${scalar} · A`,
      A.scalarMultiply(scalar),
      [{ name: 'Escalar k', value: scalar }],
    ),
  },

  {
    id: 'power',
    label: 'Potencia (Aⁿ)',
    group: GROUP,
    needs: { A: true, power: true },
    requiresSquareA: true,
    run: ({ A, power }) => singleMatrixResult(
      'Potencia de una matriz',
      `A^${power}`,
      A.power(power),
      [{ name: 'Exponente n', value: power }],
    ),
  },
];
