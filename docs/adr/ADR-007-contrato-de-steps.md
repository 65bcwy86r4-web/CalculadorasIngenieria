# ADR-007 — Contrato de `steps`: forma de retorno del procedimiento

- **Fecha:** 2026-09-13
- **Estado:** Aceptado
- **Decide:** responsable del proyecto
- **Relacionado:** HANDOFF D15, D14, ADR-006 (interfaz antes que port)

---

## 1. Contexto

El motor devuelve, en algunas funciones, un procedimiento paso a paso pensado
para que una calculadora lo muestre. Es una de las decisiones fundacionales del
proyecto: `engineering-conventions` lo registra como *"los algoritmos devuelven
objetos ricos `{value, steps}` en vez de números pelados, para que la
visualización paso a paso se pueda agregar después sin cambiar la API"*.

El relevamiento previo al Paso 3 mostró que ese contrato nunca se completó ni se
unificó:

| Situación | Funciones |
|---|---|
| `steps` con `{type, text, snapshot}` | `determinantByGauss`, `inverse`, `rowEchelon`, `reducedRowEchelon`, `rank`, `solveSystem` |
| `steps` sin `snapshot` | `luDecomposition` |
| **Sin `steps`** | `determinantByCofactors`, `adjugate`, `cofactorMatrix`, `qrDecomposition`, `choleskyDecomposition`, `eigenvalues`, `eigenvectors`, `diagonalize`, `conditionNumber` |

Y cuatro funciones ni siquiera pueden llevar `steps` con su forma actual, porque
no devuelven un objeto plano: `determinantByCofactors` devuelve un número,
`eigenvectors` un arreglo, y `adjugate` y `cofactorMatrix` una instancia de
`Matrix` —a la que no se le puede colgar un `steps` sin ensuciar la clase.

La consecuencia concreta: **la calculadora de la Versión 3a no puede igualar a
la V1 que viene a reemplazar.** La V1 mostraba el desarrollo de las 25
operaciones; con el motor actual, nueve quedarían sin procedimiento.

El momento es este. Es el mismo argumento de ADR-005 y ADR-006: `modules/` sigue
vacío, así que cambiar formas de retorno cuesta cero. Después de la Versión 3a,
cada cambio arrastra la interfaz.

---

## 2. Alternativas consideradas

**A. Un sobre uniforme para todo.** Que toda función devuelva
`{ value, steps, meta }`, con `value` genérico. Máxima uniformidad para un
renderizador. Contra: destruye la legibilidad de los retornos con varias piezas
—`{L, U, P}` pasaría a `{value: {L, U, P}}`— y obliga a tocar las 306 pruebas.

**B. Normalizar solo lo que impide llevar `steps`, y unificar la forma del
paso.** Se conservan las claves de dominio, que son buenas: una calculadora
renderiza un determinante distinto de una factorización LU, así que el
polimorfismo total no le sirve de nada. Se cambia únicamente lo que hoy hace
imposible adjuntar el procedimiento.

**C. Que cada función quede como está y la interfaz se arregle.** Cero trabajo de
motor. Contra: mueve la complejidad a la capa que no debe tenerla, y cada
calculadora futura la vuelve a pagar.

---

## 3. Decisión

**Se adopta la opción B**, en dos etapas separadas a propósito (§4).

### 3.1 Regla general

Toda función pública de `shared/math/algebra/` que tenga un procedimiento
mostrable devuelve **un objeto plano** con una clave `steps`, que es **siempre un
arreglo** —vacío si esa función todavía no registra pasos, nunca `undefined`.

Nunca devuelve un número pelado, un arreglo pelado ni una instancia de `Matrix`
como retorno completo.

### 3.2 Forma del paso

```js
{
  type: string,           // obligatorio, del vocabulario cerrado de §3.3
  text: string,           // obligatorio, en español, listo para mostrar
  snapshot?: number[][],  // opcional: estado después del paso, si hay uno
  detail?: object         // opcional: datos estructurados para resaltar
}
```

