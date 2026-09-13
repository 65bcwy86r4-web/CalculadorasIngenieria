/**
 * physics/tensors.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: operaciones de álgebra tensorial de rango 2
 * (tensor de tensiones, tensor de inercia, etc.) que NO ya provee
 * algebra/matrix.js. Un tensor de rango 2 se representa simplemente como
 * una Matrix cuadrada: para suma, resta, escalado, transposición y traza,
 * usar directamente los métodos de Matrix (matrix.add, .subtract,
 * .scalarMultiply, .transpose, .trace) — no se reimplementan acá.
 *
 * Este módulo agrega justamente lo que es específico del análisis
 * tensorial: descomposición simétrica/antisimétrica, doble contracción,
 * valores y direcciones principales (autovalores/autovectores del propio
 * tensor) y la tensión de Von Mises. Los valores/direcciones principales
 * reutilizan algebra/eigen.js en vez de reimplementar un solver, y lo hacen
 * a través de `eigenvalues`, la entrada que despacha, no de un algoritmo en
 * particular (ADR-005).
 * ---------------------------------------------------------------------------
 */

import { eigenvalues, eigenvectors } from '../algebra/eigen.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { DimensionError } from '../errors/dimension-error.js';

/**
 * Parte simétrica de un tensor: Tsym = (T + Tᵀ) / 2.
 * @param {Matrix} tensor
 * @returns {Matrix}
 * @throws {DimensionError} si no es cuadrado
 * @example
 * symmetricPart(new Matrix([[0,2],[0,0]])).toArray(); // [[0,1],[1,0]]
 */
export function symmetricPart(tensor) {
  assertSquareMatrix(tensor, 'tensor');
  return tensor.add(tensor.transpose()).scalarMultiply(0.5);
}

/**
 * Parte antisimétrica (o "esviada") de un tensor: Tanti = (T − Tᵀ) / 2.
 * @param {Matrix} tensor
 * @returns {Matrix}
 * @throws {DimensionError} si no es cuadrado
 * @example
 * antisymmetricPart(new Matrix([[0,2],[0,0]])).toArray(); // [[0,1],[-1,0]]
 */
export function antisymmetricPart(tensor) {
  assertSquareMatrix(tensor, 'tensor');
  return tensor.subtract(tensor.transpose()).scalarMultiply(0.5);
}

/**
 * Doble contracción (producto interno de Frobenius): A:B = Σᵢⱼ Aᵢⱼ·Bᵢⱼ.
 * Aparece, por ejemplo, en el cálculo de energía de deformación.
 * @param {Matrix} a
 * @param {Matrix} b
 * @returns {number}
 * @throws {DimensionError} si a y b no tienen las mismas dimensiones
 * @example
 * doubleContraction(Matrix.identity(2), Matrix.identity(2)); // 2
 */
export function doubleContraction(a, b) {
  if (a.rows !== b.rows || a.cols !== b.cols) {
    throw new DimensionError(`Las dimensiones de A (${a.rows}x${a.cols}) y B (${b.rows}x${b.cols}) deben coincidir para la doble contracción.`, { dimsA: [a.rows, a.cols], dimsB: [b.rows, b.cols] });
  }
  let sum = 0;
  for (let i = 0; i < a.rows; i++) for (let j = 0; j < a.cols; j++) sum += a.data[i][j] * b.data[i][j];
  return sum;
}

/**
 * Valor medio de la diagonal (por ejemplo, la tensión hidrostática de un
 * tensor de tensiones es su traza dividida 3): traza(T) / n.
 * @param {Matrix} tensor
 * @returns {number}
 * @throws {DimensionError} si no es cuadrado
 * @example
 * meanValue(new Matrix([[6,0,0],[0,3,0],[0,0,0]])); // 3
 */
export function meanValue(tensor) {
  return tensor.trace() / tensor.rows;
}

/**
 * Valores principales de un tensor (autovalores). Usa `eigenvalues`, que
 * despacha por tipo de matriz: los tensores físicos (tensión, inercia) son
 * simétricos y van por Jacobi, que converge siempre — incluido el corte
 * puro, de autovalores ±τ, donde el QR sin desplazamiento no converge.
 * @param {Matrix} tensor
 * @returns {number[]} valores principales, de mayor a menor
 * @throws {DimensionError} si no es cuadrado
 * @example
 * principalValues(new Matrix([[2,1],[1,2]])); // [3, 1]
 * @example
 * principalValues(new Matrix([[0,100,0],[100,0,0],[0,0,0]])); // [100, 0, -100]
 */
export function principalValues(tensor) {
  return eigenvalues(tensor).values;
}

/**
 * Valores y direcciones principales de un tensor (autovalores y
 * autovectores): las direcciones principales son los ejes donde el
 * tensor actúa de forma puramente diagonal (sin componentes de corte).
 * @param {Matrix} tensor
 * @returns {Array<{ value: number, direction: number[]|null }>}
 * @example
 * principalDirections(new Matrix([[2,1],[1,2]]));
 */
export function principalDirections(tensor) {
  const values = principalValues(tensor);
  return eigenvectors(tensor, values).map((p) => ({ value: p.lambda, direction: p.vector }));
}

/**
 * Tensión equivalente de Von Mises, indicador escalar de un estado de
 * tensiones multiaxial usado para comparar contra el límite de fluencia
 * del material en análisis estructural.
 *
 * Acepta tensores de 3x3 (caso general) o 2x2 (tensión plana, asumiendo
 * σ₃ = 0). Internamente usa las tensiones principales del tensor.
 * @param {Matrix} stressTensor - tensor de tensiones, simétrico, 2x2 o 3x3
 * @returns {number}
 * @throws {DimensionError} si el tensor no es 2x2 ni 3x3
 * @example
 * vonMisesStress(new Matrix([[100, 0], [0, 0]])); // 100 (tracción uniaxial)
 */
export function vonMisesStress(stressTensor) {
  assertSquareMatrix(stressTensor, 'stressTensor');
  if (stressTensor.rows !== 2 && stressTensor.rows !== 3) {
    throw new DimensionError('vonMisesStress requiere un tensor de 2x2 (tensión plana) o 3x3.', { size: stressTensor.rows });
  }
  const principals = principalValues(stressTensor);
  const [s1, s2, s3] = stressTensor.rows === 2 ? [principals[0], principals[1], 0] : principals;
  return Math.sqrt(0.5 * ((s1 - s2) ** 2 + (s2 - s3) ** 2 + (s3 - s1) ** 2));
}
