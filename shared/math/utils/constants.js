/**
 * utils/constants.js
 * ---------------------------------------------------------------------------
 * Responsabilidad única: centralizar valores constantes usados en más de
 * un módulo, para no repetir "números mágicos" en el código. Se agrupan
 * en dos categorías dentro del mismo archivo (numéricas y físicas) porque
 * ambas cumplen el mismo rol estructural: ser la única fuente de verdad
 * para un valor fijo. Si una calculadora necesita una constante que no
 * está acá, se agrega acá (Open/Closed: se extiende el archivo, no se
 * duplica el valor en otro lugar).
 * ---------------------------------------------------------------------------
 */

/** Tolerancia numérica por defecto para comparaciones de punto flotante. */
export const DEFAULT_TOLERANCE = 1e-10;

/** Tolerancia "relajada", útil para verificar resultados con más margen. */
export const RELAXED_TOLERANCE = 1e-6;

/** Cantidad máxima de iteraciones por defecto para métodos iterativos. */
export const DEFAULT_MAX_ITERATIONS = 100;

/** Cantidad de iteraciones del algoritmo QR para aproximar autovalores. */
export const DEFAULT_QR_ITERATIONS = 500;

/** Cantidad de decimales por defecto al redondear resultados para mostrar. */
export const DEFAULT_DISPLAY_DECIMALS = 4;

/** Paso h por defecto para derivación numérica (diferencias finitas). */
export const DEFAULT_DERIVATIVE_STEP = 1e-6;

/* ------------------------- Constantes físicas (SI) ------------------------- */

/** Aceleración estándar de la gravedad, m/s² (usada en física, ISA, motores). */
export const STANDARD_GRAVITY = 9.80665;

/** Presión atmosférica estándar al nivel del mar, Pa (ISA). */
export const STANDARD_PRESSURE = 101325;

/** Temperatura estándar al nivel del mar, K (ISA, 15 °C). */
export const STANDARD_TEMPERATURE = 288.15;

/** Constante particular del aire seco, J/(kg·K) (ISA, mecánica de fluidos). */
export const GAS_CONSTANT_AIR = 287.05287;

/** Constante universal de los gases, J/(mol·K). */
export const UNIVERSAL_GAS_CONSTANT = 8.31446261815324;

/** Número de Avogadro, mol⁻¹. */
export const AVOGADRO_NUMBER = 6.02214076e23;

/** Velocidad de la luz en el vacío, m/s. */
export const SPEED_OF_LIGHT = 299792458;

/** Gradiente térmico estándar en la troposfera (ISA), K/m (negativo = enfría con la altura). */
export const ISA_LAPSE_RATE = -0.0065;
