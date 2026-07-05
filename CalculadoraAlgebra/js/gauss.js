/**
 * gauss.js
 * ---------------------------------------------------------------------------
 * Implementa la Eliminación de Gauss y Gauss-Jordan de forma genérica,
 * registrando cada paso (pivoteo, intercambio de filas, escalados,
 * combinaciones lineales) para que la interfaz pueda reconstruir el
 * procedimiento completo, tal como lo mostraría un profesor en el pizarrón.
 *
 * Estas rutinas son la base de: determinante, rango, sistemas lineales,
 * inversa (Gauss-Jordan) y forma escalonada.
 * ---------------------------------------------------------------------------
 */

const GaussLib = (() => {
  const { Matrix } = window.MatrixLib;
  const EPS = 1e-10;

  /**
   * Lleva una matriz (o matriz aumentada) a forma escalonada por filas
   * usando pivoteo parcial (mayor elemento en valor absoluto) para
   * estabilidad numérica.
   *
   * @param {Matrix} matrix
   * @returns {{result:Matrix, steps:Array, swapCount:number, pivots:number[]}}
   */
  function rowEchelon(matrix) {
    const m = matrix.clone();
    const steps = [];
    let swapCount = 0;
    const pivots = [];
    let pivotRow = 0;

    for (let col = 0; col < m.cols && pivotRow < m.rows; col++) {
      // Búsqueda de pivote (mayor valor absoluto en la columna, desde pivotRow)
      let maxRow = pivotRow;
      for (let r = pivotRow + 1; r < m.rows; r++) {
        if (Math.abs(m.data[r][col]) > Math.abs(m.data[maxRow][col])) maxRow = r;
      }
      if (Math.abs(m.data[maxRow][col]) < EPS) {
        steps.push({
          type: "info",
          text: `Columna ${col + 1}: todos los elementos son ~0 desde la fila ${pivotRow + 1}. No hay pivote en esta columna; se continúa con la siguiente.`,
        });
        continue;
      }
      if (maxRow !== pivotRow) {
        [m.data[pivotRow], m.data[maxRow]] = [m.data[maxRow], m.data[pivotRow]];
        swapCount++;
        steps.push({
          type: "swap",
          text: `Intercambio F${pivotRow + 1} ↔ F${maxRow + 1} (pivoteo parcial para mayor estabilidad numérica).`,
          snapshot: m.toArray(),
        });
      }

      const pivotVal = m.data[pivotRow][col];
      pivots.push({ row: pivotRow, col, value: pivotVal });

      for (let r = pivotRow + 1; r < m.rows; r++) {
        const factor = m.data[r][col] / pivotVal;
        if (Math.abs(factor) < EPS) continue;
        for (let c = 0; c < m.cols; c++) {
          m.data[r][c] = Matrix.fmt(m.data[r][c] - factor * m.data[pivotRow][c], 10);
        }
        steps.push({
          type: "elim",
          text: `F${r + 1} → F${r + 1} − (${Matrix.fmt(factor)}) · F${pivotRow + 1}   [elimina el elemento de la columna ${col + 1}]`,
          snapshot: m.toArray(),
        });
      }
      pivotRow++;
    }

    return { result: m, steps, swapCount, pivots };
  }

  /**
   * Forma escalonada reducida (Gauss-Jordan): además de triangular, normaliza
   * cada pivote a 1 y elimina los elementos por encima de cada pivote.
   */
  function reducedRowEchelon(matrix) {
    const first = rowEchelon(matrix);
    const m = first.result;
    const steps = first.steps.slice();

    for (let p = first.pivots.length - 1; p >= 0; p--) {
      const { row, col } = first.pivots[p];
      const pivotVal = m.data[row][col];
      if (Math.abs(pivotVal - 1) > EPS) {
        for (let c = 0; c < m.cols; c++) m.data[row][c] = Matrix.fmt(m.data[row][c] / pivotVal, 10);
        steps.push({
          type: "scale",
          text: `F${row + 1} → F${row + 1} / (${Matrix.fmt(pivotVal)})   [normaliza el pivote de la columna ${col + 1} a 1]`,
          snapshot: m.toArray(),
        });
      }
      for (let r = 0; r < row; r++) {
        const factor = m.data[r][col];
        if (Math.abs(factor) < EPS) continue;
        for (let c = 0; c < m.cols; c++) m.data[r][c] = Matrix.fmt(m.data[r][c] - factor * m.data[row][c], 10);
        steps.push({
          type: "elim",
          text: `F${r + 1} → F${r + 1} − (${Matrix.fmt(factor)}) · F${row + 1}   [elimina por encima del pivote de la columna ${col + 1}]`,
          snapshot: m.toArray(),
        });
      }
    }
    return { result: m, steps, pivots: first.pivots, swapCount: first.swapCount };
  }

  /** Rango = cantidad de pivotes obtenidos en la forma escalonada */
  function rank(matrix) {
    const { result, pivots, steps } = rowEchelon(matrix);
    return { rank: pivots.length, echelon: result, steps };
  }

  /**
   * Resuelve Ax = b mediante Gauss-Jordan sobre la matriz aumentada [A|b].
   * Detecta sistemas incompatibles (rango(A) < rango([A|b])) y con
   * infinitas soluciones (rango(A) < n de incógnitas).
   */
  function solveSystem(A, b) {
    if (A.rows !== b.rows) throw new Error("La cantidad de filas de A y b debe coincidir.");
    const augmentedData = A.data.map((row, i) => row.concat(b.data[i]));
    const augmented = Matrix.fromArray(augmentedData);

    const rrefResult = reducedRowEchelon(augmented);
    const rrefA = rank(A);
    const rankA = rrefA.rank;

    // rango de la matriz aumentada
    const rankAug = rrefResult.pivots.length;

    const n = A.cols;
    if (rankA < rankAug) {
      return {
        type: "incompatible",
        message: "El sistema es incompatible (no tiene solución): el rango de A es menor que el rango de la matriz ampliada [A|b].",
        steps: rrefResult.steps,
        rankA,
        rankAug,
      };
    }
    if (rankA < n) {
      return {
        type: "infinite",
        message: `El sistema es compatible indeterminado: tiene infinitas soluciones (rango = ${rankA} < ${n} incógnitas). Existen ${n - rankA} variable(s) libre(s).`,
        steps: rrefResult.steps,
        rref: rrefResult.result,
        rankA,
        rankAug,
      };
    }
    // Solución única: la última columna de la RREF es el vector solución
    const solution = rrefResult.result.data.map((row) => row[row.length - 1]);
    return {
      type: "unique",
      message: "El sistema es compatible determinado: tiene solución única.",
      solution,
      steps: rrefResult.steps,
      rref: rrefResult.result,
      rankA,
      rankAug,
    };
  }

  return { rowEchelon, reducedRowEchelon, rank, solveSystem, EPS };
})();

window.GaussLib = GaussLib;
