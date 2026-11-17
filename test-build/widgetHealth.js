"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthNow = monthNow;
exports.calculateWidgetSnapshot = calculateWidgetSnapshot;
/** Moneo widget health, based on remaining real cash vs this month's recorded outflow. */
const finance_1 = require("./finance");
function monthNow(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function calculateWidgetSnapshot(book, period, showAmounts = true) {
    const { income, expense, saving } = (0, finance_1.periodSummary)(book, period);
    const balance = (0, finance_1.allBalances)(book);
    // Available funds = cash remaining + this month's recorded spending and old-style savings.
    // Transfers don't change total cash and virtual goals are not expenses.
    // Cash reconciliations / debt principal transactions are reflected in the remaining balance.
    const available = Math.max(0, balance) + Math.max(0, expense) + Math.max(0, saving);
    const ratio = available === 0 ? 0 : Math.max(0, Math.min(1, Math.max(0, balance) / available));
    const mood = available === 0 && balance >= 0 ? 'thoughtful'
        : ratio > 0.8 ? 'happy' : ratio > 0.5 ? 'thoughtful' : ratio >= 0.25 ? 'worried' : 'panic';
    const label = available === 0 && balance >= 0 ? 'Belum ada dana'
        : mood === 'happy' ? 'Aman' : mood === 'thoughtful' ? 'Waspada' : mood === 'worried' ? 'Hemat' : 'Kritis';
    const mask = (value) => showAmounts ? (0, finance_1.amountText)(value) : 'Rp ••••••';
    return {
        balanceText: mask(balance), incomeText: mask(income), expenseText: mask(expense),
        ratio, percent: Math.round(ratio * 100), mood, label, period,
        privateMode: !showAmounts, mascotUri: '',
    };
}
