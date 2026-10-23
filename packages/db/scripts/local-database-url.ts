// Prints this checkout's DATABASE_URL on the local dev Postgres server.
// apps/web/.env.schema runs it to default DATABASE_URL outside deployments.
//
// The main checkout's database is named after the project (the root
// package.json name). A linked git worktree gets its own database named after
// its branch, following the rules Portless uses for its URL, so agents in
// parallel worktrees never share data or migrations.
import { $ } from "bun";

import rootPackage from "../../../package.json" with { type: "json" };

const SERVER = "postgresql://postgres:postgres@localhost:5432";
const DEFAULT_BRANCHES = new Set(["", "main", "master"]);

// Deployments must set DATABASE_URL themselves. Printing nothing makes varlock
// fail validation instead of pointing a deployment at localhost.
if (process.env.VERCEL) {
  process.exit(0);
}

const git = async (...args: string[]) => (await $`git ${args}`.text()).trim();

const [gitDir, commonDir, branch] = await Promise.all([
  git("rev-parse", "--absolute-git-dir"),
  git("rev-parse", "--path-format=absolute", "--git-common-dir"),
  git("branch", "--show-current"),
]);

const toIdentifier = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");

const project = toIdentifier(rootPackage.name);
const suffix = toIdentifier(branch.split("/").at(-1) ?? "");
const isLinkedWorktree = gitDir !== commonDir;

const name =
  isLinkedWorktree && !DEFAULT_BRANCHES.has(branch) && suffix
    ? `${project}_${suffix}`.slice(0, 63)
    : project;

console.log(`${SERVER}/${name}`);
