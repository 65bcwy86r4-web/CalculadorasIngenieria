/**
 * tests/math/errors.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de la jerarquía de excepciones del motor (shared/math/errors/).
 *
 * Este archivo es la base de todos los demás: el resto de la suite verifica
 * errores con assertThrows(fn, Clase, code), y esa aserción solo tiene sentido
 * si las clases se comportan como dice docs/API.md — `code` estable, herencia
 * correcta y `context` preservado. Si la jerarquía se rompe, conviene que
 * falle acá con un diagnóstico claro, y no en cincuenta pruebas de álgebra
 * con un mensaje confuso.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  MathError,
  DimensionError,
  SingularMatrixError,
  InterpolationError,
} from '../../shared/math/index.js';

import { assertTrue, assertFalse, assertEqual } from '../assert.js';

/** Subclases documentadas, con su `code` por defecto según docs/API.md. */
const SUBCLASSES = [
  { Clase: DimensionError, code: 'DIMENSION_ERROR', nombre: 'DimensionError' },
  { Clase: SingularMatrixError, code: 'SINGULAR_MATRIX', nombre: 'SingularMatrixError' },
  { Clase: InterpolationError, code: 'INTERPOLATION_ERROR', nombre: 'InterpolationError' },
];

export const tests = [
  {
    name: 'MathError usa el code por defecto MATH_ERROR',
    fn: () => {
      const error = new MathError('mensaje cualquiera');
      assertEqual(error.code, 'MATH_ERROR', 'code por defecto de MathError.');
      assertEqual(error.name, 'MathError', 'name de MathError.');
      assertEqual(error.message, 'mensaje cualquiera', 'El mensaje se preserva tal cual.');
    },
  },
  {
    name: 'MathError acepta un code propio y un context',
    fn: () => {
      const error = new MathError('no finito', 'NOT_FINITE', { value: NaN });
      assertEqual(error.code, 'NOT_FINITE', 'code explícito.');
      assertTrue(Number.isNaN(error.context.value), 'El context conserva el valor recibido.');
    },
  },
  {
    name: 'MathError sin context expone un objeto vacío, no undefined',
    fn: () => {
      // Importa porque las calculadoras leen error.context para armar mensajes:
      // si fuera undefined, un acceso a error.context.algo explotaría en la UI.
      const error = new MathError('sin datos');
      assertTrue(
        typeof error.context === 'object' && error.context !== null,
        'context debería ser un objeto aun cuando no se pase nada.',
      );
      assertEqual(Object.keys(error.context).length, 0, 'context por defecto vacío.');
    },
  },
  {
    name: 'toda subclase hereda de MathError y de Error',
    fn: () => {
      SUBCLASSES.forEach(({ Clase, nombre }) => {
        const error = new Clase('mensaje');
        assertTrue(error instanceof MathError, `${nombre} debería heredar de MathError.`);
        assertTrue(error instanceof Error, `${nombre} debería heredar de Error.`);
      });
    },
  },
  {
    name: 'cada subclase fija su code documentado y no lo deja sobrescribir por posición',
    fn: () => {
      SUBCLASSES.forEach(({ Clase, code, nombre }) => {
        // El segundo parámetro de las subclases es `context`, no `code`: si
        // alguien lo confunde, el code debe seguir siendo el de la subclase.
        const error = new Clase('mensaje', { dato: 1 });
        assertEqual(error.code, code, `code de ${nombre}.`);
        assertEqual(error.name, nombre, `name de ${nombre}.`);
        assertEqual(error.context.dato, 1, `context de ${nombre}.`);
      });
    },
  },
  {
    name: 'las subclases no son intercambiables entre sí',
    fn: () => {
      // Una calculadora distingue "matriz singular" de "dimensiones
      // incompatibles" con instanceof; si una heredara de la otra, el catch
      // equivocado se llevaría el error.
      assertFalse(
        new DimensionError('x') instanceof SingularMatrixError,
        'DimensionError no debería ser un SingularMatrixError.',
      );
      assertFalse(
        new SingularMatrixError('x') instanceof InterpolationError,
        'SingularMatrixError no debería ser un InterpolationError.',
      );
      assertFalse(
        new InterpolationError('x') instanceof DimensionError,
        'InterpolationError no debería ser un DimensionError.',
      );
    },
  },
  {
    name: 'las excepciones conservan el stack trace',
    fn: () => {
      const error = new MathError('mensaje');
      assertTrue(typeof error.stack === 'string' && error.stack.length > 0, 'stack presente.');
    },
  },
];
