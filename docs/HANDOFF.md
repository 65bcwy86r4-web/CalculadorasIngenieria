# HANDOFF.md

**Fuente de verdad operativa del proyecto.** Todo chat lo lee al empezar. El
responsable del proyecto lo actualiza al cerrar cada sesión de trabajo.

Última actualización: **2026-09-12**

---

## 1. Estado general

| Componente | Estado | Chat responsable |
|---|---|---|
| Motor `shared/math/` | Completo y documentado. 35 archivos. Sin pruebas en el repo. | 2 |
| `docs/` técnica | Architecture, API, Algorithms, Roadmap completos | 1 / 2 |
| `docs/governance/` | 4 documentos rectores, versión 1.0 | 1 |
| `tests/` | **Vacío.** Bloquea el Paso 2. | 5 |
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

---

## 3. Trabajo en curso

| Chat | Tarea | Estado |
|---|---|---|
| — | — | Ninguna sesión abierta |

---

## 4. Próximas tareas, en orden

### Paso 1 — Suite de pruebas del motor · Chat 5 · **siguiente**

Reconstruir la batería de verificación en `tests/math/`, en Node con ES
Modules, sin dependencias externas. Debe cubrir, por cada algoritmo: caso
normal, casos límite, errores esperados y valores conocidos; más verificación
cruzada entre métodos que calculan lo mismo por caminos distintos
(determinante por Gauss vs. cofactores, inversa vs. LU, autovalores vs. traza y
determinante).

*Es prerrequisito de todo lo demás: sin pruebas, el Paso 2 se hace a ciegas.*

### Paso 2 — Port de capacidades desde el motor v1 · Chat 2

Portar al motor canónico lo que se identificó como pérdida real en ADR-001.
La checklist completa, con prioridades, está en ese ADR §5. Al cerrarlo se
elimina `legacy/motor-v1/`.

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
| D1 | No hay suite de pruebas en el repo, pese a ser obligatoria (`AI_RULES.md` §20, `ENGINEERING_GUIDE.md` §15) | `tests/` | Alta |
| D2 | Capacidades del motor v1 aún no portadas | ADR-001 §5 | Alta |
| D3 | `CODING_STANDARDS.md` §2 exige nombres de archivo en kebab-case; el motor usa `MathError.js`, `DimensionError.js` (PascalCase) | Estándar vs. `shared/math/errors/` | Media — decidir en Chat 1 |
| D4 | `DEFAULT_DERIVATIVE_STEP` se exporta desde `utils/constants.js` pero no existe una `numericalDerivative` pública que la use; hoy la derivada numérica está embebida en `newton.js` | `shared/math/` | Media |
| D5 | Aritmética compleja ausente: bloquea análisis de circuitos de corriente alterna y autovalores complejos | `Roadmap.md`, Versión 5 | Baja — planificada |
| D6 | Sin repositorio git inicializado | raíz | Alta — trivial de resolver |

---

## 6. Bitácora

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
