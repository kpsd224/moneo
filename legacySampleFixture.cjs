/** TEST-ONLY historical sample fixture, never loaded by the Moneo app. */
const {freshEmptyBook}=require('../test-build/seed.js');
const DEMO_BOOK=freshEmptyBook();
DEMO_BOOK.entries=[
 {id:'demo-1',date:'2025-01-02',kind:'expense',accountId:'bni',categoryId:'rent',amount:1600000,note:'Sewa rumah Januari'},
 {id:'demo-2',date:'2025-01-03',kind:'income',accountId:'cash',categoryId:'bonus',amount:300000,note:'Bonus'},
 {id:'demo-3',date:'2025-01-02',kind:'income',accountId:'bni',categoryId:'salary',amount:5300000,note:'Gaji bulanan'}
];
DEMO_BOOK.budgets={
 '2025-01|salary':5000000,'2025-01|bonus':200000,'2025-01|other-income':100000,
 '2025-01|rent':1600000,'2025-01|groceries':2500000,
 '2025-01|emergency':2000000,'2025-01|invest':1000000
};
module.exports={DEMO_BOOK,freshDemo:()=>structuredClone(DEMO_BOOK)};
