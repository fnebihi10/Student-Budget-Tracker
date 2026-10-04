const { spawnSync } = require("node:child_process");
const path = require("node:path");

const env = { ...process.env };
delete env.NO_COLOR;
delete env.FORCE_COLOR;
const demo = process.argv.includes('--demo');
const isolated = process.argv.includes('--test-project');
if (isolated) {
  const project = require('./isolated-project.cjs').isolatedProject();
  env.EXPO_NO_DOTENV = '1';
  env.EXPO_PUBLIC_SUPABASE_URL = project.url;
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = project.publicKey;
  delete env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  delete env.SUPABASE_TEST_SERVICE_ROLE_KEY;
}
if (demo) {
  env.EXPO_NO_DOTENV = '1';
  delete env.EXPO_PUBLIC_SUPABASE_URL;
  delete env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
}

const expoCli = path.join(
  path.dirname(require.resolve("expo/package.json")),
  "bin",
  "cli"
);
const result = spawnSync(
  process.execPath,
  [expoCli, "export", "--clear", "--platform", isolated ? 'web' : 'all', ...(demo ? ['--output-dir', 'dist-demo'] : isolated ? ['--output-dir', 'dist-test'] : [])],
  { env, stdio: "inherit" }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
