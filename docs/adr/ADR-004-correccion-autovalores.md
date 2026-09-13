# ADR-004 — Corregir los autovalores portando Jacobi, no parcheando el QR

- **Fecha:** 2026-09-13
- **Estado:** Aceptado
- **Decide:** responsable del proyecto
- **Relacionado:** ADR-001 §5 (checklist de port), HANDOFF §4 (Paso 1b)

---

## 1. Contexto

La suite de pruebas construida en el Paso 1 detectó cinco defectos en el motor.
Dos de ellos son el mismo problema visto desde dos lugares:

- **H-03.** `eigenvaluesQR` no converge cuando la matriz tiene autovalores de
  igual módulo y signo opuesto. Devuelve ceros y marca `hasComplexHint: true`
  incluso en matrices simétricas, que por el teorema espectral tienen todos sus
  autovalores reales.

- **H-04.** `vonMisesStress` devuelve `0` para un estado de corte puro, donde
  corresponde `√3·τ`. Es H-03 propagado: los autovalores de un tensor de corte
  puro son exactamente `+τ`, `−τ` y `0`.

Verificación, con el motor tal como está en el repositorio:

```
eigenvaluesQR([[0,1],[1,0]])                  -> [0, 0]          correcto: [1, -1]
principalValues([[0,100,0],[100,0,0],[0,0,0]]) -> [0, 0, 0]      correcto: [100, 0, -100]
vonMisesStress(corte puro, tau=100)            -> 0              correcto: 173.205
vonMisesStress(uniaxial 100)                   -> 100            correcto
vonMisesStress(biaxial 100/50)                 -> 86.603         correcto
```

H-04 es el defecto más serio del motor hoy, y no por el error numérico: por la
forma del error. No lanza excepción. Devuelve un número creíble —cero— que un
usuario lee como "el material no está solicitado", en el caso exacto de un eje
a torsión o un bulón trabajando al corte. Es el único tipo de defecto que usar
el programa no revela.

**El problema de secuencia.** El Paso 1b, tal como lo dejó escrito el Chat 5,
propone corregir `eigen.js`. Pero ADR-001 §5 ya tiene agendado, en prioridad
alta, portar `jacobiEigenDecomposition` y `eigenvalues2x2` desde
`legacy/motor-v1/` — precisamente porque Jacobi es más estable en matrices
simétricas. Es el mismo archivo y la misma causa, planificados dos veces en
pasos distintos.

---

## 2. Alternativas consideradas

**A. Parchear el QR actual.** Agregar desplazamientos (Wilkinson) y deflación
para que converja con autovalores de igual módulo. Arreglo contenido, sin
tocar la estructura del módulo, disponible antes.

Contra: `eigen.js` se reescribe de nuevo semanas después, en el Paso 2, para
incorporar Jacobi. Dos intervenciones sobre el algoritmo más delicado del
motor, cada una con su propio riesgo de regresión. Y el trabajo del parche se
descarta casi entero.

**B. Portar Jacobi y el 2×2 analítico ahora.** Adelantar los dos ítems de
prioridad alta de ADR-001 §5 y usarlos para cerrar H-03.

El código ya existe y está en el repositorio. Verificado contra los mismos
casos que fallan:

```
v1  eigenvalues([[0,1],[1,0]])                  -> [1, -1]
v1  jacobiEigenDecomposition(corte puro)         -> [100, 0, -100]
v1  eigenvalues2x2([[0,1],[1,0]])                -> [1, -1]
```

Contra: la sesión del Chat 2 es más larga, y el port exige reescribir esos
algoritmos al estilo del motor canónico (clase `Matrix`, named exports, JSDoc,
excepciones propias, pruebas), no copiar archivos.

**C. Delegar la decisión al Chat 2.** Pasarle el diagnóstico y que proponga con
el código a la vista. Coherente con que decida quien va a escribirlo, pero
agrega una vuelta de ida y vuelta a una decisión que el ADR-001 ya había
tomado en lo esencial.

---

## 3. Decisión

**Se adopta la opción B.**

El Paso 1b pasa a incluir el port anticipado de `jacobiEigenDecomposition` y
`eigenvalues2x2`. `shared/math/algebra/eigen.js` se toca **una sola vez**, y
queda con despacho por tipo de matriz:

| Caso | Método |
|---|---|
| 2×2 | solución analítica exacta, con detección de raíces complejas conjugadas |
| simétrica de cualquier orden | Jacobi |
| general | QR iterativo (el actual) |

`eigenvaluesQR` se conserva como función pública: es la API documentada y hay
calculadoras futuras que van a querer el método explícito. Lo que cambia es que
deja de ser el único camino.

Los otros tres hallazgos (H-05, H-01, H-02) se corrigen en la misma sesión: son
arreglos de pocas líneas en archivos que nadie más está tocando, y separarlos en
otra sesión cuesta más que resolverlos.

---

## 4. Consecuencias

**A favor**

- H-03 y H-04 se cierran con la implementación que ya está probada como
  correcta en esos casos, en vez de con un algoritmo nuevo a escribir y validar.
- Se tachan dos ítems de prioridad alta de ADR-001 §5 sin trabajo extra.
- El caso simétrico —el que más va a usar esta plataforma: tensores de tensión,
  matrices de covarianza, análisis estructural de la Versión 6— queda resuelto
  con el método numéricamente adecuado, no con el genérico.
- El caso 2×2, que es el que un estudiante resuelve a mano en un parcial, pasa a
  dar el valor exacto en vez de una aproximación iterativa.

**En contra**

- La sesión del Chat 2 es más larga y toca el algoritmo más delicado del motor.
  Lo hace con red: la suite del Paso 1 ya está, y `api-surface.test.js` protege
  la API pública.
- Queda una deuda que este ADR **no** resuelve: los autovalores complejos de
  matrices no simétricas de orden mayor que 2. El despacho los va a detectar en
  el caso 2×2 y va a seguir sin resolverlos en el general. Es D5 y sigue
  esperando aritmética compleja (`Roadmap.md`, Versión 5).

**Impacto futuro**

- El Paso 2 arranca con los dos ítems más riesgosos ya hechos; lo que queda ahí
  —mínimos cuadrados por QR, spline reutilizable, `solveLU`, `solveCholesky`—
  es independiente entre sí y se puede repartir.
- Al cerrar H-03 y H-04, las pruebas correspondientes de
  `known-defects.test.js` van a fallar. Eso es lo esperado: se borran de ahí y
  la verificación correcta se muda a `algebra-eigen.test.js` y `physics.test.js`
  (procedimiento en `tests/README.md`).
