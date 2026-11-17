import { Book } from './finance';
/** Reference workbook: Budgeting Ana VBA Apps.xlsb, sheets DASHBOARD, BUDGET PLANING, TRACKING.
 * Data is a sample snapshot from January 2025, not a live Excel/VBA connection.
 * 2025-01 income plan: Salary 5m, Bonus 200k, Other Income 100k.
 * Expenses plan: House Rent 1.6m, Groceries 2.5m.
 * Savings plan: Emergency Fund 2m, Invest 1m.
 */
export const DEMO_PERIOD = '2025-01';
export const DEMO_BOOK: Book = {
  schemaVersion: 1,
  accounts: [
    { id: 'bni', label: 'BNI', icon: 'card', color: '#5E62EF', openingBalance: 0 },
    { id: 'cash', label: 'Tunai', icon: 'wallet', color: '#2EB1A2', openingBalance: 0 },
    { id: 'bri', label: 'BRI', icon: 'card', color: '#2990EF', openingBalance: 0 },
    { id: 'jago', label: 'Jago', icon: 'card', color: '#F3A546', openingBalance: 0 },
    { id: 'dana', label: 'DANA', icon: 'phone', color: '#248FD4', openingBalance: 0 },
    { id: 'gopay', label: 'GoPay', icon: 'phone', color: '#2AA5C7', openingBalance: 0 },
    { id: 'ovo', label: 'OVO', icon: 'phone', color: '#A57BCE', openingBalance: 0 },
    { id: 'shopeepay', label: 'ShopeePay', icon: 'phone', color: '#ED8253', openingBalance: 0 },
    { id: 'other-account', label: 'Lainnya', icon: 'wallet', color: '#ED6A8A', openingBalance: 0 }
  ],
  categories: [
    { id: 'salary', label: 'Gaji', kind: 'income', icon: 'briefcase', color: '#49B49D' },
    { id: 'bonus', label: 'Bonus', kind: 'income', icon: 'sparkles', color: '#74C8AA' },
    { id: 'other-income', label: 'Pendapatan lain', kind: 'income', icon: 'trending-up', color: '#6198EA' },
    { id: 'rent', label: 'Sewa rumah', kind: 'expense', icon: 'home', color: '#7966E8' },
    { id: 'groceries', label: 'Belanja bulanan', kind: 'expense', icon: 'basket', color: '#F6A36C' },
    { id: 'transport', label: 'Transportasi', kind: 'expense', icon: 'car', color: '#5F9CE6' },
    { id: 'food', label: 'Makan & minum', kind: 'expense', icon: 'restaurant', color: '#E87D91' },
    { id: 'bills', label: 'Tagihan', kind: 'expense', icon: 'receipt', color: '#48B7C0' },
    { id: 'other-expense', label: 'Lainnya', kind: 'expense', icon: 'grid', color: '#9BA2B9' },
    { id: 'emergency', label: 'Dana darurat', kind: 'saving', icon: 'shield-checkmark', color: '#A5BE46' },
    { id: 'invest', label: 'Investasi', kind: 'saving', icon: 'analytics', color: '#8C82ED' }
  ],
  budgets: {
    '2025-01|salary': 5000000,
    '2025-01|bonus': 200000,
    '2025-01|other-income': 100000,
    '2025-01|rent': 1600000,
    '2025-01|groceries': 2500000,
    '2025-01|emergency': 2000000,
    '2025-01|invest': 1000000
  },
  entries: [
    { id: 'demo-1', date: '2025-01-02', kind: 'expense', accountId: 'bni', categoryId: 'rent', amount: 1600000, note: 'Sewa rumah Januari' },
    { id: 'demo-2', date: '2025-01-03', kind: 'income', accountId: 'cash', categoryId: 'bonus', amount: 300000, note: 'Bonus' },
    { id: 'demo-3', date: '2025-01-02', kind: 'income', accountId: 'bni', categoryId: 'salary', amount: 5300000, note: 'Gaji bulanan' }
  ]
};
export function freshDemo(): Book { return JSON.parse(JSON.stringify(DEMO_BOOK)) as Book; }
