import { MathError } from "./MathError.js";

/**
 * Error used when matrix, vector, or tensor dimensions are invalid.
 *
 * @example
 * import { DimensionError } from "./shared/math/errors/DimensionError.js";
 * throw new DimensionError("Matrix sizes are not compatible");
 */
export class DimensionError extends MathError {
  /**
   * @param {string} message Human-readable error message.
   * @param {object} [details] Optional dimension metadata.
   */
  constructor(message, details = {}) {
    super(message, details);
    this.name = "DimensionError";
  }
}

export default DimensionError;
