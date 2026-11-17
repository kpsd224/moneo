const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const native=require('../test-build/seed.js');
const {removeOldSampleData,SAMPLE_BUDGETS}=require('../test-build/sampleCleanup.js');
const F=require('../test-build/finance.js');
const period='2025-01';
function seeded(){
  const b=native.freshEmptyBook();
  b.budgets=Object.fromEntries(Object.entries(SAMPLE_BUDGETS).map(([k,v])=>[`${period}|${k}`,v]));
  b.entries=[
    {id:'demo-1',date:'2025-01-02',kind:'expense',categoryId:'rent',accountId:'bni',amount:1600000,note:'Sewa rumah Januari'},
    {id:'demo-2',date:'2025-01-03',kind:'income',categoryId:'bonus',accountId:'cash',amount:300000,note:'Bonus'},
    {id:'demo-3',date:'2025-01-02',kind:'income',categoryId:'salary',accountId:'bni',amount:5300000,note:'Gaji bulanan'},
  ];
  return b;
}
const fresh=native.freshEmptyBook();
assert.equal(fresh.entries.length,0);assert.equal(Object.keys(fresh.budgets).length,0);
assert.equal(F.allBalances(fresh),0);assert.equal(F.periodSummary(fresh,native.currentPeriod()).income,0);
const b=seeded();b.entries.push({id:'real-1',date:'2025-01-02',kind:'income',categoryId:'salary',accountId:'bni',amount:450000,note:'Gaji asli'});
b.budgets['2025-01|food']=123000;
const cleaned=removeOldSampleData(b);
assert.equal(cleaned.rows,3);assert.equal(cleaned.targets,7);
assert.equal(cleaned.book.entries.length,1);assert.equal(cleaned.book.entries[0].id,'real-1');
assert.equal(cleaned.book.budgets['2025-01|food'],123000);
assert.equal(F.allBalances(cleaned.book),450000);
assert.equal(removeOldSampleData(cleaned.book).changed,false,'Migration is idempotent');
const altered=seeded();altered.entries[0].amount=1555000;
const alteredClean=removeOldSampleData(altered);
assert(alteredClean.book.entries.some(e=>e.id==='demo-1' && e.amount===1555000),'Do not remove edited seed row');
const onlyBudgets=seeded();onlyBudgets.entries=[];
assert.equal(removeOldSampleData(onlyBudgets).targets,7,'Exact untouched template removable with no transactions');
const customBudget=seeded();customBudget.entries=[];customBudget.budgets[`${period}|salary`]=5512345;
const untouched=removeOldSampleData(customBudget);
assert.equal(untouched.targets,6,'Old Jan-2025 example targets are removed while a customised salary is kept');
assert.equal(untouched.book.budgets[`${period}|salary`],5512345);
const prev=fs.readFileSync(path.resolve(__dirname,'../../site/index.html'),'utf8');
const scripts=[...prev.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert(scripts.length>=2);
assert(!prev.includes('Reset ke data demo'));
assert(!prev.includes('onclick="confirmReset()"'));
const store={};
const localStorage={getItem:k=>Object.hasOwn(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}};
function boot(){
 const nodes=new Map();const make=(id)=>({id,value:'',innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},focus(){}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,make(id));return nodes.get(id)},querySelectorAll(){return[]},createElement(){return make('tmp')}};
 const sandbox=vm.createContext({localStorage,document,console,Date,Math,URL:{createObjectURL(){return '#'},revokeObjectURL(){}},Blob,alert(){throw Error('Unexpected alert')},setTimeout(fn){},confirm(){return true}});
 for(const code of scripts.slice(0,2))vm.runInContext(code,sandbox,{timeout:2000});
 return sandbox;
}
let ctx=boot();
assert.equal(vm.runInContext('data.transactions.length',ctx),0);
assert.equal(vm.runInContext('Object.keys(data.budgets).length',ctx),0);
assert.equal(vm.runInContext('totalBalance()',ctx),0);
assert.equal(vm.runInContext('period',ctx),native.currentPeriod());
const legacy=seeded();
store['ana-budget-preview-v1']=JSON.stringify({period:'2025-01',data:{transactions:legacy.entries.concat([{id:'user-77',date:'2025-01-06',kind:'income',categoryId:'salary',accountId:'bni',amount:987654,note:'Uang nyata'}]),budgets:{...legacy.budgets},accounts:legacy.accounts,categories:legacy.categories}});
ctx=boot();
assert.equal(vm.runInContext('data.transactions.length',ctx),1);
assert.equal(vm.runInContext('totalBalance()',ctx),987654);
assert.equal(vm.runInContext('period',ctx),native.currentPeriod());
assert(store['moneo-before-sample-cleanup-v1110'],'Safety copy should exist before mutation');
assert.equal(JSON.parse(store['moneo-before-sample-cleanup-v1110']).data.transactions.length,4);
assert.equal(JSON.parse(store['ana-budget-preview-v1']).data.transactions.length,1);
console.log('PASS v1.1.11: fresh zero, 2025 sample clean, idempotent, edited row safe, untouched targets clean, web local backup, user entries retained, current period');
