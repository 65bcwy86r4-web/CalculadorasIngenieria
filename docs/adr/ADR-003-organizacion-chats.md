# ADR-003 — Organización del trabajo en chats por capa

- **Fecha:** 2026-09-12
- **Estado:** Aceptado
- **Decide:** responsable del proyecto

---

## 1. Contexto

El proyecto se desarrolla conversando con asistentes de IA. Hasta ahora, todo
ocurría en un único hilo: arquitectura, motor, interfaz y documentación
mezclados.

Eso trae tres problemas concretos:

1. **Dilución del contexto.** Un hilo que acumula decisiones de arquitectura,
   código de algoritmos y detalles de CSS termina con menos precisión en todos
   los frentes que uno enfocado.
2. **Riesgo arquitectónico.** Si el mismo interlocutor escribe la interfaz y el
   motor, la vía de menor esfuerzo ante una función faltante es escribirla ahí
   mismo en la calculadora. Eso es precisamente lo que `AI_RULES.md` §4
   prohíbe, y ninguna regla escrita lo impide por sí sola.
3. **Sin trazabilidad.** No queda registro de por qué se decidió algo, ni en
   qué estado quedó cada frente.

---

## 2. Alternativas consideradas

**A. Un solo chat.** Simple, sin sincronización que mantener. Pero es el estado
actual y es el que produjo tres copias del mismo motor conviviendo en disco sin
que nadie lo notara.

**B. División por rol de empresa** (desarrollador, diseñador, tester,
documentador). Intuitivo, pero los roles se solapan sobre los mismos archivos:
el desarrollador y el diseñador editan el mismo HTML, el tester y el
desarrollador el mismo módulo. Dos chats editando el mismo archivo es
precisamente el escenario que hay que evitar, porque ninguno ve lo que hizo el
otro.

**C. División por capa arquitectónica.** Las fronteras ya existen y están
escritas en `ENGINEERING_GUIDE.md` §3–§7: motor / interfaz / presentación /
gobernanza / verificación. Cada capa toca un conjunto disjunto de rutas y
necesita cargar un contexto distinto.

---

## 3. Decisión

**Se adopta la opción C: cinco chats divididos por capa.** El detalle completo
—responsabilidades, rutas que puede tocar cada uno, y las que no— está en
[`docs/CHAT_ROLES.md`](../CHAT_ROLES.md).

1. **Arquitectura y Gobernanza** — decide, no programa
2. **Motor** — solo `shared/math/`
3. **Interfaz** — solo `modules/`, `js/`, `index.html`
4. **Diseño** — solo `css/`, `assets/`
5. **QA** — solo `tests/`

Con dos mecanismos que sostienen el esquema:

- **El pedido al motor** (`CHAT_ROLES.md` §5). El Chat 3 no puede escribir
  algoritmos; cuando le falta uno, emite un pedido formal que el Chat 1
  evalúa. Esto convierte la regla de oro de una norma que hay que recordar en
  una imposibilidad práctica.
- **`docs/HANDOFF.md`**. Estado, decisiones y bitácora en un archivo que todo
  chat lee al empezar. Cada sesión cierra con el Informe de la Fase 7 de
  `WORKFLOW.md`, que se pega ahí.

> **Enmienda del 2026-09-13 — `CHAT_ROLES.md` 1.1.** Este ADR preveía que el
> responsable del proyecto pegara el informe en el HANDOFF. En la práctica el
> paso manual entre tener la información y registrarla es donde la información
> se pierde, así que el archivo se abrió: cada chat escribe su propia entrada
> de bitácora y puede proponer tareas y deuda. Las secciones que fijan el rumbo
> —decisiones (§2) y orden del plan (§4)— siguen siendo del Chat 1, que es lo
> que impide que el plan lo termine ordenando el último chat que habló. El
> reparto por sección está en `CHAT_ROLES.md` §6. La decisión de fondo de este
> ADR —dividir por capa arquitectónica— no cambia.

---

## 4. Consecuencias

**A favor**

- La arquitectura deja de depender de que cada interlocutor recuerde
  respetarla: la separación de zonas la hace cumplir estructuralmente.
- Cada chat carga menos contexto y responde con más precisión sobre su capa.
- Queda registro escrito de las decisiones (ADR) y del estado (HANDOFF).
- El Chat 5, adversarial por diseño, es el único que puede detectar que el
  Chat 2 y el Chat 3 se contradijeron.

**En contra**

- Hay que mantener `HANDOFF.md`. Si se abandona, los chats se desincronizan en
  días y el esquema es peor que un solo hilo, porque cada uno cree tener la
  versión correcta.
- Una tarea que cruza dos capas (una calculadora nueva que necesita una función
  nueva del motor) requiere tres pasos: pedido, aprobación, implementación.
  Más lento, pero es el orden que `Roadmap.md` ya prescribía —diseñar el motor
  primero y recién después la calculadora que lo consume—, ahora con un
  mecanismo que lo aplica.

**Impacto futuro**

- Chats 6 (Documentación) y 7 (Contenido didáctico) quedan previstos, a crear
  solo cuando el volumen los justifique.
- El esquema es independiente de la herramienta: si el proyecto pasa a
  desarrollarse con varias personas en vez de varios chats, las mismas zonas y
  el mismo mecanismo de pedido siguen aplicando.
