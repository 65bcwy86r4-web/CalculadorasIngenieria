/**
 * shared/math/index.js
 * ---------------------------------------------------------------------------
 * PUNTO ÚNICO DE ENTRADA del motor matemático compartido.
 *
 * A partir de este archivo, ninguna calculadora de CalculadorasIngenieria
 * debe importar módulos internos de shared/math/ directamente (por
 * ejemplo, "shared/math/algebra/gauss.js" o "shared/math/units/distance.js").
 * Toda la plataforma importa exclusivamente desde acá:
 *
 *   import { determinantByGauss, inverse, Matrix, convert }
 *     from "../../shared/math/index.js";
 *
 * ¿Por qué? Este archivo es el único contrato estable entre el motor y la
 * interfaz (y, en el futuro, entre el motor y cada nueva calculadora). La
 * organización interna de shared/math/ — qué algoritmo vive en qué
 * archivo, cómo se agrupan algebra/ vs numerical/ vs units/ — puede
 * reorganizarse más adelante sin romper ninguna calculadora, siempre que
 * este archivo se actualice para seguir exportando los mismos nombres.
 *
 * QUÉ ES "API PÚBLICA" Y QUÉ NO
 * Todo lo reexportado desde acá abajo es público y estable: es la API
 * científica de la plataforma (ver docs/API.md para el detalle función
 * por función). Los siguientes elementos son implementación interna y
 * NO se reexportan a propósito — ninguna calculadora debería necesitarlos,
 * y por eso no forman parte del contrato:
 *
 *   - utils/helpers.js::createUnitConverter — fábrica interna que usan
 *     los propios módulos de units/*.js para construirse. Una calculadora
 *     nunca debería inventar su propio conversor ad-hoc con esto: si
 *     falta una unidad, se agrega a la categoría correspondiente (o se
 *     crea una categoría nueva) siguiendo el mismo patrón, no se resuelve
 *     desde afuera del motor.
 *   - validation/matrix.js::isRectangularArray, isSquareData,
 *     assertRectangularArray, assertSquareData — validan arreglos crudos
 *     (number[][]) antes de que existan como Matrix. Una vez que algo es
 *     (o debería ser) una Matrix, se usa isMatrixLike/assertMatrixLike, o
 *     directamente `new Matrix(...)`, que ya valida sola al construirse.
 *   - Los archivos individuales de units/*.js (distance.js, pressure.js,
 *     temperature.js, speed.js, mass.js, energy.js) — siempre se accede a
 *     través de units/index.js, reexportado acá abajo como
 *     convertDistance, convertPressure, etc., y como el dispatcher
 *     general convert().
 *
 * NAMESPACING DE FÍSICA (vectors / tensors)
 * A diferencia del resto del motor (exportado con nombres planos:
 * determinantByGauss, inverse, newtonRaphson...), physics/vectors.js y
 * physics/tensors.js se reexportan agrupados bajo `vectors` y `tensors`
 * (import { vectors, tensors } from "...index.js"; vectors.add(...)).
 * Es una excepción deliberada: sus funciones usan nombres muy genéricos
 * (add, sum, scale, dot, cross...) que es razonable esperar que futuros
 * módulos del roadmap (aerodinámica, estructuras, motores) también
 * quieran usar con otro significado. Agruparlas bajo un namespace evita
 * choques de nombres en el único archivo que el resto de la plataforma
 * importa, sin sacrificar nada de funcionalidad.
 * ---------------------------------------------------------------------------
 */

/* ============================== ÁLGEBRA ============================== */

// Estructura de datos central: construcción, aritmética básica,
// transposición, potencia, propiedades estructurales, normas.
export { Matrix } from './algebra/matrix.js';

// Eliminación de Gauss, Gauss-Jordan, rango y sistemas lineales Ax = b.
export { rowEchelon, reducedRowEchelon, rank, solveSystem } from './algebra/gauss.js';

// Determinante: método principal (Gauss) y teórico (cofactores).
export { determinantByGauss, determinantByCofactors } from './algebra/determinant.js';

