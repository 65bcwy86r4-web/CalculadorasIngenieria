# HANDOFF.md

**Fuente de verdad operativa del proyecto.** Todo chat lo lee al empezar. El
responsable del proyecto lo actualiza al cerrar cada sesión de trabajo.

Última actualización: **2026-09-18**

- **Repositorio:** https://github.com/65bcwy86r4-web/CalculadorasIngenieria
- **Publicado en:** https://65bcwy86r4-web.github.io/CalculadorasIngenieria/
- **Carpeta local:** `Documents\Calculadoras Ingeniería`
- **Ramas:** se trabaja en `develop`. `main` queda estable y es la rama desde la
  que publica GitHub Pages: **el sitio no se actualiza hasta que `develop` se
  fusiona en `main`.**
- **Estado de publicación (2026-09-18):** `main` está en `b7076ac`, el commit de
  consolidación del 2026-09-12, **17 commits por detrás de `develop`**. Nada de
  lo hecho desde entonces —motor corregido, calculadora, estilos— está en la URL
  pública. Se resuelve fusionando `develop` en `main`.

---

## 1. Estado general

| Componente | Estado | Chat responsable |
|---|---|---|
| Motor `shared/math/` | Completo y documentado. 38 archivos. Cubierto por la suite. Sin hallazgos abiertos. 95 exportaciones públicas, sin altas ni bajas. **Procedimiento escrito en 16 de las 18 funciones alcanzadas por ADR-007** (Paso 2c-2 parte B, 2026-09-23); quedan `eigenvectors` y `diagonalize`. | 2 |
| `docs/` técnica | Architecture, API, Algorithms, Roadmap completos | 1 / 2 |
| `docs/governance/` | 4 documentos rectores, versión 1.0 | 1 |
| `tests/` | **329 pruebas en 17 archivos, todas pasan.** Pasos 1, 1b, 2a y 2c-1 cerrados. Incluye `steps-contract.test.js`. | 5 |
| `modules/` | **`algebra/` completa (Versión 3a, Paso 3).** 21 archivos, 27 operaciones, importando solo desde `shared/math/index.js`. Primer consumidor real de la API pública. Con estilos desde el Paso 3b. | 3 |
| `css/` | **Sistema de diseño completo (Paso 3b).** 5 archivos, ninguno por encima de las 500 líneas efectivas: `tokens.css` (tokens en tres capas, temas claro y oscuro con `light-dark()`), `base.css` (reset y tipografía), `components.css` (cáscara y controles), `results.css` (bloques de resultado, avisos y procedimiento) y `algebra.css` (lo específico del módulo). Todo par color/superficie medido ≥ 4.5:1. El 404 de `css/algebra.css` está cerrado | 4 |
| `assets/` | Vacío, y por ahora corresponde: el sistema usa stack de fuentes del sistema y no hay imágenes | 4 |
| `js/` | Vacío. Es el Paso 4 | 3 |
| `legacy/` | Congelado. No se importa desde ningún lado. | — |

**Versión del roadmap en curso:** Versión 3 en curso. La 3a está completa y
funcionando: la calculadora de álgebra consume el motor, con estilos, y se
verificó en navegador el 2026-09-18 —sin 404, sin errores de JavaScript,
`det([[4,7,2],[2,6,1],[1,1,3]]) = 25` con sus cuatro pasos—. Lo que falta de la
Versión 3 es la cáscara: dashboard, navegación, historial y favoritos (Paso 4).

---

## 2. Decisiones vigentes

| ADR | Decisión | Fecha |
|---|---|---|
| [ADR-001](adr/ADR-001-motor-canonico.md) | El motor canónico es el de la v2 (clase `Matrix`). Se portan capacidades puntuales desde el motor v1. | 2026-09-12 |
| [ADR-002](adr/ADR-002-ejecucion-esm.md) | ES Modules servidos por HTTP (servidor local + GitHub Pages). Se abandona la compatibilidad con `file://`. | 2026-09-12 |
| [ADR-003](adr/ADR-003-organizacion-chats.md) | El trabajo se reparte en 5 chats por capa arquitectónica. | 2026-09-12 |
| [ADR-004](adr/ADR-004-correccion-autovalores.md) | H-03 se corrige portando Jacobi y el 2×2 analítico desde `legacy/`, no parcheando el QR. `eigen.js` se toca una sola vez. | 2026-09-13 |
| [ADR-005](adr/ADR-005-api-de-autovalores.md) | `eigenvalues` es la entrada que despacha; `eigenvaluesQR` vuelve a ser el QR explícito. Cada nombre dice su método. | 2026-09-13 |
| [ADR-006](adr/ADR-006-interfaz-antes-que-port.md) | La calculadora de álgebra (Paso 3) va antes que el resto del port. Una capacidad del motor se escribe cuando una calculadora la pide. | 2026-09-13 |
| [ADR-007](adr/ADR-007-contrato-de-steps.md) | Contrato único de `steps`: forma del paso, vocabulario cerrado de `type`, y `type`+`text` como mínimo suficiente para renderizar. Se congela la forma antes de llenar el contenido. **Enmendado el 2026-09-13** (§3.3, D16) y el **2026-09-18** (§3.2 qué puede ser un `snapshot`; §3.2 un solo paso `final`, D22; §3.6 límites de la prueba de contrato). | 2026-09-13 |

---

## 3. Trabajo en curso

| Chat | Tarea | Estado |
|---|---|---|
| 2 | Paso 1b: corregir H-01 a H-05, con H-03 resuelto según ADR-004 | **Cerrado el 2026-09-13** |
| 2 | Paso 2a: refactores de nombres (ADR-005, D3, D12) | **Cerrado el 2026-09-13** |
| 2 | Paso 2c-1: congelar el contrato de `steps` (ADR-007) | **Cerrado el 2026-09-13** |
| 3 | Paso 3: calculadora de álgebra en `modules/algebra/` (Versión 3a) | **Cerrado el 2026-09-13** |
| 4 | Paso 3b: sistema de diseño y estilos de la calculadora | **Cerrado el 2026-09-14** |
| 3 | Paso 3c: ganchos de estado para el panel (pedido del Chat 4) | Aprobado el 2026-09-14, no bloquea al 3b |
| 2 | Paso 2c-2 **parte A**: enmiendas de ADR-007 (D16), D17, grupo 1 y grupo 4 | **Cerrada el 2026-09-18**, verificada por el Chat 1 |
| 2 | D24 (a): la cota de legibilidad se mide ahora al tamaño máximo del selector | **Cerrada el 2026-09-23.** La suite queda con 1 prueba en rojo **a propósito**: ver §5, D24 |
| 2 | Paso 2c-2 **parte B**: grupo 2 y los tres métodos de autovalores | **Cerrada el 2026-09-23** |
| — | — | Ninguna otra sesión abierta |

**Siguientes, independientes entre sí:** el **Paso 2c-2 parte B** (Chat 2) y el
**Paso 3c** (Chat 3). Ninguno bloquea al otro y las zonas no se tocan, así que
el orden lo elige el responsable del proyecto.

**Para el Chat 3, cuando le toque:** `solveSystem` ya devuelve `classification`.
La función `classificationOf` de `modules/algebra/operations/system-ops.js`
—que hoy lee `outcome.classification ?? outcome.type`— puede reducirse a una
línea. La calculadora funciona igual antes y después; no es urgente.

Verificación del 2026-09-18, sobre `7d10dd3`: **313 pruebas en verde** y la
calculadora funcionando en navegador. Es el estado que se llevó a `main`.

**Verificación independiente del Paso 2c-2 parte A, Chat 1, sobre `f8589aa`.**
329 pruebas en verde. Contra un recálculo propio, fuera del motor: los cofactores
de 6×6, 7×7 y 8×8 coinciden con el desarrollo por menores hasta el redondeo, o
sea que **la cota de 6×6 acorta el relato y no toca el número**; `adjugate`
cumple `adj(A) = det(A)·A⁻¹` exactamente en 3×3, 7×7 y 10×10; el cierre de
`conditionNumber` multiplica los dos factores que muestra y da el `value` que
devuelve, en cuatro matrices distintas. `spline.js` lee `classification` y la
interpolación vuelve a dar los valores correctos. El ejemplo del JSDoc de
`solveSystem` es `(2.2, 3.6)`: reemplazado en el sistema, da `(8, 13)`. Los 10
tipos del vocabulario, verificados función por función, sin ninguno fuera de
lista. **Un hallazgo, anotado como D24.**

Los cuatro archivos viejos de `shared/math/errors/` se borraron y el Paso 2a
quedó commiteado en `develop` el 2026-09-13. Verificado contra el repositorio
remoto: git sigue solo los cuatro nombres en kebab-case, sin rastro de los
PascalCase — que es el error clásico al renombrar desde Windows, donde el
sistema de archivos no distingue mayúsculas y git puede quedar seguiendo las dos
versiones.

---

## 4. Próximas tareas, en orden

### Paso 1 — Suite de pruebas del motor · Chat 5 · ~~siguiente~~ **cerrado el 2026-09-13**

281 pruebas en 16 archivos, sin dependencias externas. `node tests/run.js` es
desde ahora la compuerta de toda PR (`CODING_STANDARDS.md` §17). Detalle en la
bitácora, §6.

### Paso 1b — Corregir los hallazgos del motor · Chat 2 · ~~siguiente~~ **cerrado el 2026-09-13**

Los cinco se cerraron. `known-defects.test.js` quedó vacío y la verificación
correcta se mudó a los archivos que corresponden. Detalle en la bitácora, §6.

**El Paso 2 pasa a ser el siguiente**, ya sin los dos ítems de autovalores de
ADR-001 §5, que se adelantaron acá por ADR-004.

**Cómo se corrige H-03 está decidido en [ADR-004](adr/ADR-004-correccion-autovalores.md):
portando `jacobiEigenDecomposition` y `eigenvalues2x2` desde `legacy/motor-v1/`,
no parcheando el QR.** `eigen.js` queda con despacho por tipo de matriz —2×2
analítico, simétrica por Jacobi, general por QR— y se toca una sola vez. Eso
adelanta además dos ítems de prioridad alta de ADR-001 §5, que salen del Paso 2.

| # | Qué | Dónde | Estado |
|---|---|---|---|
| H-03 | `eigenvaluesQR` devuelve `[0, 0]` y marca `hasComplexHint` en matrices simétricas con autovalores ±λ. La iteración QR sin desplazamiento no converge con autovalores de igual módulo | `shared/math/algebra/eigen.js` | **Cerrado** |
| H-04 | `vonMisesStress` devuelve 0 en corte puro, donde corresponde √3·τ. Es H-03 propagado: un resultado equivocado que subestima la solicitación, sin excepción ni aviso | `shared/math/physics/tensors.js` (causa en `eigen.js`) | **Cerrado** |
| H-05 | `cofactorMatrix` y `adjugate` lanzan `DimensionError` con una matriz 1×1; corresponde `[[1]]`. El caso base no está contemplado | `shared/math/algebra/inverse.js` | **Cerrado** |
| H-01 | Factor del nudo truncado: `0.514444444` en vez de `1852/3600` exacto (desvío 8.6e-10 relativo) | `shared/math/units/speed.js` | **Cerrado** |
| H-02 | `mmHg` e `inHg` no son mutuamente consistentes: 1 inHg da 25.4000064 mmHg y debería dar 25.4 exactos | `shared/math/units/pressure.js` | **Cerrado** |

Al cerrar cada hallazgo, la prueba correspondiente de `known-defects.test.js`
falló, que es la señal prevista. Las cuatro se borraron de ahí y la
verificación correcta quedó en `algebra-eigen.test.js`, `physics.test.js`,
`algebra-determinant.test.js` y `units.test.js`.

*Se adelanta al port porque son cinco arreglos acotados sobre archivos que el
port va a tocar igual, y porque H-04 es un resultado silenciosamente
incorrecto en un caso de uso central de la carrera.*

### Paso 2a — Refactores de nombres · Chat 2 · ~~siguiente~~ **cerrado el 2026-09-13**

Sesión corta, sin capacidades nuevas. Tres cosas que hay que hacer **antes** de
que exista un consumidor del motor, porque después cuestan mucho más
([ADR-006](adr/ADR-006-interfaz-antes-que-port.md) §3):

1. **API de autovalores**, según [ADR-005](adr/ADR-005-api-de-autovalores.md):
   `eigenvalues` pasa a ser la entrada que despacha y `eigenvaluesQR` vuelve a
   ser el QR explícito. Arrastra una línea en `physics/tensors.js`, la
   reescritura de las pruebas de despacho y la actualización de `API.md` y
   `Algorithms.md`.
