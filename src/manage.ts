import { Account, Book, Category, Kind } from './finance';
import * as Adv from './advanced';

/** All actions use stable IDs. Rename never changes transaction foreign keys. */
export const cleanName = (value: string): string => value.trim().replace(/\s+/g, ' ').slice(0, 44);
export const createId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export function nameAvailable(items: {id: string; label: string}[], name: string, exceptId?: string): boolean {
  const v = cleanName(name).toLocaleLowerCase('id-ID');
  return !!v && !items.some(item => item.id !== exceptId && item.label.toLocaleLowerCase('id-ID') === v);
}
export function normalizeLegacyBook(book: Book): Book {
  // Upgrade already-persisted v1 data without resetting user's transactions or budgets.
  const legacy = book.accounts.find(a => a.id === 'paylater');
  const mislabeled = book.accounts.some(a => a.label.toLocaleLowerCase('id-ID') === 'paylater');
  if (!legacy && !mislabeled) return book;
  const occupied = book.accounts.some(a => a.id === 'other-account');
  const replacement = occupied ? 'other-legacy-account' : 'other-account';
  const accounts = book.accounts.map(a => a.id === 'paylater'
    ? {...a, id: replacement, label: occupied ? 'Lainnya (lama)' : 'Lainnya', icon: 'wallet'}
    : a.label.toLocaleLowerCase('id-ID') === 'paylater' ? {...a,label:'Lainnya',icon:'wallet'} : a);
  return {...book, accounts, entries: book.entries.map(e => e.accountId === 'paylater' ? {...e, accountId: replacement} : e)};
}
export function saveAccount(book: Book, fields: {id?: string; label: string; openingBalance: number; icon?: string; color?: string}): Book {
  const label = cleanName(fields.label);
  if (!nameAvailable(book.accounts, label, fields.id)) throw new Error('Nama dompet harus diisi dan tidak boleh sama.');
  if (!Number.isSafeInteger(fields.openingBalance) || Math.abs(fields.openingBalance) >= 1e15) throw new Error('Saldo awal tidak valid.');
  if (fields.icon && !/^[a-z0-9-]{1,60}$/.test(fields.icon)) throw new Error('Ikon dompet tidak valid.');
  if (fields.color && !/^#[0-9a-fA-F]{6}$/.test(fields.color)) throw new Error('Warna dompet tidak valid.');
  if (fields.id) {
    if (!book.accounts.some(a => a.id === fields.id)) throw new Error('Dompet tidak ditemukan.');
    return {...book, accounts: book.accounts.map(a => a.id === fields.id ? {...a, label, openingBalance: fields.openingBalance, icon: fields.icon || a.icon, color: fields.color || a.color} : a)};
  }
  const colors = ['#7063E8', '#24A99A', '#E4A04C', '#4599DE', '#EA7D9B'];
  const account: Account = {id: createId('account'), label, openingBalance: fields.openingBalance, icon:fields.icon || 'wallet', color:fields.color || colors[book.accounts.length % colors.length]};
  return {...book, accounts: [...book.accounts, account]};
}
export function deleteAccount(book: Book, id: string): Book {
  const ext = Adv.state(book);
  if (ext.transfers.some((t:any)=>t.from===id||t.to===id)||ext.allocations.some((x:any)=>x.accountId===id)||ext.recurring.some((x:any)=>x.accountId===id)||ext.scheduledPayments.some((x:any)=>x.accountId===id)||ext.savingsWithdrawals.some((x:any)=>x.accountId===id)||ext.debts.some((x:any)=>x.accountId===id)||ext.payments.some((x:any)=>x.accountId===id)||ext.adjustments.some((x:any)=>x.accountId===id)) throw new Error('Dompet masih digunakan pada fitur Keuangan+. Hapus atau pindahkan data terkait terlebih dahulu.');
  if (book.entries.some(e => e.accountId === id)) throw new Error('Dompet masih memiliki transaksi. Pindahkan atau hapus transaksi tersebut terlebih dahulu agar riwayat dan saldo tetap akurat.');
  if (!book.accounts.some(a => a.id === id)) throw new Error('Dompet tidak ditemukan.');
  return {...book, accounts: book.accounts.filter(a => a.id !== id)};
}
export function saveCategory(book: Book, fields: {id?: string; label: string; kind: Kind; icon?: string}): Book {
  const label = cleanName(fields.label);
  const ofKind = book.categories.filter(c => c.kind === fields.kind);
  if (!nameAvailable(ofKind, label, fields.id)) throw new Error('Nama kategori harus diisi dan tidak boleh sama pada jenis ini.');
  if (fields.id) {
    if (!book.categories.some(c => c.id === fields.id && c.kind === fields.kind)) throw new Error('Kategori tidak ditemukan.');
    return {...book, categories: book.categories.map(c => c.id === fields.id ? {...c, label, icon: fields.icon || c.icon} : c)};
  }
  const theme: Record<Kind, {icon: string; color: string}> = {expense:{icon:'grid',color:'#E48B81'},income:{icon:'trending-up',color:'#32AF98'},saving:{icon:'savings',color:'#8D80E6'}};
  const category: Category = {id:createId('category'), label, kind: fields.kind, ...theme[fields.kind], icon: fields.icon || theme[fields.kind].icon};
  return {...book, categories:[...book.categories, category]};
}
export function deleteCategory(book: Book, id: string): Book {
  const ext=Adv.state(book);
  if (ext.recurring.some((r:any)=>r.categoryId===id)||ext.scheduledPayments.some((r:any)=>r.categoryId===id)||ext.savingsWithdrawals.some((r:any)=>r.categoryId===id)) throw new Error('Kategori masih digunakan jadwal atau pencairan tabungan.');
  if (book.entries.some(e => e.categoryId === id)) throw new Error('Kategori masih dipakai transaksi. Pindahkan atau hapus transaksi tersebut sebelum menghapus kategori.');
  if (!book.categories.some(c => c.id === id)) throw new Error('Kategori tidak ditemukan.');
  return {...book, categories:book.categories.filter(c => c.id !== id), budgets:Object.fromEntries(Object.entries(book.budgets).filter(([key]) => !key.endsWith(`|${id}`)))};
}
