import { MathError } from "./MathError.js";

/**
 * Error used when an operation requires a non-singular matrix.
 *
 * @example
 * import { SingularMatrixError } from "./shared/math/errors/SingularMatrixError.js";
 * throw new SingularMatrixError("Matrix determinant is zero");
 */
export class SingularMatrixError extends MathError {
  /**
   * @param {string} message Human-readable error message.
   * @param {object} [details] Optional matrix metadata.
   */
  constructor(message, details = {}) {
    super(message, details);
    this.name = "SingularMatrixError";
  }
}

export default SingularMatrixError;
