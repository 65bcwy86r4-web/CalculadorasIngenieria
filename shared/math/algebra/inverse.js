/**
 * algebra/inverse.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: inversa de una matriz y las operaciones que se
 * derivan de ella (adjunta, matriz de cofactores, número de condición).
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { reducedRowEchelon } from './gauss.js';
import { determinantByGauss } from './determinant.js';
import { assertSquareMatrix } from '../validation/matrix.js';
import { SingularMatrixError } from '../errors/singular-matrix-error.js';
import { DEFAULT_TOLERANCE } from '../utils/constants.js';

/**
 * Tamaño máximo para el que `cofactorMatrix` registra el desarrollo cofactor
 * por cofactor.
 *
 * Por qué existe: la matriz de cofactores emite un paso por posición, o sea
 * n², y cada paso lleva el menor como `snapshot`, de (n−1)² celdas. El total
 * crece como n²(n−1)⁴ en datos: una 6x6 da 36 pasos con menores de 25 celdas,
 * pero una 15x15 —tamaño que el selector de la calculadora permite— daría 225
 * pasos con menores de 196 celdas. Eso no es un procedimiento que alguien
 * pueda leer; es un volcado.
 *
 * Por qué 6 y no otro número: es el mismo umbral en el que `adjugate` deja de
 * pasar por los cofactores y usa det(A)·A⁻¹. Arriba de 6 las dos funciones
 * cuentan la misma historia —"acá el camino por cofactores deja de ser el
 * razonable"— en vez de dos distintas.
 *
 * El resultado numérico no cambia nunca: lo que se acota es el relato.
 */
const MAX_SIZE_FOR_COFACTOR_STEPS = 6;

/**
 * Formato de los números dentro del texto de un paso. Cuatro decimales, igual
 * que el resto del motor (gauss.js, lu.js).
 * @param {number} value
 * @returns {string}
 * @private
 */
function format(value) {
  return value.toFixed(4);
}

/**
 * Degrada a `info` los pasos `final` heredados de una función auxiliar.
 *
 * Por qué: cuando una función encadena el procedimiento de otra y después
 * agrega su propio cierre, el `final` de la auxiliar deja de ser final — la
 * inversa no es el resultado que el usuario pidió si lo que pidió es el número
 * de condición. Sin esto, el procedimiento termina con dos o tres pasos
 * marcados como conclusión y la interfaz no puede distinguir cuál lo es.
 *
 * El texto no se toca: sigue siendo cierto como observación intermedia.
 *
 * @param {Array<Object>} steps - modificado in situ
 * @returns {Array<Object>} el mismo arreglo, para poder encadenar
 * @private
 */
function demoteInheritedFinals(steps) {
  steps.forEach((step) => {
    if (step.type === 'final') step.type = 'info';
  });
  return steps;
}

/**
 * Inversa mediante Gauss-Jordan sobre la matriz aumentada [A | I]:
 * [A | I] → [I | A⁻¹].
 * @param {Matrix} matrix
 * @param {number} [tolerance=DEFAULT_TOLERANCE]
 * @returns {{ inverse: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si la matriz no es cuadrada
 * @throws {SingularMatrixError} si la matriz no tiene inversa
 * @example
 * inverse(new Matrix([[4,7],[2,6]])).inverse.toArray();
 * // [[0.6, -0.7], [-0.2, 0.4]]
 */
export function inverse(matrix, tolerance = DEFAULT_TOLERANCE) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  const identity = Matrix.identity(n);
  const augmented = new Matrix(matrix.data.map((row, i) => row.concat(identity.data[i])));

  const { result, steps, pivots } = reducedRowEchelon(augmented, tolerance);

  // Importante: solo cuentan como pivotes válidos para el rango de A los
  // que caen dentro de las primeras n columnas (el bloque original).
  // Un pivote hallado dentro del bloque identidad aumentado no aporta
  // rango a A; ignorarlo evita falsos positivos de invertibilidad.
  const pivotsInA = pivots.filter((p) => p.col < n).length;
  if (pivotsInA < n) {
    throw new SingularMatrixError(`La matriz es singular (rango ${pivotsInA} de ${n}): no tiene inversa.`, { rank: pivotsInA, size: n });
  }

  const inverseData = result.data.map((row) => row.slice(n, 2 * n));
  steps.push({ type: 'final', text: 'Se obtuvo la identidad en el bloque izquierdo: el bloque derecho es A⁻¹.' });
  return { inverse: new Matrix(inverseData), steps };
}

