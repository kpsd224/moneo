const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
for(const name of ['AnaFinanceWidget.android.tsx','AnaFinanceWidget.ios.tsx']) {
 const src=fs.readFileSync(path.join(__dirname,'..','widgets',name),'utf8');
 const pos=src.indexOf("'widget';"); assert(pos>0,'widget directive missing');
 const outside=src.slice(0,pos),inside=src.slice(pos);
 assert(!/function\s+statusMeta\s*\(/.test(outside),'helper escapes widget isolation');
 assert(!/const\s+(?:localMascot|logoAsset)\s*=/.test(outside),'asset escapes widget isolation');
 for(const ref of ['statusMeta(', 'localMascot[', 'logoAsset'])assert(!inside.includes(ref),`undefined outer reference: ${ref}`);
 for(const label of ['Saldo Total','Pemasukan','Pengeluaran','Aman','Waspada','Hemat','Kritis','mascotUri'])assert(inside.includes(label),`${name} missing ${label}`);
}
const app=require('../app.json').expo;assert.equal(app.version,'1.1.21');assert.equal(app.android.versionCode,21);
console.log('Widget isolation regression passed');
