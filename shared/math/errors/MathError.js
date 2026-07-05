/**
 * Base error for the reusable math engine.
 *
 * @example
 * import { MathError } from "./shared/math/errors/MathError.js";
 * throw new MathError("Invalid numeric operation", { operation: "sqrt" });
 */
export class MathError extends Error {
  /**
   * @param {string} message Human-readable error message.
   * @param {object} [details] Optional structured context for callers.
   */
  constructor(message, details = {}) {
    super(message);
    this.name = "MathError";
    this.details = details;
  }
}

export default MathError;
