// Pushes local env values to a Vercel environment, overwriting what is there.
// Usage: bun run env:preview | bun run env:production
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseEnv } from "node:util";
import {
  currentBranch,
  latestDeployment,
  output,
  requireLinkedProject,
  vercel,
  vercelOutput,
} from "./vercel.ts";

const TARGETS = new Set(["preview", "production"]);
// Values that only work on this machine; pushing them would break deployments.
// `.local` covers mDNS and OrbStack hosts.
const LOCAL_ONLY = /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local\b|^file:/i;
// Secrets each Vercel environment gets its own random value for, generated the
// first time it is synced and never copied from local values.
// _VARLOCK_ENV_KEY encrypts the env baked into the build (@encryptInjectedEnv
// in .env.schema); BETTER_AUTH_SECRET signs sessions.
const GENERATED = ["_VARLOCK_ENV_KEY", "BETTER_AUTH_SECRET"];

const target = process.argv[2] ?? "";
if (!TARGETS.has(target)) {
  console.error("Usage: bun scripts/sync-vercel-env.ts <preview|production>");
  process.exit(1);
}
requireLinkedProject();

const readEnv = (file: string) =>
  existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {};

// Only schema keys are app config. Later files win, matching Varlock.
const declared = Object.keys(readEnv("apps/web/.env.schema"));
const local = {
  ...readEnv("apps/web/.env"),
  ...readEnv("apps/web/.env.local"),
};

const toSync = new Map<string, string>();
const skipped: string[] = [];
for (const key of declared) {
  const value = local[key];
  // Vercel sets VERCEL_* itself.
  if (!value || key.startsWith("VERCEL_") || GENERATED.includes(key)) {
    continue;
  }
  if (LOCAL_ONLY.test(value)) {
    skipped.push(key);
  } else {
    toSync.set(key, value);
  }
}

if (skipped.length > 0) {
  console.log(`Skipping local-only values: ${skipped.join(", ")}`);
}

const add = (key: string, value: string) =>
  vercelOutput(
    ["env", "add", key, target, "--sensitive", "--force", "--yes"],
    value
  );

for (const [key, value] of toSync) {
  console.log(`Setting ${key}`);
  add(key, value);
}

const { envs } = JSON.parse(vercelOutput(["env", "ls", target, "--json"])) as {
  envs: { key: string }[];
};
const missing = GENERATED.filter(
  (name) => !envs.some(({ key }) => key === name)
);
for (const key of missing) {
  console.log(`Generating ${key}`);
  add(
    key,
    output("bun", [
      "run",
      "--cwd",
      "apps/web",
      "varlock",
      "generate-key",
      "--plain",
    ])
  );
}
if (toSync.size === 0 && missing.length === 0) {
  console.log("Nothing to sync.");
  process.exit(0);
}

// Env changes only reach deployments built after them.
const deployment = latestDeployment(
  target === "production"
    ? ["--environment", "production"]
    : [
        "--environment",
        "preview",
        "--meta",
        `githubCommitRef=${currentBranch()}`,
      ]
);
if (!deployment) {
  process.exit(0);
}
const redeploy = ["redeploy", deployment.url];
if (!process.stdin.isTTY) {
  console.log(`Apply with: bunx vercel ${redeploy.join(" ")}`);
  process.exit(0);
}
const prompt = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const answer = await prompt.question(`Redeploy ${deployment.url}? [y/N] `);
prompt.close();
if (answer.trim().toLowerCase() === "y" && !vercel(redeploy)) {
  process.exit(1);
}
