/**
 * tests/math/algebra-determinant.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de determinante e inversa: determinantByGauss, determinantByCofactors,
 * inverse, cofactorMatrix, adjugate y conditionNumber.
 *
 * Las comparaciones entre los dos caminos de cálculo (Gauss contra cofactores,
 * inversa contra A·A⁻¹) viven en cross-checks.test.js. Acá se prueba cada
 * función contra valores conocidos, calculables a mano, y contra sus casos
 * límite: 1x1, matriz singular, tamaño máximo de cofactores.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  determinantByGauss, determinantByCofactors,
  inverse, cofactorMatrix, adjugate, conditionNumber,
  Matrix, MathError, DimensionError, SingularMatrixError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertMatrixClose,
  assertThrows, assertDoesNotThrow,
} from '../assert.js';

export const tests = [
  /* --------------------------- determinantByGauss --------------------------- */
  {
    name: 'determinantByGauss reproduce valores conocidos',
    fn: () => {
      assertClose(determinantByGauss(new Matrix([[7]])).value, 7, 'Determinante de una 1x1.');
      assertClose(determinantByGauss(new Matrix([[1, 2], [3, 4]])).value, -2, '1·4 − 2·3.');
      assertClose(determinantByGauss(new Matrix([[2, 1], [1, 3]])).value, 5, '2·3 − 1·1.');
      assertClose(
        determinantByGauss(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).value,
        -306,
        'Determinante 3x3 de bibliografía.',
      );
      assertClose(determinantByGauss(Matrix.identity(5)).value, 1, 'Determinante de la identidad.');
    },
  },
  {
    name: 'determinantByGauss da cero exacto en una matriz singular',
    fn: () => {
      assertClose(
        determinantByGauss(new Matrix([[1, 2], [2, 4]])).value,
        0,
        'Filas proporcionales.',
        1e-12,
      );
      assertClose(determinantByGauss(Matrix.zeros(3)).value, 0, 'Matriz nula.');
      assertClose(
        determinantByGauss(new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).value,
        0,
        'La tercera fila es combinación lineal de las otras dos.',
        1e-12,
      );
    },
  },
  {
    name: 'el determinante de una triangular es el producto de su diagonal',
    fn: () => {
      assertClose(
        determinantByGauss(new Matrix([[2, 9, 4], [0, 3, 7], [0, 0, 5]])).value,
        30,
        '2 · 3 · 5.',
      );
      assertClose(determinantByGauss(Matrix.diagonal([2, -3, 4])).value, -24, '2 · (−3) · 4.');
    },
  },
  {
    name: 'intercambiar dos filas invierte el signo del determinante',
    fn: () => {
      const a = determinantByGauss(new Matrix([[1, 2], [3, 4]])).value;
      const b = determinantByGauss(new Matrix([[3, 4], [1, 2]])).value;
      assertClose(b, -a, 'Un intercambio de filas cambia el signo.');
    },
  },
  {
    name: 'determinantByGauss informa el conteo de intercambios y los pasos',
    fn: () => {
      const salida = determinantByGauss(new Matrix([[0, 1], [1, 0]]));
      assertClose(salida.value, -1, 'Determinante de la permutación 2x2.');
      assertEqual(salida.swapCount, 1, 'Un intercambio.');
      assertTrue(Array.isArray(salida.steps), 'steps debería ser un arreglo.');
    },
  },
  {
    name: 'determinantByGauss exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => determinantByGauss(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Determinante de una 2x3.',
      );
    },
  },

  /* ------------------------- determinantByCofactors ------------------------- */
  {
    name: 'determinantByCofactors reproduce valores conocidos',
    fn: () => {
      assertClose(determinantByCofactors(new Matrix([[5]])), 5, 'Determinante de una 1x1.');
      assertClose(determinantByCofactors(new Matrix([[1, 2], [3, 4]])), -2, 'Determinante 2x2.');
      assertClose(
        determinantByCofactors(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]])),
        -306,
        'Determinante 3x3 de bibliografía.',
      );
    },
  },
  {
    name: 'determinantByCofactors devuelve un número, no un objeto',
    fn: () => {
      // Diferencia deliberada con determinantByGauss, documentada en API.md:
      // el método de cofactores no produce pasos intermedios mostrables.
      assertEqual(
        typeof determinantByCofactors(new Matrix([[1, 2], [3, 4]])),
        'number',
        'Tipo del valor de retorno.',
      );
    },
  },
  {
    name: 'determinantByCofactors corta en n > 7 por costo factorial',
    fn: () => {
      assertDoesNotThrow(() => determinantByCofactors(Matrix.identity(7)), 'n = 7 debería permitirse.');
      assertThrows(
        () => determinantByCofactors(Matrix.identity(8)),
        MathError,
        'TOO_LARGE_FOR_COFACTORS',
        'n = 8 debería rechazarse.',
      );
    },
  },
  {
    name: 'determinantByCofactors exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => determinantByCofactors(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Cofactores de una 2x3.',
      );
    },
  },

  /* ------------------------------- inverse ------------------------------- */
  {
    name: 'inverse reproduce inversas conocidas',
    fn: () => {
      assertMatrixClose(
        inverse(new Matrix([[4, 7], [2, 6]])).inverse,
        [[0.6, -0.7], [-0.2, 0.4]],
        'Inversa 2x2 de bibliografía.',
      );
      assertMatrixClose(
        inverse(Matrix.diagonal([2, 4])).inverse,
        [[0.5, 0], [0, 0.25]],
        'La inversa de una diagonal invierte cada elemento.',
      );
      assertMatrixClose(inverse(Matrix.identity(3)).inverse, Matrix.identity(3).toArray(), 'I⁻¹ = I.');
      assertMatrixClose(inverse(new Matrix([[4]])).inverse, [[0.25]], 'Inversa de una 1x1.');
    },
  },
  {
    name: 'inverse lanza SingularMatrixError con una matriz no invertible',
    fn: () => {
      assertThrows(
        () => inverse(new Matrix([[1, 2], [2, 4]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'Filas proporcionales.',
      );
      assertThrows(
        () => inverse(Matrix.zeros(3)),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'Matriz nula.',
      );
      assertThrows(
        () => inverse(new Matrix([[0]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'La 1x1 nula tampoco tiene inversa.',
      );
    },
  },
  {
    name: 'inverse exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => inverse(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Inversa de una 2x3.',
      );
    },
  },
  {
    name: 'inverse no modifica la matriz original',
    fn: () => {
      const a = new Matrix([[4, 7], [2, 6]]);
      inverse(a);
      assertMatrixClose(a, [[4, 7], [2, 6]], 'La entrada queda intacta.');
    },
  },

  /* -------------------------- cofactores y adjunta -------------------------- */
  {
    name: 'cofactorMatrix reproduce el valor conocido de una 2x2',
    fn: () => {
      assertMatrixClose(
        cofactorMatrix(new Matrix([[1, 2], [3, 4]])),
        [[4, -3], [-2, 1]],
        'Matriz de cofactores 2x2.',
      );
    },
  },
  {
    name: 'cofactorMatrix respeta el patrón de signos en una 3x3',
    fn: () => {
      // Para la identidad, cada cofactor Cᵢᵢ es el determinante de la
      // identidad menor (1) y los de fuera de la diagonal son 0.
      assertMatrixClose(cofactorMatrix(Matrix.identity(3)), Matrix.identity(3).toArray(), 'Cofactores de I.');
      assertMatrixClose(
        cofactorMatrix(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])),
        [[-24, 20, -5], [18, -15, 4], [5, -4, 1]],
        'Cofactores 3x3 de bibliografía.',
      );
    },
  },
  {
    name: 'adjugate es la transpuesta de la matriz de cofactores',
    fn: () => {
      assertMatrixClose(
        adjugate(new Matrix([[1, 2], [3, 4]])),
        [[4, -2], [-3, 1]],
        'Adjunta 2x2.',
      );
      assertMatrixClose(
        adjugate(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])),
        cofactorMatrix(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])).transpose().toArray(),
        'adj(A) = C(A)ᵀ.',
      );
    },
  },
  {
    name: 'A · adj(A) = det(A) · I',
    fn: () => {
      // Identidad fundamental del álgebra lineal: verifica cofactores, adjunta
      // y determinante de una sola vez.
      const a = new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]]);
      const det = determinantByGauss(a).value;
      assertMatrixClose(
        a.multiply(adjugate(a)),
        Matrix.identity(3).scalarMultiply(det).toArray(),
        'A · adj(A) debería ser det(A) · I.',
      );
    },
  },
  {
    name: 'cofactorMatrix y adjugate exigen matriz cuadrada',
    fn: () => {
      const rect = new Matrix([[1, 2, 3], [4, 5, 6]]);
      assertThrows(() => cofactorMatrix(rect), DimensionError, 'DIMENSION_ERROR', 'Cofactores de una 2x3.');
      assertThrows(() => adjugate(rect), DimensionError, 'DIMENSION_ERROR', 'Adjunta de una 2x3.');
    },
  },

  /* ---------------------------- conditionNumber ---------------------------- */
  {
    name: 'conditionNumber de la identidad es n',
    fn: () => {
      // κ(I) = ‖I‖_F · ‖I⁻¹‖_F = √n · √n = n
      assertClose(conditionNumber(Matrix.identity(3)).value, 3, 'κ(I₃).');
      assertClose(conditionNumber(Matrix.identity(4)).value, 4, 'κ(I₄).');
    },
  },
  {
    name: 'conditionNumber devuelve también las dos normas que lo componen',
    fn: () => {
      const salida = conditionNumber(Matrix.identity(3));
      assertClose(salida.normA, Math.sqrt(3), 'Norma de Frobenius de I₃.');
      assertClose(salida.normInverse, Math.sqrt(3), 'Norma de su inversa.');
      assertClose(salida.value, salida.normA * salida.normInverse, 'El valor es el producto de ambas.');
    },
  },
  {
    name: 'conditionNumber crece con el mal condicionamiento',
    fn: () => {
      // La matriz de Hilbert 3x3 es el ejemplo clásico de mal condicionamiento.
      const hilbert = new Matrix([
        [1, 1 / 2, 1 / 3],
        [1 / 2, 1 / 3, 1 / 4],
        [1 / 3, 1 / 4, 1 / 5],
      ]);
      assertTrue(
        conditionNumber(hilbert).value > 500,
        'La Hilbert 3x3 debería tener un número de condición alto.',
      );
    },
  },
  {
    name: 'conditionNumber lanza SingularMatrixError si la matriz no es invertible',
    fn: () => {
      assertThrows(
        () => conditionNumber(new Matrix([[1, 2], [2, 4]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'κ no está definido para una matriz singular.',
      );
    },
  },
];
