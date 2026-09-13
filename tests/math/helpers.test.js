/**
 * tests/math/helpers.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/utils/: las utilidades genéricas (factorial, sign,
 * clamp, linspace, range, isCallable, deepCloneArray).
 *
 * Las constantes no se prueban acá: su verificación contra los valores de
 * docs/API.md está en api-surface.test.js, que es donde corresponde, porque lo
 * que se verifica de una constante es que forme parte del contrato público con
 * el valor documentado.
 *
 * deepCloneArray merece una prueba propia y no es un detalle: varias funciones
 * del motor lo usan para no mutar las entradas del usuario. Si clonara
 * superficialmente, una calculadora vería su propio arreglo modificado después
 * de un cálculo, que es el tipo de error que aparece recién tres pantallas
 * después y cuesta muchísimo rastrear.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  factorial, sign, clamp, linspace, range, isCallable, deepCloneArray, MathError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertFalse, assertEqual, assertClose, assertVectorClose, assertThrows,
} from '../assert.js';

export const tests = [
  {
    name: 'factorial reproduce la secuencia conocida',
    fn: () => {
      assertClose(factorial(0), 1, '0! = 1 por definición.');
      assertClose(factorial(1), 1, '1! = 1.');
      assertClose(factorial(5), 120, '5! = 120.');
      assertClose(factorial(10), 3628800, '10! = 3 628 800.');
      assertClose(factorial(20), 2432902008176640000, '20! (último exacto en doble precisión).');
    },
  },
  {
    name: 'factorial rechaza negativos y no enteros',
    fn: () => {
      assertThrows(() => factorial(-1), MathError, 'NOT_INTEGER', 'Factorial de un negativo.');
      assertThrows(() => factorial(2.5), MathError, 'NOT_INTEGER', 'Factorial de un decimal.');
      // NaN se rechaza antes, en la validación de finitud: por eso el code es
      // NOT_FINITE y no NOT_INTEGER. Se fija para que quede documentado cuál
      // de las dos validaciones corre primero.
      assertThrows(() => factorial(NaN), MathError, 'NOT_FINITE', 'Factorial de NaN.');
      assertThrows(() => factorial(Infinity), MathError, 'NOT_FINITE', 'Factorial de Infinity.');
    },
  },
  {
    name: 'sign devuelve -1, 0 o 1',
    fn: () => {
      assertClose(sign(-4.2), -1, 'Negativo.');
      assertClose(sign(0), 0, 'Cero.');
      assertClose(sign(0.0001), 1, 'Positivo chico.');
      assertClose(sign(-1e-300), -1, 'Negativo muy chico sigue siendo negativo.');
    },
  },
  {
    name: 'clamp acota por ambos lados y deja pasar lo que está en rango',
    fn: () => {
      assertClose(clamp(15, 0, 10), 10, 'Por encima del máximo.');
      assertClose(clamp(-5, 0, 10), 0, 'Por debajo del mínimo.');
      assertClose(clamp(5, 0, 10), 5, 'Dentro del rango.');
      assertClose(clamp(0, 0, 10), 0, 'Exactamente en el mínimo.');
      assertClose(clamp(10, 0, 10), 10, 'Exactamente en el máximo.');
    },
  },
  {
    name: 'linspace incluye ambos extremos y reparte de forma equiespaciada',
    fn: () => {
      assertVectorClose(linspace(0, 1, 5), [0, 0.25, 0.5, 0.75, 1], 'Cinco puntos entre 0 y 1.');
      assertVectorClose(linspace(0, 10, 2), [0, 10], 'El mínimo son dos puntos: los extremos.');
      assertVectorClose(linspace(-1, 1, 3), [-1, 0, 1], 'Rango simétrico.');
      assertVectorClose(linspace(5, 0, 6), [5, 4, 3, 2, 1, 0], 'De mayor a menor.');
    },
  },
  {
    name: 'linspace exige n >= 2',
    fn: () => {
      assertThrows(() => linspace(0, 1, 1), MathError, 'NOT_INTEGER', 'Un solo punto no define un paso.');
      assertThrows(() => linspace(0, 1, 0), MathError, 'NOT_INTEGER', 'Cero puntos.');
      assertThrows(() => linspace(0, 1, 2.5), MathError, 'NOT_INTEGER', 'n no entero.');
    },
  },
  {
    name: 'range excluye el extremo derecho',
    fn: () => {
      assertVectorClose(range(0, 10, 2), [0, 2, 4, 6, 8], 'El 10 queda afuera.');
      assertVectorClose(range(0, 5), [0, 1, 2, 3, 4], 'Paso 1 por defecto.');
      assertVectorClose(range(3, 3), [], 'Rango vacío.');
      assertVectorClose(range(5, 0, -1), [5, 4, 3, 2, 1], 'Paso negativo.');
    },
  },
  {
    name: 'range con paso 0 lanza en vez de colgarse',
    fn: () => {
      // Sin esta validación el bucle no termina nunca y la pestaña se congela:
      // el tipo de error que en una interfaz web no deja ni un mensaje.
      assertThrows(() => range(0, 10, 0), MathError, 'NOT_POSITIVE', 'Paso cero.');
    },
  },
  {
    name: 'isCallable distingue funciones de todo lo demás',
    fn: () => {
      assertTrue(isCallable(Math.sqrt), 'Una función nativa.');
      assertTrue(isCallable(() => 1), 'Una flecha.');
      assertTrue(isCallable(function nombrada() {}), 'Una función con nombre.');
      assertFalse(isCallable(42), 'Un número.');
      assertFalse(isCallable('Math.sqrt'), 'Un string con nombre de función.');
      assertFalse(isCallable(null), 'null.');
      assertFalse(isCallable({}), 'Un objeto.');
    },
  },
  {
    name: 'deepCloneArray copia arreglos planos sin compartir referencia',
    fn: () => {
      const original = [1, 2, 3];
      const copia = deepCloneArray(original);
      copia[0] = 99;
      assertEqual(original[0], 1, 'El original no cambia.');
      assertVectorClose(copia, [99, 2, 3], 'La copia sí.');
    },
  },
  {
    name: 'deepCloneArray copia también el segundo nivel',
    fn: () => {
      // Es la diferencia entre un clon profundo y un .slice(): si las filas
      // internas se compartieran, mutar la copia cambiaría el original.
      const original = [[1, 2], [3, 4]];
      const copia = deepCloneArray(original);
      copia[0][0] = 99;
      assertEqual(original[0][0], 1, 'La fila interna del original no debería cambiar.');
      assertEqual(copia[0][0], 99, 'La de la copia sí.');
    },
  },
];