2. **D3**: renombrar los cuatro archivos de `shared/math/errors/` a kebab-case
   (`math-error.js`, `dimension-error.js`, `singular-matrix-error.js`,
   `interpolation-error.js`), cumpliendo `CODING_STANDARDS.md` §2 tal como está
   escrito, y actualizar todos los imports.
3. **D12**: agregar `hPa` al catálogo de `units/pressure.js`.

Los tres hechos. La suite pasó de 298 a **306 pruebas, todas en verde**.
Detalle en la bitácora, §6.

**El Paso 3 pasa a ser el siguiente.**

### Paso 2c-1 — Congelar el contrato de `steps` · Chat 2 · ~~siguiente~~ **cerrado el 2026-09-13**

Sesión corta. Los cambios de forma de [ADR-007](adr/ADR-007-contrato-de-steps.md)
§3.4, la división de `eigen.js` de §3.5, la prueba de contrato de §3.6, y
`API.md` y `Algorithms.md`. **Sin escribir ningún paso nuevo:** las funciones que
hoy no registran procedimiento devuelven `steps: []`.

Hecho. La suite pasó de 306 a **313 pruebas, todas en verde**, con
`steps-contract.test.js` como prueba nueva. Detalle en la bitácora, §6.

Cerró D14 con la división por método: `eigen.js` (233 líneas),
`eigen-jacobi.js` (201), `eigen-2x2.js` (91) y `eigen-qr.js` (84).

### Paso 2c-2 — Escribir los procedimientos · Chat 2 · **parte A cerrada el 2026-09-18; sigue la parte B**

> **Corrección del 2026-09-18 (Chat 1), tras el relevamiento del Chat 2:** son
> **once** funciones con `steps: []`, no nueve; `eigenvalues2x2` faltaba en los
> grupos y va al **grupo 3**; y el **grupo 4 no está hecho** — `conditionNumber`
> hereda los pasos de `inverse`, que describen la inversión y no dicen de dónde
> sale κ(A). Detalle y evidencia en la enmienda de
> [ADR-007](adr/ADR-007-contrato-de-steps.md) §4.

Se ejecuta en dos partes.

**Parte A — cerrada el 2026-09-18.** Las dos consecuencias de la enmienda de
[ADR-007](adr/ADR-007-contrato-de-steps.md) §3.3 (D16), la corrección de D17, el
grupo 1 y el grupo 4. Detalle en la bitácora, §6.

- ~~`solveSystem` cierra su procedimiento con un paso `final` que enuncia la
  clasificación del sistema.~~ **Hecho.**
- ~~Su discriminante de retorno pasa de `type` a `classification`.~~ **Hecho.**
  Alcanzó también a `interpolation/spline.js`, que lo consumía internamente y no
  estaba relevado.
- ~~Grupo 1: expansión de Laplace.~~ **Hecho**, con el desarrollo de
  `cofactorMatrix` acotado a 6×6 (ver la bitácora).
- ~~Grupo 4: los pasos de cierre de `conditionNumber`.~~ **Hecho.**

**Parte B — siguiente.** Los grupos 2 y 3: `qrDecomposition`,
`choleskyDecomposition` y las cinco de autovalores, con `eigenvalues2x2`
incluida. Arranca resolviendo una decisión que la parte A dejó planteada a
propósito: **cuántos pasos emite un método iterativo.** `eigenvaluesQR` corre
500 iteraciones fijas y Jacobi hasta 1000 rotaciones; un paso por iteración es
ilegible para el usuario e inaceptable para la suite. El Chat 2 trae dos o tres
opciones con sus costos medidos; no se resuelve sobre la marcha.

#### Los cuatro grupos

Llenar los pasos de las nueve funciones que hoy devuelven `steps: []`, por los
cuatro grupos de [ADR-007](adr/ADR-007-contrato-de-steps.md) §4. Puede repartirse
en varias sesiones y **puede correr en paralelo con el Paso 3**, porque el
contrato ya está congelado y las zonas no se tocan.

### Paso 3 — Versión 3a: calculadora de álgebra sobre el motor · Chat 3 + 4 · ~~siguiente~~ **la parte del Chat 3, cerrada el 2026-09-13**

Reescribir la calculadora de álgebra en `modules/algebra/`, importando
exclusivamente desde `shared/math/index.js`. Es la prueba de fuego de la API
pública: si aparece la necesidad de una función que no existe, es señal de que
algo quedó mal cubierto en la Versión 2 (`Roadmap.md`, Versión 3).

Referencia funcional: `legacy/calculadora-algebra-v1/`, que tiene **27**
operaciones —no 25, ver la bitácora—, procedimiento paso a paso, historial,
exportación, pegado desde planilla y atajos de teclado. Es referencia de **qué**
hace, no de **cómo** está escrito.

Hecho: 21 archivos, las 27 operaciones, **sin un solo pedido al motor**. La API
pública alcanzó tal cual está. Detalle en la bitácora, §6.

**Falta la mitad del Chat 4**, que es lo que sigue de este paso:

### Paso 3b — Sistema de diseño y estilos de la calculadora · Chat 4 · ~~siguiente~~ **cerrado el 2026-09-14**

Los cuatro archivos escritos y verificados en navegador. El 404 de
`css/algebra.css` está cerrado. Detalle en la bitácora, §6.

*Propuesto por el Chat 3, **confirmado por el Chat 1 el 2026-09-14**, con el
alcance ampliado y precisado abajo tras la consulta del Chat 4.*

`modules/algebra/index.html` sale con clases semánticas y **sin hoja de
estilos**: enlaza `css/algebra.css`, que todavía no existe, así que hoy la
calculadora funciona pero se ve sin formato y da 404 en cada carga. El contrato
de clases —qué genera el JavaScript y qué estructura esperar en cada panel—
está escrito como comentario al principio de ese `index.html`.

**El sistema de diseño de la plataforma y los estilos de la calculadora son un
solo paso, y el sistema se extrae de la calculadora, no se diseña en el aire.**
Es [ADR-006](adr/ADR-006-interfaz-antes-que-port.md) aplicado a CSS: una
capacidad se escribe cuando hay algo concreto que la pide. Un sistema de diseño
construido para "decenas de calculadoras" que todavía no existen repetiría
exactamente el error que costó cuatro sesiones corregir en el motor.

La calculadora de álgebra es buena base para extraerlo porque ya ejercita casi
todas las primitivas visuales que la plataforma va a necesitar: grilla de
entrada de matrices, seis tipos de bloque de resultado (`matrix`, `scalar`,
`vector`, `pairs`, `text`, `flags`), lista de pasos con matriz opcional, cajón
de historial, superposición modal, avisos, menú lateral de 27 ítems y barra de
exportación.

Reparto de archivos en `css/`, para que el sistema no nazca atado al álgebra:

| Archivo | Qué lleva |
|---|---|
| `tokens.css` | Color, tipografía, espaciado, radios, sombras. Sin selectores de componente |
| `base.css` | Reset, tipografía base, temas claro y oscuro |
| `components.css` | Lo reutilizable entre calculadoras: botones, paneles, tablas, campos, avisos |
| `algebra.css` | Únicamente lo específico de esta calculadora |

Reglas del paso:

- **Los nombres de clase del HTML son el contrato.** El Chat 4 los lee de
  `modules/algebra/index.html` y de `modules/algebra/view/`; no los renombra. Si
  le falta un gancho, se lo pide al Chat 3 (`CHAT_ROLES.md` §5) en vez de tocar
  el HTML que genera el JavaScript.
- **`.step-snapshot` es opcional.** La mayoría de los pasos no lo trae y el
  diseño no puede depender de que esté.
- **Nueve operaciones muestran hoy "sin desarrollo disponible"** hasta que cierre
  el Paso 2c-2. Ese estado tiene que verse deliberado, no roto.
- **Se verifica mirando**, no leyendo el CSS: sirviendo el proyecto y abriéndolo
  en un navegador, en los dos temas y también a ~400 px de ancho.

### Paso 3c — Ganchos de estado para el panel · Chat 3 · *pedido del Chat 4, aprobado por el Chat 1 el 2026-09-14*

`view/steps-view.js` renderiza **tres estados distintos con la misma clase**
`.panel-empty` (líneas 155-160, `renderMessage`), y `view/history-view.js` la usa
para un cuarto (historial vacío). Lo único que los diferencia es el texto, así
que desde CSS no se pueden distinguir.

No es cosmético: el usuario no tiene cómo saber si a una operación le falta el
desarrollo **porque todavía no se escribió** (vuelve más adelante y va a estar) o
**porque no aplica** (no va a estar nunca). Son dos mensajes con consecuencias
opuestas y hoy se ven idénticos.

Cambio pedido, mínimo y sin tocar estructura ni lógica: un parámetro más en
`renderMessage(container, message, modifier)`, y el `className` pasa a
`panel-empty panel-empty--${modifier}`.

| Modificador | Mensaje |
|---|---|
| `--placeholder` | `PLACEHOLDER_MESSAGE` — todavía no calculaste nada |
| `--pending` | `EMPTY_CONTRACT_MESSAGE` — el motor no escribió el desarrollo (Paso 2c-2) |
| `--unavailable` | `NOT_APPLICABLE_MESSAGE` — la operación no lleva desarrollo (D18) |
| `--history` | historial vacío (`history-view.js:74`) |

El Chat 4 escribe el CSS de los cuatro desde ya; hasta que esto se aplique, los
cuatro caen en el estilo base.

**Invariante para después:** cuando cierre el Paso 2c-2, `--pending` no debería
tener ningún usuario en `algebra`. Si todavía lo tiene, algo del 2c-2 no cerró.

Aprovechá para corregir una omisión del contrato de clases: el comentario de
`modules/algebra/index.html` no lista `.print-document`, que arma
`services/exporters.js` dentro de `#printArea`. Detectada por el Chat 4 al
contrastar el comentario contra el código.

### Paso 2b — El resto del port desde el motor v1 · Chat 2

Lo que quedó de ADR-001 §5 —mínimos cuadrados por QR, spline reutilizable,
`solveLU`, `solveCholesky`, `numericalDerivative` (que cierra D4), coeficientes
de Lagrange y el grupo de prioridad baja—, **cuando una calculadora lo
necesite**, no por completitud (ADR-006). Al cerrarlo se elimina
`legacy/motor-v1/` y se cierra D2.

### Paso 4 — Versión 3b: dashboard, routing, historial, favoritos · Chat 3 + 4

### Paso 5 — Versión 5 temprana: ISA y Métodos Numéricos · Chat 3

Adelantadas respecto del roadmap a propósito: el motor las cubre al 100% sin
agregar una sola función, así que son interfaz pura y validan que la
arquitectura cumple lo que promete. Los gráficos de la Versión 4 son bastante
más trabajo.

---

## 5. Deuda técnica conocida

