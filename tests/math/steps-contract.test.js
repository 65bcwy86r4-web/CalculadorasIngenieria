/**
 * tests/math/steps-contract.test.js
 * ---------------------------------------------------------------------------
 * PRUEBA DE CONTRATO DEL PROCEDIMIENTO (`steps`), según ADR-007 §3.6.
 *
 * Las demás pruebas del álgebra verifican que cada función calcule bien. Esta
 * verifica algo distinto y transversal: que **todas** devuelvan el
 * procedimiento con la misma forma, para que la interfaz pueda renderizar
 * cualquiera con un solo componente.
 *
 * Por qué es genérica y no una prueba por función: una prueba por función
 * verifica la función que alguien se acordó de probar. El problema que este
 * archivo evita es el de la función número trece —la que alguien agregue el
 * mes que viene— devolviendo un `Matrix` pelado o un `steps` sin `type`.
 * Recorriendo una tabla, agregar una función al motor sin agregarla acá es un
 * olvido que se nota al leer el archivo; devolver la forma equivocada, en
 * cambio, falla sola.
 *
 * LA REGLA QUE SE VERIFICA (ADR-007 §3.2): la interfaz tiene que poder
 * renderizar cualquier procedimiento usando SOLO `type` y `text`. Por eso los
 * dos son obligatorios y se exigen no vacíos, mientras que `snapshot` y
 * `detail` solo se validan si están presentes. Una prueba que exigiera
 * `snapshot` estaría congelando lo contrario de lo que el ADR decide.
 *
 * QUÉ NO VERIFICA: el contenido. En el Paso 2c-1 nueve de estas funciones
 * devuelven `steps: []` a propósito, y un arreglo vacío cumple el contrato.
 * Cuando el Paso 2c-2 los llene, esta prueba pasa a verificar cada paso nuevo
 * sin necesidad de tocarla.
 *
 * Autor: Chat 2 — Motor
 * Fecha de creación: 2026-09-13
 * Modificado: 2026-09-18 — Chat 2 (Paso 2c-2, parte A). Vocabulario a diez
 *   tipos según la enmienda de ADR-007 §3.3 (D17), y `esperaPasos` al día con
 *   las funciones que ya registran procedimiento.
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  rowEchelon, reducedRowEchelon, rank, solveSystem,
  determinantByGauss, determinantByCofactors,
  inverse, cofactorMatrix, adjugate, conditionNumber,
  luDecomposition, qrDecomposition, choleskyDecomposition,
  eigenvalues, eigenvaluesQR, jacobiEigenDecomposition, eigenvalues2x2,
  eigenvectors, diagonalize,
  Matrix,
} from '../../shared/math/index.js';

import { assertTrue, assertFalse, assertEqual } from '../assert.js';

/**
 * Vocabulario cerrado de `type`, transcrito de ADR-007 §3.3 **con su enmienda
 * del 2026-09-13**. Se transcribe y no se importa del motor a propósito: si el
 * motor exportara la lista, la prueba diría "el motor usa los tipos que el
 * motor declara", que no verifica nada. Contra una copia del ADR, detecta que
 * alguien inventó un tipo.
 *
 * Son diez y no trece: `unique`, `infinite` e `incompatible` nunca fueron
 * tipos de paso, sino el discriminante del retorno de `solveSystem` —que desde
 * la enmienda se llama `classification` justamente para que no se confundan—.
 * Mientras estuvieron acá, esta prueba habría aceptado sin chistar un paso con
 * `type: 'unique'`: el agujero estaba exactamente donde estaba la deuda (D17).
 */
const TIPOS_DE_PASO = [
  // Pasos de procedimiento
  'info', 'swap', 'scale', 'elim', 'expand', 'compute', 'normalize', 'rotate', 'iterate',
  // Paso de cierre
  'final',
];

/** Matrices de trabajo, elegidas para que cada función corra su camino normal. */
const A2 = new Matrix([[4, 7], [2, 6]]);
const A3 = new Matrix([[6, 1, 1], [4, -2, 5], [2, 8, 7]]);
const SIMETRICA = new Matrix([[2, 1], [1, 2]]);
const DEFINIDA_POSITIVA = new Matrix([[4, 2], [2, 3]]);
const NO_SIMETRICA_3X3 = new Matrix([[3, 7, 2], [0, 5, 9], [0, 0, -1]]);

