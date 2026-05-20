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

test("continues calculation after equals", () => {
  const state = pressMany(["8", "-", "3", "=", "×", "2", "="]);

  assert.equal(state.display, "10");
});

test("repeats the last operation when equals is pressed again", () => {
  const state = pressMany(["2", "+", "3", "=", "="]);

  assert.equal(state.display, "8");
});

test("supports percent, sign toggle, decimals, backspace, and clear", () => {
  assert.equal(pressMany(["5", "0", "%"]).display, "0.5");
  assert.equal(pressMany(["9", "+/-"]).display, "-9");
  assert.equal(pressMany(["1", ".", "5", "⌫"]).display, "1");
  assert.equal(pressMany(["1", "2", "C"]).display, "0");
});
