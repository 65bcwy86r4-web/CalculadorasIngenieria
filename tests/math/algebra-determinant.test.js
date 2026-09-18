/**
 * tests/math/algebra-determinant.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de determinante e inversa: determinantByGauss, determinantByCofactors,
 * inverse, cofactorMatrix, adjugate y conditionNumber.
 *
 * Las comparaciones entre los dos caminos de cálculo (Gauss contra cofactores,
 * inversa contra A·A⁻¹) viven en cross-checks.test.js. Acá se prueba cada
 * función contra valores conocidos, calculables a mano, y contra sus casos
 * límite: 1x1, matriz singular, tamaño máximo de cofactores.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  determinantByGauss, determinantByCofactors,
  inverse, cofactorMatrix, adjugate, conditionNumber,
  Matrix, MathError, DimensionError, SingularMatrixError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertMatrixClose,
  assertThrows, assertDoesNotThrow,
} from '../assert.js';

export const tests = [
  /* --------------------------- determinantByGauss --------------------------- */
  {
    name: 'determinantByGauss reproduce valores conocidos',
    fn: () => {
      assertClose(determinantByGauss(new Matrix([[7]])).value, 7, 'Determinante de una 1x1.');
      assertClose(determinantByGauss(new Matrix([[1, 2], [3, 4]])).value, -2, '1·4 − 2·3.');
      assertClose(determinantByGauss(new Matrix([[2, 1], [1, 3]])).value, 5, '2·3 − 1·1.');
      assertClose(
        determinantByGauss(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).value,
        -306,
        'Determinante 3x3 de bibliografía.',
      );
      assertClose(determinantByGauss(Matrix.identity(5)).value, 1, 'Determinante de la identidad.');
    },
  },
  {
    name: 'determinantByGauss da cero exacto en una matriz singular',
    fn: () => {
      assertClose(
        determinantByGauss(new Matrix([[1, 2], [2, 4]])).value,
        0,
        'Filas proporcionales.',
        1e-12,
      );
      assertClose(determinantByGauss(Matrix.zeros(3)).value, 0, 'Matriz nula.');
      assertClose(
        determinantByGauss(new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).value,
        0,
        'La tercera fila es combinación lineal de las otras dos.',
        1e-12,
      );
    },
  },
  {
    name: 'el determinante de una triangular es el producto de su diagonal',
    fn: () => {
      assertClose(
        determinantByGauss(new Matrix([[2, 9, 4], [0, 3, 7], [0, 0, 5]])).value,
        30,
        '2 · 3 · 5.',
      );
      assertClose(determinantByGauss(Matrix.diagonal([2, -3, 4])).value, -24, '2 · (−3) · 4.');
    },
  },
  {
    name: 'intercambiar dos filas invierte el signo del determinante',
    fn: () => {
      const a = determinantByGauss(new Matrix([[1, 2], [3, 4]])).value;
      const b = determinantByGauss(new Matrix([[3, 4], [1, 2]])).value;
      assertClose(b, -a, 'Un intercambio de filas cambia el signo.');
    },
  },
  {
    name: 'determinantByGauss informa el conteo de intercambios y los pasos',
    fn: () => {
      const salida = determinantByGauss(new Matrix([[0, 1], [1, 0]]));
      assertClose(salida.value, -1, 'Determinante de la permutación 2x2.');
      assertEqual(salida.swapCount, 1, 'Un intercambio.');
      assertTrue(Array.isArray(salida.steps), 'steps debería ser un arreglo.');
    },
  },
  {
    name: 'determinantByGauss exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => determinantByGauss(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Determinante de una 2x3.',
      );
    },
  },

  /* ------------------------- determinantByCofactors ------------------------- */
  {
    name: 'determinantByCofactors reproduce valores conocidos',
    fn: () => {
      assertClose(determinantByCofactors(new Matrix([[5]])).value, 5, 'Determinante de una 1x1.');
      assertClose(determinantByCofactors(new Matrix([[1, 2], [3, 4]])).value, -2, 'Determinante 2x2.');
      assertClose(
        determinantByCofactors(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).value,
        -306,
        'Determinante 3x3 de bibliografía.',
      );
    },
  },
  {
    name: 'determinantByCofactors devuelve { value, steps }, no un número pelado',
    fn: () => {
      // Desde ADR-007 §3.4 devuelve { value, steps } como el resto del
      // álgebra, en vez de un número pelado: un número no puede llevar el
      // procedimiento colgado. `steps` viene vacío hasta el Paso 2c-2, y esa
      // es justamente la forma que el contrato congela.
      const salida = determinantByCofactors(new Matrix([[1, 2], [3, 4]]));
      assertEqual(typeof salida, 'object', 'Tipo del valor de retorno.');
      assertEqual(typeof salida.value, 'number', 'Tipo de la clave value.');
      assertTrue(Array.isArray(salida.steps), 'steps debería ser un arreglo.');
    },
  },
  {
    name: 'determinantByCofactors muestra la expansión del primer nivel',
    fn: () => {
      // Un paso por término de la primera fila, más la apertura y el cierre.
      // Solo el primer nivel: la función es recursiva y trazarla entera sería
      // O(n!) pasos (ADR-007 §4, grupo 1).
      const { steps, value } = determinantByCofactors(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]]));
      assertEqual(steps.length, 5, 'Apertura + 3 términos + cierre.');
      assertEqual(steps[0].type, 'info', 'Abre anunciando la fórmula.');
      const expansiones = steps.filter((paso) => paso.type === 'expand');
      assertEqual(expansiones.length, 3, 'Un paso expand por columna de la primera fila.');
      assertEqual(steps[steps.length - 1].type, 'final', 'Cierra con la suma.');
      assertTrue(
        steps[steps.length - 1].text.includes(value.toFixed(4)),
        'El cierre debería traer el determinante.',
      );
    },
  },
  {
    name: 'cada término de Laplace trae su menor como snapshot',
    fn: () => {
      // El menor es la submatriz sobre la que opera el paso, no un estado
      // posterior: es el caso que motivó la enmienda del 18/09 a ADR-007 §3.2.
      const { steps } = determinantByCofactors(new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]]));
      steps.filter((paso) => paso.type === 'expand').forEach((paso, j) => {
        assertTrue(Array.isArray(paso.snapshot), `El término ${j + 1} debería traer snapshot.`);
        assertEqual(paso.snapshot.length, 2, 'El menor de una 3x3 es de 2x2.');
        assertEqual(paso.snapshot[0].length, 2, 'El menor de una 3x3 es de 2x2.');
      });
    },
  },
  {
    name: 'la suma de los términos de Laplace reproduce el determinante',
    fn: () => {
      // Verificación cruzada contra el propio procedimiento: si los textos de
      // los pasos y el valor devuelto se separan, el desarrollo miente.
      const a = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 10]]);
      const { steps, value } = determinantByCofactors(a);
      const terminos = steps
        .filter((paso) => paso.type === 'expand')
        .map((paso) => Number(paso.text.split('=').pop().trim()));
      const suma = terminos.reduce((acumulado, termino) => acumulado + termino, 0);
      assertClose(suma, value, 'Los términos mostrados deberían sumar el determinante.', 1e-9);
      assertClose(value, determinantByGauss(a).value, 'Y coincidir con Gauss.', 1e-9);
    },
  },
  {
    name: 'la 1x1 explica la convención en vez de expandir',
    fn: () => {
      const { steps } = determinantByCofactors(new Matrix([[5]]));
      assertEqual(steps.length, 1, 'Un solo paso.');
      assertEqual(steps[0].type, 'final', 'Y es el cierre.');
    },
  },
  {
    name: 'determinantByCofactors corta en n > 7 por costo factorial',
    fn: () => {
      assertDoesNotThrow(() => determinantByCofactors(Matrix.identity(7)), 'n = 7 debería permitirse.');
      assertThrows(
        () => determinantByCofactors(Matrix.identity(8)),
        MathError,
        'TOO_LARGE_FOR_COFACTORS',
        'n = 8 debería rechazarse.',
      );
    },
  },
  {
    name: 'determinantByCofactors exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => determinantByCofactors(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Cofactores de una 2x3.',
      );
    },
  },

  /* ------------------------------- inverse ------------------------------- */
  {
    name: 'inverse reproduce inversas conocidas',
    fn: () => {
      assertMatrixClose(
        inverse(new Matrix([[4, 7], [2, 6]])).inverse,
        [[0.6, -0.7], [-0.2, 0.4]],
        'Inversa 2x2 de bibliografía.',
      );
      assertMatrixClose(
        inverse(Matrix.diagonal([2, 4])).inverse,
        [[0.5, 0], [0, 0.25]],
        'La inversa de una diagonal invierte cada elemento.',
      );
      assertMatrixClose(inverse(Matrix.identity(3)).inverse, Matrix.identity(3).toArray(), 'I⁻¹ = I.');
      assertMatrixClose(inverse(new Matrix([[4]])).inverse, [[0.25]], 'Inversa de una 1x1.');
    },
  },
  {
    name: 'inverse lanza SingularMatrixError con una matriz no invertible',
    fn: () => {
      assertThrows(
        () => inverse(new Matrix([[1, 2], [2, 4]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'Filas proporcionales.',
      );
      assertThrows(
        () => inverse(Matrix.zeros(3)),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'Matriz nula.',
      );
      assertThrows(
        () => inverse(new Matrix([[0]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'La 1x1 nula tampoco tiene inversa.',
      );
    },
  },
  {
    name: 'inverse exige matriz cuadrada',
    fn: () => {
      assertThrows(
        () => inverse(new Matrix([[1, 2, 3], [4, 5, 6]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Inversa de una 2x3.',
      );
    },
  },
  {
    name: 'inverse no modifica la matriz original',
    fn: () => {
      const a = new Matrix([[4, 7], [2, 6]]);
      inverse(a);
      assertMatrixClose(a, [[4, 7], [2, 6]], 'La entrada queda intacta.');
    },
  },

  /* -------------------------- cofactores y adjunta -------------------------- */
  {
    name: 'cofactorMatrix reproduce el valor conocido de una 2x2',
    fn: () => {
      assertMatrixClose(
        cofactorMatrix(new Matrix([[1, 2], [3, 4]])).matrix,
        [[4, -3], [-2, 1]],
        'Matriz de cofactores 2x2.',
      );
    },
  },
  {
    name: 'cofactorMatrix respeta el patrón de signos en una 3x3',
    fn: () => {
      // Para la identidad, cada cofactor Cᵢᵢ es el determinante de la
      // identidad menor (1) y los de fuera de la diagonal son 0.
      assertMatrixClose(cofactorMatrix(Matrix.identity(3)).matrix, Matrix.identity(3).toArray(), 'Cofactores de I.');
      assertMatrixClose(
        cofactorMatrix(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])).matrix,
        [[-24, 20, -5], [18, -15, 4], [5, -4, 1]],
        'Cofactores 3x3 de bibliografía.',
      );
    },
  },
  {
    name: 'adjugate es la transpuesta de la matriz de cofactores',
    fn: () => {
      assertMatrixClose(
        adjugate(new Matrix([[1, 2], [3, 4]])).matrix,
        [[4, -2], [-3, 1]],
        'Adjunta 2x2.',
      );
      assertMatrixClose(
        adjugate(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])).matrix,
        cofactorMatrix(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]])).matrix.transpose().toArray(),
        'adj(A) = C(A)ᵀ.',
      );
    },
  },
  {
    name: 'A · adj(A) = det(A) · I',
    fn: () => {
      // Identidad fundamental del álgebra lineal: verifica cofactores, adjunta
      // y determinante de una sola vez.
      const a = new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]]);
      const det = determinantByGauss(a).value;
      assertMatrixClose(
        a.multiply(adjugate(a).matrix),
        Matrix.identity(3).scalarMultiply(det).toArray(),
        'A · adj(A) debería ser det(A) · I.',
      );
    },
  },
  {
    name: 'cofactorMatrix y adjugate resuelven el caso límite de una 1x1',
    fn: () => {
      // Era el hallazgo H-05: las dos lanzaban DimensionError acá. El menor de
      // una matriz de 1x1 es la matriz vacía, cuyo determinante vale 1 por
      // convención, así que el único cofactor es (+1)·1 = 1 y la adjunta de
      // [[a]] es [[1]], sea cual sea a.
      assertMatrixClose(cofactorMatrix(new Matrix([[7]])).matrix, [[1]], 'Cofactores de una 1x1.');
      assertMatrixClose(cofactorMatrix(new Matrix([[-3]])).matrix, [[1]], 'No depende del valor.');
      assertMatrixClose(adjugate(new Matrix([[7]])).matrix, [[1]], 'Adjunta de una 1x1.');
    },
  },
  {
    name: 'adj(A)/det(A) da la inversa correcta de una 1x1',
    fn: () => {
      // La razón por la que [[1]] es el valor correcto y no una convención
      // arbitraria: es el único que hace que la fórmula de la inversa por
      // adjunta siga valiendo en el caso base.
      const a = new Matrix([[7]]);
      const det = determinantByGauss(a).value;
      assertMatrixClose(
        adjugate(a).matrix.scalarMultiply(1 / det),
        inverse(a).inverse.toArray(),
        'adj(A)/det(A) debería coincidir con la inversa por Gauss-Jordan.',
      );
    },
  },
  {
    name: 'A · adj(A) = det(A) · I también en una 1x1',
    fn: () => {
      const a = new Matrix([[7]]);
      assertMatrixClose(a.multiply(adjugate(a).matrix), [[7]], 'A · adj(A) en el caso base.');
    },
  },
  {
    name: 'cofactorMatrix emite un paso por cofactor, con su menor',
    fn: () => {
      const { steps } = cofactorMatrix(new Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]]));
      const computos = steps.filter((paso) => paso.type === 'compute');
      assertEqual(computos.length, 9, 'n² cofactores para una 3x3.');
      computos.forEach((paso) => {
        assertEqual(paso.snapshot.length, 2, 'El menor de una 3x3 es de 2x2.');
      });
      assertEqual(steps[0].type, 'info', 'Abre con la fórmula del cofactor.');
      assertEqual(steps[steps.length - 1].type, 'final', 'Cierra con la matriz completa.');
    },
  },
  {
    name: 'cofactorMatrix acota el desarrollo arriba de 6x6',
    fn: () => {
      // Sin cota, una 15x15 —tamaño que el selector de la calculadora
      // permite— daría 225 pasos con menores de 196 celdas. El resultado
      // numérico no cambia; lo que se acota es el relato.
      const grande = (n) => new Matrix(
        Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? n + 2 : (i + j) % 3))),
      );
      const detallada = cofactorMatrix(grande(6));
      const acotada = cofactorMatrix(grande(7));
      assertEqual(detallada.steps.filter((p) => p.type === 'compute').length, 36, '6x6 desarrolla.');
      assertEqual(acotada.steps.filter((p) => p.type === 'compute').length, 0, '7x7 no desarrolla.');
      assertTrue(acotada.steps.length <= 2, 'Arriba de la cota quedan apertura y cierre.');
      assertTrue(
        acotada.steps[0].text.includes('se omite'),
        'Y el paso de apertura debería decir que el desarrollo se omite.',
      );
      // Lo que no cambia: el resultado.
      assertEqual(acotada.matrix.rows, 7, 'La matriz de cofactores se calcula igual.');
    },
  },
  {
    name: 'adjugate cierra con la transposición y sin dos finales',
    fn: () => {
      // Al encadenar el procedimiento de cofactorMatrix, su `final` deja de
      // ser final: se degrada a `info` para que la conclusión sea una sola.
      const { steps } = adjugate(new Matrix([[1, 2], [3, 4]]));
      const finales = steps.filter((paso) => paso.type === 'final');
      assertEqual(finales.length, 1, 'Un solo paso de cierre.');
      assertEqual(steps[steps.length - 1], finales[0], 'Y es el último.');
      assertTrue(finales[0].text.includes('Cᵀ'), 'El cierre debería nombrar la transposición.');
    },
  },
  {
    name: 'adjugate por det(A)·A⁻¹ también explica cómo llegó',
    fn: () => {
      const grande = new Matrix(
        Array.from({ length: 7 }, (_, i) => Array.from({ length: 7 }, (_, j) => (i === j ? 9 : (i + j) % 3))),
      );
      const { steps } = adjugate(grande);
      const finales = steps.filter((paso) => paso.type === 'final');
      assertEqual(finales.length, 1, 'Un solo paso de cierre.');
      assertTrue(
        finales[0].text.includes('det(A) · A⁻¹'),
        'El cierre debería nombrar la identidad que se usó.',
      );
    },
  },
  {
    name: 'conditionNumber explica de dónde sale el número que devuelve',
    fn: () => {
      // Era el grupo 4 de ADR-007 §4: heredaba los pasos de la inversión y
      // terminaba en "el bloque derecho es A⁻¹", sin mencionar nunca las
      // normas. Forma correcta, contenido equivocado.
      const salida = conditionNumber(new Matrix([[4, 7], [2, 6]]));
      const textos = salida.steps.map((paso) => paso.text).join(' | ');
      assertTrue(textos.includes('‖A‖_F'), 'Debería mostrar la norma de A.');
      assertTrue(textos.includes('‖A⁻¹‖_F'), 'Debería mostrar la norma de la inversa.');

      const cierre = salida.steps[salida.steps.length - 1];
      assertEqual(cierre.type, 'final', 'El último paso es el cierre.');
      assertTrue(cierre.text.includes(salida.value.toFixed(4)), 'Y trae el número devuelto.');
      assertEqual(
        salida.steps.filter((paso) => paso.type === 'final').length,
        1,
        'El final heredado de inverse se degrada a info.',
      );
      assertEqual(salida.steps[0].type, 'info', 'Abre avisando que primero invierte.');
    },
  },
  {
    name: 'las normas que muestra conditionNumber son las que multiplica',
    fn: () => {
      // Verificación cruzada contra el propio texto: si el procedimiento
      // muestra unos números y devuelve otro, el desarrollo miente.
      const salida = conditionNumber(new Matrix([[4, 7], [2, 6]]));
      assertClose(salida.normA * salida.normInverse, salida.value, 'κ = ‖A‖·‖A⁻¹‖.');
      const cierre = salida.steps[salida.steps.length - 1].text;
      assertTrue(cierre.includes(salida.normA.toFixed(4)), 'El cierre trae ‖A‖_F.');
      assertTrue(cierre.includes(salida.normInverse.toFixed(4)), 'El cierre trae ‖A⁻¹‖_F.');
    },
  },
  {
    name: 'cofactorMatrix y adjugate exigen matriz cuadrada',
    fn: () => {
      const rect = new Matrix([[1, 2, 3], [4, 5, 6]]);
      assertThrows(() => cofactorMatrix(rect), DimensionError, 'DIMENSION_ERROR', 'Cofactores de una 2x3.');
      assertThrows(() => adjugate(rect), DimensionError, 'DIMENSION_ERROR', 'Adjunta de una 2x3.');
    },
  },

  /* ---------------------------- conditionNumber ---------------------------- */
  {
    name: 'conditionNumber de la identidad es n',
    fn: () => {
      // κ(I) = ‖I‖_F · ‖I⁻¹‖_F = √n · √n = n
      assertClose(conditionNumber(Matrix.identity(3)).value, 3, 'κ(I₃).');
      assertClose(conditionNumber(Matrix.identity(4)).value, 4, 'κ(I₄).');
    },
  },
  {
    name: 'conditionNumber devuelve también las dos normas que lo componen',
    fn: () => {
      const salida = conditionNumber(Matrix.identity(3));
      assertClose(salida.normA, Math.sqrt(3), 'Norma de Frobenius de I₃.');
      assertClose(salida.normInverse, Math.sqrt(3), 'Norma de su inversa.');
      assertClose(salida.value, salida.normA * salida.normInverse, 'El valor es el producto de ambas.');
    },
  },
  {
    name: 'conditionNumber crece con el mal condicionamiento',
    fn: () => {
      // La matriz de Hilbert 3x3 es el ejemplo clásico de mal condicionamiento.
      const hilbert = new Matrix([
        [1, 1 / 2, 1 / 3],
        [1 / 2, 1 / 3, 1 / 4],
        [1 / 3, 1 / 4, 1 / 5],
      ]);
      assertTrue(
        conditionNumber(hilbert).value > 500,
        'La Hilbert 3x3 debería tener un número de condición alto.',
      );
    },
  },
  {
    name: 'conditionNumber lanza SingularMatrixError si la matriz no es invertible',
    fn: () => {
      assertThrows(
        () => conditionNumber(new Matrix([[1, 2], [2, 4]])),
        SingularMatrixError,
        'SINGULAR_MATRIX',
        'κ no está definido para una matriz singular.',
      );
    },
  },
];
