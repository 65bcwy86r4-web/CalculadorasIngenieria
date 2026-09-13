/**
 * tests/math/api-surface.test.js
 * ---------------------------------------------------------------------------
 * Prueba de contrato de la API pública: verifica que shared/math/index.js
 * exporte exactamente los nombres documentados en docs/API.md, con el tipo
 * correcto cada uno.
 *
 * Por qué existe este archivo: ENGINEERING_GUIDE.md §8 y AI_RULES.md §12
 * dicen que la estructura interna puede cambiar pero la API pública no. Esa
 * regla necesita algo que la haga cumplir, y leer el índice a ojo no la hace
 * cumplir. El Paso 2 del HANDOFF (port de capacidades desde legacy/motor-v1/)
 * toca el núcleo del motor: si en ese trabajo desaparece o se renombra un
 * export, esta prueba lo detecta en el acto, antes de que una calculadora se
 * rompa en producción.
 *
 * La lista de abajo se transcribió de docs/API.md, no de index.js. Es
 * deliberado: si se copiara del índice, la prueba diría "el índice exporta lo
 * que el índice exporta", que es una tautología. Comparada contra la
 * documentación, detecta las dos direcciones del desfasaje — algo que se
 * documentó y no se exporta, y algo que se exporta sin documentar.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import * as engine from '../../shared/math/index.js';

import { assertTrue, assertEqual, AssertionError } from '../assert.js';

/** Nombres que docs/API.md documenta como funciones de la API pública. */
const EXPECTED_FUNCTIONS = [
  // Álgebra
  'rowEchelon', 'reducedRowEchelon', 'rank', 'solveSystem',
  'determinantByGauss', 'determinantByCofactors',
  'inverse', 'adjugate', 'cofactorMatrix', 'conditionNumber',
  'luDecomposition', 'qrDecomposition', 'choleskyDecomposition',
  'eigenvaluesQR', 'jacobiEigenDecomposition', 'eigenvalues2x2',
  'eigenvectorFor', 'eigenvectors', 'diagonalize',
  // Interpolación
  'linearInterpolate', 'piecewiseLinear',
  'lagrangeInterpolate', 'lagrangeBasis', 'cubicSplineInterpolate',
  // Métodos numéricos
  'newtonRaphson', 'bisection', 'secant', 'trapezoidal', 'simpson',
  // Unidades
  'convert', 'convertDistance', 'convertPressure', 'convertTemperature',
  'convertSpeed', 'convertMass', 'convertEnergy', 'categoryOf',
  // Formato
  'approximatelyEqual', 'isApproximatelyZero', 'roundTo', 'clean',
  'toFixedSmart', 'toScientific', 'formatNumber', 'formatMatrix',
  // Validación de números
  'isNumber', 'isFiniteNumber', 'isInteger', 'isPositive', 'isNonNegative',
  'isInRange', 'assertNumber', 'assertFiniteNumber', 'assertInteger',
  'assertPositive', 'assertNonNegative', 'assertInRange', 'assertFunction',
  // Validación de matrices
  'isMatrixLike', 'assertMatrixLike', 'assertSquareMatrix',
  'assertSameDimensions', 'assertMultipliable', 'assertVectorData',
  'assertSameLength',
  // Utilidades
  'factorial', 'sign', 'clamp', 'linspace', 'range', 'isCallable',
  'deepCloneArray',
];

/** Clases documentadas (constructores). */
const EXPECTED_CLASSES = [
  'Matrix', 'MathError', 'DimensionError', 'SingularMatrixError', 'InterpolationError',
];

/** Constantes numéricas documentadas, con su valor exacto según docs/API.md. */
const EXPECTED_CONSTANTS = {
  DEFAULT_TOLERANCE: 1e-10,
  RELAXED_TOLERANCE: 1e-6,
  DEFAULT_MAX_ITERATIONS: 100,
  DEFAULT_QR_ITERATIONS: 500,
  DEFAULT_DISPLAY_DECIMALS: 4,
  DEFAULT_DERIVATIVE_STEP: 1e-6,
  STANDARD_GRAVITY: 9.80665,
  STANDARD_PRESSURE: 101325,
  STANDARD_TEMPERATURE: 288.15,
  GAS_CONSTANT_AIR: 287.05287,
  UNIVERSAL_GAS_CONSTANT: 8.31446261815324,
  AVOGADRO_NUMBER: 6.02214076e23,
  SPEED_OF_LIGHT: 299792458,
  ISA_LAPSE_RATE: -0.0065,
};

