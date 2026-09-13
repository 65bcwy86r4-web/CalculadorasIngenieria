# Algorithms.md — Fundamentos matemáticos del motor

Este documento explica **cómo funciona** cada algoritmo implementado en
`shared/math/`, no solo qué hace. El objetivo es que sirva como
referencia de estudio (nivel de una materia de Análisis Numérico o
Álgebra Lineal de primer/segundo año de ingeniería), y como
justificación de cada decisión de diseño del motor: qué método se eligió,
por qué, y qué limitaciones tiene a propósito.

**Notación:** `A`, `B` son matrices; `Aᵀ` es la transpuesta; `aᵢⱼ` es el
elemento en la fila i, columna j (1-indexado en las fórmulas, aunque el
código use 0-indexado); `λ` es un autovalor; `v` es un autovector; `‖·‖`
es una norma. Todos los algoritmos de esta sección trabajan en
aritmética de punto flotante (IEEE 754 double, que es lo único que
ofrece JavaScript), por lo que la estabilidad numérica es una
preocupación real, no solo teórica.

---

# Parte I — Álgebra lineal numérica

## 1. Eliminación de Gauss (con pivoteo parcial)

**Objetivo:** transformar una matriz `A` en una matriz escalonada por
filas `U` (triangular superior, salvo columnas sin pivote) mediante
combinaciones lineales de filas, sin cambiar el espacio de soluciones de
ningún sistema asociado.

**Idea central:** tres operaciones elementales de fila no cambian el
conjunto de soluciones de `Ax = b`: (1) intercambiar dos filas, (2)
multiplicar una fila por un escalar no nulo, (3) sumarle a una fila un
múltiplo de otra. La eliminación de Gauss usa sistemáticamente las
operaciones (1) y (3) para anular, columna por columna, todos los
elementos por debajo de la diagonal.

**Algoritmo (tal como está implementado en `algebra/gauss.js::rowEchelon`):**
Para cada columna `c` (de izquierda a derecha), sea `p` la fila de
pivote actual:
1. **Pivoteo parcial:** buscar, entre las filas `p, p+1, ..., n-1`, la
   de mayor `|elemento en columna c|`, e intercambiarla con la fila `p`.
2. Si ese máximo es ≈0 (dentro de una tolerancia), la columna no tiene
   pivote: se avanza a la siguiente columna sin incrementar `p` (esto es
   lo que permite manejar matrices rectangulares o con rango deficiente).
3. Para cada fila `r > p`: `Fᵣ ← Fᵣ − (aᵣc / apc) · Fₚ`, eliminando el
   elemento de la columna `c` en esa fila.
4. Incrementar `p` y continuar con la siguiente columna.

**¿Por qué pivoteo parcial?** Sin pivotear, un pivote pequeño (cercano a
0, aunque no exactamente 0) produce un factor de eliminación gigante
(`aᵣc / apc`), que amplifica cualquier error de redondeo ya presente en
la fila. Buscar el mayor valor absoluto disponible como pivote acota ese
factor a `≤ 1` en magnitud relativa, lo cual es la estrategia estándar
para mantener la eliminación numéricamente estable en aritmética finita.

**Complejidad:** `O(n³)` — más precisamente, unas `2n³/3` operaciones de
punto flotante para una matriz `n×n`, dominadas por el triple bucle
(columnas × filas por debajo × elementos por fila).

**Implementación:** `algebra/gauss.js::rowEchelon`. Devuelve, además del
resultado, la lista de pivotes usados y la cantidad de intercambios de
fila (`swapCount`), que es exactamente lo que necesita
`determinantByGauss` para calcular el signo del determinante (sección 3).

---

## 2. Gauss-Jordan (forma escalonada reducida)

**Objetivo:** llevar `A` no solo a triangular superior, sino a la forma
escalonada *reducida*: cada pivote vale exactamente 1, y es el único
elemento no nulo de su columna (también se eliminan los elementos por
*encima* de cada pivote, no solo por debajo).

**Algoritmo:** se parte del resultado de `rowEchelon` (sección 1) y,
para cada pivote (de abajo hacia arriba):
1. Se normaliza la fila del pivote dividiéndola por el valor del pivote,
   de modo que quede en 1.
2. Para cada fila por encima del pivote, se le resta el múltiplo
   necesario de la fila del pivote para anular el elemento en esa
   columna.

El resultado final, para una matriz cuadrada de rango completo, es la
identidad. Aplicado a una matriz aumentada `[A | I]`, este mismo proceso
es exactamente cómo se calcula la inversa (sección 4).

**¿Por qué separarlo de `rowEchelon` en dos funciones?** Porque el
determinante (sección 3) necesita los pivotes *sin normalizar* (su
producto, con signo, ES el determinante); si se normalizara cada pivote
a 1 antes de tomar el producto, esa información se perdería. Mantener
`rowEchelon` (sin normalizar) como la función más primitiva, y
construir `reducedRowEchelon` a partir de ella, evita que el motor
tenga dos implementaciones de la misma eliminación con pequeñas
diferencias.

**Complejidad:** `O(n³)`, mismo orden que `rowEchelon`, con una
constante mayor (hay que volver a recorrer las filas ya procesadas).

**Implementación:** `algebra/gauss.js::reducedRowEchelon`.

---

## 3. Determinante — Gauss vs. Cofactores (Laplace)

### 3.1 Método principal: triangulación de Gauss

**Fundamento teórico:** de las tres operaciones elementales de fila
(sección 1), su efecto sobre el determinante es conocido y constante:
- Intercambiar dos filas **cambia el signo** del determinante.
- Sumarle a una fila un múltiplo de otra **no cambia** el determinante.
- (La eliminación de Gauss tal como se implementó acá *no* escala
  filas, solo intercambia y suma múltiplos — por eso se usa
  `rowEchelon`, no `reducedRowEchelon`, para el determinante.)

