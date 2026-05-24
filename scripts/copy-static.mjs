import { cp, mkdir } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";

const DIST_DIR = "dist";

await mkdir(DIST_DIR, { recursive: true });

await cp("manifest.json", `${DIST_DIR}/manifest.json`);
await cp("service-worker.js", `${DIST_DIR}/service-worker.js`);
await cp("icons", `${DIST_DIR}/icons`, { recursive: true });

const builtHtmlPath = `${DIST_DIR}/index.html`;
const builtHtml = await readFile(builtHtmlPath, "utf8");
const patchedHtml = builtHtml.replace(
  /<link rel="manifest" href="[^"]+">/,
  '<link rel="manifest" href="./manifest.json">',
);

await writeFile(builtHtmlPath, patchedHtml, "utf8");
