const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const app=fs.readFileSync(path.join(root,'mobile/App.tsx'),'utf8');
const web=fs.readFileSync(path.join(root,'site/index.html'),'utf8');
const android=fs.readFileSync(path.join(root,'mobile/widgets/AnaFinanceWidget.android.tsx'),'utf8');
const ios=fs.readFileSync(path.join(root,'mobile/widgets/AnaFinanceWidget.ios.tsx'),'utf8');
const publish=fs.readFileSync(path.join(root,'mobile/src/publishWidget.ts'),'utf8');
const match=web.match(/<footer class="tabbar"[\s\S]*?<\/footer>/);
assert(match);
assert.equal((match[0].match(/class="tab(?: active| tab-add-slot)?"/g)||[]).length,7,'Web nav has 7 controls');
assert(match[0].includes('data-tab="goals"'));
assert(web.includes('function goalsPage()'));
assert(web.includes('goals:goalsPage'));
assert(app.includes("type Tab = 'home' | 'budget' | 'activity' | 'insights' | 'advanced' | 'goals'"));
assert(app.includes('function GoalsScreen('));
assert(app.includes("setTab('goals')"));
assert(app.includes('Privasi nominal layar utama'));
assert(!/\brequire\s*\(/.test(android), 'widget runtime must not use require()');
assert(android.includes('source={{uri:props.mascotUri}}'));
assert(ios.includes('uiImage={props.mascotUri}'));
assert(publish.includes('destination.size'));
assert(publish.includes('Asset.fromModule(files[mood]).downloadAsync()'));
for (const n of ['happy','thoughtful','worried','panic']){
 const file=path.join(root,'mobile/assets/widget',`${n}.png`);
 assert(fs.statSync(file).size>10000);
}
console.log('PASS v1.1.16: 7 accesses, goals functionality, shared image URI, privacy toggle, all PNG present');
