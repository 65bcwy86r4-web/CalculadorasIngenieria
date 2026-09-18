# ADR-007 — Contrato de `steps`: forma de retorno del procedimiento

- **Fecha:** 2026-09-13
- **Estado:** Aceptado, con enmiendas del 2026-09-13 (§3.3) y del 2026-09-18 (§4)
- **Decide:** responsable del proyecto
- **Relacionado:** HANDOFF D15, D14, D16, ADR-006 (interfaz antes que port)

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

**Paso de cierre**

| `type` | Cuándo |
|---|---|
| `final` | Resultado final |

> ### Enmienda del 2026-09-13 — corrección de §3.3
>
> La versión original de esta tabla incluía `unique`, `infinite` e
> `incompatible` como tipos de paso, afirmando que "ya están en uso en
> `solveSystem`". **Era un error de relevamiento**, detectado por el Chat 2 al
> ejecutar el Paso 2c-1 y reportado como D16.
>
> Esos tres valores existen, pero como **discriminante del objeto de retorno**
> de `solveSystem` (`{ type: 'unique', solution, steps, ... }`), que es una cosa
> distinta de un paso del procedimiento. Ningún paso los lleva ni los llevó
> nunca. Verificado:
>
> ```
> solveSystem(A, b).type              -> "unique"
> solveSystem(A, b).steps[*].type     -> "elim", "scale", "swap", "info"
> ```
>
> Quedan **fuera** del vocabulario de pasos. Dos consecuencias, ambas para el
> Paso 2c-2:
>
> 1. **`solveSystem` cierra su procedimiento con un paso `final`** cuyo `text`
>    enuncia la clasificación ("El sistema es compatible determinado", etc.).
>    Hoy el procedimiento termina sin conclusión escrita: la clasificación solo
>    está en el objeto de retorno, así que quien lea únicamente el desarrollo no
>    la ve.
>
> 2. **El discriminante de `solveSystem` pasa a llamarse `classification`.**
>    Tener `result.type` y `step.type` con el mismo nombre y vocabularios
>    distintos, en dos objetos que una interfaz recorre en la misma función de
>    renderizado, es una confusión servida. Los valores no cambian
>    (`'unique' | 'infinite' | 'incompatible'`); cambia la clave. Es ruptura de
>    API, y por eso se hace ahora: sigue sin haber consumidores, y es el mismo
>    argumento de ADR-005 y ADR-006.

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

> ### Enmienda del 2026-09-18 — corrección de los grupos
>
> El Chat 2 relevó las funciones al arrancar el Paso 2c-2 y encontró que la
> agrupación de arriba no coincide con el motor. Verificado ejecutando:
>
> **Son once funciones con `steps: []`, no nueve.** A la lista de §1 se suman
> `eigenvaluesQR`, `jacobiEigenDecomposition` —que ya estaban contempladas en el
> grupo 3— y **`eigenvalues2x2`, que no figuraba en ningún grupo**. Es un olvido
> de esta tabla, no del motor: `eigenvalues2x2` **pertenece al grupo 3**, con el
> resto de la familia de autovalores.
>
> **El grupo 4 no está hecho, aunque lo parezca.** `conditionNumber` devuelve
> hoy pasos no vacíos, pero los **hereda de `inverse`** desde el Paso 2c-1, y
> describen la inversión, no el número de condición:
>
> ```
> conditionNumber([[4,7],[2,6]])  ->  value 10.5000
>   1. [elim]  F2 → F2 − (0.5000)·F1
>   2. [scale] F2 → F2 / (2.5000)
>   3. [elim]  F1 → F1 − (7.0000)·F2
>   4. [scale] F1 → F1 / (4.0000)
>   5. [final] Se obtuvo la identidad en el bloque izquierdo: el bloque derecho es A⁻¹.
> ```
>
> El procedimiento termina en la inversa y **nunca menciona las normas ni de
> dónde sale 10.5**. Pasa la prueba de contrato —tiene pasos, tipos válidos y
> textos no vacíos— y aun así deja al usuario sin la explicación que pidió. Es
> la clase de defecto que el contrato no puede atrapar: forma correcta,
> contenido equivocado.
>
> El grupo 4 consiste entonces en **agregar los pasos de cierre** que faltan
> —‖A‖_F, ‖A⁻¹‖_F y κ(A) como su producto— después de los heredados, no en
> escribir el procedimiento desde cero. Vale como regla general: **heredar los
> pasos de una función auxiliar no alcanza si el procedimiento resultante no
> explica la operación que se pidió.**

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
