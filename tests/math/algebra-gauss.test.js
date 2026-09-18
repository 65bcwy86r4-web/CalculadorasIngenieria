/**
 * tests/math/algebra-gauss.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/algebra/gauss.js: rowEchelon, reducedRowEchelon,
 * rank y solveSystem.
 *
 * El punto delicado de este módulo es solveSystem: docs/API.md y
 * docs/Algorithms.md establecen que un sistema sin solución única NO es un
 * error de uso sino un resultado matemático válido, y por eso se devuelve
 * discriminado por `type` en vez de lanzar. Las tres ramas se prueban por
 * separado; si alguna empezara a lanzar, una calculadora que hoy muestra
 * "el sistema tiene infinitas soluciones" pasaría a mostrar un stack trace.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  rowEchelon, reducedRowEchelon, rank, solveSystem,
  Matrix, DimensionError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertVectorClose,
  assertMatrixClose, assertThrows,
} from '../assert.js';

export const tests = [
  /* ------------------------------ rowEchelon ------------------------------ */
  {
    name: 'rowEchelon deja ceros por debajo de la diagonal',
    fn: () => {
      const { result } = rowEchelon(new Matrix([[2, 1], [4, 3]]));
      assertTrue(result.isUpperTriangular(1e-9), 'El resultado debería ser triangular superior.');
    },
  },
  {
    name: 'rowEchelon preserva el rango y registra los pasos',
    fn: () => {
      const salida = rowEchelon(new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 10]]));
      assertTrue(salida.result.isUpperTriangular(1e-9), 'Triangular superior.');
      assertTrue(Array.isArray(salida.steps) && salida.steps.length > 0, 'Debería registrar pasos.');
      assertTrue(Number.isInteger(salida.swapCount), 'swapCount debería ser un entero.');
      assertEqual(salida.pivots.length, 3, 'Una matriz de rango 3 tiene 3 pivotes.');
    },
  },
  {
    name: 'rowEchelon cuenta los intercambios de fila que hace el pivoteo parcial',
    fn: () => {
      // El pivoteo parcial elige el mayor valor absoluto de la columna: con un
      // 0 arriba, el intercambio es obligatorio.
      const { swapCount } = rowEchelon(new Matrix([[0, 1], [1, 0]]));
      assertEqual(swapCount, 1, 'Debería haber intercambiado exactamente una vez.');
      const sinSwap = rowEchelon(new Matrix([[5, 1], [0, 3]]));
      assertEqual(sinSwap.swapCount, 0, 'Ya estaba escalonada: sin intercambios.');
    },
  },
  {
    name: 'rowEchelon con una matriz nula no inventa pivotes',
    fn: () => {
      const salida = rowEchelon(Matrix.zeros(3));
      assertEqual(salida.pivots.length, 0, 'La matriz nula no tiene pivotes.');
      assertMatrixClose(salida.result, [[0, 0, 0], [0, 0, 0], [0, 0, 0]], 'Sigue siendo nula.');
    },
  },
  {
    name: 'rowEchelon acepta matrices rectangulares',
    fn: () => {
      const salida = rowEchelon(new Matrix([[1, 2, 3], [2, 4, 7]]));
      assertEqual(salida.result.rows, 2, 'Conserva las filas.');
      assertEqual(salida.result.cols, 3, 'Conserva las columnas.');
      assertClose(salida.result.get(1, 0), 0, 'Debajo del primer pivote queda cero.');
    },
  },

  /* --------------------------- reducedRowEchelon --------------------------- */
  {
    name: 'reducedRowEchelon normaliza los pivotes a 1 y limpia arriba',
    fn: () => {
      const { result } = reducedRowEchelon(new Matrix([[2, 4], [1, 1]]));
      assertMatrixClose(result, [[1, 0], [0, 1]], 'Una matriz invertible reduce a la identidad.');
    },
  },
  {
    name: 'reducedRowEchelon de una matriz singular deja la fila nula al final',
    fn: () => {
      const { result } = reducedRowEchelon(new Matrix([[1, 2], [2, 4]]));
      assertMatrixClose(result, [[1, 2], [0, 0]], 'Segunda fila proporcional a la primera.');
    },
  },
  {
    name: 'reducedRowEchelon es idempotente',
    fn: () => {
      // Una forma ya reducida no debería cambiar al volver a reducirla.
      const primera = reducedRowEchelon(new Matrix([[0, 1, 2], [1, 0, 3]])).result;
      const segunda = reducedRowEchelon(primera).result;
      assertMatrixClose(segunda, primera.toArray(), 'Reducir dos veces da lo mismo que reducir una.');
    },
  },

  /* -------------------------------- rank -------------------------------- */
  {
    name: 'rank reconoce el rango completo',
    fn: () => {
      assertEqual(rank(Matrix.identity(4)).rank, 4, 'Identidad 4x4.');
      assertEqual(rank(new Matrix([[1, 2], [3, 4]])).rank, 2, 'Una 2x2 invertible.');
    },
  },
  {
    name: 'rank detecta filas linealmente dependientes',
    fn: () => {
      assertEqual(rank(new Matrix([[1, 2], [2, 4]])).rank, 1, 'Segunda fila = 2 × primera.');
      assertEqual(
        rank(new Matrix([[1, 1, 1], [2, 2, 2], [3, 3, 3]])).rank,
        1,
        'Tres filas proporcionales.',
      );
      assertEqual(rank(Matrix.zeros(3)).rank, 0, 'La matriz nula tiene rango 0.');
    },
  },
  {
    name: 'rank de una rectangular no supera la menor dimensión',
    fn: () => {
      const r = rank(new Matrix([[1, 2, 3], [4, 5, 6]])).rank;
      assertEqual(r, 2, 'Una 2x3 de filas independientes tiene rango 2.');
      assertTrue(r <= 2, 'El rango nunca supera min(filas, columnas).');
    },
  },
  {
    name: 'rank devuelve también la forma escalonada usada',
    fn: () => {
      const salida = rank(new Matrix([[1, 2], [2, 4]]));
      assertTrue(salida.echelon instanceof Matrix, 'echelon debería ser una Matrix.');
      assertTrue(Array.isArray(salida.steps), 'steps debería ser un arreglo.');
    },
  },

  /* ----------------------------- solveSystem ----------------------------- */
  {
    name: 'solveSystem resuelve un sistema 2x2 con solución conocida',
    fn: () => {
      // 2x +  y =  8
      //  x + 3y = 13   ->   x = 2.2, y = 3.6
      const salida = solveSystem(new Matrix([[2, 1], [1, 3]]), [8, 13]);
      assertEqual(salida.classification, 'unique', 'Clasificación del sistema.');
      assertVectorClose(salida.solution, [2.2, 3.6], 'Solución del sistema.');
    },
  },
  {
    name: 'la solución de solveSystem satisface A·x = b',
    fn: () => {
      const A = new Matrix([[4, -2, 1], [1, 5, -3], [2, 1, 6]]);
      const b = [11, -2, 21];
      const { classification, solution } = solveSystem(A, b);
      assertEqual(classification, 'unique', 'Debería tener solución única.');

      const x = new Matrix(solution.map((v) => [v]));
      assertMatrixClose(A.multiply(x), b.map((v) => [v]), 'A·x debería reproducir b.');
    },
  },
  {
    name: 'solveSystem informa infinitas soluciones sin lanzar',
    fn: () => {
      // x + y = 2 ; 2x + 2y = 4  -> la segunda ecuación no aporta información
      const salida = solveSystem(new Matrix([[1, 1], [2, 2]]), [2, 4]);
      assertEqual(salida.classification, 'infinite', 'Clasificación del sistema.');
      assertEqual(salida.rankA, salida.rankAug, 'Rango de A igual al de la ampliada.');
      assertTrue(salida.rankA < 2, 'El rango es menor que la cantidad de incógnitas.');
      assertTrue(typeof salida.message === 'string', 'Debería traer un mensaje para mostrar.');
    },
  },
  {
    name: 'solveSystem informa incompatibilidad sin lanzar',
    fn: () => {
      // x + y = 2 ; 2x + 2y = 5  -> contradicción
      const salida = solveSystem(new Matrix([[1, 1], [2, 2]]), [2, 5]);
      assertEqual(salida.classification, 'incompatible', 'Clasificación del sistema.');
      assertTrue(salida.rankAug > salida.rankA, 'El rango de la ampliada supera al de A.');
    },
  },
  {
    name: 'solveSystem cierra el procedimiento con un paso final por cada clasificación',
    fn: () => {
      // Antes del Paso 2c-2 el desarrollo terminaba en la última operación de
      // fila y la clasificación vivía solo en el objeto de retorno: quien leía
      // únicamente el procedimiento no veía ninguna conclusión. La enmienda de
      // ADR-007 §3.3 lo cierra con un paso `final` en las tres ramas.
      const casos = [
        { A: new Matrix([[2, 1], [1, 3]]), b: [8, 13], esperado: 'determinado' },
        { A: new Matrix([[1, 1], [2, 2]]), b: [2, 4], esperado: 'indeterminado' },
        { A: new Matrix([[1, 1], [2, 2]]), b: [2, 5], esperado: 'incompatible' },
      ];
      casos.forEach(({ A, b, esperado }) => {
        const { steps } = solveSystem(A, b);
        const ultimo = steps[steps.length - 1];
        assertEqual(ultimo.type, 'final', `El último paso de '${esperado}' debería ser de cierre.`);
        assertTrue(
          ultimo.text.includes(esperado),
          `El cierre debería enunciar que el sistema es ${esperado} (dice: "${ultimo.text}").`,
        );
        assertTrue(ultimo.text.includes('rg(A)'), 'El cierre debería mostrar los rangos que lo justifican.');
      });
    },
  },
  {
    name: 'hay un solo paso final y está al final',
    fn: () => {
      // Un `final` en el medio significaría que la reducción siguió después de
      // la conclusión, que es justamente lo que el paso viene a evitar.
      const { steps } = solveSystem(new Matrix([[2, 1], [1, 3]]), [8, 13]);
      const finales = steps.filter((paso) => paso.type === 'final');
      assertEqual(finales.length, 1, 'Cantidad de pasos de cierre.');
      assertEqual(steps.indexOf(finales[0]), steps.length - 1, 'Posición del paso de cierre.');
    },
  },
  {
    name: 'el cierre del sistema determinado trae la solución',
    fn: () => {
      const { steps, solution } = solveSystem(new Matrix([[2, 1], [1, 3]]), [8, 13]);
      const cierre = steps[steps.length - 1].text;
      solution.forEach((valor, i) => {
        assertTrue(
          cierre.includes(valor.toFixed(4)),
          `El cierre debería incluir x${i + 1} = ${valor.toFixed(4)}.`,
        );
      });
    },
  },
  {
    name: 'el discriminante se llama classification, no type',
    fn: () => {
      // Enmienda de ADR-007 §3.3 (D16): `step.type` y el discriminante del
      // retorno tenían el mismo nombre con vocabularios distintos. Esta prueba
      // fija el nombre nuevo y que el viejo no quedó como alias silencioso.
      const salida = solveSystem(new Matrix([[2, 1], [1, 3]]), [8, 13]);
      assertEqual(salida.classification, 'unique', 'Clave nueva.');
      assertEqual(salida.type, undefined, 'La clave vieja no debería seguir existiendo.');
    },
  },
  {
    name: 'solveSystem exige que b tenga tantos elementos como filas tiene A',
    fn: () => {
      assertThrows(
        () => solveSystem(new Matrix([[1, 1], [2, 3]]), [1]),
        DimensionError,
        'DIMENSION_ERROR',
        'b más corto que A.rows.',
      );
      assertThrows(
        () => solveSystem(new Matrix([[1, 1], [2, 3]]), [1, 2, 3]),
        DimensionError,
        'DIMENSION_ERROR',
        'b más largo que A.rows.',
      );
    },
  },
  {
    name: 'solveSystem resuelve el caso 1x1',
    fn: () => {
      const salida = solveSystem(new Matrix([[4]]), [12]);
      assertEqual(salida.classification, 'unique', 'Un sistema de una ecuación tiene solución única.');
      assertVectorClose(salida.solution, [3], '4x = 12.');
    },
  },
  {
    name: 'solveSystem con b nulo devuelve la solución trivial',
    fn: () => {
      const salida = solveSystem(new Matrix([[2, 1], [1, 3]]), [0, 0]);
      assertEqual(salida.classification, 'unique', 'Sistema homogéneo con A invertible.');
      assertVectorClose(salida.solution, [0, 0], 'Solución trivial.');
    },
  },
];
