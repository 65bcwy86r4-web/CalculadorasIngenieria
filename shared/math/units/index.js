/**
 * units/index.js
 * ---------------------------------------------------------------------------
 * Dispatcher de conversión de unidades: punto único de acceso a todas las
 * categorías de unidades del motor (distancia, presión, temperatura,
 * velocidad, masa, energía).
 *
 * Responsabilidad única: (1) exponer convertDistance/convertPressure/...
 * con nombres amigables por categoría, y (2) resolver automáticamente la
 * categoría de dos símbolos de unidad para ofrecer una función general
 * convert(value, from, to) que valida que ambas unidades sean de la misma
 * magnitud física.
 *
 * Este archivo NO reimplementa ninguna conversión: siempre delega en el
 * módulo de la categoría correspondiente (./distance.js, etc.), que a su
 * vez usa createUnitConverter (utils/helpers.js). Se arma un registro
 * (arreglo `categories`) en vez de una cadena de if/else — agregar una
 * categoría nueva en el futuro es: crear units/nueva.js siguiendo el mismo
 * patrón que las demás, y sumar una entrada a `categories`. El resto del
 * dispatcher (convert, categoryOf, validaciones, mensajes de error) no
 * necesita tocarse.
 * ---------------------------------------------------------------------------
 */

import { convert as distanceConvert, units as distanceUnits } from './distance.js';
import { convert as pressureConvert, units as pressureUnits } from './pressure.js';
import { convert as temperatureConvert, units as temperatureUnits } from './temperature.js';
import { convert as speedConvert, units as speedUnits } from './speed.js';
import { convert as massConvert, units as massUnits } from './mass.js';
import { convert as energyConvert, units as energyUnits } from './energy.js';
import { MathError } from '../errors/MathError.js';
import { DimensionError } from '../errors/DimensionError.js';
import { assertFiniteNumber } from '../validation/numbers.js';

/**
 * Registro de categorías físicas soportadas. Cada entrada es autónoma:
 * su nombre (para mensajes de error), su función convert(value, from, to)
 * ya validada por esa categoría, y los símbolos que reconoce.
 * @type {Array<{ name: string, convert: Function, units: string[] }>}
 */
const categories = [
  { name: 'distancia', convert: distanceConvert, units: distanceUnits },
  { name: 'presión', convert: pressureConvert, units: pressureUnits },
  { name: 'temperatura', convert: temperatureConvert, units: temperatureUnits },
  { name: 'velocidad', convert: speedConvert, units: speedUnits },
  { name: 'masa', convert: massConvert, units: massUnits },
  { name: 'energía', convert: energyConvert, units: energyUnits },
];

/**
 * Mapa símbolo → categoría, construido una única vez al cargar el módulo
 * (no en cada llamada a convert: esto es lo que evita el "if gigante").
 * Si dos categorías registraran por error el mismo símbolo, se lanza acá,
 * al cargar el motor, en vez de fallar en silencio más tarde con un
 * resultado ambiguo (protección pensada para cuando alguien agregue una
 * categoría nueva dentro de unos años y no note el choque de símbolos).
 */
const unitToCategory = new Map();
for (const category of categories) {
  for (const unit of category.units) {
    if (unitToCategory.has(unit)) {
      const other = unitToCategory.get(unit).name;
      throw new MathError(
        `Conflicto de configuración del motor: la unidad "${unit}" está registrada tanto en "${other}" como en "${category.name}". Cada símbolo debe pertenecer a una única categoría física.`,
        'DUPLICATE_UNIT_SYMBOL',
        { unit, categories: [other, category.name] }
      );
    }
    unitToCategory.set(unit, category);
  }
}

/**
 * @param {string} unit - símbolo de unidad (ej: "km", "kt", "atm")
 * @returns {string} nombre de la categoría física a la que pertenece
 * @throws {MathError} code 'UNKNOWN_UNIT' si el símbolo no está registrado
 * @example
 * categoryOf('km'); // 'distancia'
 * categoryOf('kt'); // 'velocidad'
 */
