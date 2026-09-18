/**
 * algebra/qr.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: factorización QR mediante el proceso de
 * Gram-Schmidt clásico aplicado a las columnas de A (A = Q·R, con Q de
 * columnas ortonormales y R triangular superior).
 *
 * Nota de diseño: las operaciones vectoriales que necesita este archivo
 * (producto interno, norma) son triviales (un par de líneas) y se
 * mantienen privadas acá en vez de importarse de physics/vectors.js.
 * physics/vectors.js es un módulo de nivel superior pensado para vectores
 * físicos (fuerzas, velocidades) de las futuras calculadoras de física y
 * aeronáutica; no tendría sentido que algebra/ (una capa más baja)
 * dependiera de physics/ (una capa más alta) solo para reutilizar un
 * `sqrt(suma de cuadrados)`. Autovectores (eigen.js) reutiliza qr.js, no
 * estas funciones privadas.
 * ---------------------------------------------------------------------------
 */

import { Matrix } from './matrix.js';
import { assertMatrixLike } from '../validation/matrix.js';

/** @private */
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** @private */
function norm(a) {
  return Math.sqrt(dot(a, a));
}

/** @private */
function getColumn(matrix, j) {
  const col = [];
  for (let i = 0; i < matrix.rows; i++) col.push(matrix.data[i][j]);
  return col;
}

/**
 * Factorización QR mediante Gram-Schmidt clásico.
 *
 * `steps` viene vacío: el desarrollo columna por columna del proceso de
 * Gram-Schmidt es el Paso 2c-2 (ADR-007 §4). La clave existe desde ya para
 * que la interfaz pueda escribirse contra el contrato definitivo.
 *
 * @param {Matrix} matrix - m×n con columnas linealmente independientes
 * @returns {{ Q: Matrix, R: Matrix, steps: Array<Object> }}
 * @throws {MathError} si matrix no es matrix-like (vía assertMatrixLike)
 * @example
 * const { Q, R } = qrDecomposition(new Matrix([[1,1],[0,1],[1,0]]));
 */
export function qrDecomposition(matrix) {
  assertMatrixLike(matrix, 'matrix');
  const n = matrix.rows,
    m = matrix.cols;
  const columns = [];
  for (let j = 0; j < m; j++) columns.push(getColumn(matrix, j));

  const orthoCols = [];
  for (let k = 0; k < columns.length; k++) {
    let v = columns[k].slice();
    for (let i = 0; i < orthoCols.length; i++) {
      const proj = dot(columns[k], orthoCols[i]);
      v = v.map((val, idx) => val - proj * orthoCols[i][idx]);
    }
    const nv = norm(v);
    orthoCols.push(nv < 1e-12 ? v : v.map((val) => val / nv));
  }

  const Q = Matrix.zeros(n, m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) Q.data[i][j] = orthoCols[j][i];

  const R = Matrix.zeros(m, m);
  for (let i = 0; i < m; i++) for (let j = i; j < m; j++) R.data[i][j] = dot(orthoCols[i], columns[j]);

  return { Q, R, steps: [] };
}
