/**
 * tests/assert.js
 * ---------------------------------------------------------------------------
 * Helpers de aserción de la suite de pruebas del motor.
 *
 * Responsabilidad única: decidir si una condición se cumple y, si no, lanzar
 * un AssertionError con un mensaje que permita entender la falla sin abrir el
 * archivo de prueba. No descubre archivos, no ejecuta pruebas y no imprime
 * nada: eso es responsabilidad de tests/run.js.
 *
 * Dos decisiones de diseño, ambas exigidas por la gobernanza del proyecto:
 *
 * 1. La comparación de flotantes NO se implementa acá. Se delega en
 *    `approximatelyEqual` del propio motor (CODING_STANDARDS.md §10,
 *    tests/README.md). Escribir un `Math.abs(a - b) < tol` propio sería
 *    duplicar un algoritmo que ya existe en shared/ (ENGINEERING_GUIDE.md §67,
 *    DRY) y, peor, dejaría de detectar una regresión en la función de
 *    comparación del motor: si `approximatelyEqual` se rompe, media suite debe
 *    fallar, no seguir pasando con una copia local que quedó sana.
 *
 * 2. `assertThrows` verifica la CLASE y el `code` de la excepción, nunca el
 *    mensaje. El mensaje está pensado para mostrarse al usuario y puede
 *    cambiar de redacción sin que eso sea una regresión (Architecture.md §4,
 *    tests/README.md).
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js (approximatelyEqual)
 * ---------------------------------------------------------------------------
 */

import { approximatelyEqual } from '../shared/math/index.js';

/** Tolerancia por defecto de las aserciones numéricas de la suite. */
export const TEST_TOLERANCE = 1e-9;

/**
 * Error propio de la suite. Tener una clase distinta permite que el ejecutor
 * diferencie "la prueba falló" (AssertionError) de "la prueba explotó por un
 * error inesperado del motor o del propio test" (cualquier otro Error), que
 * son dos diagnósticos muy distintos.
 */
export class AssertionError extends Error {
  /**
   * @param {string} message - Qué se esperaba y qué se obtuvo.
   * @param {Object} [context={}] - Datos adicionales para depurar.
   */
  constructor(message, context = {}) {
    super(message);
    this.name = 'AssertionError';
    this.context = context;
  }
}

/**
 * Representación compacta y legible de cualquier valor, para los mensajes de
 * falla. Se evita JSON.stringify directo porque devuelve `null` para NaN e
 * Infinity, que son justamente los valores que más interesa ver en una falla.
 *
 * @param {*} value
 * @returns {string}
 */
function describe(value) {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    if (Object.is(value, -0)) return '-0';
    return String(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'function') return `[function ${value.name || 'anónima'}]`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(describe).join(', ')}]`;
  if (typeof value === 'object' && typeof value.toArray === 'function') {
    return `Matrix(${value.rows}x${value.cols}) ${describe(value.toArray())}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @param {boolean} condition
 * @param {string} [message='Se esperaba una condición verdadera.']
 * @throws {AssertionError}
 * @example
 * assertTrue(new Matrix([[1,0],[0,1]]).isSquare(), 'la identidad es cuadrada');
 */
export function assertTrue(condition, message = 'Se esperaba una condición verdadera.') {
  if (condition !== true) {
    throw new AssertionError(`${message} (se obtuvo ${describe(condition)})`);
  }
}

/**
 * @param {boolean} condition
 * @param {string} [message='Se esperaba una condición falsa.']
 * @throws {AssertionError}
 * @example
 * assertFalse(isFiniteNumber(NaN), 'NaN no es finito');
 */
export function assertFalse(condition, message = 'Se esperaba una condición falsa.') {
  if (condition !== false) {
    throw new AssertionError(`${message} (se obtuvo ${describe(condition)})`);
  }
}

/**
 * Igualdad ESTRICTA. Reservada para valores exactos por naturaleza: enteros,
 * strings, booleanos, null, undefined. Nunca usar con resultados de cálculos
 * en punto flotante: para eso está assertClose.
 *
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message='Valores distintos.']
 * @throws {AssertionError}
 * @example
 * assertEqual(rank(new Matrix([[1,2],[2,4]])).rank, 1, 'rango de una matriz singular');
 */
export function assertEqual(actual, expected, message = 'Valores distintos.') {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(
      `${message} Esperado: ${describe(expected)}; obtenido: ${describe(actual)}.`,
      { actual, expected },
    );
  }
}

/**
 * Igualdad numérica con tolerancia, delegando en el motor.
 *
 * @param {number} actual
 * @param {number} expected
 * @param {string} [message='Valores numéricos distintos.']
 * @param {number} [tolerance=TEST_TOLERANCE]
 * @throws {AssertionError}
 * @example
 * assertClose(determinantByGauss(new Matrix([[2,1],[1,3]])).value, 5);
 */
export function assertClose(
  actual,
  expected,
  message = 'Valores numéricos distintos.',
  tolerance = TEST_TOLERANCE,
) {
  if (!Number.isFinite(actual)) {
    throw new AssertionError(
      `${message} Se esperaba ${describe(expected)} y se obtuvo un valor no finito: ${describe(actual)}.`,
      { actual, expected, tolerance },
    );
  }
  if (!approximatelyEqual(actual, expected, tolerance)) {
    throw new AssertionError(
      `${message} Esperado: ${describe(expected)}; obtenido: ${describe(actual)}; ` +
        `diferencia: ${describe(Math.abs(actual - expected))}; tolerancia: ${describe(tolerance)}.`,
      { actual, expected, tolerance },
    );
  }
}

