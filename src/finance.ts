/** Pure financial calculations. No UI and no mutation. */
import * as Advanced from './advanced';
export type Kind = 'income' | 'expense' | 'saving';
export type Period = `${number}-${string}`;

export interface Category {
  id: string;
  label: string;
  kind: Kind;
  icon: string;
  color: string;
}
export interface Account {
  id: string;
  label: string;
  icon: string;
  color: string;
  openingBalance: number;
}
export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD in local calendar; never UTC shifted
  kind: Kind;
  categoryId: string;
  accountId: string;
  amount: number; // integer Rupiah
  note: string;
}
export interface Book {
  schemaVersion: 1;
  entries: Entry[];
  accounts: Account[];
  categories: Category[];
  budgets: Record<string, number>; // YYYY-MM|categoryId => Rupiah
  dailyExpenseLimit?: number; // 0 or missing disables the daily warning
  advanced?: any; // Offline extensions; missing for legacy v1 backups
}

export const PERIOD_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const budgetKey = (period: string, categoryId: string): string => `${period}|${categoryId}`;
export const datePeriod = (date: string): string => date.slice(0, 7);
export const dateInPeriod = (date: string, period: string): boolean => datePeriod(date) === period;

export function changePeriod(period: string, delta: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${PERIOD_MONTHS[m - 1] || '?'} ${y}`;
}
export function amountText(value: number, withCurrency = true): string {
  const v = Math.round(Math.abs(Number.isFinite(value) ? value : 0));
  const parts = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '−' : ''}${withCurrency ? 'Rp' : ''}${withCurrency ? ' ' : ''}${parts}`;
}
export function shortMoney(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')} M`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} jt`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(0)} rb`;
  return amountText(n, false);
}
export function entriesForPeriod(book: Book, period: string): Entry[] {
  return book.entries.filter(t => dateInPeriod(t.date, period));
}
export function rankAccountsForKind(book: Book, kind: Kind): Account[] {
  const usage = new Map<string, {count: number; lastDate: string; lastIndex: number}>();
  book.entries.forEach((entry, index) => {
    if (entry.kind !== kind) return;
    const previous = usage.get(entry.accountId);
    const newer = !previous || entry.date > previous.lastDate;
    usage.set(entry.accountId, {
      count: (previous?.count || 0) + 1,
      lastDate: newer ? entry.date : previous.lastDate,
      lastIndex: newer ? index : entry.date === previous.lastDate ? Math.min(previous.lastIndex, index) : previous.lastIndex,
    });
  });
  return book.accounts.map((account, index) => ({account, index})).sort((left, right) => {
    const a = usage.get(left.account.id);
    const b = usage.get(right.account.id);
    return (b?.count || 0) - (a?.count || 0)
      || (b?.lastDate || '').localeCompare(a?.lastDate || '')
      || (a?.lastIndex ?? book.entries.length) - (b?.lastIndex ?? book.entries.length)
      || left.index - right.index;
  }).map(item => item.account);
}
export function dailyExpenseStatus(book: Book, date: string, amount = 0, editId?: string): {
  limit: number; spent: number; projected: number; remaining: number; level: 'ok' | 'near' | 'at' | 'over'
} | null {
  const limit = book.dailyExpenseLimit || 0;
  if (!limit || !validLocalDate(date) || !Number.isSafeInteger(amount) || amount < 0) return null;
  const spent = book.entries.reduce((sum, entry) => sum + (entry.kind === 'expense' && entry.date === date && entry.id !== editId ? entry.amount : 0), 0);
  const projected = spent + amount;
  const level = projected > limit ? 'over' : projected === limit ? 'at' : projected / limit >= 0.8 ? 'near' : 'ok';
  return {limit, spent, projected, remaining: Math.max(0, limit - projected), level};
}
/** Local-date selectors used by the daily ledger; never convert a stored date to UTC. */
export function entriesForDate(book: Book, date: string): Entry[] {
  return validLocalDate(date) ? book.entries.filter(t => t.date === date) : [];
}
export function daySummary(book: Book, date: string) {
  const entries = entriesForDate(book, date);
  const income = totalKind(entries, 'income');
  const expense = totalKind(entries, 'expense');
  const saving = totalKind(entries, 'saving');
  return { entries, income, expense, saving, net: income - expense - saving };
}
export function changeDay(date: string, delta: number): string {
  if (!validLocalDate(date) || !Number.isInteger(delta)) return date;
  const [y,m,d] = date.split('-').map(Number);
  const next = new Date(y,m-1,d+delta);
  return `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
}
export function calendarDays(period: string): (string | null)[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return [];
  const [y,m] = period.split('-').map(Number);
  const count = new Date(y,m,0).getDate();
  const offset = (new Date(y,m-1,1).getDay()+6)%7; // Monday-first
  const days: (string|null)[] = Array(offset).fill(null);
  for (let day=1;day<=count;day++) days.push(`${period}-${String(day).padStart(2,'0')}`);
  while (days.length % 7) days.push(null);
  return days;
}
export function fullDateLabel(date: string): string {
  if (!validLocalDate(date)) return date;
  const [y,m,d] = date.split('-').map(Number);
  const weekdays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return `${weekdays[new Date(y,m-1,d).getDay()]}, ${d} ${PERIOD_MONTHS[m-1]} ${y}`;
}
export function totalKind(entries: Entry[], kind: Kind): number {
  return entries.reduce((sum, row) => sum + (row.kind === kind ? row.amount : 0), 0);
}
export function categoryActual(entries: Entry[], categoryId: string): number {
  return entries.reduce((sum, row) => sum + (row.categoryId === categoryId ? row.amount : 0), 0);
}
export function budgetTotal(book: Book, period: string, kind: Kind): number {
  return book.categories.filter(c => c.kind === kind).reduce((n, c) => n + (book.budgets[budgetKey(period, c.id)] || 0), 0);
}
export function accountBalance(book: Book, accountId: string): number {
  const account = book.accounts.find(a => a.id === accountId);
  return (account?.openingBalance || 0) + book.entries.reduce((sum, entry) => {
    if (entry.accountId !== accountId) return sum;
    return sum + (entry.kind === 'income' ? entry.amount : -entry.amount);
  }, 0) + Advanced.accountDelta(book, accountId);
}
export function allBalances(book: Book): number {
  return book.accounts.reduce((sum, a) => sum + accountBalance(book, a.id), 0);
}
export function periodSummary(book: Book, period: string) {
  const entries = entriesForPeriod(book, period);
  const income = totalKind(entries, 'income');
  const expense = totalKind(entries, 'expense');
  const saving = totalKind(entries, 'saving');
  return { entries, income, expense, saving, net: income - expense - saving };
}
export function seriesByMonth(book: Book, endingPeriod: string, months = 6) {
  return Array.from({ length: months }, (_, i) => {
    const period = changePeriod(endingPeriod, i - months + 1);
    const { income, expense, saving } = periodSummary(book, period);
    return { period, month: SHORT_MONTHS[Number(period.slice(5)) - 1], income, expense, saving };
  });
}
export function moneyFromInput(text: string): number {
  const digits = text.replace(/\D/g, '');
  if (digits.length > 14) return NaN;
  return digits ? Number(digits) : 0;
}
export function validLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const check = new Date(y, m - 1, d);
  return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}
export function dateForNativePicker(value: string, fallback = new Date()): Date {
  const [year, month, day] = (validLocalDate(value) ? value : localDateFromPicker(fallback)).split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
export function localDateFromPicker(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
/** Defensive validation of persisted/backup data before it can change balances or UI. */
export function safeBook(value: unknown): value is Book {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const b = value as Partial<Book>;
  if (b.schemaVersion !== 1 || !Array.isArray(b.entries) || !Array.isArray(b.accounts) || !Array.isArray(b.categories) ||
      !b.budgets || typeof b.budgets !== 'object' || Array.isArray(b.budgets) ||
      b.entries.length > 50000 || b.accounts.length > 200 || b.categories.length > 1000 || Object.keys(b.budgets).length > 200000) return false;
  if (b.dailyExpenseLimit !== undefined && (!Number.isSafeInteger(b.dailyExpenseLimit) || b.dailyExpenseLimit < 0 || b.dailyExpenseLimit >= 1e15)) return false;
  const validId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 90 && /^[a-zA-Z0-9_-]+$/.test(v);
  const validColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
  const names = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 100;
  const acctIds = new Set<string>();
  for (const a of b.accounts) {
    if (!a || !validId(a.id) || acctIds.has(a.id) || !names(a.label) || !validColor(a.color) ||
        typeof a.icon !== 'string' || a.icon.length > 60 || !Number.isSafeInteger(a.openingBalance) || Math.abs(a.openingBalance) >= 1e15) return false;
    acctIds.add(a.id);
  }
  const catIds = new Set<string>();
  const catKinds = new Map<string, Kind>();
  for (const c of b.categories) {
    if (!c || !validId(c.id) || catIds.has(c.id) || !names(c.label) || !validColor(c.color) ||
        typeof c.icon !== 'string' || c.icon.length > 60 || !['income', 'expense', 'saving'].includes(c.kind)) return false;
    catIds.add(c.id); catKinds.set(c.id, c.kind);
  }
  const entryIds = new Set<string>();
  for (const e of b.entries) {
    if (!e || !validId(e.id) || entryIds.has(e.id) || !validLocalDate(e.date) ||
        !['income', 'expense', 'saving'].includes(e.kind) || !Number.isSafeInteger(e.amount) || e.amount <= 0 || e.amount >= 1e15 ||
        !acctIds.has(e.accountId) || catKinds.get(e.categoryId) !== e.kind || typeof e.note !== 'string' || e.note.length > 160) return false;
    entryIds.add(e.id);
  }
  for (const [key, target] of Object.entries(b.budgets)) {
    const matched = /^(\d{4}-(?:0[1-9]|1[0-2]))\|([a-zA-Z0-9_-]+)$/.exec(key);
    if (!matched || !catIds.has(matched[2]) || !Number.isSafeInteger(target) || target < 0 || target >= 1e15) return false;
  }
  return Advanced.validate(b);
}