| # | Tema | Dónde | Prioridad |
|---|---|---|---|
| ~~D1~~ | ~~No hay suite de pruebas en el repo~~ | `tests/` | **Resuelta el 2026-09-13** |
| D2 | Capacidades del motor v1 aún no portadas. **Los dos ítems de autovalores de prioridad alta —`jacobiEigenDecomposition` y `eigenvalues2x2`— se portaron el 2026-09-13**; queda el resto de ADR-001 §5 | ADR-001 §5 | Media |
| ~~D3~~ | ~~Nombres de archivo en PascalCase en `shared/math/errors/`~~ | `shared/math/errors/` | **Resuelta el 2026-09-13** (Paso 2a) |
| D4 | `DEFAULT_DERIVATIVE_STEP` se exporta desde `utils/constants.js` pero no existe una `numericalDerivative` pública que la use; hoy la derivada numérica está embebida en `newton.js` | `shared/math/` | Media |
| D5 | Aritmética compleja ausente: bloquea análisis de circuitos de corriente alterna y autovalores complejos | `Roadmap.md`, Versión 5 | Baja — planificada |
| ~~D6~~ | ~~Sin repositorio git inicializado~~ | — | **Resuelta el 2026-09-13** |
| ~~D7~~ | ~~`vincular-github.ps1` y `VINCULAR-GITHUB.bat` en la raíz~~ | — | **Resuelta el 2026-09-13** (commit `52dcf14`) |
| D8 | Los ejemplos de `toScientific` y `formatNumber` en `docs/API.md` contradicen el comportamiento real y el nombre del propio parámetro `significantDigits`. El código está bien; la documentación, no | `docs/API.md` | Baja — Chat 2 |
| D9 | `cubicSplineInterpolate` tiene 54 líneas de código efectivas, por encima del máximo de 50 de `AI_RULES.md` §10, sin la justificación técnica que ese artículo exige | `shared/math/interpolation/spline.js` | Baja |
| ~~D10~~ | ~~`eigenvaluesQR` ya no siempre usa QR~~ | `shared/math/`, `docs/API.md` | **Resuelta el 2026-09-13** (Paso 2a, según ADR-005) |
| ~~D12~~ | ~~Falta `hPa` en el catálogo de presión~~ | `shared/math/units/pressure.js` | **Resuelta el 2026-09-13** (Paso 2a) |
| ~~D16~~ | ~~`unique`/`infinite`/`incompatible` en el vocabulario de pasos~~ | — | **Resuelta el 2026-09-13.** El Chat 2 tenía razón: era un error de relevamiento del ADR-007. Corregido por la enmienda de ADR-007 §3.3; las dos consecuencias van al Paso 2c-2 |
| D13 | El camino QR general sigue sin desplazamientos de Wilkinson: no converge con autovalores de igual módulo. Con ADR-005 dejó de ser un defecto oculto —`eigenvalues` no lo usa para simétricas y `eigenvaluesQR` lo anuncia, con una prueba que lo fija como comportamiento esperado— pero sigue siendo el más débil de los tres métodos | `shared/math/algebra/eigen.js` | Baja |
| ~~D14~~ | ~~`eigen.js` cerca del máximo de 500 líneas de `AI_RULES.md` §10~~ | `shared/math/algebra/` | **Resuelta el 2026-09-13** (Paso 2c-1, división por método de ADR-007 §3.5) |
| D15 | **Resuelto por [ADR-007](adr/ADR-007-contrato-de-steps.md) el 2026-09-13**; se ejecuta en los Pasos 2c-1 y 2c-2. El contrato de `steps` no es uniforme: 7 funciones de álgebra devuelven `{type, text, snapshot}`, `luDecomposition` devuelve `{type, text}` sin `snapshot`, y 9 no devuelven `steps` (`determinantByCofactors`, `adjugate`, `cofactorMatrix`, `qrDecomposition`, `choleskyDecomposition`, `eigenvalues`, `eigenvectors`, `diagonalize`, `conditionNumber`). Además el dato principal se llama distinto en cada una (`value`, `result`, `inverse`, `rank`, `solution`, `values`, `L/U/P`...). La V1 mostraba el procedimiento de las 25 operaciones; con esto la Versión 3a no puede igualarla en 9. Detectado en el relevamiento previo al Paso 3 | `shared/math/algebra/`, `docs/API.md` | **Media — la forma está congelada (Paso 2c-1, 2026-09-13); falta el contenido (Paso 2c-2)** |
| ~~D17~~ | ~~`docs/API.md` listaba 13 tipos de paso donde el ADR enmendado tiene 10~~ | `docs/API.md` | **Resuelta el 2026-09-18** (Paso 2c-2 parte A). Aparecía también en `tests/math/steps-contract.test.js`, que fijaba `length === 13`: la prueba de contrato aceptaba un paso con `type: 'unique'` sin chistar. Corregido en los dos lugares |
| D18 | Los métodos de la clase `Matrix` quedan fuera del contrato de `steps`: `transpose`, `trace`, `add`, `subtract`, `multiply`, `scalarMultiply`, `power`, `frobeniusNorm`, las cinco de clasificación y los constructores `identity`/`diagonal` devuelven una `Matrix` o un número pelados, sin clave `steps` —ni siquiera vacía—. No es un defecto: ADR-007 §3.4 no los alcanza. Pero son **12 de las 27 operaciones** de la calculadora, que quedan sin desarrollo posible, y la V1 sí mostraba procedimiento para varias (por ejemplo, el producto elemento a elemento). Si se quiere que lo tengan, es decisión del Chat 1 y trabajo del Chat 2. La interfaz ya las distingue de las que tienen `steps: []` | `shared/math/algebra/matrix.js`, ADR-007 | Baja — decidir en Chat 1 |
| D11 | `known-defects.test.js` quedó vacío (0 pruebas, el archivo con su explicación intacta) para que el próximo hallazgo tenga dónde anotarse. Si el Chat 5 prefiere borrarlo y recrearlo cuando haga falta, hay que sacarlo también de la estructura de `tests/README.md`, que es su zona | `tests/math/`, `tests/README.md` | Baja — decidir en Chat 5 |
| D22 | **Invariante que no está en ADR-007 y conviene que esté:** a lo sumo un paso `final` por procedimiento, y es el último. Apareció al encadenar pasos en el Paso 2c-2: cuando una función hereda el procedimiento de una auxiliar y agrega su propio cierre, el `final` heredado deja de ser final, y sin degradarlo la interfaz no puede distinguir cuál es la conclusión. El motor ya lo cumple —`adjugate` y `conditionNumber` degradan a `info` lo que heredan— y `steps-contract.test.js` lo verifica, pero es una regla de contrato que decidió el Chat 2 sobre la marcha. **Resuelta por el Chat 1 el 2026-09-18: incorporada al contrato** como segunda enmienda de ADR-007 §3.2, con "a lo sumo uno" y no "exactamente uno" —`rank`, `rowEchelon`, `reducedRowEchelon` y `luDecomposition` no cierran y no tienen por qué—, y agregada como punto 5 de §3.6 | `docs/adr/ADR-007` | ~~Media~~ **cerrada** |
| D23 | La prueba de contrato fija un tope de 60 pasos por procedimiento como cota de legibilidad. El número es una elección del Chat 2, no una decisión de producto: sale de que `cofactorMatrix` acotada a 6×6 da 38 pasos y de que algo del orden de dos pantallas parece el límite de lo que alguien lee. Si el Chat 3 o el Chat 4 tienen un criterio mejor desde la interfaz —por ejemplo, paginar el panel en vez de acotar el motor—, este número debería salir de ahí y no de acá. **Ruling del Chat 1 el 2026-09-18:** el 60 queda como está mientras tanto —es una cota razonable y no vale la pena discutirla en abstracto—, pero **no se promueve a regla del contrato ni entra a ADR-007**: es una decisión de producto y se decide cuando el Chat 3 arme el panel de procedimiento con datos reales, no antes. Lo que sí se corrige ahora es D24, que es otra cosa | `tests/math/steps-contract.test.js` | Baja — revisar con Chat 3 en el Paso 3c/4 |
| D24 | **La cota de legibilidad no está donde dice estar.** La prueba de contrato afirma que "ningún procedimiento se pasa de largo", pero recorre su tabla con matrices de 2×2 y 3×3 para todo salvo `cofactorMatrix`, así que verifica la cota únicamente para la función que Chat 2 acotó. Medido sobre el motor tal como está, con el tamaño que el selector permite (`MAX_SIZE = 15`): `inverse` da 61 pasos en 8×8 y **218 en 15×15**; `adjugate`, 219; `solveSystem`, 218; `reducedRowEchelon`, 217; `conditionNumber`, 222; `determinantByGauss`, 103. Las seis son operaciones que la calculadora ofrece hoy. No es una regresión del Paso 2c-2 —el crecimiento de `inverse` y `rref` es anterior— sino una prueba que asegura una propiedad que el motor no tiene. Dos cosas a resolver por separado: **(a)** la prueba debe correr la cota contra 15×15 en las funciones que crecen con el tamaño, no contra 3×3, y **(b)** una vez que falle, la decisión de qué hacer con esos 218 pasos —acotar el motor, paginar el panel, o mostrarlos— es la de D23 y sale del Chat 3. **(a) hecha el 2026-09-23 (Chat 2):** la tabla de `steps-contract.test.js` corre ahora en 15×15 toda función cuyo procedimiento crece con el tamaño, y `determinantByCofactors` en 7×7, que es su máximo alcanzable. **La prueba falla, y tiene que seguir fallando hasta que se resuelva (b)** — no se acotó ninguna función para que pase. Medición al 2026-09-23, con matriz diagonal dominante de orden 15:

| Función | Pasos | Celdas de snapshot | JSON |
|---|---|---|---|
| `conditionNumber` | 224 | 99 225 | 1.13 MB |
| `adjugate` | 221 | 98 775 | 1.13 MB |
| `inverse` | 220 | 98 550 | 1.12 MB |
| `solveSystem` | 220 | 52 560 | 0.50 MB |
| `reducedRowEchelon` | 219 | 49 275 | 0.45 MB |
| `luDecomposition` | 105 | 23 625 | 0.28 MB |
| `determinantByGauss` | 103 | 22 950 | 0.28 MB |
| `rowEchelon` / `rank` | 102 | 22 950 | 0.28 MB |

**El número que importa no es el de pasos sino el de celdas:** un procedimiento de `inverse` en 15×15 son 1.12 MB de JSON, casi todo `snapshot`. Los conteos difieren en ±2 pasos según la matriz (el Chat 1 midió 218 donde acá dan 220): depende de cuántos intercambios de fila pida el pivoteo | `tests/math/steps-contract.test.js`, `shared/math/algebra/inverse.js`, `gauss.js` | **(a) resuelta el 2026-09-23** — (b) abierta, con D23 |
| D19 | `css/algebra.css` encadena `tokens.css`, `base.css` y `components.css` con `@import`, que los descarga en serie. Se hizo así porque `modules/algebra/index.html` enlaza una sola hoja y ese archivo es del Chat 3: evitar un pedido de cambio de HTML por algo que el CSS resuelve solo. Cuando el Paso 4 arme la cáscara compartida, el HTML debería enlazar las cuatro hojas en paralelo y estos `@import` desaparecer | `css/algebra.css`, `modules/*/index.html` | Baja — Paso 4 |
| D20 | En pantallas angostas el menú lateral no puede ser un cajón superpuesto. El único estado que le pone el JavaScript es `.is-hidden` (`app.js:408`) y su ausencia significa "visible", así que un cajón arrancaría abierto tapando la pantalla en cada carga. Queda resuelto como tira desplegable en el flujo, con altura acotada y desplazamiento propio: utilizable, pero come 15 rem de alto arriba del contenido. Un cajón de verdad necesita un segundo estado del Chat 3 (`.sidebar.is-open`, cerrado por defecto bajo cierto ancho). **Evidencia:** `components.css` §13 y `app.js:408`. **Confirmada por el Chat 1 el 2026-09-18:** el segundo estado se agrega en el Paso 4, junto con la cáscara, no antes — el cajón pertenece a la navegación de la plataforma y hacerlo ahora dentro de una calculadora lo ataría al módulo equivocado | `modules/algebra/app.js`, `css/components.css` | Media — Paso 4 |
| D21 | No hay interruptor de tema. Los temas funcionan por `prefers-color-scheme` y `tokens.css` deja listos los ganchos `[data-theme="light"]` y `[data-theme="dark"]` en `<html>`, pero nada los escribe. Quien tenga el sistema operativo en claro no puede ver el tema oscuro y viceversa. El control es zona del Chat 3 y pertenece a la cáscara del Paso 4, no a esta calculadora | `js/`, `index.html` | Baja — Paso 4 |

---

## 6. Bitácora

### 2026-09-23 — Procedimientos del motor, parte B (Paso 2c-2) · Chat 2

**Resumen.** Cinco funciones más con procedimiento escrito: el grupo 2
—`qrDecomposition` y `choleskyDecomposition`— y los tres métodos de
autovalores: `eigenvalues2x2`, `eigenvaluesQR` y `jacobiEigenDecomposition`.
`eigenvalues` pasa a traer desarrollo sin tocarla, porque hereda el del método
que despacha.

Quedan dos con `steps: []`: `eigenvectors` y `diagonalize`. Son las que
**componen** en vez de calcular, y ahí manda D22 —`diagonalize` hereda de dos
lados a la vez—, que es un problema distinto del que resolvió esta sesión.

La suite pasó de **329 a 342 pruebas**: 341 en verde y el rojo intencional de
D24, que no se tocó.

**Arquitectura.** La decisión de fondo era **cuántos pasos emite un método
iterativo** (opción C, aprobada el 2026-09-23). Lo que se implementó:

| Si el trabajo es… | Se emite | Pasos |
|---|---|---|
| `O(n)` unidades | uno por unidad | `n` |
| `O(n²)` unidades | uno por **fila** | `n` |
| iterativo | la primera iteración y un **hito** por orden de magnitud del residuo | ~`log₁₀(residuo₀ / tolerancia)` |

Lo importante de la regla no es el reparto sino de dónde sale el número: **de
nada que haya elegido yo.** En el caso iterativo el conteo queda atado a
`DEFAULT_TOLERANCE`, que ya es una constante documentada del motor. Es la
diferencia con el 60 de D23, que sí es una elección y sigue anotada como tal.

Cuatro consecuencias concretas:

1. *`choleskyDecomposition` emite por fila y no por elemento.* Por elemento
   serían `n(n+1)/2` pasos: **120 en 15×15**. Por fila son 15. La fila es
   además la unidad natural: `L` es triangular inferior y se completa de una
   vez, terminando en su elemento diagonal.
