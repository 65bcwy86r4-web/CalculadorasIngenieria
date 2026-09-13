# ADR-006 — La primera calculadora va antes que el resto del port

- **Fecha:** 2026-09-13
- **Estado:** Aceptado
- **Decide:** responsable del proyecto
- **Relacionado:** ADR-001 §5 (checklist de port), `Roadmap.md` (Versión 3)

---

## 1. Contexto

Al cerrarse el Paso 1b, el estado del proyecto es:

- El motor tiene **94 exportaciones públicas**, documentadas función por
  función, con 298 pruebas en verde y sin hallazgos abiertos.
- **Ninguna calculadora lo consume.** `modules/` está vacío.

Eso significa que la API pública de este proyecto fue diseñada, endurecida,
documentada y probada **sin que nadie la haya usado jamás para resolver un
problema real**. Las pruebas verifican que cada función hace lo que dice; no
pueden verificar que el conjunto sea cómodo de usar desde una interfaz, que los
`{ value, steps }` alcancen para renderizar un procedimiento, ni que no falte
una pieza de pegamento evidente.

El plan tenía como siguiente paso terminar el port de ADR-001 §5: mínimos
cuadrados por QR, spline reutilizable, `solveLU`, `solveCholesky`,
`numericalDerivative`, coeficientes de Lagrange.

Revisando para qué sirve cada uno de esos ítems:

| Ítem pendiente | Lo necesita |
|---|---|
| Mínimos cuadrados por QR | Ajuste de curvas — Versión 4 en adelante |
| Spline reutilizable | Graficar splines — Versión 4 |
| `solveLU`, `solveCholesky` | Conveniencia; `solveSystem` ya resuelve |
| `numericalDerivative` | Graficador de derivadas — Versión 4 |
| Coeficientes de Lagrange | Mostrar el polinomio — Versión 4 |

**Ninguno lo necesita la calculadora de álgebra de la Versión 3a.**

Y el propio `Roadmap.md`, en la Versión 3, ya lo había anticipado: *"Qué NO
requiere tocar el motor: nada de esta versión debería necesitar una función
nueva en `shared/math/`. Si durante la implementación aparece la necesidad de
una, es señal de que algo quedó mal cubierto en la Versión 2"*.

---

## 2. Alternativas consideradas

**A. Terminar el Paso 2 primero.** Cierra D2 y D4, permite borrar
`legacy/motor-v1/` y elimina la duplicación del repositorio. El Chat 2 tiene el
contexto fresco. Contra: agrega seis funciones más a una API que sigue sin
consumidores, y posterga otra vez la única prueba que puede validar el diseño.

**B. Construir la calculadora primero.** La Versión 3a es la prueba de fuego de
la API pública. Contra: `legacy/motor-v1/` sigue en el repositorio más tiempo,
y D2 queda abierta.

**C. Las dos en paralelo.** Chat 2 y Chat 3 trabajan en zonas disjuntas. Más
rápido en teoría. Contra: dos hilos simultáneos sobre un `HANDOFF.md` que recién
se abrió a varios chats (`CHAT_ROLES.md` 1.1), sin haber probado todavía ese
mecanismo con una sola sesión por vez.

---

## 3. Decisión

**Se adopta la opción B, con una sesión corta de motor antes.**

El orden pasa a ser:

### Paso 2a — Refactores de nombres · Chat 2 · sesión corta

Tres cosas que hay que hacer **antes** de que exista un consumidor, porque
después cuestan mucho más:

1. La API de autovalores de [ADR-005](ADR-005-api-de-autovalores.md).
2. D3: renombrar los cuatro archivos de excepción a kebab-case, cumpliendo
   `CODING_STANDARDS.md` §2 tal como está escrito.
3. D12: agregar `hPa` al catálogo de presión.

Son refactores puros, con las 298 pruebas como red. No agregan capacidades.

### Paso 3 — Versión 3a: la calculadora de álgebra · Chat 3 + 4

La prueba de fuego. Si durante la implementación aparece la necesidad de una
función que el motor no tiene, **eso es información valiosa**, no un
contratiempo: significa que la Versión 2 dejó algo sin cubrir. Se tramita como
pedido al motor (`CHAT_ROLES.md` §5), no implementándolo en la interfaz.

### Paso 2b — El resto del port · Chat 2

Lo que quedó de ADR-001 §5, cuando una calculadora lo necesite. `legacy/motor-v1/`
se borra al cerrarlo.

---

## 4. Consecuencias

**A favor**

- La API pública se valida contra un uso real antes de seguir creciendo. Si algo
  está mal diseñado, se descubre con 94 exportaciones y no con 110.
- Los refactores de nombres se hacen con costo de ruptura cero, que es la única
  ventana en que son baratos.
- El proyecto pasa de tener infraestructura a tener algo que se usa. Después de
  cuatro sesiones de motor, documentación y herramientas, es la primera vez que
  se va a poder abrir la plataforma y calcular algo.
- Se ejercita por fin el mecanismo de pedido al motor, que es el que sostiene
  toda la arquitectura (ADR-003) y que hasta ahora nunca se usó.

**En contra**

- D2 sigue abierta y `legacy/motor-v1/` sigue duplicado en el repositorio. Es
  peso muerto, no un riesgo: `legacy/` está congelado y ningún archivo lo
  importa, lo cual está verificado.
- Cuando el Paso 2b llegue, el Chat 2 va a haber perdido el contexto fresco del
  motor. Se compensa con lo que ahora sí existe y antes no: ADR-001 §5 como
  checklist, `docs/API.md` como contrato, y 298 pruebas.

**Impacto futuro**

- Queda establecido el criterio para ordenar el trabajo de acá en adelante: **una
  capacidad del motor se porta o se escribe cuando hay una calculadora que la
  pide**, no por completitud. Es lo que el principio rector de `Roadmap.md` ya
  decía, aplicado también al port.
