import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";

const rootUrl = "http://127.0.0.1:5173/";
const nodeBin = process.execPath;
const viteScript = "node_modules/vite/bin/vite.js";
const pythonBin = process.env.PYTHON ?? "python";

function spawnLogged(command, args, options = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    windowsHide: true,
    ...options,
  });
}

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Vite dev server did not become ready at ${url}: ${lastError}`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawnLogged(command, args);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

await mkdir("artifacts", { recursive: true });

let server;
try {
  await waitForServer(rootUrl, 1_500);
  console.log(`Using existing dev server at ${rootUrl}`);
} catch {
  server = spawnLogged(nodeBin, [
    viteScript,
    "--host",
    "127.0.0.1",
    "--port",
    "5173",
    "--strictPort",
  ]);
}

const shutdown = () => {
  if (server && !server.killed) {
    server.kill("SIGTERM");
  }
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

try {
  await waitForServer(rootUrl);
  await run(pythonBin, ["tests/verify_hsk_pwa.py"]);
  await run(pythonBin, ["tests/verify_hsk_mobile_mock.py"]);
} finally {
  shutdown();
}
