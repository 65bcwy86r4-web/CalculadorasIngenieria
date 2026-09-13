/**
 * tests/run.js
 * ---------------------------------------------------------------------------
 * Ejecutor de la suite de pruebas del motor matemático compartido.
 *
 * Sin framework y sin dependencias externas (AI_RULES.md §11): descubre los
 * archivos `tests/math/*.test.js`, importa cada uno, ejecuta las pruebas que
 * exporta e informa el resultado. Termina con código de salida 1 si algo
 * falla, para que pueda usarse como compuerta antes de aceptar una PR
 * (CODING_STANDARDS.md §17).
 *
 * CONTRATO CON LOS ARCHIVOS DE PRUEBA
 * Cada `*.test.js` exporta un arreglo llamado `tests`:
 *
 *   export const tests = [
 *     { name: 'descripción del caso', fn: () => { ... } },
 *   ];
 *
 * Se eligió un export plano en vez de un registro global tipo `describe/it`
 * porque evita estado compartido mutable entre archivos
 * (ENGINEERING_GUIDE.md §9: sin variables globales) y hace que cada archivo
 * de prueba sea un módulo ES puro, importable y verificable por separado.
 * Una prueba pasa si `fn` retorna sin lanzar. Se admiten funciones async.
 *
 * USO
 *   node tests/run.js              Corre toda la suite.
 *   node tests/run.js algebra      Corre solo los archivos cuyo nombre
 *                                  contenga 'algebra'.
 *
 * Autor: Chat 5 — QA y Verificación
 * Fecha de creación: 2026-09-13
 * Dependencias: node:fs, node:path, node:url, tests/assert.js (AssertionError)
 * ---------------------------------------------------------------------------
 */

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { AssertionError } from './assert.js';

const TESTS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), 'math');
const TEST_FILE_SUFFIX = '.test.js';

/** Códigos ANSI. Se desactivan si la salida no es una terminal. */
const useColor = Boolean(process.stdout.isTTY);
const paint = (code, text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
const green = (text) => paint('32', text);
const red = (text) => paint('31', text);
const yellow = (text) => paint('33', text);
const bold = (text) => paint('1', text);
const dim = (text) => paint('2', text);

/**
 * Lista los archivos de prueba, opcionalmente filtrados por un fragmento de
 * nombre recibido por línea de comandos.
 *
 * @param {string|undefined} filter
 * @returns {string[]} Nombres de archivo, ordenados alfabéticamente.
 */
function discoverTestFiles(filter) {
  const files = readdirSync(TESTS_DIRECTORY)
    .filter((name) => name.endsWith(TEST_FILE_SUFFIX))
    .sort();
  if (!filter) return files;
  return files.filter((name) => name.includes(filter));
}

/**
 * Importa un archivo de prueba y valida que respete el contrato de export.
 *
 * @param {string} fileName
 * @returns {Promise<Array<{name: string, fn: function}>>}
 * @throws {Error} Si el archivo no exporta un arreglo `tests` válido.
 */
async function loadTests(fileName) {
  const moduleUrl = pathToFileURL(join(TESTS_DIRECTORY, fileName)).href;
  const module = await import(moduleUrl);

  if (!Array.isArray(module.tests)) {
    throw new Error(`${fileName} no exporta un arreglo 'tests'.`);
  }
  module.tests.forEach((testCase, index) => {
    if (typeof testCase?.name !== 'string' || typeof testCase?.fn !== 'function') {
      throw new Error(`${fileName}: la prueba en la posición ${index} no tiene { name, fn }.`);
    }
  });
  return module.tests;
}

/**
 * Imprime el detalle de una falla. Distingue una aserción fallida (el motor
 * dio un resultado distinto al esperado) de una excepción inesperada (el
 * motor explotó, o el propio test está mal escrito): son dos diagnósticos
 * diferentes y conviene no confundirlos al leer el informe.
 *
 * @param {string} fileName
 * @param {string} testName
 * @param {Error} error
 * @returns {void}
 */
function reportFailure(fileName, testName, error) {
  const isAssertion = error instanceof AssertionError;
  const label = isAssertion ? red('FALLA') : yellow('ERROR INESPERADO');
  console.log(`\n  ${label} ${bold(`${fileName} › ${testName}`)}`);
  console.log(`    ${error.message}`);
  if (!isAssertion && error.stack) {
    const relevantFrames = error.stack
      .split('\n')
      .slice(1, 4)
      .map((line) => `    ${dim(line.trim())}`)
      .join('\n');
    console.log(relevantFrames);
  }
}

/**
 * Corre todas las pruebas de un archivo.
 *
 * @param {string} fileName
 * @returns {Promise<{passed: number, failed: number}>}
 */
async function runFile(fileName) {
  let tests;
  try {
    tests = await loadTests(fileName);
  } catch (error) {
    console.log(`\n${red('✗')} ${bold(fileName)} ${red('— no se pudo cargar')}`);
    console.log(`    ${error.message}`);
    return { passed: 0, failed: 1 };
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const testCase of tests) {
    try {
      await testCase.fn();
      passed += 1;
    } catch (error) {
      failed += 1;
      failures.push({ testName: testCase.name, error });
    }
  }

  const mark = failed === 0 ? green('✓') : red('✗');
  const counts = failed === 0 ? dim(`${passed} pruebas`) : red(`${failed} de ${passed + failed} fallan`);
  console.log(`${mark} ${bold(fileName.padEnd(34))} ${counts}`);
  failures.forEach(({ testName, error }) => reportFailure(fileName, testName, error));

  return { passed, failed };
}

/**
 * Punto de entrada: corre la suite completa e informa el resumen.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const filter = process.argv[2];
  const files = discoverTestFiles(filter);

  console.log(bold('\nSuite de pruebas — motor shared/math'));
  console.log(dim(`Node ${process.version} · ${files.length} archivo(s)${filter ? ` · filtro: '${filter}'` : ''}\n`));

  if (files.length === 0) {
    console.log(red('No se encontró ningún archivo de prueba.'));
    process.exitCode = 1;
    return;
  }

  const startedAt = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;

  for (const fileName of files) {
    const result = await runFile(fileName);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  const elapsed = Date.now() - startedAt;
  const total = totalPassed + totalFailed;
  console.log('');
  if (totalFailed === 0) {
    console.log(green(bold(`${total} pruebas, todas pasan (${elapsed} ms)`)));
  } else {
    console.log(red(bold(`${totalFailed} de ${total} pruebas fallan (${elapsed} ms)`)));
    process.exitCode = 1;
  }
}

main();
