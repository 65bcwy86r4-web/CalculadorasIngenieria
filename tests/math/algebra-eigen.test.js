/**
 * tests/math/algebra-eigen.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de autovalores y autovectores: eigenvaluesQR, eigenvectorFor,
 * eigenvectors y diagonalize.
 *
 * Es el módulo con más margen de error del motor: eigenvaluesQR es iterativo y
 * aproximado, así que las tolerancias acá son necesariamente más flojas que en
 * el resto de la suite. Están fijadas en TOLERANCIA_ITERATIVA, en un solo
 * lugar y explicadas, para que quede claro que es una característica del
 * algoritmo y no una tolerancia que se fue subiendo hasta que la prueba pasó.
 *
 * Las matrices de prueba se eligieron con autovalores enteros conocidos, que
 * se pueden verificar a mano resolviendo det(A − λI) = 0.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Modificado: 2026-09-13 — Chat 2. Al cerrarse H-03 se mudó acá la
 *   verificación correcta que estaba fijada en known-defects.test.js, y se
 *   agregó la cobertura de las dos funciones portadas desde legacy/motor-v1/
 *   por ADR-004: jacobiEigenDecomposition y eigenvalues2x2.
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  eigenvaluesQR, jacobiEigenDecomposition, eigenvalues2x2,
  eigenvectorFor, eigenvectors, diagonalize,
  Matrix, MathError, DimensionError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertFalse, assertEqual, assertClose, assertMatrixClose, assertThrows,
} from '../assert.js';

/**
 * Tolerancia para resultados del algoritmo QR iterativo. Es 1e-6 y no 1e-9
 * porque el método converge linealmente: con 500 iteraciones sobre matrices
 * bien condicionadas alcanza sobradamente esta precisión, pero exigir 1e-9
 * mediría la cantidad de iteraciones, no la corrección del algoritmo.
 */
const TOLERANCIA_ITERATIVA = 1e-6;

/**
 * Compara dos conjuntos de autovalores sin depender del orden en que los
 * devuelva el algoritmo (que no está especificado en docs/API.md).
 *
 * @param {number[]} obtenidos
 * @param {number[]} esperados
 * @param {string} mensaje
 * @returns {void}
 */
function assertEigenvalues(obtenidos, esperados, mensaje) {
  assertEqual(obtenidos.length, esperados.length, `${mensaje} Cantidad de autovalores.`);
  const ordenados = [...obtenidos].sort((a, b) => a - b);
  const referencia = [...esperados].sort((a, b) => a - b);
  ordenados.forEach((valor, i) => {
    assertClose(valor, referencia[i], `${mensaje} Autovalor ${i}.`, TOLERANCIA_ITERATIVA);
  });
}

