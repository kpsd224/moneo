const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
for (const file of ['AnaFinanceWidget.android.tsx','AnaFinanceWidget.ios.tsx']) {
  const src=fs.readFileSync(path.join(root,'widgets',file),'utf8');
  const start=src.indexOf("'widget';");
  assert(start!==-1, `${file}: missing widget directive`);
  const body=src.slice(start);
  assert(!/\brequire\s*\(/.test(body), `${file}: require() may crash in isolated widget runtime`);
  assert(body.includes('mascotUri'), `${file}: missing shared image path from props`);
  assert(body.includes('Saldo Total') && body.includes('Pemasukan') && body.includes('Pengeluaran'));
}
const publisher=fs.readFileSync(path.join(root,'src/publishWidget.ts'),'utf8');
assert(publisher.includes('widgetsDirectory'));
assert(publisher.includes('Asset.fromModule(files[name]).downloadAsync()'));
assert(publisher.includes('new File(source.localUri).copy(destination)'));
assert(publisher.includes('AnaFinanceWidget.updateSnapshot({...snapshot, mascotUri:uri, logoUri})'));
const app = require('../app.json').expo;
assert.equal(app.version,'1.1.15');assert.equal(app.android.versionCode,15);
assert.equal(app.ios.buildNumber,'15');
assert.equal(app.android.package,'com.anabudget.app');
assert.equal(app.ios.bundleIdentifier,'com.anabudget.app');
for (const mood of ['happy','thoughtful','worried','panic']){
 assert(fs.statSync(path.join(root,'assets/widget',`${mood}.png`)).size>1000,`${mood}: missing PNG`);
}
console.log('PASS: v1.1.15 shared widget PNG URI and no require() in isolated widget');
