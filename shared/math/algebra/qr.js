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
 * `steps` emite **un paso por columna**, que es la unidad de trabajo del
 * proceso: se le resta a la columna k su proyección sobre las anteriores y se
 * normaliza lo que queda. Son `m` pasos, uno por columna, así que el
 * procedimiento crece linealmente con el ancho de la matriz y no hace falta
 * acotarlo. El `snapshot` de cada paso es la `Q` parcial: las columnas
 * ortonormalizadas hasta ese momento, que es el factor que se está
 * construyendo (ADR-007 §3.2).
 *
 * @param {Matrix} matrix - m×n con columnas linealmente independientes
 * @returns {{ Q: Matrix, R: Matrix, steps: Array<Object> }}
 * @throws {MathError} si matrix no es matrix-like (vía assertMatrixLike)
 * @example
 * const { Q, R } = qrDecomposition(new Matrix([[1,1],[0,1],[1,0]]));
 * @example
 * qrDecomposition(new Matrix([[1,1],[0,1],[1,0]])).steps.length; // 4
 */
export function qrDecomposition(matrix) {
  assertMatrixLike(matrix, 'matrix');
  const n = matrix.rows,
    m = matrix.cols;
  const columns = [];
  for (let j = 0; j < m; j++) columns.push(getColumn(matrix, j));

  const steps = [{
    type: 'info',
    text: `Gram-Schmidt: cada columna se ortogonaliza contra las anteriores y se normaliza. ${m} columna(s).`,
    snapshot: matrix.toArray(),
  }];

  const orthoCols = [];
  for (let k = 0; k < columns.length; k++) {
    let v = columns[k].slice();
    for (let i = 0; i < orthoCols.length; i++) {
      const proj = dot(columns[k], orthoCols[i]);
      v = v.map((val, idx) => val - proj * orthoCols[i][idx]);
    }
    const nv = norm(v);
    orthoCols.push(nv < 1e-12 ? v : v.map((val) => val / nv));
    steps.push({
      type: k === 0 ? 'normalize' : 'compute',
      text: k === 0
        ? `q1 = a1 / ‖a1‖, con ‖a1‖ = ${format(nv)}`
        : `q${k + 1} = (a${k + 1} − ${k} proyección(es) sobre q1..q${k}) / ‖·‖, con ‖·‖ = ${format(nv)}`,
      snapshot: partialQ(orthoCols, n),
    });
  }

  const Q = Matrix.zeros(n, m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) Q.data[i][j] = orthoCols[j][i];

  const R = Matrix.zeros(m, m);
  for (let i = 0; i < m; i++) for (let j = i; j < m; j++) R.data[i][j] = dot(orthoCols[i], columns[j]);

  steps.push({
    type: 'final',
    text: 'A = Q·R: Q tiene las columnas ortonormales y R = Qᵀ·A es triangular superior.',
    snapshot: R.toArray(),
  });
  return { Q, R, steps };
}

/**
 * Las columnas ya ortonormalizadas, como arreglo 2D de `filas × columnas`.
 * Es la `Q` parcial que se está construyendo, para el `snapshot` del paso.
 *
 * @param {number[][]} orthoCols - columnas ortonormales, cada una un arreglo
 * @param {number} rows
 * @returns {number[][]}
 * @private
 */
function partialQ(orthoCols, rows) {
  return Array.from({ length: rows }, (_, i) => orthoCols.map((col) => col[i]));
}