/**
 * Matriz de cofactores: C[i][j] = (-1)^(i+j) · det(menor_ij).
 *
 * Caso base 1x1: el menor de una matriz de 1x1 es la matriz vacía, cuyo
 * determinante vale 1 por convención, así que el único cofactor es
 * (+1)·1 = 1 y la matriz de cofactores de [[a]] es [[1]], cualquiera sea a.
 * Con eso la fórmula adj(A)/det(A) devuelve [[1/a]], que es la inversa
 * correcta. Se resuelve acá y no en Matrix.minor porque una Matrix de 0x0
 * no es un objeto válido del motor y no tiene sentido construirla.
 *
 * `steps` trae un paso `compute` por posición, con el menor como `snapshot`,
 * **hasta 6x6**. Arriba de ese tamaño el detalle se omite y queda un `info`
 * que lo explica: ver `MAX_SIZE_FOR_COFACTOR_STEPS`. El resultado numérico es
 * el mismo en los dos casos.
 *
 * @param {Matrix} matrix
 * @returns {{ matrix: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si no es cuadrada
 * @example
 * cofactorMatrix(new Matrix([[1,2],[3,4]])).matrix.toArray(); // [[4,-3],[-2,1]]
 * @example
 * cofactorMatrix(new Matrix([[7]])).matrix.toArray(); // [[1]]
 */
export function cofactorMatrix(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  const n = matrix.rows;
  if (n === 1) {
    return {
      matrix: new Matrix([[1]]),
      steps: [{
        type: 'final',
        text: 'El menor de una matriz de 1x1 es la matriz vacía, cuyo determinante vale 1 por convención: C = [[1]], cualquiera sea el elemento.',
      }],
    };
  }

  const detailed = n <= MAX_SIZE_FOR_COFACTOR_STEPS;
  const steps = [{
    type: 'info',
    text: detailed
      ? `Cada cofactor es Cᵢⱼ = (−1)^(i+j) · det(Mᵢⱼ), con Mᵢⱼ el menor que queda al eliminar la fila i y la columna j. Se calculan ${n * n}.`
      : `Cada cofactor es Cᵢⱼ = (−1)^(i+j) · det(Mᵢⱼ). Para una matriz de ${n}x${n} son ${n * n} cofactores con menores de ${n - 1}x${n - 1}: el desarrollo se omite por tamaño y se muestra solo el resultado.`,
    snapshot: matrix.toArray(),
  }];

  const data = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      const sub = matrix.minor(i, j);
      const detMinor = sub.rows === 1 ? sub.data[0][0] : determinantByGauss(sub).value;
      data[i][j] = sign * detMinor;
      if (detailed) {
        steps.push({
          type: 'compute',
          text: `C${i + 1}${j + 1} = (${sign > 0 ? '+' : '−'}1) · det(M${i + 1}${j + 1}) = `
            + `(${sign > 0 ? '+' : '−'}1) · ${format(detMinor)} = ${format(data[i][j])}`,
          snapshot: sub.toArray(),
        });
      }
    }
  }

  const result = new Matrix(data);
  steps.push({
    type: 'final',
    text: 'Matriz de cofactores completa.',
    snapshot: result.toArray(),
  });
  return { matrix: result, steps };
}

/**
 * Adjunta: adj(A) = transpuesta de la matriz de cofactores.
 * Para n > 6 se calcula de forma eficiente como adj(A) = det(A)·A⁻¹, en
 * vez de recalcular n² menores por cofactores (mismo resultado, mucho
 * más rápido para matrices grandes).
 *
 * `steps` son los del camino que efectivamente se ejecutó —los cofactores, o
 * la inversión— más un paso `final` propio con la transposición o con la
 * identidad det(A)·A⁻¹ según corresponda. Heredar y nada más dejaría un
 * procedimiento que termina en la matriz de cofactores o en la inversa, sin
 * decir nunca cómo se llega a la adjunta (ADR-007 §4, enmienda del 18/09).
 *
 * @param {Matrix} matrix
 * @returns {{ matrix: Matrix, steps: Array<Object> }}
 * @throws {DimensionError} si no es cuadrada
 * @throws {SingularMatrixError} si es singular y n > 6 (no se puede usar det(A)·A⁻¹)
 * @example
 * adjugate(new Matrix([[1,2],[3,4]])).matrix.toArray(); // [[4,-2],[-3,1]]
 * @example
 * adjugate(new Matrix([[7]])).matrix.toArray(); // [[1]] — adj(A)/det(A) da [[1/7]]
 */
