"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMPLE_BUDGETS = void 0;
exports.removeOldSampleData = removeOldSampleData;
/** Remove only recognisable factory sample rows, never a user's edited transaction. */
const SAMPLE_ROWS = {
    'demo-1': { day: '02', kind: 'expense', accountId: 'bni', categoryId: 'rent', amount: 1600000, notes: ['Sewa rumah Januari', 'Sewa rumah bulan ini'] },
    'demo-2': { day: '03', kind: 'income', accountId: 'cash', categoryId: 'bonus', amount: 300000, notes: ['Bonus'] },
    'demo-3': { day: '02', kind: 'income', accountId: 'bni', categoryId: 'salary', amount: 5300000, notes: ['Gaji bulanan'] }
};
exports.SAMPLE_BUDGETS = {
    salary: 5000000, bonus: 200000, 'other-income': 100000, rent: 1600000,
    groceries: 2500000, emergency: 2000000, invest: 1000000
};
function isSampleRow(entry) {
    const e = SAMPLE_ROWS[entry.id];
    return !!e && /^\d{4}-(?:0[1-9]|1[0-2])-(?:02|03)$/.test(entry.date) &&
        entry.date.endsWith('-' + e.day) && entry.kind === e.kind &&
        entry.accountId === e.accountId && entry.categoryId === e.categoryId &&
        entry.amount === e.amount && e.notes.includes(entry.note);
}
function removeOldSampleData(book) {
    const known = book.entries.filter(isSampleRow);
    const remaining = book.entries.filter(e => !isSampleRow(e));
    const budgets = { ...book.budgets };
    let targets = 0;
    const periods = new Set(known.map(e => e.date.slice(0, 7)));
    periods.add('2025-01'); // the original workbook seed period
    const untouchedTemplates = new Set();
    for (const key of Object.keys(budgets)) {
        const m = /^(\d{4}-(?:0[1-9]|1[0-2]))\|(.+)$/.exec(key);
        if (m && Object.entries(exports.SAMPLE_BUDGETS).every(([cat, amount]) => budgets[`${m[1]}|${cat}`] === amount))
            untouchedTemplates.add(m[1]);
    }
    for (const key of Object.keys(budgets)) {
        const match = /^(\d{4}-(?:0[1-9]|1[0-2]))\|(.+)$/.exec(key);
        if (match && Object.prototype.hasOwnProperty.call(exports.SAMPLE_BUDGETS, match[2])) {
            const p = match[1];
            const expected = exports.SAMPLE_BUDGETS[match[2]];
            // If all seven factory targets still match, clear the untouched template.
            if (budgets[key] === expected && (periods.has(p) || untouchedTemplates.has(p))) {
                delete budgets[key];
                targets++;
            }
        }
    }
    const changed = known.length > 0 || targets > 0;
    return { book: changed ? { ...book, entries: remaining, budgets } : book, changed, rows: known.length, targets };
}