2. *`eigenvaluesQR` no emite una iteración por paso.* Corre 500 fijas y 499
   serían indistinguibles. Emite la primera y después un hito cada vez que la
   norma subdiagonal cruza un orden de magnitud: **13 pasos** en la simétrica
   3×3 que converge, contra 500.
3. *Observar la convergencia no la cambia.* Medir la norma subdiagonal cuesta
   `O(n²)` contra el `O(n³)` de la factorización QR de ese mismo paso, y **no
   se usa como criterio de corte**: la iteración sigue corriendo las 500 pase lo
   que pase. Era la línea que separaba esta opción de la que cambiaba el
   comportamiento del motor.
4. *Cuando el método no converge no hay hitos, y el cierre lo admite.* La
   rotación de 90° y la simétrica de autovalores ±λ dan tres pasos: apertura,
   primera iteración, y un cierre que dice que no triangularizó y deriva a
   `eigenvalues`. Es más honesto que doce hitos inventados sobre un residuo que
   nunca baja.

**Compatibilidad.** Cero. Las cinco funciones ya devolvían `steps`; lo único que
cambió es que dejó de estar vacío. Ni un nombre nuevo, ni una firma distinta, ni
una forma de retorno tocada. La API pública sigue en 95.

**Verificación.**

- Línea de base: 341 en verde + 1 rojo intencional sobre `fa7118f`. Al
  terminar: 341 en verde + el mismo rojo, con 13 pruebas nuevas.
- **La regla C se verificó donde importa: las cinco funciones entraron a la
  tabla del contrato en 15×15 y ninguna aparece en la lista de excesos de D24.**
  Esa lista sigue teniendo las mismas nueve funciones de Gauss e inversión de
  antes. Si la regla hubiera fallado, se habría visto en el mismo mensaje.
- **Las dos reglas nuevas se validaron mutando el motor.** Hacer que
  `eigenvaluesQR` emita un paso por iteración rompe tres pruebas de
  `algebra-eigen`; hacer que Cholesky vuelva a emitir por elemento rompe tres de
  `algebra-decompositions` y suma una función más a la lista de excesos de D24.
- Conteos medidos: Jacobi en 15×15 pide **297 rotaciones y emite 12 pasos**; en
  3×3 pide 7 y emite 7. QR en 15×15 emite 17 pasos; Cholesky, 17.
- Los pasos se verifican contra el valor devuelto: el último `snapshot` de
  Cholesky tiene que ser la `L` que se devuelve, y el cierre de Jacobi tiene que
  traer los autovalores que devuelve.
- `eigenvaluesQR` y `jacobiEigenDecomposition` quedaron en 51 y 59 líneas
  efectivas al escribir los pasos, por encima del máximo de 50 de
  `AI_RULES.md` §10. Se refactorizaron extrayendo los pasos de apertura y cierre
  a funciones privadas en vez de justificar la excepción: quedaron en 37 y 47.
- La suite pasó de 0.6 s a 1.3 s. El costo está en los casos de 15×15 de la
  tabla del contrato, que se recorre seis veces.

**Próximos pasos.** Cierra la parte B lo que falta del grupo 3: `eigenvectors` y
`diagonalize`. Las dos componen procedimientos ajenos, así que la sesión es
sobre D22 —un solo `final`, y `diagonalize` hereda de dos lados— y no sobre la
regla de esta. Sigue abierto D24 (b), que es del Chat 3 junto con D23, y sigue
pendiente D8.

### 2026-09-23 — D24 (a): la cota se mide donde puede fallar · Chat 2

**Resumen.** Sesión corta, un solo archivo. La tabla de
`tests/math/steps-contract.test.js` corre ahora al tamaño máximo que permite el
selector de la calculadora: once invocaciones nuevas en 15×15, más
`determinantByCofactors` en 7×7, que es su máximo alcanzable porque corta por
costo factorial arriba de eso.

**La suite queda con una prueba en rojo, a propósito.** 328 de 329. La que falla
es "ningún procedimiento se pasa de largo para el usuario", y falla porque el
motor efectivamente se pasa: nueve funciones superan el límite de 60 pasos en
15×15. No se acotó ninguna para que pase — eso es la parte (b) de D24, que es
una decisión de producto y sale del Chat 3 junto con D23.

**Arquitectura.** Ninguna decisión nueva; es una corrección de prueba. Dos
detalles de cómo quedó escrita:

1. *La prueba junta todos los excesos antes de fallar, en vez de cortar en el
   primero.* Con la aserción por caso, el mensaje habría dicho "adjugate 15x15:
   221 pasos" y nada más, y quien tiene que decidir entre acotar el motor o
   paginar el panel necesita la lista entera. Ahora el fallo imprime las nueve
   con sus números.
2. *Se informan pasos **y** celdas de snapshot.* El conteo de pasos subestima el
   problema: `inverse` en 15×15 son 220 pasos pero 98 550 celdas, o sea 1.12 MB
   de JSON, y casi todo es `snapshot`. Si la decisión de (b) fuera paginar el
   panel, paginar no achica el payload — llega entero igual. Es el dato que
   cambia la decisión y no estaba medido.

**Compatibilidad.** No se tocó una línea del motor. La API pública no cambió, el
resto de la suite sigue en verde y las otras ocho pruebas del contrato —forma
del retorno, `steps` siempre arreglo, vocabulario de `type`, un solo `final`—
ahora se verifican **también** en 15×15 y pasan. Es un dato útil que salió de
paso: las invariantes de forma se sostienen al tamaño máximo; la única que no se
sostiene es la de legibilidad, que es justamente la que se estaba midiendo mal.

**Verificación.**

- Línea de base: 329 en verde sobre `25dd818`. Al terminar: 328 en verde y 1 en
  rojo, la esperada.
- La matriz de 15×15 es diagonal dominante para que ninguna función se caiga por
  singularidad; se verificó que `inverse` la acepta antes de usarla en la tabla.
- El costo de correr la tabla al máximo se midió antes de agregarla: 15 ms una
  pasada completa de las nueve funciones grandes, ~90 ms sumando las seis
  pruebas que recorren la tabla. La suite pasó de 0.5 s a 0.6 s.
- Los conteos difieren en ±2 respecto de los que midió el Chat 1 (218 contra 220
  en `inverse`, por ejemplo). No es discrepancia: el conteo depende de cuántos
  intercambios de fila pida el pivoteo parcial, y eso cambia con la matriz. El
  orden de magnitud, que es lo que decide, es el mismo.

**Próximos pasos.** La parte B del Paso 2c-2, que arranca por la decisión de
cuántos pasos emite un método iterativo. Las opciones y sus costos medidos están
en la conversación de cierre de esta sesión; el resumen es que Jacobi converge
en 297 rotaciones en 15×15 —0.75 MB si se snapshotea cada una— y que
`eigenvaluesQR` corre 500 iteraciones fijas sin criterio de convergencia, así
que un paso por iteración no es viable en ninguno de los dos.

### 2026-09-18 — Verificación del Paso 2c-2 parte A y enmienda de ADR-007 · Chat 1

**Qué se hizo.** Verificación independiente de la parte A, sobre `f8589aa`
clonado, y resolución de las dos escaladas que el Chat 2 dejó abiertas.

**Lo que se verificó, y cómo.** No releyendo el código sino recalculando fuera
del motor: los cofactores de 6×6, 7×7 y 8×8 contra un desarrollo por menores
escrito aparte —coinciden hasta el redondeo, con lo que la cota de 6×6 acorta el
relato sin tocar el número, que era la afirmación central—; `adjugate` contra
`det(A)·A⁻¹`, exacto en 3×3, 7×7 y 10×10; el cierre de `conditionNumber` contra
el producto de los dos factores que muestra, en cuatro matrices. `spline.js` lee
`classification` y la interpolación cúbica vuelve a dar los valores correctos.
El ejemplo corregido del JSDoc, `(2.2, 3.6)`, reemplazado en el sistema da
`(8, 13)`. Los 10 tipos, recorridos función por función sobre 41 invocaciones,
sin ninguno fuera de lista y sin ningún procedimiento con dos cierres. 329
pruebas en verde.

**D22 — aceptada.** La regla del `final` único entra al contrato como segunda
enmienda de ADR-007 §3.2, y como punto 5 de §3.6. Se incorpora con la forma que
el motor ya tiene, "a lo sumo uno" y no "exactamente uno": `rank`, `rowEchelon`,
`reducedRowEchelon` y `luDecomposition` devuelven un objeto transformado, no un
número al que se llegue, y obligarlos a cerrar sería inventarles una frase para
cumplir el contrato. La regla se escribe en el ADR y no en cada función porque
la parte B la va a necesitar de nuevo: `diagonalize` hereda de `eigenvalues` y
de `eigenvectors` a la vez.

**D23 — no se promueve.** El tope de 60 queda en la prueba y no entra a
ADR-007. Es una decisión de producto —cuántos pasos lee alguien antes de dejar
de leer— y se decide con el panel de procedimiento adelante, no en abstracto.
Que la haya tomado el Chat 2 no es el problema; el problema sería congelarla en
un ADR sin que la interfaz haya opinado.

**Un hallazgo, D24.** La prueba de contrato afirma que ningún procedimiento se
pasa de largo, pero corre esa comprobación con matrices de 2×2 y 3×3 para todo
salvo `cofactorMatrix`. Midiendo al tamaño que el selector permite: `inverse`
218 pasos en 15×15, `adjugate` 219, `solveSystem` 218, `reducedRowEchelon` 217,
`conditionNumber` 222. Seis operaciones que la calculadora ofrece hoy. No es una
regresión de la parte A —`inverse` y `rref` crecían así desde antes— sino una
prueba que garantiza una propiedad que el motor no tiene, que es peor que no
tener la prueba: da por cubierto algo que no lo está. Se corrige en dos tiempos,
la prueba primero (Chat 2) y la decisión de qué hacer con esos 218 pasos
después, con D23 (Chat 3).

**Lo que esto deja escrito en el ADR.** §3.6 gana un párrafo sobre los dos
límites estructurales de una prueba de forma: no lee el texto —lo que motivó
que `conditionNumber` pasara la prueba sin explicar la operación que se pedía— y
solo ve los tamaños de su tabla. Los dos ya se cobraron un hallazgo cada uno.

---

### 2026-09-18 — Procedimientos del motor, parte A (Paso 2c-2) · Chat 2

**Resumen.** Cuatro cosas, en el orden que fija §4:

1. **Las dos consecuencias de la enmienda de ADR-007 §3.3 (D16).** `solveSystem`
   cierra su procedimiento con un paso `final` que enuncia la clasificación y
   los rangos que la justifican —Rouché-Frobenius escrito en el desarrollo, no
   solo en el objeto de retorno— y su discriminante pasó de `type` a
   `classification`.
2. **D17.** El vocabulario de `type` bajó de 13 tipos a 10 en `docs/API.md` **y
   en `tests/math/steps-contract.test.js`**, que fijaba `length === 13`.
3. **Grupo 1** (expansión de Laplace): `determinantByCofactors`,
   `cofactorMatrix` y `adjugate`.
4. **Grupo 4**: los pasos de cierre de `conditionNumber`.

La suite pasó de **313 a 329 pruebas, todas en verde**.

**Arquitectura.** Cuatro decisiones:

1. *`determinantByCofactors` registra solo el primer nivel de la expansión.* La
   función es recursiva; trazarla entera daría `O(n!)` pasos, miles en una 6×6.
   Lo que se muestra es la fórmula de Laplace aplicada una vez sobre la primera
   fila, con cada menor como `snapshot` y su determinante ya resuelto. Además,
   el valor y los pasos salen de **una sola pasada**: calcular el determinante
   por un lado y volver a expandir para narrarlo habría duplicado un algoritmo
   factorial solo para mostrarlo (`AI_RULES.md` §22).
2. *`cofactorMatrix` se acota en 6×6.* No tenía ningún corte —verificado
   ejecutando: para una 15×15 calcula los 225 menores sin chistar— y el selector
   de la calculadora llega a 15. Con pasos, eso serían 225 pasos con menores de
   196 celdas. Arriba de 6 el desarrollo se omite y queda un `info` que lo
   explica; **el resultado numérico no cambia nunca**. El umbral es 6 y no otro
   número porque es el mismo en el que `adjugate` deja de pasar por los
   cofactores y usa `det(A)·A⁻¹`: arriba de ahí las dos funciones cuentan la
   misma historia en vez de dos distintas.
