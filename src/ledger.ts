import { Book, Entry, Kind, validLocalDate } from './finance';

export type EntryInput = Pick<Entry, 'date' | 'kind' | 'categoryId' | 'accountId' | 'amount' | 'note'>;
/** Update an entry under its original ID; balances/reports are computed from the new ledger. */
export function upsertEntry(book: Book, input: EntryInput, editId?: string): Book {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount >= 1e15) throw new Error('Nominal harus berupa angka Rupiah positif.');
  if (!validLocalDate(input.date)) throw new Error('Tanggal tidak valid.');
  if (!(['income', 'expense', 'saving'] as Kind[]).includes(input.kind)) throw new Error('Jenis transaksi tidak valid.');
  if (!book.accounts.some(a => a.id === input.accountId)) throw new Error('Dompet tidak ditemukan.');
  if (!book.categories.some(c => c.id === input.categoryId && c.kind === input.kind)) throw new Error('Kategori tidak sesuai jenis transaksi.');
  if (typeof input.note !== 'string' || input.note.length > 160) throw new Error('Catatan maksimal 160 karakter.');
  if (editId && !book.entries.some(e => e.id === editId)) throw new Error('Transaksi tidak ditemukan.');
  const id = editId || `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  const entry: Entry = { ...input, id, note: input.note.trim() };
  return { ...book, entries: editId ? book.entries.map(e => e.id === editId ? entry : e) : [entry, ...book.entries] };
}

export interface BudgetBackup {
  app: 'ana-budget';
  backupVersion: 1;
  exportedAt: string;
  period: string;
  book: Book;
}
export function backupJson(book: Book, period: string, exportedAt = new Date().toISOString()): string {
  if (!safeBackupPeriod(period)) throw new Error('Bulan backup tidak valid.');
  return JSON.stringify({ app: 'ana-budget', backupVersion: 1, exportedAt, period, book } satisfies BudgetBackup, null, 2);
}
export const safeBackupPeriod = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && Number(v.slice(0,4)) >= 1900;
export function parseBackup(raw: string, validateBook: (v: unknown) => v is Book): BudgetBackup {
  if (raw.length > 6_000_000) throw new Error('Backup terlalu besar. Maksimal 6 MB.');
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error('File tidak berisi JSON yang valid.'); }
  if (!value || value.app !== 'ana-budget' || value.backupVersion !== 1 || !safeBackupPeriod(value.period) || !validateBook(value.book)) {
    throw new Error('Backup bukan format Moneo yang didukung atau isi datanya tidak valid.');
  }
  return value as BudgetBackup;
}