Como el determinante de una matriz triangular es el producto de su
diagonal, y ninguna de las operaciones usadas cambia el determinante
salvo el signo por los intercambios:

```
det(A) = (−1)^(cantidad de intercambios) · (producto de los pivotes)
```

Si en algún momento no aparece pivote (columna de ceros), el rango es
deficiente y `det(A) = 0` directamente.

**Complejidad:** `O(n³)` (hereda la de `rowEchelon`), por lo que es el
método recomendado para cualquier tamaño de matriz que maneje esta
plataforma (hasta 15×15 y más).

### 3.2 Método teórico: expansión por cofactores (Laplace)

**Fundamento teórico (Teorema de Laplace):** para *cualquier* fila fija
`i`, `det(A) = Σⱼ aᵢⱼ · Cᵢⱼ`, donde `Cᵢⱼ = (−1)^(i+j) · Mᵢⱼ` es el
cofactor y `Mᵢⱼ` es el determinante del *menor* que resulta de eliminar
la fila `i` y la columna `j` (esto vale igual expandiendo por cualquier
columna). El motor expande siempre por la primera fila (`i = 0`) y
calcula cada `Mᵢⱼ` recursivamente con la misma fórmula, hasta llegar a
casos base 1×1 y 2×2.

**Complejidad:** cada llamada de tamaño `n` dispara `n` llamadas
recursivas de tamaño `n−1`, sin memoización (cada menor se recalcula
desde cero), lo que da la recurrencia `T(n) = n·T(n−1)`, es decir,
`T(n) = O(n!)`. Para `n = 10`, eso son `3.628.800` operaciones frente a
apenas `~670` de Gauss — la diferencia se vuelve abismal muy rápido.
Por eso el motor limita este método a `n ≤ 7` (`TOO_LARGE_FOR_COFACTORS`)
y lo ofrece únicamente como recurso didáctico para ver la definición
clásica "en acción", nunca como método de cálculo general.

**Implementación:** `algebra/determinant.js::determinantByGauss` y
`::determinantByCofactors`.

---

## 4. Inversa de una matriz (Gauss-Jordan sobre matriz aumentada)

**Fundamento teórico:** toda operación elemental de fila corresponde a
multiplicar por la izquierda por una *matriz elemental* `Eₖ`. Si una
secuencia de operaciones `E₁, E₂, ..., Eₖ` transforma `A` en la
identidad:

```
Eₖ···E₂E₁ A = I  ⟹  Eₖ···E₂E₁ = A⁻¹
```

Es decir, la *misma* secuencia de operaciones que reduce `A` a `I`,
aplicada a `I`, produce exactamente `A⁻¹`. Por eso alcanza con construir
la matriz aumentada `[A | I]` y aplicarle Gauss-Jordan completo
(sección 2): cuando el bloque izquierdo llega a `I`, el bloque derecho
ya es `A⁻¹` — sin necesitar ninguna operación extra.

**Detección de singularidad:** si durante la eliminación no aparece un
pivote no nulo para alguna de las primeras `n` columnas (rango de `A`
menor que `n`), `A` no es invertible. El motor cuenta específicamente
los pivotes que caen *dentro* de las primeras `n` columnas (no los que
pudieran aparecer, incidentalmente, dentro del bloque identidad
aumentado) para esta verificación — un detalle de implementación que
importa: contar mal acá haría que una matriz singular pareciera
invertible.

**Complejidad:** `O(n³)`.

**Implementación:** `algebra/inverse.js::inverse`. Lanza
`SingularMatrixError` si `A` no es invertible.

---

## 5. Adjunta y matriz de cofactores

**Definiciones:** la **matriz de cofactores** de `A` es
`C` tal que `Cᵢⱼ = (−1)^(i+j) · det(menor_ij)` (el mismo cofactor de la
sección 3.2, pero calculado para *cada* posición, no solo para expandir
una fila). La **adjunta** (o adjunta clásica) es `adj(A) = Cᵀ`.

**Identidad de Cramer:** para cualquier matriz invertible,
`A⁻¹ = adj(A) / det(A)`, equivalentemente `adj(A) = det(A) · A⁻¹`.

**Dos rutas de cálculo, según el tamaño:**
- **n ≤ 6:** se calcula `C` directamente por definición (cada `Cᵢⱼ`
  requiere un determinante de tamaño `n−1`, vía `determinantByGauss` —
  nunca por cofactores anidados, para no encadenar dos algoritmos
  costosos). Costo: `n²` determinantes de tamaño `n−1`, razonable para
  matrices chicas.
- **n > 6:** se usa la identidad de Cramer al revés:
  `adj(A) = det(A) · A⁻¹`, reutilizando `determinantByGauss` e
  `inverse` (ambos `O(n³)`) en vez de `n²` determinantes adicionales.
  Mismo resultado matemático, mucho más rápido para matrices grandes.

**Caso base `n = 1`:** el menor de una matriz `1×1` es la matriz vacía, y
`det(∅) = 1` por convención (es el producto vacío, igual que `0! = 1`). El
único cofactor vale entonces `(+1)·1 = 1`, así que `C = adj([[a]]) = [[1]]`
para todo `a`. No es una convención arbitraria: es el único valor que hace
que la identidad de Cramer siga valiendo en el caso base, porque
`adj(A)/det(A) = [[1]]/a = [[1/a]]`, que es efectivamente `A⁻¹`. Se
resuelve en `cofactorMatrix` y no en `Matrix.minor` porque una `Matrix` de
`0×0` no es un objeto válido del motor.

**Implementación:** `algebra/inverse.js::cofactorMatrix`, `::adjugate`.

---

## 6. Descomposición LU (con pivoteo parcial)

**Objetivo:** expresar `A` como producto `L·U`, con `L` triangular
inferior (diagonal de 1s) y `U` triangular superior — en la práctica,
con pivoteo parcial, `P·A = L·U`, donde `P` es una matriz de permutación.