3. *Un solo paso `final`, y es el último.* Al encadenar procedimientos apareció
   que `adjugate` y `conditionNumber` quedaban con dos o tres pasos marcados
   como conclusión: el heredado de la auxiliar más el propio. Se degradan a
   `info` los heredados. **Esta regla no está en ADR-007** —la decidí acá— así
   que queda anotada como D22 para que el Chat 1 la incorpore o la rechace.
4. *Formato de números inline con `.toFixed(4)`*, igual que `gauss.js` y
   `lu.js`. Condición de salida acordada con el responsable del proyecto: si en
   la parte B hace falta el mismo formateo en más de cinco lugares nuevos, pasa
   a ser una llamada a `formatter/`, que la capa 4 tiene permitido usar.

**Compatibilidad.** La API pública sigue en **95 nombres**, sin altas ni bajas.
Hay una ruptura de forma: el discriminante de `solveSystem`. Los consumidores
eran dos, no uno:

- `modules/algebra/operations/system-ops.js`, que ya leía
  `outcome.classification ?? outcome.type` porque el Chat 3 se adelantó. Sigue
  funcionando sin cambios, antes y después.
- **`shared/math/interpolation/spline.js`**, que lo consumía internamente y **no
  estaba en el plan de esta sesión**. Lo detectó la suite: seis pruebas de
  interpolación se pusieron en rojo apenas renombré la clave. Es la compuerta
  funcionando, y la razón por la que el relevamiento previo hay que hacerlo
  también dentro de `shared/`, no solo en `modules/` y `tests/`.

**Verificación.**

- Línea de base: 313 pruebas, todas pasan, sobre el clon de `develop` en
  `550e664`. Al terminar: 329.
- **Las dos invariantes nuevas de la prueba de contrato se validaron mutando el
  motor.** Sacarle a `conditionNumber` el degradado del `final` heredado hace
  fallar "hay a lo sumo un paso final"; subir la cota de `cofactorMatrix` a 15
  hace fallar "ningún procedimiento se pasa de largo". Una invariante que no se
  puede hacer fallar no protege nada.
- Para que la cota se pruebe donde importa, la tabla de `steps-contract` incluye
  ahora una `cofactorMatrix` de 15×15: antes todos los casos eran matrices
  chicas donde la cota nunca se dispara.
- Los pasos se verifican **contra el valor devuelto, no contra sí mismos**: los
  términos que muestra Laplace tienen que sumar el determinante, y las normas
  que muestra `conditionNumber` tienen que multiplicar al κ(A) devuelto. Si el
  texto y el número se separan, el desarrollo miente, y eso falla.
- Las normas del ejemplo de `conditionNumber` se recalcularon a mano, fuera del
  motor: ‖A‖_F = 10.2470, ‖A⁻¹‖_F = 1.0247, producto 10.5000.
- Se corrigió de paso un ejemplo de JSDoc que estaba mal desde antes: la
  solución de `solveSystem([[2,1],[1,3]], [8,13])` es `(2.2, 3.6)`, y el
  ejemplo decía `(3.4, 3.2)`.
- Contra `AI_RULES.md` §10: ningún archivo pasa de 275 líneas y la función más
  larga quedó en 47 efectivas (`solveSystem`). Sin `throw` genéricos, sin `var`,
  sin globales, sin DOM.

**Próximos pasos.** La parte B: grupos 2 y 3, que arrancan por la decisión de
cuántos pasos emite un método iterativo. Y tres cosas anotadas y no hechas:
**D22** (la invariante del `final` único, que debería estar en el ADR), **D23**
(el tope de 60 pasos, que sale de un criterio mío y debería salir de la
interfaz) y **D8**, los ejemplos de `toScientific` y `formatNumber` en `API.md`,
que siguen contradiciendo el comportamiento real y son de esta zona.

### 2026-09-14 — Sistema de diseño y estilos de la calculadora (Paso 3b) · Chat 4

**Resumen.** `css/` deja de estar vacío. Cinco archivos —`tokens.css` (100
líneas efectivas), `base.css` (132), `components.css` (460), `results.css` (274)
y `algebra.css` (180)— con el sistema de diseño de la plataforma extraído de la
calculadora de álgebra, no diseñado en el aire. El 404 de `css/algebra.css` está
cerrado: la calculadora se ve con formato en los dos temas y hasta 400 px de
ancho.

El reparto aprobado en §4 era de cuatro archivos. Son cinco porque
`components.css` daba 727 líneas efectivas, por encima del máximo de 500 de
`AI_RULES.md` §10, y el corte existía solo: lo que dibuja la aplicación
—cáscara, menú, botones, paneles, historial— quedó en `components.css`, y lo que
dibuja la salida del motor —las seis primitivas de bloque y el procedimiento de
ADR-007— pasó a `results.css`. Los dos son igual de reutilizables entre
disciplinas, así que el reparto de §4 no cambia de sentido: se parte en dos la
casilla "lo reutilizable", no se agrega una casilla nueva. Se prefirió partir
antes que justificar el exceso, como habilita §10, porque la justificación
habría sido "es mucho CSS" y eso no es una razón técnica.

No se tocó una sola línea de JavaScript ni de HTML. Las clases salieron del
contrato del comentario de `modules/algebra/index.html` y de una extracción por
búsqueda sobre `app.js`, `view/*.js` y `services/*.js`, para comprobar que el
comentario dijera la verdad. La dice, con una omisión: `.print-document`, que ya
quedó anotada en el Paso 3c.

**Arquitectura.** Seis decisiones, más la partición de `components.css` que se
explica arriba.

1. *El acento de plataforma y el de disciplina son dos colores distintos.*
   `tokens.css` declara un índigo institucional (`#3a49b8` claro / `#8fa4ff`
   oscuro) y `algebra.css` lo reemplaza por el teal de la consola científica del
   legacy. La alternativa —que el teal fuera a la vez el color de la plataforma
   y el del álgebra— deja el mecanismo de sobreescritura por módulo sin
   ejercitar hasta la calculadora número dos, que es código especulativo del
   tipo que ADR-006 existe para evitar. Hoy se ejercita: si se borraran las
   cuatro líneas de `algebra.css` §1, la calculadora se pondría índigo y
   seguiría andando. Esa es la prueba de que la separación es real.

2. *El anillo de foco NO usa `--accent`.* Es el único elemento visible que se
   queda con el índigo de plataforma incluso dentro del álgebra, y es a
   propósito: si el indicador de foco cambiara de color con cada disciplina,
   habría que volver a medir su contraste en cada módulo nuevo. Se mide una vez
   y vale para todos.

3. *Los temas se resuelven con `light-dark()`, no duplicando el bloque de roles
   en un `@media (prefers-color-scheme)` más un `[data-theme]`.* Esa duplicación
   es la fuente clásica de temas desincronizados: alguien agrega un rol en un
   bloque y se olvida del otro, y el defecto solo aparece en el tema que esa
   persona no usa. Con `light-dark()` cada rol existe una vez y los dos valores
   están uno al lado del otro. Suma además `color-scheme`, que hace que los
   controles nativos y las barras de desplazamiento sigan el tema sin una sola
   regla escrita a mano. Verificado en Chromium 141 antes de adoptarlo.

4. *Tres capas de tokens, y ningún componente nombra una primitiva.*
   Primitivas (`--ink-750`, `--teal-300`) → roles (`--surface-panel`,
   `--text-muted`) → acento por disciplina. Un `#1f1f31` dentro de
   `components.css` sería un elemento que dejó de responder al tema.

5. *Los diez tipos de paso de ADR-007 §3.3 se agrupan en tres tratamientos, no
   en diez colores.* Transformaciones de la matriz (`swap`, `scale`, `elim`,
   `rotate`, `normalize`) en acento; cierre (`final`) en verde; nota (`info`)
   con borde punteado; cálculo (`expand`, `compute`, `iterate`) con el estilo
   base. Diez tonos no significan nada y obligan a medir diez contrastes nuevos
   cada vez que el ADR agregue un tipo. Un `type` desconocido cae en el estilo
   base, que es la misma decisión que tomó el Chat 3 en `steps-view.js`:
   preferir un rótulo neutro a ocultar el paso.

6. *Stack de fuentes del sistema.* El legacy declara Space Grotesk, Inter y
   JetBrains Mono, que solo funcionan en las máquinas que ya las tengan
   instaladas: `AI_RULES.md` §11 prohíbe CDN y `assets/` no tiene archivos de
   fuente. Y `font-variant-numeric: tabular-nums` en la raíz, no en las celdas:
   una calculadora es casi toda números en columna, y con cifras proporcionales
   un `−0.333333` al lado de un `1` no alinea justo donde el usuario está
   comparando. Ponerlo en la raíz hace que valga también para las calculadoras
   que se escriban después, sin que nadie tenga que acordarse.

**Compatibilidad.** No se modificó `shared/math/`, `modules/`, `js/`, `tests/`,
`index.html`, `docs/API.md`, `docs/Algorithms.md`, `docs/adr/`,
`docs/governance/` ni `legacy/`. La API pública no se tocó y no se pidió que
cambiara. Fuera de `css/`, el único archivo modificado es este HANDOFF, en las
secciones que `CHAT_ROLES.md` §6 asigna al chat que trabaja: la fila propia de
§1, la fila propia de §3, el estado del propio paso en §4, tres ítems agregados
en §5 y esta entrada. No se reordenó el plan ni se editó lo que escribió otro
chat.

Los cuatro estilos del Paso 3c (`.panel-empty--placeholder`, `--pending`,
`--unavailable`, `--history`) están escritos y verificados. Hasta que el Chat 3
aplique los modificadores, los cuatro casos caen en el estilo base, que es el
del marcador de posición —el más neutro de los cuatro y el que menos miente si
le toca a otro caso—. La calculadora no se rompe ni antes ni después del 3c.

**Verificación.** Servido con `python3 -m http.server` y manejado en Chromium
141 con Playwright — no leído. El contraste se midió sobre los colores
**computados en el navegador**, componiendo los lavados translúcidos contra su
fondo real, no sobre los valores del archivo: un `rgba(79,214,192,.14)` sobre
panel no es el color que dice el código.

- **Carga limpia en los dos temas: cero pedidos fallidos, cero errores de
  consola.** El 404 de `css/algebra.css` que dejó el Paso 3 no existe más.
- `light-dark()` resuelve en los dos esquemas: `--surface-page` da
  `rgb(243,244,249)` en claro y `rgb(20,20,31)` en oscuro, y `body` toma
  `tabular-nums` y `system-ui`.
- **22 pares color/superficie medidos con contenido real en pantalla**, en los
  dos temas. Todos ≥ 4.5:1. El más ajustado es el texto atenuado sobre la
  página en tema claro, 4.64:1.
- **Dos fallas encontradas midiendo, no leyendo, y corregidas:** el texto de
  `.panel-empty--pending` daba **4.04:1** en tema oscuro —el secundario sobre el
  lavado de acento— y pasó a texto primario, 9.76:1; y la paleta clara heredada
  del legacy fallaba en cuatro roles (acento 3.38, warn 3.47, ok 4.36, atenuado
  3.34 sobre blanco), corregidos antes de escribir una sola regla.
- **Caso de estrés, 15×15 por Gauss: 103 pasos, 102 snapshots, 22.950 celdas**,
  renderizado en 1,8 s sin errores. Destapó un defecto de grilla que solo
  aparece a esa escala: con la pista `1fr`, cuyo mínimo automático es el tamaño
  del contenido, el snapshot de 773 px ensanchaba el paso y arrastraba al panel
  entero a desplazarse en horizontal — el texto de los 103 pasos se iba de
  pantalla junto con la matriz. Con `minmax(0, 1fr)` y el snapshot convertido en
  su propio contenedor de desplazamiento (`display: block`, porque sobre
  `display: table` el `overflow` no se aplica), el paso queda en 486 px, el
  snapshot muestra 296 de 773 y se desplaza solo, y el panel no se mueve.
- **Los tres estados del panel se verificaron distinguibles**, inyectando los
  modificadores del Paso 3c que todavía no existen en el JavaScript: marcador de
  posición sin borde ni fondo; pendiente con borde punteado de acento, fondo
  lavado y rótulo "EN PREPARACIÓN"; no disponible con borde sólido tenue, fondo
  de campo y cursiva, sin color ni rótulo. Uno se lee como obra anunciada y el
  otro como cerrado, que es exactamente la distinción que pide el paso.
- **Los once tipos de rótulo se renderizaron juntos**, los diez del vocabulario
  de ADR-007 §3.3 más uno inventado. El inventado cae en el estilo base y se ve
  como un paso de cálculo: no rompe nada, que es la garantía que el Chat 3 pidió
  para el vocabulario abierto hacia adelante.
