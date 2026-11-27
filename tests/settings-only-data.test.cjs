const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
for (const rel of ['site/index.html','mobile/preview/index.html']) {
  const html=fs.readFileSync(path.resolve(__dirname,'../../',rel),'utf8');
  assert(!html.includes("${head('Pengelolaan data offline')}"), 'Finance contains duplicate panel');
  assert(!html.includes('<b>Backup</b><small>CSV / JSON</small>'), 'Finance still contains redundant backup tile');
  assert(html.includes('onclick="importCsvStart()">↑ Impor transaksi CSV (pratinjau dahulu)</button><button class="save-btn" onclick="downloadBackup()"'), 'Settings lacks CSV import or backup');
  assert(html.includes('onclick="exportCsv()">↓ Ekspor transaksi CSV</button>'), 'Settings lacks CSV export');
  assert(html.includes('onclick="document.getElementById(\'restore-file\').click()"'), 'Settings lacks JSON restore');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  assert(scripts.length>=2);
  const n=new Map(),memory=new Map();
  const dom={getElementById(id){if(!n.has(id))n.set(id,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},style:{},click(){}});return n.get(id)},querySelectorAll(){return []}};
  const sandbox={localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},document:dom,confirm:()=>true,alert:()=>{},console,setTimeout:()=>{},Date,Math};
  vm.createContext(sandbox);scripts.slice(0,2).forEach(s=>vm.runInContext(s,sandbox));
  vm.runInContext("tab('advanced')",sandbox);
  assert(!n.get('page').innerHTML.includes('Pengelolaan data offline'));
  assert(!n.get('page').innerHTML.includes('Impor transaksi CSV'));
  vm.runInContext('settings()',sandbox);
  assert(n.get('sheet').innerHTML.includes('Impor transaksi CSV'));
  assert(n.get('sheet').innerHTML.includes('Pulihkan backup JSON'));
  vm.runInContext('importCsvStart()',sandbox);
  assert(n.get('sheet').innerHTML.includes('PILIH BERKAS CSV'));
  assert(n.get('sheet').innerHTML.includes('onclick="settings()">Batal'));
  assert(html.includes('© 2026 Na'));
}
const native=fs.readFileSync(path.resolve(__dirname,'../App.tsx'),'utf8');
assert(!native.includes("quick('Backup','settings'"));
assert(native.includes('Bagikan backup JSON') && native.includes('Pulihkan dari teks JSON'));
console.log('PASS: offline data controls appear in Settings only and CSV import is still accessible');