**Fundamento teórico:** la descomposición LU **es**, literalmente, la
eliminación de Gauss (sección 1) con un cambio de perspectiva: en vez de
descartar los multiplicadores `mᵣc = aᵣc / apc` usados para eliminar
cada elemento, se los guarda en la posición `(r, c)` de `L`. Al
terminar, `U` es la matriz triangular superior resultante de la
eliminación (idéntica a la de `rowEchelon`), y `L` contiene, bajo su
diagonal de 1s, exactamente esos multiplicadores.

**¿Por qué hace falta `P`?** Sin pivotear, hay matrices perfectamente
invertibles para las que la eliminación falla en el primer paso porque
el pivote natural es 0 — el ejemplo canónico es `[[0,1],[1,0]]`, donde
`a₁₁ = 0` pero la matriz es invertible. El pivoteo parcial (igual que en
la sección 1) resuelve esto intercambiando filas cuando hace falta, y
`P` registra qué permutación de filas de `A` corresponde a la `U`
finalmente obtenida.

**Uso típico:** una vez factorizada `A = L·U` (o `PA = LU`), resolver
`Ax = b` para *múltiples* `b` con la misma `A` es mucho más barato que
repetir Gauss completo cada vez: se resuelven dos sistemas triangulares
(`Ly = Pb` por sustitución hacia adelante, luego `Ux = y` por sustitución
hacia atrás), cada uno `O(n²)` en vez de `O(n³)`.

**Complejidad:** `O(n³)` para factorizar (misma que Gauss, ya que es el
mismo proceso); `O(n²)` para resolver un sistema adicional una vez
factorizada.

**Implementación:** `algebra/lu.js::luDecomposition`. Lanza
`SingularMatrixError` si no se encuentra pivote no nulo en alguna
columna (matriz singular).

---

## 7. Factorización QR (Gram-Schmidt)

**Objetivo:** expresar `A` (de columnas linealmente independientes)
como `A = Q·R`, con `Q` de columnas ortonormales (`QᵀQ = I`) y `R`
triangular superior.

**Fundamento teórico — proceso de Gram-Schmidt clásico:** dadas las
columnas `a₁, a₂, ..., aₘ` de `A`, se construye una base ortonormal
`q₁, q₂, ..., qₘ` del mismo espacio, una columna a la vez:

```
v₁ = a₁                                          q₁ = v₁ / ‖v₁‖
v₂ = a₂ − (q₁·a₂)·q₁                              q₂ = v₂ / ‖v₂‖
v₃ = a₃ − (q₁·a₃)·q₁ − (q₂·a₃)·q₂                 q₃ = v₃ / ‖v₃‖
   ⋮
```

Es decir: a cada columna nueva se le resta su proyección sobre todas
las direcciones ortonormales ya construidas, dejando solo la componente
"nueva"; luego se normaliza. Los coeficientes de esas proyecciones son
exactamente las entradas de `R`: `Rᵢⱼ = qᵢ · aⱼ` para `j ≥ i` (y 0 para
`j < i`, lo que hace a `R` triangular superior por construcción, no por
casualidad).

**Limitación conocida:** el Gram-Schmidt *clásico* (el implementado
acá) es numéricamente menos estable que el Gram-Schmidt *modificado* o
que usar reflexiones de Householder, especialmente cuando las columnas
de `A` están casi alineadas entre sí (mal condicionadas): errores de
redondeo pequeños en `q₁` se propagan y se amplifican en `q₂, q₃, ...`.
Para las dimensiones que maneja esta plataforma (hasta 15×15) el efecto
es controlable, pero es una mejora pendiente documentada en
`Roadmap.md`.

**Uso en el motor:** `qrDecomposition` no es solo un resultado en sí
mismo — es la base del algoritmo de autovalores (sección 9).

**Complejidad:** `O(n³)`.

**Implementación:** `algebra/qr.js::qrDecomposition`.

---

## 8. Descomposición de Cholesky

**Objetivo:** para una matriz `A` simétrica y **definida positiva**
(`xᵀAx > 0` para todo `x ≠ 0`), expresarla como `A = L·Lᵀ`, con `L`
triangular inferior — la "raíz cuadrada" matricial de `A`.

**Derivación:** escribiendo la igualdad `A = LLᵀ` elemento a elemento e
imponiendo que `L` sea triangular inferior, se obtiene una fórmula
explícita, columna por columna:

```
L(i,i) = √( A(i,i) − Σₖ₌₀^(i−1) L(i,k)² )
L(i,j) = ( A(i,j) − Σₖ₌₀^(j−1) L(i,k)·L(j,k) ) / L(j,j)     para i > j
```

**¿Por qué requiere definida positiva?** El valor bajo la raíz en
`L(i,i)` debe ser estrictamente positivo para que `L(i,i)` sea real y no
nulo. De hecho, esto es más que una condición técnica: **que el
algoritmo logre completarse sin encontrar un valor ≤ 0 bajo la raíz es,
en sí mismo, una prueba constructiva de que `A` es definida positiva**
(y viceversa: si `A` lo es, el algoritmo siempre puede completarse). El
motor aprovecha exactamente esta propiedad para *detectar* el caso no
definido positivo, en vez de verificarlo por separado con autovalores.

**Ventaja frente a LU:** al ser simétrica, Cholesky solo necesita
calcular (y guardar) la mitad triangular de la matriz, con la mitad de
las operaciones de LU: `O(n³/3)` en vez de `O(2n³/3)`. Es el método
preferido siempre que la matriz cumpla la condición (por ejemplo,
matrices de rigidez en análisis estructural, o matrices de covarianza).

**Implementación:** `algebra/cholesky.js::choleskyDecomposition`. Lanza
`DimensionError` si no es simétrica, `MathError` (`NOT_POSITIVE_DEFINITE`)
si no es definida positiva.

---

## 9. Autovalores — Despacho por tipo de matriz

