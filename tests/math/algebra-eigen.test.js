/**
 * tests/math/algebra-eigen.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de autovalores y autovectores: eigenvaluesQR, eigenvectorFor,
 * eigenvectors y diagonalize.
 *
 * Es el módulo con más margen de error del motor: eigenvaluesQR es iterativo y
 * aproximado, así que las tolerancias acá son necesariamente más flojas que en
 * el resto de la suite. Están fijadas en TOLERANCIA_ITERATIVA, en un solo
 * lugar y explicadas, para que quede claro que es una característica del
 * algoritmo y no una tolerancia que se fue subiendo hasta que la prueba pasó.
 *
 * Las matrices de prueba se eligieron con autovalores enteros conocidos, que
 * se pueden verificar a mano resolviendo det(A − λI) = 0.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  eigenvaluesQR, eigenvectorFor, eigenvectors, diagonalize,
  Matrix, MathError, DimensionError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertMatrixClose, assertThrows,
} from '../assert.js';

/**
 * Tolerancia para resultados del algoritmo QR iterativo. Es 1e-6 y no 1e-9
 * porque el método converge linealmente: con 500 iteraciones sobre matrices
 * bien condicionadas alcanza sobradamente esta precisión, pero exigir 1e-9
 * mediría la cantidad de iteraciones, no la corrección del algoritmo.
 */
const TOLERANCIA_ITERATIVA = 1e-6;

/**
 * Compara dos conjuntos de autovalores sin depender del orden en que los
 * devuelva el algoritmo (que no está especificado en docs/API.md).
 *
 * @param {number[]} obtenidos
 * @param {number[]} esperados
 * @param {string} mensaje
 * @returns {void}
 */
function assertEigenvalues(obtenidos, esperados, mensaje) {
  assertEqual(obtenidos.length, esperados.length, `${mensaje} Cantidad de autovalores.`);
  const ordenados = [...obtenidos].sort((a, b) => a - b);
  const referencia = [...esperados].sort((a, b) => a - b);
  ordenados.forEach((valor, i) => {
    assertClose(valor, referencia[i], `${mensaje} Autovalor ${i}.`, TOLERANCIA_ITERATIVA);
  });
}

