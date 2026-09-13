# CalculadorasIngenieria

Plataforma modular de herramientas científicas y de ingeniería, escrita en
HTML5, CSS3 y JavaScript vainilla (ES Modules), sin frameworks ni
dependencias externas.

No es una colección de calculadoras independientes: es **una aplicación**
compuesta por módulos de interfaz que consumen **un único motor matemático
compartido** (`shared/math/`). Ninguna calculadora implementa algoritmos
propios.

---

## Estado actual

| Componente | Estado |
|---|---|
| Motor matemático `shared/math/` | ✅ Completo y documentado (35 archivos, punto de entrada único) |
| Documentación técnica `docs/` | ✅ Architecture, API, Algorithms, Roadmap |
| Documentos rectores `docs/governance/` | ✅ 4 documentos |
| Suite de pruebas `tests/` | ⬜ Pendiente — **Paso 1** |
| Port de capacidades del motor v1 | ⬜ Pendiente — **Paso 2** (ver `docs/adr/ADR-001`) |
| Interfaz `modules/` | ⬜ Pendiente — **Paso 3** (Versión 3) |

El estado detallado, quién está trabajando en qué y qué se decidió está en
**[`docs/HANDOFF.md`](docs/HANDOFF.md)**. Ese archivo es la fuente de verdad
operativa del proyecto: se lee al empezar y se actualiza al terminar.

---

## Cómo ejecutar

El proyecto usa ES Modules, que el navegador **no carga sobre `file://`**
(política CORS). Hace falta servirlo por HTTP. Cualquiera de estas opciones
alcanza:

```bash
# Python (viene con Windows si instalaste Python)
python -m http.server 8000

# Node
npx serve .
```

Después abrí `http://localhost:8000`.

Ver `docs/adr/ADR-002-ejecucion-esm.md` para el razonamiento detrás de esta
decisión y las alternativas que se descartaron.

> La calculadora de álgebra de la Versión 1 (`legacy/calculadora-algebra-v1/`)
> sí funciona con doble clic, porque usa scripts clásicos. Es código
> congelado: ver `legacy/README.md`.

---

## Estructura

```
CalculadorasIngenieria/
├── index.html              Dashboard (Versión 3, en construcción)
├── assets/                 Imágenes, íconos, fuentes
├── css/                    Estilos globales y sistema de diseño
├── js/                     Lógica de aplicación transversal (routing, historial)
├── modules/                Una carpeta por disciplina. Solo interfaz.
│   └── algebra/
├── shared/
│   └── math/               MOTOR. Punto de entrada único: shared/math/index.js
├── tests/                  Pruebas del motor (Node, ESM, sin dependencias)
├── docs/
│   ├── Architecture.md     Arquitectura en capas del motor
│   ├── API.md              Referencia función por función
│   ├── Algorithms.md       Detalle matemático de cada algoritmo
│   ├── Roadmap.md          Planificación Versión 3 → 6
│   ├── HANDOFF.md          Estado operativo entre sesiones de trabajo
│   ├── CHAT_ROLES.md       Cómo se reparte el trabajo entre chats
│   ├── adr/                Registro de decisiones de arquitectura
│   └── governance/         Documentos rectores (obligatorios)
└── legacy/                 Código congelado. No se importa desde ningún lado.
```

---

## Regla de oro

```js
// SIEMPRE
import { inverse, Matrix, convert } from "../../shared/math/index.js";

// NUNCA
import { inverse } from "../../shared/math/algebra/inverse.js";
```

Toda la lógica matemática vive en `shared/math/`. La interfaz lee datos, los
valida, invoca al motor y muestra resultados. Nada más.

---

## Antes de escribir código

Lectura obligatoria, en este orden:

1. `docs/governance/ENGINEERING_GUIDE.md` — documento rector
2. `docs/governance/AI_RULES.md` — reglas para IA
3. `docs/governance/CODING_STANDARDS.md` — estilo y convenciones
4. `docs/governance/WORKFLOW.md` — las 7 fases obligatorias
5. `docs/HANDOFF.md` — qué está pasando ahora
6. `docs/CHAT_ROLES.md` — qué te toca tocar a vos y qué no

---

## Git

- `main` — siempre estable
- `develop` — integración
- `feature/...` — funcionalidades nuevas

Convención de commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`,
`style:`, `perf:`, `build:`, `chore:` (ver `CODING_STANDARDS.md` §16).
