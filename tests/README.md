# tests/

Pruebas del motor matemático. **Paso 1 del plan — todavía vacío.**

Chat responsable: 5 (QA y Verificación), según `docs/CHAT_ROLES.md`.

---

## Por qué esto es lo primero

`AI_RULES.md` §20 y `ENGINEERING_GUIDE.md` §15 las declaran obligatorias y no
opcionales. Más allá de la norma: el Paso 2 (portar capacidades desde
`legacy/motor-v1/`) toca archivos del núcleo del motor. Hacerlo sin una red de
seguridad es la forma más rápida de introducir una regresión silenciosa en un
algoritmo que ya funcionaba.

---

## Cómo se ejecutan

Node en modo ES Modules, sin dependencias externas ni framework de testing
(`AI_RULES.md` §11). El motor es puro y no conoce el DOM (`Architecture.md`
§3), así que corre en Node sin ninguna adaptación.

```bash
node tests/run.js
```

---

## Qué debe cubrir cada algoritmo

Los cuatro casos que exige `CODING_STANDARDS.md` §15:

1. **Caso normal** — entrada típica, resultado esperado.
2. **Casos límite** — matriz 1×1, matriz singular, vector vacío, división por
   cero, valores muy grandes o muy chicos, dominio de extrapolación.
3. **Errores esperados** — que lance la excepción correcta, con el `code`
   correcto. Verificar el `code`, no el mensaje: el mensaje está pensado para
   mostrarse y puede cambiar de redacción (`Architecture.md` §4).
4. **Valores conocidos** — resultados verificables a mano o contra
   bibliografía.

Más una quinta categoría propia de este motor:

5. **Verificación cruzada** — cuando dos caminos distintos calculan lo mismo,
   comparar sus resultados:
   - determinante por Gauss vs. por cofactores
   - inversa por Gauss-Jordan vs. producto `A · A⁻¹ = I`
   - suma de autovalores vs. traza; producto de autovalores vs. determinante
   - `L · U = P · A`, `Q · R = A`, `L · Lᵀ = A`
   - interpolación lineal vs. Lagrange con dos puntos (deben coincidir)
   - conversión de unidades de ida y vuelta

---

## Reglas

- Nunca comparar flotantes con `===`: usar `approximatelyEqual` del propio
  motor, o una tolerancia explícita (`AI_RULES.md` §14).
- Las pruebas importan desde `shared/math/index.js`, igual que cualquier
  calculadora. Si algo hace falta probar y no está exportado, es implementación
  interna y no se prueba directamente.
- Una prueba que falla no se "ajusta" cambiando la tolerancia hasta que pase.
  Se investiga.

---

## Estructura sugerida

```
tests/
├── run.js              Ejecutor: recorre math/, corre todo, informa
├── assert.js           Helpers mínimos (assertClose, assertThrows, assertMatrixClose)
└── math/
    ├── algebra.test.js
    ├── interpolation.test.js
    ├── numerical.test.js
    ├── physics.test.js
    ├── units.test.js
    ├── formatter.test.js
    └── validation.test.js
```