export function categoryOf(unit) {
  const category = unitToCategory.get(unit);
  if (!category) {
    throw new MathError(
      `Unidad desconocida: "${unit}". Categorías soportadas: ${categories.map((c) => c.name).join(', ')}.`,
      'UNKNOWN_UNIT',
      { unit, supportedCategories: categories.map((c) => c.name) }
    );
  }
  return category.name;
}

/**
 * Conversión general entre dos unidades cualesquiera reconocidas por el
 * motor. Determina automáticamente a qué categoría física pertenece cada
 * símbolo (sin que el llamador la indique) y delega en el conversor de
 * esa categoría. Si from y to pertenecen a categorías distintas (por
 * ejemplo, convertir un metro a un kilogramo), lanza DimensionError en
 * vez de devolver un número sin sentido.
 * @param {number} value
 * @param {string} from - símbolo de la unidad de origen
 * @param {string} to - símbolo de la unidad de destino
 * @returns {number}
 * @throws {MathError} code 'UNKNOWN_UNIT' si from o to no son reconocidas por ninguna categoría
 * @throws {DimensionError} si from y to pertenecen a categorías físicas distintas
 * @example
 * convert(1000, 'm', 'km'); // 1
 * convert(32, 'F', 'C'); // 0
 * convert(1, 'atm', 'Pa'); // 101325
 * convert(250, 'kt', 'm/s'); // 128.6111...
 * convert(5, 'kg', 'm'); // lanza DimensionError (masa vs. distancia)
 */
export function convert(value, from, to) {
  assertFiniteNumber(value, 'value');
  const categoryFrom = unitToCategory.get(from);
  if (!categoryFrom) {
    throw new MathError(`Unidad de origen desconocida: "${from}". Categorías soportadas: ${categories.map((c) => c.name).join(', ')}.`, 'UNKNOWN_UNIT', { unit: from });
  }
  const categoryTo = unitToCategory.get(to);
  if (!categoryTo) {
    throw new MathError(`Unidad de destino desconocida: "${to}". Categorías soportadas: ${categories.map((c) => c.name).join(', ')}.`, 'UNKNOWN_UNIT', { unit: to });
  }
  if (categoryFrom.name !== categoryTo.name) {
    throw new DimensionError(
      `No se puede convertir "${from}" (${categoryFrom.name}) a "${to}" (${categoryTo.name}): son magnitudes físicas distintas.`,
      { from, to, categoryFrom: categoryFrom.name, categoryTo: categoryTo.name }
    );
  }
  return categoryFrom.convert(value, from, to);
}

/**
 * Conversión de unidades de distancia. Ver units/distance.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertDistance(1000, 'm', 'km'); // 1
 */
export const convertDistance = distanceConvert;

/**
 * Conversión de unidades de presión. Ver units/pressure.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertPressure(1, 'atm', 'Pa'); // 101325
 */
export const convertPressure = pressureConvert;

/**
 * Conversión de unidades de temperatura. Ver units/temperature.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertTemperature(32, 'F', 'C'); // 0
 */
export const convertTemperature = temperatureConvert;

/**
 * Conversión de unidades de velocidad. Ver units/speed.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertSpeed(250, 'kt', 'm/s'); // 128.6111...
 */
export const convertSpeed = speedConvert;

/**
 * Conversión de unidades de masa. Ver units/mass.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertMass(1, 'slug', 'kg'); // 14.5939...
 */
export const convertMass = massConvert;

/**
 * Conversión de unidades de energía. Ver units/energy.js.
 * @function
 * @param {number} value @param {string} from @param {string} to
 * @returns {number}
 * @example convertEnergy(1, 'kWh', 'J'); // 3600000
 */
export const convertEnergy = energyConvert;

/**
 * Símbolos soportados, agrupados por categoría física. Pensado para que
 * una futura interfaz arme selectores de unidades (dropdowns) sin
 * duplicar esta lista en la capa de presentación.
 * @type {Object<string, string[]>}
 * @example
 * unitsByCategory.velocidad; // ['m/s', 'km/h', 'mph', 'kt', 'ft/s']
 */
export const unitsByCategory = {
  distancia: distanceUnits,
  presión: pressureUnits,
  temperatura: temperatureUnits,
  velocidad: speedUnits,
  masa: massUnits,
  energía: energyUnits,
};
