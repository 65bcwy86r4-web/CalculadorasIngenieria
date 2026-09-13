/**
 * tests/math/formatter.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/formatter/ — precisión (comparación y redondeo) y
 * formato de salida.
 *
 * `approximatelyEqual` merece atención especial: es la función sobre la que se
 * apoya toda esta suite (ver la nota de tests/assert.js). Se la prueba contra
 * valores exactos y contra casos clásicos de punto flotante, para que una
 * regresión en ella se vea acá y no como un fallo difuso en álgebra.
 *
 * Sobre los ejemplos de docs/API.md para toScientific y formatNumber: ver el
 * comentario de la prueba correspondiente. Las pruebas se escribieron contra
 * la semántica declarada del parámetro (`significantDigits`), no contra los
 * ejemplos, que no coinciden entre sí.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  approximatelyEqual, isApproximatelyZero, roundTo, clean,
  toFixedSmart, toScientific, formatNumber, formatMatrix,
  Matrix, MathError, DEFAULT_TOLERANCE,
} from '../../shared/math/index.js';

import { assertTrue, assertFalse, assertEqual, assertClose, assertThrows } from '../assert.js';

export const tests = [
  /* ------------------------------ precisión ------------------------------ */
  {
    name: 'approximatelyEqual resuelve el caso clásico 0.1 + 0.2 === 0.3',
    fn: () => {
      assertFalse(0.1 + 0.2 === 0.3, 'Premisa: en punto flotante 0.1+0.2 no es exactamente 0.3.');
      assertTrue(approximatelyEqual(0.1 + 0.2, 0.3), 'Con tolerancia por defecto sí son iguales.');
    },
  },
  {
    name: 'approximatelyEqual respeta el borde exacto de la tolerancia',
    fn: () => {
      // La implementación documentada usa <=, no <: el borde entra.
      // Los valores se eligen exactamente representables en binario (0.5, 0.25):
      // con 1 y 1.1 la resta da 0.10000000000000009, mayor que 0.1, y la prueba
      // mediría el error de representación en vez del operador de comparación.
      assertTrue(approximatelyEqual(1, 1.5, 0.5), 'Una diferencia igual a la tolerancia debe entrar.');
      assertFalse(approximatelyEqual(1, 1.5, 0.25), 'Una diferencia mayor a la tolerancia queda fuera.');
      assertTrue(approximatelyEqual(5, 5, 0), 'Con tolerancia 0, dos valores idénticos siguen siendo iguales.');
      assertFalse(approximatelyEqual(5, 5 + 1e-15, 0), 'Con tolerancia 0, cualquier diferencia cuenta.');
    },
  },
  {
    name: 'approximatelyEqual usa DEFAULT_TOLERANCE cuando no se le pasa tolerancia',
    fn: () => {
      // Se compara contra 0 y no contra 1: `1 + 1e-10` no es representable
      // exactamente, y la diferencia real sería 1.0000000827e-10.
      assertTrue(approximatelyEqual(0, DEFAULT_TOLERANCE), 'Justo en la tolerancia por defecto.');
      assertFalse(approximatelyEqual(0, DEFAULT_TOLERANCE * 10), 'Diez veces la tolerancia por defecto.');
    },
  },
  {
    name: 'approximatelyEqual valida sus entradas en vez de devolver false silenciosamente',
    fn: () => {
      // Devolver false ante un NaN sería peor que lanzar: la comparación
      // "falla" sin que nadie se entere de que el dato estaba roto.
      assertThrows(() => approximatelyEqual(NaN, 1), MathError, 'NOT_FINITE', 'a no finito.');
      assertThrows(() => approximatelyEqual(1, Infinity), MathError, 'NOT_FINITE', 'b no finito.');
      assertThrows(() => approximatelyEqual(1, 1, -1), MathError, 'NOT_NON_NEGATIVE', 'Tolerancia negativa.');
    },
  },
  {
    name: 'isApproximatelyZero trata los residuos de punto flotante como cero',
    fn: () => {
      assertTrue(isApproximatelyZero(1e-15), 'Un residuo típico de Gauss es cero.');
      assertTrue(isApproximatelyZero(-1e-15), 'También si es negativo.');
      assertTrue(isApproximatelyZero(0), 'El cero exacto es cero.');
      assertFalse(isApproximatelyZero(1e-9), 'Un valor por encima de la tolerancia no es cero.');
      assertTrue(isApproximatelyZero(1e-9, 1e-6), 'Con tolerancia relajada sí lo es.');
    },
  },
  {
    name: 'roundTo redondea a la cantidad de decimales pedida',
    fn: () => {
      assertClose(roundTo(3.14159, 2), 3.14, 'Redondeo a 2 decimales.');
      assertClose(roundTo(3.14159, 4), 3.1416, 'Redondeo a 4 decimales.');
      assertClose(roundTo(2.5, 0), 3, 'Redondeo de 2.5 a entero (medio arriba).');
      assertClose(roundTo(-2.5, 0), -2, 'Math.round lleva -2.5 hacia +infinito.');
      assertClose(roundTo(1.005, 2), 1, 'Caso clásico: 1.005 no es exacto en binario.');
    },
  },
  {
    name: 'roundTo valida sus entradas',
    fn: () => {
      assertThrows(() => roundTo(NaN, 2), MathError, 'NOT_FINITE', 'Valor no finito.');
      assertThrows(() => roundTo(1.5, 2.5), MathError, 'NOT_INTEGER', 'Decimales no enteros.');
    },
  },
  {
    name: 'clean convierte residuos en cero exacto y redondea el resto',
    fn: () => {
      assertEqual(clean(-1.2e-15), 0, 'Un residuo se limpia a cero exacto.');
      assertFalse(Object.is(clean(-1.2e-15), -0), 'Debería ser +0, no -0.');
      assertClose(clean(2.000049), 2, 'Un valor casi entero se redondea a 4 decimales.');
      assertClose(clean(1.23456789), 1.2346, 'Redondeo a los decimales por defecto.');
      assertClose(clean(1e-9, 1e-6), 0, 'Con tolerancia relajada, 1e-9 es cero.');
    },
  },

  /* ------------------------------- formato ------------------------------- */
  {
    name: 'toFixedSmart no muestra decimales sobrantes',
    fn: () => {
      assertEqual(toFixedSmart(3, 4), '3', 'Un entero no lleva decimales.');
      assertEqual(toFixedSmart(3.14159, 4), '3.1416', 'Se redondea a 4 decimales.');
      assertEqual(toFixedSmart(0.5, 4), '0.5', 'Se recortan los ceros de la derecha.');
      assertEqual(toFixedSmart(-2, 2), '-2', 'También con negativos.');
      assertEqual(toFixedSmart(1.0001, 4), '1.0001', 'No recorta dígitos significativos.');
    },
  },
  {
    name: 'toFixedSmart colapsa a "0" lo que queda por debajo de los decimales pedidos',
    fn: () => {
      // No es un error: es la consecuencia esperada de redondear a 4 decimales.
      // Se documenta como prueba para que quede explícito que la interfaz
      // debería usar formatNumber (que detecta este caso y va a científica) y
      // no toFixedSmart a secas para valores muy chicos.
      assertEqual(toFixedSmart(1e-7, 4), '0', 'Un valor menor que la resolución pedida se muestra como 0.');
      assertEqual(formatNumber(1e-7), '1.000e-7', 'formatNumber, en cambio, preserva la magnitud.');
    },
  },
  {
    name: 'toScientific respeta la cantidad de cifras significativas pedida',
    fn: () => {
      // docs/API.md ejemplifica toScientific(123456, 3) // "1.235e+5", que
      // tiene CUATRO cifras significativas y contradice el nombre del propio
      // parámetro (significantDigits). La implementación es consistente con el
      // nombre: 3 cifras significativas es "1.23e+5". La prueba sigue la
      // semántica declarada; el ejemplo de la documentación está mal.
      assertEqual(toScientific(123456, 3), '1.23e+5', 'Tres cifras significativas.');
      assertEqual(toScientific(123456, 4), '1.235e+5', 'Cuatro cifras significativas.');
      assertEqual(toScientific(0, 3), '0.00e+0', 'El cero también se expresa en científica.');
      assertEqual(toScientific(-0.00012, 2), '-1.2e-4', 'Negativos y exponentes negativos.');
    },
  },
  {
    name: 'formatNumber elige notación fija dentro del rango legible',
    fn: () => {
      assertEqual(formatNumber(42.5), '42.5', 'Un valor común va en notación fija.');
      assertEqual(formatNumber(0), '0', 'El cero nunca va a científica.');
      assertEqual(formatNumber(-1234.5678), '-1234.5678', 'Negativo con decimales.');
      assertEqual(formatNumber(1e8), '100000000', 'El umbral superior es exclusivo.');
    },
  },
  {
    name: 'formatNumber pasa a científica fuera de los umbrales',
    fn: () => {
      assertEqual(formatNumber(1e-6), '1.000e-6', 'Muy chico.');
      assertEqual(formatNumber(1e9), '1.000e+9', 'Muy grande.');
      assertEqual(
        formatNumber(0.5, { scientificBelow: 1 }),
        '5.000e-1',
        'Los umbrales son configurables.',
      );
      assertEqual(
        formatNumber(1e-6, { decimals: 2 }),
        '1.0e-6',
        'decimals controla las cifras de la notación científica.',
      );
    },
  },
  {
    name: 'formatMatrix arma una tabla con una fila por línea',
    fn: () => {
      const texto = formatMatrix(Matrix.identity(2));
      const filas = texto.split('\n');
      assertEqual(filas.length, 2, 'Una línea por fila de la matriz.');
      assertEqual(filas[0].length, 20, 'Dos columnas de ancho 10 por defecto.');
      assertEqual(
        formatMatrix(new Matrix([[1, 2]]), { columnWidth: 3 }),
        '  1  2',
        'El ancho de columna es configurable.',
      );
    },
  },
  {
    name: 'formatMatrix exige un objeto matrix-like, no un arreglo crudo',
    fn: () => {
      assertThrows(() => formatMatrix([[1, 2]]), MathError, 'NOT_MATRIX_LIKE', 'Arreglo 2D crudo.');
    },
  },
];
