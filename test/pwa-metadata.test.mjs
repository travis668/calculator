import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8"),
);

test("html includes iOS standalone launch metadata", () => {
  assert.match(
    html,
    /<meta name="apple-mobile-web-app-capable" content="yes">/,
  );
  assert.match(
    html,
    /<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">/,
  );
  assert.match(
    html,
    /<meta name="apple-mobile-web-app-title" content="計算機">/,
  );
  assert.match(html, /<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png">/);
  assert.match(html, /<link rel="apple-touch-startup-image" href="\.\/icons\/startup\.png">/);
});

test("initial status does not imply the app is still loading", () => {
  assert.doesNotMatch(html, /正在準備離線快取/);
});

test("manifest advertises PNG icons for platforms that do not use SVG icons reliably", () => {
  assert.ok(
    manifest.icons.some(
      (icon) =>
        icon.src === "./icons/icon-512.png" &&
        icon.sizes === "512x512" &&
        icon.type === "image/png",
    ),
  );
});
