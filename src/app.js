import {
  createCalculatorState,
  pressCalculatorKey,
} from "./calculator-core.js";

const display = document.querySelector("[data-display]");
const statusText = document.querySelector("[data-status]");
const keys = document.querySelectorAll("[data-key]");

let state = createCalculatorState();

function render() {
  display.textContent = state.display;
  display.dataset.error = state.display === "Error" ? "true" : "false";
}

function press(key) {
  if (state.display === "Error" && key !== "C") {
    state = createCalculatorState();
  }

  state = pressCalculatorKey(state, key);
  render();
}

keys.forEach((button) => {
  button.addEventListener("click", () => {
    press(button.dataset.key);
  });
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

  if (/^\d$/.test(mappedKey) || [".", "+", "-", "×", "÷", "%", "=", "⌫", "C"].includes(mappedKey)) {
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

render();
