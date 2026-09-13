# HANDOFF.md

**Fuente de verdad operativa del proyecto.** Todo chat lo lee al empezar. El
responsable del proyecto lo actualiza al cerrar cada sesión de trabajo.

Última actualización: **2026-09-13**

- **Repositorio:** https://github.com/65bcwy86r4-web/CalculadorasIngenieria
- **Publicado en:** https://65bcwy86r4-web.github.io/CalculadorasIngenieria/
- **Carpeta local:** `Documents\Calculadoras Ingeniería`
- **Ramas:** se trabaja en `develop`. `main` queda estable y es la rama desde la
  que publica GitHub Pages: **el sitio no se actualiza hasta que `develop` se
  fusiona en `main`.**

---

## 1. Estado general

| Componente | Estado | Chat responsable |
|---|---|---|
| Motor `shared/math/` | Completo y documentado. 35 archivos. Cubierto por la suite. 5 hallazgos abiertos. | 2 |
| `docs/` técnica | Architecture, API, Algorithms, Roadmap completos | 1 / 2 |
| `docs/governance/` | 4 documentos rectores, versión 1.0 | 1 |
| `tests/` | **281 pruebas en 16 archivos, todas pasan.** Paso 1 cerrado. | 5 |
| `modules/` | **Vacío.** Ninguna calculadora consume el motor todavía. | 3 |
| `css/`, `assets/`, `js/` | Vacíos | 4 / 3 |
| `legacy/` | Congelado. No se importa desde ningún lado. | — |

**Versión del roadmap en curso:** transición de Versión 2 (motor) a Versión 3
(interfaz). Ninguna calculadora consume el motor todavía; esa es la brecha
principal.

---

## 2. Decisiones vigentes

| ADR | Decisión | Fecha |
|---|---|---|
| [ADR-001](adr/ADR-001-motor-canonico.md) | El motor canónico es el de la v2 (clase `Matrix`). Se portan capacidades puntuales desde el motor v1. | 2026-09-12 |
| [ADR-002](adr/ADR-002-ejecucion-esm.md) | ES Modules servidos por HTTP (servidor local + GitHub Pages). Se abandona la compatibilidad con `file://`. | 2026-09-12 |
| [ADR-003](adr/ADR-003-organizacion-chats.md) | El trabajo se reparte en 5 chats por capa arquitectónica. | 2026-09-12 |
| [ADR-004](adr/ADR-004-correccion-autovalores.md) | H-03 se corrige portando Jacobi y el 2×2 analítico desde `legacy/`, no parcheando el QR. `eigen.js` se toca una sola vez. | 2026-09-13 |

---

## 3. Trabajo en curso

| Chat | Tarea | Estado |
|---|---|---|
| 2 | Paso 1b: corregir H-01 a H-05, con H-03 resuelto según ADR-004 | Listo para arrancar |
| — | — | Ninguna otra sesión abierta |

**Pendiente del responsable del proyecto:** la suite del Paso 1 está en la
carpeta local pero **todavía no se subió al repositorio**. Hay que commitearla
en `develop` antes de que el Chat 2 empiece, porque es la red que protege su
trabajo.

---

## 4. Próximas tareas, en orden

### Paso 1 — Suite de pruebas del motor · Chat 5 · ~~siguiente~~ **cerrado el 2026-09-13**

281 pruebas en 16 archivos, sin dependencias externas. `node tests/run.js` es
desde ahora la compuerta de toda PR (`CODING_STANDARDS.md` §17). Detalle en la
bitácora, §6.

### Paso 1b — Corregir los hallazgos del motor · Chat 2 · **siguiente**

Cinco hallazgos abiertos, fijados y documentados en
`tests/math/known-defects.test.js`. El orden importa: **H-03 arrastra a H-04**,
así que corrigiendo autovalores se cierran los dos.

**Cómo se corrige H-03 está decidido en [ADR-004](adr/ADR-004-correccion-autovalores.md):
portando `jacobiEigenDecomposition` y `eigenvalues2x2` desde `legacy/motor-v1/`,
no parcheando el QR.** `eigen.js` queda con despacho por tipo de matriz —2×2
analítico, simétrica por Jacobi, general por QR— y se toca una sola vez. Eso
adelanta además dos ítems de prioridad alta de ADR-001 §5, que salen del Paso 2.

