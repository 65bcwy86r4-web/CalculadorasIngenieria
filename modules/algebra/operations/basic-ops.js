/**
 * basic-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: propiedades básicas de una matriz — transpuesta, traza, rango,
 *   norma de Frobenius y clasificación estructural. Grupo "Propiedades
 *   básicas" del menú, equivalente al de legacy/calculadora-algebra-v1.
 *
 *   Ningún archivo de este directorio calcula nada: cada `run` arma las
 *   entradas, llama al motor y traduce el retorno al modelo de presentación
 *   (AI_RULES.md §4).
 *
 *   Cuatro de estas cinco operaciones usan métodos de la clase Matrix, que
 *   quedan fuera del contrato de `steps` de ADR-007 §3.1 —la tabla de §3.4 no
 *   los alcanza— y por eso devuelven STEPS_NOT_APPLICABLE. `rank` sí es una
 *   función de algebra/ y trae su procedimiento.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (rank), ./presentation.js
 *
 * Funciones exportadas: BASIC_OPS
 *
 * @example
 * import { BASIC_OPS } from './basic-ops.js';
 * BASIC_OPS[0].run({ A: new Matrix([[1, 2], [3, 4]]) }).blocks;
 * ---------------------------------------------------------------------------
 */

import { rank } from '../../../shared/math/index.js';

import {
  matrixBlock,
  scalarBlock,
  pairsBlock,
  flagsBlock,
  result,
  STEPS_NOT_APPLICABLE,
} from './presentation.js';

const GROUP = 'Propiedades básicas';

/**
 * Describe la forma de una matriz para los rótulos ("3×4").
 *
 * @param {import('../../../shared/math/index.js').Matrix} matrix
 * @returns {string}
 */
function dimensionsOf(matrix) {
  return `${matrix.rows}×${matrix.cols}`;
}

/**
 * Catálogo del grupo. Cada descriptor declara qué entradas necesita
 * (`needs`) y si exige que A sea cuadrada; app.js usa eso para mostrar u
 * ocultar paneles y para validar antes de invocar al motor.
 *
 * @type {Array<Object>}
 */
export const BASIC_OPS = [
  {
    id: 'transpose',
    label: 'Transpuesta (Aᵀ)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => result(
      'Transpuesta (Aᵀ)',
      [
        matrixBlock(`Aᵀ (${dimensionsOf(A.transpose())})`, A.transpose().toArray()),
      ],
      STEPS_NOT_APPLICABLE,
    ),
  },

  {
    id: 'trace',
    label: 'Traza',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => result(
      'Traza de A',
      [scalarBlock('tr(A) = Σ aᵢᵢ', A.trace())],
      STEPS_NOT_APPLICABLE,
    ),
  },

  {
    id: 'rank',
    label: 'Rango',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => {
      const outcome = rank(A);
      return result(
        'Rango de A',
        [
          scalarBlock('rg(A)', outcome.rank),
          pairsBlock('Interpretación', [
            {
              name: 'Filas linealmente independientes',
              value: `${outcome.rank} de ${A.rows}`,
            },
            {
              name: 'Columnas linealmente independientes',
              value: `${outcome.rank} de ${A.cols}`,
            },
          ]),
          matrixBlock('Forma escalonada usada para contarlo', outcome.echelon.toArray()),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'norm',
    label: 'Norma de Frobenius',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => result(
      'Norma de Frobenius',
      [scalarBlock('‖A‖_F = √(Σ aᵢⱼ²)', A.frobeniusNorm())],
      STEPS_NOT_APPLICABLE,
    ),
  },

  {
    id: 'classify',
    label: 'Clasificar matriz',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => result(
      'Clasificación de A',
      [
        flagsBlock(`Propiedades estructurales (${dimensionsOf(A)})`, [
          { name: 'Cuadrada', active: A.isSquare() },
          { name: 'Simétrica (A = Aᵀ)', active: A.isSymmetric() },
          { name: 'Diagonal', active: A.isDiagonal() },
          { name: 'Triangular superior', active: A.isUpperTriangular() },
          { name: 'Triangular inferior', active: A.isLowerTriangular() },
          { name: 'Identidad', active: A.isIdentity() },
        ]),
      ],
      STEPS_NOT_APPLICABLE,
    ),
  },
];
