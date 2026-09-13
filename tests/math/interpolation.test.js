/**
 * tests/math/interpolation.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/interpolation/: linearInterpolate, piecewiseLinear,
 * lagrangeInterpolate, lagrangeBasis y cubicSplineInterpolate.
 *
 * Este módulo tiene un peso particular en el roadmap: la futura calculadora
 * ISA no va a implementar interpolación propia, va a usar exactamente estas
 * funciones (ENGINEERING_GUIDE.md §13). Por eso se prueba con datos con forma
 * de tabla atmosférica además de con los casos matemáticos puros.
 *
 * El caso límite más importante es la extrapolación: por defecto está
 * prohibida y debe lanzar. Una tabla de datos físicos evaluada fuera de su
 * dominio no da un número "un poco impreciso", da un número sin sentido
 * físico, y es mejor que la calculadora lo diga.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  linearInterpolate, piecewiseLinear, lagrangeInterpolate, lagrangeBasis,
  cubicSplineInterpolate, InterpolationError,
} from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertVectorClose, assertThrows,
} from '../assert.js';

/** Tabla tipo ISA: altitud en metros contra temperatura en °C. */
const ALTITUDES = [0, 1000, 2000, 3000];
const TEMPERATURAS = [15, 8.5, 2, -4.5];

