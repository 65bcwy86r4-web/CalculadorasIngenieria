/**
 * tests/math/known-defects.test.js
 * ---------------------------------------------------------------------------
 * DEFECTOS CONOCIDOS DEL MOTOR, FIJADOS COMO PRUEBA.
 *
 * ESTADO AL 2026-09-13: SIN DEFECTOS ABIERTOS. El archivo queda vacío a
 * propósito, con su explicación intacta, para que el próximo hallazgo tenga
 * dónde anotarse sin volver a discutir el mecanismo.
 *
 * Este archivo es la excepción a la regla de la suite. Las demás pruebas
 * verifican que el motor haga lo correcto. Estas fijan lo que el motor hace
 * HOY, que en esos casos es incorrecto, y dejan escrito al lado cuál es el
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
 * DÓNDE FUERON A PARAR LOS CINCO HALLAZGOS DEL PASO 1
 * Los cinco se cerraron en el Paso 1b (sesión del 2026-09-13, Chat 2) y su
 * verificación correcta vive ahora en:
 *
 *   H-01  factor del nudo truncado .............. units.test.js
 *   H-02  mmHg e inHg inconsistentes ............ units.test.js
 *   H-03  eigenvaluesQR con autovalores ±λ ...... algebra-eigen.test.js
 *   H-04  vonMisesStress en corte puro .......... physics.test.js
 *   H-05  cofactorMatrix y adjugate en una 1x1 .. algebra-determinant.test.js
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Modificado: 2026-09-13 — Chat 2. Vaciado al cerrarse los cinco hallazgos.
 * Dependencias: shared/math/index.js, tests/assert.js
 * ---------------------------------------------------------------------------
 */

/** @type {Array<{name: string, fn: function}>} */
export const tests = [];
