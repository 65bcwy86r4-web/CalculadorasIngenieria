/**
 * eigen-ops.js
 * ---------------------------------------------------------------------------
 * Descripción: autovalores, autovectores, diagonalización y las tres
 *   descomposiciones matriciales (LU, QR, Cholesky). Grupo "Autovalores y
 *   descomposiciones" del menú.
 *
 *   Se usa `eigenvalues`, que despacha al método adecuado según el tipo de
 *   matriz (ADR-005), y se muestra en pantalla cuál corrió. La V1 llamaba
 *   siempre al QR iterativo y devolvía valores incorrectos en matrices
 *   simétricas con autovalores de igual módulo (H-03): esta calculadora no
 *   reproduce ese defecto porque el motor ya no lo tiene.
 *
 *   `eigenvectors` necesita los autovalores como argumento, así que esa
 *   operación encadena dos llamadas al motor. Encadenar no es implementar: no
 *   se calcula nada acá (AI_RULES.md §4).
 *
 *   De las seis, solo `luDecomposition` trae pasos hoy. Las otras cinco
 *   devuelven `steps: []` hasta el Paso 2c-2.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (eigenvalues, eigenvectors, diagonalize,
 *   luDecomposition, qrDecomposition, choleskyDecomposition), ./presentation.js
 *
 * Funciones exportadas: EIGEN_OPS
 *
 * @example
 * import { EIGEN_OPS } from './eigen-ops.js';
 * EIGEN_OPS.find((op) => op.id === 'eigenvalues').run({ A });
 * ---------------------------------------------------------------------------
 */

import {
  eigenvalues,
  eigenvectors,
  diagonalize,
  luDecomposition,
  qrDecomposition,
  choleskyDecomposition,
} from '../../../shared/math/index.js';

import {
  matrixBlock,
  vectorBlock,
  pairsBlock,
  result,
} from './presentation.js';
import { formatValue } from '../format-values.js';

const GROUP = 'Autovalores y descomposiciones';

/**
 * Nombre legible de cada método al que puede despachar `eigenvalues`. Los
 * valores de la izquierda son los que documenta API.md para la clave `method`.
 *
 * @type {Object<string, string>}
 */
const METHOD_LABELS = {
  trivial: 'Caso trivial 1×1: el autovalor es el único elemento',
  jacobi: 'Rotaciones de Jacobi (matriz simétrica)',
  'closed-form-2x2': 'Forma cerrada del polinomio característico (2×2 no simétrica)',
  qr: 'Algoritmo QR iterativo (caso general)',
};

/**
 * Advertencia de espectro posiblemente complejo, cuando el motor la marca.
 *
 * @param {boolean} hasComplexHint
 * @returns {string[]}
 */
function complexNotes(hasComplexHint) {
  return hasComplexHint
    ? ['El motor detectó que el espectro puede tener pares complejos conjugados, '
       + 'que todavía no representa. Los valores mostrados pueden no ser los autovalores reales.']
    : [];
}

/**
 * @type {Array<Object>}
 */
export const EIGEN_OPS = [
  {
    id: 'eigenvalues',
    label: 'Autovalores',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = eigenvalues(A);
      return result(
        'Autovalores de A',
        [
          vectorBlock('λ (de mayor a menor)', outcome.values, 'row'),
          pairsBlock('Detalle del método', [
            { name: 'Método despachado', value: METHOD_LABELS[outcome.method] ?? outcome.method },
            { name: 'Suma de autovalores (debe dar tr(A))', value: outcome.values.reduce((total, value) => total + value, 0) },
            { name: 'Traza de A', value: A.trace() },
          ]),
        ],
        outcome.steps,
        complexNotes(outcome.hasComplexHint),
      );
    },
  },

  {
    id: 'eigenvectors',
    label: 'Autovectores',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const spectrum = eigenvalues(A);
      const outcome = eigenvectors(A, spectrum.values);

      const blocks = outcome.vectors.map((pair, index) => (pair.vector === null
        ? pairsBlock(`λ${index + 1}`, [
          { name: 'Autovalor', value: pair.lambda },
          { name: 'Autovector', value: 'No se pudo determinar (núcleo trivial dentro de la tolerancia)' },
        ])
        // El autovalor va dentro del rótulo, así que acá sí se formatea: un
        // rótulo es texto, y "λ = 10.091932979647874" no se lee.
        : vectorBlock(`v${index + 1} para λ = ${formatValue(pair.lambda)}`, pair.vector, 'row')));

      return result(
        'Autovectores de A',
        blocks,
        outcome.steps,
        complexNotes(spectrum.hasComplexHint),
      );
    },
  },

  {
    id: 'diagonalization',
    label: 'Diagonalización (A = PDP⁻¹)',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = diagonalize(A);
      return result(
        'Diagonalización A = P·D·P⁻¹',
        [
          matrixBlock('P (autovectores como columnas)', outcome.P.toArray()),
          matrixBlock('D (autovalores en la diagonal)', outcome.D.toArray()),
          matrixBlock('P⁻¹', outcome.Pinv.toArray()),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'lu',
    label: 'Descomposición LU',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = luDecomposition(A);
      return result(
        'Descomposición LU con pivoteo parcial (P·A = L·U)',
        [
          matrixBlock('L (triangular inferior)', outcome.L.toArray()),
          matrixBlock('U (triangular superior)', outcome.U.toArray()),
          matrixBlock('P (permutación)', outcome.P.toArray()),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'qr',
    label: 'Factorización QR',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: false,
    run: ({ A }) => {
      const outcome = qrDecomposition(A);
      return result(
        'Factorización QR por Gram-Schmidt (A = Q·R)',
        [
          matrixBlock('Q (columnas ortonormales)', outcome.Q.toArray()),
          matrixBlock('R (triangular superior)', outcome.R.toArray()),
        ],
        outcome.steps,
      );
    },
  },

  {
    id: 'cholesky',
    label: 'Descomposición de Cholesky',
    group: GROUP,
    needs: { A: true },
    requiresSquareA: true,
    run: ({ A }) => {
      const outcome = choleskyDecomposition(A);
      return result(
        'Descomposición de Cholesky (A = L·Lᵀ)',
        [
          matrixBlock('L', outcome.L.toArray()),
          matrixBlock('Lᵀ', outcome.Lt.toArray()),
        ],
        outcome.steps,
      );
    },
  },
];