/**
 * Del tamaño máximo que permite el selector de la calculadora (15x15). Está
 * acá para que la cota de legibilidad se pruebe contra el caso que la motivó,
 * y no solo contra matrices chicas donde nunca se dispara.
 */
const A15 = new Matrix(
  Array.from({ length: 15 }, (_, i) => Array.from({ length: 15 }, (_, j) => (i === j ? 17 : (i + j) % 4))),
);

/**
 * Todas las funciones alcanzadas por ADR-007, con una invocación válida cada
 * una. `esperaPasos` marca las que ya registran procedimiento hoy: para esas
 * se exige además que el arreglo no esté vacío, porque un `steps: []` ahí
 * sería una regresión silenciosa.
 */
const CASOS = [
  // Ya registraban procedimiento antes de ADR-007.
  { nombre: 'rowEchelon', ejecutar: () => rowEchelon(A3), esperaPasos: true },
  { nombre: 'reducedRowEchelon', ejecutar: () => reducedRowEchelon(A3), esperaPasos: true },
  { nombre: 'rank', ejecutar: () => rank(A3), esperaPasos: true },
  { nombre: 'solveSystem', ejecutar: () => solveSystem(new Matrix([[2, 1], [1, 3]]), [8, 13]), esperaPasos: true },
  { nombre: 'determinantByGauss', ejecutar: () => determinantByGauss(A3), esperaPasos: true },
  { nombre: 'inverse', ejecutar: () => inverse(A2), esperaPasos: true },
  { nombre: 'luDecomposition', ejecutar: () => luDecomposition(A3), esperaPasos: true },
  // Heredan los pasos de lo que calculan internamente (ADR-007, propagación).
  { nombre: 'conditionNumber', ejecutar: () => conditionNumber(A2), esperaPasos: true },
  // Con procedimiento escrito en el Paso 2c-2, parte A.
  { nombre: 'determinantByCofactors', ejecutar: () => determinantByCofactors(A3), esperaPasos: true },
  { nombre: 'cofactorMatrix', ejecutar: () => cofactorMatrix(A3), esperaPasos: true },
  { nombre: 'adjugate', ejecutar: () => adjugate(A3), esperaPasos: true },
  { nombre: 'cofactorMatrix 15x15', ejecutar: () => cofactorMatrix(A15), esperaPasos: true },
  // Todavía con steps: []; su contenido es el Paso 2c-2, parte B.
  { nombre: 'qrDecomposition', ejecutar: () => qrDecomposition(A3), esperaPasos: false },
  { nombre: 'choleskyDecomposition', ejecutar: () => choleskyDecomposition(DEFINIDA_POSITIVA), esperaPasos: false },
  { nombre: 'eigenvalues (jacobi)', ejecutar: () => eigenvalues(SIMETRICA), esperaPasos: false },
  { nombre: 'eigenvalues (2x2)', ejecutar: () => eigenvalues(new Matrix([[3, 2], [1, 4]])), esperaPasos: false },
  { nombre: 'eigenvalues (qr)', ejecutar: () => eigenvalues(NO_SIMETRICA_3X3), esperaPasos: false },
  { nombre: 'eigenvalues (trivial)', ejecutar: () => eigenvalues(new Matrix([[6]])), esperaPasos: false },
  { nombre: 'eigenvaluesQR', ejecutar: () => eigenvaluesQR(SIMETRICA), esperaPasos: false },
  { nombre: 'jacobiEigenDecomposition', ejecutar: () => jacobiEigenDecomposition(SIMETRICA), esperaPasos: false },
  { nombre: 'eigenvalues2x2', ejecutar: () => eigenvalues2x2(SIMETRICA), esperaPasos: false },
  { nombre: 'eigenvectors', ejecutar: () => eigenvectors(SIMETRICA, [3, 1]), esperaPasos: false },
  { nombre: 'diagonalize', ejecutar: () => diagonalize(SIMETRICA), esperaPasos: false },
];

