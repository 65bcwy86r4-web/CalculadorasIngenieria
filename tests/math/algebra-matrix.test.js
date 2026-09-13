/**
 * tests/math/algebra-matrix.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de la clase Matrix (shared/math/algebra/matrix.js).
 *
 * Matrix es la estructura de datos sobre la que se apoya absolutamente todo el
 * módulo de álgebra: determinantes, inversa, descomposiciones y autovalores la
 * construyen, la clonan y la multiplican. Un error acá no se manifiesta como
 * "Matrix está mal", se manifiesta como un determinante equivocado tres
 * archivos más abajo. Por eso se prueba primero y con más detalle que el resto.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import { Matrix, MathError, DimensionError } from '../../shared/math/index.js';

import {
  assertTrue, assertFalse, assertEqual, assertClose,
  assertMatrixClose, assertThrows, assertDoesNotThrow,
} from '../assert.js';

export const tests = [
  /* ---------------------------- construcción ---------------------------- */
  {
    name: 'el constructor guarda dimensiones y contenido',
    fn: () => {
      const a = new Matrix([[1, 2, 3], [4, 5, 6]]);
      assertEqual(a.rows, 2, 'Cantidad de filas.');
      assertEqual(a.cols, 3, 'Cantidad de columnas.');
      assertClose(a.get(1, 2), 6, 'Elemento (1,2).');
      assertMatrixClose(a, [[1, 2, 3], [4, 5, 6]], 'Contenido completo.');
    },
  },
  {
    name: 'el constructor copia los datos en vez de referenciarlos',
    fn: () => {
      // Si guardara la referencia, modificar el arreglo original cambiaría la
      // matriz por detrás, y una calculadora que reutiliza su buffer de entrada
      // vería resultados imposibles de reproducir.
      const datos = [[1, 2], [3, 4]];
      const a = new Matrix(datos);
      datos[0][0] = 99;
      assertClose(a.get(0, 0), 1, 'La matriz no debería cambiar al mutar el arreglo original.');
    },
  },
  {
    name: 'toArray devuelve una copia, no la estructura interna',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const copia = a.toArray();
      copia[0][0] = 99;
      assertClose(a.get(0, 0), 1, 'Mutar el arreglo devuelto no debería afectar la matriz.');
    },
  },
  {
    name: 'el constructor rechaza datos no rectangulares o no finitos',
    fn: () => {
      assertThrows(() => new Matrix([[1, 2], [3]]), DimensionError, 'DIMENSION_ERROR', 'Filas de largo distinto.');
      assertThrows(() => new Matrix([[1, NaN]]), DimensionError, 'DIMENSION_ERROR', 'Contiene NaN.');
      assertThrows(() => new Matrix([[1, Infinity]]), DimensionError, 'DIMENSION_ERROR', 'Contiene Infinity.');
      assertThrows(() => new Matrix([]), DimensionError, 'DIMENSION_ERROR', 'Arreglo vacío.');
      assertThrows(() => new Matrix([[1, '2']]), DimensionError, 'DIMENSION_ERROR', 'Contiene un string.');
    },
  },
  {
    name: 'la matriz 1x1 es un caso válido',
    fn: () => {
      const a = assertDoesNotThrow(() => new Matrix([[7]]), 'Una 1x1 debería construirse.');
      assertTrue(a.isSquare(), 'Una 1x1 es cuadrada.');
      assertClose(a.trace(), 7, 'Su traza es su único elemento.');
    },
  },
  {
    name: 'los constructores estáticos producen las matrices canónicas',
    fn: () => {
      assertMatrixClose(Matrix.identity(3), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 'Identidad 3x3.');
      assertMatrixClose(Matrix.zeros(2, 3), [[0, 0, 0], [0, 0, 0]], 'Ceros 2x3.');
      assertMatrixClose(Matrix.zeros(2), [[0, 0], [0, 0]], 'zeros con un solo argumento es cuadrada.');
      assertMatrixClose(Matrix.diagonal([1, 2, 3]), [[1, 0, 0], [0, 2, 0], [0, 0, 3]], 'Diagonal.');
      assertMatrixClose(Matrix.fromArray([[5]]), [[5]], 'fromArray es equivalente al constructor.');
    },
  },
  {
    name: 'los constructores estáticos rechazan dimensiones inválidas',
    fn: () => {
      assertThrows(() => Matrix.identity(0), MathError, 'NOT_POSITIVE', 'Identidad de tamaño 0.');
      assertThrows(() => Matrix.identity(-1), MathError, 'NOT_POSITIVE', 'Identidad de tamaño negativo.');
      assertThrows(() => Matrix.identity(2.5), MathError, 'NOT_INTEGER', 'Identidad de tamaño no entero.');
      assertThrows(() => Matrix.zeros(0, 3), MathError, 'NOT_POSITIVE', 'Ceros con 0 filas.');
      assertThrows(() => Matrix.diagonal([]), MathError, 'NOT_A_NUMBER', 'Diagonal sin valores.');
    },
  },

  /* ------------------------------ utilidades ------------------------------ */
  {
    name: 'clone produce una copia independiente',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = a.clone();
      b.set(0, 0, 99);
      assertClose(a.get(0, 0), 1, 'El original no cambia.');
      assertClose(b.get(0, 0), 99, 'La copia sí.');
    },
  },
  {
    name: 'equals compara forma y contenido dentro de tolerancia',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      assertTrue(a.equals(new Matrix([[1, 2], [3, 4]])), 'Idénticas.');
      assertTrue(a.equals(new Matrix([[1, 2], [3, 4 + 1e-12]])), 'Diferencia por debajo de la tolerancia.');
      assertFalse(a.equals(new Matrix([[1, 2], [3, 4.1]])), 'Diferencia por encima de la tolerancia.');
      assertFalse(a.equals(new Matrix([[1, 2]])), 'Distinta cantidad de filas.');
      assertFalse(a.equals([[1, 2], [3, 4]]), 'Un arreglo crudo no es igual a una Matrix.');
      assertTrue(a.equals(new Matrix([[1, 2], [3, 4.05]]), 0.1), 'La tolerancia es configurable.');
    },
  },
  {
    name: 'minor elimina la fila y la columna indicadas',
    fn: () => {
      const a = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
      assertMatrixClose(a.minor(0, 0), [[5, 6], [8, 9]], 'Menor (0,0).');
      assertMatrixClose(a.minor(1, 1), [[1, 3], [7, 9]], 'Menor (1,1).');
      assertMatrixClose(a.minor(2, 0), [[2, 3], [5, 6]], 'Menor (2,0).');
    },
  },
  {
    name: 'minor exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => new Matrix([[1, 2, 3], [4, 5, 6]]).minor(0, 0),
        DimensionError,
        'DIMENSION_ERROR',
        'Menor de una 2x3.',
      );
    },
  },

  /* ------------------------------ aritmética ------------------------------ */
  {
    name: 'add y subtract operan elemento a elemento',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[10, 20], [30, 40]]);
      assertMatrixClose(a.add(b), [[11, 22], [33, 44]], 'Suma.');
      assertMatrixClose(b.subtract(a), [[9, 18], [27, 36]], 'Resta.');
      assertMatrixClose(a.subtract(a), [[0, 0], [0, 0]], 'A - A es la matriz nula.');
    },
  },
  {
    name: 'add y subtract no modifican los operandos',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[1, 1], [1, 1]]);
      a.add(b);
      assertMatrixClose(a, [[1, 2], [3, 4]], 'El primer operando queda intacto.');
      assertMatrixClose(b, [[1, 1], [1, 1]], 'El segundo también.');
    },
  },
  {
    name: 'add y subtract exigen dimensiones iguales',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[1, 2, 3]]);
      assertThrows(() => a.add(b), DimensionError, 'DIMENSION_ERROR', 'Suma de dimensiones distintas.');
      assertThrows(() => a.subtract(b), DimensionError, 'DIMENSION_ERROR', 'Resta de dimensiones distintas.');
    },
  },
  {
    name: 'scalarMultiply escala todos los elementos',
    fn: () => {
      const a = new Matrix([[1, -2], [3, 4]]);
      assertMatrixClose(a.scalarMultiply(2), [[2, -4], [6, 8]], 'Por 2.');
      assertMatrixClose(a.scalarMultiply(0), [[0, 0], [0, 0]], 'Por 0.');
      assertMatrixClose(a.scalarMultiply(-1), [[-1, 2], [-3, -4]], 'Por -1.');
      assertThrows(() => a.scalarMultiply(NaN), MathError, 'NOT_FINITE', 'Escalar no finito.');
    },
  },
  {
    name: 'multiply respeta el producto matricial conocido',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[5, 6], [7, 8]]);
      assertMatrixClose(a.multiply(b), [[19, 22], [43, 50]], 'Producto 2x2 clásico.');
      assertMatrixClose(
        new Matrix([[1, 2, 3]]).multiply(new Matrix([[4], [5], [6]])),
        [[32]],
        'Fila por columna da un escalar 1x1.',
      );
    },
  },
  {
    name: 'multiply no es conmutativo y la identidad es neutro',
    fn: () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[0, 1], [0, 0]]);
      assertFalse(a.multiply(b).equals(b.multiply(a)), 'AB no debería ser igual a BA en este caso.');
      assertMatrixClose(a.multiply(Matrix.identity(2)), a.toArray(), 'A · I = A.');
      assertMatrixClose(Matrix.identity(2).multiply(a), a.toArray(), 'I · A = A.');
    },
  },
  {
    name: 'multiply exige que las dimensiones internas coincidan',
    fn: () => {
      const a = new Matrix([[1, 2, 3], [4, 5, 6]]); // 2x3
      assertDoesNotThrow(() => a.multiply(a.transpose()), '2x3 por 3x2 es válido.');
      assertThrows(() => a.multiply(a), DimensionError, 'DIMENSION_ERROR', '2x3 por 2x3 no es válido.');
    },
  },
  {
    name: 'transpose intercambia filas por columnas y es involutiva',
    fn: () => {
      const a = new Matrix([[1, 2, 3], [4, 5, 6]]);
      const t = a.transpose();
      assertEqual(t.rows, 3, 'La transpuesta de una 2x3 tiene 3 filas.');
      assertEqual(t.cols, 2, 'Y 2 columnas.');
      assertMatrixClose(t, [[1, 4], [2, 5], [3, 6]], 'Contenido de la transpuesta.');
      assertMatrixClose(t.transpose(), a.toArray(), '(Aᵀ)ᵀ = A.');
    },
  },
  {
    name: 'power con exponente 0 devuelve la identidad',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 3]]);
      assertMatrixClose(a.power(0), [[1, 0], [0, 1]], 'A⁰ = I.');
      assertMatrixClose(a.power(1), a.toArray(), 'A¹ = A.');
      assertMatrixClose(new Matrix([[2, 0], [0, 2]]).power(3), [[8, 0], [0, 8]], 'Diagonal elevada al cubo.');
      assertMatrixClose(a.power(2), a.multiply(a).toArray(), 'A² coincide con A·A.');
    },
  },
  {
    name: 'power rechaza exponentes negativos o no enteros y matrices no cuadradas',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 3]]);
      assertThrows(() => a.power(-1), MathError, 'NOT_NON_NEGATIVE', 'Exponente negativo.');
      assertThrows(() => a.power(1.5), MathError, 'NOT_INTEGER', 'Exponente no entero.');
      assertThrows(
        () => new Matrix([[1, 2, 3]]).power(2),
        DimensionError,
        'DIMENSION_ERROR',
        'Potencia de una matriz no cuadrada.',
      );
    },
  },
  {
    name: 'trace suma la diagonal principal',
    fn: () => {
      assertClose(new Matrix([[1, 2], [3, 4]]).trace(), 5, 'Traza de una 2x2.');
      assertClose(Matrix.identity(4).trace(), 4, 'Traza de la identidad 4x4.');
      assertClose(new Matrix([[-1, 0], [0, -2]]).trace(), -3, 'Traza negativa.');
      assertThrows(
        () => new Matrix([[1, 2, 3]]).trace(),
        DimensionError,
        'DIMENSION_ERROR',
        'Traza de una matriz no cuadrada.',
      );
    },
  },

  /* ----------------------- propiedades estructurales ----------------------- */
  {
    name: 'las propiedades estructurales devuelven false, no lanzan, si no es cuadrada',
    fn: () => {
      // docs/API.md lo declara explícitamente: devolver false es más útil que
      // lanzar, porque estas funciones se usan para decidir qué algoritmo aplicar.
      const rect = new Matrix([[1, 2, 3], [4, 5, 6]]);
      assertFalse(rect.isSymmetric(), 'No simétrica.');
      assertFalse(rect.isDiagonal(), 'No diagonal.');
      assertFalse(rect.isUpperTriangular(), 'No triangular superior.');
      assertFalse(rect.isLowerTriangular(), 'No triangular inferior.');
      assertFalse(rect.isIdentity(), 'No identidad.');
    },
  },
  {
    name: 'isSymmetric reconoce A = Aᵀ',
    fn: () => {
      assertTrue(new Matrix([[1, 2], [2, 1]]).isSymmetric(), 'Simétrica.');
      assertFalse(new Matrix([[1, 2], [3, 1]]).isSymmetric(), 'No simétrica.');
      assertTrue(new Matrix([[1, 2], [2 + 1e-12, 1]]).isSymmetric(), 'Simétrica dentro de tolerancia.');
      assertTrue(Matrix.identity(3).isSymmetric(), 'La identidad es simétrica.');
    },
  },
  {
    name: 'isDiagonal, isUpperTriangular e isLowerTriangular se distinguen entre sí',
    fn: () => {
      const diagonal = Matrix.diagonal([1, 2]);
      const superior = new Matrix([[1, 5], [0, 2]]);
      const inferior = new Matrix([[1, 0], [5, 2]]);

      assertTrue(diagonal.isDiagonal(), 'Una diagonal es diagonal.');
      assertTrue(diagonal.isUpperTriangular(), 'Una diagonal también es triangular superior.');
      assertTrue(diagonal.isLowerTriangular(), 'Y triangular inferior.');

      assertTrue(superior.isUpperTriangular(), 'Triangular superior.');
      assertFalse(superior.isLowerTriangular(), 'No es triangular inferior.');
      assertFalse(superior.isDiagonal(), 'No es diagonal.');

      assertTrue(inferior.isLowerTriangular(), 'Triangular inferior.');
      assertFalse(inferior.isUpperTriangular(), 'No es triangular superior.');
    },
  },
  {
    name: 'isIdentity exige diagonal de unos, no solo diagonal',
    fn: () => {
      assertTrue(Matrix.identity(3).isIdentity(), 'La identidad es identidad.');
      assertFalse(Matrix.diagonal([1, 2]).isIdentity(), 'Una diagonal con un 2 no es identidad.');
      assertFalse(Matrix.zeros(2).isIdentity(), 'La matriz nula no es identidad.');
      assertTrue(new Matrix([[1 + 1e-12, 0], [0, 1]]).isIdentity(), 'Identidad dentro de tolerancia.');
    },
  },

  /* -------------------------------- normas -------------------------------- */
  {
    name: 'frobeniusNorm coincide con el valor calculado a mano',
    fn: () => {
      // √(3² + 4²) = 5
      assertClose(new Matrix([[3, 4]]).frobeniusNorm(), 5, 'Norma de Frobenius de [3, 4].');
      // √(1+1+1+1) = 2
      assertClose(new Matrix([[1, 1], [1, 1]]).frobeniusNorm(), 2, 'Norma de una matriz de unos 2x2.');
      // √n para la identidad n×n
      assertClose(Matrix.identity(9).frobeniusNorm(), 3, 'Norma de la identidad 9x9 es 3.');
      assertClose(Matrix.zeros(3).frobeniusNorm(), 0, 'Norma de la matriz nula.');
    },
  },
  {
    name: 'infinityNorm es la máxima suma absoluta de fila',
    fn: () => {
      assertClose(new Matrix([[1, -2], [3, 4]]).infinityNorm(), 7, 'La segunda fila suma 7.');
      assertClose(new Matrix([[-10, 0], [1, 1]]).infinityNorm(), 10, 'El valor absoluto importa, no el signo.');
      assertClose(Matrix.identity(5).infinityNorm(), 1, 'Cada fila de la identidad suma 1.');
    },
  },
];
