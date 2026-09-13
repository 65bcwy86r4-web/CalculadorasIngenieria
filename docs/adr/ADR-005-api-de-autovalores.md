# ADR-005 — Nombres de la API de autovalores

- **Fecha:** 2026-09-13
- **Estado:** Aceptado
- **Decide:** responsable del proyecto
- **Relacionado:** ADR-004 (corrección de autovalores), HANDOFF D10

---

## 1. Contexto

ADR-004 dejó `shared/math/algebra/eigen.js` con despacho por tipo de matriz:
1×1 trivial, simétrica por Jacobi, 2×2 no simétrica por forma cerrada, general
por QR iterativo.

El despacho quedó **dentro de `eigenvaluesQR`**, por una razón concreta y
correcta en su momento: el hallazgo H-03 estaba fijado sobre una llamada directa
a esa función, y la contraprueba del Chat 5 exigía que `hasComplexHint` fuera
`false` para toda matriz simétrica. Las dos condiciones solo se cumplían con el
despacho adentro.

La consecuencia es que **el nombre miente**. `eigenvaluesQR` es el nombre de un
algoritmo, y la función ya no ejecuta ese algoritmo salvo en el caso general. El
propio Chat 2 lo reportó contra su propia entrega, como D10.

Además se perdió algo: hoy **no hay forma de pedir el QR explícitamente**. Para
una futura calculadora de métodos numéricos —que está en el roadmap, Versión 5—
poder mostrar el QR iterativo corriendo sobre una matriz simétrica, con sus
iteraciones y su convergencia, es exactamente el contenido didáctico que
justifica esa calculadora. Con el despacho adentro, esa matriz nunca llega al QR.

El momento de decidirlo es ahora: **no existe todavía ninguna calculadora que
consuma el motor**, así que el costo de ruptura es cero. Cada semana que pase,
sube.

---

## 2. Alternativas consideradas

**A. Dejarlo como está** y documentar en `API.md` que `eigenvaluesQR` despacha.
Cero trabajo. El nombre engañoso queda para siempre, y toda calculadora futura
lo hereda; el QR explícito sigue sin ser accesible.

**B. Renombrar a `eigenvalues`, con `eigenvaluesQR` como alias** del mismo
comportamiento. Resuelve la mitad: el nombre bueno existe, pero el alias sigue
mintiendo y el QR explícito sigue sin estar disponible.

**C. Separar los dos conceptos.** `eigenvalues` es la entrada recomendada y
despacha; `eigenvaluesQR` vuelve a ser lo que su nombre dice.

---

## 3. Decisión

**Se adopta la opción C.**

La API pública de autovalores queda así:

| Función | Qué hace |
|---|---|
| `eigenvalues(matrix, options)` | **Entrada recomendada.** Despacha al método adecuado según el tipo de matriz. Es lo que usa cualquier calculadora que solo quiera los autovalores. |
| `eigenvaluesQR(matrix, iterations)` | QR iterativo **explícito**, sin despacho, sobre cualquier matriz. Para mostrar ese algoritmo en particular. |
| `jacobiEigenDecomposition(matrix, options)` | Jacobi explícito, solo simétricas. |
| `eigenvalues2x2(matrix, tolerance)` | Forma cerrada explícita, solo 2×2. |

`eigenvectorFor`, `eigenvectors` y `diagonalize` no cambian de nombre ni de
firma, pero pasan a apoyarse en `eigenvalues`, no en `eigenvaluesQR`.

Cambios que arrastra, todos dentro de la zona del Chat 2:

- `shared/math/index.js`: se agrega `eigenvalues` a la superficie pública.
- `shared/math/physics/tensors.js`: `principalValues` y `principalDirections`
  pasan a llamar a `eigenvalues`. Es la única línea de ese archivo que cambia, y
  es lo que mantiene H-04 cerrado.
- `tests/math/algebra-eigen.test.js` y `physics.test.js`: las pruebas que hoy
  verifican el despacho se mudan a `eigenvalues`, y `eigenvaluesQR` recupera
  pruebas de QR puro —incluida la que documenta que **no** converge con
  autovalores de igual módulo, que ahora es comportamiento esperado del método,
  no un defecto.
- `docs/API.md` y `docs/Algorithms.md`: la tabla de arriba, y en `Algorithms.md`
  qué método se elige para qué matriz y por qué.

---

## 4. Consecuencias

**A favor**

- Cada nombre dice lo que hace. Un lector de `API.md` no necesita leer el
  código para saber qué algoritmo se ejecuta.
- El QR explícito vuelve a estar disponible, que es material didáctico real
  para la calculadora de métodos numéricos de la Versión 5.
- Se hace con costo de ruptura cero: no hay consumidores.
- `hasComplexHint` queda mejor definido: en `eigenvalues` es exacto para
  simétricas y 2×2; en `eigenvaluesQR` vuelve a ser lo que siempre fue, la
  heurística de la subdiagonal, y ahora eso es honesto porque la función se
  llama como el método que usa.

**En contra**

- Dos nombres parecidos conviven, y alguien puede llamar a `eigenvaluesQR`
  creyendo que es la entrada general. Se mitiga en `API.md`, marcando
  `eigenvalues` como la recomendada y `eigenvaluesQR` como método explícito con
  su limitación escrita al lado.
- Reabre, en `eigenvaluesQR`, el comportamiento que H-03 reportaba. **No es una
  regresión:** es la limitación real del algoritmo QR sin desplazamientos, ahora
  documentada y bajo un nombre que la anuncia. Queda como D13 la mejora de ese
  camino con desplazamientos de Wilkinson, que el Chat 2 ya había señalado como
  el más débil de los tres.

**Impacto futuro**

- El patrón queda establecido para el resto del motor: cuando un problema admite
  varios métodos, se expone **una entrada que elige** y **cada método por su
  nombre**. Aplica a lo que viene —`determinantByGauss` y `determinantByCofactors`
  ya siguen ese patrón sin una entrada que despache, y conviene revisarlo cuando
  una calculadora lo pida.