/**
 * Verifica un paso suelto contra ADR-007 §3.2 y §3.3.
 * @param {Object} paso
 * @param {string} contexto - función y posición, para que la falla se ubique
 * @returns {void}
 */
function verificarPaso(paso, contexto) {
  assertTrue(
    paso !== null && typeof paso === 'object' && !Array.isArray(paso),
    `${contexto}: cada paso debería ser un objeto.`,
  );
  assertTrue(
    TIPOS_DE_PASO.includes(paso.type),
    `${contexto}: type '${paso.type}' está fuera del vocabulario cerrado de ADR-007 §3.3.`,
  );
  assertEqual(typeof paso.text, 'string', `${contexto}: text debería ser un string.`);
  assertTrue(paso.text.trim().length > 0, `${contexto}: text no debería estar vacío.`);

  if (paso.snapshot !== undefined) {
    assertTrue(Array.isArray(paso.snapshot), `${contexto}: snapshot debería ser un arreglo.`);
    assertTrue(paso.snapshot.length > 0, `${contexto}: snapshot no debería estar vacío.`);
    paso.snapshot.forEach((fila, f) => {
      assertTrue(Array.isArray(fila), `${contexto}: snapshot[${f}] debería ser un arreglo (2D).`);
      fila.forEach((valor, c) => {
        assertTrue(
          typeof valor === 'number' && Number.isFinite(valor),
          `${contexto}: snapshot[${f}][${c}] debería ser un número finito (es ${valor}).`,
        );
      });
    });
  }

  if (paso.detail !== undefined) {
    assertTrue(
      paso.detail !== null && typeof paso.detail === 'object',
      `${contexto}: detail, si está, debería ser un objeto.`,
    );
  }
}

