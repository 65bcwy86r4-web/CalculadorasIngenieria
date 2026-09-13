# ADR-002 — ES Modules servidos por HTTP

- **Fecha:** 2026-09-12
- **Estado:** Aceptado
- **Decide:** responsable del proyecto

---

## 1. Contexto

`ENGINEERING_GUIDE.md` §9 y `CODING_STANDARDS.md` §1 exigen ES Modules. El
motor está escrito así: `shared/math/index.js` reexporta todo el resto con
`export { ... } from './...'`.

Pero los navegadores **no cargan módulos ES sobre el protocolo `file://`**: los
bloquea la política de mismo origen. Abrir `index.html` con doble clic falla
con un error CORS antes de ejecutar una línea.

La calculadora de la Versión 1 esquivó esto usando scripts clásicos con un
namespace global, lo que le permitió funcionar con doble clic. Esa decisión
sirvió para una aplicación de una sola página, pero no escala a una plataforma
de decenas de módulos: sin `import` no hay forma de declarar dependencias, y el
orden de las etiquetas `<script>` pasa a ser el contrato.

La decisión no se puede postergar: define cómo se escribe cada línea de la
Versión 3.

---

## 2. Alternativas consideradas

**A. Mantener `file://` con scripts clásicos.** Doble clic y funciona, sin
herramientas. Pero exige modificar `ENGINEERING_GUIDE.md` §9 para abandonar ES
Modules, convierte el orden de los `<script>` en una dependencia implícita y
frágil, y obliga a reescribir el motor entero (35 archivos con `import`/`export`).

**B. ES Modules + paso de compilación que genere un archivo único.** Conserva
ES Modules en desarrollo y permite doble clic en distribución. Pero introduce
herramientas de compilación, que es exactamente lo que `AI_RULES.md` §11
restringe, y agrega un artefacto generado que puede quedar desfasado del
código fuente.

**C. ES Modules servidos por HTTP.** Un servidor local en desarrollo y GitHub
Pages para publicar. Cumple los documentos rectores tal como están escritos,
sin herramientas ni artefactos generados. Costo: no se puede abrir con doble
clic.

---

## 3. Decisión

**Se adopta la opción C.**

El proyecto se sirve por HTTP. En desarrollo, con un servidor estático local:

```bash
python -m http.server 8000
# o
npx serve .
```

En producción, publicado en GitHub Pages desde la rama `main`.

Se abandona explícitamente la compatibilidad con `file://` para el proyecto
principal. La calculadora de la Versión 1, congelada en
`legacy/calculadora-algebra-v1/`, la conserva, porque sigue usando scripts
clásicos y nadie la va a modificar.

---

## 4. Consecuencias

**A favor**

- `ENGINEERING_GUIDE.md` §9 se cumple sin excepciones ni notas al pie.
- Cero dependencias, cero herramientas de compilación, cero artefactos
  generados. El código que se lee es el que se ejecuta.
- GitHub Pages da una URL pública y gratuita: la plataforma se puede compartir
  con compañeros de cursada sin que instalen nada, y funciona desde el teléfono.
- Publicar en GitHub resuelve además la deuda D6 (control de versiones), que
  `ENGINEERING_GUIDE.md` §17 ya exigía.

**En contra**

- Levantar la aplicación requiere un comando. Fricción real, pero de una sola
  vez por sesión de trabajo, y la versión publicada no la tiene.
- El proyecto pasa a depender de que haya Python o Node instalado para
  desarrollo local. Ninguno es dependencia del producto: no se importa nada de
  ellos en tiempo de ejecución.

**Impacto futuro**

- Habilita, más adelante y sin rediseño, cosas que `file://` bloquea: Service
  Workers y por lo tanto la PWA planificada en el roadmap de
  `ENGINEERING_GUIDE.md` §19 (Versión 3), `fetch` de archivos de datos (tablas
  ISA, coeficientes aerodinámicos) en vez de incrustarlos en JavaScript, y Web
  Workers para cálculos pesados sin congelar la interfaz.
- El README documenta el comando de arranque como primer paso.
