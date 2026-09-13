/**
 * tests/math/physics.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/physics/: el namespace `vectors` (12 funciones) y el
 * namespace `tensors` (7 funciones).
 *
 * Estos dos módulos se exportan agrupados y no aplanados (ver la nota de
 * index.js), así que la prueba también verifica esa forma de acceso: si
 * mañana alguien los aplanara "para simplificar", chocarían nombres como
 * `add` o `sum` con el resto del motor y esta prueba lo mostraría.
 *
 * tensors reutiliza eigenvaluesQR para los valores principales, así que sus
 * tolerancias son las del algoritmo iterativo, no las del resto de la suite.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import { vectors, tensors, Matrix, DimensionError } from '../../shared/math/index.js';

import {
  assertTrue, assertEqual, assertClose, assertVectorClose,
  assertMatrixClose, assertThrows,
} from '../assert.js';

/** Tolerancia para lo que pasa por el algoritmo QR iterativo. */
const TOLERANCIA_ITERATIVA = 1e-6;

export const tests = [
  /* ------------------------- vectores: aritmética ------------------------- */
  {
    name: 'add, subtract y scale operan componente a componente',
    fn: () => {
      assertVectorClose(vectors.add([1, 2], [3, 4]), [4, 6], 'Suma 2D.');
      assertVectorClose(vectors.add([1, 2, 3], [-1, -2, -3]), [0, 0, 0], 'Suma que se cancela.');
      assertVectorClose(vectors.subtract([5, 5], [2, 3]), [3, 2], 'Resta.');
      assertVectorClose(vectors.scale([1, -2, 3], 2), [2, -4, 6], 'Escalado.');
      assertVectorClose(vectors.scale([1, 2], 0), [0, 0], 'Escalado por cero.');
    },
  },
  {
    name: 'sum acumula una lista de vectores',
    fn: () => {
      assertVectorClose(vectors.sum([[1, 0], [0, 1], [2, 2]]), [3, 3], 'Resultante de tres vectores.');
      assertVectorClose(vectors.sum([[5, -5]]), [5, -5], 'Un solo vector es su propia resultante.');
      assertVectorClose(vectors.sum([[1, 1], [-1, -1]]), [0, 0], 'Fuerzas en equilibrio.');
    },
  },
  {
    name: 'las operaciones de vectores no modifican sus operandos',
    fn: () => {
      const a = [1, 2];
      const b = [3, 4];
      vectors.add(a, b);
      vectors.subtract(a, b);
      vectors.scale(a, 10);
      assertVectorClose(a, [1, 2], 'El primer operando queda intacto.');
      assertVectorClose(b, [3, 4], 'El segundo también.');
    },
  },
  {
    name: 'add, subtract, sum y dot exigen longitudes compatibles',
    fn: () => {
      assertThrows(() => vectors.add([1, 2], [1]), DimensionError, 'DIMENSION_ERROR', 'Suma de largos distintos.');
      assertThrows(() => vectors.subtract([1], [1, 2]), DimensionError, 'DIMENSION_ERROR', 'Resta.');
      assertThrows(() => vectors.dot([1, 2], [1]), DimensionError, 'DIMENSION_ERROR', 'Producto escalar.');
      assertThrows(() => vectors.sum([]), DimensionError, 'DIMENSION_ERROR', 'Lista vacía.');
      assertThrows(
        () => vectors.sum([[1, 2], [1]]),
        DimensionError,
        'DIMENSION_ERROR',
        'Lista con vectores de largos distintos.',
      );
    },
  },

  /* ---------------------- vectores: productos y normas ---------------------- */
  {
    name: 'dot reproduce valores conocidos y detecta perpendicularidad',
    fn: () => {
      assertClose(vectors.dot([1, 2, 3], [4, 5, 6]), 32, '1·4 + 2·5 + 3·6.');
      assertClose(vectors.dot([1, 0], [0, 1]), 0, 'Vectores perpendiculares.');
      assertClose(vectors.dot([3, 4], [3, 4]), 25, 'a·a = |a|².');
    },
  },
  {
    name: 'cross reproduce la regla de la mano derecha',
    fn: () => {
      assertVectorClose(vectors.cross([1, 0, 0], [0, 1, 0]), [0, 0, 1], 'i × j = k.');
      assertVectorClose(vectors.cross([0, 1, 0], [0, 0, 1]), [1, 0, 0], 'j × k = i.');
      assertVectorClose(vectors.cross([0, 0, 1], [1, 0, 0]), [0, 1, 0], 'k × i = j.');
    },
  },
  {
    name: 'cross es anticonmutativo y se anula con vectores paralelos',
    fn: () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      assertVectorClose(vectors.cross(b, a), vectors.scale(vectors.cross(a, b), -1), 'b × a = −(a × b).');
      assertVectorClose(vectors.cross(a, a), [0, 0, 0], 'a × a = 0.');
      assertVectorClose(vectors.cross(a, vectors.scale(a, 3)), [0, 0, 0], 'Vectores paralelos.');
    },
  },
  {
    name: 'el producto vectorial es perpendicular a ambos factores',
    fn: () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      const c = vectors.cross(a, b);
      assertClose(vectors.dot(c, a), 0, '(a × b) · a = 0.');
      assertClose(vectors.dot(c, b), 0, '(a × b) · b = 0.');
    },
  },
  {
    name: 'cross solo está definido en 3D',
    fn: () => {
      assertThrows(() => vectors.cross([1, 2], [3, 4]), DimensionError, 'DIMENSION_ERROR', 'Vectores 2D.');
      assertThrows(
        () => vectors.cross([1, 2, 3, 4], [1, 2, 3, 4]),
        DimensionError,
        'DIMENSION_ERROR',
        'Vectores 4D.',
      );
    },
  },
  {
    name: 'magnitude reproduce las ternas pitagóricas',
    fn: () => {
      assertClose(vectors.magnitude([3, 4]), 5, 'Terna 3-4-5.');
      assertClose(vectors.magnitude([5, 12]), 13, 'Terna 5-12-13.');
      assertClose(vectors.magnitude([1, 2, 2]), 3, 'Terna 3D 1-2-2.');
      assertClose(vectors.magnitude([0, 0, 0]), 0, 'Vector nulo.');
      assertClose(vectors.magnitude([-3, -4]), 5, 'El signo no afecta la norma.');
    },
  },
  {
    name: 'normalize devuelve un vector de módulo 1 en la misma dirección',
    fn: () => {
      const u = vectors.normalize([3, 4]);
      assertVectorClose(u, [0.6, 0.8], 'Versor de [3, 4].');
      assertClose(vectors.magnitude(u), 1, 'Su módulo es 1.');
      assertClose(vectors.magnitude(vectors.normalize([1, 2, 3, 4])), 1, 'También en dimensión arbitraria.');
    },
  },
  {
    name: 'normalize lanza con el vector nulo',
    fn: () => {
      assertThrows(() => vectors.normalize([0, 0]), DimensionError, 'DIMENSION_ERROR', 'Vector nulo 2D.');
      assertThrows(() => vectors.normalize([0, 0, 0]), DimensionError, 'DIMENSION_ERROR', 'Vector nulo 3D.');
    },
  },
  {
    name: 'angleBetween devuelve radianes por defecto y grados si se pide',
    fn: () => {
      assertClose(vectors.angleBetween([1, 0], [0, 1]), Math.PI / 2, 'Perpendiculares, en radianes.');
      assertClose(vectors.angleBetween([1, 0], [0, 1], { inDegrees: true }), 90, 'Perpendiculares, en grados.');
      assertClose(vectors.angleBetween([1, 0], [1, 0]), 0, 'Vectores iguales.');
      assertClose(vectors.angleBetween([1, 0], [-1, 0], { inDegrees: true }), 180, 'Vectores opuestos.');
      assertClose(vectors.angleBetween([1, 0], [1, 1], { inDegrees: true }), 45, 'Cuarenta y cinco grados.');
    },
  },
  {
    name: 'angleBetween no se rompe por error de redondeo en los extremos',
    fn: () => {
      // El coseno del ángulo puede dar 1.0000000000000002 por redondeo, y
      // Math.acos de eso es NaN. Si esta prueba falla, el motor no está
      // acotando el argumento.
      const casi = [1, 1e-16];
      assertClose(vectors.angleBetween([1, 0], casi), 0, 'Vectores casi idénticos.', 1e-6);
      assertTrue(Number.isFinite(vectors.angleBetween([1, 0], [1, 0])), 'Vectores idénticos: no NaN.');
    },
  },
  {
    name: 'projection proyecta sobre la dirección del segundo vector',
    fn: () => {
      assertVectorClose(vectors.projection([3, 4], [1, 0]), [3, 0], 'Proyección sobre el eje x.');
      assertVectorClose(vectors.projection([3, 4], [0, 1]), [0, 4], 'Proyección sobre el eje y.');
      assertVectorClose(vectors.projection([1, 0], [0, 1]), [0, 0], 'Proyección de perpendiculares.');
      assertVectorClose(vectors.projection([2, 2], [5, 0]), [2, 0], 'La escala de b no afecta el resultado.');
      assertThrows(
        () => vectors.projection([1, 2], [0, 0]),
        DimensionError,
        'DIMENSION_ERROR',
        'No se puede proyectar sobre el vector nulo.',
      );
    },
  },
  {
    name: 'fromPolar y toPolar son inversas entre sí',
    fn: () => {
      assertVectorClose(vectors.fromPolar(1, 0), [1, 0], 'Módulo 1, ángulo 0.');
      assertVectorClose(vectors.fromPolar(2, Math.PI / 2), [0, 2], 'Módulo 2, ángulo 90°.');
      assertVectorClose(vectors.fromPolar(5, Math.PI), [-5, 0], 'Módulo 5, ángulo 180°.');

      const { magnitude, angleRad } = vectors.toPolar([3, 4]);
      assertClose(magnitude, 5, 'Módulo de [3, 4].');
      assertClose(angleRad, Math.atan2(4, 3), 'Ángulo de [3, 4].');
      assertVectorClose(vectors.fromPolar(magnitude, angleRad), [3, 4], 'Ida y vuelta.');
    },
  },
  {
    name: 'toPolar exige un vector 2D',
    fn: () => {
      assertThrows(() => vectors.toPolar([1, 2, 3]), DimensionError, 'DIMENSION_ERROR', 'Vector 3D.');
      assertThrows(() => vectors.toPolar([1]), DimensionError, 'DIMENSION_ERROR', 'Vector 1D.');
    },
  },

  /* -------------------------------- tensores -------------------------------- */
  {
    name: 'symmetricPart y antisymmetricPart descomponen el tensor',
    fn: () => {
      // Todo tensor es la suma de su parte simétrica y su parte antisimétrica.
      const t = new Matrix([[1, 2], [4, 3]]);
      const s = tensors.symmetricPart(t);
      const a = tensors.antisymmetricPart(t);
      assertMatrixClose(s, [[1, 3], [3, 3]], 'Parte simétrica.');
      assertMatrixClose(a, [[0, -1], [1, 0]], 'Parte antisimétrica.');
      assertMatrixClose(s.add(a), t.toArray(), 'S + A debería reconstruir el tensor.');
    },
  },
  {
    name: 'la parte simétrica es simétrica y la antisimétrica tiene diagonal nula',
    fn: () => {
      const t = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
      assertTrue(tensors.symmetricPart(t).isSymmetric(1e-9), 'S = Sᵀ.');
      const a = tensors.antisymmetricPart(t);
      for (let i = 0; i < a.rows; i += 1) {
        assertClose(a.get(i, i), 0, `La diagonal de la parte antisimétrica debería ser nula en (${i},${i}).`);
      }
    },
  },
  {
    name: 'doubleContraction suma el producto elemento a elemento',
    fn: () => {
      assertClose(
        tensors.doubleContraction(new Matrix([[1, 2], [3, 4]]), new Matrix([[1, 0], [0, 1]])),
        5,
        'Contracción con la identidad da la traza.',
      );
      assertClose(
        tensors.doubleContraction(new Matrix([[1, 2], [3, 4]]), new Matrix([[1, 2], [3, 4]])),
        30,
        '1 + 4 + 9 + 16.',
      );
      assertThrows(
        () => tensors.doubleContraction(new Matrix([[1, 2]]), new Matrix([[1], [2]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Dimensiones incompatibles.',
      );
    },
  },
  {
    name: 'meanValue es la traza dividida por la dimensión',
    fn: () => {
      assertClose(tensors.meanValue(new Matrix([[3, 0], [0, 5]])), 4, 'Promedio de 3 y 5.');
      assertClose(tensors.meanValue(Matrix.identity(3)), 1, 'Tensión hidrostática de la identidad.');
      assertClose(
        tensors.meanValue(new Matrix([[-100, 0, 0], [0, -100, 0], [0, 0, -100]])),
        -100,
        'Estado de compresión uniforme.',
      );
    },
  },
  {
    name: 'principalValues coincide con los autovalores del tensor',
    fn: () => {
      const valores = tensors.principalValues(new Matrix([[3, 0], [0, 5]]));
      const ordenados = [...valores].sort((x, y) => x - y);
      assertVectorClose(ordenados, [3, 5], 'Tensiones principales de un tensor diagonal.', TOLERANCIA_ITERATIVA);
    },
  },
  {
    name: 'principalDirections empareja cada valor con su dirección',
    fn: () => {
      const pares = tensors.principalDirections(new Matrix([[3, 0], [0, 5]]));
      assertEqual(pares.length, 2, 'Una dirección por valor principal.');
      pares.forEach(({ value, direction }) => {
        assertTrue(typeof value === 'number', 'Cada par debería traer su valor.');
        assertTrue(Array.isArray(direction) || direction === null, 'Y su dirección (o null).');
      });
    },
  },
  {
    name: 'vonMisesStress reproduce casos conocidos de resistencia de materiales',
    fn: () => {
      // Tracción uniaxial pura: la tensión equivalente es la propia tensión.
      assertClose(tensors.vonMisesStress(new Matrix([[100, 0], [0, 0]])), 100, 'Tracción uniaxial 2x2.');
      assertClose(
        tensors.vonMisesStress(new Matrix([[100, 0, 0], [0, 0, 0], [0, 0, 0]])),
        100,
        'Tracción uniaxial 3x3.',
      );
      // Estado hidrostático puro: von Mises es cero, porque no hay distorsión.
      assertClose(
        tensors.vonMisesStress(new Matrix([[50, 0, 0], [0, 50, 0], [0, 0, 50]])),
        0,
        'Estado hidrostático: sin tensión equivalente.',
      );
      // Corte puro: σ_vm = √3·τ. Era el hallazgo H-04 —devolvía 0, es decir
      // "material sin solicitación"— y se cerró al corregir el cálculo de
      // autovalores en algebra/eigen.js (ADR-004). Es el caso de un eje a
      // torsión o un bulón trabajando al corte, así que se prueba con la
      // fórmula de libro y no con un número copiado de la salida.
      assertClose(
        tensors.vonMisesStress(new Matrix([[0, 50], [50, 0]])),
        Math.sqrt(3) * 50,
        'Corte puro 2x2: √3·τ.',
      );
      assertClose(
        tensors.vonMisesStress(new Matrix([[0, 50, 0], [50, 0, 0], [0, 0, 0]])),
        Math.sqrt(3) * 50,
        'Corte puro 3x3: el mismo estado de tensión da el mismo resultado.',
      );
    },
  },
  {
    name: 'principalValues del tensor de corte puro son +τ, 0 y −τ',
    fn: () => {
      // La causa de H-04, verificada directamente: si estos tres valores
      // vuelven a dar cero, vonMisesStress vuelve a mentir.
      const principales = tensors.principalValues(
        new Matrix([[0, 100, 0], [100, 0, 0], [0, 0, 0]]),
      );
      assertClose(principales[0], 100, 'Tensión principal máxima.', 1e-6);
      assertClose(principales[1], 0, 'Tensión principal intermedia.', 1e-6);
      assertClose(principales[2], -100, 'Tensión principal mínima.', 1e-6);
    },
  },
  {
    name: 'vonMisesStress acepta 2x2 y 3x3 y rechaza el resto',
    fn: () => {
      assertThrows(
        () => tensors.vonMisesStress(Matrix.identity(4)),
        DimensionError,
        'DIMENSION_ERROR',
        'Tensor 4x4.',
      );
      assertThrows(
        () => tensors.vonMisesStress(new Matrix([[1]])),
        DimensionError,
        'DIMENSION_ERROR',
        'Tensor 1x1.',
      );
    },
  },
  {
    name: 'las funciones de tensores exigen tensores cuadrados',
    fn: () => {
      const rect = new Matrix([[1, 2, 3], [4, 5, 6]]);
      assertThrows(() => tensors.symmetricPart(rect), DimensionError, 'DIMENSION_ERROR', 'Parte simétrica.');
      assertThrows(() => tensors.meanValue(rect), DimensionError, 'DIMENSION_ERROR', 'Valor medio.');
    },
  },
];
