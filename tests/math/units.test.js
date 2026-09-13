/**
 * tests/math/units.test.js
 * ---------------------------------------------------------------------------
 * Pruebas de shared/math/units/: los seis conversores por categoría, el
 * dispatcher convert(), categoryOf() y el catálogo unitsByCategory.
 *
 * Los valores de referencia son definiciones internacionales exactas, no
 * aproximaciones sacadas de otra implementación: 1 nmi = 1852 m y 1 atm =
 * 101325 Pa son definiciones por convenio; 1 in = 25.4 mm y 1 lb =
 * 0.45359237 kg son las definiciones de 1959 del sistema imperial; 1 kWh =
 * 3.6 MJ sale de la definición del watt. Comparar contra definiciones y no
 * contra "lo que da el motor hoy" es lo que hace que estas pruebas sirvan
 * para detectar un factor mal tipeado.
 *
 * La temperatura se prueba aparte del resto porque es la única conversión
 * afín (con desplazamiento de origen) y no meramente proporcional: es
 * exactamente el lugar donde un conversor genérico que multiplica por un
 * factor daría resultados desastrosos sin que nada lance.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

import {
  convert, convertDistance, convertPressure, convertTemperature,
  convertSpeed, convertMass, convertEnergy, categoryOf, unitsByCategory,
  MathError, DimensionError, STANDARD_PRESSURE,
} from '../../shared/math/index.js';

import { assertTrue, assertEqual, assertClose, assertThrows } from '../assert.js';

export const tests = [
  /* ------------------------------ distancia ------------------------------ */
  {
    name: 'convertDistance respeta las definiciones exactas',
    fn: () => {
      assertClose(convertDistance(1000, 'm', 'km'), 1, '1000 m = 1 km.');
      assertClose(convertDistance(1, 'm', 'cm'), 100, '1 m = 100 cm.');
      assertClose(convertDistance(1, 'm', 'mm'), 1000, '1 m = 1000 mm.');
      assertClose(convertDistance(1, 'nmi', 'm'), 1852, 'Milla náutica: definición exacta.');
      assertClose(convertDistance(1, 'in', 'mm'), 25.4, 'Pulgada: definición de 1959.');
      assertClose(convertDistance(1, 'ft', 'in'), 12, '1 pie = 12 pulgadas.');
      assertClose(convertDistance(1, 'yd', 'ft'), 3, '1 yarda = 3 pies.');
      assertClose(convertDistance(1, 'mi', 'ft'), 5280, '1 milla = 5280 pies.');
    },
  },
  {
    name: 'convertir a la misma unidad devuelve el mismo valor',
    fn: () => {
      assertClose(convertDistance(42.5, 'm', 'm'), 42.5, 'Distancia.');
      assertClose(convertMass(42.5, 'kg', 'kg'), 42.5, 'Masa.');
      assertClose(convertTemperature(42.5, 'C', 'C'), 42.5, 'Temperatura.');
    },
  },
  {
    name: 'convertir cero da cero en las categorías proporcionales',
    fn: () => {
      assertClose(convertDistance(0, 'mi', 'km'), 0, 'Distancia.');
      assertClose(convertSpeed(0, 'kt', 'm/s'), 0, 'Velocidad.');
      assertClose(convertEnergy(0, 'BTU', 'J'), 0, 'Energía.');
    },
  },

  /* -------------------------------- presión -------------------------------- */
  {
    name: 'convertPressure respeta las definiciones exactas',
    fn: () => {
      assertClose(convertPressure(1, 'atm', 'Pa'), 101325, 'Atmósfera estándar: definición exacta.');
      assertClose(convertPressure(1, 'bar', 'Pa'), 100000, '1 bar = 10⁵ Pa.');
      assertClose(convertPressure(1, 'bar', 'mbar'), 1000, '1 bar = 1000 mbar.');
      assertClose(convertPressure(1, 'kPa', 'Pa'), 1000, '1 kPa = 1000 Pa.');
      // Tolerancia 1e-4 y no 1e-9 por el hallazgo H-02 (ver el informe de la
      // sesión): el factor de mmHg del motor es 133.322368, truncado respecto
      // del torr exacto 101325/760 = 133.32236842105263. El desvío es de
      // 3.2e-9 relativo. La tolerancia está puesta para que esta prueba siga
      // valiendo cuando el Chat 2 corrija el factor, no para tapar el desvío:
      // el desvío tiene su propia prueba, más abajo.
      assertClose(convertPressure(1, 'atm', 'mmHg'), 760, '1 atm = 760 mmHg.', 1e-4);
      assertClose(convertPressure(1, 'atm', 'psi'), 14.695948775, '1 atm en psi.', 1e-6);
    },
  },
  {
    name: 'la presión estándar del motor coincide con 1 atm',
    fn: () => {
      // Verificación cruzada entre dos partes del motor que podrían
      // desincronizarse: la constante ISA y la tabla de unidades.
      assertClose(convertPressure(1, 'atm', 'Pa'), STANDARD_PRESSURE, 'STANDARD_PRESSURE vs. 1 atm.');
    },
  },

  /* ------------------------------ temperatura ------------------------------ */
  {
    name: 'convertTemperature maneja el desplazamiento de origen',
    fn: () => {
      assertClose(convertTemperature(0, 'C', 'K'), 273.15, 'Punto de fusión del agua.');
      assertClose(convertTemperature(32, 'F', 'C'), 0, '32 °F = 0 °C.');
      assertClose(convertTemperature(212, 'F', 'C'), 100, '212 °F = 100 °C.');
      assertClose(convertTemperature(-40, 'C', 'F'), -40, 'El punto donde las dos escalas coinciden.');
      assertClose(convertTemperature(0, 'K', 'C'), -273.15, 'Cero absoluto.');
      assertClose(convertTemperature(0, 'K', 'R'), 0, 'El cero absoluto es el mismo en Rankine.');
      assertClose(convertTemperature(491.67, 'R', 'F'), 32, 'Rankine a Fahrenheit.', 1e-9);
    },
  },
  {
    name: 'la temperatura NO se comporta como una conversión proporcional',
    fn: () => {
      // Si alguien reimplementara temperatura con el conversor genérico de
      // factores, el doble de 10 °C daría el doble de su valor en °F, y no lo da.
      const diez = convertTemperature(10, 'C', 'F');
      const veinte = convertTemperature(20, 'C', 'F');
      assertTrue(Math.abs(veinte - 2 * diez) > 1, 'Duplicar °C no duplica °F.');
      assertClose(diez, 50, '10 °C = 50 °F.');
      assertClose(veinte, 68, '20 °C = 68 °F.');
    },
  },

  /* -------------------------------- velocidad -------------------------------- */
  {
    name: 'convertSpeed respeta las definiciones exactas',
    fn: () => {
      assertClose(convertSpeed(1, 'km/h', 'm/s'), 1 / 3.6, '1 km/h = 1/3.6 m/s.');
      assertClose(convertSpeed(3.6, 'km/h', 'm/s'), 1, '3.6 km/h = 1 m/s.');
      // Tolerancia 1e-6 por el hallazgo H-01: el factor del nudo es
      // 0.514444444, truncado respecto del exacto 1852/3600 = 0.5144444…
      // periódico. Desvío de 8.6e-10 relativo, con prueba propia más abajo.
      assertClose(convertSpeed(1, 'kt', 'km/h'), 1.852, 'Nudo: 1 nmi por hora.', 1e-6);
      assertClose(convertSpeed(250, 'kt', 'm/s'), 128.61111111111111, '250 kt en m/s.', 1e-6);
      assertClose(convertSpeed(1, 'mph', 'ft/s'), 5280 / 3600, '1 mph en ft/s.', 1e-9);
    },
  },

  /* ---------------------------------- masa ---------------------------------- */
  {
    name: 'convertMass respeta las definiciones exactas',
    fn: () => {
      assertClose(convertMass(1, 'kg', 'g'), 1000, '1 kg = 1000 g.');
      assertClose(convertMass(1, 'g', 'mg'), 1000, '1 g = 1000 mg.');
      assertClose(convertMass(1, 'ton', 'kg'), 1000, '1 tonelada métrica = 1000 kg.');
      assertClose(convertMass(1, 'lb', 'kg'), 0.45359237, 'Libra: definición de 1959.', 1e-12);
      assertClose(convertMass(1, 'lb', 'oz'), 16, '1 libra = 16 onzas.', 1e-9);
      assertClose(convertMass(1, 'slug', 'kg'), 14.5939029372, 'Slug.', 1e-6);
    },
  },

  /* --------------------------------- energía --------------------------------- */
  {
    name: 'convertEnergy respeta las definiciones exactas',
    fn: () => {
      assertClose(convertEnergy(1, 'kJ', 'J'), 1000, '1 kJ = 1000 J.');
      assertClose(convertEnergy(1, 'kWh', 'J'), 3600000, '1 kWh = 3.6 MJ.');
      assertClose(convertEnergy(1, 'Wh', 'J'), 3600, '1 Wh = 3600 J.');
      assertClose(convertEnergy(1, 'kcal', 'cal'), 1000, '1 kcal = 1000 cal.');
      assertClose(convertEnergy(1, 'cal', 'J'), 4.184, 'Caloría termoquímica.', 1e-9);
      assertClose(convertEnergy(1, 'kWh', 'Wh'), 1000, '1 kWh = 1000 Wh.');
    },
  },

  /* -------------------------------- dispatcher -------------------------------- */
  {
    name: 'convert delega en el conversor correcto sin que se le diga la categoría',
    fn: () => {
      assertClose(convert(1000, 'm', 'km'), 1, 'Distancia.');
      assertClose(convert(32, 'F', 'C'), 0, 'Temperatura.');
      assertClose(convert(1, 'atm', 'Pa'), 101325, 'Presión.');
      assertClose(convert(1, 'kt', 'km/h'), 1.852, 'Velocidad.', 1e-6); // ver H-01
      assertClose(convert(1, 'lb', 'kg'), 0.45359237, 'Masa.', 1e-12);
      assertClose(convert(1, 'kWh', 'J'), 3600000, 'Energía.');
    },
  },
  {
    name: 'convert da el mismo resultado que el conversor específico',
    fn: () => {
      // Si el dispatcher eligiera mal la categoría, este contraste lo delata.
      assertClose(convert(250, 'kt', 'm/s'), convertSpeed(250, 'kt', 'm/s'), 'Velocidad.');
      assertClose(convert(15, 'C', 'K'), convertTemperature(15, 'C', 'K'), 'Temperatura.');
      assertClose(convert(3, 'mi', 'km'), convertDistance(3, 'mi', 'km'), 'Distancia.');
    },
  },
  {
    name: 'convert lanza DimensionError al mezclar categorías físicas',
    fn: () => {
      assertThrows(() => convert(5, 'kg', 'm'), DimensionError, 'DIMENSION_ERROR', 'Masa a distancia.');
      assertThrows(() => convert(5, 'C', 'Pa'), DimensionError, 'DIMENSION_ERROR', 'Temperatura a presión.');
      assertThrows(() => convert(5, 'J', 'kt'), DimensionError, 'DIMENSION_ERROR', 'Energía a velocidad.');
    },
  },
  {
    name: 'convert lanza UNKNOWN_UNIT con una unidad inexistente',
    fn: () => {
      assertThrows(() => convert(5, 'parsec', 'm'), MathError, 'UNKNOWN_UNIT', 'Unidad de origen inexistente.');
      assertThrows(() => convert(5, 'm', 'parsec'), MathError, 'UNKNOWN_UNIT', 'Unidad de destino inexistente.');
      assertThrows(() => convert(5, '', 'm'), MathError, 'UNKNOWN_UNIT', 'Unidad vacía.');
    },
  },
  {
    name: 'los símbolos de unidad distinguen mayúsculas de minúsculas',
    fn: () => {
      // 'K' (kelvin) y 'k' no son lo mismo, y 'M' no es 'm'. Aceptar
      // cualquiera de las dos formas sería peor que rechazar: 'mm' y 'MM'
      // apuntarían a la misma unidad y el error pasaría inadvertido.
      assertThrows(() => convert(5, 'M', 'km'), MathError, 'UNKNOWN_UNIT', 'Metro en mayúscula.');
      assertThrows(() => convert(5, 'pa', 'atm'), MathError, 'UNKNOWN_UNIT', 'Pascal en minúscula.');
    },
  },
  {
    name: 'un conversor de categoría rechaza unidades de otra categoría',
    fn: () => {
      assertThrows(
        () => convertDistance(5, 'kg', 'm'),
        MathError,
        'UNKNOWN_UNIT',
        'Un kilogramo no existe dentro de la categoría distancia.',
      );
    },
  },

  /* ------------------- desvíos detectados, con cota explícita ------------------- */
  {
    name: 'H-01: el factor del nudo está truncado, con un desvío acotado',
    fn: () => {
      // Hallazgo reportado al Chat 2. El nudo es, por definición, una milla
      // náutica por hora: 1852/3600 m/s exactos. El motor usa 0.514444444.
      // Esta prueba fija la cota del desvío para que no crezca sin que nadie
      // se entere, y sigue pasando cuando el factor se corrija (el desvío
      // pasaría a ser 0).
      const exacto = 1852 / 3600;
      const delMotor = convertSpeed(1, 'kt', 'm/s');
      const desvioRelativo = Math.abs(delMotor - exacto) / exacto;
      assertTrue(
        desvioRelativo < 1e-8,
        `El desvío del factor de nudos debería estar por debajo de 1e-8 (es ${desvioRelativo}).`,
      );
    },
  },
  {
    name: 'H-02: mmHg e inHg no son mutuamente consistentes',
    fn: () => {
      // Por definición, una pulgada son 25.4 mm exactos, así que 1 inHg debe
      // ser exactamente 25.4 mmHg, sin importar qué valor se elija para el
      // milímetro de mercurio. El motor da 25.40000639…: los dos factores se
      // redondearon por separado. Es el desvío más grande del catálogo de
      // unidades y el único detectable sin recurrir a una fuente externa.
      const enMmHg = convertPressure(1, 'inHg', 'mmHg');
      const desvioRelativo = Math.abs(enMmHg - 25.4) / 25.4;
      assertTrue(
        desvioRelativo < 1e-6,
        `1 inHg debería ser 25.4 mmHg dentro de 1e-6 relativo (es ${enMmHg}, desvío ${desvioRelativo}).`,
      );
    },
  },

  /* ---------------------------- catálogo de unidades ---------------------------- */
  {
    name: 'categoryOf identifica la categoría de cada unidad del catálogo',
    fn: () => {
      Object.entries(unitsByCategory).forEach(([categoria, unidades]) => {
        unidades.forEach((unidad) => {
          assertEqual(categoryOf(unidad), categoria, `Categoría de '${unidad}'.`);
        });
      });
    },
  },
  {
    name: 'categoryOf lanza UNKNOWN_UNIT con una unidad que no existe',
    fn: () => {
      assertThrows(() => categoryOf('parsec'), MathError, 'UNKNOWN_UNIT', 'Unidad inexistente.');
    },
  },
  {
    name: 'ningún símbolo de unidad se repite entre categorías',
    fn: () => {
      // Si un símbolo estuviera en dos categorías, convert() no podría decidir
      // cuál usar y la elección quedaría librada al orden del objeto.
      const vistos = new Map();
      Object.entries(unitsByCategory).forEach(([categoria, unidades]) => {
        unidades.forEach((unidad) => {
          assertTrue(
            !vistos.has(unidad),
            `El símbolo '${unidad}' aparece en '${categoria}' y también en '${vistos.get(unidad)}'.`,
          );
          vistos.set(unidad, categoria);
        });
      });
    },
  },
  {
    name: 'toda unidad del catálogo es convertible a la primera de su categoría',
    fn: () => {
      // Barrido completo: detecta una unidad listada en el catálogo pero
      // ausente de la tabla de factores, que es un desfasaje fácil de
      // introducir al agregar una unidad nueva.
      Object.values(unitsByCategory).forEach((unidades) => {
        const referencia = unidades[0];
        unidades.forEach((unidad) => {
          const valor = convert(1, unidad, referencia);
          assertTrue(
            Number.isFinite(valor),
            `Convertir 1 ${unidad} a ${referencia} debería dar un número finito (dio ${valor}).`,
          );
        });
      });
    },
  },
];
