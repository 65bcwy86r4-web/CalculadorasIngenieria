# CHAT_ROLES.md

Versión: 1.0

Estado: Obligatorio

---

# 1. Por qué existe este documento

El proyecto se desarrolla conversando con asistentes de IA. Un solo chat que
haga todo acumula contexto hasta perder precisión, mezcla decisiones de
arquitectura con detalles de CSS, y —lo más grave— hace fácil que una
calculadora termine implementando un algoritmo propio "porque estaba a mano",
que es exactamente lo que `AI_RULES.md` §4 prohíbe.

La separación en chats no es una comodidad organizativa: **es el mecanismo que
hace cumplir la arquitectura.** Si el chat que escribe la interfaz no tiene
permitido tocar `shared/math/`, no puede violar la regla de oro aunque quiera.

---

# 2. Criterio de división

Los chats se dividen **por capa arquitectónica**, no por rol de empresa.

La razón: los roles tipo empresa (desarrollador, diseñador, tester) se solapan
sobre los mismos archivos y terminan pisándose. Las capas de este proyecto, en
cambio, ya tienen fronteras definidas en `ENGINEERING_GUIDE.md` §3–§7, y cada
una necesita cargar un contexto distinto.

---

# 3. Los cinco chats

## Chat 1 — Arquitectura y Gobernanza

**Rol de la IA:** asesor. **No** desarrollador. Coherente con `AI_RULES.md`
§28: las decisiones de arquitectura corresponden al responsable del proyecto.

**Responsabilidades**

- Decidir qué es motor y qué es interfaz ante cualquier duda.
- Aprobar o rechazar cambios a la API pública (`shared/math/index.js`).
- Mantener `ENGINEERING_GUIDE.md`, `AI_RULES.md`, `CODING_STANDARDS.md`,
  `WORKFLOW.md`, `Roadmap.md` y este documento.
- Redactar los ADR (`docs/adr/`) de toda decisión importante.
- Resolver los "pedidos al motor" que emite el Chat 3.

**Puede modificar:** `docs/governance/`, `docs/Roadmap.md`,
`docs/Architecture.md`, `docs/adr/`, `docs/CHAT_ROLES.md`.

**No toca:** ningún archivo `.js`, `.css` o `.html`.

**Contexto a cargar al iniciar:** los 4 documentos rectores + `Architecture.md`
+ `Roadmap.md` + `HANDOFF.md`.

---

## Chat 2 — Motor (`shared/math/`)

**Rol:** desarrollador del núcleo científico.

**Responsabilidades**

- Implementar, corregir y optimizar algoritmos en `shared/math/`.
- Mantener `shared/math/index.js` actualizado con lo que deba ser público.
- Mantener `docs/API.md` y `docs/Algorithms.md` **en la misma entrega** que el
  código, nunca después (`Roadmap.md`, checklist de arquitectura).
- Escribir las pruebas de todo algoritmo que agregue.

**Puede modificar:** `shared/math/`, `docs/API.md`, `docs/Algorithms.md`,
`tests/math/`.

**No toca:** `modules/`, `css/`, `js/`, `index.html`, `assets/`. Nunca ve el
DOM. El motor no sabe que existen las calculadoras (`Architecture.md` §1).

**Entregable típico:** archivo completo + JSDoc con `@param`, `@returns`,
`@throws` y al menos un `@example` + pruebas + doc actualizada.

**Regla dura:** no puede agregar una función al motor por iniciativa propia
porque "la interfaz la va a necesitar". Solo implementa lo que el Chat 1
aprobó.

---

## Chat 3 — Interfaz y Calculadoras

**Rol:** desarrollador de aplicación.

**Responsabilidades**

- Construir el dashboard, el routing, el historial y los favoritos (`js/`,
  `index.html`).
- Construir cada calculadora en `modules/<disciplina>/`.
- Leer datos del usuario, validarlos con las funciones de validación del motor,
  invocar al motor, formatear y mostrar.

**Puede modificar:** `modules/`, `js/`, `index.html`.

**No toca:** `shared/math/` — **bajo ninguna circunstancia**.

**Prohibición explícita:** no implementa algoritmos. Si necesita una operación
matemática que el motor no expone, **no la escribe**: emite un *pedido al
motor* (formato en §5) que el responsable del proyecto lleva al Chat 1.

Este es el mecanismo central de todo el esquema. Solo funciona si el Chat 3
está separado del Chat 2.

---

## Chat 4 — Diseño y UX

**Rol:** diseñador de interfaz.

**Responsabilidades**

- Sistema de diseño: paleta, tipografía, espaciado, componentes.
- Temas claro y oscuro.
- Responsive y accesibilidad (contraste, foco, navegación por teclado, ARIA).
- Estética coherente entre todas las calculadoras.

