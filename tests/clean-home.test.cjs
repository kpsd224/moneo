const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
for(const name of ['site/index.html','mobile/preview/index.html']){
 const html=fs.readFileSync(path.resolve(__dirname,'../../',name),'utf8');
 assert(!html.includes('✦ Keuangan+ · Transfer, Target, Rutin, Utang'),'Home promo must not be present in '+name);
 assert(html.includes('home:home,'),'Home must show its contents directly in '+name);
 assert(!html.includes('✦ Buka fitur Keuangan+'),'Duplicate finance button must not appear in Settings: '+name);
 assert(html.includes('data-tab="advanced"'),'Finance navigation retained in '+name);
 assert(html.includes('© 2026 Na'),'Copyright retained in '+name);
}
const native=fs.readFileSync(path.resolve(__dirname,'../App.tsx'),'utf8');
assert(!native.includes('Buka fitur Keuangan dari Pengaturan'),'Duplicate finance shortcut removed in native Settings');
assert(native.includes("{ tab: 'advanced', icon: 'wallet', title: 'Keuangan' }"),"Native Finance tab remains available");
console.log('PASS: no finance promo on home, finance stays accessible from navigation, copyright stays');
