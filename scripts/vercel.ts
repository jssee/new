import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Run through `bun run` from the repository root: that puts the workspace's
// `vercel` on PATH, and the root is where `vercel link` stores the project.

export interface Deployment {
  meta: { githubCommitSha?: string };
  state: string;
  url: string;
}

/** Exits unless `vercel link` has run. Unlinked, the CLI searches every
 * project in the scope, so a branch name can match another project. */
export function requireLinkedProject() {
  if (!existsSync(".vercel/project.json")) {
    console.error("Not linked to a Vercel project. Run: bun run deploy:setup");
    process.exit(1);
  }
}

/** Runs a command and returns its stdout; exits with its output if it fails. */
export function output(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
    stdio: [input === undefined ? "inherit" : "pipe", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    // The Vercel CLI reports errors such as `not_linked` on stdout.
    process.stderr.write(result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

/** Runs the Vercel CLI with its output shown; returns whether it succeeded. */
export const vercel = (args: string[]) =>
  spawnSync("vercel", args, { stdio: "inherit" }).status === 0;

export const vercelOutput = (args: string[], input?: string) =>
  output("vercel", args, input);

export const currentBranch = () => output("git", ["branch", "--show-current"]);

/** The newest deployment matching `vercel list` filters, if any. */
export function latestDeployment(filters: string[]): Deployment | undefined {
  // The deployments API returns newest first, so the first page of one is it.
  const { deployments } = JSON.parse(
    vercelOutput(["list", ...filters, "--json", "--limit", "1"])
  ) as { deployments: Deployment[] };
  return deployments[0];
}
