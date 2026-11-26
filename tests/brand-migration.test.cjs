const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'../../');
const app=JSON.parse(fs.readFileSync(path.join(base,'mobile/app.json'),'utf8')).expo;
const manifest=JSON.parse(fs.readFileSync(path.join(base,'site/manifest.webmanifest'),'utf8'));
assert.equal(app.name,'Moneo'); assert.equal(app.version,'1.1.22');
assert.equal(app.android.package,'com.anabudget.app'); // do not reset user data on Android update
assert.equal(app.ios.bundleIdentifier,'com.anabudget.app');
assert.equal(manifest.short_name,'Moneo');
const html=fs.readFileSync(path.join(base,'site/index.html'),'utf8');
assert(html.includes("localStorage.getItem('ana-budget-preview-v1')")); // keep old user data
assert(html.includes("app:'ana-budget'")); // old backup format still accepted
assert(!html.includes('Widget layar utama</h3>'));
assert(!html.includes('ANA Budget'));
const widget=fs.readFileSync(path.join(base,'mobile/src/publishWidget.ts'),'utf8');
assert(widget.includes('AnaFinanceWidget.updateSnapshot'));
for (const rel of ['site/assets/icon-192.png','site/assets/icon-512.png','mobile/assets/icon.png','mobile/assets/widget/happy.png']) assert(fs.statSync(path.join(base,rel)).size>8000);
console.log('PASS: Moneo identity, in-place migration, widget assets');
