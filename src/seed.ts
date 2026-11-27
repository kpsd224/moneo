/** Fresh installs start with zero balances and no transactions or budget targets. */
import type { Book } from './finance';
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}
export function freshEmptyBook(): Book {
  return {
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
      { id: 'salary', label: 'Gaji', kind: 'income', icon: 'briefcase', color: '#26754C' },
      { id: 'bonus', label: 'Bonus', kind: 'income', icon: 'trending-up', color: '#5D976A' },
      { id: 'other-income', label: 'Pendapatan lain', kind: 'income', icon: 'trending-up', color: '#3A8156' },
      { id: 'rent', label: 'Sewa rumah', kind: 'expense', icon: 'home', color: '#B8326B' },
      { id: 'groceries', label: 'Belanja bulanan', kind: 'expense', icon: 'basket', color: '#D35C7C' },
      { id: 'transport', label: 'Transportasi', kind: 'expense', icon: 'car', color: '#C57463' },
      { id: 'food', label: 'Makan & minum', kind: 'expense', icon: 'restaurant', color: '#B94E6A' },
      { id: 'bills', label: 'Tagihan', kind: 'expense', icon: 'receipt', color: '#B66B82' },
      { id: 'other-expense', label: 'Lainnya', kind: 'expense', icon: 'grid', color: '#8F6172' },
      { id: 'emergency', label: 'Dana darurat', kind: 'saving', icon: 'shield-checkmark', color: '#548D59' },
      { id: 'invest', label: 'Investasi', kind: 'saving', icon: 'analytics', color: '#39764B' },
      { id: 'stocks', label: 'Saham', kind: 'saving', icon: 'trending-up', color: '#42876B' },
      { id: 'mutual-fund', label: 'Reksa dana', kind: 'saving', icon: 'analytics', color: '#B13A70' }
    ],
    budgets: {},
    dailyExpenseLimit: 0,
    entries: []
  };
}
