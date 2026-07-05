/**
 * determinant.js
 * ---------------------------------------------------------------------------
 * Cálculo del determinante mediante Eliminación de Gauss (método principal,
 * eficiente para matrices grandes: O(n^3)) y, como apoyo teórico, expansión
 * por cofactores (Laplace) para matrices pequeñas donde se quiera mostrar
 * la definición clásica paso a paso.
 * ---------------------------------------------------------------------------
 */

const DeterminantLib = (() => {
  const { Matrix, MatrixError } = window.MatrixLib;
  const { rowEchelon } = window.GaussLib;

  /**
   * Determinante mediante triangulación de Gauss:
   * det(A) = (-1)^(cant. de intercambios) * producto de los pivotes.
   */
  function determinantGauss(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("El determinante solo está definido para matrices cuadradas.");
    const n = matrix.rows;
    if (n === 1) {
      return { value: matrix.data[0][0], steps: [{ type: "info", text: "Matriz 1x1: el determinante es el único elemento." }] };
    }

    const { result, steps, swapCount, pivots } = rowEchelon(matrix);

    if (pivots.length < n) {
      steps.push({
        type: "info",
        text: "Se obtuvo al menos una columna sin pivote (fila de ceros). Por lo tanto det(A) = 0.",
      });
      return { value: 0, steps, swapCount, upper: result };
    }

    let product = 1;
    const diagValues = [];
    for (let i = 0; i < n; i++) {
      product *= result.data[i][i];
      diagValues.push(Matrix.fmt(result.data[i][i]));
    }
    const sign = swapCount % 2 === 0 ? 1 : -1;
    const value = Matrix.fmt(sign * product, 6);

    steps.push({
      type: "final",
      text: `Matriz triangular superior obtenida. det(A) = ${sign === -1 ? "(-1) · " : ""}(${diagValues.join(" · ")}) = ${value}` +
        (swapCount > 0 ? `  [se realizaron ${swapCount} intercambio(s) de fila, cada uno cambia el signo]` : ""),
    });

    return { value, steps, swapCount, upper: result };
  }

  /** Menor complementario: elimina la fila i y columna j (0-indexado) */
  function minor(matrix, i, j) {
    const data = [];
    for (let r = 0; r < matrix.rows; r++) {
      if (r === i) continue;
      const row = [];
      for (let c = 0; c < matrix.cols; c++) {
        if (c === j) continue;
        row.push(matrix.data[r][c]);
      }
      data.push(row);
    }
    return Matrix.fromArray(data);
  }

  /**
   * Expansión por cofactores (recursiva). Solo recomendada para fines
   * didácticos con matrices pequeñas (n <= 6), ya que su complejidad es O(n!).
   */
  function cofactorExpansion(matrix, depth = 0) {
    const n = matrix.rows;
    if (n === 1) return matrix.data[0][0];
    if (n === 2) return matrix.data[0][0] * matrix.data[1][1] - matrix.data[0][1] * matrix.data[1][0];

    let det = 0;
    for (let j = 0; j < n; j++) {
      const cofactorSign = j % 2 === 0 ? 1 : -1;
      const sub = minor(matrix, 0, j);
      det += cofactorSign * matrix.data[0][j] * cofactorExpansion(sub, depth + 1);
    }
    return det;
  }

  function determinantCofactor(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("El determinante solo está definido para matrices cuadradas.");
    if (matrix.rows > 7) {
      throw new MatrixError(
        "La expansión por cofactores solo está disponible como recurso teórico para matrices de hasta 7x7 (su costo computacional crece como n!). Para matrices más grandes usá el método de Gauss."
      );
    }
    return Matrix.fmt(cofactorExpansion(matrix), 6);
  }

  return { determinantGauss, determinantCofactor, minor };
})();

window.DeterminantLib = DeterminantLib;