- **400 px, los dos temas, con resultado en pantalla: cero desborde
  horizontal**, `document.scrollWidth === 400`, y ningún elemento fuera del
  viewport salvo el cajón de historial, que está cerrado por diseño
  (`translateX(100%)`). Los dos paneles se apilan, los pasos pasan a una
  columna y la zona de matrices se estira.
- **Foco por teclado:** ocho `Tab` seguidos, los ocho con anillo visible de
  3 px. `:focus-visible` y no `:focus`, así que no aparece al hacer clic.
- **Historial:** abre a 384 px de ancho, pegado al borde derecho, con la
  superposición en opacidad 1.
- Un detalle que solo se ve mirando: las tablas de matriz se estiraban a todo el
  ancho del panel —una 3×3 ocupaba los 518 px disponibles y las columnas
  quedaban separadas por media pantalla, que es lo contrario de lo que una
  matriz comunica—. Con `width: max-content` quedó en 236 px. Y el rótulo de
  paso lleva `min-width: 7rem` para que el texto de los 103 pasos arranque en la
  misma x: cada `.step` es su propia grilla, así que la alineación entre pasos
  no la puede dar una pista `auto`.

**Próximos pasos.** El Paso 3c (Chat 3), que no bloquea nada de lo entregado. Y
el Paso 2c-2 (Chat 2), con el invariante ya escrito: cuando cierre,
`.panel-empty--pending` no debería tener usuarios en álgebra.

Tres cosas que este chat deja anotadas y no hizo por estar fuera de su zona o de
su alcance: **D19**, los `@import` encadenados de `algebra.css`, que conviene
reemplazar por cuatro `<link>` cuando el Paso 4 arme la cáscara compartida;
**D20**, el menú lateral en pantallas angostas, que hoy es una tira en el flujo
porque `.is-hidden` es el único estado que le pone el JavaScript y un cajón
superpuesto arrancaría abierto tapando la pantalla; y **D21**, que no hay
interruptor de tema, así que quien tenga el sistema operativo en claro no puede
ver el oscuro. Las tres son del Paso 4 y las dos últimas necesitan al Chat 3.

Y una observación para el Chat 5, que es suya y no mía: el sistema tiene ahora
una regla verificable que ninguna prueba cubre —todo par color/superficie
≥ 4.5:1—. Es medible con el mismo Chromium que ya usa la suite, recorriendo los
elementos de una página servida y componiendo los fondos translúcidos. Sería la
primera prueba sobre `css/`, y atraparía el caso que más fácil se escapa: un
token que alguien ajusta por gusto y que rompe el contraste de un componente que
no miró.

---

### 2026-09-13 — Calculadora de álgebra sobre el motor (Paso 3) · Chat 3

**Resumen.** `modules/` deja de estar vacío. La calculadora de álgebra quedó
reescrita en `modules/algebra/`: 21 archivos, ~2.400 líneas, las **27**
operaciones de la V1, importando exclusivamente desde `shared/math/index.js`.
Están el procedimiento paso a paso, el historial, la exportación a TXT/CSV/PDF,
el pegado desde planilla y los seis atajos de teclado.

**Lo más importante del paso, y conviene que quede escrito: no hizo falta un
solo pedido al motor.** Las 95 exportaciones cubrieron las 27 operaciones sin
un hueco. Es la prueba de fuego que ADR-006 puso en este paso, y la API pública
la pasó tal cual está.

Dos correcciones de relevamiento, las dos con evidencia:

1. **Son 27 operaciones, no 25.** El número 25 venía de `ADR-007` §1 y se
   repitió en §4 de este archivo. Contadas del `<nav>` de
   `legacy/calculadora-algebra-v1/index.html` (líneas 45–91) y del `OP_CONFIG`
   de su `js/ui.js` (líneas 28–56): 5 propiedades + 6 determinante/inversa +
   3 sistemas + 5 entre matrices + 2 especiales + 6 autovalores = 27.
2. **`docs/API.md` contradice la enmienda de ADR-007 §3.3**: su tabla de
   vocabulario sigue con 13 tipos de paso, incluidos los tres que la enmienda
   sacó. Anotado como **D17**, zona del Chat 2. Se implementó contra los 10 del
   ADR, que es la fuente.

**Arquitectura.** Cuatro decisiones:

1. *Existe un modelo de presentación intermedio.* Una operación no devuelve
   HTML ni sabe qué es una celda: devuelve `{title, blocks, steps, notes}`,
   donde cada `block` es una primitiva de vista (`matrix`, `scalar`, `vector`,
   `pairs`, `text`, `flags`). El renderizador conoce seis tipos de bloque y
   ninguna operación. La alternativa —que el renderizador supiera qué
   devuelve cada función del motor— es un `switch` de 27 ramas, el archivo
   todoterreno que prohíbe `ENGINEERING_GUIDE.md` §3, y obligaría a tocar la
   vista cada vez que se agrega una operación.
2. *El panel de procedimiento distingue tres estados, no dos.* Hay pasos;
   `steps: []`, que es "el motor todavía no escribió el desarrollo" (Paso
   2c-2); y `steps === null`, que la interfaz usa para las operaciones fuera
   del contrato de ADR-007 §3.4. Decirle "no hay desarrollo" a las tres sería
   mentirle al usuario sobre si conviene volver más adelante: en un caso el
   desarrollo va a aparecer y en el otro no.
3. *`solveSystem` se lee con `outcome.classification ?? outcome.type`.* El
   Paso 2c-2 renombra ese discriminante y corre en paralelo a esta sesión; con
   las dos lecturas, la calculadora anda con el motor de hoy y con el de
   después, sin depender del orden en que se cierren las sesiones. Cuando el
   2c-2 esté cerrado, se borra el `??` — está marcado con un comentario que lo
   dice.
4. *Los errores de carga de datos tienen su propia clase, `InputError`.* No se
   reutilizó `MathError`: el motor ni se enteró, porque la operación nunca
   llegó a invocarse, y colgarle un error que no cometió confunde cualquier
   diagnóstico posterior. La distinción es visible para el usuario — un dato
   mal cargado se le muestra como algo que puede arreglar; cualquier otro
   `Error` que llegue hasta ahí se le muestra como defecto de la calculadora,
   con el pedido de que lo reporte.

**Compatibilidad.** No se tocó `shared/math/`, `tests/`, `css/`, `assets/`,
`docs/API.md`, `docs/Algorithms.md`, `docs/adr/`, `docs/governance/` ni
`legacy/`. `js/` sigue vacío: el dashboard es el Paso 4. La API pública no
cambió y no se pidió que cambiara. Fuera de `modules/algebra/`, el único
archivo modificado es `index.html` de la raíz —zona del Chat 3—: enlaza la
calculadora y corrige la lista de estado, que seguía diciendo que las pruebas
estaban pendientes con el Paso 1 cerrado hace días. Sigue siendo provisorio.

**Verificación.** Servido por HTTP sobre Node v22.22.2, el mismo del motor, y
ejecutado en Chromium — no leído:

- **Las 27 operaciones se ejecutaron desde la interfaz**, una por una, sobre
  `A = [[4,7,2],[2,6,1],[3,1,5]]`. Las 27 devuelven resultado; ninguna lanza;
  no hay un solo error de consola. El único 404 es `css/algebra.css`, que es
  el Paso 3b.
- **La regla de ADR-007 §3.2 se verificó rompiéndola a propósito**, que es la
  única forma de saber si se cumple: se volvió a renderizar el procedimiento
  de `determinantByGauss` con los pasos reducidos a `{type, text}`, sin
  `snapshot` ni `detail`. Resultado: los 5 pasos, los 5 textos, 0 snapshots,
  y el panel entero legible. Si esta prueba hubiera fallado, el renderizador
  estaba mal escrito según la propia definición del ADR.
- Un `type` fuera del vocabulario tampoco rompe: se muestra el paso con el
  tipo crudo como rótulo. Preferimos un rótulo feo antes que ocultar el
  desarrollo porque el motor incorporó un tipo que esta versión no conoce.
- Verificación cruzada contra la definición, no contra la salida del motor:
  `A·A⁻¹ = I`, `P·A = L·U`, `Q·R = A`, `L·Lᵀ = A`, `Σλ = tr(A)`, y el
  determinante por Gauss contra el de cofactores y contra el 35 calculado a
  mano. Todo con `approximatelyEqual` del motor: la primera versión de esta
  prueba comparaba con `===` y marcaba en rojo un `35.00000000000001`
  perfectamente correcto, que es exactamente lo que advierte
  `CODING_STANDARDS.md` §10.
- Caminos de error, todos desde la interfaz: inversa de una singular,
  Cholesky sobre una no definida positiva, cofactores en 8×8 —avisado
  **antes** de calcular, para no hacer esperar por una excepción previsible— y
  una celda con texto, que se señala por posición `(1,1)` y marca la celda.
- Historial: sobrevive a la recarga, y reabrir una entrada **vuelve a
  calcular** en vez de mostrar lo guardado. Es deliberado: un historial que
  guardara resultados mostraría, después de una corrección como H-03, valores
  viejos e incorrectos sin ninguna señal.
- Pegado: Excel (tabulaciones), MATLAB (`[1 2; 3 4]`) y CSV. La coma separa
  celdas y no puede ser separador decimal al pegar; escribiendo a mano en una
  celda sí se acepta, porque ahí no hay ambigüedad.
- Contra `AI_RULES.md` §10: el archivo más largo es `app.js` con 469 líneas
  —la primera versión dio 550 y se dividió en `view/layout-view.js` y
  `view/history-view.js` en vez de justificar el exceso— y la función más
  larga tiene 39 líneas efectivas. Sin `var`, sin globales, sin `innerHTML`,
  sin comparación de flotantes con `==`, y **ningún import a un archivo
  interno del motor**: los 8 archivos que importan del motor lo hacen desde
  `shared/math/index.js`, verificado por búsqueda.

**Próximos pasos.** El Paso 3b, los estilos (Chat 4): la calculadora funciona
pero se ve sin formato, y el contrato de clases está al principio de
`modules/algebra/index.html`. Después, el Paso 4 (dashboard, routing, historial
global y favoritos), donde conviene revisar si el historial de esta calculadora
se generaliza o queda por módulo — hoy tiene su propia clave de
`localStorage`. Dos cosas que este chat deja anotadas y no hizo por estar fuera
de su zona: **D17**, la tabla de vocabulario de `API.md`; y **D18**, si los
métodos de `Matrix` deberían entrar al contrato de `steps`, que son 12 de las
27 operaciones sin desarrollo posible. Y una sugerencia para el Chat 5, que es
suya y no mía: hoy no hay ninguna prueba sobre `modules/`, así que el
renderizador de pasos —lo único de la interfaz que implementa una regla de un
ADR— no tiene red.

---

### 2026-09-13 — Contrato de `steps`: la forma (Paso 2c-1) · Chat 2

**Resumen.** Se congeló la forma del procedimiento paso a paso, sin escribir ni
un paso nuevo. Tres cosas:

1. **Las doce formas de retorno de ADR-007 §3.4.** Cuatro funciones que
   devolvían algo que no puede llevar `steps` pasaron a objeto plano:
   `determinantByCofactors` → `{ value, steps }`, `cofactorMatrix` y `adjugate`
   → `{ matrix, steps }`, `eigenvectors` → `{ vectors, steps }`. Las otras ocho
   sumaron la clave. `luDecomposition` ganó `snapshot` en sus pasos.
2. **La división de `eigen.js` por método (§3.5).** Cuatro archivos:
   `eigen.js` con el despacho, los autovectores y la diagonalización;
   `eigen-qr.js`, `eigen-jacobi.js` y `eigen-2x2.js` con un método cada uno.
   Cierra D14.
3. **`tests/math/steps-contract.test.js` (§3.6)**, la prueba genérica que hace
   que el contrato falle solo cuando alguien se desvía.

La suite pasó de **306 a 313 pruebas, todas en verde**.

**Arquitectura.** Tres decisiones, más una consulta que quedó anotada:

1. *Las funciones que delegan propagan los `steps` de quien llamaron, no
   devuelven `[]`.* `conditionNumber` entrega los de la inversión que calcula
   igual, `adjugate` los de la matriz de cofactores (o los de la inversa si usó
   `det(A)·A⁻¹`), `eigenvalues` los del método que despachó, y `diagonalize`
   encadena los de autovalores y autovectores. Lo que hay que mostrar es el
   procedimiento que efectivamente corrió, no uno inventado en la capa de
   arriba. Consultado y confirmado con el responsable del proyecto antes de
   escribir, porque `conditionNumber` es la única que sale de esta sesión con
   `steps` no vacío y eso roza la consigna de "ni un paso nuevo": son los pasos
   de `inverse`, ya escritos y ya probados, no unos propios.
