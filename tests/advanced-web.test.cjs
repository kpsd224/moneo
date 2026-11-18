const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../../site/index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const nodes=new Map();
const cls={add(){},remove(){}};
const document={
  getElementById(id){if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',value:'',textContent:'',classList:cls,style:{},click(){}});return nodes.get(id);},
  querySelectorAll(){return []},createElement(){return {click(){},set href(x){},set download(x){}}}
};
const memory=new Map();
const sandbox={console,document,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},alert:m=>{if(/Gagal|tidak/.test(m))console.log('alert',m);},confirm:()=>true,Blob:class{},URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout:()=>{},Date};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);scripts.slice(0,2).forEach(s=>vm.runInContext(s,sandbox));
assert.equal(vm.runInContext('data.transactions.length',sandbox),0);
vm.runInContext("tab('advanced')",sandbox);
assert.ok(nodes.get('page').innerHTML.includes('Keuangan')); 
assert.ok(nodes.get('page').innerHTML.includes('Transfer'));
const first=vm.runInContext('totalBalance()',sandbox),monthBefore=vm.runInContext("sum('2025-01','expense')",sandbox);
for(const [k,v] of Object.entries({afrom:'bni',ato:'cash',aamount:'75000',adate:'2025-01-06',anote:'Tes transfer'}))document.getElementById(k).value=v;
vm.runInContext('saveTransfer()',sandbox);
assert.equal(vm.runInContext('totalBalance()',sandbox),first);
assert.equal(vm.runInContext('balance("bni")',sandbox),-75000);
assert.equal(vm.runInContext("sum('2025-01','expense')",sandbox),monthBefore);
assert.equal(vm.runInContext('data.advanced.transfers.length',sandbox),1);
assert.equal(vm.runInContext('validBackup(backupSnapshot())',sandbox),true);
vm.runInContext("data.advanced.settings.rollover=true",sandbox);
assert.ok(nodes.get('page').innerHTML.includes('transfer') || vm.runInContext('advancedPage().includes("Transfer")',sandbox));
const rows=vm.runInContext("parseCsv('Tanggal,Jenis,Kategori,Dompet,Nominal (Rp),Catatan\\r\\n2025-01-04,Pengeluaran,Tagihan,BNI,1000,\"Bayar, listrik\"')",sandbox);
assert.equal(rows[1][5],'Bayar, listrik');
vm.runInContext("data.advanced.transfers[0].to='broken'",sandbox);
assert.equal(vm.runInContext('validBackup(backupSnapshot())',sandbox),false);
console.log('PASS: offline web advanced screen, transfers no report distortion, backup validation, CSV parser');
