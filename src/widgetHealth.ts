/** Moneo widget health, based on remaining real cash vs this month's recorded outflow. */
import { Book, allBalances, periodSummary, amountText } from './finance';
export type WidgetMood = 'happy' | 'thoughtful' | 'worried' | 'panic';
export type WidgetSnapshot = {
  /** These are for legacy display mode; masked when showAmounts=false. */
  balanceText: string;
  /** Always carry the real strings so an interactive eye tap can restore them locally. */
  balanceFullText: string;
  incomeFullText: string;
  expenseFullText: string;
  incomeText: string;
  expenseText: string;
  ratio: number;
  percent: number;
  mood: WidgetMood;
  label: 'Aman' | 'Waspada' | 'Hemat' | 'Kritis' | 'Belum ada dana';
  period: string;
  privateMode: boolean;
  /** URI is assigned after bundled mascot image is copied into widgetsDirectory. */
  mascotUri: string;
  /** URI for the app logo in the iOS widget shared directory. */
  logoUri: string;
};
export function monthNow(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
export function calculateWidgetSnapshot(book: Book, period: string, showAmounts = true): WidgetSnapshot {
  const { income, expense, saving } = periodSummary(book, period);
  const balance = allBalances(book);
  // Available funds = cash remaining + this month's recorded spending and old-style savings.
  // Transfers don't change total cash and virtual goals are not expenses.
  // Cash reconciliations / debt principal transactions are reflected in the remaining balance.
  const available = Math.max(0, balance) + Math.max(0, expense) + Math.max(0, saving);
  const ratio = available === 0 ? 0 : Math.max(0, Math.min(1, Math.max(0, balance) / available));
  const mood: WidgetMood = available === 0 && balance >= 0 ? 'thoughtful'
    : ratio > 0.8 ? 'happy' : ratio > 0.5 ? 'thoughtful' : ratio >= 0.25 ? 'worried' : 'panic';
  const label: WidgetSnapshot['label'] = available === 0 && balance >= 0 ? 'Belum ada dana'
    : mood === 'happy' ? 'Aman' : mood === 'thoughtful' ? 'Waspada' : mood === 'worried' ? 'Hemat' : 'Kritis';
  const mask = (value: number) => showAmounts ? amountText(value) : 'Rp ••••••';
  return {
    balanceText: mask(balance), incomeText: mask(income), expenseText: mask(expense),
    balanceFullText: amountText(balance), incomeFullText: amountText(income), expenseFullText: amountText(expense),
    ratio, percent: Math.round(ratio * 100), mood, label, period,
    privateMode: !showAmounts, mascotUri: '', logoUri: '',
  };
}
