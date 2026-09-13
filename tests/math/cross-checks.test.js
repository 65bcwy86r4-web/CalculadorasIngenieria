/**
 * tests/math/cross-checks.test.js
 * ---------------------------------------------------------------------------
 * VERIFICACIÓN CRUZADA entre funciones que calculan lo mismo por caminos
 * distintos (tests/README.md, categoría 5).
 *
 * Qué agrega esto a las pruebas unitarias: una prueba unitaria compara contra
 * un valor que escribió una persona, y una persona puede equivocarse al
 * escribirlo o elegir siempre matrices amables. Una verificación cruzada
 * compara al motor consigo mismo sobre entradas arbitrarias, y por eso detecta
 * errores que ningún valor de referencia elegido a mano iba a encontrar.
 *
 * Cómo leer una falla en este archivo: no dice "esta función da mal", dice
 * "estas dos funciones se contradicen". Investigar cuál de las dos está mal es
 * parte del trabajo, y para eso cada prueba deja en el mensaje los dos valores
 * en conflicto.
 *
 * Las matrices de prueba están fijas y no son aleatorias: una suite que cambia
 * de entrada en cada corrida da fallas que no se pueden reproducir, y este
 * proyecto no tiene infraestructura para guardar semillas. Se eligieron con
 * distintas características (bien condicionadas, con pivoteo necesario,
 * simétricas definidas positivas, con negativos) para cubrir los caminos.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  determinantByGauss, determinantByCofactors, inverse, adjugate, luDecomposition,
  qrDecomposition, choleskyDecomposition, eigenvaluesQR, solveSystem,
  linearInterpolate, lagrangeInterpolate, piecewiseLinear,
  convert, unitsByCategory, Matrix,
} from '../../shared/math/index.js';

import { assertTrue, assertClose, assertVectorClose, assertMatrixClose } from '../assert.js';

/** Tolerancia para lo que pasa por el algoritmo QR iterativo. */
const TOLERANCIA_ITERATIVA = 1e-6;

/** Matrices cuadradas invertibles de referencia, con características distintas. */
const INVERTIBLES = [
  { nombre: '1x1', matriz: new Matrix([[7]]) },
  { nombre: '2x2 simple', matriz: new Matrix([[1, 2], [3, 4]]) },
  { nombre: '2x2 que exige pivoteo', matriz: new Matrix([[0, 1], [1, 0]]) },
  { nombre: '3x3 con negativos', matriz: new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]]) },
  { nombre: '3x3 simétrica definida positiva', matriz: new Matrix([[4, 12, -16], [12, 37, -43], [-16, -43, 98]]) },
  { nombre: '4x4 dispersa', matriz: new Matrix([[2, 0, 1, 0], [0, 3, 0, 1], [1, 0, 4, 0], [0, 1, 0, 5]]) },
];

/** Simétricas definidas positivas, para Cholesky. */
const DEFINIDAS_POSITIVAS = [
  new Matrix([[4, 2], [2, 3]]),
  new Matrix([[4, 12, -16], [12, 37, -43], [-16, -43, 98]]),
  new Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]),
  Matrix.identity(3),
];

