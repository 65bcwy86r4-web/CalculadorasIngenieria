/**
 * special-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: construcción de matrices especiales — identidad y diagonal.
 *   Grupo "Matrices especiales" del menú.
 *
 *   Son las dos únicas operaciones que no leen la matriz A: la identidad se
 *   construye con la dimensión elegida en la barra superior, y la diagonal con
 *   los valores del vector b. Usan los constructores estáticos de Matrix, así
 *   que quedan fuera del contrato de `steps`.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (Matrix), ./presentation.js
 *
 * Funciones exportadas: SPECIAL_OPS
 *
 * @example
 * import { SPECIAL_OPS } from './special-ops.js';
 * SPECIAL_OPS.find((op) => op.id === 'identity').run({ size: 3 });
 * ---------------------------------------------------------------------------
 */

import { Matrix } from '../../../shared/math/index.js';

import { matrixBlock, pairsBlock, result, STEPS_NOT_APPLICABLE } from './presentation.js';

const GROUP = 'Matrices especiales';

/**
 * @type {Array<Object>}
 */
export const SPECIAL_OPS = [
  {
    id: 'identity',
    label: 'Matriz identidad',
    group: GROUP,
    needs: {},
    requiresSquareA: false,
    run: ({ size }) => result(
      'Matriz identidad',
      [
        matrixBlock(`I${size}`, Matrix.identity(size).toArray()),
        pairsBlock('Detalle', [
          { name: 'Dimensión', value: `${size}×${size}` },
          { name: 'Propiedad', value: 'A · I = I · A = A para toda A de esa dimensión' },
        ]),
      ],
      STEPS_NOT_APPLICABLE,
    ),
  },

  {
    id: 'diagonal',
    label: 'Construir matriz diagonal',
    group: GROUP,
    needs: { vectorB: true },
    requiresSquareA: false,
    run: ({ vector }) => result(
      'Matriz diagonal',
      [
        matrixBlock('diag(v)', Matrix.diagonal(vector).toArray()),
        pairsBlock('Detalle', [
          { name: 'Elementos de la diagonal', value: vector.length },
          { name: 'Traza', value: vector.reduce((total, value) => total + value, 0) },
        ]),
      ],
      STEPS_NOT_APPLICABLE,
    ),
  },
];
