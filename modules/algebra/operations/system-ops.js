/**
 * system-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: eliminación de Gauss, Gauss-Jordan y resolución de sistemas
 *   Ax = b. Grupo "Sistemas y eliminación" del menú.
 *
 *   Las tres traen procedimiento completo desde el motor.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (rowEchelon, reducedRowEchelon,
 *   solveSystem), ./presentation.js
 *
 * Funciones exportadas: SYSTEM_OPS
 *
 * @example
 * import { SYSTEM_OPS } from './system-ops.js';
 * SYSTEM_OPS.find((op) => op.id === 'solve').run({ A, vector: [8, 13] });
 * ---------------------------------------------------------------------------
 */

import {
  rowEchelon,
  reducedRowEchelon,
  solveSystem,
} from '../../../shared/math/index.js';

import {
  matrixBlock,
  vectorBlock,
  pairsBlock,
  textBlock,
  result,
} from './presentation.js';

const GROUP = 'Sistemas y eliminación';

/**
 * Texto de la clasificación de un sistema, indexado por el valor del
 * discriminante que devuelve `solveSystem`.
 *
 * @type {Object<string, string>}
 */
const CLASSIFICATION_TEXT = {
  unique: 'Sistema compatible determinado: existe una única solución.',
  infinite: 'Sistema compatible indeterminado: existen infinitas soluciones.',
  incompatible: 'Sistema incompatible: no existe solución.',
};

/**
 * Lee el discriminante del retorno de `solveSystem`.
 *
 * Por qué no se lee `outcome.type` directo: la enmienda de ADR-007 §3.3 (D16)
 * lo renombra a `classification` en el Paso 2c-2, que corre en paralelo a esta
 * sesión. Leer los dos nombres deja la calculadora funcionando con el motor de
 * hoy y con el de después, sin quedar atada al orden en que se cierren las
 * sesiones. Cuando el Paso 2c-2 esté cerrado, esta función se reduce a una
 * línea y el `??` se borra.
 *
 * @param {Object} outcome - Retorno de `solveSystem`.
 * @returns {string} 'unique' | 'infinite' | 'incompatible'
 */
function classificationOf(outcome) {
  return outcome.classification ?? outcome.type;
}

/**
 * Bloques comunes a las dos operaciones de escalonamiento.
 *
 * @param {Object} outcome - Retorno de `rowEchelon` o `reducedRowEchelon`.
 * @param {string} label - Rótulo de la matriz resultante.
 * @returns {Array<Object>}
 */
function echelonBlocks(outcome, label) {
  return [
    matrixBlock(label, outcome.result.toArray()),
    pairsBlock('Detalle del método', [
      { name: 'Pivotes encontrados', value: outcome.pivots.length },
      { name: 'Intercambios de fila', value: outcome.swapCount },
    ]),
  ];
}

/**
 * @type {Array<Object>}
 */
export const SYSTEM_OPS = [
  {
    id: 'gauss',
    label: 'Escalonar (Gauss)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => {
      const outcome = rowEchelon(A);
      return result(
        'Forma escalonada por filas',
        echelonBlocks(outcome, 'Forma escalonada de A'),
        outcome.steps,
      );
    },
  },

  {
    id: 'gaussjordan',
    label: 'Escalonar reducida (Gauss-Jordan)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => {
      const outcome = reducedRowEchelon(A);
      return result(
        'Forma escalonada reducida',
        echelonBlocks(outcome, 'Forma escalonada reducida de A'),
        outcome.steps,
      );
    },
  },

  {
    id: 'solve',
    label: 'Resolver Ax = b',
    group: GROUP,
    needs: { A: true, vectorB: true },
    requiresSquareA: true,
    run: ({ A, vector }) => {
      const outcome = solveSystem(A, vector);
      const classification = classificationOf(outcome);

      const blocks = [textBlock('Clasificación', CLASSIFICATION_TEXT[classification])];

      if (classification === 'unique') {
        blocks.push(vectorBlock('Solución x', outcome.solution));
      }
      if (outcome.rref) {
        blocks.push(matrixBlock('Matriz ampliada [A | b] reducida', outcome.rref.toArray()));
      }
      blocks.push(pairsBlock('Teorema de Rouché-Frobenius', [
        { name: 'rg(A)', value: outcome.rankA },
        { name: 'rg(A | b)', value: outcome.rankAug },
        { name: 'Incógnitas', value: A.cols },
      ]));

      return result(`Resolución de Ax = b`, blocks, outcome.steps);
    },
  },
];
