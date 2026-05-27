import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

interface BuildManifest {
  version: string;
  buildSha: string;
  branch: string;
  buildTime: string;
  dataSchemaVersion: number;
  storageSchemaVersion: number;
}

const buildManifest = createBuildManifest();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildManifest.version),
    __APP_BUILD_SHA__: JSON.stringify(buildManifest.buildSha),
    __APP_BRANCH__: JSON.stringify(buildManifest.branch),
    __APP_BUILD_TIME__: JSON.stringify(buildManifest.buildTime),
  },
  plugins: [versionManifestPlugin(buildManifest)],
});

function versionManifestPlugin(manifest: BuildManifest): Plugin {
  const source = JSON.stringify(manifest, null, 2);

  return {
    name: "hong-hsk4-version-manifest",
    configureServer(server) {
      server.middlewares.use("/version.json", (_request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source,
      });
    },
  };
}

function createBuildManifest(): BuildManifest {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { version?: string };

  return {
    version: packageJson.version ?? "0.0.0",
    buildSha: readGitValue("rev-parse --short=12 HEAD", "dev"),
    branch: readGitValue("rev-parse --abbrev-ref HEAD", "local"),
    buildTime: new Date().toISOString(),
    dataSchemaVersion: readNumericConstant("APP_DATA_SCHEMA_VERSION", 1),
    storageSchemaVersion: readNumericConstant("INDEXEDDB_SCHEMA_VERSION", 1),
  };
}

function readGitValue(command: string, fallback: string): string {
  try {
    return execSync(`git ${command}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function readNumericConstant(name: string, fallback: number): number {
  try {
    const source = readFileSync("src/domain/app-version.ts", "utf8");
    const match = source.match(new RegExp(`export const ${name} = (\\d+)`));
    return match ? Number(match[1]) : fallback;
  } catch {
    return fallback;
  }
}
