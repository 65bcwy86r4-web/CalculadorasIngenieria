# Relevamiento del proyecto — 12 de septiembre de 2026

Estado del proyecto antes de la consolidación (Paso 0). Documento histórico:
describe la situación que motivó ADR-001, ADR-002 y ADR-003. No se actualiza.

---

## 1. Punto de partida

Tres carpetas sueltas en el escritorio, sin control de versiones:

```
Calculadoras Ingeniería/
├── AA - Instrucciones/                        4 documentos rectores
├── CalculadoraAlgebra/                        La aplicación V1
└── CalculadorasIngenieria-v2-motor-hardening/ Motor + documentación
```

### Documentos rectores

Cuatro, todos en versión 1.0, coherentes entre sí y exigentes:
`ENGINEERING_GUIDE.md` (rector: filosofía, arquitectura, roadmap V2→V6, flujo
git), `AI_RULES.md` (29 reglas), `CODING_STANDARDS.md` y `WORKFLOW.md` (7
fases obligatorias).

No cubrían cómo repartir el trabajo entre varios interlocutores. Esa brecha la
cierra `CHAT_ROLES.md`.

### CalculadoraAlgebra (V1)

Aplicación de una sola página, funcional: `index.html`, `style.css`,
`script.js` y `js/` con 7 archivos (`ui.js` de 30 KB). Carga scripts clásicos
sin `type="module"` para andar con doble clic sobre `file://`.

Adentro tenía además una carpeta `shared/math/` de 33 archivos **que la
aplicación no usaba**: no estaba referenciada en el HTML.

### CalculadorasIngenieria-v2-motor-hardening

Solo dos carpetas: `docs/` (Architecture, API, Algorithms, Roadmap — 81 KB de
documentación de buena calidad) y `shared/math/` (35 archivos, con `index.js`
como punto de entrada único).

No había `index.html`, `modules/`, `assets/`, `css/` ni `tests/`. La estructura
de `ENGINEERING_GUIDE.md` §4 no existía en disco.

---

## 2. Hallazgo principal: tres implementaciones del mismo álgebra

| Copia | Estilo | Situación real |
|---|---|---|
| `CalculadoraAlgebra/js/` | namespace global, scripts clásicos | Lo único que corría |
| `CalculadoraAlgebra/shared/math/` | ES Modules, funcional sobre arreglos planos, `export default`, sin `index.js` | Huérfana |
| `v2-motor-hardening/shared/math/` | ES Modules, `class Matrix`, named exports, `index.js` | Sin consumidores |

Las dos copias de `shared/math/` no eran versiones sucesivas: eran **APIs
incompatibles**. Migrar de una a otra es reescribir, no copiar.

Se compararon los símbolos exportados archivo por archivo. La mayoría de las
diferencias resultaron ser renombres a mejor; las pérdidas reales quedaron
enumeradas en `adr/ADR-001-motor-canonico.md` §5. Las tres más relevantes:

- **Método de Jacobi para autovalores** — más estable que el QR iterativo para
  matrices simétricas, que es el caso de tensores y análisis estructural.
- **Mínimos cuadrados por QR** — base de todo ajuste de curvas y regresión.
  Ausente por completo del motor canónico.
- **Spline cúbica reutilizable** — el motor canónico resuelve el sistema
  tridiagonal en cada evaluación; graficar una spline con 500 puntos
  resolvería 500 sistemas lineales.

---

## 3. Deuda contra los propios documentos rectores

| Regla | Estado en el relevamiento |
|---|---|
| `AI_RULES.md` §20 / `ENGINEERING_GUIDE.md` §15 — pruebas obligatorias | Sin carpeta `tests/` en ningún lado |
| `ENGINEERING_GUIDE.md` §17 — git `main`/`develop`/`feature` | Sin repositorio; el versionado eran nombres de carpeta |
| `AI_RULES.md` §6 — importar solo desde `index.js` | La calculadora no importaba nada del motor |
| `AI_RULES.md` §4 — ningún módulo implementa algoritmos | La V1 los tenía todos embebidos |
| `CODING_STANDARDS.md` §2 — archivos en kebab-case | El motor usa `MathError.js`, `DimensionError.js` |

Ninguna de estas deudas era grave con un proyecto de este tamaño. Lo grave
habría sido arrancar la Versión 3 arrastrándolas.

---

## 4. Verificación del motor

Ejecutado en Node con ES Modules, importando desde `shared/math/index.js`:

```
det([[4,7],[2,6]])        = 10        ✓  (con 2 pasos de procedimiento)
inverse([[4,7],[2,6]])    = [[0.6,-0.7],[-0.2,0.4]]  ✓
convert(212, "F", "C")    = 100       ✓
vectors.dot([1,2,3],[4,5,6]) = 32     ✓
Exportaciones públicas totales: 92
```

El motor carga y calcula correctamente. Los objetos `{ value, steps }` que
devuelven los algoritmos de `algebra/` traen el procedimiento listo para
alimentar un panel paso a paso, sin recalcular del lado de la interfaz.

**Detalle menor detectado:** las claves de `unitsByCategory` están en español
(`distancia`, `presión`, `temperatura`, `velocidad`, `masa`, `energía`)
mientras los nombres de función están en inglés (`convertDistance`,
`convertPressure`). Los símbolos de unidad sí son los convencionales
(`"F"`, `"C"`). No es un error, pero conviene que el Chat 1 decida si se
unifica antes de que la interfaz dependa de esas claves.

---

## 5. Qué se hizo en el Paso 0

- Estructura única según `ENGINEERING_GUIDE.md` §4.
- Motor canónico: el de la v2, copiado sin modificar una sola línea.
- Documentación técnica y documentos rectores unificados bajo `docs/`.
- V1 y motor v1 congelados en `legacy/`, con condiciones de eliminación
  escritas.
- Tres ADR redactados, `HANDOFF.md` y `CHAT_ROLES.md` creados.
- `.gitignore` y `index.html` de verificación.

Lo que **no** se hizo, a propósito: no se tocó ni un archivo del motor. El port
de capacidades es el Paso 2 y va después de las pruebas.