2. *`eigenvectorFor` queda fuera del contrato.* Sigue devolviendo el vector
   pelado o `null`. No está en la tabla de §3.4, y es una pieza de construcción
   de `eigenvectors` —no una operación que una calculadora ofrezca por
   separado—, así que darle una forma de retorno con `steps` sería aplicar el
   contrato donde no hace falta.
3. *`physics/tensors.js` cambió una línea y no cambió su forma.*
   `principalDirections` consume `eigenvectors`, que ahora devuelve
   `{ vectors, steps }`. ADR-007 §3.1 alcanza a `shared/math/algebra/` y
   `principalDirections` no está en §3.4, así que se adaptó el consumo sin
   tocar el retorno.

**Compatibilidad.** La API pública sigue en 95 nombres: ni un alta, ni una baja,
ni un renombre. Lo que cambió es la **forma de retorno** de cuatro de ellos, que
es ruptura real y por eso se hizo ahora, con `modules/` vacío (ADR-006 §3). La
división de `eigen.js` es invisible desde afuera: `index.js` exporta los mismos
siete nombres, y `api-surface.test.js` pasó sin tocarse, que es exactamente la
promesa del punto único de entrada de `Architecture.md` §6.

**Verificación.**

- Línea de base: 306 pruebas, todas pasan, Node v22.22.2. Al terminar: 313.
- El rojo intermedio fue de **14 pruebas en 3 archivos**, no en bloque. Antes de
  tocar código se midió qué se consume por destructuring —ocho de las doce
  funciones, que por eso no rompen nada— y qué cambia de tipo. Las cuatro que
  rompen son las que dejaron de ser un número, un arreglo o una `Matrix`.
