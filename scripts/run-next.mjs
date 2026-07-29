import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const command = process.argv[2];
const args = process.argv.slice(3);

const distDirs = {
  dev: ".next-dev",
  build: ".next-build",
  start: ".next-build"
};

if (!command || !distDirs[command]) {
  console.error("Usage: node scripts/run-next.mjs <dev|build|start> [next args...]");
  process.exit(1);
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, ...args], {
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDirs[command]
  },
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