// Inversa, adjunta, matriz de cofactores y número de condición.
export { inverse, adjugate, cofactorMatrix, conditionNumber } from './algebra/inverse.js';

// Descomposiciones matriciales.
export { luDecomposition } from './algebra/lu.js';
export { qrDecomposition } from './algebra/qr.js';
export { choleskyDecomposition } from './algebra/cholesky.js';

// Autovalores, autovectores y diagonalización.
export { eigenvaluesQR, eigenvectorFor, eigenvectors, diagonalize } from './algebra/eigen.js';

/* ============================ INTERPOLACIÓN ============================ */

export { linearInterpolate, piecewiseLinear } from './interpolation/linear.js';
export { lagrangeInterpolate, lagrangeBasis } from './interpolation/lagrange.js';
export { cubicSplineInterpolate } from './interpolation/spline.js';

/* =========================== MÉTODOS NUMÉRICOS =========================== */

export { newtonRaphson } from './numerical/newton.js';
export { bisection } from './numerical/bisection.js';
export { secant } from './numerical/secant.js';
export { trapezoidal, simpson } from './numerical/integration.js';

/* ================================ FÍSICA ================================ */
// Ver nota "NAMESPACING DE FÍSICA" más arriba: se agrupan a propósito.

export * as vectors from './physics/vectors.js';
export * as tensors from './physics/tensors.js';

/* ========================= CONVERSIÓN DE UNIDADES ========================= */
// Siempre a través del dispatcher (units/index.js), nunca de los archivos
// individuales de units/*.js.

export {
  convert,
  convertDistance,
  convertPressure,
  convertTemperature,
  convertSpeed,
  convertMass,
  convertEnergy,
  unitsByCategory,
  categoryOf,
} from './units/index.js';

/* ============================== FORMATO ============================== */

export { approximatelyEqual, isApproximatelyZero, roundTo, clean } from './formatter/precision.js';
export { toFixedSmart, toScientific, formatNumber, formatMatrix } from './formatter/format.js';

/* ============================== VALIDACIÓN ============================== */
// Para que una calculadora pueda validar entradas del usuario con las
// mismas reglas (y los mismos mensajes) que usa el motor internamente,
// en vez de reimplementar sus propios chequeos de "¿es un número?".

export {
  isNumber,
  isFiniteNumber,
  isInteger,
  isPositive,
  isNonNegative,
  isInRange,
  assertNumber,
  assertFiniteNumber,
  assertInteger,
  assertPositive,
  assertNonNegative,
  assertInRange,
  assertFunction,
} from './validation/numbers.js';

export {
  isMatrixLike,
  assertMatrixLike,
  assertSquareMatrix,
  assertSameDimensions,
  assertMultipliable,
  assertVectorData,
  assertSameLength,
} from './validation/matrix.js';

/* ================================ ERRORES ================================ */
// Toda excepción que lance el motor es una instancia de alguna de estas
// clases (nunca un throw genérico); una calculadora las captura para
// mostrar mensajes propios en vez de un stack trace.

export { MathError } from './errors/MathError.js';
export { DimensionError } from './errors/DimensionError.js';
export { SingularMatrixError } from './errors/SingularMatrixError.js';
export { InterpolationError } from './errors/InterpolationError.js';

/* ========================== CONSTANTES Y UTILIDADES ========================== */

export {
  DEFAULT_TOLERANCE,
  RELAXED_TOLERANCE,
  DEFAULT_MAX_ITERATIONS,
  DEFAULT_QR_ITERATIONS,
  DEFAULT_DISPLAY_DECIMALS,
  DEFAULT_DERIVATIVE_STEP,
  STANDARD_GRAVITY,
  STANDARD_PRESSURE,
  STANDARD_TEMPERATURE,
  GAS_CONSTANT_AIR,
  UNIVERSAL_GAS_CONSTANT,
  AVOGADRO_NUMBER,
  SPEED_OF_LIGHT,
  ISA_LAPSE_RATE,
} from './utils/constants.js';

export { factorial, sign, clamp, linspace, range, isCallable, deepCloneArray } from './utils/helpers.js';
