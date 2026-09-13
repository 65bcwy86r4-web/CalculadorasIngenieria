import { DimensionError } from "../errors/DimensionError.js";
import { MathError } from "../errors/MathError.js";
import { validateFiniteNumber, validateInteger } from "../validation/numbers.js";

function validateShape(shape) {
  if (!Array.isArray(shape) || shape.length === 0) {
    throw new DimensionError("Tensor shape must be a non-empty array", { shape });
  }
  for (let index = 0; index < shape.length; index++) {
    validateInteger(shape[index], `shape[${index}]`);
    if (shape[index] <= 0) {
      throw new DimensionError("Tensor dimensions must be positive", { shape });
    }
  }
}

function mapTensor(tensor, mapper, path = []) {
  if (Array.isArray(tensor)) {
    return tensor.map((item, index) => mapTensor(item, mapper, [...path, index]));
  }
  validateFiniteNumber(tensor, `tensor[${path.join("][")}]`);
  return mapper(tensor, path);
}

function assertSameTensorShape(shapeA, shapeB) {
  if (shapeA.length !== shapeB.length || shapeA.some((value, index) => value !== shapeB[index])) {
    throw new DimensionError("Tensors must have the same shape", {
      left: shapeA,
      right: shapeB,
    });
  }
}

function combineTensors(tensorA, tensorB, operation) {
  const shapeA = tensorShape(tensorA);
  const shapeB = tensorShape(tensorB);
  assertSameTensorShape(shapeA, shapeB);
  if (!Array.isArray(tensorA)) {
    return operation(tensorA, tensorB);
  }
  return tensorA.map((item, index) => combineTensors(item, tensorB[index], operation));
}

/**
 * Returns the shape of a rectangular tensor.
 *
 * @param {*} tensor Tensor data.
 * @returns {number[]} Tensor shape.
 *
 * @example
 * tensorShape([[[1], [2]], [[3], [4]]]); // [2, 2, 1]
 */
export function tensorShape(tensor) {
  if (!Array.isArray(tensor)) {
    validateFiniteNumber(tensor, "tensor");
    return [];
  }
  if (tensor.length === 0) {
    throw new DimensionError("Tensor dimensions cannot be empty");
  }
  const firstShape = tensorShape(tensor[0]);
  for (let index = 1; index < tensor.length; index++) {
    const currentShape = tensorShape(tensor[index]);
    assertSameTensorShape(firstShape, currentShape);
  }
  return [tensor.length, ...firstShape];
}

/**
 * Creates a tensor with a given shape.
 *
 * @param {number[]} shape Tensor shape.
 * @param {number|((indices:number[])=>number)} [fill=0] Fill value or initializer.
 * @returns {*} Tensor data.
 *
 * @example
 * createTensor([2, 2], 0); // [[0, 0], [0, 0]]
 */
export function createTensor(shape, fill = 0) {
  validateShape(shape);
  const isInitializer = typeof fill === "function";
  if (!isInitializer) validateFiniteNumber(fill, "fill");

  function build(depth, indices) {
    if (depth === shape.length) {
      const value = isInitializer ? fill(indices) : fill;
      return validateFiniteNumber(value, `tensor[${indices.join("][")}]`);
    }
    return Array.from({ length: shape[depth] }, (_, index) => build(depth + 1, [...indices, index]));
  }

  return build(0, []);
}

/**
 * Adds tensors with identical shape.
 *
 * @param {*} tensorA First tensor.
 * @param {*} tensorB Second tensor.
 * @returns {*} Tensor sum.
 *
 * @example
 * addTensors([[1]], [[2]]); // [[3]]
 */
export function addTensors(tensorA, tensorB) {
  return combineTensors(tensorA, tensorB, (a, b) => a + b);
}

/**
 * Subtracts tensors with identical shape.
 *
 * @param {*} tensorA First tensor.
 * @param {*} tensorB Second tensor.
 * @returns {*} Tensor difference.
 *
 * @example
 * subtractTensors([[3]], [[2]]); // [[1]]
 */
export function subtractTensors(tensorA, tensorB) {
  return combineTensors(tensorA, tensorB, (a, b) => a - b);
}

/**
 * Scales a tensor.
 *
 * @param {*} tensor Tensor data.
 * @param {number} scalar Scalar value.
 * @returns {*} Scaled tensor.
 *
 * @example
 * scaleTensor([[1, 2]], 2); // [[2, 4]]
 */
export function scaleTensor(tensor, scalar) {
  tensorShape(tensor);
  validateFiniteNumber(scalar, "scalar");
  return mapTensor(tensor, (value) => value * scalar);
}

/**
 * Computes the outer product of two vectors as a rank-2 tensor.
 *
 * @param {number[]} vectorA First vector.
 * @param {number[]} vectorB Second vector.
 * @returns {number[][]} Outer product.
 *
 * @example
 * outerProduct([1, 2], [3, 4]); // [[3, 4], [6, 8]]
 */
export function outerProduct(vectorA, vectorB) {
  const shapeA = tensorShape(vectorA);
  const shapeB = tensorShape(vectorB);
  if (shapeA.length !== 1 || shapeB.length !== 1) {
    throw new DimensionError("Outer product requires vectors", { shapeA, shapeB });
  }
  return vectorA.map((left) => vectorB.map((right) => left * right));
}

/**
 * Computes the trace of a rank-2 tensor.
 *
 * @param {number[][]} tensor Rank-2 tensor.
 * @returns {number} Trace.
 *
 * @example
 * tensorTrace([[1, 2], [3, 4]]); // 5
 */
export function tensorTrace(tensor) {
  const shape = tensorShape(tensor);
  if (shape.length !== 2 || shape[0] !== shape[1]) {
    throw new MathError("Tensor trace requires a square rank-2 tensor", { shape });
  }
  let sum = 0;
  for (let index = 0; index < shape[0]; index++) {
    sum += tensor[index][index];
  }
  return sum;
}

export default Object.freeze({
  tensorShape,
  createTensor,
  addTensors,
  subtractTensors,
  scaleTensor,
  outerProduct,
  tensorTrace,
});
