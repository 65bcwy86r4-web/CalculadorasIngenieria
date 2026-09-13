/**
 * tests/math/known-defects.test.js
 * ---------------------------------------------------------------------------
 * DEFECTOS CONOCIDOS DEL MOTOR, FIJADOS COMO PRUEBA.
 *
 * Este archivo es la excepción a la regla de la suite. Las demás pruebas
 * verifican que el motor haga lo correcto. Estas fijan lo que el motor hace
 * HOY, que en estos casos es incorrecto, y dejan escrito al lado cuál es el
 * resultado correcto y por qué.
 *
 * Por qué existe, en vez de dejar las pruebas en rojo donde corresponden:
 * `node tests/run.js` tiene que poder usarse como compuerta (CODING_STANDARDS.md
 * §17). Una suite permanentemente roja deja de informar: a los dos días nadie
 * distingue "las de siempre" de una regresión nueva. Separar los defectos
 * conocidos en un archivo propio mantiene la compuerta útil sin esconder nada:
 * los defectos siguen en el repositorio, con nombre, causa y valor correcto.
 *
 * CÓMO SE CIERRA UN HALLAZGO
 * Cuando el Chat 2 corrija uno de estos defectos, la prueba correspondiente va
 * a fallar — está fijando el comportamiento defectuoso a propósito. Eso NO es
 * una regresión: es la señal de que el hallazgo se cerró. El procedimiento es
 * borrar la prueba de este archivo y mover la verificación correcta al archivo
 * que le corresponde (el comentario de cada prueba dice cuál).
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  eigenvaluesQR, tensors, cofactorMatrix, adjugate, Matrix, DimensionError,
} from '../../shared/math/index.js';

import { assertTrue, assertClose, assertVectorClose, assertThrows } from '../assert.js';

export const tests = [
  {
    name: 'H-03 · eigenvaluesQR devuelve ceros cuando los autovalores son ±λ',
    fn: () => {
      // QUÉ DEBERÍA DAR: [50, -50]. La matriz [[0,50],[50,0]] es simétrica, y
      // toda matriz simétrica real tiene autovalores reales (teorema
      // espectral). Sus autovalores son exactamente ±50.
      //
      // QUÉ DA: [0, 0], con hasComplexHint = true.
      //
      // CAUSA: la iteración QR sin desplazamiento (shift) no converge cuando
      // dos autovalores tienen el mismo módulo. El bloque 2x2 que queda sin
      // reducir se interpreta como un par complejo conjugado, y de ahí salen
      // los ceros y el hint. El caso diagonal [[2,0],[0,-2]] sí funciona,
      // porque ya está convergido de entrada: el defecto aparece solo con
      // elementos fuera de la diagonal.
      //
      // DÓNDE: shared/math/algebra/eigen.js — pertenece al Chat 2.
      //
      // AL CERRARSE: mover a algebra-eigen.test.js como caso normal.
      const salida = eigenvaluesQR(new Matrix([[0, 50], [50, 0]]));
      assertVectorClose(salida.values, [0, 0], 'Comportamiento actual (incorrecto).');
      assertTrue(salida.hasComplexHint, 'Marca complejos donde los autovalores son reales.');
    },
  },
  {
    name: 'H-03 · hasComplexHint da falso positivo en matrices simétricas',
    fn: () => {
      // Consecuencia del mismo defecto, anotada aparte porque afecta a quien
      // use el hint para decidir si puede confiar en el resultado: una
      // calculadora que muestre "puede haber autovalores complejos" ante una
      // matriz simétrica está dando una explicación falsa de un error real.
      //
      // AL CERRARSE: la contraprueba correcta es que hasComplexHint sea false
      // para toda matriz simétrica, y va en algebra-eigen.test.js.
      const simetrica = eigenvaluesQR(new Matrix([[0, 1], [1, 0]]));
      assertTrue(
        simetrica.hasComplexHint,
        'Hoy marca complejos en una simétrica; debería ser false para toda simétrica.',
      );
    },
  },
  {
    name: 'H-04 · vonMisesStress devuelve 0 en corte puro',
    fn: () => {
      // QUÉ DEBERÍA DAR: √3 · τ = 86.6025… para τ = 50. Es el resultado de
      // libro para un estado de corte puro, y es el que usa todo criterio de
      // falla de Von Mises.
      //
      // QUÉ DA: 0, es decir "material sin solicitación". Sin excepción y sin
      // aviso: el número se muestra como si fuera correcto.
      //
      // CAUSA: es H-03 propagado. vonMisesStress se apoya en principalValues,
      // que se apoya en eigenvaluesQR; el tensor de corte puro es justamente
      // una matriz simétrica de autovalores ±τ. Al fallar el cálculo de
      // autovalores, la fórmula recibe ceros y devuelve cero.
      //
      // GRAVEDAD: la más alta de la suite. Un resultado equivocado que además
      // subestima la solicitación es peor que una excepción, y el estado de
      // corte puro no es un caso raro de laboratorio: es el de un eje a
      // torsión o un bulón trabajando al corte.
      //
      // DÓNDE: el síntoma está en shared/math/physics/tensors.js, pero la
      // causa está en shared/math/algebra/eigen.js. Se arregla en eigen.js.
      //
      // AL CERRARSE: mover a physics.test.js, junto a los otros casos de
      // vonMisesStress, donde ya quedó anotado el hueco.
      assertClose(
        tensors.vonMisesStress(new Matrix([[0, 50], [50, 0]])),
        0,
        'Comportamiento actual (incorrecto): debería ser 86.6025…',
      );
      assertClose(
        tensors.vonMisesStress(new Matrix([[0, 50, 0], [50, 0, 0], [0, 0, 0]])),
        0,
        'Lo mismo en la versión 3x3 del mismo estado de tensión.',
      );
    },
  },
  {
    name: 'H-05 · cofactorMatrix y adjugate se rompen con una matriz 1x1',
    fn: () => {
      // QUÉ DEBERÍA DAR: [[1]] en ambos casos. Por convención, el menor de una
      // matriz 1x1 es la matriz vacía, cuyo determinante es 1, así que el
      // único cofactor vale (+1)·1 = 1 y la adjunta de [[a]] es [[1]]. Con eso,
      // la fórmula adj(A)/det(A) devuelve [[1/a]], que es la inversa correcta.
      //
      // QUÉ DA: DimensionError con el mensaje "el parámetro data debe ser un
      // arreglo rectangular", que además de estar mal es incomprensible para
      // quien cargó un número en una calculadora.
      //
      // CAUSA: Matrix.minor(0, 0) sobre una 1x1 arma [] e intenta construir
      // una Matrix vacía, que el constructor rechaza (con razón). El caso base
      // no está contemplado en inverse.js.
      //
      // ALCANCE: inverse() y conditionNumber() sí manejan bien la 1x1 — usan
      // Gauss-Jordan, no cofactores —, así que el defecto se limita a las dos
      // funciones que pasan por menores.
      //
      // DÓNDE: shared/math/algebra/inverse.js (con Matrix.minor como causa
      // inmediata). Pertenece al Chat 2.
      //
      // AL CERRARSE: mover a algebra-determinant.test.js como caso límite, y
      // sacar el filtro de la 1x1 en cross-checks.test.js.
      const unaPorUna = new Matrix([[7]]);
      assertThrows(
        () => cofactorMatrix(unaPorUna),
        DimensionError,
        'DIMENSION_ERROR',
        'Comportamiento actual (incorrecto): debería devolver [[1]].',
      );
      assertThrows(
        () => adjugate(unaPorUna),
        DimensionError,
        'DIMENSION_ERROR',
        'Comportamiento actual (incorrecto): debería devolver [[1]].',
      );
    },
  },
];