**Objetivo:** hallar los autovalores `λ` de una matriz cuadrada `A`
(los escalares para los que existe `v ≠ 0` con `Av = λv`).

**Por qué hay tres métodos y no uno.** No existe un algoritmo que sea a la
vez el más general y el más exacto. `eigenvalues` elige según la forma de
la matriz (ADR-004):

| Caso | Método | Sección |
|---|---|---|
| `1×1` | trivial: el único elemento | — |
| simétrica de cualquier orden | rotaciones de Jacobi | 9.2 |
| `2×2` no simétrica | polinomio característico (forma cerrada) | 9.3 |
| general | QR iterativo | 9.1 |

El despacho no es una optimización: es lo que hace correcto el caso
simétrico. La iteración QR sin desplazamiento **no converge** cuando dos
autovalores tienen el mismo módulo y signo opuesto, que es exactamente el
espectro de un tensor de corte puro (`±τ`, y `0`). Mientras ese fue el
único camino, pedir autovalores de `[[0,τ],[τ,0]]` devolvía `[0, 0]` y
`vonMisesStress` informaba "material sin solicitación" para un eje a
torsión.

**Una entrada que elige, y cada método por su nombre.** Cada uno de los
tres algoritmos se expone además por separado —`eigenvaluesQR`,
`jacobiEigenDecomposition`, `eigenvalues2x2`— porque poder pedir uno en
particular y verlo correr es contenido didáctico, no solo mecánica interna
(ADR-005). La consecuencia es que `eigenvaluesQR` **sí** exhibe la
limitación de arriba: es el algoritmo QR, y eso es lo que el algoritmo QR
hace. Quien quiere los autovalores sin elegir método usa `eigenvalues`.

---

### 9.1 QR iterativo (caso general)

**Fundamento teórico:** el algoritmo QR itera:

```
A₀ = A
Aₖ = Qₖ Rₖ        (factorización QR, sección 7)
Aₖ₊₁ = Rₖ Qₖ
```

El punto clave es que `Aₖ₊₁ = Rₖ Qₖ = (Qₖᵀ Aₖ) Qₖ = Qₖᵀ Aₖ Qₖ`. Como
`Qₖ` es ortogonal (`Qₖᵀ = Qₖ⁻¹`), esto es una **transformación de
similitud**: `Aₖ₊₁` es similar a `Aₖ` (mismos autovalores) para *todo*
`k`. Bajo condiciones razonables (autovalores reales, de distinto valor
absoluto), la sucesión `A₀, A₁, A₂, ...` converge a una forma triangular
superior, cuya diagonal son los autovalores.

**Sobre la convergencia:** la velocidad de convergencia depende de la
razón `|λᵢ₊₁ / λᵢ|` entre autovalores consecutivos (ordenados por
magnitud) — cuanto más parecidos en magnitud, más lenta la convergencia.
El motor usa una cantidad fija de iteraciones (500 por defecto,
`DEFAULT_QR_ITERATIONS`) sin *shifts* (a diferencia de implementaciones
de producción como LAPACK, que usan el shift de Wilkinson para acelerar
drásticamente la convergencia — una mejora pendiente, ver `Roadmap.md`).

**Cuándo no converge, y qué informa:** el método falla en dos situaciones,
y las dos se manifiestan igual —un bloque `2×2` no nulo bajo la diagonal—:

1. **Autovalores complejos conjugados.** No hay forma triangular real a la
   que converger.
2. **Autovalores reales de igual módulo** (`±λ`). La razón `|λᵢ₊₁/λᵢ|`
   vale 1 y la iteración no separa nunca los dos subespacios.

`hasComplexHint` se pone en `true` revisando si queda algún elemento
significativo en la subdiagonal al terminar, y cubre los dos casos: el
nombre dice "complejos" porque es la causa más frecuente, pero lo que
afirma en rigor es que *la iteración no triangularizó* y que la diagonal
no son los autovalores. Es preferible a reportar un resultado incorrecto
como si fuera válido, y es la razón por la que `eigenvalues` no manda las
matrices simétricas por acá.

**Complejidad:** `O(n³)` por iteración (una factorización QR completa),
así que `O(k·n³)` en total para `k` iteraciones.

**Implementación:** `algebra/eigen.js::eigenvaluesQR`. Es también el camino
general de `eigenvalues`, para matrices no simétricas de orden mayor que 2.

---

### 9.2 Rotaciones de Jacobi (matrices simétricas)

**Objetivo:** autovalores **y** autovectores de una matriz simétrica real,
sin las limitaciones de convergencia del QR sin desplazamiento.

**Fundamento teórico:** por el teorema espectral, toda matriz simétrica
real es diagonalizable por una matriz ortogonal: existe `Q` ortogonal tal
que `QᵀAQ = D` es diagonal. El método de Jacobi construye esa `Q` como
producto de rotaciones planas elementales, cada una de las cuales anula un
par simétrico de elementos fuera de la diagonal.

En cada paso se elige el elemento `a_pq` de mayor valor absoluto fuera de
la diagonal (estrategia clásica, no barrido cíclico) y se aplica la
rotación en el plano `(p, q)` con ángulo

```
θ = ½ · atan2(2·a_pq , a_qq − a_pp)
```

que por construcción hace `a_pq = 0`. Como cada rotación es ortogonal, la
transformación `A ← RᵀAR` es de semejanza: los autovalores se preservan
exactamente. Las rotaciones sucesivas pueden reintroducir un valor no nulo
donde antes había un cero, pero la **norma de Frobenius de la parte fuera
de la diagonal decrece estrictamente** en cada paso, así que el proceso
converge siempre. Al terminar, la diagonal son los autovalores y las
columnas del producto acumulado de rotaciones son los autovectores, ya
ortonormales por construcción.