| # | Qué | Dónde | Prioridad |
|---|---|---|---|
| H-03 | `eigenvaluesQR` devuelve `[0, 0]` y marca `hasComplexHint` en matrices simétricas con autovalores ±λ. La iteración QR sin desplazamiento no converge con autovalores de igual módulo | `shared/math/algebra/eigen.js` | **Alta** |
| H-04 | `vonMisesStress` devuelve 0 en corte puro, donde corresponde √3·τ. Es H-03 propagado: un resultado equivocado que subestima la solicitación, sin excepción ni aviso | `shared/math/physics/tensors.js` (causa en `eigen.js`) | **Alta** |
| H-05 | `cofactorMatrix` y `adjugate` lanzan `DimensionError` con una matriz 1×1; corresponde `[[1]]`. El caso base no está contemplado | `shared/math/algebra/inverse.js` | Media |
| H-01 | Factor del nudo truncado: `0.514444444` en vez de `1852/3600` exacto (desvío 8.6e-10 relativo) | `shared/math/units/speed.js` | Baja |
| H-02 | `mmHg` e `inHg` no son mutuamente consistentes: 1 inHg da 25.4000064 mmHg y debería dar 25.4 exactos | `shared/math/units/pressure.js` | Baja |

Al cerrar cada hallazgo, la prueba correspondiente de `known-defects.test.js`
va a fallar: eso **no** es una regresión, es la señal de que el hallazgo se
cerró. El procedimiento está en `tests/README.md`.

*Se adelanta al port porque son cinco arreglos acotados sobre archivos que el
port va a tocar igual, y porque H-04 es un resultado silenciosamente
incorrecto en un caso de uso central de la carrera.*

### Paso 2 — Port de capacidades desde el motor v1 · Chat 2

Portar al motor canónico lo que se identificó como pérdida real en ADR-001.
La checklist completa, con prioridades, está en ese ADR §5. Al cerrarlo se
elimina `legacy/motor-v1/`.

Los dos ítems de autovalores (`jacobiEigenDecomposition` y `eigenvalues2x2`) se
adelantan al Paso 1b por ADR-004. Lo que queda acá —mínimos cuadrados por QR,
spline reutilizable, `solveLU`, `solveCholesky`, `numericalDerivative`,
coeficientes de Lagrange y el grupo de prioridad baja— es independiente entre sí
y se puede repartir en varias sesiones.

### Paso 3 — Versión 3a: calculadora de álgebra sobre el motor · Chat 3 + 4

Reescribir la calculadora de álgebra en `modules/algebra/`, importando
exclusivamente desde `shared/math/index.js`. Es la prueba de fuego de la API
pública: si aparece la necesidad de una función que no existe, es señal de que
algo quedó mal cubierto en la Versión 2 (`Roadmap.md`, Versión 3).

Referencia funcional: `legacy/calculadora-algebra-v1/` (25 operaciones,
procedimiento paso a paso, historial, exportación, pegado desde planilla,
atajos de teclado). Es referencia de **qué** hace, no de **cómo** está escrito.

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
| D2 | Capacidades del motor v1 aún no portadas | ADR-001 §5 | Alta |
| D3 | `CODING_STANDARDS.md` §2 exige nombres de archivo en kebab-case; el motor usa `MathError.js`, `DimensionError.js` (PascalCase) | Estándar vs. `shared/math/errors/` | Media — decidir en Chat 1 |
| D4 | `DEFAULT_DERIVATIVE_STEP` se exporta desde `utils/constants.js` pero no existe una `numericalDerivative` pública que la use; hoy la derivada numérica está embebida en `newton.js` | `shared/math/` | Media |
| D5 | Aritmética compleja ausente: bloquea análisis de circuitos de corriente alterna y autovalores complejos | `Roadmap.md`, Versión 5 | Baja — planificada |
| ~~D6~~ | ~~Sin repositorio git inicializado~~ | — | **Resuelta el 2026-09-13** |
| ~~D7~~ | ~~`vincular-github.ps1` y `VINCULAR-GITHUB.bat` en la raíz~~ | — | **Resuelta el 2026-09-13** (commit `52dcf14`) |
| D8 | Los ejemplos de `toScientific` y `formatNumber` en `docs/API.md` contradicen el comportamiento real y el nombre del propio parámetro `significantDigits`. El código está bien; la documentación, no | `docs/API.md` | Baja — Chat 2 |
| D9 | `cubicSplineInterpolate` tiene 54 líneas de código efectivas, por encima del máximo de 50 de `AI_RULES.md` §10, sin la justificación técnica que ese artículo exige | `shared/math/interpolation/spline.js` | Baja |

---

## 6. Bitácora

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
