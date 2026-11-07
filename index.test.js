const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { beforeEach, afterEach, test } = require("node:test");

const VALID_SECRET = "a-valid-test-secret-of-at-least-32-chars";

let root;
let appDir;
let otherDir;

// Each test gets its own copy of the scripts, so a developer's real .env can't
// affect it. The scripts run from a different folder to prove that .env is
// found next to them and not in the current directory.
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "fixsec-"));
  appDir = path.join(root, "app");
  otherDir = path.join(root, "other");
  fs.mkdirSync(appDir);
  fs.mkdirSync(otherDir);
  for (const file of ["index.js", "setup.js"]) {
    fs.copyFileSync(path.join(__dirname, file), path.join(appDir, file));
  }
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function run(file, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  if (!("JWT_SECRET" in extraEnv)) delete env.JWT_SECRET;
  return spawnSync(process.execPath, [path.join(appDir, file)], {
    cwd: otherDir,
    env,
    encoding: "utf8",
  });
}

const envPath = () => path.join(appDir, ".env");
const writeEnvFile = (content) => fs.writeFileSync(envPath(), content);
const readEnvFile = () => fs.readFileSync(envPath(), "utf8");

test("exits 1 with a clear message when JWT_SECRET is missing", () => {
  const result = run("index.js");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JWT_SECRET is not set/);
});

test("treats an empty JWT_SECRET as missing", () => {
  writeEnvFile("JWT_SECRET=\n");
  assert.equal(run("index.js").status, 1);
});

test("treats a whitespace-only JWT_SECRET as missing", () => {
  const result = run("index.js", { JWT_SECRET: " ".repeat(40) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /JWT_SECRET is not set/);
});

test("rejects a short JWT_SECRET without printing it", () => {
  writeEnvFile("JWT_SECRET=too-short-to-be-safe\n");
  const result = run("index.js");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /too short/);
  assert.doesNotMatch(result.stdout + result.stderr, /too-short-to-be-safe/);
});

test("reads the secret from .env beside the script and never prints it", () => {
  writeEnvFile(`JWT_SECRET=${VALID_SECRET}\n`);
  const result = run("index.js");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /JWT_SECRET loaded/);
  assert.ok(!(result.stdout + result.stderr).includes(VALID_SECRET));
});

test("reads the secret from the environment and never prints it", () => {
  const result = run("index.js", { JWT_SECRET: VALID_SECRET });
  assert.equal(result.status, 0);
  assert.ok(!(result.stdout + result.stderr).includes(VALID_SECRET));
});

test("a value in the environment takes priority over .env", () => {
  writeEnvFile("JWT_SECRET=short\n");
  assert.equal(run("index.js", { JWT_SECRET: VALID_SECRET }).status, 0);
});

test("setup creates a random 256-bit secret that index.js accepts", () => {
  assert.equal(run("setup.js").status, 0);
  assert.match(readEnvFile(), /^JWT_SECRET=[0-9a-f]{64}\n$/);
  assert.equal(fs.existsSync(path.join(otherDir, ".env")), false);
  assert.equal(run("index.js").status, 0);
});

test("setup does not overwrite an existing .env", () => {
  writeEnvFile("JWT_SECRET=keep-me\n");
  assert.equal(run("setup.js").status, 0);
  assert.equal(readEnvFile(), "JWT_SECRET=keep-me\n");
});
