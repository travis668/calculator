import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serviceWorkerSource = await readFile(
  new URL("../service-worker.js", import.meta.url),
  "utf8",
);

test("service worker only caches allowlisted app shell requests", () => {
  assert.match(serviceWorkerSource, /APP_SHELL_URLS/);
  assert.doesNotMatch(serviceWorkerSource, /cache\.put\(event\.request,/);
});
