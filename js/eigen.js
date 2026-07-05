/**
 * eigen.js
 * ---------------------------------------------------------------------------
 * Algoritmos numéricos avanzados:
 *   - Factorización LU (con pivoteo parcial)
 *   - Factorización QR (Gram-Schmidt)
 *   - Descomposición de Cholesky (matrices simétricas definidas positivas)
 *   - Autovalores mediante el algoritmo QR iterativo
 *   - Autovectores mediante iteración inversa / núcleo de (A - λI)
 *   - Diagonalización A = P·D·P⁻¹ cuando A es diagonalizable
 *
 * Nota pedagógica: estos métodos numéricos asumen (salvo aclaración)
 * autovalores reales. Matrices con autovalores complejos (rotaciones puras,
 * por ejemplo) no son soportadas por este algoritmo educativo.
 * ---------------------------------------------------------------------------
 */

const EigenLib = (() => {
  const { Matrix, MatrixError } = window.MatrixLib;
  const { gramSchmidt, getColumn, norm, dot } = window.VectorLib;
  const { reducedRowEchelon, EPS } = window.GaussLib;

  /* ------------------------------- LU ------------------------------- */

  /**
   * Factorización LU con pivoteo parcial: P·A = L·U
   * Devuelve L (triangular inferior con 1s en la diagonal), U (triangular
   * superior) y P (matriz de permutación), junto con los pasos realizados.
   */
  function luDecomposition(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("La descomposición LU requiere una matriz cuadrada.");
    const n = matrix.rows;
    const U = matrix.clone();
    const L = Matrix.identity(n);
    const perm = Array.from({ length: n }, (_, i) => i);
    const steps = [];

    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(U.data[r][col]) > Math.abs(U.data[maxRow][col])) maxRow = r;
      }
      if (Math.abs(U.data[maxRow][col]) < EPS) {
        throw new MatrixError("La matriz es singular (o requiere pivoteo que este método educativo no completa); LU no puede continuar en la columna " + (col + 1) + ".");
      }
      if (maxRow !== col) {
        [U.data[col], U.data[maxRow]] = [U.data[maxRow], U.data[col]];
        [perm[col], perm[maxRow]] = [perm[maxRow], perm[col]];
        for (let c = 0; c < col; c++) [L.data[col][c], L.data[maxRow][c]] = [L.data[maxRow][c], L.data[col][c]];
        steps.push({ type: "swap", text: `Intercambio de filas F${col + 1} ↔ F${maxRow + 1} (pivoteo parcial).` });
      }
      for (let r = col + 1; r < n; r++) {
        const factor = U.data[r][col] / U.data[col][col];
        L.data[r][col] = Matrix.fmt(factor, 8);
        for (let c = col; c < n; c++) U.data[r][c] = Matrix.fmt(U.data[r][c] - factor * U.data[col][c], 8);
        steps.push({ type: "elim", text: `F${r + 1} → F${r + 1} − (${Matrix.fmt(factor)})·F${col + 1}   [construye U y registra el multiplicador en L]` });
      }
    }

    const P = new Matrix(n, n);
    for (let i = 0; i < n; i++) P.data[i][perm[i]] = 1;

    return { L, U, P, steps };
  }

  /* ------------------------------- QR ------------------------------- */

  /**
   * Factorización QR mediante Gram-Schmidt clásico sobre las columnas de A.
   * A = Q·R, con Q ortogonal (columnas ortonormales) y R triangular superior.
   */
  function qrDecomposition(matrix) {
    const n = matrix.rows,
      m = matrix.cols;
    const columns = [];
    for (let j = 0; j < m; j++) columns.push(getColumn(matrix, j));
    const orthoCols = gramSchmidt(columns);

    const Q = new Matrix(n, m);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) Q.data[i][j] = Matrix.fmt(orthoCols[j][i], 8);

    const R = new Matrix(m, m);
    for (let i = 0; i < m; i++) {
      for (let j = i; j < m; j++) {
        R.data[i][j] = Matrix.fmt(dot(orthoCols[i], columns[j]), 8);
      }
    }
    return { Q, R };
  }

  /* ---------------------------- Cholesky ------------------------------ */

  /**
   * Cholesky: A = L·Lᵀ, válido solo para matrices simétricas definidas
   * positivas. Se verifica simetría y que los pivotes resulten positivos.
   */
  function choleskyDecomposition(matrix) {
    if (!matrix.isSquare()) throw new MatrixError("Cholesky requiere una matriz cuadrada.");
    if (!matrix.isSymmetric()) throw new MatrixError("Cholesky requiere una matriz simétrica (A = Aᵀ).");
    const n = matrix.rows;
    const L = new Matrix(n, n);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) sum += L.data[i][k] * L.data[j][k];
        if (i === j) {
          const val = matrix.data[i][i] - sum;
          if (val <= EPS) {
            throw new MatrixError("La matriz no es definida positiva (aparece un valor ≤ 0 bajo la raíz). Cholesky no es aplicable.");
          }
          L.data[i][j] = Matrix.fmt(Math.sqrt(val), 8);
        } else {
          L.data[i][j] = Matrix.fmt((matrix.data[i][j] - sum) / L.data[j][j], 8);
        }
      }
    }
    return { L, Lt: L.transpose() };
  }

  /* ------------------------------ Autovalores ------------------------------- */

  /**
   * Algoritmo QR iterativo (sin shifts) para aproximar autovalores reales.
   * Converge de forma confiable para matrices simétricas; para matrices
   * generales con autovalores reales distintos también suele converger.
   */
  function eigenvaluesQR(matrix, iterations = 500) {
    if (!matrix.isSquare()) throw new MatrixError("Los autovalores solo están definidos para matrices cuadradas.");
    const n = matrix.rows;
    let Ak = matrix.clone();

    for (let it = 0; it < iterations; it++) {
      const { Q, R } = qrDecomposition(Ak);
      Ak = R.multiply(Q);
    }

    // Los autovalores aproximados quedan en la diagonal de Ak (para el caso real)
    const values = [];
    for (let i = 0; i < n; i++) values.push(Matrix.fmt(Ak.data[i][i], 6));

    // Verificamos si quedaron bloques 2x2 no triangularizados (posibles pares complejos)
    let hasComplexHint = false;
    for (let i = 0; i < n - 1; i++) {
      if (Math.abs(Ak.data[i + 1][i]) > 1e-4) hasComplexHint = true;
    }

    values.sort((a, b) => b - a);
    return { values, matrixT: Ak, hasComplexHint };
  }

  /**
   * Autovector asociado a un autovalor lambda: se resuelve el sistema
   * homogéneo (A - λI)v = 0 hallando su núcleo mediante RREF.
   */
  function eigenvectorFor(matrix, lambda) {
    const n = matrix.rows;
    const shifted = matrix.subtract(Matrix.identity(n).scalarMultiply(lambda));
    const { result, pivots } = reducedRowEchelon(shifted);

    const pivotCols = new Set(pivots.map((p) => p.col));
    const freeCols = [];
    for (let c = 0; c < n; c++) if (!pivotCols.has(c)) freeCols.push(c);

    if (freeCols.length === 0) {
      return null; // no debería ocurrir si lambda es autovalor genuino
    }

    // Se construye un autovector por cada variable libre, asignándole valor 1
    const freeCol = freeCols[0];
    const vector = new Array(n).fill(0);
    vector[freeCol] = 1;
    for (const { row, col } of pivots) {
      vector[col] = -result.data[row][freeCol];
    }
    const mag = norm(vector);
    return vector.map((v) => Matrix.fmt(v / (mag || 1), 6));
  }

  function eigenvectors(matrix, eigenvalues) {
    return eigenvalues.map((lambda) => ({ lambda, vector: eigenvectorFor(matrix, lambda) }));
  }

  /**
   * Diagonalización A = P·D·P⁻¹. Construye P con los autovectores como
   * columnas y D con los autovalores en la diagonal; verifica que P sea
   * invertible (autovectores linealmente independientes).
   */
  function diagonalize(matrix) {
    const { values } = eigenvaluesQR(matrix);
    const eigPairs = eigenvectors(matrix, values);
    const n = matrix.rows;

    const P = new Matrix(n, n);
    for (let j = 0; j < n; j++) {
      const v = eigPairs[j].vector;
      if (!v) throw new MatrixError("No se pudo construir un autovector completo; la matriz podría no ser diagonalizable.");
      for (let i = 0; i < n; i++) P.data[i][j] = v[i];
    }

    const { inverseGaussJordan } = window.InverseLib;
    const invResult = inverseGaussJordan(P);
    if (!invResult.invertible) {
      throw new MatrixError("La matriz P formada por los autovectores es singular: A no es diagonalizable (autovectores linealmente dependientes).");
    }

    const D = Matrix.diagonal(values);
    return { P, D, Pinv: invResult.inverse };
  }

  return {
    luDecomposition,
    qrDecomposition,
    choleskyDecomposition,
    eigenvaluesQR,
    eigenvectorFor,
    eigenvectors,
    diagonalize,
  };
})();

window.EigenLib = EigenLib;
