#!/usr/bin/env node
/**
 * Preflight check: verify Docker is installed AND the daemon is running.
 * Exits 0 on success, 1 on failure with a helpful message.
 * Cross-platform (Windows / macOS / Linux).
 */
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(msg) {
  process.stdout.write(msg + "\n");
}

function fail(msg, hint) {
  log(`${RED}✖ ${msg}${RESET}`);
  if (hint) log(`${YELLOW}→ ${hint}${RESET}`);
  process.exit(1);
}

function ok(msg) {
  log(`${GREEN}✔ ${msg}${RESET}`);
}

const isWin = platform() === "win32";
const isMac = platform() === "darwin";

// 1. Is the `docker` CLI on PATH?
const versionRes = spawnSync("docker", ["--version"], {
  encoding: "utf8",
  shell: isWin,
});

if (versionRes.error || versionRes.status !== 0) {
  const installHint = isWin
    ? "Install Docker Desktop from https://www.docker.com/products/docker-desktop/ then restart your terminal."
    : isMac
    ? "Install Docker Desktop: https://www.docker.com/products/docker-desktop/ (or `brew install --cask docker`)."
    : "Install Docker Engine: https://docs.docker.com/engine/install/";
  fail("Docker CLI not found on PATH.", installHint);
}

ok(`Docker CLI found: ${DIM}${versionRes.stdout.trim()}${RESET}`);

// 2. Is the Docker daemon running? `docker info` fails fast if not.
const infoRes = spawnSync("docker", ["info"], {
  encoding: "utf8",
  shell: isWin,
});

if (infoRes.status !== 0) {
  const startHint = isWin
    ? "Open Docker Desktop from the Start menu and wait until the whale icon says 'Docker Desktop is running'."
    : isMac
    ? "Open Docker Desktop from Applications (or run `open -a Docker`) and wait for the whale icon in the menu bar."
    : "Start the Docker daemon: `sudo systemctl start docker` (Linux).";
  fail("Docker is installed but the daemon is not running.", startHint);
}

ok("Docker daemon is running.");
log(`${GREEN}✔ Preflight passed — safe to run \`supabase start\`.${RESET}`);