export const tests = [
  {
    name: 'determinante por Gauss = determinante por cofactores',
    fn: () => {
      // Dos algoritmos sin una sola línea en común: O(n³) por triangulación
      // contra O(n!) por expansión de Laplace.
      INVERTIBLES.forEach(({ nombre, matriz }) => {
        const porGauss = determinantByGauss(matriz).value;
        const porCofactores = determinantByCofactors(matriz);
        assertClose(
          porGauss,
          porCofactores,
          `${nombre}: Gauss dio ${porGauss} y cofactores ${porCofactores}.`,
          1e-8,
        );
      });
    },
  },
  {
    name: 'el determinante de una singular da cero por los dos caminos',
    fn: () => {
      const singulares = [
        new Matrix([[1, 2], [2, 4]]),
        new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]),
        Matrix.zeros(3),
      ];
      singulares.forEach((m, i) => {
        assertClose(determinantByGauss(m).value, 0, `Singular ${i} por Gauss.`, 1e-9);
        assertClose(determinantByCofactors(m), 0, `Singular ${i} por cofactores.`, 1e-9);
      });
    },
  },
  {
    name: 'A · A⁻¹ = I y A⁻¹ · A = I',
    fn: () => {
      INVERTIBLES.forEach(({ nombre, matriz }) => {
        const inversa = inverse(matriz).inverse;
        const identidad = Matrix.identity(matriz.rows).toArray();
        assertMatrixClose(matriz.multiply(inversa), identidad, `${nombre}: A · A⁻¹.`, 1e-8);
        assertMatrixClose(inversa.multiply(matriz), identidad, `${nombre}: A⁻¹ · A.`, 1e-8);
      });
    },
  },
  {
    name: 'det(A⁻¹) = 1 / det(A)',
    fn: () => {
      INVERTIBLES.forEach(({ nombre, matriz }) => {
        const det = determinantByGauss(matriz).value;
        const detInversa = determinantByGauss(inverse(matriz).inverse).value;
        assertClose(detInversa, 1 / det, `${nombre}: determinante de la inversa.`, 1e-8);
      });
    },
  },
  {
    name: 'inversa por Gauss-Jordan = adj(A) / det(A)',
    fn: () => {
      // Gauss-Jordan sobre [A | I] contra la fórmula clásica de la adjunta:
      // caminos sin nada en común hacia el mismo resultado. Se usa el
      // determinante por cofactores para que el segundo camino no comparta
      // tampoco el cálculo del determinante.
      // Se excluye el caso 1x1: adjugate() se rompe ahí (hallazgo H-05,
      // fijado en known-defects.test.js). Cuando se corrija, sacar el filtro.
      INVERTIBLES.filter(({ matriz }) => matriz.rows > 1).forEach(({ nombre, matriz }) => {
        const det = determinantByCofactors(matriz);
        const porGaussJordan = inverse(matriz).inverse;
        const porAdjunta = adjugate(matriz).scalarMultiply(1 / det);
        assertMatrixClose(
          porGaussJordan,
          porAdjunta.toArray(),
          `${nombre}: las dos inversas deberían coincidir.`,
          1e-8,
        );
      });
    },
  },
  {
    name: 'L · U = P · A en toda descomposición LU',
    fn: () => {
      INVERTIBLES.forEach(({ nombre, matriz }) => {
        const { L, U, P } = luDecomposition(matriz);
        assertMatrixClose(
          L.multiply(U),
          P.multiply(matriz).toArray(),
          `${nombre}: la reconstrucción LU no coincide con P·A.`,
          1e-8,
        );
      });
    },
  },
  {
    name: 'el determinante por LU coincide con el determinante por Gauss',
    fn: () => {
      // det(A) = det(P)⁻¹ · det(L) · det(U) = ±1 · 1 · Π uᵢᵢ
      INVERTIBLES.forEach(({ nombre, matriz }) => {
        const { U, P } = luDecomposition(matriz);
        let productoDiagonal = 1;
        for (let i = 0; i < U.rows; i += 1) productoDiagonal *= U.get(i, i);

        const signo = determinantByGauss(P).value; // ±1 para una permutación
        const porLU = productoDiagonal / signo;
        assertClose(porLU, determinantByGauss(matriz).value, `${nombre}: determinante por LU.`, 1e-7);
      });
    },
  },
  {
    name: 'Q · R = A y las columnas de Q son ortonormales',
    fn: () => {
      const casos = [
        new Matrix([[12, -51], [6, 167], [-4, 24]]),
        new Matrix([[1, 1], [0, 1], [1, 0]]),
        new Matrix([[1, 2], [3, 4]]),
        Matrix.identity(3),
      ];
      casos.forEach((a, i) => {
        const { Q, R } = qrDecomposition(a);
        assertMatrixClose(Q.multiply(R), a.toArray(), `Caso ${i}: Q·R debería reconstruir A.`, 1e-8);
        const qtq = Q.transpose().multiply(Q);
        assertMatrixClose(qtq, Matrix.identity(qtq.rows).toArray(), `Caso ${i}: QᵀQ = I.`, 1e-8);
      });
    },
  },
  {
    name: 'L · Lᵀ = A en toda descomposición de Cholesky',
    fn: () => {
      DEFINIDAS_POSITIVAS.forEach((a, i) => {
        const { L, Lt } = choleskyDecomposition(a);
        assertMatrixClose(L.multiply(Lt), a.toArray(), `Caso ${i}: L·Lᵀ debería reconstruir A.`, 1e-8);
      });
    },
  },
  {
    name: 'det(A) por Cholesky = (Π lᵢᵢ)² y coincide con Gauss',
    fn: () => {
      DEFINIDAS_POSITIVAS.forEach((a, i) => {
        const { L } = choleskyDecomposition(a);
        let producto = 1;
        for (let k = 0; k < L.rows; k += 1) producto *= L.get(k, k);
        assertClose(
          producto * producto,
          determinantByGauss(a).value,
          `Caso ${i}: determinante por Cholesky.`,
          1e-6,
        );
      });
    },
  },
  {
    name: 'suma de autovalores = traza',
    fn: () => {
      // Se usan solo matrices con autovalores reales y de módulos distintos:
      // el caso de módulos iguales está roto (hallazgo H-03) y tiene su propia
      // prueba en known-defects.test.js.
      const casos = [
        new Matrix([[2, 1], [1, 2]]),
        new Matrix([[5, 2], [2, 5]]),
        new Matrix([[4, 12, -16], [12, 37, -43], [-16, -43, 98]]),
        new Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]),
        Matrix.diagonal([3, -7, 11]),
      ];
      casos.forEach((a, i) => {
        const { values } = eigenvaluesQR(a);
        const suma = values.reduce((acc, v) => acc + v, 0);
        assertClose(suma, a.trace(), `Caso ${i}: Σλ debería ser la traza.`, TOLERANCIA_ITERATIVA);
      });
    },
  },
  {
    name: 'producto de autovalores = determinante',
    fn: () => {
      const casos = [
        new Matrix([[2, 1], [1, 2]]),
        new Matrix([[5, 2], [2, 5]]),
        new Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]),
        Matrix.diagonal([3, -7, 11]),
      ];
      casos.forEach((a, i) => {
        const { values } = eigenvaluesQR(a);
        const producto = values.reduce((acc, v) => acc * v, 1);
        assertClose(
          producto,
          determinantByGauss(a).value,
          `Caso ${i}: Πλ debería ser el determinante.`,
          1e-5,
        );
      });
    },
  },
  {
    name: 'la solución de solveSystem coincide con A⁻¹ · b',
    fn: () => {
      // Gauss-Jordan sobre la matriz ampliada contra invertir y multiplicar:
      // dos caminos que la bibliografía trata como equivalentes y que el
      // motor implementa por separado.
      const casos = [
        { A: new Matrix([[2, 1], [1, 3]]), b: [8, 13] },
        { A: new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]]), b: [1, 2, 3] },
        { A: new Matrix([[4]]), b: [12] },
      ];
      casos.forEach(({ A, b }, i) => {
        const { type, solution } = solveSystem(A, b);
        assertTrue(type === 'unique', `Caso ${i}: debería tener solución única.`);

        const porInversa = inverse(A).inverse.multiply(new Matrix(b.map((v) => [v])));
        assertVectorClose(
          solution,
          porInversa.toArray().map((fila) => fila[0]),
          `Caso ${i}: solveSystem contra A⁻¹·b.`,
          1e-8,
        );
      });
    },
  },
  {
    name: 'interpolación lineal = Lagrange con exactamente dos puntos',
    fn: () => {
      // El polinomio de Lagrange de grado 1 ES la recta que une los dos
      // puntos: si difieren, uno de los dos está mal.
      const casos = [
        { x0: 0, y0: 0, x1: 10, y1: 100 },
        { x0: -5, y0: 3, x1: 5, y1: -7 },
        { x0: 0, y0: 15, x1: 1000, y1: 8.5 },
      ];
      casos.forEach(({ x0, y0, x1, y1 }, i) => {
        [x0, x1, (x0 + x1) / 2, x0 + (x1 - x0) * 0.23].forEach((x) => {
          assertClose(
            lagrangeInterpolate([x0, x1], [y0, y1], x).value,
            linearInterpolate(x0, y0, x1, y1, x),
            `Caso ${i}, x = ${x}: Lagrange contra interpolación lineal.`,
          );
        });
      });
    },
  },
  {
    name: 'piecewiseLinear = linearInterpolate dentro de cada tramo',
    fn: () => {
      const xs = [0, 1000, 2000, 3000];
      const ys = [15, 8.5, 2, -4.5];
      for (let i = 0; i < xs.length - 1; i += 1) {
        const x = (xs[i] + xs[i + 1]) / 2;
        assertClose(
          piecewiseLinear(xs, ys, x),
          linearInterpolate(xs[i], ys[i], xs[i + 1], ys[i + 1], x),
          `Tramo ${i}: la tabla debería coincidir con la recta de ese tramo.`,
        );
      }
    },
  },
  {
    name: 'toda conversión de unidades es reversible',
    fn: () => {
      // Barrido completo del catálogo: convertir de A a B y de vuelta a A
      // tiene que devolver el valor original. Detecta un par de factores
      // asimétricos (toBase y fromBase que no son inversos entre sí), que es
      // un error fácil de cometer y difícil de ver leyendo el código.
      const valores = [1, 0, -20, 123.456, 1e-3];
      Object.entries(unitsByCategory).forEach(([categoria, unidades]) => {
        unidades.forEach((origen) => {
          unidades.forEach((destino) => {
            valores.forEach((valor) => {
              const ida = convert(valor, origen, destino);
              const vuelta = convert(ida, destino, origen);
              const escala = Math.max(1, Math.abs(valor));
              assertClose(
                vuelta / escala,
                valor / escala,
                `${categoria}: ${valor} ${origen} → ${destino} → ${origen} dio ${vuelta}.`,
                1e-9,
              );
            });
          });
        });
      });
    },
  },
  {
    name: 'la conversión de unidades es transitiva',
    fn: () => {
      // A → C directo debería dar lo mismo que A → B → C. Si no, hay una
      // unidad cuyo factor no es consistente con la unidad base de su
      // categoría.
      Object.entries(unitsByCategory).forEach(([categoria, unidades]) => {
        if (unidades.length < 3) return;
        const [a, b, c] = unidades;
        const directo = convert(100, a, c);
        const porEscala = convert(convert(100, a, b), b, c);
        const escala = Math.max(1, Math.abs(directo));
        assertClose(
          porEscala / escala,
          directo / escala,
          `${categoria}: ${a}→${c} directo dio ${directo}, vía ${b} dio ${porEscala}.`,
          1e-9,
        );
      });
    },
  },
];