**Por qué acá sí y en QR no:** Jacobi no depende de que los autovalores
tengan módulos distintos. Anula elementos concretos, no separa subespacios
por dominancia, así que `±λ` y los autovalores repetidos no lo afectan.

**Complejidad:** `O(n²)` por rotación (actualiza dos filas y dos columnas,
más la búsqueda del máximo) y típicamente `O(n²)` rotaciones para
converger, es decir `O(n⁴)` en el peor caso práctico. Más caro que QR por
iteración en matrices grandes, y preferible igual: en el rango de tamaños
de esta plataforma la diferencia es imperceptible y la corrección no es
negociable.

**Referencia:** Golub & Van Loan, *Matrix Computations*, 4ª ed., §8.5.

**Implementación:** `algebra/eigen.js::jacobiEigenDecomposition`. Lanza
`MathError` (`NOT_SYMMETRIC`) si la matriz no es simétrica: no es un método
de propósito general y devolver algo igual sería peor que no devolver nada.

---

### 9.3 Forma cerrada 2×2

**Objetivo:** resolver exacto el caso que un estudiante verifica a mano.

**Derivación:** para `A = [[a, b], [c, d]]`, el polinomio característico
`det(A − λI) = 0` se expande a

```
λ² − (a + d)·λ + (ad − bc) = 0
λ² − tr(A)·λ + det(A) = 0
```

de donde, por la fórmula cuadrática,

```
λ = ( tr(A) ± √(tr(A)² − 4·det(A)) ) / 2
```

El discriminante `Δ = tr² − 4·det` decide la naturaleza de las raíces:

| Δ | Raíces |
|---|---|
| `> 0` | dos autovalores reales distintos |
| `= 0` | un autovalor real doble |
| `< 0` | par complejo conjugado `tr/2 ± i·√(−Δ)/2` |

**Autovalores complejos:** el motor no representa números complejos
todavía (deuda D5 del `HANDOFF.md`). En vez de devolver reales inventados,
`eigenvalues2x2` devuelve `values: []` e informa el par por partes en
`realPart` e `imaginaryPart`, y `eigenvaluesQR` marca `hasComplexHint`. La
diferencia con el camino general es que acá la detección es **exacta** —
sale del signo del discriminante, no de mirar si quedó residuo en la
subdiagonal después de 500 iteraciones.

**Complejidad:** `O(1)`. Sin iteración y sin error de truncamiento.

**Implementación:** `algebra/eigen.js::eigenvalues2x2`.

---

### 9.4 Qué función llamar

| Función | Ejecuta | Cuándo |
|---|---|---|
| `eigenvalues` | el método que corresponda | por defecto: quiero los autovalores |
| `eigenvaluesQR` | 9.1, siempre | quiero ver el QR corriendo |
| `jacobiEigenDecomposition` | 9.2, solo simétricas | quiero Jacobi, o necesito los autovectores |
| `eigenvalues2x2` | 9.3, solo 2×2 | quiero la forma cerrada, o distinguir el par complejo |

`eigenvalues` informa en `method` cuál eligió, para que una calculadora
pueda explicar el procedimiento que efectivamente se ejecutó.

---

## 10. Autovectores — Núcleo de (A − λI)

**Objetivo:** dado un autovalor `λ` (ya conocido, típicamente por
`eigenvalues`, sección 9), hallar un vector `v ≠ 0` con `Av = λv`.

**Derivación:** `Av = λv ⟺ Av − λv = 0 ⟺ (A − λI)v = 0`. Es decir, `v`
es cualquier vector no nulo del **núcleo** (espacio nulo) de `A − λI`
— una matriz que, por ser `λ` un autovalor genuino, es necesariamente
singular (si no lo fuera, `(A−λI)v=0` solo tendría la solución trivial
`v=0`, y `λ` no sería autovalor).

**Algoritmo:** se lleva `A − λI` a forma escalonada reducida
(Gauss-Jordan, sección 2). Al ser singular, queda al menos una columna
sin pivote — una **variable libre**. Fijando esa variable libre en 1 y
despejando las variables pivote en función de ella (retrocediendo por
las filas de la RREF), se obtiene un vector no nulo del núcleo, que
luego se normaliza (se divide por su norma euclídea) para reportarlo
como vector unitario.

**Caso degenerado:** si un autovalor tiene multiplicidad algebraica
mayor que su multiplicidad geométrica (el núcleo de `A − λI` tiene
dimensión menor que la multiplicidad de `λ` como raíz del polinomio
característico), la matriz es **defectuosa** y no es diagonalizable.
`diagonalize()` (que construye `P` con los autovectores como columnas)
detecta este caso indirectamente: si `P` resulta singular
(autovectores linealmente dependientes), lanza `MathError`
(`NOT_DIAGONALIZABLE`) en vez de devolver una `P⁻¹` sin sentido.

**Complejidad:** `O(n³)` por autovalor (una eliminación de Gauss-Jordan
completa).

**Implementación:** `algebra/eigen.js::eigenvectorFor`, `::eigenvectors`,
`::diagonalize`.

---

# Parte II — Interpolación

## 11. Interpolación lineal

**Objetivo:** estimar el valor de una función en un punto `x`, conocidos
sus valores en dos puntos vecinos `(x₀,y₀)` y `(x₁,y₁)`.

**Derivación (geométrica):** se traza la recta que pasa por ambos
puntos y se evalúa en `x`. La pendiente de esa recta es
`(y₁−y₀)/(x₁−x₀)`, así que:

```
y = y₀ + (y₁ − y₀) · (x − x₀) / (x₁ − x₀)
```

**Interpolación por tramos (`piecewiseLinear`):** para una tabla de más
de dos puntos (por ejemplo, una tabla de propiedades atmosféricas por
altitud), se ordena la tabla por `x`, se localiza el tramo `[xᵢ, xᵢ₊₁]`
que contiene al punto pedido, y se aplica la fórmula anterior solo en
ese tramo. Esto la hace `C⁰` (continua) pero no derivable en los nodos
— su derivada tiene saltos exactamente en cada punto de la tabla.

