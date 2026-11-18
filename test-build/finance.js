"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateInPeriod = exports.datePeriod = exports.budgetKey = exports.SHORT_MONTHS = exports.PERIOD_MONTHS = void 0;
exports.changePeriod = changePeriod;
exports.periodLabel = periodLabel;
exports.amountText = amountText;
exports.shortMoney = shortMoney;
exports.entriesForPeriod = entriesForPeriod;
exports.entriesForDate = entriesForDate;
exports.daySummary = daySummary;
exports.changeDay = changeDay;
exports.calendarDays = calendarDays;
exports.fullDateLabel = fullDateLabel;
exports.totalKind = totalKind;
exports.categoryActual = categoryActual;
exports.budgetTotal = budgetTotal;
exports.accountBalance = accountBalance;
exports.allBalances = allBalances;
exports.periodSummary = periodSummary;
exports.seriesByMonth = seriesByMonth;
exports.moneyFromInput = moneyFromInput;
exports.validLocalDate = validLocalDate;
exports.safeBook = safeBook;
/** Pure financial calculations. No UI and no mutation. */
const Advanced = require("./advanced");
exports.PERIOD_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
exports.SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const budgetKey = (period, categoryId) => `${period}|${categoryId}`;
exports.budgetKey = budgetKey;
const datePeriod = (date) => date.slice(0, 7);
exports.datePeriod = datePeriod;
const dateInPeriod = (date, period) => (0, exports.datePeriod)(date) === period;
exports.dateInPeriod = dateInPeriod;
function changePeriod(period, delta) {
    const [y, m] = period.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function periodLabel(period) {
    const [y, m] = period.split('-').map(Number);
    return `${exports.PERIOD_MONTHS[m - 1] || '?'} ${y}`;
}
function amountText(value, withCurrency = true) {
    const v = Math.round(Math.abs(Number.isFinite(value) ? value : 0));
    const parts = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${value < 0 ? '−' : ''}${withCurrency ? 'Rp' : ''}${withCurrency ? ' ' : ''}${parts}`;
}
function shortMoney(n) {
    const a = Math.abs(n);
    if (a >= 1e9)
        return `${(n / 1e9).toFixed(1).replace('.', ',')} M`;
    if (a >= 1e6)
        return `${(n / 1e6).toFixed(1).replace('.', ',')} jt`;
    if (a >= 1e3)
        return `${(n / 1e3).toFixed(0)} rb`;
    return amountText(n, false);
}
function entriesForPeriod(book, period) {
    return book.entries.filter(t => (0, exports.dateInPeriod)(t.date, period));
}
/** Local-date selectors used by the daily ledger; never convert a stored date to UTC. */
function entriesForDate(book, date) {
    return validLocalDate(date) ? book.entries.filter(t => t.date === date) : [];
}
function daySummary(book, date) {
    const entries = entriesForDate(book, date);
    const income = totalKind(entries, 'income');
    const expense = totalKind(entries, 'expense');
    const saving = totalKind(entries, 'saving');
    return { entries, income, expense, saving, net: income - expense - saving };
}
function changeDay(date, delta) {
    if (!validLocalDate(date) || !Number.isInteger(delta))
        return date;
    const [y, m, d] = date.split('-').map(Number);
    const next = new Date(y, m - 1, d + delta);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}
function calendarDays(period) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
        return [];
    const [y, m] = period.split('-').map(Number);
    const count = new Date(y, m, 0).getDate();
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Monday-first
    const days = Array(offset).fill(null);
    for (let day = 1; day <= count; day++)
        days.push(`${period}-${String(day).padStart(2, '0')}`);
    while (days.length % 7)
        days.push(null);
    return days;
}
function fullDateLabel(date) {
    if (!validLocalDate(date))
        return date;
    const [y, m, d] = date.split('-').map(Number);
    const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${weekdays[new Date(y, m - 1, d).getDay()]}, ${d} ${exports.PERIOD_MONTHS[m - 1]} ${y}`;
}
function totalKind(entries, kind) {
    return entries.reduce((sum, row) => sum + (row.kind === kind ? row.amount : 0), 0);
}
function categoryActual(entries, categoryId) {
    return entries.reduce((sum, row) => sum + (row.categoryId === categoryId ? row.amount : 0), 0);
}
function budgetTotal(book, period, kind) {
    return book.categories.filter(c => c.kind === kind).reduce((n, c) => n + (book.budgets[(0, exports.budgetKey)(period, c.id)] || 0), 0);
}
function accountBalance(book, accountId) {
    const account = book.accounts.find(a => a.id === accountId);
    return (account?.openingBalance || 0) + book.entries.reduce((sum, entry) => {
        if (entry.accountId !== accountId)
            return sum;
        return sum + (entry.kind === 'income' ? entry.amount : -entry.amount);
    }, 0) + Advanced.accountDelta(book, accountId);
}
function allBalances(book) {
    return book.accounts.reduce((sum, a) => sum + accountBalance(book, a.id), 0);
}
function periodSummary(book, period) {
    const entries = entriesForPeriod(book, period);
    const income = totalKind(entries, 'income');
    const expense = totalKind(entries, 'expense');
    const saving = totalKind(entries, 'saving');
    return { entries, income, expense, saving, net: income - expense - saving };
}
function seriesByMonth(book, endingPeriod, months = 6) {
    return Array.from({ length: months }, (_, i) => {
        const period = changePeriod(endingPeriod, i - months + 1);
        const { income, expense, saving } = periodSummary(book, period);
        return { period, month: exports.SHORT_MONTHS[Number(period.slice(5)) - 1], income, expense, saving };
    });
}
function moneyFromInput(text) {
    const digits = text.replace(/\D/g, '');
    if (digits.length > 14)
        return NaN;
    return digits ? Number(digits) : 0;
}
function validLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const [y, m, d] = value.split('-').map(Number);
    const check = new Date(y, m - 1, d);
    return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}
