/**
 * utils/helpers.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: funciones utilitarias genéricas, sin un hogar
 * natural más específico, reutilizadas por distintos módulos del motor.
 *
 * Incluye también `createUnitConverter`, la fábrica genérica que usan
 * TODOS los módulos de shared/math/units/*.js para implementar su
 * conversión. Esto evita que cada archivo de unidades reimplemente la
 * misma lógica de "convertir a unidad base y de ahí a la unidad destino"
 * (DRY): cada archivo de unidades solo declara SUS datos (factores/fórmulas
 * de conversión a una unidad base), y la mecánica de conversión vive acá,
 * en un único lugar.
 * ---------------------------------------------------------------------------
 */

import { assertFiniteNumber } from '../validation/numbers.js';
import { MathError } from '../errors/MathError.js';

/**
 * @param {number} n - entero no negativo
 * @returns {number} n!
 * @throws {MathError} si n no es entero no negativo
 * @example
 * factorial(5); // 120
 */
export function factorial(n) {
  assertFiniteNumber(n, 'n');
  if (!Number.isInteger(n) || n < 0) {
    throw new MathError('factorial requiere un entero no negativo.', 'NOT_INTEGER', { n });
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * @param {number} x
 * @returns {number} -1, 0 o 1 según el signo de x
 * @example
 * sign(-4.2); // -1
 */
export function sign(x) {
  assertFiniteNumber(x, 'x');
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

/**
 * Restringe x al intervalo [min, max].
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @example
 * clamp(15, 0, 10); // 10
 */
export function clamp(x, min, max) {
  assertFiniteNumber(x, 'x');
  assertFiniteNumber(min, 'min');
  assertFiniteNumber(max, 'max');
  return Math.min(max, Math.max(min, x));
}

/**
 * Genera n valores equiespaciados entre a y b (incluyendo ambos extremos).
 * Útil para graficar funciones o generar puntos de prueba.
 * @param {number} a
 * @param {number} b
 * @param {number} n - cantidad de puntos (n >= 2)
 * @returns {number[]}
 * @throws {MathError} si n < 2
 * @example
 * linspace(0, 1, 5); // [0, 0.25, 0.5, 0.75, 1]
 */
export function linspace(a, b, n) {
  assertFiniteNumber(a, 'a');
  assertFiniteNumber(b, 'b');
  if (!Number.isInteger(n) || n < 2) {
    throw new MathError('linspace requiere n entero >= 2.', 'NOT_INTEGER', { n });
  }
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? b : a + i * step));
}

/**
 * Genera un rango [start, end) con el paso indicado (similar a range de Python,
 * pero con soporte de paso flotante).
 * @param {number} start
 * @param {number} end
 * @param {number} [step=1]
 * @returns {number[]}
 * @throws {MathError} si step es 0
 * @example
 * range(0, 10, 2); // [0, 2, 4, 6, 8]
 */
export function range(start, end, step = 1) {
  assertFiniteNumber(start, 'start');
  assertFiniteNumber(end, 'end');
  assertFiniteNumber(step, 'step');
  if (step === 0) throw new MathError('range requiere un paso distinto de 0.', 'NOT_POSITIVE', { step });
  const values = [];
  if (step > 0) {
    for (let v = start; v < end; v += step) values.push(v);
  } else {
    for (let v = start; v > end; v += step) values.push(v);
  }
  return values;
}

/**
 * @param {*} value
 * @returns {boolean} true si value es invocable (function)
 * @example
 * isCallable(Math.sqrt); // true
 * isCallable(5); // false
 */
export function isCallable(value) {
  return typeof value === 'function';
}

/**
 * Clona profundamente un arreglo (o arreglo de arreglos) de valores planos
 * (números, strings, booleanos). No soporta clases ni funciones anidadas;
 * para eso cada módulo define su propio clone (ver Matrix.clone()).
 * @param {Array} arr
 * @returns {Array}
 * @example
 * deepCloneArray([[1, 2], [3, 4]]); // copia independiente, misma forma
 */
export function deepCloneArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => (Array.isArray(item) ? deepCloneArray(item) : item));
}

/**
 * Fábrica genérica de conversores de unidades. Cada módulo de
 * shared/math/units/*.js define un diccionario de definiciones
 * `{ simbolo: { toBase(v), fromBase(v) } }` y llama a esta función una
 * sola vez para obtener su `convert` y la lista de unidades soportadas.
 *
 * Usar funciones toBase/fromBase (en vez de un simple factor numérico)
 * permite representar tanto conversiones puramente proporcionales
 * (distancia, masa, presión, energía, velocidad) como conversiones
 * afines con desplazamiento (temperatura: °C, °F) con el mismo mecanismo,
 * sin casos especiales en el motor de conversión.
 *
 * @param {Object<string, {toBase: (v:number)=>number, fromBase:(v:number)=>number}>} definitions
 * @param {string} [categoryName='unidad'] - usado solo en mensajes de error
 * @returns {{ convert: (value:number, from:string, to:string)=>number, units: string[] }}
 *
 * @example
 * const { convert } = createUnitConverter({
 *   m:  { toBase: v => v,      fromBase: v => v },
 *   km: { toBase: v => v*1000, fromBase: v => v/1000 },
 * }, 'distancia');
 * convert(1000, 'm', 'km'); // 1
 */
export function createUnitConverter(definitions, categoryName = 'unidad') {
  const units = Object.keys(definitions);

  function assertKnownUnit(unit, paramName) {
    if (!units.includes(unit)) {
      throw new MathError(
        `Unidad de ${categoryName} desconocida en "${paramName}": "${unit}". Unidades soportadas: ${units.join(', ')}.`,
        'UNKNOWN_UNIT',
        { unit, paramName, category: categoryName, supported: units }
      );
    }
  }

  /**
   * @param {number} value
   * @param {string} from - símbolo de unidad de origen
   * @param {string} to - símbolo de unidad de destino
   * @returns {number}
   */
  function convert(value, from, to) {
    assertFiniteNumber(value, 'value');
    assertKnownUnit(from, 'from');
    assertKnownUnit(to, 'to');
    const baseValue = definitions[from].toBase(value);
    return definitions[to].fromBase(baseValue);
  }

  return { convert, units };
}
