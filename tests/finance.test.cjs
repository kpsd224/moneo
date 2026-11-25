const assert = require('node:assert/strict');
const f = require('../test-build/finance.js');
const { DEMO_BOOK } = require('./legacySampleFixture.cjs');
const { freshEmptyBook } = require('../test-build/seed.js');
const p = '2025-01';
const s = f.periodSummary(DEMO_BOOK, p);
assert.equal(s.income, 5600000);
assert.equal(s.expense, 1600000);
assert.equal(s.saving, 0);
assert.equal(s.net, 4000000);
assert.equal(f.budgetTotal(DEMO_BOOK,p,'income'),5300000);
assert.equal(f.budgetTotal(DEMO_BOOK,p,'expense'),4100000);
assert.equal(f.budgetTotal(DEMO_BOOK,p,'saving'),3000000);
assert.equal(f.accountBalance(DEMO_BOOK,'bni'),3700000);
assert.equal(f.accountBalance(DEMO_BOOK,'cash'),300000);
assert.equal(f.allBalances(DEMO_BOOK),4000000);
assert.equal(f.changePeriod('2025-12',1),'2026-01');
assert.equal(f.changePeriod('2025-01',-1),'2024-12');
assert.equal(f.validLocalDate('2025-02-29'),false);
assert.equal(f.validLocalDate('2024-02-29'),true);
assert.equal(f.moneyFromInput('Rp 1.600.000'),1600000);
assert.equal(f.moneyFromInput('99999999999999999').toString(),'NaN');
assert.equal(f.shortMoney(2300000),'2,3 jt');
assert.ok(f.safeBook(DEMO_BOOK));
const withSaving={...DEMO_BOOK,entries:[...DEMO_BOOK.entries,{id:'save-test',date:'2025-01-12',kind:'saving',categoryId:'emergency',accountId:'bni',amount:100000,note:'Dana darurat'}]};
assert.equal(f.periodSummary(withSaving,p).saving,100000);
assert.equal(f.accountBalance(withSaving,'bni'),3600000);
assert.equal(f.allBalances(withSaving),3900000);
assert.equal(f.seriesByMonth(DEMO_BOOK,p,6).length,6);
assert.equal(f.entriesForDate(DEMO_BOOK,'2025-01-02').length,2);
assert.equal(f.daySummary(DEMO_BOOK,'2025-01-02').income,5300000);
assert.equal(f.daySummary(DEMO_BOOK,'2025-01-02').expense,1600000);
assert.equal(f.daySummary(DEMO_BOOK,'2025-01-02').net,3700000);
assert.equal(f.daySummary(DEMO_BOOK,'2025-01-04').entries.length,0);
assert.equal(f.changeDay('2024-02-28',1),'2024-02-29');
assert.equal(f.changeDay('2024-02-29',1),'2024-03-01');
assert.equal(f.changeDay('2025-01-01',-1),'2024-12-31');
assert.equal(f.calendarDays('2025-01').filter(Boolean).length,31);
assert.equal(f.calendarDays('2024-02').filter(Boolean).length,29);
assert.equal(f.calendarDays('2025-01')[2],'2025-01-01');
assert.equal(f.fullDateLabel('2025-01-02'),'Kamis, 2 Januari 2025');
console.log('PASS: 33 budgeting, accounting, date and validation assertions');
const duplicateId = structuredClone(DEMO_BOOK); duplicateId.entries.push({...duplicateId.entries[0]});
assert.equal(f.safeBook(duplicateId),false,'Duplicate entry IDs must be rejected');
const brokenRef = structuredClone(DEMO_BOOK); brokenRef.entries[0].accountId = 'unknown';
assert.equal(f.safeBook(brokenRef),false,'Orphaned account link must be rejected');
const badBudget = structuredClone(DEMO_BOOK); badBudget.budgets['2025-01|rent']=-1;
assert.equal(f.safeBook(badBudget),false,'Negative budget rejected');
const badCategory = structuredClone(DEMO_BOOK); badCategory.categories[0].color='url(javascript:alert(1))';
assert.equal(f.safeBook(badCategory),false,'Unsafe style values rejected');

const frequent = freshEmptyBook();
frequent.entries = [
  {id:'e1',date:'2026-11-01',kind:'expense',categoryId:'food',accountId:'cash',amount:10000,note:''},
  {id:'e2',date:'2026-11-02',kind:'expense',categoryId:'food',accountId:'cash',amount:12000,note:''},
  {id:'e3',date:'2026-11-03',kind:'expense',categoryId:'food',accountId:'bni',amount:15000,note:''},
  {id:'e4',date:'2026-11-04',kind:'income',categoryId:'salary',accountId:'jago',amount:50000,note:''}
];
assert.equal(f.rankAccountsForKind(frequent,'expense')[0].id,'cash','Most-used expense wallet comes first');
assert.equal(f.rankAccountsForKind(frequent,'income')[0].id,'jago','Income has its own wallet ranking');
assert.equal(f.rankAccountsForKind(freshEmptyBook(),'expense')[0].id,'bni','Original order remains before any transactions');
const tied = {...frequent,entries:frequent.entries.slice(1,4)};
assert.equal(f.rankAccountsForKind(tied,'expense')[0].id,'bni','Recent use breaks equal-frequency ties');
assert.equal(frequent.accounts[0].id,'bni','Ranking does not mutate saved wallet order');

const limited = {...frequent,dailyExpenseLimit:100000,entries:[
  {id:'spent',date:'2026-11-25',kind:'expense',categoryId:'food',accountId:'cash',amount:40000,note:''},
  {id:'edit',date:'2026-11-25',kind:'expense',categoryId:'food',accountId:'bni',amount:30000,note:''},
  {id:'other-day',date:'2026-11-24',kind:'expense',categoryId:'food',accountId:'bni',amount:90000,note:''}
]};
assert.equal(f.dailyExpenseStatus(limited,'2026-11-25',50000,'edit').projected,90000,'Editing excludes the old amount');
assert.equal(f.dailyExpenseStatus(limited,'2026-11-25',50000,'edit').level,'near');
assert.equal(f.dailyExpenseStatus(limited,'2026-11-25',60000,'edit').level,'at');
assert.equal(f.dailyExpenseStatus(limited,'2026-11-25',70000,'edit').level,'over');
assert.equal(f.dailyExpenseStatus(limited,'2026-11-25',0).spent,70000);
const withOtherKinds = {...limited,entries:[...limited.entries,
  {id:'income-today',date:'2026-11-25',kind:'income',categoryId:'salary',accountId:'cash',amount:250000,note:''},
  {id:'saving-today',date:'2026-11-25',kind:'saving',categoryId:'emergency',accountId:'cash',amount:80000,note:''}
]};
assert.equal(f.dailyExpenseStatus(withOtherKinds,'2026-11-25',0).spent,70000,'Only expenses use the daily limit');
assert.equal(f.dailyExpenseStatus({...limited,dailyExpenseLimit:0},'2026-11-25',50000),null);
assert.equal(f.safeBook(limited),true,'Daily limit survives persistence');
assert.equal(f.safeBook({...limited,dailyExpenseLimit:-1}),false,'Negative daily limit is rejected');
assert.equal(f.safeBook({...limited,dailyExpenseLimit:1.5}),false,'Fractional daily limit is rejected');