/** Defensive validation of persisted/backup data before it can change balances or UI. */
function safeBook(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const b = value;
    if (b.schemaVersion !== 1 || !Array.isArray(b.entries) || !Array.isArray(b.accounts) || !Array.isArray(b.categories) ||
        !b.budgets || typeof b.budgets !== 'object' || Array.isArray(b.budgets) ||
        b.entries.length > 50000 || b.accounts.length > 200 || b.categories.length > 1000 || Object.keys(b.budgets).length > 200000)
        return false;
    const validId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 90 && /^[a-zA-Z0-9_-]+$/.test(v);
    const validColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    const names = (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 100;
    const acctIds = new Set();
    for (const a of b.accounts) {
        if (!a || !validId(a.id) || acctIds.has(a.id) || !names(a.label) || !validColor(a.color) ||
            typeof a.icon !== 'string' || a.icon.length > 60 || !Number.isSafeInteger(a.openingBalance) || Math.abs(a.openingBalance) >= 1e15)
            return false;
        acctIds.add(a.id);
    }
    const catIds = new Set();
    const catKinds = new Map();
    for (const c of b.categories) {
        if (!c || !validId(c.id) || catIds.has(c.id) || !names(c.label) || !validColor(c.color) ||
            typeof c.icon !== 'string' || c.icon.length > 60 || !['income', 'expense', 'saving'].includes(c.kind))
            return false;
        catIds.add(c.id);
        catKinds.set(c.id, c.kind);
    }
    const entryIds = new Set();
    for (const e of b.entries) {
        if (!e || !validId(e.id) || entryIds.has(e.id) || !validLocalDate(e.date) ||
            !['income', 'expense', 'saving'].includes(e.kind) || !Number.isSafeInteger(e.amount) || e.amount <= 0 || e.amount >= 1e15 ||
            !acctIds.has(e.accountId) || catKinds.get(e.categoryId) !== e.kind || typeof e.note !== 'string' || e.note.length > 160)
            return false;
        entryIds.add(e.id);
    }
    for (const [key, target] of Object.entries(b.budgets)) {
        const matched = /^(\d{4}-(?:0[1-9]|1[0-2]))\|([a-zA-Z0-9_-]+)$/.exec(key);
        if (!matched || !catIds.has(matched[2]) || !Number.isSafeInteger(target) || target < 0 || target >= 1e15)
            return false;
    }
    return Advanced.validate(b);
}
