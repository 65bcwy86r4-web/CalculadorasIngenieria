/**
 * exporters.js
 * ---------------------------------------------------------------------------
 * Descripción: exportación del resultado actual a TXT, CSV y PDF.
 *
 *   Los tres exportadores trabajan sobre el mismo modelo de presentación que
 *   ve la pantalla, así que lo exportado y lo mostrado no pueden discrepar. El
 *   TXT y el PDF incluyen el procedimiento; el CSV no, porque un desarrollo
 *   paso a paso no es una tabla y meterlo en un CSV produce un archivo que
 *   ninguna planilla abre bien.
 *
 *   El PDF se genera con el diálogo de impresión del navegador, igual que en
 *   la V1: generar bytes de PDF a mano exigiría una librería externa, y
 *   AI_RULES.md §11 las prohíbe sin autorización explícita.
 *
 * Autor: Chat 3 — Interfaz y Calculadoras
 * Fecha de creación: 2026-09-13
 * Dependencias: ../format-values.js
 *
 * Funciones exportadas: exportAsText, exportAsCsv, exportAsPdf
 *
 * @example
 * import { exportAsText } from './exporters.js';
 * exportAsText(operationResult, { operationLabel: 'Matriz inversa' });
 * ---------------------------------------------------------------------------
 */

import { formatValue, formatCell, formatAny } from '../format-values.js';

/**
 * Encabezado común a los tres formatos.
 *
 * @param {{operationLabel: string}} context
 * @returns {string[]}
 */
function headerLines(context) {
  return [
    'CalculadorasIngenieria — Calculadora de Álgebra Lineal',
    `Operación: ${context.operationLabel}`,
    `Fecha: ${new Date().toLocaleString('es-AR')}`,
    '',
  ];
}

/**
 * Convierte un bloque del modelo de presentación a líneas de texto.
 *
 * @param {Object} block
 * @returns {string[]}
 */
function blockToLines(block) {
  const lines = block.label ? [block.label] : [];

  switch (block.kind) {
    case 'matrix':
      lines.push(...block.rows.map((row) => row.map(formatCell).join('\t')));
      break;
    case 'scalar':
      lines.push(formatValue(block.value) + (block.unit ? ` ${block.unit}` : ''));
      break;
    case 'vector':
      lines.push(block.values.map(formatCell).join('\t'));
      break;
    case 'pairs':
      lines.push(...block.entries.map((entry) => `${entry.name}: ${formatAny(entry.value)}`));
      break;
    case 'flags':
      lines.push(...block.flags.map((flag) => `${flag.active ? '[x]' : '[ ]'} ${flag.name}`));
      break;
    case 'text':
      lines.push(block.text);
      break;
    default:
      lines.push(`(bloque no reconocido: ${block.kind})`);
  }

  lines.push('');
  return lines;
}

/**
 * Escribe el procedimiento como texto. Respeta la misma regla que la pantalla:
 * solo `type` y `text` son obligatorios.
 *
 * @param {Array<Object>|null} steps
 * @returns {string[]}
 */
function stepsToLines(steps) {
  if (steps === null || steps === undefined) {
    return ['PROCEDIMIENTO', 'Esta operación no tiene desarrollo paso a paso.', ''];
  }
  if (steps.length === 0) {
    return ['PROCEDIMIENTO', 'El motor todavía no publica el desarrollo de esta operación.', ''];
  }
  return [
    'PROCEDIMIENTO',
    ...steps.map((step, index) => `${index + 1}. [${step.type}] ${step.text}`),
    '',
  ];
}

/**
 * Descarga un contenido de texto como archivo.
 *
 * @param {string} filename
 * @param {string} contents
 * @param {string} mimeType
 * @returns {void}
 */
function downloadTextFile(filename, contents, mimeType) {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Nombre de archivo con la operación y la fecha, para que varias exportaciones
 * no se pisen en la carpeta de descargas.
 *
 * @param {string} operationId
 * @param {string} extension
 * @returns {string}
 */
function buildFilename(operationId, extension) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return `algebra-${operationId}-${stamp}.${extension}`;
}

/**
 * Exporta el resultado y su procedimiento como texto plano.
 *
 * @param {Object} operationResult
 * @param {{operationId: string, operationLabel: string}} context
 * @returns {void}
 */
export function exportAsText(operationResult, context) {
  const lines = [
    ...headerLines(context),
    operationResult.title.toUpperCase(),
    '',
    ...operationResult.notes.map((note) => `Nota: ${note}`),
    ...(operationResult.notes.length > 0 ? [''] : []),
    ...operationResult.blocks.flatMap(blockToLines),
    ...stepsToLines(operationResult.steps),
  ];

  downloadTextFile(buildFilename(context.operationId, 'txt'), lines.join('\n'), 'text/plain');
}

/**
 * Escapa un campo de CSV según RFC 4180.
 *
 * @param {string} field
 * @returns {string}
 */
function csvField(field) {
  return /[",\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

/**
 * Exporta los valores del resultado como CSV, sin el procedimiento.
 *
 * @param {Object} operationResult
 * @param {{operationId: string, operationLabel: string}} context
 * @returns {void}
 */
export function exportAsCsv(operationResult, context) {
  const rows = [[context.operationLabel], [operationResult.title], []];

  for (const block of operationResult.blocks) {
    if (block.label) {
      rows.push([block.label]);
    }
    if (block.kind === 'matrix') {
      rows.push(...block.rows.map((row) => row.map(formatCell)));
    } else if (block.kind === 'vector') {
      rows.push(block.values.map(formatCell));
    } else if (block.kind === 'scalar') {
      rows.push([formatValue(block.value)]);
    } else if (block.kind === 'pairs') {
      rows.push(...block.entries.map((entry) => [entry.name, formatAny(entry.value)]));
    } else if (block.kind === 'flags') {
      rows.push(...block.flags.map((flag) => [flag.name, flag.active ? 'sí' : 'no']));
    } else if (block.kind === 'text') {
      rows.push([block.text]);
    }
    rows.push([]);
  }

  const contents = rows.map((row) => row.map(csvField).join(',')).join('\n');
  downloadTextFile(buildFilename(context.operationId, 'csv'), contents, 'text/csv');
}

/**
 * Prepara la vista de impresión y abre el diálogo del navegador, donde el
 * usuario elige "Guardar como PDF".
 *
 * @param {HTMLElement} printArea - Contenedor reservado para la impresión.
 * @param {Object} operationResult
 * @param {{operationId: string, operationLabel: string}} context
 * @returns {void}
 */
export function exportAsPdf(printArea, operationResult, context) {
  const lines = [
    ...headerLines(context),
    operationResult.title,
    '',
    ...operationResult.blocks.flatMap(blockToLines),
    ...stepsToLines(operationResult.steps),
  ];

  const pre = document.createElement('pre');
  pre.className = 'print-document';
  pre.textContent = lines.join('\n');
  printArea.replaceChildren(pre);

  window.print();
}
