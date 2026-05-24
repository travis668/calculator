import {
  createCalculatorState,
  pressCalculatorKey,
} from "./calculator-core.js";

const display = document.querySelector("[data-display]");
const expression = document.querySelector("[data-expression]");
const statusText = document.querySelector("[data-status]");
const keys = document.querySelectorAll("[data-key]");
const historyList = document.querySelector("[data-history-list]");
const historyStatus = document.querySelector("[data-history-status]");
const historyClear = document.querySelector("[data-history-clear]");
const historyToggle = document.querySelector("[data-history-toggle]");
const historyClose = document.querySelector("[data-history-close]");
const historySidebar = document.querySelector("#history-sidebar");

const MAX_HISTORY = 20;
const HISTORY_STORAGE_KEY = "calculator.history.v1";

let state = createCalculatorState();
let historyEntries = [];
let isHistoryOpen = false;

function render() {
  expression.textContent = state.expressionText;
  display.textContent = fitDisplayToViewport(state.display);
  display.dataset.error = state.display === "Error" ? "true" : "false";
}

function press(key) {
  const previousState = state;

  if (state.display === "Error" && key !== "C") {
    state = createCalculatorState();
  }

  state = pressCalculatorKey(state, key);
  maybeRecordHistory(previousState, state, key);
  render();
}

function maybeRecordHistory(previousState, nextState, key) {
  if (key !== "=" || nextState.display === "Error") {
    return;
  }

  const didEvaluate = !previousState.justEvaluated && nextState.justEvaluated;
  const normalizedExpression = nextState.expressionText.replace(/\s*=$/, "").trim();

  if (!didEvaluate || normalizedExpression.length === 0) {
    return;
  }

  historyEntries = [
    {
      expression: normalizedExpression,
      result: nextState.display,
    },
    ...historyEntries,
  ].slice(0, MAX_HISTORY);

  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.textContent = "";

  for (const item of historyEntries) {
    const row = document.createElement("li");
    row.className = "history-item";

    const expressionButton = document.createElement("button");
    expressionButton.type = "button";
    expressionButton.className = "history-copy history-expression";
    expressionButton.textContent = item.expression;
    expressionButton.addEventListener("click", () => {
      applyExpression(item.expression);
    });

    const resultButton = document.createElement("button");
    resultButton.type = "button";
    resultButton.className = "history-copy history-result";
    resultButton.textContent = item.result;
    resultButton.addEventListener("click", () => {
      applyResult(item.result);
    });

    row.append(expressionButton, resultButton);
    historyList.append(row);
  }
}

function applyExpression(expressionText) {
  const tokens = expressionText.split(" ").filter(Boolean);
  let nextState = createCalculatorState();

  for (const token of tokens) {
    if (["+", "-", "×", "÷", "%", "(", ")"].includes(token)) {
      nextState = pressCalculatorKey(nextState, token);
      continue;
    }

    if (/^-?\d+(\.\d+)?$/.test(token)) {
      nextState = pressNumberToken(nextState, token);
    }
  }

  state = nextState;
  historyStatus.textContent = `已載入算式：${expressionText}`;
  render();
  setHistoryOpen(false);
}

function applyResult(resultText) {
  if (!/^-?\d+(\.\d+)?$/.test(resultText)) {
    return;
  }

  state = pressNumberToken(createCalculatorState(), resultText);
  historyStatus.textContent = `已帶入結果：${resultText}`;
  render();
  setHistoryOpen(false);
}

function pressNumberToken(nextState, token) {
  const isNegative = token.startsWith("-");
  const absoluteToken = isNegative ? token.slice(1) : token;

  for (const char of absoluteToken) {
    nextState = pressCalculatorKey(nextState, char);
  }

  if (isNegative) {
    nextState = pressCalculatorKey(nextState, "+/-");
  }

  return nextState;
}

function setHistoryOpen(nextOpen) {
  isHistoryOpen = nextOpen;
  document.body.dataset.historyOpen = nextOpen ? "true" : "false";
  historySidebar.setAttribute("aria-hidden", nextOpen ? "false" : "true");
  historyToggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
}

keys.forEach((button) => {
  button.addEventListener("click", () => {
    press(button.dataset.key);
  });
});

historyClear.addEventListener("click", () => {
  historyEntries = [];
  saveHistory();
  historyStatus.textContent = "點算式可載入，點結果可帶回計算";
  renderHistory();
});

historyToggle.addEventListener("click", () => {
  setHistoryOpen(!isHistoryOpen);
});

historyClose.addEventListener("click", () => {
  setHistoryOpen(false);
});

document.addEventListener("keydown", (event) => {
  const keyMap = {
    "/": "÷",
    "*": "×",
    Escape: "C",
    c: "C",
    C: "C",
    Enter: "=",
    "=": "=",
    Backspace: "⌫",
  };

  const mappedKey = keyMap[event.key] ?? event.key;

  if (event.key === "Escape" && isHistoryOpen) {
    event.preventDefault();
    setHistoryOpen(false);
    return;
  }

  if (/^\d$/.test(mappedKey) || [".", "+", "-", "×", "÷", "%", "=", "⌫", "C", "(", ")"].includes(mappedKey)) {
    event.preventDefault();
    press(mappedKey);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      statusText.textContent = "已可離線使用";
    } catch {
      statusText.textContent = "離線快取尚未啟用";
    }
  });
} else {
  statusText.textContent = "此瀏覽器不支援離線快取";
}

window.addEventListener("resize", () => {
  render();
});

render();
historyEntries = loadHistory();
renderHistory();
setHistoryOpen(false);

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => {
        return item
          && typeof item.expression === "string"
          && typeof item.result === "string"
          && item.expression.trim() !== ""
          && item.result.trim() !== "";
      })
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc.)
  }
}

function fitDisplayToViewport(rawDisplay) {
  if (!/^[-]?\d+(\.\d+)?$/.test(rawDisplay)) {
    return rawDisplay;
  }

  const maxChars = estimateMaxChars(display);
  if (rawDisplay.length <= maxChars) {
    return rawDisplay;
  }

  const numericValue = Number(rawDisplay);
  if (!Number.isFinite(numericValue)) {
    return rawDisplay;
  }

  const sign = numericValue < 0 ? "-" : "";
  const absolute = Math.abs(numericValue);
  const integerPart = Math.trunc(absolute).toString();
  if (sign.length + integerPart.length >= maxChars) {
    return `${sign}${integerPart.slice(0, maxChars - sign.length)}`;
  }

  const maxFractionDigits = Math.max(0, maxChars - sign.length - integerPart.length - 1);
  const reduced = absolute.toFixed(maxFractionDigits).replace(/\.?0+$/, "");

  return `${sign}${reduced}`;
}

function estimateMaxChars(element) {
  const width = element.clientWidth || 0;
  const fontSize = Number.parseFloat(getComputedStyle(element).fontSize) || 16;
  const averageDigitWidth = fontSize * 0.62;
  const rawCapacity = Math.floor(width / averageDigitWidth);
  const capacity = rawCapacity - 1;

  return Math.max(6, Math.min(18, capacity));
}
