# tests/

Pruebas del motor matemático. **Paso 1 del plan — implementado el 2026-09-13.**

Chat responsable: 5 (QA y Verificación), según `docs/CHAT_ROLES.md`.

Estado: **281 pruebas en 16 archivos, todas pasan.** Cinco hallazgos abiertos
contra el motor, fijados en `math/known-defects.test.js` y reportados al
Chat 2 (ver la bitácora de `docs/HANDOFF.md`, entrada del 2026-09-13).

---

## Por qué esto es lo primero

`AI_RULES.md` §20 y `ENGINEERING_GUIDE.md` §15 las declaran obligatorias y no
opcionales. Más allá de la norma: el Paso 2 (portar capacidades desde
`legacy/motor-v1/`) toca archivos del núcleo del motor. Hacerlo sin una red de
seguridad es la forma más rápida de introducir una regresión silenciosa en un
algoritmo que ya funcionaba.

---

## Cómo se ejecutan

Node en modo ES Modules, sin dependencias externas ni framework de testing
(`AI_RULES.md` §11). El motor es puro y no conoce el DOM (`Architecture.md`
§3), así que corre en Node sin ninguna adaptación.

```bash
node tests/run.js              # toda la suite
node tests/run.js algebra      # solo los archivos cuyo nombre contenga 'algebra'
```

Termina con código de salida 1 si algo falla, así que sirve como compuerta
antes de aceptar una PR (`CODING_STANDARDS.md` §17).

---

## Qué debe cubrir cada algoritmo

Los cuatro casos que exige `CODING_STANDARDS.md` §15:

1. **Caso normal** — entrada típica, resultado esperado.
2. **Casos límite** — matriz 1×1, matriz singular, vector vacío, división por
   cero, valores muy grandes o muy chicos, dominio de extrapolación.
3. **Errores esperados** — que lance la excepción correcta, con el `code`
   correcto. Verificar el `code`, no el mensaje: el mensaje está pensado para
   mostrarse y puede cambiar de redacción (`Architecture.md` §4).
4. **Valores conocidos** — resultados verificables a mano o contra
   bibliografía.

Más una quinta categoría propia de este motor:

5. **Verificación cruzada** — cuando dos caminos distintos calculan lo mismo,
   comparar sus resultados:
   - determinante por Gauss vs. por cofactores
   - inversa por Gauss-Jordan vs. producto `A · A⁻¹ = I`
   - suma de autovalores vs. traza; producto de autovalores vs. determinante
   - `L · U = P · A`, `Q · R = A`, `L · Lᵀ = A`
   - interpolación lineal vs. Lagrange con dos puntos (deben coincidir)
   - conversión de unidades de ida y vuelta

---

## Reglas

- Nunca comparar flotantes con `===`: usar `approximatelyEqual` del propio
  motor, o una tolerancia explícita (`AI_RULES.md` §14).
- Las pruebas importan desde `shared/math/index.js`, igual que cualquier
  calculadora. Si algo hace falta probar y no está exportado, es implementación
  interna y no se prueba directamente.
- Una prueba que falla no se "ajusta" cambiando la tolerancia hasta que pase.
  Se investiga. Si la investigación concluye que el motor está mal, el hallazgo
  va a `math/known-defects.test.js` y se reporta; no se arregla desde acá.
- Toda tolerancia distinta de la de por defecto lleva al lado el motivo por el
  que es distinta.

---

## Estructura

```
tests/
├── run.js              Ejecutor: descubre math/*.test.js, corre todo, informa
├── assert.js           assertClose, assertThrows, assertMatrixClose y afines
└── math/
    ├── api-surface.test.js            Contrato de la API pública contra docs/API.md
    ├── errors.test.js                 Jerarquía de excepciones, code y context
    ├── validation.test.js             Familias isX y assertX
    ├── formatter.test.js              Precisión y formato de salida
    ├── algebra-matrix.test.js         Clase Matrix
    ├── algebra-gauss.test.js          Escalonamiento, rango y sistemas
    ├── algebra-determinant.test.js    Determinante, inversa, adjunta, condición
    ├── algebra-decompositions.test.js LU, QR, Cholesky
    ├── algebra-eigen.test.js          Autovalores, autovectores, diagonalización
    ├── interpolation.test.js          Lineal, por tramos, Lagrange, spline
    ├── numerical.test.js              Newton, bisección, secante, trapecio, Simpson
    ├── physics.test.js                vectors.* y tensors.*
    ├── units.test.js                  Seis categorías, dispatcher y catálogo
    ├── helpers.test.js                Utilidades genéricas
    ├── cross-checks.test.js           Verificación cruzada entre métodos
    └── known-defects.test.js          Defectos del motor, fijados y documentados
```

El módulo de álgebra está partido en cinco archivos y no en uno solo, como
sugería la estructura original: junto habría superado holgadamente el límite de
500 líneas de `AI_RULES.md` §10, y separado el informe de fallas dice en qué
algoritmo está el problema.

---

## Cómo agregar una prueba

Cada archivo exporta un arreglo `tests`; el ejecutor lo importa y corre cada
entrada. No hay registro global ni `describe/it`: un archivo de prueba es un
módulo ES común, importable por separado.

```js
import { loQueSePrueba } from '../../shared/math/index.js';
import { assertClose } from '../assert.js';

export const tests = [
  {
    name: 'descripción de lo que se verifica',
    fn: () => {
      assertClose(loQueSePrueba(2), 4, 'mensaje si falla');
    },
  },
];
```

Un archivo nuevo en `math/` con el sufijo `.test.js` se descubre solo.

---

## known-defects.test.js

Es la excepción a la regla. Esas pruebas fijan lo que el motor hace **hoy**, que
en esos casos es incorrecto, y dejan escrito al lado cuál sería el resultado
correcto, cuál es la causa y a qué archivo pertenece el arreglo.

Existe para que `node tests/run.js` siga siendo una compuerta útil: una suite
permanentemente en rojo deja de informar, porque a los dos días nadie distingue
"las de siempre" de una regresión nueva.

Cuando el Chat 2 corrija uno de esos defectos, la prueba correspondiente va a
fallar. **Eso no es una regresión: es la señal de que el hallazgo se cerró.** Se
borra de ese archivo y la verificación correcta se muda al archivo que le
corresponde, que el comentario de cada prueba indica.
