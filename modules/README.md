# modules/

Una carpeta por disciplina. **Solo interfaz.**

Chat responsable: 3 (Interfaz y Calculadoras), con el 4 en la capa visual.

---

## La única regla que importa acá

Ningún archivo de este directorio implementa un algoritmo científico. La
responsabilidad de un módulo es exactamente esta, y nada más
(`ENGINEERING_GUIDE.md` §7):

1. leer datos del usuario
2. validarlos
3. invocar al motor
4. mostrar resultados

```js
// SIEMPRE
import { inverse, Matrix, formatMatrix } from "../../shared/math/index.js";

// NUNCA
import { inverse } from "../../shared/math/algebra/inverse.js";
```

Si te falta una operación matemática, **no la escribas acá**. Emití un pedido
al motor con el formato de `docs/CHAT_ROLES.md` §5.

---

## Estado

| Módulo | Estado |
|---|---|
| `algebra/` | Vacío. **Versión 3a** — reescritura de `legacy/calculadora-algebra-v1/` sobre el motor. |

Disciplinas previstas, según `ENGINEERING_GUIDE.md` §5 y el roadmap:
matemática, física, aeronáutica, química, electrónica, conversiones,
propulsión, motores, ECU, estructuras, métodos numéricos.

---

## Cómo se agrega un módulo

1. Confirmar en `docs/Roadmap.md` que corresponde a la versión en curso.
2. Verificar que el motor ya cubre lo necesario. Si no, **primero** el motor
   (Chat 1 → Chat 2), después la calculadora. Nunca al revés: es el principio
   rector del roadmap.
3. Crear `modules/<disciplina>/` con su `index.html` y su JavaScript de
   interfaz.
4. Registrarlo en el dashboard.
5. Al cerrar, repasar la checklist de arquitectura del final de
   `docs/Roadmap.md`.
