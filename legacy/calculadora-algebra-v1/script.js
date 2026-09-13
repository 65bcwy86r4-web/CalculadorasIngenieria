/**
 * script.js
 * ---------------------------------------------------------------------------
 * Punto de entrada de la aplicación. Espera a que el DOM esté listo y
 * arranca el controlador de interfaz (UI, definido en js/ui.js), que a su
 * vez orquesta todos los módulos matemáticos cargados previamente
 * (matrix.js, vectors.js, gauss.js, determinant.js, inverse.js, eigen.js).
 * ---------------------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {
  UI.init();
});
