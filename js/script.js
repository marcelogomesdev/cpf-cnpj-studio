"use strict";

const STORAGE_KEYS = {
  history: "cpfCnpjStudio.history",
  theme: "cpfCnpjStudio.theme"
};

const state = {
  history: loadHistory(),
  generatedRaw: "",
  formattedResult: ""
};

const elements = {
  themeToggle: document.querySelector("#themeToggle"),
  themeIcon: document.querySelector(".theme-icon"),
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll(".tool-panel")],
  generatorTypes: [...document.querySelectorAll('input[name="generatorType"]')],
  generatorFormatting: document.querySelector("#generatorFormatting"),
  generatorResultLabel: document.querySelector("#generatorResultLabel"),
  generatorResult: document.querySelector("#generatorResult"),
  generateButton: document.querySelector("#generateButton"),
  copyGenerated: document.querySelector("#copyGenerated"),
  documentInput: document.querySelector("#documentInput"),
  clearInput: document.querySelector("#clearInput"),
  validateButton: document.querySelector("#validateButton"),
  validationResult: document.querySelector("#validationResult"),
  formatterInput: document.querySelector("#formatterInput"),
  applyFormatting: document.querySelector("#applyFormatting"),
  removeFormatting: document.querySelector("#removeFormatting"),
  formatterResult: document.querySelector("#formatterResult"),
  copyFormatted: document.querySelector("#copyFormatted"),
  historyList: document.querySelector("#historyList"),
  clearHistory: document.querySelector("#clearHistory"),
  toastContainer: document.querySelector("#toastContainer")
};

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function allDigitsEqual(value) {
  return /^(\d)\1+$/.test(value);
}

function calculateDigit(base, weights) {
  const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function generateCPF() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  const first = calculateDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(base + first, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${first}${second}`;
}

function generateCNPJ() {
  const root = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
  const base = `${root}0001`;
  const first = calculateDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(base + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${first}${second}`;
}

function validateCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || allDigitsEqual(cpf)) return false;
  const base = cpf.slice(0, 9);
  const first = calculateDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(base + first, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf === `${base}${first}${second}`;
}

function validateCNPJ(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || allDigitsEqual(cnpj)) return false;
  const base = cnpj.slice(0, 12);
  const first = calculateDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(base + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === `${base}${first}${second}`;
}

function formatCPF(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCNPJ(value) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatDocument(value) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return formatCPF(digits);
  if (digits.length === 14) return formatCNPJ(digits);
  return digits;
}

