const { spawnSync } = require("node:child_process");
const path = require("node:path");

const env = { ...process.env };
delete env.NO_COLOR;
delete env.FORCE_COLOR;

const expoCli = path.join(
  path.dirname(require.resolve("expo/package.json")),
  "bin",
  "cli"
);
const result = spawnSync(
  process.execPath,
  [expoCli, "export", "--platform", "all"],
  { env, stdio: "inherit" }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
