import { DimensionError } from "../errors/DimensionError.js";
import { MathError } from "../errors/MathError.js";
import { cleanNumber, isNearlyZero } from "../formatter/precision.js";
import { DEFAULT_TOLERANCE } from "../utils/constants.js";
import { validateFiniteNumber } from "../validation/numbers.js";
import { validateVector, validateVectorLength } from "../validation/matrix.js";

function validateSameLength(vectorA, vectorB) {
  validateVector(vectorA, "vectorA");
  validateVector(vectorB, "vectorB");
  if (vectorA.length !== vectorB.length) {
    throw new DimensionError("Vectors must have the same length", {
      left: vectorA.length,
      right: vectorB.length,
    });
  }
}

/**
 * Adds two vectors.
 *
 * @param {number[]} vectorA First vector.
 * @param {number[]} vectorB Second vector.
 * @returns {number[]} Vector sum.
 *
 * @example
 * addVectors([1, 2], [3, 4]); // [4, 6]
 */
export function addVectors(vectorA, vectorB) {
  validateSameLength(vectorA, vectorB);
  return vectorA.map((value, index) => cleanNumber(value + vectorB[index]));
}

/**
 * Subtracts two vectors.
 *
 * @param {number[]} vectorA First vector.
 * @param {number[]} vectorB Second vector.
 * @returns {number[]} Vector difference.
 *
 * @example
 * subtractVectors([3, 4], [1, 2]); // [2, 2]
 */
export function subtractVectors(vectorA, vectorB) {
  validateSameLength(vectorA, vectorB);
  return vectorA.map((value, index) => cleanNumber(value - vectorB[index]));
}

/**
 * Scales a vector.
 *
 * @param {number[]} vector Vector data.
 * @param {number} scalar Scalar value.
 * @returns {number[]} Scaled vector.
 *
 * @example
 * scaleVector([1, 2], 3); // [3, 6]
 */
export function scaleVector(vector, scalar) {
  validateVector(vector);
  validateFiniteNumber(scalar, "scalar");
  return vector.map((value) => cleanNumber(value * scalar));
}

/**
 * Computes the dot product.
 *
 * @param {number[]} vectorA First vector.
 * @param {number[]} vectorB Second vector.
 * @returns {number} Dot product.
 *
 * @example
 * dotProduct([1, 2], [3, 4]); // 11
 */
export function dotProduct(vectorA, vectorB) {
  validateSameLength(vectorA, vectorB);
  return cleanNumber(vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0));
}

/**
 * Computes the 3D cross product.
 *
 * @param {number[]} vectorA First 3D vector.
 * @param {number[]} vectorB Second 3D vector.
 * @returns {number[]} Cross product.
 *
 * @example
 * crossProduct([1, 0, 0], [0, 1, 0]); // [0, 0, 1]
 */
export function crossProduct(vectorA, vectorB) {
  validateVectorLength(vectorA, 3, "vectorA");
  validateVectorLength(vectorB, 3, "vectorB");
  return [
    cleanNumber(vectorA[1] * vectorB[2] - vectorA[2] * vectorB[1]),
    cleanNumber(vectorA[2] * vectorB[0] - vectorA[0] * vectorB[2]),
    cleanNumber(vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0]),
  ];
}

/**
 * Computes vector magnitude.
 *
 * @param {number[]} vector Vector data.
 * @returns {number} Magnitude.
 *
 * @example
 * magnitude([3, 4]); // 5
 */
export function magnitude(vector) {
  validateVector(vector);
  return Math.sqrt(dotProduct(vector, vector));
}

/**
 * Normalizes a vector.
 *
 * @param {number[]} vector Vector data.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Zero tolerance.
 * @returns {number[]} Unit vector.
 *
 * @example
 * normalize([3, 4]); // [0.6, 0.8]
 */
export function normalize(vector, tolerance = DEFAULT_TOLERANCE) {
  const length = magnitude(vector);
  if (isNearlyZero(length, tolerance)) {
    throw new MathError("Cannot normalize a zero vector");
  }
  return scaleVector(vector, 1 / length);
}

/**
 * Computes the angle between two vectors in radians.
 *
 * @param {number[]} vectorA First vector.
 * @param {number[]} vectorB Second vector.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Zero tolerance.
 * @returns {number} Angle in radians.
 *
 * @example
 * angleBetween([1, 0], [0, 1]); // Math.PI / 2
 */
export function angleBetween(vectorA, vectorB, tolerance = DEFAULT_TOLERANCE) {
  validateSameLength(vectorA, vectorB);
  const lengthA = magnitude(vectorA);
  const lengthB = magnitude(vectorB);
  if (isNearlyZero(lengthA, tolerance) || isNearlyZero(lengthB, tolerance)) {
    throw new MathError("Angle is undefined for zero vectors");
  }
  const cosine = Math.max(-1, Math.min(1, dotProduct(vectorA, vectorB) / (lengthA * lengthB)));
  return Math.acos(cosine);
}

/**
 * Projects vectorA onto vectorB.
 *
 * @param {number[]} vectorA Vector to project.
 * @param {number[]} vectorB Target vector.
 * @param {number} [tolerance=DEFAULT_TOLERANCE] Zero tolerance.
 * @returns {number[]} Projection vector.
 *
 * @example
 * projection([2, 2], [1, 0]); // [2, 0]
 */
export function projection(vectorA, vectorB, tolerance = DEFAULT_TOLERANCE) {
  validateSameLength(vectorA, vectorB);
  const denominator = dotProduct(vectorB, vectorB);
  if (isNearlyZero(denominator, tolerance)) {
    throw new MathError("Projection target cannot be a zero vector");
  }
  return scaleVector(vectorB, dotProduct(vectorA, vectorB) / denominator);
}

export default Object.freeze({
  addVectors,
  subtractVectors,
  scaleVector,
  dotProduct,
  crossProduct,
  magnitude,
  normalize,
  angleBetween,
  projection,
});
