[README.md](https://github.com/user-attachments/files/29668385/README.md)
# Calculadora de Álgebra Lineal

Aplicación web profesional para el cálculo y estudio de operaciones matriciales, pensada para estudiantes universitarios de ingeniería (especialmente Ingeniería Aeroespacial). Funciona completamente en el navegador, sin instalación, sin conexión a internet y sin backend.

## Cómo usar la aplicación

1. Descomprimí la carpeta `CalculadoraAlgebra/` y abrí `index.html` con doble clic (o "Abrir con" → tu navegador preferido: Chrome, Firefox, Edge).
2. Elegí la dimensión de la matriz principal en el selector de la barra superior (de 2×2 a 15×15) y presioná **Generar matriz**.
3. Elegí una operación en el menú lateral izquierdo. Según la operación, aparecerán los paneles necesarios: matriz B, vector b, escalar k o exponente n.
4. Completá los valores (acepta enteros, decimales y negativos) y presioná **Calcular**.
5. El resultado aparece en el panel derecho superior, y el desarrollo matemático completo —paso a paso, como lo resolvería un profesor— en el panel de **Procedimiento**.
6. Podés exportar cualquier resultado como **TXT**, **CSV** o **PDF** (este último abre el diálogo de impresión del navegador; elegí "Guardar como PDF" como destino).
7. Podés **pegar matrices** copiadas desde Excel, Google Sheets o MATLAB con el botón "Pegar" de cada matriz (requiere permiso de portapapeles del navegador).
8. Todo cálculo se guarda automáticamente en el **historial** (ícono de reloj), donde podés reabrirlo o eliminarlo.
9. Cambiá entre tema claro y oscuro con el ícono de sol/luna.

### Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + N` | Generar una nueva matriz |
| `Ctrl/Cmd + Enter` | Calcular la operación seleccionada |
| `Ctrl/Cmd + D` | Calcular determinante (Gauss) directamente |
| `Ctrl/Cmd + E` | Exportar el resultado actual como TXT |
| `Ctrl/Cmd + H` | Abrir/cerrar el historial |
| `Ctrl/Cmd + B` | Mostrar/ocultar el menú lateral |

## Estructura del proyecto

```
CalculadoraAlgebra/
├── index.html          Estructura de la interfaz
├── style.css            Temas claro/oscuro, layout responsive
├── script.js             Punto de entrada de la aplicación
├── js/
│   ├── matrix.js          Clase Matrix: aritmética y propiedades básicas
│   ├── vectors.js          Operaciones vectoriales (usadas por QR y autovectores)
│   ├── gauss.js            Eliminación de Gauss, Gauss-Jordan, rango, sistemas
│   ├── determinant.js      Determinante (Gauss y cofactores)
│   ├── inverse.js          Inversa, adjunta, cofactores, número de condición
│   ├── eigen.js            LU, QR, Cholesky, autovalores, autovectores, diagonalización
│   └── ui.js               Controlador de interfaz (DOM, historial, export, atajos)
└── README.md
```

Los módulos se cargan como scripts clásicos (sin `type="module"`) para que la aplicación funcione al abrir `index.html` directamente desde el disco (protocolo `file://`), donde los módulos ES suelen bloquearse por política CORS del navegador.

## Algoritmos utilizados

- **Determinante**: triangulación por Eliminación de Gauss con pivoteo parcial — O(n³), recomendado para matrices grandes. Se ofrece también la expansión por cofactores (Laplace) como recurso teórico, limitada a matrices de hasta 7×7 por su costo O(n!).
- **Inversa**: Gauss-Jordan sobre la matriz aumentada [A | I].
- **Adjunta / cofactores**: definición clásica para n ≤ 6; para matrices mayores se usa adj(A) = det(A)·A⁻¹ por eficiencia.
- **Rango y sistemas lineales**: forma escalonada (y escalonada reducida) por Gauss, con detección de sistemas incompatibles y de infinitas soluciones.
- **Número de condición**: κ(A) = ‖A‖_F · ‖A⁻¹‖_F (norma de Frobenius), como indicador aproximado de sensibilidad numérica.
- **LU**: factorización con pivoteo parcial (P·A = L·U).
- **QR**: proceso de Gram-Schmidt clásico sobre las columnas de A.
- **Cholesky**: A = L·Lᵀ para matrices simétricas definidas positivas.
- **Autovalores**: algoritmo QR iterativo (Aₖ₊₁ = RₖQₖ), que converge a la diagonal de autovalores para el caso de espectro real.
- **Autovectores**: resolución del sistema homogéneo (A − λI)v = 0 mediante Gauss-Jordan sobre el núcleo.
- **Diagonalización**: A = P·D·P⁻¹, con P formada por los autovectores como columnas.

### Limitaciones conocidas

- El algoritmo de autovalores es numérico e iterativo: asume espectro real. Matrices con autovalores complejos conjugados (por ejemplo, rotaciones puras) no se resuelven de forma exacta; la interfaz lo advierte cuando detecta este caso.
- La exportación a PDF utiliza el diálogo de impresión nativo del navegador (no se generan bytes de PDF desde cero), para mantener el proyecto sin dependencias externas.
- El pegado desde el portapapeles requiere que el navegador conceda permiso de lectura del portapapeles (Chrome/Edge lo solicitan automáticamente; algunos navegadores requieren HTTPS o interacción explícita).

## Posibles mejoras futuras

- Shifts de Wilkinson o deflación en el algoritmo QR para acelerar y estabilizar la convergencia de autovalores, y soporte para autovalores complejos (bloques 2×2 de Schur).
- Factorización QR mediante reflexiones de Householder para mejor estabilidad numérica en matrices mal condicionadas.
- Generación nativa de PDF (por ejemplo, integrando una librería ligera) para no depender del diálogo de impresión del navegador.
- Modo de entrada simbólica (fracciones exactas) además del cálculo en punto flotante.
- Sincronización del historial entre dispositivos mediante almacenamiento en la nube (opcional).

## Créditos

Desarrollado como herramienta de estudio para cursada de Ingeniería, con foco en mostrar el procedimiento matemático completo de cada operación, no solo el resultado final.