export const tests = [
  /* --------------------------- linearInterpolate --------------------------- */
  {
    name: 'linearInterpolate reproduce valores calculables a mano',
    fn: () => {
      assertClose(linearInterpolate(0, 0, 10, 100, 4), 40, 'Recta por el origen.');
      assertClose(linearInterpolate(0, 0, 10, 100, 0), 0, 'En el extremo izquierdo.');
      assertClose(linearInterpolate(0, 0, 10, 100, 10), 100, 'En el extremo derecho.');
      assertClose(linearInterpolate(1, 5, 3, 9, 2), 7, 'Punto medio.');
      assertClose(linearInterpolate(0, 15, 1000, 8.5, 500), 11.75, 'Primer tramo de la tabla ISA.');
    },
  },
  {
    name: 'linearInterpolate extrapola sin quejarse, por diseño',
    fn: () => {
      // A diferencia de piecewiseLinear, esta función recibe DOS puntos
      // explícitos: es la ecuación de una recta, y una recta está definida en
      // todo R. La decisión de restringir el dominio es de piecewiseLinear.
      assertClose(linearInterpolate(0, 0, 10, 100, 20), 200, 'Más allá del segundo punto.');
      assertClose(linearInterpolate(0, 0, 10, 100, -5), -50, 'Antes del primer punto.');
    },
  },
  {
    name: 'linearInterpolate con pendiente nula devuelve el valor constante',
    fn: () => {
      assertClose(linearInterpolate(0, 7, 10, 7, 3.3), 7, 'Recta horizontal.');
    },
  },
  {
    name: 'linearInterpolate lanza si los dos x son iguales',
    fn: () => {
      assertThrows(
        () => linearInterpolate(5, 1, 5, 9, 5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Dos puntos con el mismo x no definen una recta.',
      );
    },
  },

  /* ---------------------------- piecewiseLinear ---------------------------- */
  {
    name: 'piecewiseLinear interpola dentro de la tabla',
    fn: () => {
      assertClose(piecewiseLinear(ALTITUDES, TEMPERATURAS, 500), 11.75, 'Mitad del primer tramo.');
      assertClose(piecewiseLinear(ALTITUDES, TEMPERATURAS, 1500), 5.25, 'Mitad del segundo tramo.');
      assertClose(piecewiseLinear(ALTITUDES, TEMPERATURAS, 2500), -1.25, 'Mitad del tercer tramo.');
    },
  },
  {
    name: 'piecewiseLinear devuelve el valor exacto en los nodos',
    fn: () => {
      ALTITUDES.forEach((x, i) => {
        assertClose(piecewiseLinear(ALTITUDES, TEMPERATURAS, x), TEMPERATURAS[i], `Nodo x = ${x}.`);
      });
    },
  },
  {
    name: 'piecewiseLinear ordena internamente los puntos desordenados',
    fn: () => {
      const xs = [2000, 0, 1000];
      const ys = [2, 15, 8.5];
      assertClose(piecewiseLinear(xs, ys, 500), 11.75, 'Mismo resultado con la tabla desordenada.');
    },
  },
  {
    name: 'piecewiseLinear prohíbe la extrapolación por defecto',
    fn: () => {
      assertThrows(
        () => piecewiseLinear(ALTITUDES, TEMPERATURAS, 5000),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Por encima del dominio.',
      );
      assertThrows(
        () => piecewiseLinear(ALTITUDES, TEMPERATURAS, -100),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Por debajo del dominio.',
      );
    },
  },
  {
    name: 'piecewiseLinear extrapola solo si se lo pide explícitamente',
    fn: () => {
      const valor = piecewiseLinear(ALTITUDES, TEMPERATURAS, 4000, { allowExtrapolation: true });
      // Prolongando el último tramo: −4.5 + (−6.5) = −11
      assertClose(valor, -11, 'Extrapolación del último tramo.');
    },
  },
  {
    name: 'piecewiseLinear valida la tabla de entrada',
    fn: () => {
      assertThrows(
        () => piecewiseLinear([0, 1], [1], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'xs e ys de largos distintos.',
      );
      assertThrows(
        () => piecewiseLinear([0], [1], 0),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Un solo punto no alcanza.',
      );
      assertThrows(
        () => piecewiseLinear([0, 0, 1], [1, 2, 3], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'x duplicados.',
      );
    },
  },

  /* --------------------------- lagrangeInterpolate --------------------------- */
  {
    name: 'lagrangeInterpolate reproduce el valor conocido de API.md',
    fn: () => {
      assertClose(lagrangeInterpolate([0, 1, 2], [1, 3, 7], 1.5).value, 4.75, 'Ejemplo documentado.');
    },
  },
  {
    name: 'lagrangeInterpolate pasa exactamente por todos los puntos dados',
    fn: () => {
      // Es la propiedad que define al polinomio de Lagrange: si falla acá, no
      // es interpolación, es otra cosa.
      const xs = [-1, 0, 2, 5];
      const ys = [3, 1, 7, -2];
      xs.forEach((x, i) => {
        assertClose(lagrangeInterpolate(xs, ys, x).value, ys[i], `Debe pasar por el punto ${i}.`);
      });
    },
  },
  {
    name: 'lagrangeInterpolate reproduce exactamente un polinomio de grado 2',
    fn: () => {
      // f(x) = x² − 2x + 3, muestreada en tres puntos: el polinomio
      // interpolante debe ser ese mismo polinomio.
      const f = (x) => x * x - 2 * x + 3;
      const xs = [0, 1, 4];
      const ys = xs.map(f);
      [2, 2.5, 3.7, -1].forEach((x) => {
        assertClose(lagrangeInterpolate(xs, ys, x).value, f(x), `Reconstrucción en x = ${x}.`);
      });
    },
  },
  {
    name: 'lagrangeInterpolate devuelve el desglose de términos',
    fn: () => {
      const { terms } = lagrangeInterpolate([0, 1, 2], [1, 3, 7], 1.5);
      assertEqual(terms.length, 3, 'Un término por punto.');
      terms.forEach((t, i) => {
        assertTrue(typeof t.weight === 'number', `El término ${i} debería traer su peso.`);
        assertTrue(typeof t.contribution === 'number', `Y su contribución.`);
      });
      const suma = terms.reduce((acc, t) => acc + t.contribution, 0);
      assertClose(suma, 4.75, 'Las contribuciones deberían sumar el valor final.');
    },
  },
  {
    name: 'lagrangeInterpolate valida los puntos de entrada',
    fn: () => {
      assertThrows(
        () => lagrangeInterpolate([1], [2], 1),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Un solo punto.',
      );
      assertThrows(
        () => lagrangeInterpolate([0, 1], [2], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Largos distintos.',
      );
      assertThrows(
        () => lagrangeInterpolate([1, 1], [2, 3], 1),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'x duplicados: hay división por cero en la base.',
      );
    },
  },

  /* ------------------------------ lagrangeBasis ------------------------------ */
  {
    name: 'lagrangeBasis vale 1 en su propio nodo y 0 en los demás',
    fn: () => {
      // Propiedad de delta de Kronecker: Lᵢ(xⱼ) = 1 si i = j, 0 si no.
      const xs = [0, 1, 2];
      xs.forEach((_, i) => {
        xs.forEach((xj, j) => {
          assertClose(
            lagrangeBasis(xs, i, xj),
            i === j ? 1 : 0,
            `L${i}(x${j}) debería valer ${i === j ? 1 : 0}.`,
          );
        });
      });
    },
  },
  {
    name: 'las bases de Lagrange suman 1 en cualquier punto',
    fn: () => {
      // Partición de la unidad: Σ Lᵢ(x) = 1 para todo x.
      const xs = [0, 1, 2, 5];
      [0.3, 1.7, 4.2, -2].forEach((x) => {
        const suma = xs.reduce((acc, _, i) => acc + lagrangeBasis(xs, i, x), 0);
        assertClose(suma, 1, `Las bases deberían sumar 1 en x = ${x}.`);
      });
    },
  },

  /* -------------------------- cubicSplineInterpolate -------------------------- */
  {
    name: 'cubicSplineInterpolate pasa por todos los nodos',
    fn: () => {
      const xs = [0, 1, 2, 3];
      const ys = [0, 1, 0, 1];
      xs.forEach((x, i) => {
        assertClose(cubicSplineInterpolate(xs, ys, x).value, ys[i], `Nodo x = ${x}.`);
      });
    },
  },
  {
    name: 'el spline natural tiene segunda derivada nula en los extremos',
    fn: () => {
      // Es lo que define a un spline "natural": si los extremos no son cero,
      // es otro tipo de spline y la documentación estaría mintiendo.
      const { secondDerivatives } = cubicSplineInterpolate([0, 1, 2, 3], [0, 1, 0, 1], 1.5);
      assertClose(secondDerivatives[0], 0, 'Segunda derivada en el primer nodo.');
      assertClose(
        secondDerivatives[secondDerivatives.length - 1],
        0,
        'Segunda derivada en el último nodo.',
      );
    },
  },
  {
    name: 'el spline reproduce exactamente una recta',
    fn: () => {
      // Un spline cúbico que interpola puntos colineales debe dar la recta:
      // los coeficientes cúbico y cuadrático tienen que anularse solos.
      const xs = [0, 1, 2, 3, 4];
      const ys = xs.map((x) => 2 * x + 1);
      [0.5, 1.7, 3.2].forEach((x) => {
        assertClose(cubicSplineInterpolate(xs, ys, x).value, 2 * x + 1, `Recta en x = ${x}.`);
      });
    },
  },
  {
    name: 'cubicSplineInterpolate informa en qué segmento cayó la evaluación',
    fn: () => {
      const xs = [0, 1, 2, 3];
      const ys = [0, 1, 0, 1];
      assertEqual(cubicSplineInterpolate(xs, ys, 0.5).segmentIndex, 0, 'Primer segmento.');
      assertEqual(cubicSplineInterpolate(xs, ys, 1.5).segmentIndex, 1, 'Segundo segmento.');
      assertEqual(cubicSplineInterpolate(xs, ys, 2.5).segmentIndex, 2, 'Tercer segmento.');
    },
  },
  {
    name: 'cubicSplineInterpolate exige al menos 3 puntos y xs creciente',
    fn: () => {
      assertThrows(
        () => cubicSplineInterpolate([0, 1], [0, 1], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Dos puntos no alcanzan para un spline cúbico.',
      );
      assertThrows(
        () => cubicSplineInterpolate([0, 2, 1], [0, 1, 2], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'xs no estrictamente creciente.',
      );
      assertThrows(
        () => cubicSplineInterpolate([0, 1, 1], [0, 1, 2], 0.5),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'xs con un valor repetido.',
      );
    },
  },
  {
    name: 'cubicSplineInterpolate prohíbe la extrapolación por defecto',
    fn: () => {
      const xs = [0, 1, 2, 3];
      const ys = [0, 1, 0, 1];
      assertThrows(
        () => cubicSplineInterpolate(xs, ys, 4),
        InterpolationError,
        'INTERPOLATION_ERROR',
        'Fuera del dominio.',
      );
      const valor = cubicSplineInterpolate(xs, ys, 4, { allowExtrapolation: true }).value;
      assertTrue(Number.isFinite(valor), 'Con allowExtrapolation debería devolver un número finito.');
    },
  },
  {
    name: 'el spline es continuo en los nodos interiores',
    fn: () => {
      // Se evalúa a ambos lados de un nodo: la diferencia debería ser del
      // orden del paso, no un salto.
      const xs = [0, 1, 2, 3];
      const ys = [0, 2, 1, 4];
      const izquierda = cubicSplineInterpolate(xs, ys, 1 - 1e-7).value;
      const derecha = cubicSplineInterpolate(xs, ys, 1 + 1e-7).value;
      assertClose(izquierda, derecha, 'Sin salto en el nodo interior.', 1e-5);
      assertVectorClose([izquierda], [derecha], 'Continuidad en x = 1.', 1e-5);
    },
  },
];