/**
 * Compara dos vectores (arreglos planos de números) elemento a elemento.
 *
 * @param {number[]} actual
 * @param {number[]} expected
 * @param {string} [message='Vectores distintos.']
 * @param {number} [tolerance=TEST_TOLERANCE]
 * @throws {AssertionError}
 * @example
 * assertVectorClose(vectors.add([1, 2], [3, 4]), [4, 6]);
 */
export function assertVectorClose(
  actual,
  expected,
  message = 'Vectores distintos.',
  tolerance = TEST_TOLERANCE,
) {
  if (!Array.isArray(actual)) {
    throw new AssertionError(`${message} No es un arreglo: ${describe(actual)}.`, { actual, expected });
  }
  if (actual.length !== expected.length) {
    throw new AssertionError(
      `${message} Longitudes distintas: esperada ${expected.length}, obtenida ${actual.length}. ` +
        `Esperado: ${describe(expected)}; obtenido: ${describe(actual)}.`,
      { actual, expected },
    );
  }
  for (let i = 0; i < expected.length; i += 1) {
    assertClose(
      actual[i],
      expected[i],
      `${message} Difieren en el índice ${i}. Esperado: ${describe(expected)}; obtenido: ${describe(actual)}.`,
      tolerance,
    );
  }
}

/**
 * Compara una Matrix (o cualquier objeto con .toArray()) contra un arreglo 2D.
 *
 * @param {{toArray: function}|number[][]} actual
 * @param {number[][]} expected
 * @param {string} [message='Matrices distintas.']
 * @param {number} [tolerance=TEST_TOLERANCE]
 * @throws {AssertionError}
 * @example
 * assertMatrixClose(inverse(new Matrix([[2,0],[0,4]])).inverse, [[0.5, 0], [0, 0.25]]);
 */
export function assertMatrixClose(
  actual,
  expected,
  message = 'Matrices distintas.',
  tolerance = TEST_TOLERANCE,
) {
  const data = Array.isArray(actual)
    ? actual
    : (actual && typeof actual.toArray === 'function' ? actual.toArray() : null);

  if (data === null) {
    throw new AssertionError(`${message} No es una matriz ni un arreglo 2D: ${describe(actual)}.`, {
      actual,
      expected,
    });
  }
  if (data.length !== expected.length) {
    throw new AssertionError(
      `${message} Cantidad de filas distinta: esperadas ${expected.length}, obtenidas ${data.length}. ` +
        `Esperado: ${describe(expected)}; obtenido: ${describe(data)}.`,
      { actual: data, expected },
    );
  }
  for (let i = 0; i < expected.length; i += 1) {
    assertVectorClose(
      data[i],
      expected[i],
      `${message} Difieren en la fila ${i}. Esperado: ${describe(expected)}; obtenido: ${describe(data)}.`,
      tolerance,
    );
  }
}

/**
 * Verifica que `fn` lance una excepción de la clase indicada y con el `code`
 * indicado. Nunca compara el mensaje: ver la nota 2 del encabezado.
 *
 * @param {function} fn - Función sin argumentos que debería lanzar.
 * @param {function} ErrorClass - Constructor esperado (MathError, DimensionError...).
 * @param {string} expectedCode - Valor esperado de `error.code`.
 * @param {string} [message='La función debía lanzar una excepción.']
 * @returns {Error} La excepción capturada, por si la prueba quiere inspeccionar `context`.
 * @throws {AssertionError}
 * @example
 * assertThrows(() => factorial(-1), MathError, 'NOT_NON_NEGATIVE');
 */
export function assertThrows(
  fn,
  ErrorClass,
  expectedCode,
  message = 'La función debía lanzar una excepción.',
) {
  let thrown = null;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  if (thrown === null) {
    throw new AssertionError(
      `${message} No lanzó nada; se esperaba ${ErrorClass.name} con code '${expectedCode}'.`,
      { expectedCode },
    );
  }
  if (!(thrown instanceof ErrorClass)) {
    throw new AssertionError(
      `${message} Se esperaba ${ErrorClass.name} y se obtuvo ${thrown.name || typeof thrown}: ${thrown.message}`,
      { thrown, expectedCode },
    );
  }
  if (thrown.code !== expectedCode) {
    throw new AssertionError(
      `${message} Clase correcta (${ErrorClass.name}) pero code incorrecto: ` +
        `esperado '${expectedCode}', obtenido ${describe(thrown.code)}. Mensaje: ${thrown.message}`,
      { thrown, expectedCode },
    );
  }
  return thrown;
}

/**
 * Verifica que `fn` NO lance. Útil para casos límite donde la duda es
 * precisamente si el motor considera válida una entrada (matriz 1x1, vector
 * de un elemento, intervalo degenerado).
 *
 * @param {function} fn
 * @param {string} [message='La función no debía lanzar.']
 * @returns {*} Lo que devolvió `fn`.
 * @throws {AssertionError}
 * @example
 * assertDoesNotThrow(() => determinantByGauss(new Matrix([[7]])));
 */
export function assertDoesNotThrow(fn, message = 'La función no debía lanzar.') {
  try {
    return fn();
  } catch (error) {
    throw new AssertionError(`${message} Lanzó ${error.name}: ${error.message}`, { error });
  }
}
