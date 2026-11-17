"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeBackupPeriod = void 0;
exports.upsertEntry = upsertEntry;
exports.backupJson = backupJson;
exports.parseBackup = parseBackup;
const finance_1 = require("./finance");
/** Update an entry under its original ID; balances/reports are computed from the new ledger. */
function upsertEntry(book, input, editId) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount >= 1e15)
        throw new Error('Nominal harus berupa angka Rupiah positif.');
    if (!(0, finance_1.validLocalDate)(input.date))
        throw new Error('Tanggal tidak valid.');
    if (!['income', 'expense', 'saving'].includes(input.kind))
        throw new Error('Jenis transaksi tidak valid.');
    if (!book.accounts.some(a => a.id === input.accountId))
        throw new Error('Dompet tidak ditemukan.');
    if (!book.categories.some(c => c.id === input.categoryId && c.kind === input.kind))
        throw new Error('Kategori tidak sesuai jenis transaksi.');
    if (typeof input.note !== 'string' || input.note.length > 160)
        throw new Error('Catatan maksimal 160 karakter.');
    if (editId && !book.entries.some(e => e.id === editId))
        throw new Error('Transaksi tidak ditemukan.');
    const id = editId || `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    const entry = { ...input, id, note: input.note.trim() };
    return { ...book, entries: editId ? book.entries.map(e => e.id === editId ? entry : e) : [entry, ...book.entries] };
}
function backupJson(book, period, exportedAt = new Date().toISOString()) {
    if (!(0, exports.safeBackupPeriod)(period))
        throw new Error('Bulan backup tidak valid.');
    return JSON.stringify({ app: 'ana-budget', backupVersion: 1, exportedAt, period, book }, null, 2);
}
const safeBackupPeriod = (v) => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && Number(v.slice(0, 4)) >= 1900;
exports.safeBackupPeriod = safeBackupPeriod;
function parseBackup(raw, validateBook) {
    if (raw.length > 6000000)
        throw new Error('Backup terlalu besar. Maksimal 6 MB.');
    let value;
    try {
        value = JSON.parse(raw);
    }
    catch {
        throw new Error('File tidak berisi JSON yang valid.');
    }
    if (!value || value.app !== 'ana-budget' || value.backupVersion !== 1 || !(0, exports.safeBackupPeriod)(value.period) || !validateBook(value.book)) {
        throw new Error('Backup bukan versi Moneo yang didukung atau isi datanya tidak valid.');
    }
    return value;
}
