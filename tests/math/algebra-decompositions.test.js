/**
 * tests/math/algebra-decompositions.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de las tres descomposiciones matriciales: luDecomposition,
 * qrDecomposition y choleskyDecomposition.
 *
 * Acá se verifica la FORMA de cada factor (que L sea triangular inferior con
 * unos en la diagonal, que Q tenga columnas ortonormales, que P sea una
 * permutación) y los casos de error. La reconstrucción del producto
 * (L·U = P·A, Q·R = A, L·Lᵀ = A) vive en cross-checks.test.js: es una
 * verificación entre métodos, no una prueba unitaria, y conviene que una falla
 * ahí se lea como tal.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  luDecomposition, qrDecomposition, choleskyDecomposition,
  Matrix, MathError, DimensionError, SingularMatrixError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertClose, assertMatrixClose, assertThrows,
} from '../assert.js';

/** Matriz simétrica definida positiva de referencia (bibliografía clásica). */
const SDP_3X3 = new Matrix([[4, 12, -16], [12, 37, -43], [-16, -43, 98]]);

export const tests = [
  /* --------------------------------- LU --------------------------------- */
  {
    name: 'luDecomposition devuelve L triangular inferior con unos en la diagonal',
    fn: () => {
      const { L } = luDecomposition(new Matrix([[4, 3], [6, 3]]));
      assertTrue(L.isLowerTriangular(1e-9), 'L debería ser triangular inferior.');
      for (let i = 0; i < L.rows; i += 1) {
        assertClose(L.get(i, i), 1, `L(${i},${i}) debería valer 1 (factorización de Doolittle).`);
      }
    },
  },
  {
    name: 'luDecomposition devuelve U triangular superior',
    fn: () => {
      const { U } = luDecomposition(new Matrix([[4, 3], [6, 3]]));
      assertTrue(U.isUpperTriangular(1e-9), 'U debería ser triangular superior.');
    },
  },
  {
    name: 'P es una matriz de permutación legítima',
    fn: () => {
      // Cada fila y cada columna de P debe tener exactamente un 1 y el resto 0.
      const { P } = luDecomposition(new Matrix([[0, 1], [1, 0]]));
      const filas = P.toArray();
      filas.forEach((fila, i) => {
        const unos = fila.filter((v) => Math.abs(v - 1) < 1e-9).length;
        const ceros = fila.filter((v) => Math.abs(v) < 1e-9).length;
        assertClose(unos, 1, `La fila ${i} de P debería tener exactamente un 1.`);
        assertClose(ceros, fila.length - 1, `El resto de la fila ${i} debería ser cero.`);
      });
      for (let j = 0; j < P.cols; j += 1) {
        const columna = filas.map((fila) => fila[j]);
        assertClose(
          columna.filter((v) => Math.abs(v - 1) < 1e-9).length,
          1,
          `La columna ${j} de P debería tener exactamente un 1.`,
        );
      }
    },
  },
  {
    name: 'luDecomposition de una matriz que no necesita pivoteo deja P = I',
    fn: () => {
      const { P } = luDecomposition(new Matrix([[4, 3], [2, 3]]));
      assertTrue(P.isIdentity(1e-9), 'Sin intercambios, P debería ser la identidad.');
    },
  },
  {
    name: 'luDecomposition descompone la 1x1',
    fn: () => {
      const { L, U, P } = luDecomposition(new Matrix([[5]]));
      assertMatrixClose(L, [[1]], 'L de una 1x1.');
      assertMatrixClose(U, [[5]], 'U de una 1x1.');
      assertMatrixClose(P, [[1]], 'P de una 1x1.');
    },
  },
  {
    name: 'luDecomposition rechaza matriz singular y no cuadrada',
    fn: () => {
      assertThrows(
        () => luDecomposition(new Matrix([[1, 2], [2, 4]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'LU de una matriz singular.',
      );
      assertThrows(
        () => luDecomposition(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'LU de una 2x3.',
      );
    },
  },

  /* --------------------------------- QR --------------------------------- */
  {
    name: 'qrDecomposition devuelve R triangular superior',
    fn: () => {
      const { R } = qrDecomposition(new Matrix([[12, -51], [6, 167], [-4, 24]]));
      assertTrue(R.isUpperTriangular(1e-9), 'R debería ser triangular superior.');
    },
  },
  {
    name: 'las columnas de Q son ortonormales',
    fn: () => {
      // QᵀQ = I es la definición de ortonormalidad de columnas, y es lo que
      // distingue una QR correcta de una que simplemente reconstruye A.
      const { Q } = qrDecomposition(new Matrix([[12, -51], [6, 167], [-4, 24]]));
      const qtq = Q.transpose().multiply(Q);
      assertMatrixClose(qtq, Matrix.identity(qtq.rows).toArray(), 'QᵀQ debería ser la identidad.', 1e-9);
    },
  },
  {
    name: 'qrDecomposition de la identidad es trivial',
    fn: () => {
      const { Q, R } = qrDecomposition(Matrix.identity(3));
      assertMatrixClose(Q, Matrix.identity(3).toArray(), 'Q = I.');
      assertMatrixClose(R, Matrix.identity(3).toArray(), 'R = I.');
    },
  },
  {
    name: 'qrDecomposition acepta matrices rectangulares altas',
    fn: () => {
      const { Q, R } = qrDecomposition(new Matrix([[1, 1], [0, 1], [1, 0]]));
      assertClose(Q.rows, 3, 'Q conserva la cantidad de filas de A.');
      assertClose(R.cols, 2, 'R conserva la cantidad de columnas de A.');
      assertTrue(R.isUpperTriangular(1e-9), 'R sigue siendo triangular superior.');
    },
  },
  {
    name: 'la diagonal de R no es nula para columnas linealmente independientes',
    fn: () => {
      const { R } = qrDecomposition(new Matrix([[1, 0], [0, 1]]));
      assertTrue(Math.abs(R.get(0, 0)) > 1e-9, 'R(0,0) no debería ser cero.');
      assertTrue(Math.abs(R.get(1, 1)) > 1e-9, 'R(1,1) no debería ser cero.');
    },
  },

  /* ------------------------------ Cholesky ------------------------------ */
  {
    name: 'choleskyDecomposition reproduce el valor conocido de la 3x3 clásica',
    fn: () => {
      const { L } = choleskyDecomposition(SDP_3X3);
      assertMatrixClose(
        L,
        [[2, 0, 0], [6, 1, 0], [-8, 5, 3]],
        'Factor de Cholesky de bibliografía.',
      );
    },
  },
  {
    name: 'L es triangular inferior y Lt es su transpuesta',
    fn: () => {
      const { L, Lt } = choleskyDecomposition(SDP_3X3);
      assertTrue(L.isLowerTriangular(1e-9), 'L triangular inferior.');
      assertTrue(Lt.isUpperTriangular(1e-9), 'Lt triangular superior.');
      assertMatrixClose(Lt, L.transpose().toArray(), 'Lt debería ser exactamente Lᵀ.');
    },
  },
  {
    name: 'la diagonal de L es positiva',
    fn: () => {
      // Convención estándar: fija unívocamente la descomposición.
      const { L } = choleskyDecomposition(SDP_3X3);
      for (let i = 0; i < L.rows; i += 1) {
        assertTrue(L.get(i, i) > 0, `L(${i},${i}) debería ser positivo.`);
      }
    },
  },
  {
    name: 'choleskyDecomposition de la identidad es la identidad',
    fn: () => {
      const { L } = choleskyDecomposition(Matrix.identity(4));
      assertMatrixClose(L, Matrix.identity(4).toArray(), 'L = I.');
    },
  },
  {
    name: 'choleskyDecomposition rechaza matrices no definidas positivas',
    fn: () => {
      assertThrows(
        () => choleskyDecomposition(new Matrix([[-1, 0], [0, -1]])),
        MathError,
        'NOT_POSITIVE_DEFINITE',
        'Diagonal negativa.',
      );
      assertThrows(
        () => choleskyDecomposition(new Matrix([[1, 2], [2, 1]])),
        MathError,
        'NOT_POSITIVE_DEFINITE',
        'Simétrica pero indefinida.',
      );
      assertThrows(
        () => choleskyDecomposition(Matrix.zeros(2)),
        MathError,
        'NOT_POSITIVE_DEFINITE',
        'La matriz nula es semidefinida, no definida positiva.',
      );
    },
  },
  {
    name: 'choleskyDecomposition rechaza matrices no simétricas o no cuadradas',
    fn: () => {
      assertThrows(
        () => choleskyDecomposition(new Matrix([[4, 1], [2, 3]])),
        DimensionError,
        'DIMENSION_ERROR',
        'No simétrica.',
      );
      assertThrows(
        () => choleskyDecomposition(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'No cuadrada.',
      );
    },
  },
];