**Error de interpolación:** si los datos provienen de una función `f`
dos veces derivable, el error de interpolar linealmente en `[x₀,x₁]`
está acotado por `|f''(ξ)| · (x₁−x₀)² / 8` para algún `ξ` en ese
intervalo (resto de Taylor de primer orden) — cuanto más curva la
función real entre los dos puntos, y cuanto más separados estén,
mayor el error. Esta es, precisamente, la motivación para usar splines
cúbicos (sección 13) cuando se necesita más precisión con pocos puntos.

**Complejidad:** `O(log n)` para ubicar el tramo si se buscara con
búsqueda binaria sobre una tabla ordenada; la implementación actual usa
búsqueda lineal (`O(n)`), suficiente para las tablas de decenas de filas
de esta plataforma.

**Implementación:** `interpolation/linear.js::linearInterpolate`,
`::piecewiseLinear`.

---

## 12. Interpolación de Lagrange

**Objetivo:** construir el único polinomio de grado `≤ n−1` que pasa
exactamente por `n` puntos dados `(x₁,y₁), ..., (xₙ,yₙ)` con abscisas
distintas, y evaluarlo en un punto `x`.

**Derivación:** se construyen `n` polinomios base `Lᵢ(x)`, uno por
punto, con la propiedad clave `Lᵢ(xⱼ) = 1` si `i = j`, y `0` si `i ≠ j`
(delta de Kronecker):

```
Lᵢ(x) = Πⱼ≠ᵢ (x − xⱼ) / (xᵢ − xⱼ)
```

Cada `Lᵢ` se anula en todos los demás nodos y vale 1 en el propio. El
polinomio interpolador es la combinación lineal:

```
P(x) = Σᵢ yᵢ · Lᵢ(x)
```

Y es *fácil* verificar que `P(xⱼ) = yⱼ` para todo `j`, precisamente
porque solo el término `i = j` sobrevive (todos los demás `Lᵢ(xⱼ) = 0`
para `i ≠ j`). El motor expone cada término (`weight`, `contribution`)
por separado en el resultado, justamente para poder mostrar esta
mecánica paso a paso.

**Unicidad:** por el teorema fundamental de la interpolación
polinómica, existe un único polinomio de grado `≤ n−1` que pasa por `n`
puntos con abscisas distintas — Lagrange no es "una forma más" de
interpolar, es *el* polinomio, escrito de una manera particular
(existen otras formas algebraicamente equivalentes, como la de Newton
con diferencias divididas, no implementada acá).

**Limitación importante — fenómeno de Runge:** para `n` grande con
nodos equiespaciados, el polinomio interpolador puede oscilar
violentamente cerca de los extremos del intervalo, incluso si los datos
provienen de una función perfectamente suave (el ejemplo clásico es
`f(x) = 1/(1+25x²)` en `[-1,1]`). Esto NO es un error de implementación:
es una propiedad del polinomio de grado alto en sí. Es la razón por la
que, para tablas largas, conviene usar splines (sección 13) en vez de
subir el grado de Lagrange.

**Complejidad:** `O(n²)` por evaluación (cada uno de los `n` términos
`Lᵢ(x)` cuesta `O(n)`).

**Implementación:** `interpolation/lagrange.js::lagrangeInterpolate`,
`::lagrangeBasis`.

---

## 13. Splines cúbicos naturales

**Objetivo:** interpolar `n` puntos con un polinomio *distinto por
tramo* (cúbico en cada uno), de forma que el resultado global sea `C²`
(la función, su primera y su segunda derivada son continuas en cada
nodo interior) — evitando tanto las esquinas de la interpolación lineal
como las oscilaciones de Lagrange de grado alto.

**Derivación:** en cada tramo `[xᵢ, xᵢ₊₁]` (de ancho `hᵢ = xᵢ₊₁ − xᵢ`),
el spline se escribe en función de las segundas derivadas `Mᵢ`, `Mᵢ₊₁`
en los nodos que lo delimitan:

```
Sᵢ(x) = Mᵢ·(xᵢ₊₁−x)³/(6hᵢ) + Mᵢ₊₁·(x−xᵢ)³/(6hᵢ)
        + (yᵢ/hᵢ − Mᵢ·hᵢ/6)·(xᵢ₊₁−x) + (yᵢ₊₁/hᵢ − Mᵢ₊₁·hᵢ/6)·(x−xᵢ)
```

Esta forma ya garantiza, por construcción, que `Sᵢ(xᵢ)=yᵢ`,
`Sᵢ(xᵢ₊₁)=yᵢ₊₁` y que la segunda derivada en los extremos del tramo es
`Mᵢ` y `Mᵢ₊₁` respectivamente (continuidad `C²` automática en valor y
en segunda derivada). Lo que falta es elegir los `Mᵢ` de forma que la
**primera derivada** también sea continua en cada nodo interior. Igualar
`Sᵢ₋₁'(xᵢ) = Sᵢ'(xᵢ)` para cada nodo interior `i = 1, ..., n−2` da un
sistema **tridiagonal** de `n−2` ecuaciones con `n−2` incógnitas
(los `Mᵢ` interiores):

```
hᵢ₋₁·Mᵢ₋₁ + 2(hᵢ₋₁+hᵢ)·Mᵢ + hᵢ·Mᵢ₊₁ = 6[ (yᵢ₊₁−yᵢ)/hᵢ − (yᵢ−yᵢ₋₁)/hᵢ₋₁ ]
```

**Condición "natural":** el sistema anterior tiene `n` incógnitas
(`M₀,...,Mₙ₋₁`) pero solo `n−2` ecuaciones (una por nodo *interior*);
faltan 2 condiciones de borde. El spline **natural** las fija en
`M₀ = Mₙ₋₁ = 0` (curvatura nula en los extremos) — existen otras
convenciones (spline sujeto, fijando la derivada primera en los
extremos; *not-a-knot*, forzando continuidad de la tercera derivada en
el segundo y anteúltimo nodo), no implementadas en este motor.

