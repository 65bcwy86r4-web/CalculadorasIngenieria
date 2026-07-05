/**
 * ui.js
 * ---------------------------------------------------------------------------
 * Controlador de interfaz. Conecta los módulos matemáticos (matrix.js,
 * gauss.js, determinant.js, inverse.js, eigen.js) con el DOM: generación de
 * grillas editables, selección de operación, ejecución, renderizado de
 * resultados y del procedimiento paso a paso, historial persistente
 * (localStorage), exportación (TXT/CSV/PDF), pegado desde el portapapeles y
 * atajos de teclado.
 * ---------------------------------------------------------------------------
 */

const UI = (() => {
  const { Matrix, MatrixError } = window.MatrixLib;

  /* ------------------------------- Estado global ------------------------------ */
  const state = {
    n: 3,               // dimensión principal (cuadrada) elegida en la barra superior
    colsB: 3,            // columnas de B, editable solo para el producto
    currentOp: null,
    history: [],
  };

  const dom = {};

  /* ------------------------------ Definición de operaciones ------------------------------ */
  // needs: qué bloques de entrada requiere cada operación
  const OP_CONFIG = {
    "transpose":      { label: "Transpuesta (Aᵀ)",              needs: { A: true } },
    "trace":          { label: "Traza",                          needs: { A: true }, squareA: true },
    "rank":           { label: "Rango",                          needs: { A: true } },
    "norm":           { label: "Norma de Frobenius",             needs: { A: true } },
    "classify":       { label: "Clasificar matriz",              needs: { A: true }, squareA: true },
    "det-gauss":      { label: "Determinante (Gauss)",           needs: { A: true }, squareA: true },
    "det-cofactor":   { label: "Determinante (cofactores)",      needs: { A: true }, squareA: true },
    "inverse":        { label: "Matriz inversa (Gauss-Jordan)",  needs: { A: true }, squareA: true },
    "adjugate":       { label: "Matriz adjunta",                 needs: { A: true }, squareA: true },
    "cofactors":      { label: "Matriz de cofactores",           needs: { A: true }, squareA: true },
    "condition":      { label: "Número de condición",            needs: { A: true }, squareA: true },
    "gauss":          { label: "Escalonar (Gauss)",              needs: { A: true } },
    "gaussjordan":    { label: "Escalonar reducida (Gauss-Jordan)", needs: { A: true } },
    "solve":          { label: "Resolver Ax = b",                needs: { A: true, vectorB: true }, squareA: true },
    "add":            { label: "Suma (A + B)",                   needs: { A: true, B: true } },
    "subtract":       { label: "Resta (A − B)",                  needs: { A: true, B: true } },
    "multiply":       { label: "Producto (A · B)",                needs: { A: true, B: true, colsB: true } },
    "scalar":         { label: "Multiplicación por escalar",     needs: { A: true, scalar: true } },
    "power":          { label: "Potencia (Aⁿ)",                  needs: { A: true, power: true }, squareA: true },
    "identity":       { label: "Matriz identidad",                needs: {} },
    "diagonal":       { label: "Construir matriz diagonal",       needs: { vectorB: true } },
    "eigenvalues":    { label: "Autovalores (QR iterativo)",      needs: { A: true }, squareA: true },
    "eigenvectors":   { label: "Autovectores",                    needs: { A: true }, squareA: true },
    "diagonalization":{ label: "Diagonalización A = PDP⁻¹",       needs: { A: true }, squareA: true },
    "lu":             { label: "Descomposición LU",               needs: { A: true }, squareA: true },
    "qr":             { label: "Factorización QR",                needs: { A: true } },
    "cholesky":       { label: "Descomposición de Cholesky",      needs: { A: true }, squareA: true },
  };

  /* --------------------------------- Inicialización --------------------------------- */

  function init() {
    cacheDom();
    populateSizeSelector();
    generateAllGrids();
    bindEvents();
    loadHistory();
    applyStoredTheme();
  }

  function cacheDom() {
    [
      "btnToggleSidebar","sidebar","matSize","btnGenerate","btnHistory","btnTheme","themeIcon",
      "gridA","gridB","gridVectorB","cardA","cardB","cardVectorB","dimBadgeA","dimBadgeB",
      "scalarControl","scalarInput","powerControl","powerInput","currentOpLabel","btnRun",
      "resultBody","stepsBody","historyDrawer","historyList","btnCloseHistory","overlay",
      "btnExportTxt","btnExportCsv","btnExportPdf","printArea","toast",
    ].forEach((id) => (dom[id] = document.getElementById(id)));
    dom.opButtons = document.querySelectorAll(".op-btn");
  }

  function populateSizeSelector() {
    for (let i = 2; i <= 15; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${i} × ${i}`;
      if (i === state.n) opt.selected = true;
      dom.matSize.appendChild(opt);
    }
  }

  /* ------------------------------- Generación de grillas ------------------------------- */

  function buildGrid(container, rows, cols, prefix) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.className = "matrix-cell";
        input.id = `${prefix}-${i}-${j}`;
        input.value = i === j && prefix === "A" ? "1" : "0";
        input.addEventListener("input", () => validateCell(input));
        container.appendChild(input);
      }
    }
  }

  function validateCell(input) {
    input.classList.toggle("invalid", input.value !== "" && isNaN(parseFloat(input.value)));
  }

  function generateAllGrids() {
    state.n = parseInt(dom.matSize.value, 10);
    state.colsB = state.n;
    buildGrid(dom.gridA, state.n, state.n, "A");
    buildGrid(dom.gridB, state.n, state.colsB, "B");
    buildGrid(dom.gridVectorB, state.n, 1, "V");
    dom.dimBadgeA.textContent = `${state.n}×${state.n}`;
    dom.dimBadgeB.textContent = `${state.n}×${state.colsB}`;
  }

  function readMatrix(prefix, rows, cols) {
    const data = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const el = document.getElementById(`${prefix}-${i}-${j}`);
        const v = parseFloat(el.value);
        if (isNaN(v)) throw new MatrixError(`Hay una celda vacía o inválida en ${prefix}[${i + 1}][${j + 1}].`);
        row.push(v);
      }
      data.push(row);
    }
    return Matrix.fromArray(data);
  }

  function readA() { return readMatrix("A", state.n, state.n); }
  function readB() { return readMatrix("B", state.n, state.colsB); }
  function readVectorB() { return readMatrix("V", state.n, 1); }

  /* ------------------------------- Selección de operación ------------------------------- */

  function selectOp(op) {
    state.currentOp = op;
    dom.opButtons.forEach((b) => b.classList.toggle("active", b.dataset.op === op));
    const cfg = OP_CONFIG[op];
    dom.currentOpLabel.textContent = cfg.label;
    dom.btnRun.disabled = false;

    dom.cardB.classList.toggle("hidden", !cfg.needs.B);
    dom.cardVectorB.classList.toggle("hidden", !cfg.needs.vectorB);
    dom.scalarControl.classList.toggle("hidden", !cfg.needs.scalar);
    dom.powerControl.classList.toggle("hidden", !cfg.needs.power);

    if (cfg.needs.colsB) {
      promptColsB();
    }
    if (op === "diagonal") {
      dom.cardA.classList.add("hidden");
    } else {
      dom.cardA.classList.remove("hidden");
    }
    if (cfg.squareA) {
      dom.dimBadgeA.textContent = `${state.n}×${state.n} (cuadrada)`;
    } else {
      dom.dimBadgeA.textContent = `${state.n}×${state.n}`;
    }

    // Cerrar sidebar automáticamente en mobile tras elegir operación
    if (window.innerWidth <= 760) closeMobileSidebar();
  }

  function promptColsB() {
    if (dom.gridB.dataset.colsFor === "multiply" && dom.gridB.children.length === state.n * state.colsB) return;
    buildGrid(dom.gridB, state.n, state.colsB, "B");
    dom.dimBadgeB.textContent = `${state.n}×${state.colsB}`;
    dom.gridB.dataset.colsFor = "multiply";
  }

  /* ---------------------------------- Ejecución ---------------------------------- */

  function run() {
    const op = state.currentOp;
    if (!op) return;
    try {
      const outcome = OPERATIONS[op]();
      renderResult(outcome);
      renderSteps(outcome.steps || []);
      pushHistory(op, outcome);
    } catch (err) {
      if (err instanceof MatrixError || err instanceof Error) {
        renderError(err.message);
      } else {
        renderError("Ocurrió un error inesperado al calcular.");
      }
    }
  }

  /* Cada función devuelve { title, steps, html, resultData } */
  const OPERATIONS = {
    transpose: () => {
      const A = readA();
      const T = A.transpose();
      return {
        title: "Transpuesta",
        html: matrixHtml(T),
        steps: [{ type: "info", text: "Aᵀ se obtiene intercambiando filas por columnas: (Aᵀ)ᵢⱼ = Aⱼᵢ." }],
      };
    },
    trace: () => {
      const A = readA();
      const t = A.trace();
      return { title: "Traza", html: valueHtml(t), steps: [{ type: "final", text: `tr(A) = suma de la diagonal principal = ${Matrix.fmt(t)}.` }] };
    },
    rank: () => {
      const A = readA();
      const { rank, steps } = window.GaussLib.rank(A);
      return { title: "Rango", html: valueHtml(rank), steps: [...steps, { type: "final", text: `Rango(A) = cantidad de pivotes = ${rank}.` }] };
    },
    norm: () => {
      const A = readA();
      const n = A.frobeniusNorm();
      return { title: "Norma de Frobenius", html: valueHtml(Matrix.fmt(n)), steps: [{ type: "info", text: "‖A‖_F = √(Σ aᵢⱼ²), la raíz cuadrada de la suma de los cuadrados de todos los elementos." }] };
    },
    classify: () => {
      const A = readA();
      const props = [];
      if (A.isDiagonal()) props.push("Diagonal");
      if (A.isSymmetric()) props.push("Simétrica");
      if (A.isUpperTriangular()) props.push("Triangular superior");
      if (A.isLowerTriangular()) props.push("Triangular inferior");
      let isIdentity = A.isDiagonal();
      if (isIdentity) for (let i = 0; i < A.rows; i++) if (Math.abs(A.data[i][i] - 1) > 1e-9) isIdentity = false;
      if (isIdentity) props.push("Identidad");
      if (props.length === 0) props.push("No presenta ninguna propiedad estructural notable (matriz general)");
      return {
        title: "Clasificación",
        html: `<ul>${props.map((p) => `<li>${p}</li>`).join("")}</ul>`,
        steps: [{ type: "info", text: "Se evaluaron: diagonalidad, simetría (A = Aᵀ), triangularidad superior/inferior e identidad." }],
      };
    },
    "det-gauss": () => {
      const A = readA();
      const { value, steps } = window.DeterminantLib.determinantGauss(A);
      return { title: "Determinante (Gauss)", html: valueHtml(value), steps };
    },
    "det-cofactor": () => {
      const A = readA();
      const value = window.DeterminantLib.determinantCofactor(A);
      return {
        title: "Determinante (cofactores)",
        html: valueHtml(value),
        steps: [{ type: "info", text: "Expansión de Laplace por la primera fila: det(A) = Σⱼ (-1)^(1+j) · a₁ⱼ · Mⱼ, donde Mⱼ es el menor complementario. Método utilizado con fines teóricos; para matrices grandes se recomienda Gauss." }],
      };
    },
    inverse: () => {
      const A = readA();
      const r = window.InverseLib.inverseGaussJordan(A);
      if (!r.invertible) return { title: "Matriz inversa", html: `<p class="result-note danger">${r.message}</p>`, steps: r.steps };
      return { title: "Matriz inversa (A⁻¹)", html: matrixHtml(r.inverse), steps: r.steps };
    },
    adjugate: () => {
      const A = readA();
      const adj = window.InverseLib.adjugate(A);
      return { title: "Matriz adjunta", html: matrixHtml(adj), steps: [{ type: "info", text: "adj(A) = transpuesta de la matriz de cofactores. Para n > 6 se calcula como adj(A) = det(A) · A⁻¹ por eficiencia." }] };
    },
    cofactors: () => {
      const A = readA();
      const C = window.InverseLib.cofactorMatrix(A);
      return { title: "Matriz de cofactores", html: matrixHtml(C), steps: [{ type: "info", text: "Cᵢⱼ = (-1)^(i+j) · det(menor obtenido al eliminar la fila i y columna j)." }] };
    },
    condition: () => {
      const A = readA();
      const r = window.InverseLib.conditionNumber(A);
      if (r.value === Infinity) return { title: "Número de condición", html: `<p class="result-note danger">${r.message}</p>`, steps: [] };
      return {
        title: "Número de condición",
        html: valueHtml(r.value),
        steps: [{ type: "info", text: `κ(A) = ‖A‖_F · ‖A⁻¹‖_F = ${r.normA} · ${r.normInv} = ${r.value}. Valores altos indican un sistema numéricamente sensible.` }],
      };
    },
    gauss: () => {
      const A = readA();
      const { result, steps } = window.GaussLib.rowEchelon(A);
      return { title: "Forma escalonada (Gauss)", html: matrixHtml(result), steps };
    },
    gaussjordan: () => {
      const A = readA();
      const { result, steps } = window.GaussLib.reducedRowEchelon(A);
      return { title: "Forma escalonada reducida (Gauss-Jordan)", html: matrixHtml(result), steps };
    },
    solve: () => {
      const A = readA();
      const b = readVectorB();
      const r = window.GaussLib.solveSystem(A, b);
      let html = `<p class="result-note ${r.type === "unique" ? "ok" : r.type === "infinite" ? "warn" : "danger"}">${r.message}</p>`;
      if (r.type === "unique") {
        html += `<table class="result-matrix">${r.solution.map((v, i) => `<tr><td>x${i + 1} =</td><td>${Matrix.fmt(v)}</td></tr>`).join("")}</table>`;
      }
      return { title: "Solución del sistema Ax = b", html, steps: r.steps };
    },
    add: () => {
      const A = readA(), B = readB();
      const R = A.add(B);
      return { title: "A + B", html: matrixHtml(R), steps: [{ type: "info", text: "La suma se realiza elemento a elemento: (A+B)ᵢⱼ = Aᵢⱼ + Bᵢⱼ." }] };
    },
    subtract: () => {
      const A = readA(), B = readB();
      const R = A.subtract(B);
      return { title: "A − B", html: matrixHtml(R), steps: [{ type: "info", text: "La resta se realiza elemento a elemento: (A−B)ᵢⱼ = Aᵢⱼ − Bᵢⱼ." }] };
    },
    multiply: () => {
      const A = readA(), B = readB();
      const R = A.multiply(B);
      return { title: "A · B", html: matrixHtml(R), steps: [{ type: "info", text: `Cada elemento (A·B)ᵢⱼ = Σₖ Aᵢₖ·Bₖⱼ. Dimensión resultante: ${A.rows}×${B.cols}.` }] };
    },
    scalar: () => {
      const A = readA();
      const k = parseFloat(dom.scalarInput.value);
      if (isNaN(k)) throw new MatrixError("El escalar ingresado no es un número válido.");
      const R = A.scalarMultiply(k);
      return { title: `k · A  (k = ${k})`, html: matrixHtml(R), steps: [{ type: "info", text: `Cada elemento se multiplica por k = ${k}: (kA)ᵢⱼ = k·Aᵢⱼ.` }] };
    },
    power: () => {
      const A = readA();
      const n = parseInt(dom.powerInput.value, 10);
      if (isNaN(n) || n < 0) throw new MatrixError("El exponente debe ser un entero no negativo.");
      const R = A.power(n);
      return { title: `A^${n}`, html: matrixHtml(R), steps: [{ type: "info", text: `Se calculó A^${n} mediante ${n} producto(s) sucesivo(s) A·A·...·A.` }] };
    },
    identity: () => {
      const I = Matrix.identity(state.n);
      return { title: `Identidad ${state.n}×${state.n}`, html: matrixHtml(I), steps: [{ type: "info", text: "Iᵢⱼ = 1 si i=j, 0 en caso contrario. Elemento neutro del producto matricial." }] };
    },
    diagonal: () => {
      const v = readVectorB();
      const values = [];
      for (let i = 0; i < state.n; i++) values.push(v.data[i][0]);
      const D = Matrix.diagonal(values);
      return { title: "Matriz diagonal construida", html: matrixHtml(D), steps: [{ type: "info", text: "Se ubicaron los valores del vector ingresado (panel 'Vector b') en la diagonal principal; el resto de los elementos son 0." }] };
    },
    eigenvalues: () => {
      const A = readA();
      const { values, hasComplexHint } = window.EigenLib.eigenvaluesQR(A);
      let html = `<table class="result-matrix">${values.map((v, i) => `<tr><td>λ${i + 1} =</td><td>${v}</td></tr>`).join("")}</table>`;
      const steps = [
        { type: "info", text: "Algoritmo QR iterativo: se factoriza Aₖ = QₖRₖ y se actualiza Aₖ₊₁ = RₖQₖ repetidamente; la diagonal converge a los autovalores." },
      ];
      if (hasComplexHint) steps.push({ type: "info", text: "Se detectaron bloques 2×2 no triangularizados: es posible que existan autovalores complejos conjugados, que este método educativo no resuelve explícitamente." });
      return { title: "Autovalores", html, steps };
    },
    eigenvectors: () => {
      const A = readA();
      const { values } = window.EigenLib.eigenvaluesQR(A);
      const pairs = window.EigenLib.eigenvectors(A, values);
      let html = "";
      pairs.forEach((p, i) => {
        html += `<p><b>λ${i + 1} = ${p.lambda}</b></p>`;
        html += p.vector ? matrixHtml(Matrix.fromArray(p.vector.map((x) => [x]))) : `<p class="result-note danger">No se pudo determinar (autovalor múltiple o error numérico).</p>`;
      });
      return {
        title: "Autovectores",
        html,
        steps: [{ type: "info", text: "Para cada λ se resuelve el sistema homogéneo (A − λI)v = 0 mediante Gauss-Jordan y se normaliza el vector obtenido." }],
      };
    },
    diagonalization: () => {
      const A = readA();
      const { P, D, Pinv } = window.EigenLib.diagonalize(A);
      return {
        title: "Diagonalización A = P·D·P⁻¹",
        html: `<p><b>P</b> (autovectores como columnas)</p>${matrixHtml(P)}<p><b>D</b> (autovalores en la diagonal)</p>${matrixHtml(D)}<p><b>P⁻¹</b></p>${matrixHtml(Pinv)}`,
        steps: [{ type: "info", text: "P se construye con los autovectores como columnas y D con los autovalores correspondientes en la diagonal. Se verificó que P sea invertible." }],
      };
    },
    lu: () => {
      const A = readA();
      const { L, U, P, steps } = window.EigenLib.luDecomposition(A);
      return {
        title: "Descomposición LU (P·A = L·U)",
        html: `<p><b>L</b></p>${matrixHtml(L)}<p><b>U</b></p>${matrixHtml(U)}<p><b>P</b> (permutación)</p>${matrixHtml(P)}`,
        steps,
      };
    },
    qr: () => {
      const A = readA();
      const { Q, R } = window.EigenLib.qrDecomposition(A);
      return {
        title: "Factorización QR",
        html: `<p><b>Q</b> (columnas ortonormales)</p>${matrixHtml(Q)}<p><b>R</b> (triangular superior)</p>${matrixHtml(R)}`,
        steps: [{ type: "info", text: "Se aplicó el proceso de Gram-Schmidt a las columnas de A para obtener una base ortonormal (Q); R contiene los coeficientes de la proyección." }],
      };
    },
    cholesky: () => {
      const A = readA();
      const { L, Lt } = window.EigenLib.choleskyDecomposition(A);
      return {
        title: "Descomposición de Cholesky (A = L·Lᵀ)",
        html: `<p><b>L</b></p>${matrixHtml(L)}<p><b>Lᵀ</b></p>${matrixHtml(Lt)}`,
        steps: [{ type: "info", text: "Válida porque A es simétrica; se verificó que todos los elementos bajo la raíz resultaran positivos (matriz definida positiva)." }],
      };
    },
  };

  /* ---------------------------------- Renderizado ---------------------------------- */

  function matrixHtml(m) {
    let html = '<table class="result-matrix">';
    for (let i = 0; i < m.rows; i++) {
      html += "<tr>";
      for (let j = 0; j < m.cols; j++) html += `<td>${Matrix.fmt(m.data[i][j])}</td>`;
      html += "</tr>";
    }
    html += "</table>";
    return html;
  }

  function valueHtml(v) {
    return `<div class="result-value">${v}</div>`;
  }

  function renderResult(outcome) {
    dom.resultBody.innerHTML = `<h4 style="margin:0 0 10px;font-family:var(--font-display);font-size:14px;">${outcome.title}</h4>${outcome.html}`;
  }

  function renderError(message) {
    dom.resultBody.innerHTML = `<p class="result-note danger">⚠ ${message}</p>`;
    dom.stepsBody.innerHTML = `<p class="placeholder">No se generó procedimiento porque ocurrió un error en los datos de entrada.</p>`;
    showToast(message, true);
  }

  function renderSteps(steps) {
    if (!steps.length) {
      dom.stepsBody.innerHTML = `<p class="placeholder">Esta operación no requiere pasos intermedios.</p>`;
      return;
    }
    let html = "";
    steps.forEach((s, idx) => {
      html += `<div class="step-line type-${s.type}"><span class="step-idx">${idx + 1}.</span><span>${s.text}</span></div>`;
      if (s.snapshot) {
        html += `<div class="step-snapshot">${s.snapshot.map((row) => row.map((v) => Matrix.fmt(v).toString().padStart(8)).join(" ")).join("\n")}</div>`;
      }
    });
    dom.stepsBody.innerHTML = html;
  }

  /* ----------------------------------- Historial ----------------------------------- */

  function pushHistory(op, outcome) {
    const entry = {
      id: Date.now(),
      op,
      title: outcome.title,
      time: new Date().toLocaleString("es-AR"),
      html: outcome.html,
      steps: outcome.steps || [],
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 50);
    saveHistory();
    renderHistoryList();
  }

  function saveHistory() {
    try {
      localStorage.setItem("algebra_calc_history", JSON.stringify(state.history));
    } catch (e) {
      /* almacenamiento no disponible: se ignora silenciosamente */
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem("algebra_calc_history");
      state.history = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.history = [];
    }
    renderHistoryList();
  }

  function renderHistoryList() {
    if (!state.history.length) {
      dom.historyList.innerHTML = `<p class="placeholder">Todavía no hay cálculos guardados.</p>`;
      return;
    }
    dom.historyList.innerHTML = state.history
      .map(
        (h) => `
      <div class="history-item" data-id="${h.id}">
        <div class="h-title">${h.title}</div>
        <div class="h-meta"><span>${OP_CONFIG[h.op] ? OP_CONFIG[h.op].label : h.op}</span><span>${h.time}</span></div>
        <div class="h-actions">
          <button data-action="open" data-id="${h.id}">Reabrir</button>
          <button data-action="delete" data-id="${h.id}">Eliminar</button>
        </div>
      </div>`
      )
      .join("");
  }

  function openHistoryEntry(id) {
    const entry = state.history.find((h) => h.id === id);
    if (!entry) return;
    dom.resultBody.innerHTML = `<h4 style="margin:0 0 10px;font-family:var(--font-display);font-size:14px;">${entry.title}</h4>${entry.html}`;
    renderSteps(entry.steps);
    toggleHistoryDrawer(false);
  }

  function deleteHistoryEntry(id) {
    state.history = state.history.filter((h) => h.id !== id);
    saveHistory();
    renderHistoryList();
  }

  /* ----------------------------------- Exportación ----------------------------------- */

  function currentExportPayload() {
    const title = dom.resultBody.querySelector("h4") ? dom.resultBody.querySelector("h4").textContent : "Resultado";
    const stepsText = Array.from(dom.stepsBody.querySelectorAll(".step-line")).map((el) => el.textContent).join("\n");
    const resultText = dom.resultBody.innerText;
    return { title, stepsText, resultText };
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportTxt() {
    const { title, stepsText, resultText } = currentExportPayload();
    const content = `CALCULADORA DE ÁLGEBRA LINEAL\n${title}\n${"=".repeat(40)}\n\nRESULTADO:\n${resultText}\n\nPROCEDIMIENTO:\n${stepsText || "(sin pasos)"}\n`;
    downloadBlob(content, "resultado.txt", "text/plain;charset=utf-8");
    showToast("Exportado como TXT");
  }

  function exportCsv() {
    const table = dom.resultBody.querySelector("table.result-matrix");
    let rows = [];
    if (table) {
      table.querySelectorAll("tr").forEach((tr) => {
        rows.push(Array.from(tr.querySelectorAll("td")).map((td) => td.textContent).join(","));
      });
    } else {
      rows.push(dom.resultBody.innerText.replace(/\n/g, " "));
    }
    downloadBlob(rows.join("\n"), "resultado.csv", "text/csv;charset=utf-8");
    showToast("Exportado como CSV");
  }

  function exportPdf() {
    const { title, stepsText, resultText } = currentExportPayload();
    dom.printArea.innerHTML = `<h2>${title}</h2><h3>Resultado</h3><pre>${resultText}</pre><h3>Procedimiento</h3><pre>${stepsText || "(sin pasos)"}</pre>`;
    showToast("Se abrió el diálogo de impresión: elegí 'Guardar como PDF'.");
    setTimeout(() => window.print(), 200);
  }

  /* ------------------------------------- Pegado ------------------------------------- */

  function bindPaste() {
    document.querySelectorAll("[data-paste-target]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          applyPastedMatrix(text, btn.dataset.pasteTarget);
        } catch (e) {
          showToast("No se pudo leer el portapapeles. Pegá manualmente con Ctrl+V dentro de una celda.", true);
        }
      });
    });
  }

  function applyPastedMatrix(text, target) {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\t|,|;|\s+/).filter((v) => v !== "").map(Number));
    if (!rows.length || rows.some((r) => r.some(isNaN))) {
      showToast("El contenido pegado no tiene un formato numérico reconocible.", true);
      return;
    }
    const rCount = rows.length;
    const cCount = rows[0].length;
    const prefix = target === "A" ? "A" : "B";
    if (target === "A") {
      state.n = rCount === cCount ? rCount : state.n;
    }
    // Genera una grilla del tamaño exacto de lo pegado para ese bloque
    const container = target === "A" ? dom.gridA : dom.gridB;
    buildGrid(container, rCount, cCount, prefix);
    if (target === "B") state.colsB = cCount;
    for (let i = 0; i < rCount; i++)
      for (let j = 0; j < cCount; j++) document.getElementById(`${prefix}-${i}-${j}`).value = rows[i][j];
    showToast(`Matriz ${target} actualizada desde el portapapeles (${rCount}×${cCount}).`);
  }

  /* -------------------------------------- Tema -------------------------------------- */

  function applyStoredTheme() {
    const stored = localStorage.getItem("algebra_calc_theme") || "dark";
    document.body.dataset.theme = stored;
  }

  function toggleTheme() {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem("algebra_calc_theme", next);
  }

  /* --------------------------------- Sidebar / drawers -------------------------------- */

  function toggleSidebar() {
    if (window.innerWidth <= 760) {
      dom.sidebar.classList.toggle("open");
      dom.overlay.classList.toggle("show", dom.sidebar.classList.contains("open"));
    } else {
      dom.sidebar.classList.toggle("collapsed");
    }
  }

  function closeMobileSidebar() {
    dom.sidebar.classList.remove("open");
    dom.overlay.classList.remove("show");
  }

  function toggleHistoryDrawer(force) {
    const open = force !== undefined ? force : !dom.historyDrawer.classList.contains("open");
    dom.historyDrawer.classList.toggle("open", open);
    dom.overlay.classList.toggle("show", open);
  }

  /* ---------------------------------------- Toast --------------------------------------- */

  let toastTimer = null;
  function showToast(message, isError = false) {
    dom.toast.textContent = message;
    dom.toast.classList.toggle("danger", isError);
    dom.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 3200);
  }

  /* -------------------------------------- Eventos -------------------------------------- */

  function bindEvents() {
    dom.opButtons.forEach((btn) => btn.addEventListener("click", () => selectOp(btn.dataset.op)));
    dom.btnRun.addEventListener("click", run);
    dom.btnGenerate.addEventListener("click", generateAllGrids);
    dom.btnToggleSidebar.addEventListener("click", toggleSidebar);
    dom.btnTheme.addEventListener("click", toggleTheme);
    dom.btnHistory.addEventListener("click", () => toggleHistoryDrawer());
    dom.btnCloseHistory.addEventListener("click", () => toggleHistoryDrawer(false));
    dom.overlay.addEventListener("click", () => {
      toggleHistoryDrawer(false);
      closeMobileSidebar();
    });
    dom.btnExportTxt.addEventListener("click", exportTxt);
    dom.btnExportCsv.addEventListener("click", exportCsv);
    dom.btnExportPdf.addEventListener("click", exportPdf);

    dom.historyList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === "open") openHistoryEntry(id);
      if (btn.dataset.action === "delete") deleteHistoryEntry(id);
    });

    bindPaste();

    document.addEventListener("keydown", (e) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          generateAllGrids();
          showToast("Nueva matriz generada.");
          break;
        case "d":
          e.preventDefault();
          selectOp("det-gauss");
          run();
          break;
        case "e":
          e.preventDefault();
          exportTxt();
          break;
        case "h":
          e.preventDefault();
          toggleHistoryDrawer();
          break;
        case "b":
          e.preventDefault();
          toggleSidebar();
          break;
        case "enter":
          e.preventDefault();
          run();
          break;
      }
    });
  }

  return { init };
})();