export const tests = [
  /* ---------------------------- eigenvaluesQR ---------------------------- */
  {
    name: 'eigenvaluesQR resuelve una simétrica 2x2 de autovalores conocidos',
    fn: () => {
      // det([[2-λ,1],[1,2-λ]]) = (2-λ)² - 1 = 0  ->  λ = 3, 1
      const { values } = eigenvaluesQR(new Matrix([[2, 1], [1, 2]]));
      assertEigenvalues(values, [3, 1], 'Autovalores de [[2,1],[1,2]].');
    },
  },
  {
    name: 'los autovalores de una triangular son su diagonal',
    fn: () => {
      const { values } = eigenvaluesQR(new Matrix([[3, 7, 2], [0, 5, 9], [0, 0, -1]]));
      assertEigenvalues(values, [3, 5, -1], 'Diagonal de una triangular superior.');
    },
  },
  {
    name: 'los autovalores de una diagonal son sus elementos',
    fn: () => {
      const { values } = eigenvaluesQR(Matrix.diagonal([4, -2, 7]));
      assertEigenvalues(values, [4, -2, 7], 'Diagonal explícita.');
    },
  },
  {
    name: 'los autovalores de la identidad son todos 1',
    fn: () => {
      const { values } = eigenvaluesQR(Matrix.identity(3));
      assertEigenvalues(values, [1, 1, 1], 'Identidad 3x3.');
    },
  },
  {
    name: 'eigenvaluesQR resuelve la tridiagonal 3x3 de autovalores irracionales',
    fn: () => {
      // Autovalores exactos 2, 2±√2 (raíces de det(A − λI) = 0). Sirven para
      // verificar que el método iterativo converge a valores que no son
      // enteros redondos, donde un error de truncamiento se vería enseguida.
      const a = new Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]);
      const { values } = eigenvaluesQR(a);
      assertEigenvalues(values, [2 - Math.SQRT2, 2, 2 + Math.SQRT2], 'Matriz tridiagonal clásica.');
    },
  },
  {
    name: 'eigenvaluesQR de una 1x1 devuelve su único elemento',
    fn: () => {
      const { values } = eigenvaluesQR(new Matrix([[6]]));
      assertEigenvalues(values, [6], 'Autovalor de una 1x1.');
    },
  },
  {
    name: 'eigenvaluesQR avisa cuando los autovalores podrían ser complejos',
    fn: () => {
      // Rotación de 90°: autovalores ±i, sin parte real. El motor no maneja
      // aritmética compleja (deuda D5 del HANDOFF), así que lo mínimo exigible
      // es que lo señale en vez de devolver números reales inventados.
      const rotacion = new Matrix([[0, -1], [1, 0]]);
      const salida = eigenvaluesQR(rotacion);
      assertTrue(
        salida.hasComplexHint === true,
        'Debería marcar hasComplexHint en una matriz de autovalores complejos.',
      );
    },
  },
  {
    name: 'eigenvaluesQR devuelve la matriz T de la iteración y no lanza en el caso complejo',
    fn: () => {
      const salida = eigenvaluesQR(new Matrix([[0, -1], [1, 0]]));
      assertTrue(salida.matrixT instanceof Matrix, 'matrixT debería ser una Matrix.');
      assertTrue(Array.isArray(salida.values), 'values debería ser un arreglo aun con hint de complejos.');
    },
  },
  {
    name: 'eigenvaluesQR exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => eigenvaluesQR(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Autovalores de una 2x3.',
      );
    },
  },

  /* ---------------------------- eigenvectorFor ---------------------------- */
  {
    name: 'eigenvectorFor devuelve un vector que satisface A·v = λ·v',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const v = eigenvectorFor(a, 3);
      assertTrue(Array.isArray(v), 'Debería devolver un vector para λ = 3.');

      const av = a.multiply(new Matrix(v.map((x) => [x])));
      const lv = v.map((x) => [3 * x]);
      assertMatrixClose(av, lv, 'A·v debería ser igual a λ·v.', TOLERANCIA_ITERATIVA);
    },
  },
  {
    name: 'eigenvectorFor devuelve el autovector conocido de una diagonal',
    fn: () => {
      const v = eigenvectorFor(Matrix.diagonal([5, 9]), 9);
      assertTrue(Array.isArray(v), 'Debería encontrar el autovector.');
      // Cualquier múltiplo es válido: se verifica la dirección, no la escala.
      assertClose(v[0], 0, 'La primera componente debería ser nula.', TOLERANCIA_ITERATIVA);
      assertTrue(Math.abs(v[1]) > 1e-9, 'La segunda componente no debería ser nula.');
    },
  },
  {
    name: 'eigenvectorFor devuelve null si el valor dado no es autovalor',
    fn: () => {
      // docs/API.md declara `number[] | null`: no lanzar es parte del contrato.
      const v = eigenvectorFor(new Matrix([[2, 1], [1, 2]]), 99);
      assertTrue(v === null, 'Un valor que no es autovalor no tiene autovector asociado.');
    },
  },

  /* ----------------------------- eigenvectors ----------------------------- */
  {
    name: 'eigenvectors empareja cada autovalor con su vector',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const pares = eigenvectors(a, [3, 1]);
      assertEqual(pares.length, 2, 'Un par por autovalor.');
      pares.forEach(({ lambda, vector }) => {
        assertTrue(Array.isArray(vector), `Debería haber autovector para λ = ${lambda}.`);
        const av = a.multiply(new Matrix(vector.map((x) => [x])));
        assertMatrixClose(
          av,
          vector.map((x) => [lambda * x]),
          `A·v = λ·v para λ = ${lambda}.`,
          TOLERANCIA_ITERATIVA,
        );
      });
    },
  },
  {
    name: 'los autovectores de una simétrica son ortogonales entre sí',
    fn: () => {
      // Propiedad del teorema espectral: si no se cumple, el cálculo está mal
      // aunque cada autovector por separado parezca razonable.
      const pares = eigenvectors(new Matrix([[2, 1], [1, 2]]), [3, 1]);
      const [v1, v2] = pares.map((p) => p.vector);
      const producto = v1[0] * v2[0] + v1[1] * v2[1];
      assertClose(producto, 0, 'El producto escalar debería ser nulo.', TOLERANCIA_ITERATIVA);
    },
  },

  /* ------------------------------ diagonalize ------------------------------ */
  {
    name: 'diagonalize devuelve D con los autovalores en la diagonal',
    fn: () => {
      const { D } = diagonalize(new Matrix([[2, 1], [1, 2]]));
      assertTrue(D.isDiagonal(TOLERANCIA_ITERATIVA), 'D debería ser diagonal.');
      assertEigenvalues([D.get(0, 0), D.get(1, 1)], [3, 1], 'Diagonal de D.');
    },
  },
  {
    name: 'diagonalize satisface A = P·D·P⁻¹',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const { P, D, Pinv } = diagonalize(a);
      assertMatrixClose(
        P.multiply(D).multiply(Pinv),
        a.toArray(),
        'La reconstrucción debería devolver A.',
        TOLERANCIA_ITERATIVA,
      );
    },
  },
  {
    name: 'Pinv es efectivamente la inversa de P',
    fn: () => {
      const { P, Pinv } = diagonalize(new Matrix([[2, 1], [1, 2]]));
      assertMatrixClose(
        P.multiply(Pinv),
        Matrix.identity(2).toArray(),
        'P·P⁻¹ debería ser la identidad.',
        TOLERANCIA_ITERATIVA,
      );
    },
  },
  {
    name: 'diagonalize rechaza una matriz no diagonalizable',
    fn: () => {
      // Bloque de Jordan: autovalor 1 doble con un solo autovector independiente.
      assertThrows(
        () => diagonalize(new Matrix([[1, 1], [0, 1]])),
        MathError,
        'NOT_DIAGONALIZABLE',
        'Bloque de Jordan 2x2.',
      );
    },
  },
];