**Por qué se reutiliza `solveSystem` en vez de un solver tridiagonal
(Thomas):** el sistema anterior es tridiagonal y diagonalmente dominante
(se podría resolver en `O(n)` con el algoritmo de Thomas), pero el motor
lo arma como una `Matrix` densa `(n−2)×(n−2)` y lo resuelve con
`algebra/gauss.js::solveSystem` — el mismo solver que usa el resto del
motor. Ver `Architecture.md` sección 5 para la justificación completa:
para las tablas de decenas de filas de esta plataforma, la diferencia
de costo entre `O(n)` y `O(n³)` es irrelevante frente al beneficio de no
mantener una segunda implementación de "resolver un sistema lineal".

**Complejidad:** `O(n³)` tal como está implementado (por el solver
denso); `O(n)` si en el futuro se sustituyera por Thomas.

**Implementación:** `interpolation/spline.js::cubicSplineInterpolate`.

---

# Parte III — Métodos numéricos

Nota de diseño compartida por los tres métodos de búsqueda de raíces
(Newton-Raphson, bisección, secante): si el método no converge dentro
de `maxIterations`, el motor **lanza** `MathError` (`CONVERGENCE_FAILURE`)
en vez de devolver silenciosamente la última estimación. La razón: "no
convergió" no es un resultado matemático válido como sí lo son los tres
casos de `solveSystem` (única/infinitas/incompatible) — es una falla del
proceso iterativo, y devolverlo como si fuera un número normal invita a
usarlo por error en un cálculo posterior. El error siempre incluye el
historial completo de iteraciones en `context.history` para poder
diagnosticar qué pasó (¿oscilaba? ¿se acercaba muy lento? ¿divergía?).

## 14. Newton-Raphson

**Objetivo:** hallar una raíz de `f(x) = 0` a partir de una estimación
inicial `x₀`, cuando se dispone de la derivada `f'` (analítica o
aproximada).

**Derivación:** se aproxima `f` cerca de `xₙ` por su recta tangente
(desarrollo de Taylor truncado a primer orden):

```
f(x) ≈ f(xₙ) + f'(xₙ)·(x − xₙ)
```

Se busca dónde esa recta tangente cruza el eje x (`f(x) = 0`) como
siguiente estimación:

```
xₙ₊₁ = xₙ − f(xₙ) / f'(xₙ)
```

Geométricamente: en cada paso, se traza la tangente a la curva en el
punto actual, y el siguiente punto es donde esa tangente corta al eje x.

**Convergencia cuadrática:** cerca de una raíz simple (`f'(raíz) ≠ 0`),
el error de cada iteración es aproximadamente proporcional al
**cuadrado** del error anterior: `eₙ₊₁ ≈ C·eₙ²` (se deriva expandiendo
`f` a segundo orden de Taylor alrededor de la raíz). En la práctica,
esto significa que la cantidad de decimales correctos se **duplica** en
cada iteración una vez que se está razonablemente cerca — por eso
converge en pocas iteraciones cuando funciona bien.

**Modos de falla (por qué el motor valida cada uno):**
- `f'(xₙ) ≈ 0`: la tangente es casi horizontal, la siguiente
  estimación se dispara a infinito o queda mal definida
  (`ZERO_DERIVATIVE`).
- Mal punto de partida, o raíz múltiple (`f'(raíz) = 0` también): la
  convergencia deja de ser cuadrática (pasa a lineal) o el método
  directamente diverge u oscila (`DIVERGENCE`, o agotamiento de
  `maxIterations` → `CONVERGENCE_FAILURE`).

**Derivada numérica:** si no se provee `fPrime`, el motor la aproxima
por diferencias finitas centradas: `f'(x) ≈ (f(x+h) − f(x−h)) / (2h)`,
con `h = DEFAULT_DERIVATIVE_STEP = 1e-6` — un compromiso estándar entre
error de truncamiento (`O(h²)` para la fórmula centrada) y error de
redondeo (que crece cuando `h` es demasiado chico, por cancelación
catastrófica en `f(x+h) − f(x−h)`).

**Complejidad:** `O(1)` por iteración (una evaluación de `f` y de `f'`).

**Implementación:** `numerical/newton.js::newtonRaphson`.

---

## 15. Bisección

**Objetivo:** hallar una raíz de `f(x) = 0` en un intervalo `[a,b]`
donde se sabe, con certeza, que hay una.

**Fundamento teórico (Teorema de Bolzano):** si `f` es continua en
`[a,b]` y `f(a)` y `f(b)` tienen signos opuestos, existe al menos una
raíz en `(a,b)`. El método explota esto de la forma más directa
posible: evalúa el punto medio `m = (a+b)/2`; si `f(m)` tiene el mismo
signo que `f(a)`, la raíz está en `[m,b]` (se descarta `[a,m]`); si no,
está en `[a,m]`. Se repite sobre el subintervalo que "sobrevive".

**Convergencia garantizada y su costo:** cada iteración reduce el
ancho del intervalo a la mitad exacta, sin excepción — a diferencia de
Newton, este método **nunca diverge** si el bracket inicial es válido.
Eso permite calcular de antemano cuántas iteraciones hacen falta para
una tolerancia `ε` dada:

```
n ≥ log₂((b−a) / ε)
```

Es la contracara de Newton: mucho más lento (convergencia **lineal**,
un dígito correcto adicional cada ~3.3 iteraciones, no cada iteración),
pero con una garantía de convergencia que Newton no ofrece.

**Complejidad:** `O(1)` por iteración (una evaluación de `f`);
`O(log((b−a)/ε))` iteraciones totales para alcanzar tolerancia `ε`.

