/**
 * tests/math/numerical.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/numerical/: newtonRaphson, bisection, secant,
 * trapezoidal y simpson.
 *
 * Decisión de diseño que se verifica acá y que conviene no perder: los tres
 * métodos de raíces LANZAN MathError('CONVERGENCE_FAILURE') si no convergen,
 * en vez de devolver la última estimación (docs/Algorithms.md). Devolver un
 * número que "quedó cerca" es peor que fallar: la calculadora lo muestra como
 * si fuera la raíz y nadie se entera. Las pruebas de no convergencia son, por
 * eso, tan importantes como las de convergencia.
 *
 * Todas las funciones de prueba tienen raíz o integral conocida en forma
 * cerrada, para poder comparar contra el valor exacto y no contra otra
 * aproximación.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  newtonRaphson, bisection, secant, trapezoidal, simpson, MathError,
} from '../../shared/math/index.js';

import { assertTrue, assertEqual, assertClose, assertThrows } from '../assert.js';

/** f(x) = x² − 2, con raíz positiva √2. */
const CUADRATICA = (x) => x * x - 2;
/** Derivada analítica de CUADRATICA. */
const CUADRATICA_PRIMA = (x) => 2 * x;

export const tests = [
  /* ----------------------------- newtonRaphson ----------------------------- */
  {
    name: 'newtonRaphson encuentra √2 con derivada analítica',
    fn: () => {
      const { root } = newtonRaphson(CUADRATICA, 1, { fPrime: CUADRATICA_PRIMA });
      assertClose(root, Math.SQRT2, 'Raíz de x² − 2.');
    },
  },
  {
    name: 'newtonRaphson encuentra √2 sin derivada, por diferencias finitas',
    fn: () => {
      // La derivada numérica pierde precisión: se compara con una tolerancia
      // acorde al paso h por defecto (1e-6), no con la tolerancia general.
      const { root } = newtonRaphson(CUADRATICA, 1);
      assertClose(root, Math.SQRT2, 'Raíz con derivada aproximada.', 1e-8);
    },
  },
  {
    name: 'newtonRaphson converge sobre funciones trascendentes conocidas',
    fn: () => {
      const cero = newtonRaphson(Math.sin, 3, { fPrime: Math.cos }).root;
      assertClose(cero, Math.PI, 'sin(x) = 0 cerca de 3 es π.');

      const lambert = newtonRaphson((x) => Math.exp(x) - 2, 0, { fPrime: Math.exp }).root;
      assertClose(lambert, Math.LN2, 'eˣ = 2 en x = ln 2.');
    },
  },
  {
    name: 'newtonRaphson devuelve la raíz exacta si x0 ya es raíz',
    fn: () => {
      const { root, iterations } = newtonRaphson(CUADRATICA, Math.SQRT2, { fPrime: CUADRATICA_PRIMA });
      assertClose(root, Math.SQRT2, 'La raíz no se mueve.');
      assertTrue(iterations >= 0, 'El conteo de iteraciones debería ser válido.');
    },
  },
  {
    name: 'newtonRaphson registra el historial de iteraciones',
    fn: () => {
      const { history, iterations } = newtonRaphson(CUADRATICA, 1, { fPrime: CUADRATICA_PRIMA });
      assertTrue(Array.isArray(history) && history.length > 0, 'Debería haber historial.');
      // `iterations` es la cantidad de PASOS dados, y el historial incluye
      // además la evaluación del punto inicial: de ahí el +1. Se fija acá para
      // que un cambio en ese criterio no pase inadvertido.
      assertEqual(history.length, iterations + 1, 'Una entrada por paso, más la del punto inicial.');
      history.forEach((paso, i) => {
        assertTrue(typeof paso.x === 'number', `La iteración ${i} debería registrar x.`);
        assertTrue(typeof paso.fx === 'number', `Y f(x).`);
      });
    },
  },
  {
    name: 'newtonRaphson lanza ZERO_DERIVATIVE en un extremo de la función',
    fn: () => {
      // f(x) = x² + 1 tiene derivada nula en x = 0 y ahí vale 1, no 0: la
      // tangente es horizontal y el método no tiene hacia dónde ir. (Con
      // f(x) = x² el punto x = 0 ES la raíz y la función retorna antes de
      // mirar la derivada, que es el comportamiento correcto.)
      assertThrows(
        () => newtonRaphson((x) => x * x + 1, 0, { fPrime: (x) => 2 * x }),
        MathError,
        'ZERO_DERIVATIVE',
        'Derivada nula en el punto inicial.',
      );
    },
  },
  {
    name: 'newtonRaphson lanza CONVERGENCE_FAILURE en vez de devolver una estimación mala',
    fn: () => {
      // Con una sola iteración permitida es imposible alcanzar la tolerancia.
      const error = assertThrows(
        () => newtonRaphson(CUADRATICA, 1, { fPrime: CUADRATICA_PRIMA, maxIterations: 1 }),
        MathError,
        'CONVERGENCE_FAILURE',
        'Iteraciones insuficientes.',
      );
      assertTrue(
        Array.isArray(error.context.history),
        'El error debería incluir el historial completo, para poder diagnosticar.',
      );
    },
  },
  {
    name: 'newtonRaphson valida f y x0',
    fn: () => {
      assertThrows(() => newtonRaphson('no soy función', 1), MathError, 'NOT_A_FUNCTION', 'f no es función.');
      assertThrows(() => newtonRaphson(CUADRATICA, NaN), MathError, 'NOT_FINITE', 'x0 no finito.');
    },
  },

  /* ------------------------------- bisection ------------------------------- */
  {
    name: 'bisection encuentra √2 en un intervalo que la contiene',
    fn: () => {
      const { root } = bisection(CUADRATICA, 0, 2);
      assertClose(root, Math.SQRT2, 'Raíz de x² − 2 en [0, 2].');
    },
  },
  {
    name: 'bisection funciona con la raíz en un extremo del intervalo',
    fn: () => {
      const { root } = bisection((x) => x - 1, 1, 5);
      assertClose(root, 1, 'Raíz en el extremo izquierdo.');
    },
  },
  {
    name: 'bisection converge sobre una cúbica de raíz conocida',
    fn: () => {
      // x³ − x − 2 tiene una única raíz real ≈ 1.5213797068045676
      const { root } = bisection((x) => x ** 3 - x - 2, 1, 2);
      assertClose(root, 1.5213797068045676, 'Raíz real de x³ − x − 2.', 1e-9);
    },
  },
  {
    name: 'bisection exige que f(a) y f(b) tengan signos opuestos',
    fn: () => {
      assertThrows(
        () => bisection(CUADRATICA, 2, 3),
        MathError,
        'INVALID_INTERVAL',
        'Ambos extremos positivos: el teorema de Bolzano no aplica.',
      );
      assertThrows(
        () => bisection(CUADRATICA, -1, 1),
        MathError,
        'INVALID_INTERVAL',
        'Ambos extremos negativos.',
      );
    },
  },
  {
    name: 'bisection lanza CONVERGENCE_FAILURE si no le alcanzan las iteraciones',
    fn: () => {
      assertThrows(
        () => bisection(CUADRATICA, 0, 2, { maxIterations: 2 }),
        MathError,
        'CONVERGENCE_FAILURE',
        'Dos iteraciones no alcanzan para 1e-10.',
      );
    },
  },
  {
    name: 'bisection registra a, b y el punto medio en cada paso',
    fn: () => {
      const { history } = bisection(CUADRATICA, 0, 2);
      assertTrue(history.length > 0, 'Debería haber historial.');
      history.forEach((paso, i) => {
        assertTrue(paso.a <= paso.mid && paso.mid <= paso.b, `El paso ${i} debería tener mid dentro de [a, b].`);
      });
      // El intervalo se reduce a la mitad en cada paso: el último debe ser el
      // más chico de todos.
      const primero = history[0].b - history[0].a;
      const ultimo = history[history.length - 1].b - history[history.length - 1].a;
      assertTrue(ultimo < primero, 'El intervalo debería achicarse.');
    },
  },

  /* --------------------------------- secant --------------------------------- */
  {
    name: 'secant encuentra √2 partiendo de dos puntos',
    fn: () => {
      const { root } = secant(CUADRATICA, 1, 2);
      assertClose(root, Math.SQRT2, 'Raíz de x² − 2.');
    },
  },
  {
    name: 'secant resuelve una trascendente sin necesitar la derivada',
    fn: () => {
      const { root } = secant((x) => Math.cos(x) - x, 0, 1);
      assertClose(root, 0.7390851332151607, 'Punto fijo del coseno.', 1e-9);
    },
  },
  {
    name: 'secant lanza ZERO_DENOMINATOR si los dos puntos dan la misma imagen',
    fn: () => {
      // f(-1) = f(1) = -1 para x² − 2: la secante es horizontal.
      assertThrows(
        () => secant(CUADRATICA, -1, 1),
        MathError,
        'ZERO_DENOMINATOR',
        'f(x0) = f(x1): la secante no corta el eje.',
      );
    },
  },
  {
    name: 'secant lanza CONVERGENCE_FAILURE con iteraciones insuficientes',
    fn: () => {
      assertThrows(
        () => secant(CUADRATICA, 1, 2, { maxIterations: 1 }),
        MathError,
        'CONVERGENCE_FAILURE',
        'Una sola iteración.',
      );
    },
  },
  {
    name: 'los tres métodos coinciden en la misma raíz',
    fn: () => {
      // Verificación cruzada mínima dentro del módulo: tres caminos distintos
      // deben llegar al mismo número.
      const porNewton = newtonRaphson(CUADRATICA, 1, { fPrime: CUADRATICA_PRIMA }).root;
      const porBiseccion = bisection(CUADRATICA, 0, 2).root;
      const porSecante = secant(CUADRATICA, 1, 2).root;
      assertClose(porNewton, porBiseccion, 'Newton contra bisección.', 1e-8);
      assertClose(porBiseccion, porSecante, 'Bisección contra secante.', 1e-8);
    },
  },

  /* ------------------------------ integración ------------------------------ */
  {
    name: 'trapezoidal aproxima integrales de valor conocido',
    fn: () => {
      assertClose(trapezoidal((x) => x * x, 0, 1, 1000), 1 / 3, '∫₀¹ x² dx = 1/3.', 1e-6);
      assertClose(trapezoidal(Math.sin, 0, Math.PI, 1000), 2, '∫₀^π sin x dx = 2.', 1e-5);
    },
  },
  {
    name: 'trapezoidal es exacto con funciones lineales',
    fn: () => {
      // La regla del trapecio integra exactamente los polinomios de grado ≤ 1,
      // con cualquier cantidad de subintervalos.
      assertClose(trapezoidal((x) => 2 * x + 1, 0, 3, 1), 12, 'Un solo trapecio ya es exacto.');
      assertClose(trapezoidal((x) => 5, 0, 4, 2), 20, 'Función constante.');
    },
  },
  {
    name: 'simpson es exacto con polinomios de grado 3',
    fn: () => {
      // Propiedad conocida: Simpson 1/3 integra exactamente hasta grado 3.
      assertClose(simpson((x) => x * x, 0, 1, 2), 1 / 3, '∫₀¹ x² dx con 2 subintervalos.', 1e-12);
      assertClose(simpson((x) => x ** 3, 0, 2, 2), 4, '∫₀² x³ dx = 4.', 1e-12);
    },
  },
  {
    name: 'simpson converge mejor que trapezoidal con la misma cantidad de puntos',
    fn: () => {
      // Comparación relativa, no absoluta: si esto se invierte, algo cambió de
      // fondo en alguno de los dos métodos.
      const exacto = 2;
      const errorTrapecio = Math.abs(trapezoidal(Math.sin, 0, Math.PI, 10) - exacto);
      const errorSimpson = Math.abs(simpson(Math.sin, 0, Math.PI, 10) - exacto);
      assertTrue(errorSimpson < errorTrapecio, 'Simpson debería ser más preciso con n = 10.');
    },
  },
  {
    name: 'invertir los límites de integración invierte el signo',
    fn: () => {
      const directa = trapezoidal((x) => x * x, 0, 1, 100);
      const invertida = trapezoidal((x) => x * x, 1, 0, 100);
      assertClose(invertida, -directa, '∫ₐᵇ = −∫ᵇₐ.');
    },
  },
  {
    name: 'la integral sobre un intervalo degenerado es cero',
    fn: () => {
      assertClose(trapezoidal((x) => x * x, 2, 2, 10), 0, 'Trapecio con a = b.');
      assertClose(simpson((x) => x * x, 2, 2, 10), 0, 'Simpson con a = b.');
    },
  },
  {
    name: 'simpson exige n par',
    fn: () => {
      assertThrows(
        () => simpson((x) => x, 0, 1, 3),
        MathError,
        'INVALID_SUBINTERVALS',
        'Simpson 1/3 necesita subintervalos de a pares.',
      );
    },
  },
  {
    name: 'ambas reglas exigen n entero positivo',
    fn: () => {
      assertThrows(() => trapezoidal((x) => x, 0, 1, 0), MathError, 'NOT_POSITIVE', 'n = 0.');
      assertThrows(() => trapezoidal((x) => x, 0, 1, -5), MathError, 'NOT_POSITIVE', 'n negativo.');
      assertThrows(() => trapezoidal((x) => x, 0, 1, 2.5), MathError, 'NOT_INTEGER', 'n no entero.');
      assertThrows(() => simpson((x) => x, 0, 1, 2.5), MathError, 'NOT_INTEGER', 'n no entero en Simpson.');
    },
  },
];
