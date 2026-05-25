import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const manifestPath = "docs/agent-context/harness-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

const failures = [];

for (const file of manifest.requiredFiles) {
  if (!existsSync(file)) {
    failures.push(`Missing required context/harness file: ${file}`);
  }
}

for (const scriptName of manifest.requiredPackageScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    failures.push(`Missing package script: ${scriptName}`);
  }
}

const agents = await readFile("AGENTS.md", "utf8");
for (const requiredLink of [
  "docs/agent-context/README.md",
  "docs/agent-context/collaboration-rules.md",
  "docs/agent-context/harness.md",
  "docs/agent-context/cloudflare-final-step.md",
]) {
  if (!agents.includes(requiredLink)) {
    failures.push(`AGENTS.md does not link to ${requiredLink}`);
  }
}

for (const [file, markers] of Object.entries(manifest.criticalWorkflowMarkers)) {
  const content = await readFile(file, "utf8");
  for (const marker of markers) {
    if (!content.includes(marker)) {
      failures.push(`${file} is missing critical marker: ${marker}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Agent context check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Agent context check passed (${manifest.requiredFiles.length} files, ${manifest.requiredPackageScripts.length} scripts).`);
