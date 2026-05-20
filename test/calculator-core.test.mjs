import assert from "node:assert/strict";
import test from "node:test";

import {
  createCalculatorState,
  pressCalculatorKey,
} from "../src/calculator-core.js";

function pressMany(keys) {
  return keys.reduce(pressCalculatorKey, createCalculatorState());
}

test("adds two numbers", () => {
  const state = pressMany(["1", "2", "+", "7", "="]);

  assert.equal(state.display, "19");
});

test("waits until equals before evaluating a chained expression", () => {
  const beforeEquals = pressMany(["1", "+", "2", "+", "3"]);
  const afterEquals = pressMany(["1", "+", "2", "+", "3", "="]);

  assert.equal(beforeEquals.display, "3");
  assert.equal(beforeEquals.expressionText, "1 + 2 + 3");
  assert.equal(afterEquals.display, "6");
});

test("evaluates parentheses with standard operator precedence", () => {
  const state = pressMany(["1", "+", "2", "×", "(", "3", "+", "4", ")", "="]);

  assert.equal(state.expressionText, "1 + 2 × ( 3 + 4 ) =");
  assert.equal(state.display, "15");
});

test("continues with a new expression after equals", () => {
  const state = pressMany(["8", "-", "3", "=", "×", "2", "="]);

  assert.equal(state.display, "10");
});

test("supports percent, sign toggle, decimals, backspace, parentheses, and clear", () => {
  assert.equal(pressMany(["5", "0", "%"]).display, "0.5");
  assert.equal(pressMany(["9", "+/-"]).display, "-9");
  assert.equal(pressMany(["1", ".", "5", "⌫"]).display, "1");
  assert.equal(pressMany(["1", "+", "2", "⌫"]).expressionText, "1 +");
  assert.equal(pressMany(["1", "+", "⌫"]).expressionText, "1");
  assert.equal(pressMany(["(", "1", "+", "2", ")"]).expressionText, "( 1 + 2 )");
  assert.equal(pressMany(["1", "2", "C"]).display, "0");
});