**Puede modificar:** `css/`, `assets/`, y la estructura semántica del HTML
(clases, jerarquía de encabezados, atributos ARIA).

**No toca:** lógica JavaScript, `shared/math/`.

**Coordinación:** si un cambio de diseño exige modificar el HTML generado por
JavaScript, define el contrato (qué clases y qué estructura espera) y el Chat 3
lo implementa.

---

## Chat 5 — QA y Verificación

**Rol:** adversarial. Su trabajo es encontrar lo que los demás rompieron.

**Responsabilidades**

- Escribir y mantener la suite de pruebas (`tests/`).
- Verificar cumplimiento de `AI_RULES.md` y `CODING_STANDARDS.md`: límites de
  tamaño, JSDoc presente, excepciones propias, sin comparación de flotantes con
  `==`, sin variables globales.
- Buscar código duplicado y algoritmos implementados fuera del motor.
- Validar numéricamente contra valores conocidos y verificar métodos cruzados
  (ej.: determinante por Gauss vs. por cofactores; inversa vs. LU).

**Puede modificar:** `tests/`.

**No toca:** código de producción. Reporta; no arregla. Un hallazgo va al Chat 2
o al Chat 3 según la capa.

**Postura:** asume que el código tiene errores hasta demostrar lo contrario.
No valida por lectura: valida ejecutando.

---

# 4. Tabla de zonas

| Ruta | Chat propietario |
|---|---|
| `docs/governance/`, `docs/adr/`, `docs/Roadmap.md`, `docs/Architecture.md`, `docs/CHAT_ROLES.md` | 1 — Arquitectura |
| `shared/math/`, `docs/API.md`, `docs/Algorithms.md`, `tests/math/` | 2 — Motor |
| `modules/`, `js/`, `index.html` | 3 — Interfaz |
| `css/`, `assets/` | 4 — Diseño |
| `tests/` | 5 — QA |
| `docs/HANDOFF.md` | El responsable del proyecto (Bryan) |
| `legacy/` | Nadie. Congelado. |

Un chat que necesite tocar algo fuera de su zona **escala al Chat 1**. No lo
hace por su cuenta, ni siquiera si el cambio es de una línea.

---

# 5. Pedido al motor

Formato que emite el Chat 3 (o el 4) cuando le falta algo del motor. Se pega en
el Chat 1 para su evaluación.

```markdown
## Pedido al motor

**Origen:** Chat 3 — Interfaz
**Calculadora:** <cuál>
**Qué necesito:** <descripción de la operación en términos matemáticos>
**Por qué no alcanza lo que hay:** <qué intenté con la API actual y por qué no sirve>
**Firma propuesta:** <nombre(params) -> retorno>, si tengo una idea
**Bloqueante:** sí / no
```

El Chat 1 responde con una de tres:

1. **Ya existe** → indica qué función usar (lo más frecuente).
2. **Se aprueba** → redacta el ADR si corresponde y pasa la especificación al Chat 2.
3. **Se rechaza** → explica por qué no pertenece al motor y qué hacer en su lugar.

---

# 6. Continuidad entre sesiones

Cada chat, **al iniciar**, lee:

1. `docs/governance/` (los 4 rectores)
2. `docs/HANDOFF.md`
3. Este documento, para confirmar su zona
4. La documentación específica de su capa

Cada chat, **al terminar**, produce el Informe de la Fase 7 de `WORKFLOW.md`
(Resumen / Arquitectura / Compatibilidad / Próximos pasos). El responsable del
proyecto pega ese informe en `docs/HANDOFF.md`.

Sin ese ciclo, los chats se desincronizan en cuestión de días: dos de ellos
asumen versiones distintas del mismo archivo y el trabajo se pisa.

---

# 7. Reglas comunes a todos los chats

1. Respetar `ENGINEERING_GUIDE.md`, `AI_RULES.md`, `CODING_STANDARDS.md` y
   `WORKFLOW.md` sin excepción.
2. Entregar archivos completos. Nunca `...`, nunca "resto del código igual".
3. No modificar archivos fuera de la zona propia.
4. Ante una decisión de arquitectura: proponer y esperar aprobación, no
   implementar (`AI_RULES.md` §28).
5. Terminar siempre con el Informe de la Fase 7.
6. Si detecta un incumplimiento de estas reglas en código existente, reportarlo
   aunque no sea de su zona. Reportar sí; arreglar no.

---

# 8. Chats opcionales a futuro

A incorporar solo cuando el volumen lo justifique, no antes:

- **Chat 6 — Documentación**: si `docs/` crece al punto de que mantenerla desde
  los chats 1 y 2 se vuelve un cuello de botella.
- **Chat 7 — Contenido didáctico**: explicaciones teóricas, ejemplos resueltos
  y material de estudio dentro de cada calculadora.

Crear un chat antes de que exista el trabajo que lo justifique solo agrega
sincronización que mantener.