**La regla que gobierna todo lo demás:** la interfaz tiene que poder renderizar
cualquier procedimiento usando **solo `type` y `text`**. `snapshot` y `detail`
son mejoras progresivas, nunca requisitos. Un renderizador que necesite
`snapshot` para no romperse está mal escrito.

Esto no es un detalle de estilo: es lo que permite que el Chat 3 construya el
panel de procedimiento contra un contrato estable aunque algunas funciones
todavía tengan `steps: []`.

- `snapshot` es un arreglo bidimensional de números comunes, no una `Matrix`, y
  representa el estado **después** de aplicar el paso. En las factorizaciones es
  el factor que se está construyendo.
- `detail` no tiene forma fija. Es para que una interfaz pueda resaltar la fila,
  la columna o el factor involucrado; ninguna calculadora debe depender de él.

### 3.3 Vocabulario cerrado de `type`

Se estandariza sobre lo que ya existe, extendido con lo que falta. Un `type`
fuera de esta lista es un error de contrato.

**Pasos de procedimiento**

| `type` | Cuándo |
|---|---|
| `info` | Nota u observación que no modifica nada |
| `swap` | Intercambio de dos filas |
| `scale` | Multiplicación de una fila por un escalar |
| `elim` | Combinación lineal de filas |
| `expand` | Expansión por cofactores (Laplace) |
| `compute` | Cálculo puntual de un elemento o de una columna |
| `normalize` | Normalización de un vector |
| `rotate` | Rotación de Jacobi |
| `iterate` | Una iteración de un método iterativo |

**Pasos de cierre**

| `type` | Cuándo |
|---|---|
| `final` | Resultado final |
| `unique` | El sistema tiene solución única |
| `infinite` | El sistema tiene infinitas soluciones |
| `incompatible` | El sistema es incompatible |

Los cuatro de cierre ya están en uso en `solveSystem` y se conservan tal cual.

### 3.4 Cambios de forma de retorno

| Función | Hoy | Pasa a |
|---|---|---|
| `determinantByCofactors` | `number` | `{ value, steps }` |
| `cofactorMatrix` | `Matrix` | `{ matrix, steps }` |
| `adjugate` | `Matrix` | `{ matrix, steps }` |
| `eigenvectors` | `Array<{lambda, vector}>` | `{ vectors, steps }` |
| `qrDecomposition` | `{ Q, R }` | `{ Q, R, steps }` |
| `choleskyDecomposition` | `{ L, Lt }` | `{ L, Lt, steps }` |
| `eigenvalues` | `{ values, method, hasComplexHint }` | `+ steps` |
| `eigenvaluesQR` | `{ values, matrixT, hasComplexHint }` | `+ steps` |
| `diagonalize` | `{ P, D, Pinv }` | `+ steps` |
| `conditionNumber` | `{ value, normA, normInverse }` | `+ steps` |
| `jacobiEigenDecomposition` | (según su firma actual) | `+ steps` |
| `luDecomposition` | `{L, U, P, steps}` sin `snapshot` | agrega `snapshot` |

`determinantByGauss`, `inverse`, `rowEchelon`, `reducedRowEchelon`, `rank` y
`solveSystem` no cambian de forma: ya cumplen.

### 3.5 División de `eigen.js`

`eigen.js` quedó en **480 líneas** contra el máximo de 500 de `AI_RULES.md` §10
(deuda D14). Agregarle los pasos de cuatro funciones lo pasa de largo, así que
se divide **por método**, que es la línea de corte natural y la que
`ENGINEERING_GUIDE.md` §3 pide (alta cohesión, una responsabilidad por archivo):

```
algebra/eigen.js          eigenvalues (despacho), eigenvectorFor,
                          eigenvectors, diagonalize
algebra/eigen-qr.js       eigenvaluesQR
algebra/eigen-jacobi.js   jacobiEigenDecomposition
algebra/eigen-2x2.js      eigenvalues2x2
```

