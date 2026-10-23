// Shows why a branch's latest Vercel deployment failed: build logs when the
// build failed, runtime errors when it built but misbehaves.
// Usage: bun run deploy:logs [branch]  (defaults to the current branch)
import {
  currentBranch,
  latestDeployment,
  output,
  requireLinkedProject,
  vercel,
} from "./vercel.ts";

const IN_PROGRESS = new Set(["BUILDING", "INITIALIZING", "QUEUED"]);

requireLinkedProject();
const branch = process.argv[2] ?? currentBranch();
const find = () => latestDeployment(["--meta", `githubCommitRef=${branch}`]);

let deployment = find();
if (!deployment) {
  console.error(`No deployments for branch ${branch}. Has it been pushed?`);
  process.exit(1);
}

const sha = deployment.meta.githubCommitSha;
console.log(
  `https://${deployment.url} (${deployment.state}, commit ${sha?.slice(0, 7)})`
);
if (sha !== output("git", ["rev-parse", "HEAD"])) {
  console.warn(
    "This is not your local HEAD: push it, or wait for Vercel to pick it up."
  );
}

if (IN_PROGRESS.has(deployment.state)) {
  vercel(["inspect", deployment.url, "--wait", "--timeout", "10m"]);
  deployment = find() ?? deployment;
}

switch (deployment.state) {
  case "ERROR":
    vercel(["inspect", deployment.url, "--logs"]);
    break;
  case "READY":
    console.log("Build succeeded. Runtime errors:");
    vercel(["logs", "--deployment", deployment.url, "--level", "error"]);
    break;
  default:
    console.log(`Deployment is ${deployment.state}; nothing to show.`);
}