/** Namespaces agrupados a propósito (ver la nota de index.js sobre física). */
const EXPECTED_NAMESPACES = {
  vectors: [
    'add', 'sum', 'subtract', 'scale', 'dot', 'cross', 'magnitude',
    'normalize', 'angleBetween', 'projection', 'fromPolar', 'toPolar',
  ],
  tensors: [
    'symmetricPart', 'antisymmetricPart', 'doubleContraction', 'meanValue',
    'principalValues', 'principalDirections', 'vonMisesStress',
  ],
};

/** Objetos de datos exportados (no funciones). */
const EXPECTED_DATA_OBJECTS = ['unitsByCategory'];

/** Implementación interna que NO debe reexportarse (index.js, sección de API pública). */
const MUST_NOT_BE_EXPORTED = [
  'createUnitConverter',
  'isRectangularArray',
  'isSquareData',
  'assertRectangularArray',
  'assertSquareData',
];

/**
 * Todos los nombres que docs/API.md declara públicos, en un solo arreglo.
 * @returns {string[]}
 */
function allDocumentedNames() {
  return [
    ...EXPECTED_FUNCTIONS,
    ...EXPECTED_CLASSES,
    ...Object.keys(EXPECTED_CONSTANTS),
    ...Object.keys(EXPECTED_NAMESPACES),
    ...EXPECTED_DATA_OBJECTS,
  ];
}

export const tests = [
  {
    name: 'toda función documentada en API.md se exporta y es una función',
    fn: () => {
      const faltantes = EXPECTED_FUNCTIONS.filter((name) => typeof engine[name] !== 'function');
      assertEqual(
        faltantes.length,
        0,
        `Funciones documentadas ausentes o que no son funciones: ${faltantes.join(', ')}.`,
      );
    },
  },
  {
    name: 'toda clase documentada se exporta y es construible',
    fn: () => {
      const faltantes = EXPECTED_CLASSES.filter((name) => typeof engine[name] !== 'function');
      assertEqual(faltantes.length, 0, `Clases documentadas ausentes: ${faltantes.join(', ')}.`);
    },
  },
  {
    name: 'toda constante documentada se exporta con el valor exacto de API.md',
    fn: () => {
      Object.entries(EXPECTED_CONSTANTS).forEach(([name, expected]) => {
        // Igualdad estricta a propósito: una constante no es el resultado de
        // un cálculo, es un dato. Si cambió aunque sea en el último bit, es un
        // cambio de contrato que hay que ver.
        assertEqual(engine[name], expected, `Constante ${name}.`);
      });
    },
  },
  {
    name: 'los namespaces vectors y tensors exponen todas sus funciones documentadas',
    fn: () => {
      Object.entries(EXPECTED_NAMESPACES).forEach(([namespace, functionNames]) => {
        assertTrue(
          typeof engine[namespace] === 'object' && engine[namespace] !== null,
          `El namespace ${namespace} debería exportarse como objeto.`,
        );
        const faltantes = functionNames.filter((name) => typeof engine[namespace][name] !== 'function');
        assertEqual(faltantes.length, 0, `Faltan en ${namespace}: ${faltantes.join(', ')}.`);
      });
    },
  },
  {
    name: 'unitsByCategory es un objeto de datos con las seis categorías',
    fn: () => {
      const { unitsByCategory } = engine;
      assertTrue(
        typeof unitsByCategory === 'object' && unitsByCategory !== null,
        'unitsByCategory debería ser un objeto.',
      );
      assertEqual(Object.keys(unitsByCategory).length, 6, 'Cantidad de categorías físicas.');
      Object.entries(unitsByCategory).forEach(([category, units]) => {
        assertTrue(Array.isArray(units) && units.length > 0, `La categoría ${category} debería listar unidades.`);
      });
    },
  },
  {
    name: 'la implementación interna NO se filtra a la API pública',
    fn: () => {
      const filtrados = MUST_NOT_BE_EXPORTED.filter((name) => name in engine);
      assertEqual(
        filtrados.length,
        0,
        `Implementación interna reexportada desde index.js: ${filtrados.join(', ')}. ` +
          'index.js declara explícitamente que no forman parte del contrato.',
      );
    },
  },
  {
    name: 'index.js no exporta nada que API.md no documente',
    fn: () => {
      const documentados = new Set(allDocumentedNames());
      const sinDocumentar = Object.keys(engine).filter((name) => !documentados.has(name));
      if (sinDocumentar.length > 0) {
        throw new AssertionError(
          `index.js exporta ${sinDocumentar.length} nombre(s) que docs/API.md no documenta: ` +
            `${sinDocumentar.join(', ')}. O falta documentarlos, o no deberían ser públicos.`,
          { sinDocumentar },
        );
      }
    },
  },
  {
    name: 'la superficie pública tiene exactamente el tamaño documentado',
    fn: () => {
      assertEqual(
        Object.keys(engine).length,
        allDocumentedNames().length,
        'Cantidad total de exportaciones de shared/math/index.js.',
      );
    },
  },
];
