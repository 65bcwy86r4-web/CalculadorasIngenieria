/**
 * vectors.js
 * ---------------------------------------------------------------------------
 * Operaciones vectoriales auxiliares utilizadas por eigen.js (Gram-Schmidt
 * para QR, normalización de autovectores) y por otros módulos que necesitan
 * trabajar columna a columna.
 * ---------------------------------------------------------------------------
 */

const VectorLib = (() => {
  function dot(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  function norm(a) {
    return Math.sqrt(dot(a, a));
  }

  function scale(a, k) {
    return a.map((v) => v * k);
  }

  function subtract(a, b) {
    return a.map((v, i) => v - b[i]);
  }

  function add(a, b) {
    return a.map((v, i) => v + b[i]);
  }

  function normalize(a) {
    const n = norm(a);
    if (n < 1e-12) return a.slice();
    return scale(a, 1 / n);
  }

  /** Extrae la columna j de una matriz como array */
  function getColumn(matrix, j) {
    const col = [];
    for (let i = 0; i < matrix.rows; i++) col.push(matrix.data[i][j]);
    return col;
  }

  /**
   * Proceso de Gram-Schmidt clásico sobre las columnas de una matriz.
   * Devuelve la lista de vectores ortonormales resultantes.
   */
  function gramSchmidt(columns) {
    const ortho = [];
    for (let k = 0; k < columns.length; k++) {
      let v = columns[k].slice();
      for (let i = 0; i < ortho.length; i++) {
        const proj = dot(columns[k], ortho[i]);
        v = subtract(v, scale(ortho[i], proj));
      }
      ortho.push(normalize(v));
    }
    return ortho;
  }

  return { dot, norm, scale, subtract, add, normalize, getColumn, gramSchmidt };
})();

window.VectorLib = VectorLib;
