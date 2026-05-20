const MAX_DISPLAY_LENGTH = 14;

export function createCalculatorState() {
  return {
    display: "0",
    firstOperand: null,
    operator: null,
    lastOperator: null,
    lastOperand: null,
    waitingForOperand: false,
    justEvaluated: false,
  };
}

export function pressCalculatorKey(state, key) {
  if (/^\d$/.test(key)) {
    return inputDigit(state, key);
  }

  switch (key) {
    case ".":
      return inputDecimal(state);
    case "C":
      return createCalculatorState();
    case "⌫":
    case "Backspace":
      return backspace(state);
    case "+/-":
      return toggleSign(state);
    case "%":
      return applyPercent(state);
    case "+":
    case "-":
    case "×":
    case "÷":
      return chooseOperator(state, key);
    case "=":
    case "Enter":
      return evaluate(state);
    default:
      return state;
  }
}

function inputDigit(state, digit) {
  if (state.waitingForOperand || state.justEvaluated) {
    return {
      ...state,
      display: digit,
      waitingForOperand: false,
      justEvaluated: false,
    };
  }

  if (state.display.replace("-", "").replace(".", "").length >= MAX_DISPLAY_LENGTH) {
    return state;
  }

  return {
    ...state,
    display: state.display === "0" ? digit : `${state.display}${digit}`,
  };
}

function inputDecimal(state) {
  if (state.waitingForOperand || state.justEvaluated) {
    return {
      ...state,
      display: "0.",
      waitingForOperand: false,
      justEvaluated: false,
    };
  }

  if (state.display.includes(".")) {
    return state;
  }

  return {
    ...state,
    display: `${state.display}.`,
  };
}

function backspace(state) {
  if (state.waitingForOperand || state.justEvaluated || state.display.length === 1) {
    return {
      ...state,
      display: "0",
      justEvaluated: false,
    };
  }

  if (state.display.length === 2 && state.display.startsWith("-")) {
    return {
      ...state,
      display: "0",
    };
  }

  const nextDisplay = state.display.slice(0, -1);

  return {
    ...state,
    display: nextDisplay.endsWith(".") ? nextDisplay.slice(0, -1) : nextDisplay,
  };
}

function toggleSign(state) {
  if (state.display === "0") {
    return state;
  }

  return {
    ...state,
    display: state.display.startsWith("-")
      ? state.display.slice(1)
      : `-${state.display}`,
  };
}

function applyPercent(state) {
  return {
    ...state,
    display: formatNumber(parseDisplay(state.display) / 100),
  };
}

function chooseOperator(state, nextOperator) {
  const inputValue = parseDisplay(state.display);

  if (state.operator && !state.waitingForOperand) {
    const result = calculate(state.firstOperand, inputValue, state.operator);

    return {
      ...state,
      display: formatNumber(result),
      firstOperand: result,
      operator: nextOperator,
      lastOperator: state.operator,
      lastOperand: inputValue,
      waitingForOperand: true,
      justEvaluated: false,
    };
  }

  return {
    ...state,
    firstOperand: inputValue,
    operator: nextOperator,
    waitingForOperand: true,
    justEvaluated: false,
  };
}

function evaluate(state) {
  if (!state.operator && state.lastOperator && state.lastOperand !== null) {
    const repeatedResult = calculate(
      parseDisplay(state.display),
      state.lastOperand,
      state.lastOperator,
    );

    return {
      ...state,
      display: formatNumber(repeatedResult),
      firstOperand: repeatedResult,
      waitingForOperand: true,
      justEvaluated: true,
    };
  }

  if (!state.operator || state.firstOperand === null) {
    return state;
  }

  const secondOperand = parseDisplay(state.display);
  const result = calculate(state.firstOperand, secondOperand, state.operator);

  return {
    ...state,
    display: formatNumber(result),
    firstOperand: result,
    operator: null,
    lastOperator: state.operator,
    lastOperand: secondOperand,
    waitingForOperand: true,
    justEvaluated: true,
  };
}

function calculate(firstOperand, secondOperand, operator) {
  switch (operator) {
    case "+":
      return firstOperand + secondOperand;
    case "-":
      return firstOperand - secondOperand;
    case "×":
      return firstOperand * secondOperand;
    case "÷":
      return secondOperand === 0 ? Number.NaN : firstOperand / secondOperand;
    default:
      return secondOperand;
  }
}

function parseDisplay(display) {
  return Number(display);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const rounded = Number.parseFloat(value.toPrecision(MAX_DISPLAY_LENGTH));
  const formatted = String(rounded);

  if (formatted.length <= MAX_DISPLAY_LENGTH) {
    return formatted;
  }

  return rounded.toExponential(7);
}