function identifyDocument(value) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return "CPF";
  if (digits.length === 14) return "CNPJ";
  return null;
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.history));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function addHistory(entry) {
  state.history.unshift({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    ...entry
  });
  state.history = state.history.slice(0, 50);
  saveHistory();
  renderHistory();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function renderHistory() {
  elements.clearHistory.disabled = state.history.length === 0;

  if (!state.history.length) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <strong>Nenhuma atividade registrada</strong>
        Gere, valide ou formate um documento para começar.
      </div>`;
    return;
  }

  const labels = { generated: "Gerado", validated: "Validado", formatted: "Formatado" };
  const icons = { generated: "+", validated: "✓", formatted: "#" };

  elements.historyList.innerHTML = state.history.map(item => {
    const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt));
    const statusClass = item.status === "valid" ? "valid" : item.status === "invalid" ? "invalid" : "info";
    const statusText = item.status === "valid" ? "Válido" : item.status === "invalid" ? "Inválido" : item.documentType;
    return `
      <article class="history-item">
        <span class="history-marker" aria-hidden="true">${icons[item.action] || "•"}</span>
        <div class="history-content">
          <strong>${labels[item.action] || "Atividade"} · ${escapeHTML(item.documentType)}</strong>
          <code>${escapeHTML(item.displayValue)}</code>
          <small>${date}</small>
        </div>
        <span class="history-status ${statusClass}">${escapeHTML(statusText)}</span>
      </article>`;
  }).join("");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  elements.toastContainer.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Resultado copiado para a área de transferência.");
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    showToast(copied ? "Resultado copiado." : "Não foi possível copiar.", copied ? "success" : "error");
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  const dark = theme === "dark";
  elements.themeIcon.textContent = dark ? "☀" : "☾";
  elements.themeToggle.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#08111f" : "#f8fafc";
}

function initializeTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved || preferred);
}

function activateTab(tab) {
  elements.tabs.forEach(current => {
    const isActive = current === tab;
    current.classList.toggle("active", isActive);
    current.setAttribute("aria-selected", String(isActive));
    current.tabIndex = isActive ? 0 : -1;
  });
  elements.panels.forEach(panel => {
    const isActive = panel.id === tab.dataset.tab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function updateGeneratorUI() {
  const type = document.querySelector('input[name="generatorType"]:checked').value;
  const upperType = type.toUpperCase();
  elements.generateButton.textContent = `Gerar ${upperType} válido`;
  elements.generatorResultLabel.textContent = `${upperType} gerado`;

  if (state.generatedRaw && state.generatedRaw.length !== (type === "cpf" ? 11 : 14)) {
    state.generatedRaw = "";
    elements.generatorResult.value = "Clique em gerar";
    elements.copyGenerated.disabled = true;
  }
}

function handleGenerate() {
  const type = document.querySelector('input[name="generatorType"]:checked').value;
  state.generatedRaw = type === "cpf" ? generateCPF() : generateCNPJ();
  const displayValue = elements.generatorFormatting.checked ? formatDocument(state.generatedRaw) : state.generatedRaw;
  elements.generatorResult.value = displayValue;
  elements.copyGenerated.disabled = false;
  addHistory({ action: "generated", documentType: type.toUpperCase(), displayValue, status: "info" });
  showToast(`${type.toUpperCase()} válido gerado com sucesso.`);
}

function handleValidate() {
  const digits = onlyDigits(elements.documentInput.value);
  const type = identifyDocument(digits);

  if (!type) {
    setValidationMessage(false, "Quantidade de dígitos inválida", "Informe 11 dígitos para CPF ou 14 para CNPJ.");
    showToast("Digite um CPF ou CNPJ completo.", "error");
    return;
  }

  const valid = type === "CPF" ? validateCPF(digits) : validateCNPJ(digits);
  const displayValue = formatDocument(digits);
  elements.documentInput.value = displayValue;

  setValidationMessage(valid, `${type} ${valid ? "válido" : "inválido"}`, valid ? "Os dígitos verificadores estão corretos." : "Os dígitos verificadores não correspondem ao documento.");
  addHistory({ action: "validated", documentType: type, displayValue, status: valid ? "valid" : "invalid" });
  showToast(`${type} ${valid ? "válido" : "inválido"}.`, valid ? "success" : "error");
}

function setValidationMessage(valid, title, message) {
  elements.validationResult.className = `validation-result ${valid ? "success" : "error"}`;
  elements.validationResult.innerHTML = `
    <span class="validation-icon" aria-hidden="true">${valid ? "✓" : "×"}</span>
    <div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div>`;
}

function resetValidation() {
  elements.documentInput.value = "";
  elements.validationResult.className = "validation-result neutral";
  elements.validationResult.innerHTML = `<span class="validation-icon" aria-hidden="true">?</span><div><strong>Aguardando documento</strong><p>Digite 11 dígitos para CPF ou 14 para CNPJ.</p></div>`;
  elements.documentInput.focus();
}

function handleFormat(apply) {
  const digits = onlyDigits(elements.formatterInput.value);
  const type = identifyDocument(digits);

  if (!type) {
    showToast("Informe um CPF ou CNPJ completo.", "error");
    elements.formatterResult.value = "Documento incompleto";
    elements.copyFormatted.disabled = true;
    return;
  }

  state.formattedResult = apply ? formatDocument(digits) : digits;
  elements.formatterResult.value = state.formattedResult;
  elements.formatterInput.value = apply ? state.formattedResult : digits;
  elements.copyFormatted.disabled = false;
  addHistory({ action: "formatted", documentType: type, displayValue: state.formattedResult, status: "info" });
  showToast(apply ? "Formatação aplicada." : "Formatação removida.");
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  elements.tabs.forEach(tab => tab.addEventListener("click", () => activateTab(tab)));
  elements.generatorTypes.forEach(input => input.addEventListener("change", updateGeneratorUI));
  elements.generatorFormatting.addEventListener("change", () => {
    if (state.generatedRaw) elements.generatorResult.value = elements.generatorFormatting.checked ? formatDocument(state.generatedRaw) : state.generatedRaw;
  });
  elements.generateButton.addEventListener("click", handleGenerate);
  elements.copyGenerated.addEventListener("click", () => copyText(elements.generatorResult.value));
  elements.validateButton.addEventListener("click", handleValidate);
  elements.clearInput.addEventListener("click", resetValidation);
  elements.documentInput.addEventListener("keydown", event => { if (event.key === "Enter") handleValidate(); });
  elements.applyFormatting.addEventListener("click", () => handleFormat(true));
  elements.removeFormatting.addEventListener("click", () => handleFormat(false));
  elements.formatterInput.addEventListener("keydown", event => { if (event.key === "Enter") handleFormat(true); });
  elements.copyFormatted.addEventListener("click", () => copyText(state.formattedResult));
  elements.clearHistory.addEventListener("click", () => {
    if (!window.confirm("Deseja apagar todo o histórico salvo neste navegador?")) return;
    state.history = [];
    saveHistory();
    renderHistory();
    showToast("Histórico removido.");
  });
}

initializeTheme();
bindEvents();
updateGeneratorUI();
renderHistory();

window.CpfCnpjStudio = { generateCPF, generateCNPJ, validateCPF, validateCNPJ, formatCPF, formatCNPJ };
