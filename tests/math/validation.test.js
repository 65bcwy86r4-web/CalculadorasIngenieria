/**
 * tests/math/validation.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/validation/ — las familias isX (booleanas, nunca
 * lanzan) y assertX (lanzan con un `code` estable).
 *
 * Por qué se prueban con este nivel de detalle: son las funciones que una
 * calculadora va a usar para validar lo que escribe el usuario
 * (index.js, sección de Validación). Un `isFiniteNumber` que devuelva true
 * para NaN no rompe ningún cálculo de inmediato — deja pasar el NaN hasta que
 * aparece tres capas más abajo, en un resultado sin sentido y sin excepción.
 * Son, además, la primera línea de defensa de AI_RULES.md §21.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  isNumber, isFiniteNumber, isInteger, isPositive, isNonNegative, isInRange,
  assertNumber, assertFiniteNumber, assertInteger, assertPositive,
  assertNonNegative, assertInRange, assertFunction,
  isMatrixLike, assertMatrixLike, assertSquareMatrix, assertSameDimensions,
  assertMultipliable, assertVectorData, assertSameLength,
  Matrix, MathError, DimensionError,
} from '../../shared/math/index.js';

import { assertTrue, assertFalse, assertEqual, assertThrows, assertDoesNotThrow } from '../assert.js';

/** Valores que ninguna función de validación numérica debería aceptar. */
const NO_NUMEROS = [null, undefined, '5', [], {}, true, NaN];

