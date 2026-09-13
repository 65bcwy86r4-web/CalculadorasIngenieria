# legacy/

**Código congelado. Ningún archivo del proyecto importa nada de acá.**

Este directorio no forma parte de la aplicación. No se modifica, no se
refactoriza, no se le agregan pruebas y no se le aplica la Regla de Boy Scout
(`CODING_STANDARDS.md` §19). Existe por dos razones puntuales, y cada una tiene
una condición de eliminación.

---

## `calculadora-algebra-v1/`

La calculadora de álgebra lineal de la Versión 1: aplicación de una sola
página, funcional, con sus algoritmos embebidos en `js/`.

**Por qué se conserva.** Es la especificación funcional viva de lo que la
Versión 3a tiene que replicar: 25 operaciones matriciales, procedimiento
matemático paso a paso, historial persistente, exportación TXT/CSV/PDF, pegado
desde planilla de cálculo y atajos de teclado. Tenerla corriendo al lado
mientras se reescribe vale más que cualquier lista de requisitos.

**Es referencia de _qué_ hace, no de _cómo_ está escrita.** Viola la regla
fundacional del proyecto (`AI_RULES.md` §4): implementa sus propios algoritmos
en vez de delegarlos al motor. Esa es exactamente la deuda que la Versión 3a
salda.

Funciona con doble clic sobre su `index.html`, porque usa scripts clásicos y no
ES Modules (ver `docs/adr/ADR-002-ejecucion-esm.md`).

**Se elimina cuando:** la calculadora de `modules/algebra/` cubra todas sus
funcionalidades y esté verificada por el Chat 5.

---

## `motor-v1/`

La copia temprana del motor matemático, en estilo funcional sobre arreglos
planos. Nunca tuvo consumidores: estaba dentro de `CalculadoraAlgebra/` pero la
aplicación no la importaba.

**Por qué se conserva.** Contiene implementaciones que el motor canónico no
tiene y que hay que portar: el método de Jacobi para autovalores, la solución
analítica del caso 2×2, mínimos cuadrados por QR, la spline cúbica reutilizable
y varias más. La lista completa, con prioridades, está en
`docs/adr/ADR-001-motor-canonico.md` §5.

**No es una versión alternativa del motor.** Su API es incompatible con la
canónica: opera sobre arreglos planos, no sobre la clase `Matrix`. Portar
significa reescribir el algoritmo en el estilo del motor canónico, con su
JSDoc, sus excepciones y sus pruebas, no copiar el archivo.

**Se elimina cuando:** se complete la checklist de ADR-001 §5 (Paso 2).

---

## Regla

Si estás por escribir un `import` que apunte a `legacy/`, pará. La respuesta
está en `shared/math/index.js` o, si no está, es un pedido al motor
(`docs/CHAT_ROLES.md` §5).
