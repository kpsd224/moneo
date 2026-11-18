const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '..');
const {calculateWidgetSnapshot} = require('../test-build/widgetHealth.js');
const {freshDemo} = require('./legacySampleFixture.cjs');
const original = calculateWidgetSnapshot(freshDemo(), '2025-01', true);
const hidden = calculateWidgetSnapshot(freshDemo(), '2025-01', false);
assert.equal(original.privateMode, false);
assert.equal(hidden.privateMode, true);
assert.equal(hidden.balanceText, 'Rp ••••••');
for (const name of ['balance','income','expense']) {
  const field = name==='balance' ? 'balanceFullText' : `${name}FullText`;
  assert.equal(original[field], hidden[field]);
  assert(hidden[field].startsWith('Rp '));
}
const toggled = {...hidden, privateMode: !hidden.privateMode};
assert.equal(toggled.privateMode, false);
assert.equal(toggled.balanceFullText, original.balanceFullText);
for (const fn of ['AnaFinanceWidget.android.tsx','AnaFinanceWidget.ios.tsx']) {
  const src = fs.readFileSync(path.join(dir,'widgets',fn),'utf8');
  assert(src.includes('privateMode: !hidden'), `${fn}: cannot toggle`);
  assert(src.includes('balanceFullText'), `${fn}: cannot reveal original balance`);
  assert(src.includes('incomeFullText'), `${fn}: cannot reveal income`);
  assert(src.includes('expenseFullText'), `${fn}: cannot reveal expense`);
  assert(src.includes('Saldo Total') && src.includes('mascotUri'));
  assert(src.includes('Rp ••••••'));
}
const android = fs.readFileSync(path.join(dir,'widgets/AnaFinanceWidget.android.tsx'),'utf8');
assert(android.includes('onClick='));
const ios = fs.readFileSync(path.join(dir,'widgets/AnaFinanceWidget.ios.tsx'),'utf8');
assert(ios.includes("systemImage={hidden ? 'eye.slash.fill' : 'eye.fill'}"));
assert(ios.includes('target="moneo-toggle-amounts"'));
const app = fs.readFileSync(path.join(dir,'App.tsx'),'utf8');
assert(app.includes('addUserInteractionListener'));
assert(app.includes('setWidgetAmountsVisible(value => !value)'));
assert(app.includes("const STORAGE = '@ana-budget/v1'"));
const json = require('../app.json');
assert.equal(json.expo.version,'1.1.15');
assert.equal(json.expo.android.versionCode,15);
console.log('PASS v1.1.15 eye: app/widget privacy toggling, real values preserved, storage preserved');
