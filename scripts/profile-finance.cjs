const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const Module = require('node:module');
const originalLoad = Module._load;
const originalJs = Module._extensions['.js'];
let writes = 0, bytes = 0, requests = 0;
const storage = {
  multiSet: async (rows) => { writes += rows.length; bytes += rows.reduce((sum, [,value]) => sum + Buffer.byteLength(value), 0); },
  multiRemove: async () => {}, getAllKeys: async () => [],
};
const query = { update() { requests++; return query; }, eq() { return query; }, select() { return query; }, single: async () => ({ data: { revision: 1 }, error: null }) };
Module._load = function(name, parent, ...rest) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (name === 'expo-crypto') return { randomUUID: () => 'uuid' };
  if (name === '@expo/vector-icons') return { Ionicons: { glyphMap: {} } };
  if (name === '../lib/supabase') return { supabase: { from: () => query } };
  return originalLoad.call(this, name, parent, ...rest);
};
const compile = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
Module._extensions['.ts'] = compile;
Module._extensions['.js'] = (module, filename) => filename.startsWith(path.resolve('src') + path.sep) ? compile(module,filename) : originalJs(module,filename);
const { getTotals } = require('../src/utils/calculations');
const { writeCache } = require('../src/services/scopedCache');
const { persistCollection, transactionToRow } = require('../src/services/cloudData');

(async () => {
  const rows = Array.from({ length: 10000 }, (_, id) => ({ id: String(id), revision: 0, type: 'expense', amount: 0.1, title: 'Synthetic transaction', category: 'food', date: '2026-10-02T12:00:00Z' }));
  const after = [...rows]; after[10] = { ...rows[10], amount: 0.2 };
  const measure = async (fn) => {
    const times = [];
    for (let i = 0; i < 30; i++) {
      const start = performance.now(); await fn();
      if (i >= 5) times.push(performance.now() - start);
    }
    times.sort((a,b)=>a-b);
    return { medianMs: +times[12].toFixed(3), p95Ms: +times[23].toFixed(3) };
  };
  const report = {
    recordedAt: new Date().toISOString(), node: process.version, platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0].model,
    environment: 'Node CPU benchmark, mocked network/storage, 5 warmups + 25 samples. These are not phone timings.',
    records: rows.length,
    totals: await measure(() => getTotals(rows, new Date('2026-10-15T12:00:00Z'))),
    legacyWholeCollectionSerialization: await measure(() => JSON.stringify(rows)),
    changedRecordCache: await measure(() => writeCache('user/synthetic', 'transactions', rows, after)),
    changedRecordCloud: await measure(() => persistCollection('transactions','synthetic',rows,after,transactionToRow)),
  };
  writes=0; bytes=0; requests=0;
  await writeCache('user/synthetic','transactions',rows,after);
  await persistCollection('transactions','synthetic',rows,after,transactionToRow);
  report.singleEdit = { serializedRecords: writes, serializedBytes: bytes, cloudRequests: requests, legacySerializedBytes: Buffer.byteLength(JSON.stringify(rows)) };
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/performance.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch((error) => { console.error(error.message); process.exitCode=1; });