export const tests = [
  /* ---------------------------- eigenvaluesQR ---------------------------- */
  {
    name: 'eigenvaluesQR resuelve una simétrica 2x2 de autovalores conocidos',
    fn: () => {
      // det([[2-λ,1],[1,2-λ]]) = (2-λ)² - 1 = 0  ->  λ = 3, 1
      const { values } = eigenvaluesQR(new Matrix([[2, 1], [1, 2]]));
      assertEigenvalues(values, [3, 1], 'Autovalores de [[2,1],[1,2]].');
    },
  },
  {
    name: 'los autovalores de una triangular son su diagonal',
    fn: () => {
      const { values } = eigenvaluesQR(new Matrix([[3, 7, 2], [0, 5, 9], [0, 0, -1]]));
      assertEigenvalues(values, [3, 5, -1], 'Diagonal de una triangular superior.');
    },
  },
  {
    name: 'los autovalores de una diagonal son sus elementos',
    fn: () => {
      const { values } = eigenvaluesQR(Matrix.diagonal([4, -2, 7]));
      assertEigenvalues(values, [4, -2, 7], 'Diagonal explícita.');
    },
  },
  {
    name: 'los autovalores de la identidad son todos 1',
    fn: () => {
      const { values } = eigenvaluesQR(Matrix.identity(3));
      assertEigenvalues(values, [1, 1, 1], 'Identidad 3x3.');
    },
  },
  {
    name: 'eigenvaluesQR resuelve la tridiagonal 3x3 de autovalores irracionales',
    fn: () => {
      // Autovalores exactos 2, 2±√2 (raíces de det(A − λI) = 0). Sirven para
      // verificar que el método iterativo converge a valores que no son
      // enteros redondos, donde un error de truncamiento se vería enseguida.
      const a = new Matrix([[2, -1, 0], [-1, 2, -1], [0, -1, 2]]);
      const { values } = eigenvaluesQR(a);
      assertEigenvalues(values, [2 - Math.SQRT2, 2, 2 + Math.SQRT2], 'Matriz tridiagonal clásica.');
    },
  },
  {
    name: 'eigenvaluesQR de una 1x1 devuelve su único elemento',
    fn: () => {
      const { values } = eigenvaluesQR(new Matrix([[6]]));
      assertEigenvalues(values, [6], 'Autovalor de una 1x1.');
    },
  },
  {
    name: 'eigenvaluesQR avisa cuando los autovalores podrían ser complejos',
    fn: () => {
      // Rotación de 90°: autovalores ±i, sin parte real. El motor no maneja
      // aritmética compleja (deuda D5 del HANDOFF), así que lo mínimo exigible
      // es que lo señale en vez de devolver números reales inventados.
      const rotacion = new Matrix([[0, -1], [1, 0]]);
      const salida = eigenvaluesQR(rotacion);
      assertTrue(
        salida.hasComplexHint === true,
        'Debería marcar hasComplexHint en una matriz de autovalores complejos.',
      );
    },
  },
  {
    name: 'eigenvaluesQR devuelve la matriz T de la iteración y no lanza en el caso complejo',
    fn: () => {
      const salida = eigenvaluesQR(new Matrix([[0, -1], [1, 0]]));
      assertTrue(salida.matrixT instanceof Matrix, 'matrixT debería ser una Matrix.');
      assertTrue(Array.isArray(salida.values), 'values debería ser un arreglo aun con hint de complejos.');
    },
  },
  {
    name: 'eigenvaluesQR exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => eigenvaluesQR(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Autovalores de una 2x3.',
      );
    },
  },

  /* ------------------- autovalores de igual módulo (ex H-03) ------------------- */
  {
    name: 'eigenvaluesQR resuelve una simétrica con autovalores ±λ',
    fn: () => {
      // Era el hallazgo H-03: la iteración QR sin desplazamiento no converge
      // cuando dos autovalores tienen el mismo módulo, y devolvía [0, 0]. Con
      // el despacho por tipo de matriz de ADR-004 el caso simétrico va por
      // Jacobi, que no tiene esa limitación y además da el valor exacto.
      const { values } = eigenvaluesQR(new Matrix([[0, 50], [50, 0]]));
      assertEigenvalues(values, [50, -50], 'Simétrica de autovalores opuestos.');
    },
  },
  {
    name: 'eigenvaluesQR ordena los autovalores de mayor a menor',
    fn: () => {
      const { values } = eigenvaluesQR(new Matrix([[0, 50], [50, 0]]));
      assertClose(values[0], 50, 'Primero el mayor.', TOLERANCIA_ITERATIVA);
      assertClose(values[1], -50, 'Después el menor.', TOLERANCIA_ITERATIVA);
    },
  },
  {
    name: 'eigenvaluesQR resuelve el tensor de corte puro 3x3',
    fn: () => {
      // Autovalores exactos +τ, 0, −τ. Es la matriz que hacía que
      // vonMisesStress devolviera cero (H-04).
      const { values } = eigenvaluesQR(new Matrix([[0, 100, 0], [100, 0, 0], [0, 0, 0]]));
      assertEigenvalues(values, [100, 0, -100], 'Corte puro 3x3.');
    },
  },
  {
    name: 'hasComplexHint es false para toda matriz simétrica',
    fn: () => {
      // Contraprueba del falso positivo que dejaba H-03: por el teorema
      // espectral, toda matriz simétrica real tiene autovalores reales, así
      // que marcar complejos ahí es siempre un error.
      const simetricas = [
        new Matrix([[0, 1], [1, 0]]),
        new Matrix([[2, 1], [1, 2]]),
        new Matrix([[0, 50], [50, 0]]),
        new Matrix([[0, 100, 0], [100, 0, 0], [0, 0, 0]]),
        new Matrix([[4, 1, 0], [1, 4, 1], [0, 1, 4]]),
      ];
      simetricas.forEach((matriz, i) => {
        assertFalse(
          eigenvaluesQR(matriz).hasComplexHint,
          `La simétrica ${i} no debería marcar autovalores complejos.`,
        );
      });
    },
  },
  {
    name: 'la suma de los autovalores es la traza, también con autovalores ±λ',
    fn: () => {
      // Verificación cruzada independiente del algoritmo: tr(A) = Σλᵢ.
      const A = new Matrix([[0, 50], [50, 0]]);
      const { values } = eigenvaluesQR(A);
      const suma = values.reduce((acumulado, valor) => acumulado + valor, 0);
      assertClose(suma, A.trace(), 'Suma de autovalores vs. traza.', TOLERANCIA_ITERATIVA);
    },
  },

  /* ---------------------- jacobiEigenDecomposition ---------------------- */
  {
    name: 'jacobiEigenDecomposition resuelve una simétrica 2x2 conocida',
    fn: () => {
      const { values, converged } = jacobiEigenDecomposition(new Matrix([[2, 1], [1, 2]]));
      assertEigenvalues(values, [3, 1], 'Autovalores por Jacobi.');
      assertTrue(converged, 'Debería converger en una 2x2.');
    },
  },
  {
    name: 'jacobiEigenDecomposition da los autovalores exactos en el corte puro',
    fn: () => {
      // Una sola rotación alcanza: el caso que motivó el port (ADR-004).
      const { values, rotations } = jacobiEigenDecomposition(new Matrix([[0, 50], [50, 0]]));
      assertEigenvalues(values, [50, -50], 'Corte puro por Jacobi.');
      assertTrue(rotations >= 1, 'Debería haber aplicado al menos una rotación.');
    },
  },
  {
    name: 'los autovectores de Jacobi satisfacen A·v = λ·v',
    fn: () => {
      const A = new Matrix([[4, 1, 0], [1, 4, 1], [0, 1, 4]]);
      const { values, vectors } = jacobiEigenDecomposition(A);
      values.forEach((lambda, i) => {
        const v = new Matrix(vectors[i].map((componente) => [componente]));
        assertMatrixClose(
          A.multiply(v),
          v.scalarMultiply(lambda).toArray(),
          `A·v = λ·v para el autovalor ${i}.`,
          TOLERANCIA_ITERATIVA,
        );
      });
    },
  },
  {
    name: 'los autovectores de Jacobi son ortonormales',
    fn: () => {
      // Jacobi acumula rotaciones ortogonales, así que la base que devuelve
      // tiene que ser ortonormal por construcción. Si deja de serlo, la
      // acumulación está mal aplicada.
      const { vectors } = jacobiEigenDecomposition(new Matrix([[4, 1, 0], [1, 4, 1], [0, 1, 4]]));
      const producto = (u, v) => u.reduce((suma, valor, i) => suma + valor * v[i], 0);
      vectors.forEach((u, i) => {
        assertClose(producto(u, u), 1, `Norma del autovector ${i}.`, TOLERANCIA_ITERATIVA);
        vectors.slice(i + 1).forEach((v, j) => {
          assertClose(producto(u, v), 0, `Ortogonalidad ${i}-${i + j + 1}.`, TOLERANCIA_ITERATIVA);
        });
      });
    },
  },
  {
    name: 'jacobiEigenDecomposition resuelve el caso límite de una 1x1',
    fn: () => {
      const { values, vectors, converged } = jacobiEigenDecomposition(new Matrix([[6]]));
      assertEigenvalues(values, [6], 'Autovalor de una 1x1.');
      assertClose(Math.abs(vectors[0][0]), 1, 'Autovector normalizado de una 1x1.');
      assertTrue(converged, 'Una 1x1 ya está diagonalizada.');
    },
  },
  {
    name: 'jacobiEigenDecomposition rechaza una matriz no simétrica',
    fn: () => {
      assertThrows(
        () => jacobiEigenDecomposition(new Matrix([[1, 2], [3, 4]])),
        MathError,
        'NOT_SYMMETRIC',
        'Jacobi sobre una no simétrica.',
      );
    },
  },
  {
    name: 'jacobiEigenDecomposition exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => jacobiEigenDecomposition(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Jacobi sobre una 2x3.',
      );
    },
  },

  /* ---------------------------- eigenvalues2x2 ---------------------------- */
  {
    name: 'eigenvalues2x2 resuelve exacto el caso de raíces reales',
    fn: () => {
      // Exacto, no aproximado: es la fórmula cuadrática, sin iteración. Por
      // eso acá se compara con la tolerancia por defecto y no con la iterativa.
      const { values, hasComplexPair } = eigenvalues2x2(new Matrix([[0, 1], [1, 0]]));
      assertFalse(hasComplexPair, 'Los autovalores de esta matriz son reales.');
      assertClose(values[0], 1, 'Mayor autovalor.');
      assertClose(values[1], -1, 'Menor autovalor.');
    },
  },
  {
    name: 'eigenvalues2x2 reproduce el polinomio característico',
    fn: () => {
      // Verificación cruzada: Σλ = tr(A) y Πλ = det(A), exactos.
      const A = new Matrix([[3, 2], [1, 4]]);
      const { values } = eigenvalues2x2(A);
      assertClose(values[0] + values[1], A.trace(), 'Suma vs. traza.');
      assertClose(values[0] * values[1], 3 * 4 - 2 * 1, 'Producto vs. determinante.');
    },
  },
  {
    name: 'eigenvalues2x2 detecta el par complejo conjugado de una rotación',
    fn: () => {
      // Rotación de 90°: autovalores ±i. El motor no representa complejos
      // (deuda D5), así que los informa por partes en vez de inventar reales.
      const salida = eigenvalues2x2(new Matrix([[0, -1], [1, 0]]));
      assertTrue(salida.hasComplexPair, 'Debería detectar el par complejo.');
      assertEqual(salida.values.length, 0, 'No debería devolver autovalores reales.');
      assertClose(salida.realPart, 0, 'Parte real del par.');
      assertClose(salida.imaginaryPart, 1, 'Parte imaginaria del par.');
    },
  },
  {
    name: 'eigenvalues2x2 trata la raíz doble como real',
    fn: () => {
      // Discriminante exactamente cero: un solo autovalor con multiplicidad 2.
      const { values, hasComplexPair } = eigenvalues2x2(new Matrix([[5, 1], [0, 5]]));
      assertFalse(hasComplexPair, 'Una raíz doble es real, no compleja.');
      assertClose(values[0], 5, 'Primera copia de la raíz.');
      assertClose(values[1], 5, 'Segunda copia de la raíz.');
    },
  },
  {
    name: 'eigenvalues2x2 rechaza una matriz que no es de 2x2',
    fn: () => {
      assertThrows(
        () => eigenvalues2x2(Matrix.identity(3)),
        MathError,
        'NOT_2X2',
        'Forma cerrada sobre una 3x3.',
      );
    },
  },

  /* ---------------------------- eigenvectorFor ---------------------------- */
  {
    name: 'eigenvectorFor devuelve un vector que satisface A·v = λ·v',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const v = eigenvectorFor(a, 3);
      assertTrue(Array.isArray(v), 'Debería devolver un vector para λ = 3.');

      const av = a.multiply(new Matrix(v.map((x) => [x])));
      const lv = v.map((x) => [3 * x]);
      assertMatrixClose(av, lv, 'A·v debería ser igual a λ·v.', TOLERANCIA_ITERATIVA);
    },
  },
  {
    name: 'eigenvectorFor devuelve el autovector conocido de una diagonal',
    fn: () => {
      const v = eigenvectorFor(Matrix.diagonal([5, 9]), 9);
      assertTrue(Array.isArray(v), 'Debería encontrar el autovector.');
      // Cualquier múltiplo es válido: se verifica la dirección, no la escala.
      assertClose(v[0], 0, 'La primera componente debería ser nula.', TOLERANCIA_ITERATIVA);
      assertTrue(Math.abs(v[1]) > 1e-9, 'La segunda componente no debería ser nula.');
    },
  },
  {
    name: 'eigenvectorFor devuelve null si el valor dado no es autovalor',
    fn: () => {
      // docs/API.md declara `number[] | null`: no lanzar es parte del contrato.
      const v = eigenvectorFor(new Matrix([[2, 1], [1, 2]]), 99);
      assertTrue(v === null, 'Un valor que no es autovalor no tiene autovector asociado.');
    },
  },

  /* ----------------------------- eigenvectors ----------------------------- */
  {
    name: 'eigenvectors empareja cada autovalor con su vector',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const pares = eigenvectors(a, [3, 1]);
      assertEqual(pares.length, 2, 'Un par por autovalor.');
      pares.forEach(({ lambda, vector }) => {
        assertTrue(Array.isArray(vector), `Debería haber autovector para λ = ${lambda}.`);
        const av = a.multiply(new Matrix(vector.map((x) => [x])));
        assertMatrixClose(
          av,
          vector.map((x) => [lambda * x]),
          `A·v = λ·v para λ = ${lambda}.`,
          TOLERANCIA_ITERATIVA,
        );
      });
    },
  },
  {
    name: 'los autovectores de una simétrica son ortogonales entre sí',
    fn: () => {
      // Propiedad del teorema espectral: si no se cumple, el cálculo está mal
      // aunque cada autovector por separado parezca razonable.
      const pares = eigenvectors(new Matrix([[2, 1], [1, 2]]), [3, 1]);
      const [v1, v2] = pares.map((p) => p.vector);
      const producto = v1[0] * v2[0] + v1[1] * v2[1];
      assertClose(producto, 0, 'El producto escalar debería ser nulo.', TOLERANCIA_ITERATIVA);
    },
  },

  /* ------------------------------ diagonalize ------------------------------ */
  {
    name: 'diagonalize devuelve D con los autovalores en la diagonal',
    fn: () => {
      const { D } = diagonalize(new Matrix([[2, 1], [1, 2]]));
      assertTrue(D.isDiagonal(TOLERANCIA_ITERATIVA), 'D debería ser diagonal.');
      assertEigenvalues([D.get(0, 0), D.get(1, 1)], [3, 1], 'Diagonal de D.');
    },
  },
  {
    name: 'diagonalize satisface A = P·D·P⁻¹',
    fn: () => {
      const a = new Matrix([[2, 1], [1, 2]]);
      const { P, D, Pinv } = diagonalize(a);
      assertMatrixClose(
        P.multiply(D).multiply(Pinv),
        a.toArray(),
        'La reconstrucción debería devolver A.',
        TOLERANCIA_ITERATIVA,
      );
    },
  },
  {
    name: 'Pinv es efectivamente la inversa de P',
    fn: () => {
      const { P, Pinv } = diagonalize(new Matrix([[2, 1], [1, 2]]));
      assertMatrixClose(
        P.multiply(Pinv),
        Matrix.identity(2).toArray(),
        'P·P⁻¹ debería ser la identidad.',
        TOLERANCIA_ITERATIVA,
      );
    },
  },
  {
    name: 'diagonalize rechaza una matriz no diagonalizable',
    fn: () => {
      // Bloque de Jordan: autovalor 1 doble con un solo autovector independiente.
      assertThrows(
        () => diagonalize(new Matrix([[1, 1], [0, 1]])),
        MathError,
        'NOT_DIAGONALIZABLE',
        'Bloque de Jordan 2x2.',
      );
    },
  },
];