`shared/math/index.js` sigue exportando exactamente los mismos nombres desde las
mismas rutas públicas, así que **para cualquier consumidor no cambia nada** — que
es justamente lo que `Architecture.md` §6 promete del punto único de entrada.
Cierra D14 y deja lugar para D13 (desplazamientos de Wilkinson) sin volver a
dividir.

### 3.6 Prueba de contrato

Se agrega `tests/math/steps-contract.test.js`, que recorre **todas** las
funciones alcanzadas por este ADR y verifica, de forma genérica:

1. El retorno es un objeto plano, no un número, un arreglo ni una `Matrix`.
2. Tiene `steps`, y es un arreglo.
3. Cada paso tiene `type` dentro del vocabulario de §3.3 y un `text` no vacío.
4. Si tiene `snapshot`, es un arreglo bidimensional de números finitos.

Es la prueba que impide que el contrato se desarme con la próxima función que
alguien agregue. Va en `tests/math/`, que es zona compartida del Chat 2
(`CHAT_ROLES.md` §4).

---

## 4. Ejecución en dos etapas

La división es deliberada y tiene una razón concreta: **congelar la forma antes
de llenar el contenido.**

### Paso 2c-1 — La forma

Los cambios de §3.4 (retornos), §3.5 (división de `eigen.js`), §3.6 (prueba de
contrato), más `API.md` y `Algorithms.md`. **Sin escribir ni un paso nuevo:** las
funciones que hoy no registran procedimiento devuelven `steps: []`.

Al terminar esta etapa, el contrato está congelado y **el Chat 3 puede empezar**:
un `steps: []` se renderiza como "esta operación todavía no muestra el
desarrollo", que es honesto y no bloquea nada.

### Paso 2c-2 — Los procedimientos

Llenar los pasos de las nueve funciones, por grupos:

1. `determinantByCofactors`, `cofactorMatrix`, `adjugate` — expansión de Laplace
2. `qrDecomposition`, `choleskyDecomposition` — construcción elemento a elemento
3. `eigenvalues`, `eigenvaluesQR`, `jacobiEigenDecomposition`, `eigenvectors`,
   `diagonalize`
4. `conditionNumber`

Puede repartirse en varias sesiones. Cada grupo entrega sus pasos, sus pruebas y
la documentación actualizada.

---

## 5. Consecuencias

**A favor**

- La Versión 3a puede igualar a la V1, que es la vara mínima para reemplazarla.
- La forma se congela una sola vez, y en el único momento en que no hay
  consumidores que arrastrar.
- La regla de `type` + `text` como mínimo suficiente desacopla al Chat 3 del
  Chat 2: puede construir el renderizador sin esperar a que los nueve
  procedimientos estén escritos.
- Cierra D14 con una división por responsabilidad, no por conveniencia.
- La prueba de contrato convierte "acordamos una forma" en algo que falla solo
  cuando alguien se desvía.

**En contra**

- Es la tercera sesión seguida de motor. El proyecto sigue sin nada que se pueda
  usar, y eso tiene un costo real de motivación que conviene nombrar en vez de
  ignorar. Se mitiga con la división en dos etapas: después de la 2c-1 —que es
  corta— la interfaz puede arrancar.
- Doce funciones cambian de forma de retorno. Las 306 pruebas se van a poner en
  rojo en bloque durante el trabajo, y eso es lo esperado, no una regresión.
- El vocabulario cerrado de `type` puede quedar corto cuando aparezcan métodos
  nuevos. Ampliarlo es una decisión de Chat 1 y una línea en este ADR; lo que no
  se admite es que una función invente un `type` por su cuenta.

**Impacto futuro**

- El contrato aplica a todo `shared/math/`, no solo a `algebra/`. Cuando
  `numerical/` o `interpolation/` quieran mostrar procedimiento —Newton-Raphson
  iteración por iteración es material didáctico evidente— usan esta misma forma,
  sin discutirla de nuevo.
- Queda establecido el patrón para casos así: **primero se congela la forma,
  después se llena el contenido**, para que el consumidor pueda arrancar contra
  un contrato estable aunque esté incompleto.
