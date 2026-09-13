/**
 * validation/numbers.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: validar valores numéricos individuales.
 * No sabe nada de matrices, interpolación ni unidades; esos módulos
 * construyen sus propias validaciones (o las de validation/matrix.js)
 * apoyándose en estas funciones cuando corresponde.
 *
 * Se ofrecen dos familias de funciones:
 *  - `isX(value)`: predicados booleanos, nunca lanzan.
 *  - `assertX(value, paramName)`: lanzan MathError si la condición falla,
 *    y devuelven el valor sin modificar si es válido (para poder encadenar
 *    `const n = assertInteger(n, 'n');`).
 * ---------------------------------------------------------------------------
 */

import { MathError } from '../errors/MathError.js';

/**
 * @param {*} value
 * @returns {boolean} true si value es de tipo number (incluye NaN/Infinity)
 * @example
 * isNumber(3.5); // true
 * isNumber('3.5'); // false
 */
export function isNumber(value) {
  return typeof value === 'number';
}

/**
 * @param {*} value
 * @returns {boolean} true si es number, no NaN y finito
 * @example
 * isFiniteNumber(3.5); // true
 * isFiniteNumber(Infinity); // false
 */
export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {*} value
 * @returns {boolean} true si es un entero finito
 * @example
 * isInteger(4); // true
 * isInteger(4.5); // false
 */
export function isInteger(value) {
  return isFiniteNumber(value) && Number.isInteger(value);
}

/**
 * @param {*} value
 * @returns {boolean} true si es number finito y > 0
 * @example
 * isPositive(2); // true
 * isPositive(-2); // false
 */
export function isPositive(value) {
  return isFiniteNumber(value) && value > 0;
}

/**
 * @param {*} value
 * @returns {boolean} true si es number finito y >= 0
 * @example
 * isNonNegative(0); // true
 * isNonNegative(-1); // false
 */
export function isNonNegative(value) {
  return isFiniteNumber(value) && value >= 0;
}

/**
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean} true si value es finito y min <= value <= max
 * @example
 * isInRange(0.5, 0, 1); // true
 */
export function isInRange(value, min, max) {
  return isFiniteNumber(value) && value >= min && value <= max;
}

/**
 * Verifica que value sea de tipo number (permite NaN/Infinity explícitamente;
 * útil cuando ese caso se maneja aparte). Para excluir NaN/Infinity usar
 * assertFiniteNumber.
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'NOT_A_NUMBER'
 * @example
 * assertNumber(3.5, 'x'); // 3.5
 * assertNumber('3.5', 'x'); // lanza MathError
 */
export function assertNumber(value, paramName = 'valor') {
  if (!isNumber(value)) {
    throw new MathError(`El parámetro "${paramName}" debe ser de tipo number (se recibió ${typeof value}).`, 'NOT_A_NUMBER', { paramName, value });
  }
  return value;
}

/**
 * Verifica que value sea un número finito (rechaza NaN, Infinity, -Infinity
 * y cualquier tipo que no sea number).
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'NOT_FINITE'
 * @example
 * assertFiniteNumber(10, 'temperatura'); // 10
 * assertFiniteNumber(Infinity, 'temperatura'); // lanza MathError
 */
export function assertFiniteNumber(value, paramName = 'valor') {
  if (!isFiniteNumber(value)) {
    throw new MathError(`El parámetro "${paramName}" debe ser un número finito (se recibió ${JSON.stringify(value)}).`, 'NOT_FINITE', { paramName, value });
  }
  return value;
}

/**
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'NOT_INTEGER'
 * @example
 * assertInteger(4, 'n'); // 4
 * assertInteger(4.5, 'n'); // lanza MathError
 */
export function assertInteger(value, paramName = 'valor') {
  if (!isInteger(value)) {
    throw new MathError(`El parámetro "${paramName}" debe ser un número entero (se recibió ${JSON.stringify(value)}).`, 'NOT_INTEGER', { paramName, value });
  }
  return value;
}

/**
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'NOT_POSITIVE'
 * @example
 * assertPositive(2, 'radio'); // 2
 * assertPositive(-1, 'radio'); // lanza MathError
 */
export function assertPositive(value, paramName = 'valor') {
  if (!isPositive(value)) {
    throw new MathError(`El parámetro "${paramName}" debe ser un número positivo (se recibió ${JSON.stringify(value)}).`, 'NOT_POSITIVE', { paramName, value });
  }
  return value;
}

/**
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'NOT_NON_NEGATIVE'
 * @example
 * assertNonNegative(0, 'cantidad'); // 0
 * assertNonNegative(-3, 'cantidad'); // lanza MathError
 */
export function assertNonNegative(value, paramName = 'valor') {
  if (!isNonNegative(value)) {
    throw new MathError(`El parámetro "${paramName}" debe ser un número mayor o igual a 0 (se recibió ${JSON.stringify(value)}).`, 'NOT_NON_NEGATIVE', { paramName, value });
  }
  return value;
}

/**
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @param {string} [paramName='valor']
 * @returns {number}
 * @throws {MathError} code 'OUT_OF_RANGE'
 * @example
 * assertInRange(0.5, 0, 1, 'probabilidad'); // 0.5
 */
export function assertInRange(value, min, max, paramName = 'valor') {
  if (!isInRange(value, min, max)) {
    throw new MathError(`El parámetro "${paramName}" debe estar entre ${min} y ${max} (se recibió ${JSON.stringify(value)}).`, 'OUT_OF_RANGE', { paramName, value, min, max });
  }
  return value;
}

/**
 * @param {*} value
 * @param {string} [paramName='valor']
 * @returns {Function}
 * @throws {MathError} code 'NOT_A_FUNCTION'
 * @example
 * assertFunction(x => x * 2, 'f'); // devuelve la misma función
 * assertFunction(5, 'f'); // lanza MathError
 */
export function assertFunction(value, paramName = 'valor') {
  if (typeof value !== 'function') {
    throw new MathError(`El parámetro "${paramName}" debe ser una función (se recibió ${typeof value}).`, 'NOT_A_FUNCTION', { paramName });
  }
  return value;
}
