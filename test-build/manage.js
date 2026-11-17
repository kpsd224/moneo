"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createId = exports.cleanName = void 0;
exports.nameAvailable = nameAvailable;
exports.normalizeLegacyBook = normalizeLegacyBook;
exports.saveAccount = saveAccount;
exports.deleteAccount = deleteAccount;
exports.saveCategory = saveCategory;
exports.deleteCategory = deleteCategory;
const Adv = require("./advanced");
/** All actions use stable IDs. Rename never changes transaction foreign keys. */
const cleanName = (value) => value.trim().replace(/\s+/g, ' ').slice(0, 44);
exports.cleanName = cleanName;
const createId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
exports.createId = createId;
function nameAvailable(items, name, exceptId) {
    const v = (0, exports.cleanName)(name).toLocaleLowerCase('id-ID');
    return !!v && !items.some(item => item.id !== exceptId && item.label.toLocaleLowerCase('id-ID') === v);
}
function normalizeLegacyBook(book) {
    // Upgrade already-persisted v1 data without resetting user's transactions or budgets.
    const legacy = book.accounts.find(a => a.id === 'paylater');
    const mislabeled = book.accounts.some(a => a.label.toLocaleLowerCase('id-ID') === 'paylater');
    if (!legacy && !mislabeled)
        return book;
    const occupied = book.accounts.some(a => a.id === 'other-account');
    const replacement = occupied ? 'other-legacy-account' : 'other-account';
    const accounts = book.accounts.map(a => a.id === 'paylater'
        ? { ...a, id: replacement, label: occupied ? 'Lainnya (lama)' : 'Lainnya', icon: 'wallet' }
        : a.label.toLocaleLowerCase('id-ID') === 'paylater' ? { ...a, label: 'Lainnya', icon: 'wallet' } : a);
    return { ...book, accounts, entries: book.entries.map(e => e.accountId === 'paylater' ? { ...e, accountId: replacement } : e) };
}
function saveAccount(book, fields) {
    const label = (0, exports.cleanName)(fields.label);
    if (!nameAvailable(book.accounts, label, fields.id))
        throw new Error('Nama dompet harus diisi dan tidak boleh sama.');
    if (!Number.isSafeInteger(fields.openingBalance) || Math.abs(fields.openingBalance) >= 1e15)
        throw new Error('Saldo awal tidak valid.');
    if (fields.id) {
        if (!book.accounts.some(a => a.id === fields.id))
            throw new Error('Dompet tidak ditemukan.');
        return { ...book, accounts: book.accounts.map(a => a.id === fields.id ? { ...a, label, openingBalance: fields.openingBalance } : a) };
    }
    const colors = ['#7063E8', '#24A99A', '#E4A04C', '#4599DE', '#EA7D9B'];
    const account = { id: (0, exports.createId)('account'), label, openingBalance: fields.openingBalance, icon: 'wallet', color: colors[book.accounts.length % colors.length] };
    return { ...book, accounts: [...book.accounts, account] };
}
function deleteAccount(book, id) {
    const ext = Adv.state(book);
    if (ext.transfers.some((t) => t.from === id || t.to === id) || ext.allocations.some((x) => x.accountId === id) || ext.recurring.some((x) => x.accountId === id) || ext.debts.some((x) => x.accountId === id) || ext.payments.some((x) => x.accountId === id) || ext.adjustments.some((x) => x.accountId === id))
        throw new Error('Dompet masih digunakan pada fitur Keuangan+. Hapus atau pindahkan data terkait terlebih dahulu.');
    if (book.entries.some(e => e.accountId === id))
        throw new Error('Dompet masih memiliki transaksi. Pindahkan atau hapus transaksi tersebut terlebih dahulu agar riwayat dan saldo tetap akurat.');
    if (!book.accounts.some(a => a.id === id))
        throw new Error('Dompet tidak ditemukan.');
    return { ...book, accounts: book.accounts.filter(a => a.id !== id) };
}
function saveCategory(book, fields) {
    const label = (0, exports.cleanName)(fields.label);
    const ofKind = book.categories.filter(c => c.kind === fields.kind);
    if (!nameAvailable(ofKind, label, fields.id))
        throw new Error('Nama kategori harus diisi dan tidak boleh sama pada jenis ini.');
    if (fields.id) {
        if (!book.categories.some(c => c.id === fields.id && c.kind === fields.kind))
            throw new Error('Kategori tidak ditemukan.');
        return { ...book, categories: book.categories.map(c => c.id === fields.id ? { ...c, label } : c) };
    }
    const theme = { expense: { icon: 'grid', color: '#E48B81' }, income: { icon: 'trending-up', color: '#32AF98' }, saving: { icon: 'savings', color: '#8D80E6' } };
    const category = { id: (0, exports.createId)('category'), label, kind: fields.kind, ...theme[fields.kind] };
    return { ...book, categories: [...book.categories, category] };
}
function deleteCategory(book, id) {
    if (Adv.state(book).recurring.some((r) => r.categoryId === id))
        throw new Error('Kategori masih digunakan jadwal bulanan.');
    if (book.entries.some(e => e.categoryId === id))
        throw new Error('Kategori masih dipakai transaksi. Pindahkan atau hapus transaksi tersebut sebelum menghapus kategori.');
    if (!book.categories.some(c => c.id === id))
        throw new Error('Kategori tidak ditemukan.');
    return { ...book, categories: book.categories.filter(c => c.id !== id), budgets: Object.fromEntries(Object.entries(book.budgets).filter(([key]) => !key.endsWith(`|${id}`))) };
}
