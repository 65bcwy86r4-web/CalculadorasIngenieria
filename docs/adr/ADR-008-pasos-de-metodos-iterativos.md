# ADR-008 — Cuántos pasos emite un procedimiento, y de dónde sale ese número

- Fecha: 2026-09-23
- Estado: Aceptado
- Decide: Chat 1 (Arquitectura y Gobernanza), sobre la propuesta del Chat 2 y
  las mediciones de la parte B del Paso 2c-2

## 1. Contexto

ADR-007 fijó la **forma** de un paso y dejó abierta una pregunta que recién
apareció al escribir los procedimientos de verdad: **cuántos pasos emite una
función.**

Para Gauss la pregunta no existe: el método tiene un número natural de pasos y
se emiten todos. Para los métodos que no lo tienen, la respuesta estaba quedando
en manos de quien escribía cada función:

- `jacobiEigenDecomposition` pide **297 rotaciones en 15×15**. Una por paso son
  297 pasos y unos 0.75 MB de `snapshot`.
- `eigenvaluesQR` corre **500 iteraciones fijas**, sin criterio de corte. Las
  últimas 499 son indistinguibles entre sí.
- `choleskyDecomposition` calcula `n(n+1)/2` elementos: **120 en 15×15**.
- `cofactorMatrix` emite `n²`: 225 en 15×15, con menores de 196 celdas — es el
  caso que ya obligó a acotarla en la parte A.

Sin una regla, cada función resuelve esto sola y el número termina saliendo del
criterio de quien la escribió ese día. Es exactamente el problema que D23
señala sobre el tope de 60 pasos de la prueba de contrato: un número puesto a
ojo, que nadie sabe después de dónde salió ni con qué autoridad se cambia.

La pregunta que decide este ADR no es "cuántos pasos", entonces, sino **de dónde
tiene que salir ese número.**

## 2. Alternativas consideradas

**A — Un paso por unidad de trabajo, siempre.** Es la respuesta obvia y la que
ya usaban Gauss y la inversión.
*A favor:* ninguna regla que aprender; el procedimiento es el método.
*En contra:* no escala. 297 rotaciones de Jacobi no son un procedimiento, son un
volcado — el mismo diagnóstico que llevó a acotar `cofactorMatrix`. Y en
`eigenvaluesQR` es directamente falso que haya 500 unidades de trabajo
interesantes: hay una iteración que hace casi todo y 499 que confirman.

**B — Un tope fijo de pasos, igual para todas.** Cada función emite hasta N y
después corta.
*A favor:* simple de verificar; una sola constante.
*En contra:* el N es una elección arbitraria, que es precisamente lo que hay que
evitar. Y trunca por el lugar equivocado: cortar Jacobi en el paso 60 deja
afuera el final, que es donde la matriz efectivamente se vuelve diagonal.

**C — La densidad de pasos sale de la estructura del cálculo, no de un tope.**
Un paso por unidad cuando las unidades son `O(n)`; un paso por fila cuando son
`O(n²)`; y en lo iterativo, la primera iteración más un hito cada vez que el
residuo cruza un orden de magnitud.
*A favor:* el número no lo elige nadie — queda atado a la forma del algoritmo y,
en el caso iterativo, a `DEFAULT_TOLERANCE`, que ya es una constante documentada
del motor. Y los pasos que sobreviven son los que explican algo: el primero
muestra la mecánica, los hitos muestran la convergencia, el cierre muestra el
resultado.
*En contra:* hay que decidir, para cada función nueva, cuál de los tres casos
aplica. Es una decisión de una línea, pero es una decisión.

**D — Observar la convergencia y cortar cuando converge.** Emitir hasta que el
residuo baje del umbral y terminar ahí.
*A favor:* menos pasos todavía, y ninguno redundante.
*En contra:* **cambia el comportamiento del motor.** `eigenvaluesQR` corre 500
iteraciones fijas por decisión de ADR-005; convertirlo en un método con criterio
de corte es una modificación numérica disfrazada de mejora de presentación. El
procedimiento no puede alterar lo que se calcula.

## 3. Decisión

**Se adopta la opción C.**

| Si el trabajo del método es… | Se emite | Cantidad de pasos |
|---|---|---|
| `O(n)` unidades | uno por unidad | `n` |
| `O(n²)` unidades | uno por **fila** | `n` |
| iterativo | la primera iteración y un **hito** por cada orden de magnitud que baja el residuo | ~`log₁₀(residuo₀ / tolerancia)` |

Tres reglas que la acompañan y que son tan importantes como la tabla:

**3.1 Medir la convergencia no puede cambiarla.** El residuo se calcula para
narrar, nunca como criterio de corte. En `eigenvaluesQR` la norma subdiagonal
cuesta `O(n²)` contra el `O(n³)` de la factorización de esa misma iteración, y
la iteración sigue corriendo las 500 pase lo que pase. Es la línea que separa la
opción C de la D, y es la que hace que este ADR sea sobre presentación y no
sobre numérica.

**3.2 Cuando el método no converge, el cierre lo dice.** No se inventan hitos
sobre un residuo que no baja. La rotación de 90° y las simétricas con
autovalores de igual módulo dan tres pasos —apertura, primera iteración, y un
cierre que admite que no triangularizó y deriva a `eigenvalues`—, y eso es lo
correcto: un procedimiento honesto de tres pasos vale más que doce hitos falsos.

**3.3 La unidad se elige por lo que el estudiante lee, no por lo que el bucle
recorre.** En Cholesky la fila es la unidad natural porque `L` es triangular
inferior y cada fila se completa de una vez, terminando en su elemento diagonal.
Elegir la fila no es solo acotar de 120 a 15: es contar el método como se cuenta
en el pizarrón.

## 4. Consecuencias

**A favor.** El conteo deja de ser una elección de quien escribe la función.
Para una función nueva la pregunta es "¿de qué orden es el trabajo?", que tiene
una respuesta objetiva, en vez de "¿cuántos pasos me parecen muchos?", que no la
tiene. Y el resultado medido lo confirma: las cinco funciones de la parte B
entraron a la tabla de la prueba de contrato en 15×15 y **ninguna aparece en la
lista de excesos de D24** — la lista sigue siendo la de las nueve funciones de
Gauss e inversión, que son anteriores a esta regla.

**En contra.** Hay un juicio por función al clasificarla. Y la regla iterativa
produce una cantidad de pasos que depende de la entrada: una matriz que converge
rápido da menos hitos que una que converge lento. Es deseable —el procedimiento
refleja lo que efectivamente pasó— pero significa que el conteo no es predecible
desde la firma.

**Impacto futuro.** Esta regla no es sobre álgebra. El Paso 5 trae
`newtonRaphson`, `bisection`, `secant`, `simpson` y `trapezoidal`, que son
iterativos o de subdivisión, y les aplica la misma tabla: la fila iterativa a
los tres primeros, la fila `O(n)` a los dos últimos. **Es por eso que esto es un
ADR y no una nota de bitácora.** La regla se escribió resolviendo un problema de
autovalores, pero gobierna todo procedimiento que el motor emita de acá en
adelante.

**Lo que este ADR no decide.** El tope de 60 pasos de la prueba de contrato
sigue siendo D23 y sigue sin dueño: es una cota de producto, sobre cuánto lee
alguien, y sale del Chat 3 con el panel adelante. Este ADR decide la densidad
con la que un método emite; D23 decide cuánto tolera la interfaz. Que las nueve
funciones de D24 superen esa cota es un problema de las nueve, no de esta regla.
