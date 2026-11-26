'use strict';
const assert=require('node:assert/strict');
const {calculateWidgetSnapshot,monthNow}=require('../test-build/widgetHealth.js');
const {freshDemo}=require('./legacySampleFixture.cjs');
function base(remaining,spent){
 const book=freshDemo();
 book.accounts=[{id:'cash',label:'Cash',icon:'wallet',color:'#123456',openingBalance:remaining+spent}];
 book.entries=spent?[{id:'spent',date:'2026-11-01',kind:'expense',categoryId:'rent',accountId:'cash',amount:spent,note:''}]:[];
 return book;
}
function take(remaining,spent,visible=true){return calculateWidgetSnapshot(base(remaining,spent),'2026-11',visible)}
assert.equal(take(900,100).mood,'happy');
assert.equal(take(801,199).mood,'happy');
assert.equal(take(800,200).mood,'thoughtful'); // 80% must be warning
assert.equal(take(600,400).mood,'thoughtful');
assert.equal(take(501,499).mood,'thoughtful');
assert.equal(take(500,500).mood,'worried');
assert.equal(take(250,750).mood,'worried');
assert.equal(take(249,751).mood,'panic');
assert.equal(take(0,0).label,'Belum ada dana');
assert.equal(take(-100,0).mood,'panic');
assert.equal(take(250,750).percent,25);
assert.equal(take(3_400_000,1_600_000).balanceWidgetText,'Rp 3,4 jt');
assert.equal(take(3_400_000,1_600_000).expenseWidgetText,'Rp 1,6 jt');
assert.equal(take(250,750,false).balanceText,'Rp ••••••');
assert.equal(take(250,750,false).incomeText,'Rp ••••••');
assert.equal(take(250,750,false).expenseText,'Rp ••••••');
assert.equal(take(250,750).expenseText,'Rp 750');
assert.equal(monthNow(new Date(2026,10,17)), '2026-11');
// A transfer must not change the combined balance or mood.
const transferred=base(800,200);
transferred.accounts.push({id:'bank',label:'Bank',icon:'wallet',color:'#123456',openingBalance:0});
transferred.advanced={transfers:[{id:'t1',from:'cash',to:'bank',date:'2026-11-01',amount:400,note:''}],... (transferred.advanced || {})};
const prior=take(800,200);
assert.equal(calculateWidgetSnapshot(transferred,'2026-11').mood,prior.mood);
assert.equal(calculateWidgetSnapshot(transferred,'2026-11').balanceText,prior.balanceText);
console.log('Widget financial statuses, privacy, and transfers: OK');
