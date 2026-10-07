import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
process.loadEnvFile(".env.local");
if (
  !process.env.CONVEX_DEPLOYMENT?.startsWith("dev:") ||
  process.env.CONVEX_DEPLOY_KEY
)
  throw new Error(
    "This helper requires the configured personal development deployment, without a deployment key.",
  );
const content = readFileSync(".env.local", "utf8");
for (const name of ["ANALYSIS_SERVER_SECRET", "ANALYSIS_IP_SALT"]) {
  if (!process.env[name]) {
    const value = randomBytes(32).toString("hex");
    if (new RegExp(`^${name}=`, "m").test(content))
      throw new Error(`Remove the empty ${name} assignment first.`);
    appendFileSync(".env.local", `\n${name}=${value}\n`);
    process.env[name] = value;
  }
}
const result = spawnSync(
  "npx",
  [
    "convex",
    "env",
    "set",
    "ANALYSIS_SERVER_SECRET",
    process.env.ANALYSIS_SERVER_SECRET,
  ],
  { encoding: "utf8" },
);
if (result.status !== 0)
  throw new Error(
    "Could not set the development server credential; inspect Convex configuration.",
  );
console.log(
  "Development analysis credentials configured. Values were not printed.",
);