export const tests = [
  /* ----------------------------- familia isX ----------------------------- */
  {
    name: 'isNumber acepta cualquier number, incluidos NaN e Infinity',
    fn: () => {
      assertTrue(isNumber(0), '0 es number.');
      assertTrue(isNumber(-3.5), '-3.5 es number.');
      assertTrue(isNumber(NaN), 'NaN es de tipo number (aunque no sea finito).');
      assertTrue(isNumber(Infinity), 'Infinity es de tipo number.');
      assertFalse(isNumber('5'), 'Un string numérico no es number.');
      assertFalse(isNumber(null), 'null no es number.');
    },
  },
  {
    name: 'isFiniteNumber rechaza NaN, Infinity y no-numbers',
    fn: () => {
      assertTrue(isFiniteNumber(0), '0 es finito.');
      assertTrue(isFiniteNumber(-1e308), 'Un número grande pero finito es finito.');
      assertFalse(isFiniteNumber(NaN), 'NaN no es finito.');
      assertFalse(isFiniteNumber(Infinity), 'Infinity no es finito.');
      assertFalse(isFiniteNumber(-Infinity), '-Infinity no es finito.');
      NO_NUMEROS.filter((v) => typeof v !== 'number').forEach((value) => {
        assertFalse(isFiniteNumber(value), `${JSON.stringify(value)} no debería pasar isFiniteNumber.`);
      });
    },
  },
  {
    name: 'isInteger distingue entero de entero-como-flotante y de no finito',
    fn: () => {
      assertTrue(isInteger(4), '4 es entero.');
      assertTrue(isInteger(-7), '-7 es entero.');
      assertTrue(isInteger(0), '0 es entero.');
      assertTrue(isInteger(4.0), '4.0 es el mismo valor que 4 en JavaScript.');
      assertFalse(isInteger(4.5), '4.5 no es entero.');
      assertFalse(isInteger(Infinity), 'Infinity no es entero.');
      assertFalse(isInteger(NaN), 'NaN no es entero.');
    },
  },
  {
    name: 'isPositive e isNonNegative se diferencian exactamente en el cero',
    fn: () => {
      assertFalse(isPositive(0), '0 no es positivo.');
      assertTrue(isNonNegative(0), '0 sí es no negativo.');
      assertTrue(isPositive(1e-300), 'Un positivo muy chico sigue siendo positivo.');
      assertFalse(isPositive(-1e-300), 'Un negativo muy chico sigue siendo negativo.');
      assertFalse(isNonNegative(-0.0001), 'Un negativo no es no negativo.');
      assertTrue(isNonNegative(-0), 'El cero negativo es >= 0 en JavaScript.');
      assertFalse(isPositive(Infinity), 'Infinity no es finito, así que no es positivo válido.');
    },
  },
  {
    name: 'isInRange incluye ambos extremos',
    fn: () => {
      assertTrue(isInRange(0, 0, 10), 'El extremo inferior está incluido.');
      assertTrue(isInRange(10, 0, 10), 'El extremo superior está incluido.');
      assertTrue(isInRange(5, 0, 10), 'Un valor interior está en rango.');
      assertFalse(isInRange(-0.0001, 0, 10), 'Apenas por debajo queda fuera.');
      assertFalse(isInRange(10.0001, 0, 10), 'Apenas por encima queda fuera.');
      assertFalse(isInRange(NaN, 0, 10), 'NaN nunca está en rango.');
    },
  },
  {
    name: 'ninguna función isX lanza, ni con las entradas más hostiles',
    fn: () => {
      const funciones = [isNumber, isFiniteNumber, isInteger, isPositive, isNonNegative];
      funciones.forEach((fn) => {
        NO_NUMEROS.forEach((value) => {
          assertDoesNotThrow(() => fn(value), `${fn.name} no debería lanzar con ${JSON.stringify(value)}.`);
        });
      });
    },
  },

  /* --------------------------- familia assertX --------------------------- */
  {
    name: 'los assertX devuelven el valor recibido, para poder encadenar',
    fn: () => {
      assertEqual(assertNumber(7, 'n'), 7, 'assertNumber devuelve el valor.');
      assertEqual(assertFiniteNumber(-2.5, 'x'), -2.5, 'assertFiniteNumber devuelve el valor.');
      assertEqual(assertInteger(3, 'n'), 3, 'assertInteger devuelve el valor.');
      assertEqual(assertPositive(1, 'n'), 1, 'assertPositive devuelve el valor.');
      assertEqual(assertNonNegative(0, 'n'), 0, 'assertNonNegative devuelve el valor.');
      assertEqual(assertInRange(5, 0, 10, 'n'), 5, 'assertInRange devuelve el valor.');
      assertEqual(assertFunction(Math.sqrt, 'f'), Math.sqrt, 'assertFunction devuelve la función.');
    },
  },
  {
    name: 'cada assertX numérico lanza MathError con su code documentado',
    fn: () => {
      assertThrows(() => assertNumber('5', 'n'), MathError, 'NOT_A_NUMBER', 'assertNumber con string.');
      assertThrows(() => assertFiniteNumber(NaN, 'n'), MathError, 'NOT_FINITE', 'assertFiniteNumber con NaN.');
      assertThrows(() => assertFiniteNumber(Infinity, 'n'), MathError, 'NOT_FINITE', 'assertFiniteNumber con Infinity.');
      assertThrows(() => assertInteger(4.5, 'n'), MathError, 'NOT_INTEGER', 'assertInteger con decimal.');
      assertThrows(() => assertPositive(0, 'n'), MathError, 'NOT_POSITIVE', 'assertPositive con cero.');
      assertThrows(() => assertPositive(-1, 'n'), MathError, 'NOT_POSITIVE', 'assertPositive con negativo.');
      assertThrows(() => assertNonNegative(-1, 'n'), MathError, 'NOT_NON_NEGATIVE', 'assertNonNegative con negativo.');
      assertThrows(() => assertInRange(11, 0, 10, 'n'), MathError, 'OUT_OF_RANGE', 'assertInRange fuera de rango.');
      assertThrows(() => assertFunction(42, 'f'), MathError, 'NOT_A_FUNCTION', 'assertFunction con número.');
    },
  },
  {
    name: 'el context del error identifica el parámetro que falló',
    fn: () => {
      // Sin esto, una calculadora que valida cinco campos no puede decirle al
      // usuario cuál de los cinco está mal.
      const error = assertThrows(() => assertInteger(1.5, 'tamañoDeMatriz'), MathError, 'NOT_INTEGER');
      assertEqual(error.context.paramName, 'tamañoDeMatriz', 'paramName en el context.');
      assertEqual(error.context.value, 1.5, 'value en el context.');
    },
  },

  /* -------------------- validación de matrices y vectores ----------------- */
  {
    name: 'isMatrixLike reconoce una Matrix y un objeto plano consistente',
    fn: () => {
      assertTrue(isMatrixLike(new Matrix([[1, 2], [3, 4]])), 'Una Matrix es matrix-like.');
      assertTrue(isMatrixLike({ rows: 1, cols: 2, data: [[1, 2]] }), 'Un objeto consistente es matrix-like.');
      assertFalse(isMatrixLike([[1, 2], [3, 4]]), 'Un arreglo 2D crudo no es matrix-like.');
      assertFalse(isMatrixLike({ rows: 2, cols: 2, data: [[1, 2]] }), 'rows no coincide con data.length.');
      assertFalse(isMatrixLike({ rows: 1, cols: 3, data: [[1, 2]] }), 'cols no coincide con el largo de la fila.');
      assertFalse(isMatrixLike(null), 'null no es matrix-like.');
    },
  },
  {
    name: 'assertMatrixLike lanza MathError NOT_MATRIX_LIKE con un arreglo crudo',
    fn: () => {
      assertThrows(() => assertMatrixLike([[1, 2]], 'A'), MathError, 'NOT_MATRIX_LIKE', 'Arreglo 2D crudo.');
      assertThrows(() => assertMatrixLike(undefined, 'A'), MathError, 'NOT_MATRIX_LIKE', 'undefined.');
    },
  },
  {
    name: 'assertSquareMatrix lanza DimensionError con una matriz rectangular',
    fn: () => {
      assertDoesNotThrow(
        () => assertSquareMatrix(new Matrix([[1, 2], [3, 4]]), 'A'),
        'Una 2x2 debería pasar.',
      );
      assertThrows(
        () => assertSquareMatrix(new Matrix([[1, 2, 3], [4, 5, 6]]), 'A'),
        DimensionError,
        'DIMENSION_ERROR',
        'Una 2x3 no es cuadrada.',
      );
    },
  },
  {
    name: 'assertSameDimensions y assertMultipliable distinguen suma de producto',
    fn: () => {
      const a = new Matrix([[1, 2, 3], [4, 5, 6]]); // 2x3
      const b = new Matrix([[1, 2], [3, 4], [5, 6]]); // 3x2

      // Se pueden multiplicar (2x3 · 3x2) pero no sumar.
      assertDoesNotThrow(() => assertMultipliable(a, b), '2x3 por 3x2 es multiplicable.');
      assertThrows(
        () => assertSameDimensions(a, b, 'A', 'B'),
        DimensionError,
        'DIMENSION_ERROR',
        '2x3 y 3x2 no tienen las mismas dimensiones.',
      );
      assertThrows(
        () => assertMultipliable(b, b),
        DimensionError,
        'DIMENSION_ERROR',
        '3x2 por 3x2 no es multiplicable.',
      );
    },
  },
  {
    name: 'assertVectorData rechaza el vector vacío y los no finitos',
    fn: () => {
      assertDoesNotThrow(() => assertVectorData([1], 'v'), 'Un vector de un elemento es válido.');
      assertThrows(() => assertVectorData([], 'v'), DimensionError, 'DIMENSION_ERROR', 'Vector vacío.');
      assertThrows(() => assertVectorData([1, NaN], 'v'), DimensionError, 'DIMENSION_ERROR', 'Vector con NaN.');
      assertThrows(() => assertVectorData([1, '2'], 'v'), DimensionError, 'DIMENSION_ERROR', 'Vector con string.');
      assertThrows(() => assertVectorData('12', 'v'), DimensionError, 'DIMENSION_ERROR', 'Un string no es vector.');
    },
  },
  {
    name: 'assertSameLength compara longitudes, no contenido',
    fn: () => {
      assertDoesNotThrow(() => assertSameLength([1, 2], [9, 9], 'a', 'b'), 'Mismo largo, distinto contenido.');
      assertThrows(
        () => assertSameLength([1, 2], [1], 'a', 'b'),
        DimensionError,
        'DIMENSION_ERROR',
        'Largos distintos.',
      );
    },
  },
];
