// Prints this checkout's DATABASE_URL on the local dev Postgres server.
// apps/web/.env.schema runs it to default DATABASE_URL outside deployments.
//
// The main checkout uses the `app` database. A linked git worktree gets its own
// database named after its branch, following the same rules Portless uses for
// its URL, so agents in parallel worktrees never share data or migrations.
import { $ } from "bun";

const PROJECT = "app";
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

const isLinkedWorktree = gitDir !== commonDir;
const suffix = (branch.split("/").at(-1) ?? "")
  .toLowerCase()
  .replaceAll(/[^a-z0-9]+/g, "_")
  .replaceAll(/^_+|_+$/g, "");

const name =
  isLinkedWorktree && !DEFAULT_BRANCHES.has(branch) && suffix
    ? `${PROJECT}_${suffix}`.slice(0, 63)
    : PROJECT;

console.log(`${SERVER}/${name}`);
