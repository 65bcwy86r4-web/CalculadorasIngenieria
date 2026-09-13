/**
 * physics/vectors.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: operaciones sobre vectores físicos (fuerzas,
 * velocidades, desplazamientos), representados como arreglos planos de
 * números (number[]). No usa la clase Matrix de algebra/ a propósito:
 * un vector físico de 2 o 3 componentes no necesita la maquinaria de una
 * matriz completa, y mantener este módulo independiente de algebra/
 * evita acoplar la capa de física a la de álgebra para una operación tan
 * elemental. (physics/tensors.js sí depende de algebra/, porque un
 * tensor de rango 2 sí se beneficia de reutilizar Matrix y eigen.js).
 * ---------------------------------------------------------------------------
 */

import { assertVectorData, assertSameLength } from '../validation/matrix.js';
import { assertFiniteNumber } from '../validation/numbers.js';
import { DimensionError } from '../errors/DimensionError.js';

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 * @throws {DimensionError} si a y b tienen longitudes distintas
 * @example
 * add([1, 2], [3, 4]); // [4, 6]
 */
export function add(a, b) {
  assertSameLength(a, b, 'a', 'b');
  return a.map((v, i) => v + b[i]);
}

/**
 * Suma (resultante) de una lista de vectores de igual longitud. Es la
 * operación típica para componer varias fuerzas o velocidades en un
 * único vector resultante.
 * @param {number[][]} vectors - lista de al menos un vector
 * @returns {number[]}
 * @throws {DimensionError} si la lista está vacía o los vectores no tienen igual longitud
 * @example
 * sum([[1, 0], [0, 1], [2, 2]]); // [3, 3]
 */
export function sum(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    throw new DimensionError('sum requiere un arreglo no vacío de vectores.', { count: vectors?.length });
  }
  vectors.forEach((v, i) => assertVectorData(v, `vectors[${i}]`));
  const length = vectors[0].length;
  vectors.forEach((v, i) => {
    if (v.length !== length) throw new DimensionError(`Todos los vectores deben tener la misma longitud (vectors[${i}] tiene ${v.length}, se esperaba ${length}).`, { index: i, length: v.length, expected: length });
  });
  return vectors.reduce((acc, v) => acc.map((val, i) => val + v[i]));
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 * @throws {DimensionError}
 * @example
 * subtract([5, 5], [2, 1]); // [3, 4]
 */
export function subtract(a, b) {
  assertSameLength(a, b, 'a', 'b');
  return a.map((v, i) => v - b[i]);
}

/**
 * @param {number[]} v
 * @param {number} k
 * @returns {number[]}
 * @example
 * scale([1, 2, 3], 2); // [2, 4, 6]
 */
export function scale(v, k) {
  assertVectorData(v, 'v');
  assertFiniteNumber(k, 'k');
  return v.map((val) => val * k);
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} producto escalar (interno)
 * @throws {DimensionError}
 * @example
 * dot([1, 2, 3], [4, 5, 6]); // 32
 */
export function dot(a, b) {
  assertSameLength(a, b, 'a', 'b');
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

/**
 * Producto vectorial, definido únicamente en 3 dimensiones.
 * @param {number[]} a - vector de longitud 3
 * @param {number[]} b - vector de longitud 3
 * @returns {number[]}
 * @throws {DimensionError} si a o b no tienen longitud 3
 * @example
 * cross([1, 0, 0], [0, 1, 0]); // [0, 0, 1]
 */
export function cross(a, b) {
  assertVectorData(a, 'a');
  assertVectorData(b, 'b');
  if (a.length !== 3 || b.length !== 3) {
    throw new DimensionError('cross solo está definido para vectores de 3 componentes.', { lengthA: a.length, lengthB: b.length });
  }
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/**
 * @param {number[]} v
 * @returns {number} magnitud (norma euclídea) del vector
 * @example
 * magnitude([3, 4]); // 5
 */
export function magnitude(v) {
  assertVectorData(v, 'v');
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

/**
 * @param {number[]} v
 * @returns {number[]} vector unitario en la misma dirección que v
 * @throws {DimensionError} code implícito vía MathError si |v| ≈ 0
 * @example
 * normalize([3, 4]); // [0.6, 0.8]
 */
export function normalize(v) {
  const mag = magnitude(v);
  if (mag < 1e-14) {
    throw new DimensionError('No se puede normalizar el vector nulo (magnitud ≈ 0).', { v });
  }
  return v.map((x) => x / mag);
}

/**
 * Ángulo entre dos vectores.
 * @param {number[]} a
 * @param {number[]} b
 * @param {Object} [options={}]
 * @param {boolean} [options.inDegrees=false]
 * @returns {number} ángulo en radianes (o grados si options.inDegrees)
 * @example
 * angleBetween([1, 0], [0, 1], { inDegrees: true }); // 90
 */
export function angleBetween(a, b, options = {}) {
  const { inDegrees = false } = options;
  const cosTheta = dot(a, b) / (magnitude(a) * magnitude(b));
  const clamped = Math.min(1, Math.max(-1, cosTheta));
  const radians = Math.acos(clamped);
  return inDegrees ? (radians * 180) / Math.PI : radians;
}

/**
 * Proyección vectorial de a sobre b.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 * @throws {DimensionError} si b es el vector nulo
 * @example
 * projection([2, 2], [1, 0]); // [2, 0]
 */
export function projection(a, b) {
  assertSameLength(a, b, 'a', 'b');
  const bMagSq = dot(b, b);
  if (bMagSq < 1e-28) throw new DimensionError('No se puede proyectar sobre el vector nulo.', { b });
  const scalar = dot(a, b) / bMagSq;
  return b.map((x) => x * scalar);
}

/**
 * Construye un vector 2D a partir de magnitud y ángulo (coordenadas
 * polares a cartesianas). Útil para descomponer una fuerza o velocidad
 * en sus componentes x/y.
 * @param {number} magnitudeValue
 * @param {number} angleRad - ángulo en radianes, medido desde el eje x
 * @returns {number[]} [x, y]
 * @example
 * fromPolar(10, Math.PI / 2); // [~0, 10]
 */
export function fromPolar(magnitudeValue, angleRad) {
  assertFiniteNumber(magnitudeValue, 'magnitudeValue');
  assertFiniteNumber(angleRad, 'angleRad');
  return [magnitudeValue * Math.cos(angleRad), magnitudeValue * Math.sin(angleRad)];
}

/**
 * Descompone un vector 2D en magnitud y ángulo (cartesianas a polares).
 * @param {number[]} v - vector de longitud 2, [x, y]
 * @returns {{ magnitude: number, angleRad: number }}
 * @throws {DimensionError} si v no tiene longitud 2
 * @example
 * toPolar([0, 10]); // { magnitude: 10, angleRad: 1.5707... }
 */
export function toPolar(v) {
  assertVectorData(v, 'v');
  if (v.length !== 2) throw new DimensionError('toPolar solo está definido para vectores de 2 componentes.', { length: v.length });
  return { magnitude: magnitude(v), angleRad: Math.atan2(v[1], v[0]) };
}
