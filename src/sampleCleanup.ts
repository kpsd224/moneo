import type {Book, Entry} from './finance';

/** Remove only recognisable factory sample rows, never a user's edited transaction. */
const SAMPLE_ROWS: Record<string, {day:string; kind:string; accountId:string; categoryId:string; amount:number; notes:string[]}> = {
  'demo-1':{day:'02',kind:'expense',accountId:'bni',categoryId:'rent',amount:1600000,notes:['Sewa rumah Januari','Sewa rumah bulan ini']},
  'demo-2':{day:'03',kind:'income',accountId:'cash',categoryId:'bonus',amount:300000,notes:['Bonus']},
  'demo-3':{day:'02',kind:'income',accountId:'bni',categoryId:'salary',amount:5300000,notes:['Gaji bulanan']}
};
export const SAMPLE_BUDGETS: Record<string,number> = {
  salary:5000000, bonus:200000, 'other-income':100000, rent:1600000,
  groceries:2500000, emergency:2000000, invest:1000000
};
function isSampleRow(entry: Entry): boolean {
  const e = SAMPLE_ROWS[entry.id];
  return !!e && /^\d{4}-(?:0[1-9]|1[0-2])-(?:02|03)$/.test(entry.date) &&
    entry.date.endsWith('-'+e.day) && entry.kind===e.kind &&
    entry.accountId===e.accountId && entry.categoryId===e.categoryId &&
    entry.amount===e.amount && e.notes.includes(entry.note);
}
export function removeOldSampleData(book: Book): {book:Book; changed:boolean; rows:number; targets:number} {
  const known = book.entries.filter(isSampleRow);
  const remaining = book.entries.filter(e=>!isSampleRow(e));
  const budgets={...book.budgets};
  let targets=0;
  const periods=new Set<string>(known.map(e=>e.date.slice(0,7)));
  periods.add('2025-01'); // the original workbook seed period
  const untouchedTemplates=new Set<string>();
  for(const key of Object.keys(budgets)){
    const m=/^(\d{4}-(?:0[1-9]|1[0-2]))\|(.+)$/.exec(key);
    if(m && Object.entries(SAMPLE_BUDGETS).every(([cat,amount])=>budgets[`${m[1]}|${cat}`]===amount)) untouchedTemplates.add(m[1]);
  }
  for(const key of Object.keys(budgets)) {
    const match=/^(\d{4}-(?:0[1-9]|1[0-2]))\|(.+)$/.exec(key);
    if(match && Object.prototype.hasOwnProperty.call(SAMPLE_BUDGETS,match[2])) {
      const p=match[1];
      const expected=SAMPLE_BUDGETS[match[2]];
      // If all seven factory targets still match, clear the untouched template.
      if(budgets[key]===expected && (periods.has(p) || untouchedTemplates.has(p))) {
        delete budgets[key];targets++;
      }
    }
  }
  const changed=known.length>0||targets>0;
  return {book:changed?{...book,entries:remaining,budgets}:book,changed,rows:known.length,targets};
}