**Implementación:** `numerical/bisection.js::bisection`. Lanza
`MathError` (`INVALID_INTERVAL`) si `f(a)` y `f(b)` no tienen signos
opuestos (la condición de Bolzano no se cumple, no se puede garantizar
nada).

---

## 16. Método de la Secante

**Objetivo:** como Newton-Raphson, pero sin requerir (ni aproximar por
diferencias finitas) la derivada `f'`.

**Derivación:** se reemplaza la derivada de Newton por la pendiente de
la recta secante que pasa por los dos últimos puntos evaluados,
`(xₙ₋₁, f(xₙ₋₁))` y `(xₙ, f(xₙ))`:

```
f'(xₙ) ≈ (f(xₙ) − f(xₙ₋₁)) / (xₙ − xₙ₋₁)

xₙ₊₁ = xₙ − f(xₙ) · (xₙ − xₙ₋₁) / (f(xₙ) − f(xₙ₋₁))
```

Geométricamente: en vez de la tangente (que requiere conocer `f'`), se
usa la recta que une los dos puntos más recientes, y se avanza a donde
esa secante corta el eje x.

**Orden de convergencia — la proporción áurea:** se puede demostrar
(analizando la recurrencia de los errores `eₙ₊₁ ≈ C·eₙ·eₙ₋₁`) que el
orden de convergencia de la secante es `φ = (1+√5)/2 ≈ 1.618` — la
proporción áurea. Es **superlineal** pero **sub-cuadrático**: más lento
que Newton (orden 2) pero más rápido que bisección (orden 1), y sin
necesitar derivadas.

**Riesgo:** al igual que Newton, no está garantizado que converja
(puede diverger con un mal punto de partida, o si `f(xₙ) ≈ f(xₙ₋₁)` sin
que haya raíz cerca, lo que el motor detecta como denominador ≈ 0).

**Complejidad:** `O(1)` por iteración (una evaluación de `f`, reutiliza
la anterior).

**Implementación:** `numerical/secant.js::secant`. Lanza `MathError`
(`ZERO_DENOMINATOR`) si `f(xₙ) − f(xₙ₋₁) ≈ 0`.

---

## 17. Integración numérica — Regla del Trapecio

**Objetivo:** aproximar `∫ₐᵇ f(x) dx` cuando no se conoce (o no
conviene calcular) la antiderivada de `f`.

**Derivación:** en cada subintervalo `[xᵢ, xᵢ₊₁]` de ancho `h`, se
aproxima `f` por la recta que pasa por `(xᵢ, f(xᵢ))` y `(xᵢ₊₁, f(xᵢ₊₁))`
— es decir, exactamente la **interpolación lineal** de la sección 11 —
y se integra esa recta exactamente, lo que da el área de un trapecio:
`h · (f(xᵢ) + f(xᵢ₊₁)) / 2`. Sumando todos los subintervalos y
notando que cada punto interior se cuenta dos veces (una como extremo
derecho de un trapecio y otra como extremo izquierdo del siguiente):

```
∫ₐᵇ f(x)dx ≈ (h/2) · [ f(x₀) + 2f(x₁) + 2f(x₂) + ... + 2f(xₙ₋₁) + f(xₙ) ]
```

**Error:** para `f` con segunda derivada acotada, el error de la regla
compuesta es `O(h²)` — se reduce a un cuarto si se duplica la cantidad
de subintervalos. Es exacta (error 0) si `f` es lineal en cada tramo,
por construcción.

**Complejidad:** `O(n)` evaluaciones de `f` para `n` subintervalos.

**Implementación:** `numerical/integration.js::trapezoidal`. Si `a > b`,
integra igual y devuelve el resultado con signo negativo (convención
estándar `∫ₐᵇ f = −∫ᵦᵃ f`).

---

## 18. Integración numérica — Regla de Simpson

**Objetivo:** igual que el trapecio, pero con mayor precisión para la
misma cantidad de subintervalos, a costa de requerir que `n` sea par.

**Derivación:** en vez de aproximar `f` por una recta en cada
subintervalo, Simpson la aproxima por una **parábola** que pasa por
tres puntos consecutivos `(x₂ᵢ, x₂ᵢ₊₁, x₂ᵢ₊₂)` — de ahí que se procesen
los subintervalos de a pares, y por qué `n` debe ser par. Integrando
esa parábola exactamente en `[x₂ᵢ, x₂ᵢ₊₂]` (con ancho de paso `h` entre
puntos consecutivos) se obtiene `(h/3)·(f(x₂ᵢ) + 4f(x₂ᵢ₊₁) + f(x₂ᵢ₊₂))`.
Sumando todos los pares y agrupando los puntos que se comparten entre
parábolas consecutivas, aparece el patrón característico de
coeficientes `1, 4, 2, 4, 2, ..., 4, 1`:

```
∫ₐᵇ f(x)dx ≈ (h/3)·[ f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + 4f(xₙ₋₁) + f(xₙ) ]
```

**Error — un resultado más fuerte de lo esperado:** aunque Simpson se
deriva ajustando una *parábola* (grado 2), un análisis más fino del
término de error muestra que **también es exacta para polinomios de
grado 3** (el término de error de orden 3 se cancela por simetría
alrededor del punto medio de cada par). El error de la regla compuesta
es `O(h⁴)`, dos órdenes mejor que el trapecio — para la misma cantidad
de evaluaciones de `f`, Simpson típicamente da muchos más dígitos
correctos en funciones suaves (se verifica en las pruebas del motor:
para `∫₀¹ x² dx`, Simpson con solo 100 subintervalos da el resultado
exacto hasta el error de redondeo de punto flotante, mientras que el
trapecio necesita miles de subintervalos para la misma precisión).

**Complejidad:** `O(n)` evaluaciones de `f`.

**Implementación:** `numerical/integration.js::simpson`. Lanza
`MathError` (`INVALID_SUBINTERVALS`) si `n` es impar.
