/**
 * determinant-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: determinante (por Gauss y por cofactores), inversa, matriz de
 *   cofactores, adjunta y número de condición. Grupo "Determinante e inversa"
 *   del menú.
 *
 *   Las seis son funciones de shared/math/algebra/ alcanzadas por el contrato
 *   de ADR-007, así que las seis devuelven `steps`. Tres lo traen lleno
 *   (determinantByGauss, inverse, conditionNumber —esta última propaga los de
 *   la inversión que hace igual) y tres lo traen vacío hasta el Paso 2c-2
 *   (determinantByCofactors, cofactorMatrix, adjugate). No hay nada que hacer
 *   al respecto acá: se pasan como vienen y el panel de procedimiento avisa.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (determinantByGauss, determinantByCofactors,
 *   inverse, cofactorMatrix, adjugate, conditionNumber), ./presentation.js
 *
 * Funciones exportadas: DETERMINANT_OPS
 *
 * @example
 * import { DETERMINANT_OPS } from './determinant-ops.js';
 * DETERMINANT_OPS.find((op) => op.id === 'det-gauss').run({ A });
 * ---------------------------------------------------------------------------
 */

import {
  determinantByGauss,
  determinantByCofactors,
  inverse,
  cofactorMatrix,
  adjugate,
  conditionNumber,
} from '../../../shared/math/index.js';

import { matrixBlock, scalarBlock, pairsBlock, result } from './presentation.js';

const GROUP = 'Determinante e inversa';

/**
 * Cota de tamaño de la expansión por cofactores. No es una regla nuestra: el
 * motor lanza MathError('TOO_LARGE_FOR_COFACTORS') por encima de 7, porque el
 * método es O(n!). Se repite acá solo para poder avisarlo antes de calcular,
 * en vez de dejar que el usuario espere y reciba una excepción.
 *
 * @type {number}
 */
const MAX_COFACTOR_SIZE = 7;

/**
 * @type {Array<Object>}
 */
export const DETERMINANT_OPS = [
  {
    id: 'det-gauss',
    label: 'Determinante (Gauss)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = determinantByGauss(A);
      return result(
        'Determinante por eliminación de Gauss',
        [
          scalarBlock('det(A)', outcome.value),
          pairsBlock('Detalle del método', [
            { name: 'Método', value: 'Triangulación con pivoteo parcial — O(n³)' },
            { name: 'Intercambios de fila', value: outcome.swapCount },
            {
              name: 'Signo por los intercambios',
              value: outcome.swapCount % 2 === 0 ? '+1 (par)' : '−1 (impar)',
            },
          ]),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'det-cofactor',
    label: 'Determinante (cofactores, teoría)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = determinantByCofactors(A);
      return result(
        'Determinante por expansión de cofactores',
        [
          scalarBlock('det(A)', outcome.value),
          pairsBlock('Detalle del método', [
            { name: 'Método', value: 'Expansión de Laplace — O(n!)' },
            { name: 'Uso recomendado', value: 'Teórico. Para calcular, usar Gauss' },
          ]),
        ],
        outcome.steps,
        A.rows > 4
          ? ['La expansión de Laplace crece factorialmente: para esta dimensión, '
             + 'el determinante por Gauss da el mismo valor mucho más rápido.']
          : [],
      );
    },
    /**
     * Aviso previo al cálculo, para no hacer esperar al usuario hasta que el
     * motor lance TOO_LARGE_FOR_COFACTORS.
     *
     * @param {{A: import('../../../shared/math/index.js').Matrix}} inputs
     * @returns {string|null} Mensaje de bloqueo, o null si se puede calcular.
     */
    precheck: ({ A }) => (A.rows > MAX_COFACTOR_SIZE
      ? `La expansión por cofactores está limitada a matrices de hasta ${MAX_COFACTOR_SIZE}×${MAX_COFACTOR_SIZE} por su costo O(n!). Usá el determinante por Gauss.`
      : null),
  },

  {
    id: 'inverse',
    label: 'Matriz inversa (Gauss-Jordan)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = inverse(A);
      return result(
        'Matriz inversa (A⁻¹)',
        [matrixBlock('A⁻¹', outcome.inverse.toArray())],
        outcome.steps,
      );
    },
  },

  {
    id: 'adjugate',
    label: 'Matriz adjunta',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = adjugate(A);
      return result(
        'Matriz adjunta (adj A)',
        [
          matrixBlock('adj(A) = Cᵀ', outcome.matrix.toArray()),
          pairsBlock('Detalle del método', [
            {
              name: 'Camino usado por el motor',
              value: A.rows > 6
                ? 'det(A)·A⁻¹ (más eficiente para n > 6)'
                : 'Transpuesta de la matriz de cofactores',
            },
          ]),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'cofactors',
    label: 'Matriz de cofactores',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = cofactorMatrix(A);
      return result(
        'Matriz de cofactores (C)',
        [matrixBlock('Cᵢⱼ = (−1)^(i+j) · det(menor ᵢⱼ)', outcome.matrix.toArray())],
        outcome.steps,
      );
    },
  },

  {
    id: 'condition',
    label: 'Número de condición',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = conditionNumber(A);
      return result(
        'Número de condición κ(A)',
        [
          scalarBlock('κ(A) = ‖A‖_F · ‖A⁻¹‖_F', outcome.value),
          pairsBlock('Componentes', [
            { name: '‖A‖_F', value: outcome.normA },
            { name: '‖A⁻¹‖_F', value: outcome.normInverse },
          ]),
        ],
        outcome.steps,
        outcome.value > 1e4
          ? ['κ(A) alto: el sistema es sensible a perturbaciones en los datos. '
             + 'Un error relativo de entrada puede amplificarse en esa proporción en el resultado.']
          : [],
      );
    },
  },
];
