import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve("src");
const failures = [];

const files = await listFiles(sourceRoot, [".ts"]);

for (const file of files) {
  const sourceLayer = layerOf(file);
  const content = await readFile(file, "utf8");
  const imports = [...content.matchAll(/import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)];

  for (const [, specifier] of imports) {
    if (!specifier.startsWith(".")) {
      continue;
    }

    const target = resolveLocalImport(file, specifier);
    if (!target || !target.startsWith(sourceRoot)) {
      continue;
    }

    const targetLayer = layerOf(target);
    enforceRule(file, sourceLayer, target, targetLayer);
  }
}

if (failures.length) {
  console.error("Architecture check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Architecture check passed (${files.length} TypeScript files).`);

async function listFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await listFiles(fullPath, extensions)));
      continue;
    }
    if (extensions.includes(path.extname(entry.name))) {
      result.push(fullPath);
    }
  }

  return result;
}

function resolveLocalImport(sourceFile, specifier) {
  const base = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.css`,
    path.join(base, "index.ts"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function layerOf(file) {
  const relative = path.relative(sourceRoot, file).replaceAll(path.sep, "/");
  if (relative === "main.ts") {
    return "entry";
  }

  return relative.split("/")[0] ?? "unknown";
}

function enforceRule(sourceFile, sourceLayer, targetFile, targetLayer) {
  if (sourceLayer === "domain" && !["domain", "shared"].includes(targetLayer)) {
    fail(sourceFile, targetFile, "domain must stay independent from app/application/infrastructure/presentation");
  }

  if (sourceLayer === "shared" && targetLayer !== "shared") {
    fail(sourceFile, targetFile, "shared utilities must not depend on project layers");
  }

  if (sourceLayer === "presentation" && ["app", "infrastructure"].includes(targetLayer)) {
    fail(sourceFile, targetFile, "presentation must not import app or infrastructure");
  }

  if (sourceLayer === "application" && ["app", "infrastructure", "presentation"].includes(targetLayer)) {
    fail(sourceFile, targetFile, "application must depend on domain/shared, not app/infrastructure/presentation");
  }

  if (sourceLayer === "infrastructure" && ["app", "presentation"].includes(targetLayer)) {
    fail(sourceFile, targetFile, "infrastructure must not import app or presentation");
  }

  if (targetLayer === "app" && !["entry", "app"].includes(sourceLayer)) {
    fail(sourceFile, targetFile, "app layer should only be imported by the entrypoint or app layer");
  }
}

function fail(sourceFile, targetFile, reason) {
  failures.push(`${formatPath(sourceFile)} -> ${formatPath(targetFile)}: ${reason}`);
}

function formatPath(file) {
  return path.relative(process.cwd(), file).replaceAll(path.sep, "/");
}
