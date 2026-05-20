const MAX_DISPLAY_LENGTH = 14;
const OPERATORS = new Set(["+", "-", "×", "÷"]);
const PRECEDENCE = {
  "+": 1,
  "-": 1,
  "×": 2,
  "÷": 2,
};

export function createCalculatorState() {
  return withDerivedFields({
    tokens: [],
    currentInput: "",
    display: "0",
    justEvaluated: false,
  });
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
    case "(":
    case ")":
      return inputParenthesis(state, key);
    case "=":
    case "Enter":
      return evaluate(state);
    default:
      return state;
  }
}

function inputDigit(state, digit) {
  const baseState = state.justEvaluated ? createCalculatorState() : state;
  const currentInput = baseState.currentInput || "0";

  if (currentInput.replace("-", "").replace(".", "").length >= MAX_DISPLAY_LENGTH) {
    return baseState;
  }

  return withDerivedFields({
    ...baseState,
    currentInput: currentInput === "0" ? digit : `${currentInput}${digit}`,
    justEvaluated: false,
  });
}

function inputDecimal(state) {
  const baseState = state.justEvaluated ? createCalculatorState() : state;

  if (baseState.currentInput.includes(".")) {
    return baseState;
  }

  return withDerivedFields({
    ...baseState,
    currentInput: baseState.currentInput ? `${baseState.currentInput}.` : "0.",
    justEvaluated: false,
  });
}

function backspace(state) {
  if (state.justEvaluated) {
    return createCalculatorState();
  }

  if (state.currentInput.length > 0) {
    const nextInput = trimInput(state.currentInput.slice(0, -1));

    return withDerivedFields({
      ...state,
      currentInput: nextInput,
    });
  }

  if (state.tokens.length > 0) {
    return withDerivedFields({
      ...state,
      tokens: state.tokens.slice(0, -1),
    });
  }

  return state;
}

function toggleSign(state) {
  if (state.currentInput === "" || state.currentInput === "0") {
    return state;
  }

  return withDerivedFields({
    ...state,
    currentInput: state.currentInput.startsWith("-")
      ? state.currentInput.slice(1)
      : `-${state.currentInput}`,
  });
}

function applyPercent(state) {
  const currentInput = state.currentInput || state.display;

  if (currentInput === "0") {
    return state;
  }

  return withDerivedFields({
    ...state,
    currentInput: formatNumber(parseDisplay(currentInput) / 100),
    justEvaluated: false,
  });
}

function chooseOperator(state, nextOperator) {
  const baseState = state.justEvaluated
    ? {
        ...createCalculatorState(),
        tokens: [state.display],
      }
    : state;
  const tokens = commitCurrentInput(baseState);
  const lastToken = tokens.at(-1);

  if (tokens.length === 0) {
    return baseState;
  }

  const nextTokens = OPERATORS.has(lastToken)
    ? [...tokens.slice(0, -1), nextOperator]
    : [...tokens, nextOperator];

  return withDerivedFields({
    ...baseState,
    tokens: nextTokens,
    currentInput: "",
    justEvaluated: false,
  });
}

function inputParenthesis(state, parenthesis) {
  const baseState = state.justEvaluated ? createCalculatorState() : state;

  if (parenthesis === "(") {
    const tokens = commitCurrentInput(baseState);
    const lastToken = tokens.at(-1);

    if (lastToken && !OPERATORS.has(lastToken) && lastToken !== "(") {
      return baseState;
    }

    return withDerivedFields({
      ...baseState,
      tokens: [...tokens, "("],
      currentInput: "",
      justEvaluated: false,
    });
  }

  const tokens = commitCurrentInput(baseState);
  const lastToken = tokens.at(-1);

  if (!lastToken || OPERATORS.has(lastToken) || lastToken === "(") {
    return baseState;
  }

  const openCount = tokens.filter((token) => token === "(").length;
  const closeCount = tokens.filter((token) => token === ")").length;

  if (closeCount >= openCount) {
    return baseState;
  }

  return withDerivedFields({
    ...baseState,
    tokens: [...tokens, ")"],
    currentInput: "",
    justEvaluated: false,
  });
}

function evaluate(state) {
  const tokens = commitCurrentInput(state);

  if (tokens.length === 0) {
    return state;
  }

  const closedTokens = closeOpenParentheses(tokens);
  const result = evaluateExpression(closedTokens);

  return withDerivedFields({
    ...state,
    tokens: [...closedTokens, "="],
    currentInput: "",
    display: formatNumber(result),
    justEvaluated: true,
  });
}

function commitCurrentInput(state) {
  if (!state.currentInput) {
    return [...state.tokens];
  }

  return [...state.tokens, trimInput(state.currentInput)];
}

function closeOpenParentheses(tokens) {
  const openCount = tokens.filter((token) => token === "(").length;
  const closeCount = tokens.filter((token) => token === ")").length;

  if (openCount <= closeCount) {
    return [...tokens];
  }

  return [...tokens, ...Array(openCount - closeCount).fill(")")];
}

function withDerivedFields(state) {
  const expressionTokens = commitCurrentInput(state);
  const display = state.justEvaluated || state.display === "Error"
    ? state.display
    : state.currentInput || latestDisplayValue(state.tokens) || state.display || "0";

  return {
    ...state,
    expressionText: expressionTokens.join(" "),
    display,
  };
}

function latestDisplayValue(tokens) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];

    if (isNumberToken(token)) {
      return token;
    }
  }

  return "0";
}

function evaluateExpression(tokens) {
  const values = [];
  const operators = [];

  for (const token of tokens) {
    if (isNumberToken(token)) {
      values.push(parseDisplay(token));
      continue;
    }

    if (token === "(") {
      operators.push(token);
      continue;
    }

    if (token === ")") {
      while (operators.length > 0 && operators.at(-1) !== "(") {
        applyOperator(values, operators.pop());
      }
      operators.pop();
      continue;
    }

    if (OPERATORS.has(token)) {
      while (
        operators.length > 0
        && OPERATORS.has(operators.at(-1))
        && PRECEDENCE[operators.at(-1)] >= PRECEDENCE[token]
      ) {
        applyOperator(values, operators.pop());
      }
      operators.push(token);
    }
  }

  while (operators.length > 0) {
    applyOperator(values, operators.pop());
  }

  return values.length === 1 ? values[0] : Number.NaN;
}

function applyOperator(values, operator) {
  const secondOperand = values.pop();
  const firstOperand = values.pop();

  values.push(calculate(firstOperand, secondOperand, operator));
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

function isNumberToken(token) {
  return token !== undefined && token !== "" && Number.isFinite(Number(token));
}

function parseDisplay(display) {
  return Number(display);
}

function trimInput(input) {
  if (input === "" || input === "-") {
    return "";
  }

  return input.endsWith(".") ? input.slice(0, -1) : input;
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
