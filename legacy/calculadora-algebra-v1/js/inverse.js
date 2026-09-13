/**
 * inverse.js
 * ---------------------------------------------------------------------------
 * Cálculo de la matriz inversa mediante Gauss-Jordan sobre la matriz
 * aumentada [A | I], junto con la matriz adjunta, la matriz de cofactores
 * y el número de condición (basado en la norma de Frobenius).
 * ---------------------------------------------------------------------------
 */

const InverseLib = (() => {
  const { Matrix, MatrixError } = window.MatrixLib;
  const { reducedRowEchelon, EPS } = window.GaussLib;
  const { determinantGauss, minor } = window.DeterminantLib;

  /**
   * Inversa mediante Gauss-Jordan: [A | I] -> [I | A^-1].
   * Si durante la eliminación no se puede obtener un pivote no nulo en
   * alguna columna de A, la matriz es singular y no tiene inversa.
   */
  function inverseGaussJordan(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("Solo las matrices cuadradas pueden tener inversa.");
    const n = matrix.rows;
    const identity = Matrix.identity(n);
    const augmentedData = matrix.data.map((row, i) => row.concat(identity.data[i]));
    const augmented = Matrix.fromArray(augmentedData);

    const { result, steps, pivots } = reducedRowEchelon(augmented);

    // Solo cuentan como pivotes válidos para la inversión los que caen dentro
    // del bloque original de A (columnas 0..n-1). Un pivote hallado dentro
    // del bloque identidad aumentado no aporta rango a A y debe ignorarse,
    // o de lo contrario una matriz singular podría parecer invertible.
    const pivotsInA = pivots.filter((p) => p.col < n).length;

    if (pivotsInA < n) {
      return {
        invertible: false,
        message: `La matriz NO tiene inversa: es singular (det(A) = 0). Solo se encontraron ${pivotsInA} pivote(s) de ${n} necesarios, es decir, su rango es menor que su dimensión.`,
        steps,
      };
    }

    const inverseData = result.data.map((row) => row.slice(n, 2 * n));
    const inverse = Matrix.fromArray(inverseData);
    steps.push({
      type: "final",
      text: "Se obtuvo la identidad en el bloque izquierdo. El bloque derecho de la matriz aumentada es A⁻¹.",
    });

    return { invertible: true, inverse, steps };
  }

  /** Matriz de cofactores: C[i][j] = (-1)^(i+j) * det(menor_ij) */
  function cofactorMatrix(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("La matriz de cofactores solo está definida para matrices cuadradas.");
    const n = matrix.rows;
    const data = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const sign = (i + j) % 2 === 0 ? 1 : -1;
        const sub = minor(matrix, i, j);
        const { value } = determinantGauss(sub.rows === 1 ? sub : sub);
        const detMinor = sub.rows === 1 ? sub.data[0][0] : value;
        data[i][j] = Matrix.fmt(sign * detMinor, 6);
      }
    }
    return Matrix.fromArray(data);
  }

  /**
   * Adjunta: adj(A) = transpuesta de la matriz de cofactores.
   * Para matrices grandes se calcula de forma eficiente como
   * adj(A) = det(A) · A⁻¹, evitando el costo de recalcular n² menores.
   */
  function adjugate(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("La adjunta solo está definida para matrices cuadradas.");
    const n = matrix.rows;
    if (n <= 6) {
      return cofactorMatrix(matrix).transpose();
    }
    // Método eficiente para matrices grandes
    const { value: det } = determinantGauss(matrix);
    if (Math.abs(det) < EPS) {
      throw new MatrixError("La matriz es singular; su adjunta no puede obtenerse a partir de A⁻¹ (det = 0). Usá la definición por cofactores para matrices pequeñas.");
    }
    const invResult = inverseGaussJordan(matrix);
    if (!invResult.invertible) {
      throw new MatrixError("La matriz es singular: no se puede calcular la adjunta por este método.");
    }
    return invResult.inverse.scalarMultiply(det);
  }

  /**
   * Número de condición aproximado: κ(A) = ||A|| · ||A⁻¹|| (norma de Frobenius).
   * Cuanto mayor sea, más sensible es el sistema Ax=b a pequeños errores.
   */
  function conditionNumber(matrix) {
    const invResult = inverseGaussJordan(matrix);
    if (!invResult.invertible) {
      return { value: Infinity, message: "La matriz es singular: el número de condición es infinito." };
    }
    const normA = matrix.frobeniusNorm();
    const normInv = invResult.inverse.frobeniusNorm();
    return { value: Matrix.fmt(normA * normInv, 6), normA: Matrix.fmt(normA), normInv: Matrix.fmt(normInv) };
  }

  return { inverseGaussJordan, cofactorMatrix, adjugate, conditionNumber };
})();

window.InverseLib = InverseLib;