- **La prueba de contrato se validó mutando el motor, no leyéndola.** Tres
  mutaciones, tres fallas en la prueba correcta: quitarle `steps` a
  `qrDecomposition` (falla "toda función del contrato devuelve steps"), usar un
  `type` fuera del vocabulario en `luDecomposition` (falla "cada paso tiene un
  type del vocabulario cerrado"), y devolver `U.data` en vez de `U.toArray()`
  como snapshot (falla "los pasos son datos, no referencias vivas"). Una prueba
  de contrato que no se puede hacer fallar no protege nada.
- Esa tercera mutación es la que más vale: un `snapshot` devuelto por
  referencia haría que todos los pasos mostraran el estado final, y el
  procedimiento sería una animación de un solo cuadro. No lo detecta ninguna
  prueba de valores.
- El vocabulario de `type` se transcribió del ADR y no se importó del motor: si
  se importara, la prueba diría "el motor usa los tipos que el motor declara".
  Se fijó además su tamaño en 13, para que agregar uno por las dudas falle acá.
- Contra `AI_RULES.md` §10: los cuatro archivos de autovalores quedaron en 233,
  201, 91 y 84 líneas, y la función más larga del motor tocado en 33 efectivas.
  Sin `throw` genéricos, sin `var`, sin globales, sin DOM.

**Próximos pasos.** El Paso 3 puede arrancar: el Chat 3 tiene el contrato
documentado en `API.md` y no depende de que el 2c-2 esté hecho. El Paso 2c-2
puede correr en paralelo, por los cuatro grupos de ADR-007 §4.

Una consulta para el Chat 1, anotada como **D16**: los tipos de cierre `unique`,
`infinite` e `incompatible` del vocabulario de §3.3 no están en uso como tipos
de paso. Existen como discriminante del retorno de `solveSystem`, que es otra
cosa. El vocabulario los acepta y no hace falta cambiar nada; la pregunta es si
la intención era que `solveSystem` cierre su procedimiento con un paso de ese
tipo, en cuyo caso es contenido y va en el 2c-2.

---

### 2026-09-13 — Refactores de nombres del motor (Paso 2a) · Chat 2

**Resumen.** Tres refactores sin capacidades nuevas, hechos ahora porque
`modules/` sigue vacío y el costo de ruptura es cero (ADR-006 §3).

1. **API de autovalores (ADR-005).** `eigenvalues` es ahora la entrada
   recomendada y es la que despacha por tipo de matriz; `eigenvaluesQR` volvió a
   ser el algoritmo QR iterativo, siempre y sin despacho. `jacobiEigenDecomposition`
   y `eigenvalues2x2` no cambiaron. `diagonalize` y `principalValues` pasaron a
   apoyarse en `eigenvalues`, que es lo que mantiene H-04 cerrado.
2. **D3.** Los cuatro archivos de `shared/math/errors/` pasaron a kebab-case, y
   los 21 archivos del motor que los importan quedaron actualizados.
3. **D12.** `hPa` entró al catálogo de presión, junto a `mbar`.

La suite pasó de **298 a 306 pruebas, todas en verde**.

**Arquitectura.** Tres decisiones, y una consecuencia que conviene tener escrita:

1. *`eigenvalues` devuelve `method` y no `matrixT`.* `matrixT` era la iterada del
   QR, y bajo despacho no siempre existe algo que merezca ese nombre: en el caso
   2×2 no hay iteración ninguna. En su lugar devuelve `method` —`'trivial'`,
   `'jacobi'`, `'closed-form-2x2'` o `'qr'`—, que es lo que una calculadora
   necesita para explicar el procedimiento que efectivamente corrió. `matrixT`
   sigue en `eigenvaluesQR`, donde sí es la iterada.
2. *La firma es posicional, `eigenvalues(matrix, tolerance, iterations)`.*
   ADR-005 §3 la escribe como `(matrix, options)`, pero la misma tabla escribe
   `jacobiEigenDecomposition(matrix, options)`, que ya está publicada como
   `(matrix, tolerance, maxRotations)`. Se leyó ese `options` como taquigrafía
   del rol y no como especificación, y se mantuvo la convención posicional del
   resto del motor. Confirmado con el responsable del proyecto antes de escribir.
3. *`hPa` y `mbar` comparten constante en vez de derivarse uno del otro.* Son
   idénticos por definición del prefijo; compartir la constante hace imposible
   que se desincronicen, que es exactamente lo que había pasado con mmHg e inHg
   (H-02). Conviven a propósito: la aeronáutica reporta en hPa y `mbar` sigue en
   uso en instrumental más viejo.

La consecuencia: **`eigenvaluesQR` volvió a no converger con autovalores de
igual módulo.** No es reabrir H-03. H-03 era un defecto porque esa función era
la única entrada a los autovalores y su nombre no anunciaba el método; hoy es la
limitación conocida del QR sin desplazamientos, bajo un nombre que la anuncia,
con `eigenvalues` al lado resolviendo el caso simétrico por Jacobi. Quedó fijada
como prueba —con el comentario de qué hacer si algún día falla porque se
implementó D13— y documentada en `API.md` en un bloque de advertencia y en
`Algorithms.md` §9.1, donde ahora se distinguen las dos causas de no
convergencia: autovalores complejos y autovalores reales de igual módulo.

**Compatibilidad.** La API pública pasó de 94 a **95** nombres. Se agregó
`eigenvalues`; no se eliminó ni se renombró ninguno. `eigenvaluesQR` conserva
nombre, firma y forma de retorno, y lo único que cambia es que ya no despacha —
que es el punto del ADR. Las cuatro clases de excepción se siguen exportando con
el mismo nombre desde `index.js`: cambió el archivo, no la API, y las pruebas ni
se enteraron porque importan todo desde `index.js`. `hPa` entra al catálogo sin
desplazar a `mbar`. Fuera de la zona del Chat 2 no se tocó nada: `modules/`,
`js/`, `css/`, `assets/`, `index.html` y `legacy/` quedan como estaban.

**Verificación.**

- Línea de base antes de tocar nada: 298 pruebas, todas pasan, Node v22.22.2.
  Al terminar: 306. Las únicas que fallaron en el camino fueron las cuatro de
  despacho que ADR-005 manda reescribir y las dos de `api-surface.test.js` hasta
  documentar el nombre nuevo — ninguna sorpresa.
- Antes de escribir código se corrió el bucle QR puro contra las once matrices
  que usaban las pruebas, para saber cuáles había que mover y cuáles no. Las
  cuatro que no convergen (`[[0,50],[50,0]]`, `[[0,1],[1,0]]`, el corte puro 3×3
  y la rotación) fueron exactamente las que se reescribieron: la migración no se
  decidió a ojo.
- Se agregó una prueba de que `eigenvalues` y `eigenvaluesQR` **coinciden** en
  las matrices donde el QR sí converge. Que difieran donde el QR falla es el
  punto; que difieran en otro lado sería un error.
- Se agregó una prueba de que `eigenvaluesQR` conserva la traza de la iterada
  aunque no converja: cada paso es una semejanza ortogonal, así que la traza es
  invariante. Confirma que lo que falla es la convergencia del método y no su
  aritmética.
- El despacho quedó fijado como contrato: una prueba recorre seis matrices y
  verifica qué `method` elige cada una.
- `hPa`: ida y vuelta por cada unidad del catálogo de presión, más la identidad
  con `mbar` y `1 atm = 1013.25 hPa`, que es el QNH estándar.
- Tras el renombrado no queda ninguna referencia a las rutas viejas en `shared/`,
  `tests/` ni `docs/`, verificado por búsqueda. Que Node resuelva el grafo
  completo desde `index.js` confirma además que no hay diferencias de mayúsculas
  que Windows perdone y GitHub Pages no.
- Contra `AI_RULES.md` §10: `eigen.js` quedó en 480 líneas —bajo el máximo de
  500, pero cerca; queda anotado como D14— y su función más larga en 32 líneas
  efectivas. Sin `throw` genéricos, sin `var`, sin globales, sin DOM.

**Próximos pasos.** El Paso 3, la calculadora de álgebra (Chat 3 + 4). Dos cosas
que este chat deja pendientes y no hizo por estar fuera del alcance de la sesión:
**(a)** D14, cómo partir `eigen.js` antes de que D13 lo pase de 500 líneas — es
organización interna del motor y conviene decidirlo en frío; **(b)** D8, los
ejemplos de `toScientific` y `formatNumber` en `API.md`, que siguen
contradiciendo el comportamiento real y son de esta zona. Y un pedido concreto
al Chat 5: la fila de `tests/` en §1 sigue diciendo 298 y ahora son 306.

---

### 2026-09-13 — Corrección de los cinco hallazgos del motor (Paso 1b) · Chat 2

**Resumen.** Se cerraron los cinco hallazgos que la suite del Paso 1 encontró.
H-03 se corrigió como manda ADR-004: portando `jacobiEigenDecomposition` y
`eigenvalues2x2` desde `legacy/motor-v1/algebra/eigen.js` y dejando
`shared/math/algebra/eigen.js` con despacho por tipo de matriz —1×1 trivial,
simétrica por Jacobi, 2×2 no simétrica por forma cerrada, general por QR—, no
parcheando el QR. El archivo se tocó una sola vez. H-04 se cerró solo:
`vonMisesStress` pasó de devolver `0` a devolver `√3·τ` en corte puro sin que
`physics/tensors.js` cambiara una línea, que es la confirmación de que la causa
estaba donde el ADR decía. H-05 se resolvió con el caso base `n = 1` en
`cofactorMatrix`; H-01 y H-02, reemplazando factores truncados por sus
definiciones exactas.

La suite pasó de **281 pruebas a 298, todas en verde**: 21 pruebas nuevas menos
las 4 de `known-defects.test.js`, que se borraron al cerrarse lo que fijaban.

**Arquitectura.** Cuatro decisiones, y una que deliberadamente no se tomó:

1. *El despacho vive dentro de `eigenvaluesQR`, no en una función nueva.*
   ADR-004 §3 dice que `eigenvaluesQR` se conserva como pública y "deja de ser
   el único camino", pero H-03 estaba fijado sobre una llamada directa a esa
   función y la contraprueba que dejó escrita el Chat 5 es que `hasComplexHint`
   sea `false` para toda simétrica. Las dos cosas solo se cumplen si el despacho
   está adentro. La alternativa —un `eigenvalues()` nuevo con `eigenvaluesQR`
   como QR puro— dejaba H-03 y H-04 abiertos, o forzaba a cambiar el import de
   `tensors.js`, que no es el archivo de arreglo que el ADR designa.
   Consecuencia: el nombre `eigenvaluesQR` ya no describe lo que hace. Queda
   anotado como D10; renombrarlo es cambio de API pública y lo decide el Chat 1.
2. *`hasComplexHint` pasa de heurística a exacta en el caso 2×2.* Antes salía de
   mirar si quedaba residuo en la subdiagonal después de 500 iteraciones, que es
   lo que producía el falso positivo en simétricas. Ahora, para matrices
   simétricas es `false` por el teorema espectral, y en las 2×2 no simétricas
   sale del signo del discriminante del polinomio característico. Para el resto
   sigue siendo la heurística de la subdiagonal, porque no hay con qué
   reemplazarla mientras no exista aritmética compleja (D5).
3. *El mmHg se define como el torr (`101325/760`), no como el valor convencional
   `133.322387415`.* Las dos opciones son internamente consistentes y cierran
   H-02; la elegida cierra además la identidad `1 atm = 760 mmHg` de forma
   exacta, que es la que se verifica a mano. El inHg se deriva del mmHg
   (`25.4 mmHg`) en vez de redondearse por separado: redondear los dos por
   separado era precisamente la causa del hallazgo.
4. *H-05 se resuelve en `inverse.js` y no en `Matrix.minor`.* `minor(0,0)` sobre
   una 1×1 tendría que construir una `Matrix` de 0×0, que el constructor rechaza
   con razón. El caso base pertenece a quien interpreta el menor, no a quien lo
   extrae.

Lo que **no** se hizo, estando a mano: agregar desplazamientos de Wilkinson al
camino QR general. Habría sido cambiar el algoritmo más delicado del motor por
fuera de lo que el ADR pidió, y el caso que motivaba el arreglo ya está cubierto
por Jacobi (`WORKFLOW.md` Fase 4).

**Compatibilidad.** La API pública no perdió ni renombró nada: se agregaron dos
exports, `jacobiEigenDecomposition` y `eigenvalues2x2`, y pasó de 92 a 94
nombres. `eigenvaluesQR` conserva firma y forma de retorno
(`{ values, matrixT, hasComplexHint }`), así que ninguna calculadora futura tiene
que cambiar. `api-surface.test.js` falló hasta que los dos nombres quedaron
documentados en `docs/API.md`, que es exactamente para lo que el Chat 5 lo
escribió. No se tocó `modules/`, `js/`, `css/`, `assets/`, `index.html` ni
`legacy/`, y `physics/tensors.js` quedó sin modificar.

**Verificación.**

- Línea de base antes de tocar nada: `node tests/run.js` → 281 pruebas, todas
  pasan, Node v22.22.2. Al terminar: 298, todas pasan. Ninguna prueba fuera de
  `known-defects.test.js` falló en el camino.
- Los valores se verificaron contra la definición, no contra la salida del
  motor: `√3·τ` calculado como `Math.sqrt(3) * 50` en la prueba de corte puro,
  `1852/3600` como cociente, `Σλ = tr(A)` y `Πλ = det(A)` como verificación
  cruzada, y `A·v = λ·v` para cada autovector de Jacobi.
- Se agregó una prueba de que los autovectores de Jacobi son ortonormales: son
  el producto acumulado de rotaciones ortogonales, así que si dejan de serlo la
  acumulación está mal aplicada, y eso no lo detecta comparar autovalores.
- Ninguna tolerancia se subió. Al revés: las dos que `units.test.js` tenía
  aflojadas por H-01 y H-02 (`1e-6` y `1e-4`) volvieron a la de por defecto, y
  el factor del nudo se compara ahora por igualdad exacta.
- Contra `AI_RULES.md` §10: `eigen.js` quedó en 421 líneas (máximo 500) y su
  función más larga en 38 efectivas (máximo 50). Sin `throw` genéricos, sin
  `var`, sin globales, sin referencias al DOM.
- `eigen.js` no importa `formatter/`: las funciones portadas usaban
  `cleanNumber` para limpiar ruido, y ningún archivo de `algebra/` depende hoy
  de `formatter/`. En vez de crear esa dependencia, las rotaciones fuerzan a
  cero el elemento que anulan por construcción, que es donde estaba el ruido.

**Próximos pasos.** El Paso 2 (resto del port de ADR-001 §5) queda como
siguiente, más liviano: mínimos cuadrados por QR, spline reutilizable,
`solveLU`, `solveCholesky`, `numericalDerivative` —que además cerraría D4— y los
coeficientes de Lagrange. Tres cosas para evaluar, sin implementarlas ahora:
**(a)** D10, el nombre de `eigenvaluesQR`, que conviene resolver antes de que
una calculadora lo use y renombrarlo salga caro; **(b)** desplazamientos de
Wilkinson en el camino QR general, que hoy sigue siendo el más débil de los
tres; **(c)** D8, los ejemplos de `toScientific` y `formatNumber` en `API.md`,
que siguen contradiciendo el comportamiento real y son de esta zona.

---

### 2026-09-13 — Suite de pruebas del motor (Paso 1) · Chat 5

**Resumen.** Se construyó la batería de verificación completa del motor en
`tests/`: 281 pruebas repartidas en 16 archivos, en Node con ES Modules, sin
una sola dependencia externa ni framework de testing. Cubre las 92
exportaciones de `shared/math/index.js` con los cuatro casos que exige
`CODING_STANDARDS.md` §15 —normal, límite, error esperado con verificación del
`code`, y valor conocido— más la quinta categoría propia del proyecto, la
verificación cruzada entre métodos. `node tests/run.js` corre todo en unos 200
ms y devuelve código de salida 1 si algo falla, así que desde ahora es la
compuerta que `CODING_STANDARDS.md` §17 daba por existente.

La suite encontró **cinco defectos en el motor**, dos de ellos graves. Están
listados en §4 (Paso 1b) con su causa y su archivo. El más serio es H-04:
`vonMisesStress` devuelve 0 para un estado de corte puro —un eje a torsión, un
bulón trabajando al corte— cuando el valor correcto es √3·τ. No lanza ninguna
excepción: devuelve un número que dice "material sin solicitación". Es
consecuencia de H-03, un fallo del algoritmo QR con autovalores de igual
módulo, y los dos se cierran con el mismo arreglo en `eigen.js`.

**Arquitectura.** Cuatro decisiones, ninguna de las cuales toca la arquitectura
del proyecto —son internas de `tests/`— pero las cuatro con consecuencias para
quien trabaje sobre la suite:

1. *Un archivo de prueba exporta un arreglo `tests`, sin registro global.* No
   hay `describe/it` ni estado compartido entre archivos: cada `*.test.js` es
   un módulo ES común, importable por separado, y el ejecutor lo descubre por
   el sufijo del nombre. Alternativa descartada: un registro mutable que las
   pruebas van poblando al importarse, que es más cómodo de escribir y
   contradice `ENGINEERING_GUIDE.md` §9 (sin variables globales).
2. *Las aserciones numéricas delegan en `approximatelyEqual` del motor.*
   Escribir un `Math.abs(a-b) < tol` propio en `assert.js` habría duplicado un
   algoritmo que ya vive en `shared/` y, peor, habría dejado de detectar una
   regresión en la función de comparación del propio motor: si
   `approximatelyEqual` se rompe, media suite tiene que caerse, no seguir
   pasando con una copia local sana.
3. *El álgebra se partió en cinco archivos.* `Matrix` + Gauss + determinante +
   descomposiciones + autovalores en un solo archivo superaba holgadamente el
   límite de 500 líneas de `AI_RULES.md` §10. Separado, además, el informe de
   fallas dice en qué algoritmo está el problema.
4. *Los defectos conocidos se fijan en un archivo propio,
   `math/known-defects.test.js`, en vez de dejar pruebas en rojo.* Es la
   decisión discutible de la sesión, así que la justificación completa: una
   suite permanentemente roja deja de informar —a los dos días nadie distingue
   "las de siempre" de una regresión nueva— y eso anula el motivo por el que el
   Paso 1 bloqueaba al resto del plan. Esas pruebas fijan lo que el motor hace
   hoy, que es incorrecto, con el valor correcto, la causa y el archivo
   responsable escritos al lado. Cuando el Chat 2 corrija uno, esa prueba va a
   fallar: no es una regresión, es la señal de que el hallazgo se cerró.

**Compatibilidad.** No se modificó ni un byte de código de producción: la zona
del Chat 5 es `tests/` y no se salió de ahí. `shared/math/`, `modules/`, `js/`,
`css/` y `assets/` quedan exactamente como estaban. La API pública no cambió —
y ahora tiene una prueba de contrato, `api-surface.test.js`, que verifica las
92 exportaciones contra `docs/API.md` en las dos direcciones: algo documentado
que no se exporta, y algo exportado que no está documentado. Es la red que
protege a la API pública durante el Paso 2.

Se agrega también el archivo modificado `tests/README.md`, que documentaba la
suite como pendiente.

**Verificación.** La suite se validó ejecutándola, nunca leyéndola:

- 281 pruebas, 16 archivos, todas pasan en Node v22 sobre el motor tal como
  está en el repositorio.
- Seis pruebas fallaron durante el desarrollo. Cinco resultaron ser errores de
  la prueba, no del motor, y quedaron documentadas con el motivo en el propio
  archivo: dos comparaban flotantes en valores no representables en binario
  (`1 + 1e-10`), una confundía el conteo de iteraciones con el largo del
  historial de Newton, una elegía un punto donde la derivada se anula pero que
  además es la raíz, y una esperaba `NOT_INTEGER` donde la validación de
  finitud corre primero y da `NOT_FINITE`. La sexta era real y destapó H-03 y
  H-04.
- Ninguna tolerancia se subió para hacer pasar una prueba. Las dos que están
  por encima de la de por defecto —unidades y autovalores— llevan al lado el
  motivo y una prueba adicional que acota el desvío para que no crezca sin que
  nadie se entere.
- Auditoría estática del motor contra `CODING_STANDARDS.md`: sin `throw`
  genéricos, sin `var`, sin variables globales, sin referencias al DOM, sin
  comparación de flotantes con `==`, ningún archivo por encima de 500 líneas.
  Una sola función excede el máximo de 50 líneas sin la justificación que
  `AI_RULES.md` §10 pide: queda anotada como D9.

**Próximos pasos.** Paso 1b: los cinco hallazgos, empezando por H-03, que
arrastra a H-04. Recién después el Paso 2 (port desde `legacy/motor-v1/`), que
ahora se puede hacer con red. Dos cosas que **no** se hicieron y convendría
evaluar más adelante, sin implementarlas ahora: pruebas con entradas aleatorias
y semilla fija, que encuentran lo que ninguna matriz elegida a mano encuentra;
y una medición de cobertura real, para saber qué ramas del motor la suite
todavía no pisa.

---

### 2026-09-13 — Control de versiones y publicación

**Resumen.** La carpeta local quedó vinculada al repositorio de GitHub que ya
existía, conservando sus 6 commits previos. Se creó la rama `develop` y se
publicó el sitio con GitHub Pages.

**Arquitectura.** Ninguna decisión nueva. Se materializaron ADR-002 (ES Modules
servidos por HTTP) y `ENGINEERING_GUIDE.md` §17 (flujo `main`/`develop`).

**Verificación.**
- Historial: 7 commits, los 6 originales intactos bajo el commit de
  consolidación. 109 archivos versionados.
- `main` y `develop` apuntan al mismo commit; `main` es la rama por defecto.
- El motor importado desde el clon del repositorio remoto pasa las
  comprobaciones en Node: determinante, inversa, conversión de unidades,
  producto escalar, Newton-Raphson e interpolación lineal. 92 exportaciones.
- Que Node en Linux resuelva todo el grafo de módulos desde `index.js` confirma
  además que no hay diferencias de mayúsculas en las rutas de importación —
  Windows no las detecta, GitHub Pages sí.
- `shared/math/index.js` responde correctamente servido desde GitHub Pages.

**Próximos pasos.** Paso 1: la suite de pruebas (Chat 5).

---

### 2026-09-12 — Consolidación del repositorio (Paso 0)

**Resumen.** Se unificaron tres carpetas sueltas (`AA - Instrucciones`,
`CalculadoraAlgebra`, `CalculadorasIngenieria-v2-motor-hardening`) en un único
repositorio con la estructura de `ENGINEERING_GUIDE.md` §4. Se relevó el estado
del proyecto y se compararon export por export las dos copias existentes del
motor.

**Arquitectura.** Tres decisiones registradas como ADR-001, ADR-002 y ADR-003.
Se eligió el motor v2 como canónico; se preservó el v1 bajo `legacy/motor-v1/`
únicamente como fuente para el port del Paso 2; se congeló la calculadora V1 en
`legacy/calculadora-algebra-v1/`.

**Compatibilidad.** No se modificó ni un archivo del motor: `shared/math/` es
copia idéntica de la v2. La API pública no cambió.

**Próximos pasos.** Paso 1 (pruebas), luego Paso 2 (port), luego Versión 3.

---

## Cómo actualizar este archivo

Al cerrar una sesión de trabajo, pegá el Informe de la Fase 7 de
`WORKFLOW.md` como una entrada nueva en §6 (Bitácora), y actualizá §1, §3 y §4
si cambiaron. Si se tomó una decisión de arquitectura, agregá el ADR en §2.