export const tests = [
  {
    name: 'ninguna función del contrato devuelve un número, un arreglo ni una Matrix',
    fn: () => {
      // ADR-007 §3.1: el retorno completo es siempre un objeto plano, porque
      // ni un número ni una Matrix pueden llevar el procedimiento colgado sin
      // ensuciar la clase.
      CASOS.forEach(({ nombre, ejecutar }) => {
        const salida = ejecutar();
        assertEqual(typeof salida, 'object', `${nombre}: el retorno debería ser un objeto.`);
        assertTrue(salida !== null, `${nombre}: el retorno no debería ser null.`);
        assertFalse(Array.isArray(salida), `${nombre}: el retorno no debería ser un arreglo.`);
        assertFalse(salida instanceof Matrix, `${nombre}: el retorno no debería ser una Matrix.`);
      });
    },
  },
  {
    name: 'toda función del contrato devuelve steps, y siempre es un arreglo',
    fn: () => {
      // Nunca undefined: ADR-007 §3.1. Una interfaz que tenga que preguntar
      // "¿esta función trae steps?" antes de recorrerlos ya perdió.
      CASOS.forEach(({ nombre, ejecutar }) => {
        const { steps } = ejecutar();
        assertTrue(
          Array.isArray(steps),
          `${nombre}: steps debería ser un arreglo (es ${typeof steps}).`,
        );
      });
    },
  },
  {
    name: 'cada paso tiene un type del vocabulario cerrado y un text no vacío',
    fn: () => {
      CASOS.forEach(({ nombre, ejecutar }) => {
        ejecutar().steps.forEach((paso, i) => {
          verificarPaso(paso, `${nombre}, paso ${i + 1}`);
        });
      });
    },
  },
  {
    name: 'las funciones que ya registran procedimiento no devuelven steps vacío',
    fn: () => {
      // La contracara de permitir steps: [] en el Paso 2c-1. Sin esta prueba,
      // alguien podría vaciar los pasos de rowEchelon y el contrato lo
      // aceptaría, porque un arreglo vacío es válido.
      CASOS.filter(({ esperaPasos }) => esperaPasos).forEach(({ nombre, ejecutar }) => {
        const { steps } = ejecutar();
        assertTrue(steps.length > 0, `${nombre}: ya registraba pasos y ahora devuelve ninguno.`);
      });
    },
  },
  {
    name: 'todo snapshot es un arreglo bidimensional rectangular de finitos',
    fn: () => {
      // La forma de snapshot está en verificarPaso; acá se agrega lo que una
      // interfaz necesita para dibujar una tabla y no se puede verificar paso
      // a paso: que todas las filas midan lo mismo.
      CASOS.forEach(({ nombre, ejecutar }) => {
        ejecutar().steps.forEach((paso, i) => {
          if (paso.snapshot === undefined) return;
          const columnas = paso.snapshot[0].length;
          paso.snapshot.forEach((fila, f) => {
            assertEqual(
              fila.length,
              columnas,
              `${nombre}, paso ${i + 1}: snapshot[${f}] tiene ${fila.length} columnas y se esperaban ${columnas}.`,
            );
          });
        });
      });
    },
  },
  {
    name: 'los pasos son datos, no referencias vivas al estado interno',
    fn: () => {
      // Un snapshot es el estado DESPUÉS del paso (ADR-007 §3.2), así que
      // tiene que ser una copia. Si el motor devolviera la matriz de trabajo
      // por referencia, todos los snapshots mostrarían el estado final y el
      // procedimiento sería una animación de un solo cuadro.
      const { steps } = luDecomposition(A3);
      const conSnapshot = steps.filter((paso) => paso.snapshot !== undefined);
      assertTrue(conSnapshot.length >= 2, 'La LU de esta matriz debería dar al menos dos pasos.');
      const distintos = conSnapshot.some(
        (paso) => JSON.stringify(paso.snapshot) !== JSON.stringify(conSnapshot[0].snapshot),
      );
      assertTrue(distintos, 'Todos los snapshots son iguales: se está devolviendo una referencia viva.');
    },
  },
  {
    name: 'hay a lo sumo un paso final, y es el último',
    fn: () => {
      // Invariante que apareció al encadenar procedimientos en el Paso 2c-2:
      // cuando una función hereda los pasos de una auxiliar y agrega su propio
      // cierre, el `final` heredado deja de ser final. Sin degradarlo, el
      // procedimiento termina con dos o tres pasos marcados como conclusión y
      // la interfaz no puede distinguir cuál lo es.
      //
      // No está en ADR-007: es una consecuencia del contrato que conviene que
      // el Chat 1 evalúe incorporar. Mientras tanto, queda fijada acá.
      CASOS.forEach(({ nombre, ejecutar }) => {
        const { steps } = ejecutar();
        const finales = steps.filter((paso) => paso.type === 'final');
        assertTrue(finales.length <= 1, `${nombre}: ${finales.length} pasos de cierre; debería haber a lo sumo uno.`);
        if (finales.length === 1) {
          assertEqual(
            steps.indexOf(finales[0]),
            steps.length - 1,
            `${nombre}: el paso de cierre no es el último.`,
          );
        }
      });
    },
  },
  {
    name: 'ningún procedimiento se pasa de largo para el usuario',
    fn: () => {
      // Cota de legibilidad, no de corrección. `cofactorMatrix` emite n² pasos
      // y el selector de la calculadora llega a 15x15: sin cota serían 225
      // pasos con menores de 196 celdas, que no es un procedimiento sino un
      // volcado. Si una función nueva se pasa de acá, hay que acotarla antes
      // de que llegue a la interfaz.
      const LIMITE = 60;
      CASOS.forEach(({ nombre, ejecutar }) => {
        const { steps } = ejecutar();
        assertTrue(
          steps.length <= LIMITE,
          `${nombre}: ${steps.length} pasos, por encima del límite de ${LIMITE}.`,
        );
      });
    },
  },
  {
    name: 'el vocabulario de type no creció sin pasar por un ADR',
    fn: () => {
      // ADR-007 §3.3 lo declara cerrado y §5 dice que ampliarlo es decisión
      // del Chat 1. Fijar el tamaño hace que agregar uno por las dudas falle
      // acá, que es donde se quiere que falle.
      assertEqual(TIPOS_DE_PASO.length, 10, 'Cantidad de tipos del vocabulario cerrado.');
    },
  },
];
