import { MathError } from "./MathError.js";

/**
 * Error used by interpolation modules when input points are invalid.
 *
 * @example
 * import { InterpolationError } from "./shared/math/errors/InterpolationError.js";
 * throw new InterpolationError("At least two points are required");
 */
export class InterpolationError extends MathError {
  /**
   * @param {string} message Human-readable error message.
   * @param {object} [details] Optional interpolation metadata.
   */
  constructor(message, details = {}) {
    super(message, details);
    this.name = "InterpolationError";
  }
}

export default InterpolationError;
