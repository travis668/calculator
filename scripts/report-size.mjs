import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

const rows = [
  {
    label: "JS",
    sourcePaths: ["src/app.js", "src/calculator-core.js"],
    distPaths: ["dist/src/app.js"],
  },
  {
    label: "CSS",
    sourcePaths: ["src/styles.css"],
    distPaths: pickFirstExisting([
      "dist/src/styles.css",
      "dist/assets/index.css",
    ]),
  },
];

console.log("\nBuild size report\n");
console.log("Type | Source | Dist | Delta");
console.log("---|---:|---:|---:");

for (const row of rows) {
  const source = await readCombined(row.sourcePaths);
  const dist = await readCombined(row.distPaths);

  const sourceRaw = source.byteLength;
  const distRaw = dist.byteLength;
  const sourceGzip = gzipSync(source).byteLength;
  const distGzip = gzipSync(dist).byteLength;
  const sourceBrotli = brotliCompressSync(source).byteLength;
  const distBrotli = brotliCompressSync(dist).byteLength;

  printLine(`${row.label} raw`, sourceRaw, distRaw);
  printLine(`${row.label} gzip`, sourceGzip, distGzip);
  printLine(`${row.label} br`, sourceBrotli, distBrotli);
}

console.log("");

async function readCombined(paths) {
  const buffers = [];
  for (const path of paths) {
    buffers.push(await readFile(path));
  }
  return Buffer.concat(buffers);
}

function printLine(label, sourceSize, distSize) {
  const percent = sourceSize > 0
    ? (((sourceSize - distSize) / sourceSize) * 100).toFixed(1)
    : "0.0";

  console.log(
    `${label} | ${formatBytes(sourceSize)} | ${formatBytes(distSize)} | ${percent}%`,
  );
}

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function pickFirstExisting(paths) {
  for (const path of paths) {
    if (existsSync(path)) {
      return [path];
    }
  }

  return [paths[0]];
}