export function adjugate(matrix) {
  assertSquareMatrix(matrix, 'matrix');
  if (matrix.rows <= 6) {
    const { matrix: cofactors, steps } = cofactorMatrix(matrix);
    demoteInheritedFinals(steps);
    const result = cofactors.transpose();
    steps.push({
      type: 'final',
      text: 'adj(A) = Cᵀ: se transpone la matriz de cofactores.',
      snapshot: result.toArray(),
    });
    return { matrix: result, steps };
  }
  const det = determinantByGauss(matrix).value;
  const { inverse: inv, steps } = inverse(matrix);
  demoteInheritedFinals(steps);
  const result = inv.scalarMultiply(det);
  steps.push({
    type: 'final',
    text: `adj(A) = det(A) · A⁻¹ = ${format(det)} · A⁻¹. Para n > 6 se usa esta identidad en vez de calcular ${matrix.rows * matrix.rows} menores.`,
    snapshot: result.toArray(),
  });
  return { matrix: result, steps };
}

/**
 * Número de condición aproximado: κ(A) = ‖A‖_F · ‖A⁻¹‖_F. Valores altos
 * indican que el sistema Ax=b es numéricamente sensible a pequeños
 * errores en A o b.
 *
 * `steps` abre con un `info` que anuncia la inversión, encadena el
 * procedimiento de `inverse` y cierra con las dos normas y el producto.
 *
 * Los pasos heredados solos no alcanzaban: describían la inversión y
 * terminaban en "el bloque derecho es A⁻¹", sin mencionar nunca las normas ni
 * de dónde salía el número devuelto. Pasaban la prueba de contrato —pasos,
 * tipos válidos, textos no vacíos— y aun así dejaban al usuario sin la
 * explicación que había pedido. Es la regla que la enmienda del 18/09 a
 * ADR-007 §4 dejó escrita: heredar no alcanza si el procedimiento resultante
 * no explica la operación que se pidió.
 *
 * @param {Matrix} matrix
 * @returns {{ value: number, normA: number, normInverse: number, steps: Array<Object> }}
 * @throws {SingularMatrixError} si la matriz es singular (condición infinita)
 * @example
 * conditionNumber(Matrix.identity(3)).value; // 3 (‖I‖_F · ‖I‖_F = √3·√3)
 * @example
 * conditionNumber(new Matrix([[4,7],[2,6]])).steps.at(-1).text;
 * // 'κ(A) = ‖A‖_F · ‖A⁻¹‖_F = 10.2470 · 1.0247 = 10.5000'
 */
export function conditionNumber(matrix) {
  const { inverse: inv, steps } = inverse(matrix);
  demoteInheritedFinals(steps);
  const normA = matrix.frobeniusNorm();
  const normInverse = inv.frobeniusNorm();
  const value = normA * normInverse;

  steps.unshift({
    type: 'info',
    text: 'κ(A) = ‖A‖_F · ‖A⁻¹‖_F, así que primero hay que invertir A. Los pasos que siguen son esa inversión.',
    snapshot: matrix.toArray(),
  });
  steps.push(
    {
      type: 'compute',
      text: `‖A‖_F = √(Σ aᵢⱼ²) = ${format(normA)}`,
      snapshot: matrix.toArray(),
    },
    {
      type: 'compute',
      text: `‖A⁻¹‖_F = √(Σ bᵢⱼ²) = ${format(normInverse)}`,
      snapshot: inv.toArray(),
    },
    {
      type: 'final',
      text: `κ(A) = ‖A‖_F · ‖A⁻¹‖_F = ${format(normA)} · ${format(normInverse)} = ${format(value)}`,
    },
  );
  return { value, normA, normInverse, steps };
}
