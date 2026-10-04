const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const supported = ['UTC', 'Europe/Berlin', 'America/Los_Angeles', 'Pacific/Kiritimati'];
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--zone' || !supported.includes(args[1]))) {
  throw new Error(`Usage: node scripts/test-timezones.cjs [--zone ${supported.join('|')}]`);
}
const zones = args.length ? [args[1]] : supported;
const root = path.resolve(__dirname, '..');
const reports = path.join(root, 'test-results', 'timezones');
fs.mkdirSync(reports, { recursive: true });
let failed = false;
for (const zone of zones) {
  console.log(`\nFull Jest suite: TZ=${zone}`);
  const result = spawnSync(process.execPath, [
    require.resolve('jest/bin/jest'), '--runInBand', '--json',
    `--outputFile=${path.join(reports, `${zone.replaceAll('/', '-')}.json`)}`,
  ], { cwd: root, env: { ...process.env, TZ: zone }, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0 || result.error) failed = true;
}
process.exitCode = failed ? 1 : 0;
