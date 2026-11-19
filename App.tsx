import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StatusBar,
  StyleSheet, Text, TextInput, View, useWindowDimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import {
  Book, Category, Entry, Kind, accountBalance, allBalances,
  amountText, budgetKey, budgetTotal, categoryActual, changePeriod, safeBook,
  entriesForPeriod, moneyFromInput, periodLabel, periodSummary, seriesByMonth,
  shortMoney, validLocalDate, daySummary, changeDay, calendarDays, fullDateLabel
} from './src/finance';
import { currentPeriod, freshEmptyBook } from './src/seed';
import { removeOldSampleData } from './src/sampleCleanup';
import { publishWidget } from './src/publishWidget';
import { addUserInteractionListener } from 'expo-widgets';
import { Image as RNImage } from 'react-native';
import { normalizeLegacyBook, saveAccount, deleteAccount, saveCategory, deleteCategory } from './src/manage';
import { upsertEntry, backupJson, parseBackup } from './src/ledger';
import * as Adv from './src/advanced';

const STORAGE = '@ana-budget/v1'; // unchanged: keep older Moneo financial data
const BEFORE_CLEANUP = '@moneo/before-cleanup-v1110';
const BG = '#F7F5EF';
const INK = '#173C2E';
const MUTED = '#607367';
const PURPLE = '#B8326B';
const GREEN = '#26754C';
const BRAND_GREEN = '#BCE778';
const MINT = '#E7F3E9';
const BLUSH = '#FCE8F0';
const WHITE = '#FFFEFB';
const SHADOW = Platform.OS === 'ios'
  ? { shadowColor: '#173C2E', shadowOpacity: 0.035, shadowRadius: 11, shadowOffset: { width: 0, height: 4 } }
  : Platform.OS === 'android' ? { elevation: 1 } : {};

type Tab = 'home' | 'budget' | 'activity' | 'insights' | 'advanced' | 'goals';
type KindFilter = Kind | 'all';

const CATEGORY_ICON_OPTIONS = [
  {name:'grid', label:'Umum'}, {name:'basket', label:'Belanja'},
  {name:'restaurant', label:'Makan'}, {name:'car', label:'Jalan'},
  {name:'home', label:'Rumah'}, {name:'receipt', label:'Tagihan'},
  {name:'briefcase', label:'Kerja'}, {name:'savings', label:'Tabungan'},
  {name:'target', label:'Target'}, {name:'phone', label:'Digital'},
  {name:'wallet', label:'Dompet'}, {name:'sparkles', label:'Lainnya'},
  {name:'trending-up', label:'Naik'}, {name:'analytics', label:'Analisis'},
  {name:'shield-checkmark', label:'Aman'}, {name:'card', label:'Kartu'}
];
const WALLET_ICON_OPTIONS = [
  {name:'wallet', label:'Dompet'}, {name:'bank', label:'Bank'},
  {name:'card', label:'Kartu'}, {name:'phone', label:'Digital'},
  {name:'cash', label:'Tunai'}, {name:'savings', label:'Tabungan'},
  {name:'briefcase', label:'Bisnis'}, {name:'store', label:'Toko'},
  {name:'home', label:'Rumah'}, {name:'car', label:'Kendaraan'},
  {name:'travel', label:'Perjalanan'}, {name:'gift', label:'Hadiah'}
];
const WALLET_COLOR_OPTIONS = ['#B8326B', '#26754C', '#248FD4', '#E4A04C', '#8D68BE', '#D35C7C'];

function formatRupiahInput(text: string, allowNegative = false): string {
  const digits = text.replace(/\D/g, '').slice(0, 14).replace(/^0+(?=\d)/, '');
  return `${allowNegative && text.trim().startsWith('-') ? '-' : ''}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

const ICONS: Record<string, { ios: string; android: string; web: string }> = {
  house: { ios: 'house.fill', android: 'home', web: 'home' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  budget: { ios: 'square.stack.3d.up.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  activity: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
  insights: { ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  next: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  down: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  wallet: { ios: 'wallet.pass.fill', android: 'wallet', web: 'wallet' },
  bank: { ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' },
  cash: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
  card: { ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' },
  phone: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  store: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' },
  travel: { ios: 'airplane', android: 'flight', web: 'flight' },
  gift: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
  'arrow-up': { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  'arrow-down': { ios: 'arrow.down.left', android: 'south_west', web: 'south_west' },
  savings: { ios: 'leaf.fill', android: 'savings', web: 'savings' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  briefcase: { ios: 'briefcase.fill', android: 'work', web: 'work' },
  'trending-up': { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' },
  basket: { ios: 'basket.fill', android: 'shopping_basket', web: 'shopping_basket' },
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  restaurant: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  receipt: { ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt_long' },
  grid: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  'shield-checkmark': { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  analytics: { ios: 'chart.pie.fill', android: 'pie_chart', web: 'pie_chart' },
  eye: { ios: 'eye.fill', android: 'visibility', web: 'visibility' },
  'eye-off': { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  pencil: { ios: 'pencil', android: 'edit', web: 'edit' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  trash: { ios: 'trash.fill', android: 'delete', web: 'delete' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  target: { ios: 'scope', android: 'track_changes', web: 'track_changes' },
  alert: { ios: 'exclamationmark.circle.fill', android: 'warning', web: 'warning' }
};
function Ico({ name, size = 22, color = INK }: { name: string; size?: number; color?: string }) {
  const symbol = ICONS[name] || ICONS.grid;
  return <SymbolView name={symbol as unknown as React.ComponentProps<typeof SymbolView>['name']} size={size} tintColor={color}
    fallback={<Text style={{ color, fontSize: size * 0.85 }}>●</Text>} />;
}
function M({ children, size = 14, color = INK, weight = '500', style }: {
  children: React.ReactNode; size?: number; color?: string; weight?: '400' | '500' | '600' | '700' | '800' | '900'; style?: object
}) { return <Text style={[{ fontSize: size, color, fontWeight: weight, includeFontPadding: false }, style]}>{children}</Text>; }
function IconCircle({ name, tint, size = 46 }: { name: string; tint: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: tint + '19', alignItems: 'center', justifyContent: 'center' }}>
    <Ico name={name} color={tint} size={size * 0.48} />
  </View>;
}
function Progress({ progress, color = GREEN, bg = '#E5EAE2', height = 9 }: { progress: number; color?: string; bg?: string; height?: number }) {
  return <View style={{ height, borderRadius: height, backgroundColor: bg, overflow: 'hidden' }}>
    <View style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
  </View>;
}
function Panel({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
function Heading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionHead}><M size={20} weight="800">{title}</M>
    {action && onAction && <Pressable onPress={onAction} style={styles.actionText}><M size={12} weight="800" color={PURPLE}>{action}</M><Ico name="next" size={15} color={PURPLE} /></Pressable>}
  </View>;
}
function Empty({ text, icon = 'info' }: { text: string; icon?: string }) {
  return <View style={{ paddingVertical: 25, alignItems: 'center', gap: 9 }}><Ico name={icon} size={29} color="#A2A8BB" /><M color={MUTED} size={13}>{text}</M></View>;
}
function MonthControl({ period, onChange, onOpen }: { period: string; onChange: (v: string) => void; onOpen: () => void }) {
  return <View style={styles.monthControl}>
        <Pressable accessibilityLabel="Bulan sebelumnya" onPress={() => onChange(changePeriod(period, -1))} hitSlop={8}><Ico name="back" size={19} color={INK} /></Pressable>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Pilih bulan dan tahun" style={{ flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 3 }}><Ico name="calendar" size={15} color={GREEN} /><M size={13} weight="800">{periodLabel(period)}</M><Ico name="down" size={13} color={GREEN}/></Pressable>
    <Pressable accessibilityLabel="Bulan berikutnya" onPress={() => onChange(changePeriod(period, 1))} hitSlop={8}><Ico name="next" size={19} color={INK} /></Pressable>
  </View>;
}
function KindLabel({ kind }: { kind: Kind }) { return <M size={11} weight="800" color={kind === 'income' ? GREEN : kind === 'saving' ? '#39764B' : PURPLE}>{kind === 'income' ? 'PEMASUKAN' : kind === 'saving' ? 'TABUNGAN' : 'PENGELUARAN'}</M>; }
function TransactionItem({ entry, book, privacy, onLongPress, onPress }: { entry: Entry; book: Book; privacy: boolean; onLongPress?: () => void; onPress?: () => void }) {
  const category = book.categories.find(c => c.id === entry.categoryId);
  const account = book.accounts.find(a => a.id === entry.accountId);
  const positive = entry.kind === 'income';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Edit transaksi ${category?.label || "kategori"} ${entry.date}`} onPress={onPress} onLongPress={onLongPress} delayLongPress={450} style={styles.transactionRow}>
    <IconCircle name={category?.icon || 'grid'} tint={category?.color || PURPLE} />
    <View style={{ flex: 1, gap: 5 }}><M size={14} weight="800" style={{ flexShrink: 1 }}>{category?.label || 'Kategori'}</M>
      <M size={11} color={MUTED} style={{ flexShrink: 1 }}>{entry.date.slice(8)} • {account?.label || '?'}{entry.note ? ` · ${entry.note}` : ''}</M></View>
    <M size={13} weight="800" color={positive ? GREEN : INK}>{privacy ? '••••••' : `${positive ? '+' : '−'}${amountText(entry.amount)}`}</M>
  </Pressable>;
}
function MiniTrend({ book, period, width }: { book: Book; period: string; width: number }) {
  const series = seriesByMonth(book, period, 6);
  const height = 145, top = 15, bottom = 20;
  const chartW = Math.max(210, width - 30);
  const usableH = height - top - bottom;
  const max = Math.max(1000000, ...series.map(x => Math.max(x.income, x.expense))) * 1.12;
  const xs = series.map((_, i) => 12 + i * ((chartW - 24) / (series.length - 1)));
  const pts = (key: 'income' | 'expense') => series.map((row, i) => [xs[i], top + usableH * (1 - row[key] / max)] as [number, number]);
  const path = (points: [number, number][]) => points.reduce((acc, p, i) => i === 0 ? `M${p[0]},${p[1]}` : `${acc} L${p[0]},${p[1]}`, '');
  return <View>
    <View style={{ flexDirection: 'row', gap: 18, marginBottom: 4 }}>
      <View style={styles.legend}><View style={[styles.legendDot, { backgroundColor: GREEN }]} /><M size={11} color={MUTED}>Pemasukan</M></View>
      <View style={styles.legend}><View style={[styles.legendDot, { backgroundColor: PURPLE }]} /><M size={11} color={MUTED}>Pengeluaran</M></View>
    </View>
    <Svg width={chartW} height={height} viewBox={`0 0 ${chartW} ${height}`}>
      <Defs><SvgGradient id="area" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={GREEN} stopOpacity={0.16} /><Stop offset="1" stopColor={GREEN} stopOpacity={0} /></SvgGradient></Defs>
      {[0, 0.5, 1].map((n, i) => <Path key={i} d={`M5,${top + usableH * n} H${chartW - 5}`} stroke="#E8EBE4" strokeDasharray="4 5" />)}
      <Path d={`${path(pts('income'))} L${xs[5]},${height - bottom} L${xs[0]},${height - bottom} Z`} fill="url(#area)" />
      <Path d={path(pts('expense'))} fill="none" stroke={PURPLE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={path(pts('income'))} fill="none" stroke={GREEN} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {pts('income').map((p, i) => <Circle key={`income${i}`} cx={p[0]} cy={p[1]} r={i === 5 ? 4 : 2.5} fill={GREEN} stroke="white" strokeWidth={1.5} />)}
      {pts('expense').map((p, i) => <Circle key={`expense${i}`} cx={p[0]} cy={p[1]} r={i === 5 ? 4 : 2.5} fill={PURPLE} stroke="white" strokeWidth={1.5} />)}
    </Svg>
    <View style={{ width: chartW, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
      {series.map(x => <M key={x.period} size={10} weight="700" color={MUTED}>{x.month}</M>)}
    </View>
  </View>;
}
function SpendingDonut({ categories, entries, width = 150 }: { categories: Category[]; entries: Entry[]; width?: number }) {
  const spending = categories.filter(c => c.kind === 'expense').map(c => ({ ...c, value: categoryActual(entries, c.id) })).filter(x => x.value > 0).sort((a,b) => b.value - a.value);
  const total = spending.reduce((s, x) => s + x.value, 0);
  const r = 55; const circ = 2 * Math.PI * r; let offset = 0;
  return <View style={{ alignItems: 'center', justifyContent: 'center', height: width + 8, width }}>
    <Svg width={width} height={width} viewBox="0 0 150 150">
      <Circle cx={75} cy={75} r={r} stroke="#E8EBE4" strokeWidth={18} fill="none" />
      {spending.map(c => { const len = c.value / total * circ; const dashOffset = -offset; offset += len;
        return <Circle key={c.id} cx={75} cy={75} r={r} stroke={c.color} strokeWidth={18} fill="none" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={dashOffset} rotation={-90} origin="75, 75" strokeLinecap="butt" />; })}
    </Svg>
    <View style={{ position: 'absolute', alignItems: 'center' }}><M size={11} color={MUTED}>Total keluar</M><M size={18} weight="900">{shortMoney(total)}</M></View>
  </View>;
}

function HomeScreen({ book, period, privacy, setPrivacy, setTab, openAdd, openAccounts, width }: {
  book: Book; period: string; privacy: boolean; setPrivacy: (v: boolean) => void; setTab: (t: Tab) => void;
  openAdd: (k: Kind) => void; openAccounts: () => void; width: number
}) {
  const { entries, income, expense, saving } = periodSummary(book, period);
  const all = allBalances(book);
  const expenseBudget = book.categories.filter(c=>c.kind==='expense').reduce((n,c)=>n+Adv.plannedBudget(book,period,c.id),0);
  const ratio = expenseBudget > 0 ? expense / expenseBudget : 0;
  const sorted = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const ranked = book.accounts.map(a => ({ ...a, value: accountBalance(book, a.id) })).filter(a => a.value !== 0).sort((a,b) => b.value - a.value).slice(0,3);
  return <>
    <LinearGradient colors={['#15543B', '#0E432F']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <M size={12} color="#D8E9DC" weight="700">TOTAL SALDO SEMUA AKUN</M>
        <Pressable onPress={() => setPrivacy(!privacy)} hitSlop={10} accessibilityLabel="Tampilkan atau sembunyikan saldo"><Ico name={privacy ? 'eye-off' : 'eye'} size={20} color="#FBE4EC" /></Pressable>
      </View>
      <M size={31} color={WHITE} weight="900" style={{ marginTop: 13, letterSpacing: -1.2 }}>{privacy ? 'Rp •••••••••' : amountText(all)}</M>
      <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Ico name="check" size={14} color={BRAND_GREEN} /><M size={11} color="#E3F0E4" weight="700">Saldo dihitung otomatis</M>
        </View>
        <Pressable onPress={openAccounts} style={styles.heroButton}><M size={12} color={WHITE} weight="800">Detail akun</M><Ico name="next" size={14} color={WHITE} /></Pressable>
      </View>
    </LinearGradient>

    <View style={styles.overviewGrid}>
      {([
        { title: 'Masuk', value: income, color: GREEN },
        { title: 'Keluar', value: expense, color: PURPLE },
        { title: 'Ditabung', value: saving, color: '#39764B' }
      ] as const).map((x, index) => <View key={x.title} style={[styles.miniCard, index < 2 && styles.miniCardDivider]}>
        <M color={MUTED} size={10} weight="700">{x.title}</M>
        <M size={13} color={x.color} weight="900" style={{ marginTop: 7 }}>{privacy ? '••••' : shortMoney(x.value)}</M>
      </View>)}
    </View>

    <View style={{ marginTop: 29 }}><Heading title="Akses cepat" /></View>
    <View style={styles.quickRow}>
      {([
        { kind: 'expense', icon: 'arrow-up', title: 'Pengeluaran', color: PURPLE, bg: BLUSH },
        { kind: 'income', icon: 'arrow-down', title: 'Pemasukan', color: GREEN, bg: MINT },
        { kind: 'saving', icon: 'savings', title: 'Tabungan', color: '#39764B', bg: '#EDF4E7' }
      ] as const).map(a => <Pressable onPress={() => openAdd(a.kind)} key={a.kind} style={styles.quickAction}>
        <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }}><Ico name={a.icon} size={23} color={a.color} /></View>
        <M size={11} weight="700" color="#555B73">{a.title}</M>
      </Pressable>)}
    </View>

    <Heading title="Anggaran bulan ini" action="Lihat anggaran" onAction={() => setTab('budget')} />
    <Panel>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <View style={{ gap: 8 }}><M size={11} color={MUTED} weight="700">Pengeluaran terpakai</M><M size={22} weight="900">{privacy ? 'Rp ••••' : amountText(expense)}</M></View>
        <View style={[styles.percentPill, { backgroundColor: expenseBudget > 0 && ratio > 1 ? '#FFF0EB' : MINT }]}>
          <M size={12} color={ratio > 1 ? '#9A4D39' : '#39764B'} weight="900">{expenseBudget ? `${Math.round(ratio * 100)}%` : 'Belum diatur'}</M>
        </View>
      </View>
      <Progress progress={ratio} color={ratio > 1 ? '#F08E76' : GREEN} height={9} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <M size={11} color={MUTED}>Dari {privacy ? '••••' : amountText(expenseBudget)} budget</M>
        <M size={11} weight="800" color={ratio > 1 ? '#9A4D39' : '#39764B'}>{expenseBudget ? (ratio > 1 ? `Lebih ${shortMoney(expense - expenseBudget)}` : `Sisa ${shortMoney(expenseBudget - expense)}`) : 'Atur budget'}</M>
      </View>
    </Panel>

    <Heading title="Arus kas 6 bulan" action="Analisis" onAction={() => setTab('insights')} />
    <Panel><MiniTrend book={book} period={period} width={width - 70} /></Panel>

    <Heading title="Akun terhubung" action="Semua akun" onAction={openAccounts} />
    <View style={{ flexDirection: 'row', gap: 11 }}>
      {ranked.length ? ranked.map(a => <View key={a.id} style={[styles.accountPreview, { flex: 1 }]}>
        <IconCircle name={a.icon} tint={a.color} size={35} /><M size={12} weight="800" style={{ marginTop: 12 }}>{a.label}</M>
        <M size={12} color={MUTED} weight="700" style={{ marginTop: 5 }}>{privacy ? '••••' : shortMoney(a.value)}</M>
      </View>) : <Panel><Empty text="Belum ada saldo pada akun" icon="wallet" /></Panel>}
    </View>

    <Heading title="Transaksi terbaru" action="Semua transaksi" onAction={() => setTab('activity')} />
    <Panel style={{ paddingVertical: 8 }}>{sorted.length ? sorted.slice(0, 4).map(t => <TransactionItem key={t.id} entry={t} book={book} privacy={privacy} />) : <Empty text="Belum ada transaksi bulan ini" />}</Panel>
  </>;
}

function BudgetScreen({ book, period, filter, setFilter, openEdit, openCreate, copyPrevious, privacy }: {
  book: Book; period: string; filter: Kind; setFilter: (k: Kind) => void;
  openEdit: (category: Category) => void; openCreate: () => void; copyPrevious: () => void; privacy: boolean
}) {
  const entries = entriesForPeriod(book, period);
  const list = book.categories.filter(c => c.kind === filter);
  const totalPlanned = filter==='expense' ? book.categories.filter(c=>c.kind==='expense').reduce((n,c)=>n+Adv.plannedBudget(book,period,c.id),0) : budgetTotal(book, period, filter);
  const actual = entries.filter(e => e.kind === filter).reduce((n, t) => n + t.amount, 0);
  const ratio = totalPlanned ? actual / totalPlanned : 0;
  const labels = { expense: 'Pengeluaran', income: 'Pemasukan', saving: 'Tabungan' };
  return <>
    <View style={{ marginTop: 3, marginBottom: 19 }}><M size={27} weight="900">Atur anggaran</M><M color={MUTED} size={13} style={{ marginTop: 7 }}>Rencanakan lebih baik, belanja lebih bijak.</M></View>
    <View style={styles.segment}>
      {(['expense', 'income', 'saving'] as Kind[]).map(k => <Pressable key={k} onPress={() => setFilter(k)} style={[styles.segmentButton, filter === k && styles.segmentSelected]}><M color={filter === k ? INK : MUTED} weight="800" size={11}>{labels[k]}</M></Pressable>)}
    </View>
    <LinearGradient colors={['#E7F2E6','#F5F7F0']} style={styles.budgetHero}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><M color="#39764B" size={11} weight="800">TARGET {labels[filter].toUpperCase()}</M><Ico name="target" size={22} color={GREEN} /></View>
      <M size={29} weight="900" style={{ marginTop: 13 }}>{privacy ? 'Rp •••••' : amountText(totalPlanned)}</M>
      <M size={12} color="#5B735E" style={{ marginTop: 8 }}>{privacy ? '••••' : amountText(actual)} terealisasi · {totalPlanned ? `${Math.round(ratio * 100)}%` : 'Belum ada target'}</M>
      <View style={{ marginTop: 16 }}><Progress progress={ratio} height={9} color={filter === 'expense' && ratio > 1 ? '#F09C7F' : GREEN} bg="#D3E5D3" /></View>
    </LinearGradient>
    {totalPlanned === 0 && <Pressable style={styles.copyCard} onPress={copyPrevious}>
      <Ico name="calendar" color={GREEN} /><View style={{ flex: 1, gap: 4 }}><M size={13} weight="800">Mulai dari bulan sebelumnya</M><M size={11} color={MUTED}>Salin seluruh target anggaran dari bulan lalu.</M></View><Ico name="next" size={18} color={GREEN} />
    </Pressable>}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 14, gap: 10 }}>
      <M size={20} weight="800">Kategori & target</M>
      <Pressable accessibilityLabel="Tambah kategori anggaran" onPress={openCreate} style={styles.addSmall}><Ico name="plus" color={WHITE} size={17}/><M color={WHITE} size={11} weight="800">Tambah</M></Pressable>
    </View>
    <Panel style={{ paddingVertical: 4 }}>
      {!list.length && <Empty text="Belum ada kategori. Tekan Tambah untuk membuat."/>}
      {list.map((category, idx) => {
        const planned = filter==='expense' ? Adv.plannedBudget(book,period,category.id) : (book.budgets[budgetKey(period, category.id)] || 0);
        const spent = categoryActual(entries, category.id);
        const pct = planned ? spent / planned : 0;
        return <Pressable onPress={() => openEdit(category)} key={category.id} style={[styles.budgetCategory, idx > 0 && { borderTopWidth: 1, borderTopColor: '#F2F3F8' }]}>
          <IconCircle name={category.icon} tint={category.color} size={42} />
          <View style={{ flex: 1, gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 }}><M size={13} weight="800" style={{ flex: 1 }}>{category.label}</M><Ico name="pencil" size={14} color="#9BA99B" /></View>
            <Progress progress={pct} height={7} color={planned && pct > 1 && filter === 'expense' ? '#F38D78' : category.color} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              <M size={10} color={MUTED}>{privacy ? '••••' : amountText(spent)} realisasi</M>
              <M size={10} color={pct > 1 && filter === 'expense' ? '#9A4D39' : MUTED} weight="700">{privacy ? '••••' : amountText(planned)} target</M>
            </View>
          </View>
        </Pressable>;
      })}
    </Panel>
  </>;
}

function ActivityScreen({ book, period, privacy, filter, setFilter, search, setSearch, onDelete, onEdit, selectedDate, setSelectedDate, openCalendar, goToDay }: {
  book: Book; period: string; privacy: boolean; filter: KindFilter; setFilter: (v: KindFilter) => void;
  search: string; setSearch: (v: string) => void; onDelete: (entry: Entry) => void; onEdit: (entry: Entry) => void;
  selectedDate: string | null; setSelectedDate: (date: string | null) => void;
  openCalendar: () => void; goToDay: (date: string) => void;
}) {
  const dateValid = selectedDate?.startsWith(period) ? selectedDate : null;
  const daily = dateValid ? daySummary(book, dateValid) : null;
  const linkedTransfers = (Adv.state(book).transfers as any[]).filter((t:any)=>t.date.startsWith(period)&&(!dateValid||t.date===dateValid));
  const list = entriesForPeriod(book, period).filter(e => {
    if (dateValid && e.date !== dateValid) return false;
    if (filter !== 'all' && e.kind !== filter) return false;
    const c = book.categories.find(c => c.id === e.categoryId);
    const a = book.accounts.find(a => a.id === e.accountId);
    const text = `${e.note} ${c?.label || ''} ${a?.label || ''} ${e.date}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  }).sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return <>
    <View style={{ marginBottom: 16 }}><M size={27} weight="900">Aktivitas uang</M><M size={13} color={MUTED} style={{ marginTop: 7 }}>Pilih tanggal untuk melihat transaksi pada hari itu.</M></View>
    <Panel style={{ padding: 15, marginBottom: 15 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:10 }}>
        <View style={{ flex:1, gap:5 }}><M size={10} color={MUTED} weight="800">PERIODE TRANSAKSI</M><M size={14} weight="800">{dateValid ? fullDateLabel(dateValid) : `Semua tanggal · ${periodLabel(period)}`}</M></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Buka kalender transaksi harian" onPress={openCalendar} style={styles.dayOpenButton}><Ico name="calendar" size={18} color={PURPLE}/><M size={11} weight="800" color={PURPLE}>Tanggal</M></Pressable>
      </View>
      <View style={{flexDirection:'row',gap:9,alignItems:'center',marginTop:14}}>
        <Pressable style={styles.dayNav} onPress={() => goToDay(changeDay(dateValid || `${period}-01`, -1))} accessibilityLabel="Hari sebelumnya"><Ico name="back" size={18} color={PURPLE}/></Pressable>
        <Pressable style={[styles.dayAll, !dateValid && { backgroundColor:BLUSH }]} onPress={() => setSelectedDate(null)} accessibilityLabel="Lihat seluruh tanggal bulan ini"><M size={11} weight="800" color={PURPLE}>Semua tanggal</M></Pressable>
        <Pressable style={styles.dayNav} onPress={() => goToDay(changeDay(dateValid || `${period}-01`, 1))} accessibilityLabel="Hari berikutnya"><Ico name="next" size={18} color={PURPLE}/></Pressable>
      </View>
      {daily && <View style={{ flexDirection:'row', gap:7, marginTop:14 }}>
        {([['Masuk', daily.income,GREEN],['Keluar',daily.expense,PURPLE],['Tabungan',daily.saving,'#39764B']] as [string,number,string][]).map(([label,total,color]) => <View key={label} style={{flex:1,minWidth:0,padding:10,backgroundColor:'#F4F5EF',borderRadius:12,gap:5}}><M size={10} color={MUTED} weight="700">{label}</M><M size={10} color={color} weight="900" style={{flexShrink:1}}>{privacy?'••••':amountText(total)}</M></View>)}
      </View>}
    </Panel>
    <View style={styles.searchBox}><Ico name="search" size={20} color={MUTED} /><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Cari transaksi, akun, kategori..." placeholderTextColor={MUTED} returnKeyType="search" /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingVertical: 15 }}>
      {([['all','Semua'], ['expense','Pengeluaran'], ['income','Pemasukan'], ['saving','Tabungan']] as [KindFilter,string][]).map(([k, label]) => <Pressable key={k} onPress={() => setFilter(k)} style={[styles.chip, filter === k && styles.chipSelected]}><M size={12} weight="800" color={filter === k ? WHITE : '#69708A'}>{label}</M></Pressable>)}
    </ScrollView>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}><M weight="800" size={14}>{list.length} transaksi{dateValid?' pada tanggal ini':''}</M><M color={MUTED} size={11}>Ketuk edit · tahan hapus</M></View>
    <Panel style={{ paddingVertical: 6 }}>
      {list.length ? list.map(e => <TransactionItem key={e.id} entry={e} book={book} privacy={privacy} onLongPress={() => onDelete(e)} onPress={() => onEdit(e)} />) : <Empty icon="calendar" text={dateValid ? 'Tidak ada transaksi pada tanggal ini' : 'Tidak ada transaksi yang cocok'} />}
    </Panel>
    <View style={{marginTop:21}}><Heading title="Transfer antar-dompet"/></View>
    <Panel style={{paddingVertical:6}}>{!linkedTransfers.length?<Empty text="Belum ada transfer pada tanggal/periode ini" icon="wallet"/>:linkedTransfers.map((t:any)=><View key={t.id} style={[styles.transactionRow,{gap:9}]}><IconCircle name="wallet" tint={PURPLE} size={39}/><View style={{flex:1,gap:6}}><M size={13} weight="800">{book.accounts.find(a=>a.id===t.from)?.label||'?'} → {book.accounts.find(a=>a.id===t.to)?.label||'?'}</M><M size={11} color={MUTED}>{t.date} · Transfer internal</M></View><M size={12} weight="800">{privacy?'••••':amountText(t.amount)}</M></View>)}</Panel>
  </>;
}

function InsightsScreen({ book, period, privacy, width }: { book: Book; period: string; privacy: boolean; width: number }) {
  const { entries, income, expense, saving, net } = periodSummary(book, period);
  const ranked = book.categories.filter(c => c.kind === 'expense').map(c => ({ ...c, value: categoryActual(entries, c.id) })).filter(c => c.value > 0).sort((a,b) => b.value - a.value);
  const max = ranked[0]?.value || 1;
  const planned = book.categories.filter(c=>c.kind==='expense').reduce((n,c)=>n+Adv.plannedBudget(book,period,c.id),0);
  return <>
    <View style={{ marginTop: 3, marginBottom: 22 }}><M size={27} weight="900">Analisis keuangan</M><M size={13} color={MUTED} style={{ marginTop: 7 }}>Kenali kebiasaan finansialmu.</M></View>
    <LinearGradient colors={['#15543B','#0E432F']} style={styles.insightHero}>
      <M size={11} color="#D8E9DC" weight="800">ARUS KAS BERSIH</M>
      <M size={29} color={WHITE} weight="900" style={{ marginTop: 10 }}>{privacy ? 'Rp •••••' : amountText(net)}</M>
      <View style={{ marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7 }}><Ico name={net >= 0 ? 'check' : 'alert'} size={17} color={net >= 0 ? BRAND_GREEN : '#FFB99A'} /><M color="#E3F0E4" size={12}>{net >= 0 ? 'Pemasukan menutup semua pengeluaran & alokasi tabungan.' : 'Pengeluaran dan tabungan lebih besar dari pemasukan.'}</M></View>
    </LinearGradient>
    <Heading title="Distribusi pengeluaran" />
    <Panel>
      <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
        <SpendingDonut categories={book.categories} entries={entries} width={Math.min(152, width * .40)} />
        <View style={{ flex: 1, gap: 14 }}>{ranked.slice(0, 4).length ? ranked.slice(0, 4).map(c => <View key={c.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={{ width: 9, height: 9, borderRadius: 4, backgroundColor: c.color }} /><View style={{ flex: 1 }}><M size={12} weight="700">{c.label}</M><M size={11} color={MUTED} style={{ marginTop: 3 }}>{Math.round(c.value / expense * 100)}% · {privacy ? '•••' : shortMoney(c.value)}</M></View></View>) : <M color={MUTED} size={12}>Tidak ada pengeluaran bulan ini.</M>}</View>
      </View>
    </Panel>
    <Heading title="Tren pemasukan & pengeluaran" />
    <Panel><MiniTrend book={book} period={period} width={width - 70} /></Panel>
    <Heading title="Kategori terbesar" />
    <Panel>{ranked.length ? ranked.slice(0, 5).map(c => <View key={c.id} style={{ paddingVertical: 9, gap: 9 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><M size={12} weight="800">{c.label}</M><M size={12} weight="800">{privacy ? '••••' : amountText(c.value)}</M></View><Progress progress={c.value / max} color={c.color} height={8} />
    </View>) : <Empty text="Data kategori muncul setelah ada transaksi" />}</Panel>
    <Heading title="Kesehatan budget" />
    <Panel>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}><M size={12} color={MUTED}>Realisasi / anggaran pengeluaran</M><M size={12} weight="800">{planned ? Math.round(expense / planned * 100) + '%' : '—'}</M></View>
      <Progress progress={planned ? expense / planned : 0} color={planned > 0 && expense > planned ? '#ED9176' : GREEN} height={9} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 }}><View><M size={11} color={MUTED}>Tabungan dialokasikan</M><M size={15} weight="800" style={{ marginTop: 5 }}>{privacy ? '••••' : amountText(saving)}</M></View><View><M color={MUTED} size={11}>Target tabungan</M><M size={15} weight="800" style={{ marginTop: 5 }}>{privacy ? '••••' : amountText(budgetTotal(book, period, 'saving'))}</M></View></View>
    </Panel>
  </>;
}

function GoalsScreen({book,privacy,onOpen,onRemove}:{book:Book;privacy:boolean;onOpen:(action:string,selected?:string)=>void;onRemove:(action:string,id:string)=>void}){
  const goals=(Adv.state(book).goals as any[]);
  const fmt=(n:number)=>privacy?'Rp •••••':amountText(n);
  const totalTarget=goals.reduce((n:number,g:any)=>n+Number(g.target||0),0);
  const totalSaved=goals.reduce((n:number,g:any)=>n+Adv.goalBalance(book,g.id),0);
  const smallAction=(label:string,onPress:()=>void,danger=false)=><Pressable onPress={onPress} style={{backgroundColor:danger?BLUSH:MINT,borderRadius:11,paddingHorizontal:11,paddingVertical:9}}><M size={11} weight="800" color={danger?'#9E3557':'#39764B'}>{label}</M></Pressable>;
  return <>
    <View style={{marginTop:4,marginBottom:18}}><M size={27} weight="900">Target tabungan</M><M size={12} color={MUTED} style={{marginTop:7,lineHeight:19}}>Atur tujuan, alokasikan dana, dan lihat kemajuan tanpa mengubah saldo asli.</M></View>
    <LinearGradient colors={['#15543B','#0E432F']} style={[styles.hero,{minHeight:136,marginBottom:16}]}>
      <M color="#D8E9DC" weight="800" size={11}>TOTAL DIALOKASIKAN</M>
      <M color={WHITE} weight="900" size={27} style={{marginTop:10}}>{fmt(totalSaved)}</M>
      <M color="#E3F0E4" size={11} style={{marginTop:8}}>Dari {fmt(totalTarget)} target · {goals.length} tujuan</M>
    </LinearGradient>
    <Pressable style={[styles.primaryButton,{marginTop:2,marginBottom:18}]} onPress={()=>onOpen('goal')}><Ico name="plus" color={WHITE} size={18}/><M weight="800" color={WHITE}>Tambah target tabungan</M></Pressable>
    {goals.length===0 ? <Panel><Empty text="Belum ada target. Buat tujuan tabungan pertamamu." icon="target"/></Panel> : goals.map((g:any)=>{
      const saved=Adv.goalBalance(book,g.id),ratio=g.target>0?Math.min(1,saved/g.target):0;
      return <Panel key={g.id} style={{marginBottom:14}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',gap:8,alignItems:'center'}}><M size={15} weight="900">{g.name}</M><M size={12} weight="900" color={GREEN}>{Math.round(ratio*100)}%</M></View>
        <M size={12} color={MUTED} style={{marginTop:8}}>{fmt(saved)} / {fmt(g.target)}{g.deadline?' · '+g.deadline:''}</M>
        <View style={{marginVertical:15}}><Progress progress={ratio} color={GREEN} height={9}/></View>
        <View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{smallAction('+ Alokasi',()=>onOpen('allocate',g.id))}{smallAction('− Lepas',()=>onOpen('release',g.id))}{smallAction('Edit',()=>onOpen('goalEdit',g.id))}{smallAction('Hapus',()=>onRemove('goal',g.id),true)}</View>
      </Panel>;
    })}
    <M size={11} color={MUTED} style={{lineHeight:17,marginTop:10}}>Dana yang dialokasikan tetap ada di dompet. Angka saldo total tidak berkurang karena alokasi virtual.</M>
  </>;
}

function AdvancedScreen({book,period,privacy,onOpen,onRemove,onPost,onToggle,onSetOptions,onSettings}: {
  book:Book;period:string;privacy:boolean;
  onOpen:(action:string,selected?:string)=>void;
  onRemove:(action:string,id:string)=>void;onPost:()=>void;onToggle:(action:string,id:string)=>void;
  onSetOptions:(options:{rollover:boolean;alertPercent:number})=>void;onSettings:()=>void
}){
  const data:any=Adv.state(book), fmt=(n:number)=>privacy?'Rp •••••':amountText(n);
  const [roll,setRoll]=useState(Boolean(data.settings.rollover));
  const [warn,setWarn]=useState(Number(data.settings.alertPercent));
  useEffect(()=>{setRoll(Boolean(data.settings.rollover));setWarn(Number(data.settings.alertPercent));},[data.settings.rollover,data.settings.alertPercent]);
  const cutoff=[Adv.today(),`${period}-${String(new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate()).padStart(2,'0')}`].sort()[0];
  const due=Adv.scheduled(book,cutoff);
  const warnings=book.categories.filter(c=>c.kind==='expense').map(c=>{
    const planned=Adv.plannedBudget(book,period,c.id),used=categoryActual(entriesForPeriod(book,period),c.id);
    return {name:c.label,planned,used};
  }).filter(r=>r.planned>0&&r.used/r.planned*100>=data.settings.alertPercent);
  const row=(name:string,detail:string,right:React.ReactNode,key:string)=><View key={key} style={{paddingVertical:12,borderBottomColor:'#E8EBE4',borderBottomWidth:1,flexDirection:'row',gap:9,alignItems:'center'}}><View style={{flex:1,gap:6}}><M size={13} weight="800">{name}</M><M size={11} color={MUTED} style={{lineHeight:17}}>{detail}</M></View><View style={{flexDirection:'row',gap:7,alignItems:'center'}}>{right}</View></View>;
  const action=(label:string,click:()=>void,danger=false)=><Pressable onPress={click} style={{paddingVertical:9,paddingHorizontal:10,backgroundColor:danger?'#FFF0EF':MINT,borderRadius:10}}><M color={danger?'#A7424B':'#39764B'} size={10} weight="800">{label}</M></Pressable>;
  const quick=(title:string,icon:string,detail:string,click:()=>void)=><Pressable key={title} style={{width:'31%',minHeight:93,backgroundColor:WHITE,borderRadius:16,padding:8,alignItems:'center',justifyContent:'center',gap:5,...SHADOW}} onPress={click}><Ico name={icon} size={20} color={GREEN}/><M size={12} weight="800">{title}</M><M size={9} color={MUTED}>{detail}</M></Pressable>;
  return <>
    <View style={{marginBottom:14}}><M size={27} weight="900">Keuangan+</M><M color={MUTED} size={12} style={{marginTop:7,lineHeight:19}}>Fitur lanjutan offline. Tanpa WhatsApp, AI berbayar, cloud, atau sync.</M></View>
    <LinearGradient colors={['#15543B','#0E432F']} style={[styles.hero,{minHeight:124,marginBottom:15}]}><M color="#D8E9DC" size={10} weight="800">KEKAYAAN BERSIH</M><M color={WHITE} size={28} weight="900" style={{marginTop:13}}>{fmt(Adv.netWorth(book))}</M><M size={11} color="#E3F0E4" style={{marginTop:10}}>Saldo semua dompet {fmt(allBalances(book))}</M></LinearGradient>
    {warnings.length>0 && <Panel style={{backgroundColor:'#FFF3E8',marginBottom:12}}><M color="#935B2A" size={12} weight="800">{warnings.length} kategori melewati {data.settings.alertPercent}% anggaran</M><M color="#805A2E" size={11} style={{marginTop:7}}>{warnings.slice(0,3).map(x=>x.name).join(' · ')}</M></Panel>}
    {due.length>0 && <Pressable onPress={onPost} style={{borderRadius:16,backgroundColor:MINT,padding:15,marginBottom:15}}><M color="#39764B" weight="800" size={12}>{due.length} transaksi rutin jatuh tempo. Ketuk untuk mencatat.</M></Pressable>}
    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10,marginBottom:22}}>
      {quick('Transfer','wallet','Antar-dompet',()=>onOpen('transfer'))}
      {quick('Berulang','calendar','Bulanan',()=>onOpen('recurring'))}
      {quick('Utang','arrow-up','Piutang',()=>onOpen('debt'))}
      {quick('Cek saldo','check','Rekonsiliasi',()=>onOpen('reconcile'))}
    </View>
    <Heading title="Transfer bulan ini" action="Transfer" onAction={()=>onOpen('transfer')}/>
    <Panel style={{paddingVertical:5,marginBottom:15}}>{(data.transfers as any[]).filter((t:any)=>t.date.startsWith(period)).length===0?<Empty text="Belum ada transfer pada bulan ini"/>:(data.transfers as any[]).filter((t:any)=>t.date.startsWith(period)).slice(0,12).map((t:any)=>row(`${book.accounts.find(a=>a.id===t.from)?.label||'?'} → ${book.accounts.find(a=>a.id===t.to)?.label||'?'}`,`${t.date} · ${fmt(t.amount)}${t.note?' · '+t.note:''}`,<>{action('Edit',()=>onOpen('transferEdit',t.id))}{action('×',()=>onRemove('transfer',t.id),true)}</>,t.id))}</Panel>
    <Heading title="Transaksi berulang" action="Tambah" onAction={()=>onOpen('recurring')}/>
    <Panel style={{paddingVertical:5,marginBottom:15}}>{!(data.recurring as any[]).length?<Empty text="Belum ada jadwal berulang"/>:(data.recurring as any[]).map((r:any)=>row(r.name,`${fmt(r.amount)} · Setiap tanggal ${Number(r.startDate.slice(8))} · ${r.active?'Aktif':'Jeda'}`,<>{action('Edit',()=>onOpen('recurringEdit',r.id))}{action(r.active?'Jeda':'Aktifkan',()=>onToggle('recurring',r.id))}{action('×',()=>onRemove('recurring',r.id),true)}</>,r.id))}{action('✓ Catat yang jatuh tempo',onPost)}<M size={10} color={MUTED} style={{marginTop:10,lineHeight:16}}>Pencatatan hanya berjalan saat tombol ditekan. Tidak ada background scheduler.</M></Panel>
    <Heading title="Utang dan piutang" action="Tambah" onAction={()=>onOpen('debt')}/>
    <Panel style={{paddingVertical:5,marginBottom:15}}>{!(data.debts as any[]).length?<Empty text="Belum ada utang/piutang"/>:(data.debts as any[]).map((d:any)=><View key={d.id}>{row(d.name,`${d.type==='payable'?'Utang':'Piutang'} · Sisa ${fmt(Adv.debtRemaining(book,d.id))}`,<>{action('Lunasi',()=>onOpen('payment',d.id))}{action('×',()=>onRemove('debt',d.id),true)}</>,d.id)}{(data.payments as any[]).filter((p:any)=>p.debtId===d.id).map((p:any)=><View key={p.id} style={{paddingLeft:12}}>{row('Pelunasan '+p.date,fmt(p.amount),action('Urungkan',()=>onRemove('payment',p.id),true),p.id)}</View>)}</View>)}<M size={10} color={MUTED} style={{lineHeight:17,marginTop:10}}>Pokok saja; bunga dicatat sebagai pengeluaran biasa.</M></Panel>
    <Heading title="Penyesuaian saldo" action="Cek saldo" onAction={()=>onOpen('reconcile')}/>
    <Panel style={{paddingVertical:5,marginBottom:15}}>{!(data.adjustments as any[]).length?<Empty text="Belum ada rekonsiliasi"/>:(data.adjustments as any[]).slice(0,5).map((a:any)=>row(book.accounts.find(x=>x.id===a.accountId)?.label||'?',`${a.date} · Selisih ${fmt(a.delta)}`,action('Urungkan',()=>onRemove('adjustment',a.id),true),a.id))}</Panel>
    <Heading title="Prediksi berdasarkan jadwal"/>
    <Panel style={{gap:12,marginBottom:15}}><M size={13} weight="800">{fmt(Adv.forecast(book,period).projected)}</M><M color={MUTED} size={11}>{Adv.forecast(book,period).pending.length} jadwal di {periodLabel(period)} belum tercatat. Bukan prediksi AI.</M></Panel>
    <Heading title="Aturan anggaran"/>
    <Panel style={{marginBottom:15}}><Pressable onPress={()=>setRoll(!roll)} style={{flexDirection:'row',justifyContent:'space-between',gap:10,paddingVertical:10}}><M size={12} style={{flex:1}}>Rollover sisa budget pengeluaran (maks. 12 bulan)</M><M color={PURPLE} weight="900">{roll?'AKTIF':'NONAKTIF'}</M></Pressable><View style={{flexDirection:'row',gap:9,marginTop:12}}>{[70,80,90,100].map(v=><Pressable key={v} style={[styles.chip,warn===v&&styles.chipSelected]} onPress={()=>setWarn(v)}><M color={warn===v?WHITE:INK} size={11}>{v}%</M></Pressable>)}</View><M color={MUTED} size={11} style={{marginTop:10}}>Batas peringatan pemakaian budget.</M><Pressable style={styles.primaryButton} onPress={()=>onSetOptions({rollover:roll,alertPercent:warn})}><M color={WHITE} weight="800">Simpan pengaturan</M></Pressable></Panel>
  </>;
}

function AppCore() {
  const [book, setBook] = useState<Book>(() => freshEmptyBook());
  const [period, setPeriod] = useState(currentPeriod());
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [privacy, setPrivacy] = useState(false);
  // Independent of the in-app eye icon; widget is visible on the home screen.
  const [widgetAmountsVisible, setWidgetAmountsVisible] = useState(true);
  // Mirror home-screen eye changes while this app process is active.
  // The widget itself handles toggling when Moneo is closed.
  useEffect(() => {
    const subscription = addUserInteractionListener(event => {
      if (event.source === 'AnaFinanceWidget' && event.target === 'moneo-toggle-amounts') {
        setWidgetAmountsVisible(value => !value);
      }
    });
    return () => subscription.remove();
  }, []);
  const [budgetFilter, setBudgetFilter] = useState<Kind>('expense');
  const [activityFilter, setActivityFilter] = useState<KindFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [calendarPeriod, setCalendarPeriod] = useState(currentPeriod());
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [addKind, setAddKind] = useState<Kind>('expense');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('grid');
  const categoryEditorScroll = useRef<ScrollView>(null);
  const [accountEditor, setAccountEditor] = useState<string | null>(null); // 'new' or stable account id
  const [accountName, setAccountName] = useState('');
  const [accountOpening, setAccountOpening] = useState('');
  const [accountIcon, setAccountIcon] = useState('wallet');
  const [accountColor, setAccountColor] = useState(WALLET_COLOR_OPTIONS[0]);
  const accountEditorScroll = useRef<ScrollView>(null);
  const advancedScroll = useRef<ScrollView>(null);
  const transactionScroll = useRef<ScrollView>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [showAccounts, setShowAccounts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [advAction, setAdvAction] = useState<string | null>(null);
  const [advSelected, setAdvSelected] = useState('');
  const [advName, setAdvName] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(Adv.today());
  const [advFrom, setAdvFrom] = useState('');
  const [advTo, setAdvTo] = useState('');
  const [advKind, setAdvKind] = useState<Kind>('expense');
  const [advCategory, setAdvCategory] = useState('');
  const [advExtra, setAdvExtra] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState('rent');
  const [accountId, setAccountId] = useState('bni');
  const [dateInput, setDateInput] = useState(() => { const now=new Date(); return `${currentPeriod(now)}-${String(now.getDate()).padStart(2,'0')}`; });
  const [noteInput, setNoteInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const { width: deviceW } = useWindowDimensions();
  const width = Math.min(deviceW, 560);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE).then(async raw => {
      if (!alive || !raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        // Only read data from our schema; never execute workbook macros or remote code.
        if (parsed && typeof parsed === 'object' && 'book' in parsed) {
          const state = parsed as { book?: unknown; period?: unknown; widgetAmountsVisible?: unknown };
          if (safeBook(state.book)) {
            const normalized=normalizeLegacyBook(state.book);
            const cleaned=removeOldSampleData(normalized);
            if(cleaned.changed) {
              // Keep a full local copy BEFORE removing old example rows/targets.
              const exists=await AsyncStorage.getItem(BEFORE_CLEANUP);
              if(!exists) await AsyncStorage.setItem(BEFORE_CLEANUP,raw);
              if(!alive) return;
            }
            setBook(cleaned.book);
          }
          else { setStorageBlocked(true); setStorageWarning('Data lokal tidak valid. Penyimpanan otomatis dihentikan untuk melindungi data lama. Pulihkan backup yang valid.'); }
          // Open on the device's current month, not the old saved demo period.
          if (typeof state.widgetAmountsVisible === 'boolean') setWidgetAmountsVisible(state.widgetAmountsVisible);
        }
      } catch { setStorageBlocked(true); setStorageWarning('Data lokal tidak bisa dibaca. Pulihkan backup yang valid sebelum menyimpan perubahan.'); }
    }).catch(() => { setStorageBlocked(true); setStorageWarning('Gagal membaca atau mencadangkan penyimpanan lokal. Data lama dilindungi; lakukan backup sebelum melanjutkan.'); }).finally(() => { if (alive) setHydrated(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!hydrated || storageBlocked) return;
    let cancelled = false;
    AsyncStorage.setItem(STORAGE, JSON.stringify({ book, period, widgetAmountsVisible }))
      .then(() => { if (!cancelled) publishWidget(book, widgetAmountsVisible).catch(error => console.warn('Widget belum diperbarui:', error)); })
      .catch(() => setStorageWarning('Gagal menyimpan data lokal. Widget tidak diperbarui.'));
    return () => { cancelled = true; };
  }, [book, period, hydrated, storageBlocked, widgetAmountsVisible]);

  function openAdd(kind: Kind = 'expense') {
    if (storageBlocked) { Alert.alert('Penyimpanan dilindungi', storageWarning); return; }
    setEditingEntryId(null);
    const first = book.categories.find(c => c.kind === kind);
    setAddKind(kind); setCategoryId(first?.id || '');
    setAccountId(book.accounts[0]?.id || ''); setAmountInput(''); setNoteInput('');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const day = selectedDate?.startsWith(period) ? selectedDate : today.startsWith(period) ? today : `${period}-01`;
    setDateInput(day); setShowAdd(true);
  }
  function editTransaction(entry: Entry) {
    if (storageBlocked) { Alert.alert('Penyimpanan dilindungi', storageWarning); return; }
    setEditingEntryId(entry.id); setAddKind(entry.kind); setCategoryId(entry.categoryId);
    setAccountId(entry.accountId); setAmountInput(formatRupiahInput(String(entry.amount)));
    setDateInput(entry.date); setNoteInput(entry.note); setShowAdd(true);
  }
  function saveTransaction() {
    if (storageBlocked) { Alert.alert('Penyimpanan dilindungi', storageWarning); return; }
    try {
      setBook(upsertEntry(book, {
        date: dateInput, kind: addKind, categoryId, accountId,
        amount: moneyFromInput(amountInput), note: noteInput.trim()
      }, editingEntryId || undefined));
      setPeriod(dateInput.slice(0,7)); setSelectedDate(dateInput);
      setShowAdd(false); setEditingEntryId(null);
    } catch (error) { Alert.alert('Transaksi belum disimpan', String((error as Error).message)); }
  }
  function openEdit(category: Category) {
    setEditCategory(category); setCategoryName(category.label);
    setCategoryIcon(category.icon);
    setBudgetInput(formatRupiahInput(String(book.budgets[budgetKey(period, category.id)] || '')));
    setCategoryEditorVisible(true);
  }
  function openCreateCategory() {
    setEditCategory(null); setCategoryName(''); setBudgetInput('');
    setCategoryIcon(budgetFilter === 'income' ? 'briefcase' : budgetFilter === 'saving' ? 'savings' : 'grid');
    setCategoryEditorVisible(true);
  }
  function canWrite(): boolean { if (storageBlocked) { Alert.alert('Penyimpanan dilindungi', storageWarning); return false; } return true; }
  function saveBudget() {
    if (!canWrite()) return;
    const next = moneyFromInput(budgetInput);
    if (!Number.isSafeInteger(next) || next < 0 || next >= 1e15) { Alert.alert('Nominal tidak valid', 'Isi angka Rupiah yang valid.'); return; }
    try {
      const updated = saveCategory(book, { id: editCategory?.id, label: categoryName, kind: editCategory?.kind || budgetFilter, icon: categoryIcon });
      const id = editCategory?.id || updated.categories[updated.categories.length - 1].id;
      setBook({...updated, budgets: {...updated.budgets, [budgetKey(period, id)]: next}});
      setCategoryEditorVisible(false); setEditCategory(null);
    } catch (error) { Alert.alert('Kategori belum disimpan', String((error as Error).message)); }
  }
  function requestDeleteCategory() {
    if (!canWrite()) return;
    if (!editCategory) return;
    const item = editCategory;
    if (book.entries.some(e => e.categoryId === item.id)) {
      Alert.alert('Kategori masih dipakai', 'Kategori ini mempunyai transaksi. Hapus atau pindahkan transaksinya terlebih dahulu.'); return;
    }
    Alert.alert('Hapus kategori?', `Hapus ${item.label} beserta seluruh target anggarannya?`, [
      {text:'Batal', style:'cancel'},
      {text:'Hapus', style:'destructive', onPress:() => {
        try { setBook(deleteCategory(book, item.id)); setCategoryEditorVisible(false); setEditCategory(null); }
        catch (error) { Alert.alert('Tidak dapat dihapus', String((error as Error).message)); }
      }}
    ]);
  }
  function openAccountEditor(id?: string) {
    const item = book.accounts.find(a => a.id === id);
    setAccountEditor(item?.id || 'new'); setAccountName(item?.label || '');
    setAccountOpening(formatRupiahInput(String(item?.openingBalance || '')));
    setAccountIcon(item?.icon || 'wallet');
    setAccountColor(item?.color || WALLET_COLOR_OPTIONS[book.accounts.length % WALLET_COLOR_OPTIONS.length]);
    setShowAccounts(false);
  }
  function closeAccountEditor() { Keyboard.dismiss(); setAccountEditor(null); setShowAccounts(true); }
  function submitAccount() {
    if (!canWrite()) return;
    const openingBalance = moneyFromInput(accountOpening);
    try {
      setBook(saveAccount(book, {id:accountEditor === 'new' ? undefined : accountEditor || undefined, label:accountName, openingBalance, icon:accountIcon, color:accountColor}));
      closeAccountEditor();
    } catch (error) { Alert.alert('Dompet belum disimpan', String((error as Error).message)); }
  }
  function requestDeleteAccount() {
    if (!canWrite()) return;
    const id = accountEditor;
    if (!id || id === 'new') return;
    const item = book.accounts.find(a => a.id === id);
    if (book.entries.some(e => e.accountId === id)) {
      Alert.alert('Dompet masih digunakan', 'Ada transaksi di dompet ini. Pindahkan atau hapus transaksinya terlebih dahulu agar saldo tetap akurat.'); return;
    }
    Alert.alert('Hapus dompet?', `Hapus ${item?.label || 'dompet ini'} dari daftar akun?`, [
      {text:'Batal',style:'cancel'}, {text:'Hapus',style:'destructive',onPress:() => {
        try { setBook(deleteAccount(book, id)); closeAccountEditor(); }
        catch (error) { Alert.alert('Tidak dapat dihapus', String((error as Error).message)); }
      }}
    ]);
  }
  function goToDay(date: string) {
    if (!validLocalDate(date)) return;
    setPeriod(date.slice(0,7)); setSelectedDate(date);
  }
  function changeVisiblePeriod(next: string) { setPeriod(next); setSelectedDate(null); }
  function openMonthPicker() { setPickerYear(Number(period.slice(0, 4))); setShowMonthPicker(true); }
  function pickMonth(m: number) { changeVisiblePeriod(`${pickerYear}-${String(m).padStart(2, '0')}`); setShowMonthPicker(false); }
  function copyPrevious() {
    if (!canWrite()) return;
    const prev = changePeriod(period, -1);
    const found = book.categories.some(c => (book.budgets[budgetKey(prev, c.id)] || 0) > 0);
    if (!found) { Alert.alert('Tidak ada anggaran', `Belum ada target anggaran pada ${periodLabel(prev)}.`); return; }
    Alert.alert('Salin anggaran?', `Target dari ${periodLabel(prev)} akan disalin ke ${periodLabel(period)}.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Salin', onPress: () => setBook(old => {
        const budgets = { ...old.budgets };
        old.categories.forEach(c => { budgets[budgetKey(period,c.id)] = old.budgets[budgetKey(prev,c.id)] || 0; });
        return { ...old, budgets };
      }) }
    ]);
  }
  function deleteEntry(entry: Entry) {
    if (!canWrite()) return;
    Alert.alert('Hapus transaksi?', `Hapus ${amountText(entry.amount)} dari ${entry.date}?`, [
      { text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: () => setBook(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== entry.id) })) }
    ]);
  }
  async function shareBackup() {
    try {
      if (!safeBook(book)) throw new Error('Data tidak valid untuk di-backup.');
      await Share.share({title: 'Backup Moneo', message: backupJson(book, period)});
    } catch (error) { Alert.alert('Backup gagal', String((error as Error).message)); }
  }
  function restoreBackup() {
    try {
      const parsed = parseBackup(restoreInput.trim(), safeBook);
      Alert.alert('Timpa seluruh data?', `Backup berisi ${parsed.book.entries.length} transaksi, ${parsed.book.accounts.length} dompet, ${parsed.book.categories.length} kategori. Data saat ini akan diganti.`, [
        {text:'Batal',style:'cancel'},
        {text:'Pulihkan',style:'destructive',onPress:() => {
          setBook(removeOldSampleData(normalizeLegacyBook(parsed.book)).book); setPeriod(currentPeriod());
          setSelectedDate(null); setTab('home'); setStorageBlocked(false); setStorageWarning('');
          setRestoreInput(''); setShowRestore(false); setShowSettings(false);
        }}
      ]);
    } catch(error) { Alert.alert('Backup ditolak', String((error as Error).message)); }
  }
  function advancedOpen(action: string, selected = '') {
    if (!canWrite()) return;
    setAdvAction(action); setAdvSelected(selected); setAdvName(''); setAdvAmount('');
    const today=Adv.today();setAdvDate(selectedDate?.startsWith(period)?selectedDate:today.startsWith(period)?today:`${period}-01`); setAdvFrom(book.accounts[0]?.id || '');
    setAdvTo(book.accounts[1]?.id || book.accounts[0]?.id || '');
    setAdvKind('expense'); setAdvCategory(book.categories.find(c=>c.kind==='expense')?.id || '');
    setAdvExtra('');
    const ext:any=Adv.state(book);
    if(action==='goalEdit') {const g=ext.goals.find((x:any)=>x.id===selected);if(g){setAdvName(g.name);setAdvAmount(formatRupiahInput(String(g.target)));setAdvExtra(g.deadline||'');}}
    if(action==='transferEdit') {const t=ext.transfers.find((x:any)=>x.id===selected);if(t){setAdvFrom(t.from);setAdvTo(t.to);setAdvAmount(formatRupiahInput(String(t.amount)));setAdvDate(t.date);setAdvName(t.note||'');}}
    if(action==='recurringEdit') {const r=ext.recurring.find((x:any)=>x.id===selected);if(r){setAdvName(r.name);setAdvAmount(formatRupiahInput(String(r.amount)));setAdvDate(r.startDate);setAdvFrom(r.accountId);setAdvKind(r.kind);setAdvCategory(r.categoryId);}}
  }
  function advancedSave() {
    try {
      if (!canWrite()) return;
      const n = moneyFromInput(advAmount), a = advFrom, target = advTo;
      let next: Book = book;
      if (advAction === 'transfer' || advAction === 'transferEdit') next = Adv.addTransfer(book, {from:a,to:target,amount:n,date:advDate,note:advName},advAction==='transferEdit'?advSelected:undefined);
      else if (advAction === 'goal' || advAction === 'goalEdit') next = Adv.saveGoal(book,{id:advAction==='goalEdit'?advSelected:undefined,name:advName,target:n,deadline:advExtra});
      else if (advAction === 'allocate' || advAction === 'release') next = Adv.allocate(book,{goalId:advSelected,accountId:a,amount:advAction==='release'?-n:n,date:advDate});
      else if (advAction === 'recurring' || advAction === 'recurringEdit') next = Adv.addRecurring(book,{name:advName,kind:advKind,categoryId:advCategory,accountId:a,amount:n,startDate:advDate},advAction==='recurringEdit'?advSelected:undefined);
      else if (advAction === 'debt') next = Adv.addDebt(book,{name:advName,type:advExtra||'payable',accountId:a,principal:n,date:advDate});
      else if (advAction === 'payment') next = Adv.payDebt(book,{debtId:advSelected,accountId:a,amount:n,date:advDate});
      else if (advAction === 'reconcile') {
        if (!/^-?\d{1,14}$/.test(advAmount.trim().replace(/\./g,''))) throw Error('Saldo asli tidak valid.');
        next = Adv.reconcile(book,{accountId:a,actual:Number(advAmount.trim().replace(/\./g,'')),date:advDate});
      }
      setBook(next);setAdvAction(null);
    } catch (e) { Alert.alert('Data belum disimpan',(e as Error).message); }
  }
  function advancedRemove(action:string,id:string) {
    if(!canWrite())return;
    Alert.alert('Konfirmasi penghapusan','Data finansial akan dihitung ulang. Lanjutkan?',[
      {text:'Batal',style:'cancel'},
      {text:'Hapus',style:'destructive',onPress:()=>{try {
        const op: Record<string,(b:Book,k:string)=>Book>={transfer:Adv.deleteTransfer,goal:Adv.deleteGoal,recurring:Adv.deleteRecurring,debt:Adv.deleteDebt,payment:Adv.deletePayment,adjustment:Adv.deleteAdjustment};
        setBook(op[action](book,id));
      }catch(e){Alert.alert('Tidak dapat dihapus',(e as Error).message)}}}
    ]);
  }
  function advancedPost() {
    if(!canWrite())return;
    const cutoff=[Adv.today(),`${period}-${String(new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate()).padStart(2,'0')}`].sort()[0];
    const due=Adv.scheduled(book,cutoff);
    if(!due.length){Alert.alert('Jadwal','Belum ada jadwal jatuh tempo bulan ini.');return;}
    Alert.alert('Catat jadwal berulang?',`${due.length} transaksi akan dibuat sekali saja.`,[
      {text:'Batal',style:'cancel'}, {text:'Catat',onPress:()=>setBook(Adv.postDue(book,cutoff))}
    ]);
  }
  function advancedSwitch(action:string,id:string) {
    if(!canWrite())return;
    try {setBook(Adv.toggleRecurring(book,id));}catch(e){Alert.alert('Gagal',(e as Error).message)}
  }
  const categoryOptions = useMemo(() => book.categories.filter(c => c.kind === addKind), [book.categories, addKind]);
  const screenTitle = tab === 'home' ? 'Beranda' : tab === 'budget' ? 'Anggaran' : tab === 'activity' ? 'Aktivitas' : tab === 'advanced' ? 'Keuangan' : tab === 'goals' ? 'Target' : 'Analisis';
  return <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top','bottom']}>
    <StatusBar barStyle="dark-content" backgroundColor={BG} />
    <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
      <View style={styles.topbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <RNImage source={require('./assets/icon.png')} style={{width:42,height:42,borderRadius:13}} resizeMode="contain" />
          <View><M size={20} weight="900" style={{letterSpacing:-.7,color:'#07583D'}}>Moneo</M><M size={10} color={MUTED} weight="700">KEUANGAN PRIBADI</M></View>
        </View>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton} accessibilityLabel="Pengaturan"><Ico name="settings" size={22} /></Pressable>
      </View>
      <View style={styles.periodBar}><View style={{ gap: 3 }}><M size={10} color={MUTED} weight="700">RINGKASAN</M><M size={14} weight="800">{screenTitle}</M></View><MonthControl period={period} onChange={changeVisiblePeriod} onOpen={openMonthPicker} /></View>
      {Boolean(storageWarning) && <Pressable onPress={() => setShowSettings(true)} style={{padding:10,marginHorizontal:20,marginBottom:8,backgroundColor:'#FFF0DD',borderRadius:12}}><M size={11} color="#95533F" weight="800">Data lokal bermasalah. Buka Pengaturan untuk pemulihan.</M></Pressable>}
      <ScrollView key={tab} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 11, paddingBottom: 112 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === 'home' ? <HomeScreen book={book} period={period} privacy={privacy} setPrivacy={setPrivacy} setTab={setTab} openAdd={openAdd} openAccounts={() => setShowAccounts(true)} width={width} /> :
          tab === 'budget' ? <BudgetScreen book={book} period={period} filter={budgetFilter} setFilter={setBudgetFilter} openEdit={openEdit} openCreate={openCreateCategory} copyPrevious={copyPrevious} privacy={privacy} /> :
          tab === 'activity' ? <ActivityScreen book={book} period={period} privacy={privacy} filter={activityFilter} setFilter={setActivityFilter} search={search} setSearch={setSearch} onDelete={deleteEntry} onEdit={editTransaction} selectedDate={selectedDate} setSelectedDate={setSelectedDate} openCalendar={() => {setCalendarPeriod(period);setShowDayPicker(true)}} goToDay={goToDay} /> :
          tab === 'goals' ? <GoalsScreen book={book} privacy={privacy} onOpen={advancedOpen} onRemove={advancedRemove} /> :
          tab === 'advanced' ? <AdvancedScreen book={book} period={period} privacy={privacy} onOpen={advancedOpen} onRemove={advancedRemove} onPost={advancedPost} onToggle={advancedSwitch} onSetOptions={(options)=>{if(canWrite())try{setBook(Adv.setOptions(book,options))}catch(e){Alert.alert('Pengaturan',(e as Error).message)}}} onSettings={()=>setShowSettings(true)} /> :
          <InsightsScreen book={book} period={period} privacy={privacy} width={width} />}
        <View style={{alignItems: 'center', paddingTop: 24, paddingBottom: 10}} accessibilityLabel="Copyright Na"><M size={10} color={MUTED} weight="700">© 2026 Na · Moneo v1.1.15</M></View>
      </ScrollView>
      <View style={styles.tabbar} accessibilityLabel="Navigasi utama">
        <Pressable style={styles.tabItem} accessibilityLabel="Beranda" onPress={() => setTab('home')}>
          <Ico name="house" size={22} color={tab === 'home' ? PURPLE : MUTED} /><M size={9} weight={tab === 'home' ? '800' : '700'} color={tab === 'home' ? PURPLE : MUTED}>Beranda</M>
        </Pressable>
        <Pressable style={styles.tabItem} accessibilityLabel="Anggaran" onPress={() => setTab('budget')}>
          <Ico name="budget" size={22} color={tab === 'budget' ? PURPLE : MUTED} /><M size={9} weight={tab === 'budget' ? '800' : '700'} color={tab === 'budget' ? PURPLE : MUTED}>Anggaran</M>
        </Pressable>
        <Pressable style={styles.tabItem} accessibilityLabel="Aktivitas" onPress={() => setTab('activity')}>
          <Ico name="activity" size={22} color={tab === 'activity' ? PURPLE : MUTED} /><M size={9} weight={tab === 'activity' ? '800' : '700'} color={tab === 'activity' ? PURPLE : MUTED}>Aktivitas</M>
        </Pressable>
        <Pressable onPress={() => openAdd('expense')} style={styles.tabAddInline} accessibilityLabel="Tambah transaksi" accessibilityRole="button">
          <Ico name="plus" color={WHITE} size={28} />
        </Pressable>
        <Pressable style={styles.tabItem} accessibilityLabel="Analisis" onPress={() => setTab('insights')}>
          <Ico name="insights" size={22} color={tab === 'insights' ? PURPLE : MUTED} /><M size={9} weight={tab === 'insights' ? '800' : '700'} color={tab === 'insights' ? PURPLE : MUTED}>Analisis</M>
        </Pressable>
        <Pressable style={styles.tabItem} accessibilityLabel="Keuangan" onPress={() => setTab('advanced')}>
          <Ico name="wallet" size={22} color={tab === 'advanced' ? PURPLE : MUTED} /><M size={9} weight={tab === 'advanced' ? '800' : '700'} color={tab === 'advanced' ? PURPLE : MUTED}>Keuangan</M>
        </Pressable>
        <Pressable style={styles.tabItem} accessibilityLabel="Target tabungan" onPress={() => setTab('goals')}>
          <Ico name="target" size={21} color={tab === 'goals' ? PURPLE : MUTED} /><M size={9} weight={tab === 'goals' ? '800' : '700'} color={tab === 'goals' ? PURPLE : MUTED}>Target</M>
        </Pressable>
      </View>
    </View>

    <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
      <View style={styles.modalScrim}><KeyboardAvoidingView behavior="padding" style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}>
        <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitle}><View><M size={23} weight="900">{editingEntryId ? "Edit transaksi" : "Tambah transaksi"}</M><M color={MUTED} size={12} style={{ marginTop: 5 }}>Nominal, kategori, dompet, dan tanggal dapat diperbaiki.</M></View><Pressable onPress={() => setShowAdd(false)} style={styles.closeButton}><Ico name="close" /></Pressable></View>
          <ScrollView ref={transactionScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 22 }}>
            <View style={styles.segment}>
              {(['expense','income','saving'] as Kind[]).map(k => <Pressable key={k} onPress={() => { setAddKind(k); setCategoryId(book.categories.find(c => c.kind === k)?.id || ''); }} style={[styles.segmentButton, addKind === k && styles.segmentSelected]}><M size={11} weight="800" color={addKind === k ? INK : MUTED}>{k === 'income' ? 'Pemasukan' : k === 'saving' ? 'Tabungan' : 'Pengeluaran'}</M></Pressable>)}
            </View>
            <M size={12} weight="800" color="#526557" style={{ marginTop: 20 }}>NOMINAL (RUPIAH)</M>
            <View style={styles.amountField}><M size={20} color={PURPLE} weight="800">Rp</M><TextInput value={amountInput} onChangeText={text => setAmountInput(formatRupiahInput(text))} onFocus={() => setTimeout(() => transactionScroll.current?.scrollTo({y:0,animated:true}),250)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#526557" style={styles.amountTextInput} maxLength={18} /></View>
            <M size={12} weight="800" color="#526557" style={{ marginTop: 21, marginBottom: 12 }}>KATEGORI</M>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {categoryOptions.map(c => <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.categoryChip, categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '13' }]}><Ico name={c.icon} size={17} color={c.color} /><M size={11} weight="800">{c.label}</M>{categoryId === c.id && <Ico name="check" size={13} color={c.color} />}</Pressable>)}
            </View>
            <M size={12} weight="800" color="#526557" style={{ marginTop: 21, marginBottom: 12 }}>{addKind === "income" ? "MASUK KE DOMPET" : "DARI DOMPET"}</M>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
              {!book.accounts.length && <Pressable onPress={() => {setShowAdd(false); openAccountEditor();}} style={styles.addSmall}><M size={11} color={WHITE} weight="800">+ Tambah dompet dahulu</M></Pressable>}
              {book.accounts.map(a => <Pressable key={a.id} onPress={() => setAccountId(a.id)} style={[styles.accountChip, accountId === a.id && { borderColor: PURPLE, backgroundColor: BLUSH }]}><Ico name={a.icon} color={a.color} size={16} /><M size={12} weight="800">{a.label}</M></Pressable>)}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
              <View style={{ flex: 1 }}><M size={12} weight="800" color="#526557">TANGGAL</M><TextInput style={styles.input} value={dateInput} onChangeText={setDateInput} onFocus={() => setTimeout(() => transactionScroll.current?.scrollToEnd({animated:true}),250)} maxLength={10} placeholder="YYYY-MM-DD" autoCapitalize="none" /></View>
              <View style={{ flex: 1.4 }}><M size={12} weight="800" color="#526557">CATATAN</M><TextInput style={styles.input} value={noteInput} onChangeText={setNoteInput} onFocus={() => setTimeout(() => transactionScroll.current?.scrollToEnd({animated:true}),250)} maxLength={160} placeholder="Opsional" placeholderTextColor={MUTED} /></View>
            </View>
            <Pressable style={styles.primaryButton} onPress={saveTransaction}><Ico name="check" color={WHITE} size={21} /><M color={WHITE} weight="800" size={14}>{editingEntryId ? "Simpan perubahan" : "Simpan transaksi"}</M></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView></View>
    </Modal>

    <Modal visible={categoryEditorVisible} transparent animationType="fade" onRequestClose={() => setCategoryEditorVisible(false)}>
      <KeyboardAvoidingView style={styles.centerScrim} behavior="padding">
        <View style={[styles.dialog, {maxHeight:'88%'}]}><ScrollView ref={categoryEditorScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}><IconCircle name={categoryIcon} tint={editCategory?.color || PURPLE} /><Pressable onPress={() => setCategoryEditorVisible(false)} style={styles.closeButton}><Ico name="close"/></Pressable></View>
          <M size={22} weight="900" style={{marginTop:16}}>{editCategory ? 'Edit kategori & anggaran' : 'Kategori anggaran baru'}</M>
          <M size={12} color={MUTED} style={{marginTop:7}}>{editCategory?.kind === 'income' || (!editCategory && budgetFilter === 'income') ? 'Pemasukan' : editCategory?.kind === 'saving' || (!editCategory && budgetFilter === 'saving') ? 'Tabungan' : 'Pengeluaran'} · {periodLabel(period)}</M>
          <M size={12} color="#526557" weight="800" style={{marginTop:22}}>IKON KATEGORI</M>
          <View style={styles.iconChoiceGrid}>
            {CATEGORY_ICON_OPTIONS.map(option => <Pressable key={option.name} accessibilityRole="button" accessibilityLabel={`Ikon ${option.label}`} accessibilityState={{selected:categoryIcon === option.name}} onPress={() => setCategoryIcon(option.name)} style={[styles.iconChoice, categoryIcon === option.name && styles.iconChoiceSelected]}><Ico name={option.name} size={20} color={categoryIcon === option.name ? PURPLE : MUTED}/><M size={10} weight="700" color={categoryIcon === option.name ? INK : MUTED}>{option.label}</M></Pressable>)}
          </View>
          <M size={12} color="#526557" weight="800" style={{marginTop:22}}>NAMA KATEGORI</M>
          <TextInput value={categoryName} onChangeText={setCategoryName} onFocus={() => setTimeout(() => categoryEditorScroll.current?.scrollToEnd({animated:true}),250)} maxLength={44} placeholder="Misalnya: Belanja harian" placeholderTextColor={MUTED} style={styles.input}/>
          <M size={12} color="#526557" weight="800" style={{marginTop:19}}>TARGET BULAN INI (RP)</M>
          <M size={11} color={MUTED} style={{marginTop:7}}>Isi 0 untuk menghapus target bulan ini tanpa menghapus kategori.</M>
          <View style={styles.amountField}><M size={18} color={PURPLE} weight="800">Rp</M><TextInput value={budgetInput} onChangeText={text => setBudgetInput(formatRupiahInput(text))} onFocus={() => setTimeout(() => categoryEditorScroll.current?.scrollToEnd({animated:true}), 250)} keyboardType="number-pad" placeholder="0" style={styles.amountTextInput} maxLength={18}/></View>
          <Pressable style={styles.primaryButton} onPress={saveBudget}><Ico name="check" color={WHITE} size={19}/><M color={WHITE} size={14} weight="800">{editCategory ? 'Simpan perubahan' : 'Tambah kategori'}</M></Pressable>
          {editCategory && <Pressable style={styles.dangerButton} onPress={requestDeleteCategory}><Ico name="trash" color="#A7424B" size={17}/><M color="#A7424B" size={13} weight="800">Hapus kategori</M></Pressable>}
        </ScrollView></View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={advAction !== null} transparent animationType="slide" onRequestClose={()=>setAdvAction(null)}>
      <KeyboardAvoidingView style={styles.modalScrim} behavior="padding">
        <View style={[styles.modalSheet,{maxHeight:'90%'}]}>
          <View style={styles.modalTitle}><View style={{flex:1}}><M size={22} weight="900">{({transfer:'Transfer antar-dompet',transferEdit:'Edit transfer',goal:'Target tabungan',goalEdit:'Edit target tabungan',allocate:'Alokasikan tabungan',release:'Lepas alokasi',recurring:'Transaksi bulanan',recurringEdit:'Edit jadwal bulanan',debt:'Utang / piutang',payment:'Catat pelunasan',reconcile:'Rekonsiliasi saldo'} as Record<string,string>)[advAction||'']}</M><M color={MUTED} size={12} style={{marginTop:5}}>Semuanya disimpan pada perangkat. Tidak menggunakan layanan berbayar.</M></View><Pressable onPress={()=>setAdvAction(null)} style={styles.closeButton}><Ico name="close"/></Pressable></View>
          <ScrollView ref={advancedScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{paddingBottom:20}}>
            {['goal','goalEdit','recurring','recurringEdit','debt','transfer','transferEdit'].includes(advAction||'') && <><M size={11} color={MUTED} weight="800">{['transfer','transferEdit'].includes(advAction||'')?'CATATAN (OPSIONAL)':'NAMA'}</M><TextInput value={advName} onChangeText={setAdvName} onFocus={() => setTimeout(() => advancedScroll.current?.scrollTo({y:0,animated:true}),250)} style={styles.input} placeholder={['goal','goalEdit'].includes(advAction||'')?'Dana darurat':['recurring','recurringEdit'].includes(advAction||'')?'Gaji bulanan':'Keterangan'}/></>}
            {advAction==='debt' && <View style={{flexDirection:'row',gap:8,marginVertical:10}}>{([['payable','Saya berutang'],['receivable','Saya memberi pinjaman']] as const).map(([k,title])=><Pressable key={k} onPress={()=>setAdvExtra(k)} style={[styles.chip,(advExtra||'payable')===k&&styles.chipSelected]}><M size={11} weight="800" color={(advExtra||'payable')===k?WHITE:INK}>{title}</M></Pressable>)}</View>}
            {['recurring','recurringEdit'].includes(advAction||'') && <View style={{marginTop:12}}><M size={11} weight="800" color={MUTED}>JENIS TRANSAKSI</M><View style={{flexDirection:'row',gap:7,marginTop:8}}>{(['expense','income','saving'] as Kind[]).map(k=><Pressable key={k} style={[styles.chip,advKind===k&&styles.chipSelected]} onPress={()=>{setAdvKind(k);setAdvCategory(book.categories.find(c=>c.kind===k)?.id||'')}}><M size={11} color={advKind===k?WHITE:INK}>{k==='expense'?'Keluar':k==='income'?'Masuk':'Tabungan'}</M></Pressable>)}</View><M size={11} weight="800" color={MUTED} style={{marginTop:15}}>KATEGORI</M>{book.categories.filter(c=>c.kind===advKind).map(c=><Pressable key={c.id} onPress={()=>setAdvCategory(c.id)} style={[styles.chip,{marginTop:5,alignSelf:'flex-start'},advCategory===c.id&&styles.chipSelected]}><M color={advCategory===c.id?WHITE:INK} size={11}>{c.label}</M></Pressable>)}</View>}
            {!['goal','goalEdit'].includes(advAction||'') && <><M size={11} color={MUTED} weight="800" style={{marginTop:16}}>{advAction==='reconcile'?'DOMPET YANG DICOCOKKAN':['transfer','transferEdit'].includes(advAction||'')?'DOMPET ASAL':'DOMPET'}</M><View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:10}}>{book.accounts.map(a=><Pressable key={a.id} style={[styles.chip,advFrom===a.id&&styles.chipSelected]} onPress={()=>setAdvFrom(a.id)}><M size={11} color={advFrom===a.id?WHITE:INK}>{a.label}</M></Pressable>)}</View></>}
            {['transfer','transferEdit'].includes(advAction||'') && <><M size={11} color={MUTED} weight="800" style={{marginTop:16}}>DOMPET TUJUAN</M><View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:10}}>{book.accounts.map(a=><Pressable key={a.id} style={[styles.chip,advTo===a.id&&styles.chipSelected]} onPress={()=>setAdvTo(a.id)}><M size={11} color={advTo===a.id?WHITE:INK}>{a.label}</M></Pressable>)}</View></>}
            <M size={11} color={MUTED} weight="800" style={{marginTop:17}}>{advAction==='reconcile'?'SALDO AKTUAL':['goal','goalEdit'].includes(advAction||'')?'TARGET TABUNGAN':'NOMINAL RUPIAH'}</M><View style={styles.amountField}><M size={17} color={PURPLE} weight="800">Rp</M><TextInput value={advAmount} onChangeText={text => setAdvAmount(formatRupiahInput(text, advAction === 'reconcile'))} onFocus={() => setTimeout(() => advancedScroll.current?.scrollToEnd({animated:true}),250)} keyboardType="numeric" style={styles.amountTextInput} placeholder="0" maxLength={18}/></View>
            {['goal','goalEdit'].includes(advAction||'') ? <><M size={11} color={MUTED} weight="800" style={{marginTop:15}}>TENGGAT (OPSIONAL, YYYY-MM-DD)</M><TextInput value={advExtra} onChangeText={setAdvExtra} onFocus={() => setTimeout(() => advancedScroll.current?.scrollToEnd({animated:true}),250)} style={styles.input} placeholder="2027-12-31"/></> : <><M size={11} color={MUTED} weight="800" style={{marginTop:15}}>{['recurring','recurringEdit'].includes(advAction||'')?'TANGGAL MULAI (YYYY-MM-DD)':'TANGGAL (YYYY-MM-DD)'}</M><TextInput value={advDate} onChangeText={setAdvDate} onFocus={() => setTimeout(() => advancedScroll.current?.scrollToEnd({animated:true}),250)} style={styles.input} placeholder="2026-11-17"/></>}
            <Pressable style={styles.primaryButton} onPress={advancedSave}><M color={WHITE} size={14} weight="800">Simpan</M></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={showAccounts || accountEditor !== null} transparent animationType="slide" onRequestClose={() => accountEditor !== null ? closeAccountEditor() : setShowAccounts(false)}>
      <KeyboardAvoidingView style={styles.modalScrim} behavior="padding">
        {accountEditor === null ? <View style={[styles.modalSheet, {maxHeight:'88%'}]}>
        <View style={styles.modalHandle} /><View style={styles.modalTitle}><View style={{flex:1}}><M size={23} weight="900">Dompet & rekening</M><M size={12} color={MUTED} style={{marginTop:5}}>Kelola akun dan lihat saldo transaksi.</M></View><Pressable onPress={() => setShowAccounts(false)} style={styles.closeButton}><Ico name="close" /></Pressable></View>
        <Pressable onPress={() => openAccountEditor()} style={[styles.addSmall, {alignSelf:'flex-start', marginBottom:12, paddingHorizontal:16, paddingVertical:11}]}><Ico name="plus" color={WHITE} size={17}/><M color={WHITE} size={12} weight="800">Tambah dompet / rekening</M></Pressable>
        <ScrollView style={{maxHeight:440}} contentContainerStyle={{paddingBottom:18}}>
          {!book.accounts.length && <Empty text="Belum ada dompet. Buat satu untuk mulai mencatat." icon="wallet"/>}
          {book.accounts.map(a => <Pressable accessibilityLabel={`Edit dompet ${a.label}`} onPress={() => openAccountEditor(a.id)} key={a.id} style={styles.accountRow}>
            <IconCircle name={a.icon} tint={a.color} size={43}/><View style={{flex:1,gap:4}}><M size={14} weight="800">{a.label}</M><M size={10} color={MUTED}>Ketuk untuk edit atau hapus</M></View>
            <View style={{alignItems:'flex-end',gap:6}}><M size={12} weight="900">{privacy ? '••••' : amountText(accountBalance(book,a.id))}</M><Ico name="pencil" size={15} color={PURPLE}/></View>
          </Pressable>)}
        </ScrollView>

        </View> : <View style={[styles.modalSheet,{paddingTop:25,maxHeight:'92%'}]}>
          <ScrollView ref={accountEditorScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><IconCircle name={accountIcon} tint={accountColor}/><Pressable onPress={closeAccountEditor} style={styles.closeButton}><Ico name="close"/></Pressable></View>
          <M size={22} weight="900" style={{marginTop:17}}>{accountEditor === 'new' ? 'Tambah dompet' : 'Edit dompet'}</M>
          <M size={12} color={MUTED} style={{marginTop:6}}>Rekening bank, uang tunai, atau e-wallet.</M>
          <M size={12} color="#526557" weight="800" style={{marginTop:20}}>IKON DOMPET</M>
          <ScrollView horizontal nestedScrollEnabled keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator contentContainerStyle={{gap:8,paddingVertical:10}}>
            {WALLET_ICON_OPTIONS.map(option => <Pressable key={option.name} accessibilityRole="button" accessibilityLabel={`Ikon dompet ${option.label}`} accessibilityState={{selected:accountIcon === option.name}} onPress={() => setAccountIcon(option.name)} style={[styles.walletIconChoice,accountIcon === option.name && styles.iconChoiceSelected]}><Ico name={option.name} size={20} color={accountIcon === option.name ? accountColor : MUTED}/><M size={10} weight="700" color={accountIcon === option.name ? INK : MUTED}>{option.label}</M></Pressable>)}
          </ScrollView>
          <M size={12} color="#526557" weight="800" style={{marginTop:9}}>WARNA IKON</M>
          <View style={styles.walletColorChoices}>
            {WALLET_COLOR_OPTIONS.map(color => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Warna ikon ${color}`} accessibilityState={{selected:accountColor === color}} onPress={() => setAccountColor(color)} style={[styles.walletColorChoice,{backgroundColor:color},accountColor === color && styles.walletColorChoiceSelected]}>{accountColor === color && <Ico name="check" size={17} color={WHITE}/>}</Pressable>)}
          </View>
          <M size={12} color="#526557" weight="800" style={{marginTop:20}}>NAMA DOMPET / REKENING</M>
          <TextInput value={accountName} onChangeText={setAccountName} onFocus={() => setTimeout(() => accountEditorScroll.current?.scrollTo({y:130,animated:true}),250)} maxLength={44} placeholder="Contoh: BCA, ShopeePay, Dompet liburan" style={styles.input}/>
          <M size={12} color="#526557" weight="800" style={{marginTop:19}}>SALDO AWAL (RP)</M>
          <View style={styles.amountField}><M size={18} color={PURPLE} weight="800">Rp</M><TextInput value={accountOpening} onChangeText={text => setAccountOpening(formatRupiahInput(text))} onFocus={() => setTimeout(() => accountEditorScroll.current?.scrollToEnd({animated:true}),250)} keyboardType="number-pad" placeholder="0" style={styles.amountTextInput} maxLength={18}/></View>
          <M size={11} color={MUTED} style={{lineHeight:17,marginTop:10}}>Saldo awal ditambah pemasukan, dikurangi pengeluaran dan tabungan dari semua transaksi akun ini.</M>
          <Pressable onPress={submitAccount} style={styles.primaryButton}><Ico name="check" color={WHITE} size={19}/><M size={14} weight="800" color={WHITE}>Simpan dompet</M></Pressable>
          {accountEditor !== 'new' && <Pressable onPress={requestDeleteAccount} style={styles.dangerButton}><Ico name="trash" color="#A7424B" size={18}/><M color="#A7424B" size={13} weight="800">Hapus dompet</M></Pressable>}

          </ScrollView>
        </View>}
      </KeyboardAvoidingView>
    </Modal>

    <Modal visible={showDayPicker} transparent animationType="fade" onRequestClose={() => setShowDayPicker(false)}>
      <View style={styles.centerScrim}><View style={[styles.dialog,{maxHeight:'88%'}]}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}><View style={{flex:1,gap:5}}><M size={21} weight="900">Kalender transaksi</M><M color={MUTED} size={12}>Ketuk tanggal untuk melihat aktivitas harian.</M></View><Pressable style={styles.closeButton} onPress={() => setShowDayPicker(false)}><Ico name="close"/></Pressable></View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:18}}>
          <Pressable accessibilityLabel="Kalender bulan sebelumnya" onPress={() => setCalendarPeriod(changePeriod(calendarPeriod,-1))} style={styles.closeButton}><Ico name="back" color={PURPLE}/></Pressable>
          <M size={17} weight="900">{periodLabel(calendarPeriod)}</M>
          <Pressable accessibilityLabel="Kalender bulan berikutnya" onPress={() => setCalendarPeriod(changePeriod(calendarPeriod,1))} style={styles.closeButton}><Ico name="next" color={PURPLE}/></Pressable>
        </View>
        <View style={{flexDirection:'row'}}>{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(label => <View key={label} style={{width:'14.285%',alignItems:'center',paddingVertical:8}}><M size={11} weight="800" color={MUTED}>{label}</M></View>)}</View>
        <View style={{flexDirection:'row',flexWrap:'wrap'}}>{calendarDays(calendarPeriod).map((date,i) => {
          const count = date ? book.entries.filter(e => e.date === date).length+(Adv.state(book).transfers as any[]).filter((t:any)=>t.date===date).length : 0;
          const selected = date !== null && date === selectedDate;
          return <View key={date || `empty-${i}`} style={{width:'14.285%',padding:2}}>{date ? <Pressable accessibilityLabel={`${fullDateLabel(date)}, ${count} transaksi`} onPress={() => {goToDay(date);setShowDayPicker(false)}} style={[styles.calendarCell,selected && {backgroundColor:PURPLE}]}><M color={selected?WHITE:INK} size={13} weight="800">{Number(date.slice(8))}</M>{count ? <View style={{width:5,height:5,borderRadius:3,backgroundColor:selected?WHITE:GREEN,marginTop:4}}/> : <View style={{height:9}}/>}</Pressable> : <View style={{height:48}}/>}</View>
        })}</View>
        <View style={{marginTop:16,flexDirection:'row',gap:10}}>
          <Pressable style={styles.dayAll} onPress={() => {setPeriod(calendarPeriod);setSelectedDate(null);setShowDayPicker(false)}}><M size={12} color={PURPLE} weight="800">Semua tanggal</M></Pressable>
          <Pressable style={[styles.dayAll,{backgroundColor:BLUSH}]} onPress={() => {const n=new Date();goToDay(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`);setShowDayPicker(false)}}><M size={12} color={PURPLE} weight="800">Hari ini</M></Pressable>
        </View>
        <M size={10} color={MUTED} style={{marginTop:12}}>Titik hijau menunjukkan tanggal dengan transaksi.</M>
      </View></View>
    </Modal>

    <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
      <View style={styles.centerScrim}><View style={styles.dialog}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View><M size={22} weight="900">Pilih bulan</M><M size={12} color={MUTED} style={{marginTop:5}}>Pilih bulan dan tahun untuk laporan.</M></View><Pressable style={styles.closeButton} onPress={() => setShowMonthPicker(false)}><Ico name="close"/></Pressable></View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:22}}>
          <Pressable accessibilityLabel="Tahun sebelumnya" onPress={() => setPickerYear(y => Math.max(1900,y-1))} style={styles.closeButton}><Ico name="back"/></Pressable>
          <M size={20} weight="900">{pickerYear}</M>
          <Pressable accessibilityLabel="Tahun berikutnya" onPress={() => setPickerYear(y => Math.min(2100,y+1))} style={styles.closeButton}><Ico name="next"/></Pressable>
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
          {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((name,i) => {
            const selected = period === `${pickerYear}-${String(i+1).padStart(2,'0')}`;
            return <Pressable key={name} accessibilityLabel={`Pilih ${name} ${pickerYear}`} onPress={() => pickMonth(i+1)} style={[styles.monthTile,selected && {backgroundColor:PURPLE}]}><M size={13} weight="800" color={selected?WHITE:INK}>{name}</M></Pressable>;
          })}
        </View>
      </View></View>
    </Modal>

    <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
      <View style={styles.centerScrim}><View style={[styles.dialog,{maxHeight:'88%',width:'100%'}]}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><IconCircle name="settings" tint={PURPLE} /><Pressable onPress={() => setShowSettings(false)} style={styles.closeButton}><Ico name="close" /></Pressable></View>
        <M size={22} weight="900" style={{ marginTop: 17 }}>Tentang Moneo</M><M color={MUTED} size={12} style={{ lineHeight: 19, marginTop: 10 }}>Aplikasi keuangan pribadi Android & iOS. Data saat ini tersimpan lokal pada perangkat, tanpa akun, cloud, atau integrasi bank. File Excel/VBA tidak dieksekusi.</M>
        <View style={styles.infoRow}><Ico name="info" color={GREEN} size={19} /><M size={12} color="#536358" style={{ flex: 1 }}>Mulai dari data kosong. Semua transaksi dan target anggaran yang kamu buat tersimpan lokal di perangkat.</M></View>
        {Boolean(storageWarning) && <M color="#943D36" size={12} style={{lineHeight:19,marginTop:14}}>Peringatan penyimpanan: {storageWarning}</M>}
        <Pressable accessibilityRole="button" accessibilityLabel={widgetAmountsVisible?'Sembunyikan angka di widget layar utama':'Tampilkan angka di widget layar utama'} onPress={() => setWidgetAmountsVisible(value=>!value)} style={{marginTop:16,paddingVertical:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <M size={12} color={INK} weight="700">Privasi nominal layar utama</M>
          <M size={12} color={PURPLE} weight="900">{widgetAmountsVisible?'Terlihat':'Disembunyikan'}</M>
        </Pressable>
        <M size={13} weight="900" style={{marginTop:18}}>Backup & pemulihan</M>
        <M color={MUTED} size={11} style={{lineHeight:17,marginTop:7}}>Bagikan backup JSON ke penyimpanan pribadi. Untuk pemulihan, tempel isi backup JSON. Jangan bagikan ke orang lain karena berisi catatan keuangan.</M>
        <Pressable onPress={shareBackup} style={[styles.primaryButton, {marginTop:12}]}><Ico name="wallet" color={WHITE} size={18}/><M color={WHITE} size={13} weight="800">Bagikan backup JSON</M></Pressable>
        <Pressable onPress={() => {setShowSettings(false);setShowRestore(true);}} style={[styles.primaryButton, {backgroundColor:MINT, marginTop:8}]}><Ico name="budget" color={GREEN} size={18}/><M color={GREEN} size={13} weight="800">Pulihkan dari teks JSON</M></Pressable>
        <M size={11} color={MUTED} weight="700" style={{ textAlign: 'center', marginTop: 18 }}>© 2026 Na. All rights reserved.</M>
      </ScrollView></View></View>
    </Modal>

    <Modal visible={showRestore} transparent animationType="slide" onRequestClose={() => setShowRestore(false)}>
      <View style={styles.modalScrim}><KeyboardAvoidingView behavior="padding" style={{width:'100%',justifyContent:'flex-end',flex:1}}>
        <View style={[styles.modalSheet,{maxHeight:'85%'}]}><View style={styles.modalHandle}/>
          <View style={styles.modalTitle}><View style={{flex:1}}><M size={21} weight="900">Pulihkan backup</M><M color={MUTED} size={12} style={{marginTop:7}}>Tempel isi JSON backup Moneo. Tidak terhubung dengan backup browser.</M></View><Pressable onPress={() => setShowRestore(false)} style={styles.closeButton}><Ico name="close"/></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput value={restoreInput} onChangeText={setRestoreInput} placeholder="Tempel JSON backup di sini…" multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} style={[styles.input,{minHeight:190,maxHeight:300,fontSize:12}]} />
            <M color="#8F4B45" size={11} style={{lineHeight:18,marginTop:10}}>Pemulihan akan mengganti seluruh data lokal setelah konfirmasi. Simpan backup data sekarang terlebih dahulu.</M>
            <Pressable style={styles.primaryButton} onPress={restoreBackup}><Ico name="check" color={WHITE} size={18}/><M color={WHITE} size={13} weight="800">Periksa dan pulihkan</M></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView></View>
    </Modal>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><AppCore /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  topbar: { paddingHorizontal: 21, paddingTop: 11, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: 41, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  logoDot: { position: 'absolute', right: 8, bottom: 9, backgroundColor: '#BCE778', height: 5, width: 5, borderRadius: 3 },
  settingsButton: { width: 39, height: 39, borderRadius: 12, backgroundColor: WHITE, borderWidth: 1, borderColor: '#ECEDE7', alignItems: 'center', justifyContent: 'center' },
  periodBar: { flexDirection: 'row', paddingHorizontal: 21, paddingBottom: 12, justifyContent: 'space-between', alignItems: 'center' },
  monthControl: { backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', borderRadius: 13, gap: 12, paddingHorizontal: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#E8EBE4' },
  panel: { backgroundColor: WHITE, borderRadius: 19, padding: 18, borderWidth: 1, borderColor: '#ECEDE7' },
  sectionHead: { marginTop: 27, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hero: { minHeight: 184, borderRadius: 24, padding: 22, overflow: 'hidden' },
  heroButton: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 11, flexDirection: 'row', gap: 5, backgroundColor: '#B8326B', alignItems: 'center' },
  overviewGrid: { flexDirection: 'row', marginTop: 15, paddingVertical: 15, backgroundColor: WHITE, borderRadius: 17, borderWidth: 1, borderColor: '#ECEDE7' },
  miniCard: { flex: 1, paddingHorizontal: 12, minHeight: 0 },
  miniCardDivider: { borderRightWidth: 1, borderRightColor: '#E8EBE4' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  quickAction: { backgroundColor: 'transparent', borderRadius: 14, flex: 1, height: 92, alignItems: 'center', justifyContent: 'center', gap: 9 },
  percentPill: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  legend: { flexDirection: 'row', gap: 6, alignItems: 'center' }, legendDot: { height: 7, width: 7, borderRadius: 4 },
  accountPreview: { borderRadius: 17, padding: 14, backgroundColor: WHITE, borderWidth: 1, borderColor: '#ECEDE7' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 11, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: '#E8EBE4' },
  tabbar: { backgroundColor: WHITE, height: 86, paddingTop: 9, paddingBottom: 7, paddingHorizontal: 3, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E8EBE4' },
  tabItem: { flex: 1, minWidth: 0, height: 53, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabAddInline: { width: 50, height: 50, borderRadius: 16, marginBottom: 8, borderWidth: 3, borderColor: WHITE, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: .16, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  segment: { flexDirection: 'row', borderRadius: 13, padding: 4, backgroundColor: '#EBEEE8', gap: 5 },
  segmentButton: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  segmentSelected: { backgroundColor: WHITE, ...SHADOW },
  budgetHero: { borderRadius: 23, padding: 20, marginTop: 18 },
  budgetCategory: { flexDirection: 'row', gap: 13, paddingVertical: 17, alignItems: 'center' },
  copyCard: { marginTop: 14, backgroundColor: WHITE, borderRadius: 15, borderWidth: 1, borderColor: '#DCE9DA', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayOpenButton: {borderRadius:11, backgroundColor:'#F9EAF0', paddingHorizontal:12,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:6},
  dayNav: {width:37,height:35,borderRadius:11,backgroundColor:'#F3F4EC',alignItems:'center',justifyContent:'center'},
  dayAll: {flex:1,paddingVertical:10,paddingHorizontal:12,borderRadius:11,backgroundColor:'#F7F5EF',alignItems:'center',justifyContent:'center'},
  calendarCell: {height:48,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#F6F5EF'},
  chip: { paddingVertical: 11, paddingHorizontal: 16, backgroundColor: WHITE, borderRadius: 12 }, chipSelected: { backgroundColor: PURPLE },
  searchBox: { backgroundColor: WHITE, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, paddingVertical: 15, fontSize: 12, color: INK },
  insightHero: { borderRadius: 24, padding: 23 },
  modalScrim: { flex: 1, backgroundColor: '#153B2C80', justifyContent: 'flex-end' },
  centerScrim: { flex: 1, backgroundColor: '#153B2C88', justifyContent: 'center', paddingHorizontal: 20 },
  modalSheet: { backgroundColor: WHITE, paddingHorizontal: 21, borderTopLeftRadius: 29, borderTopRightRadius: 29, paddingBottom: 25, paddingTop: 10 },
  modalHandle: { width: 43, height: 5, borderRadius: 9, backgroundColor: '#D9DFD6', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  closeButton: { height: 37, width: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#F3F4EC' },
  dialog: { padding: 23, borderRadius: 27, backgroundColor: WHITE },
  amountField: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#F8EAF0', padding: 15, borderRadius: 15, marginTop: 10 },
  amountTextInput: { flex: 1, paddingVertical: 5, fontSize: 28, fontWeight: '900', color: INK },
  categoryChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1.2, borderColor: '#E2E8DF', gap: 7, flexDirection: 'row', alignItems: 'center' },
  iconChoiceGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:10 },
  iconChoice: { width:'22.5%', flexGrow:1, minHeight:62, borderRadius:12, borderWidth:1, borderColor:'#E2E8DF', alignItems:'center', justifyContent:'center', gap:5, backgroundColor:WHITE },
  iconChoiceSelected: { borderColor:PURPLE, backgroundColor:BLUSH },
  walletIconChoice: { width:68, minHeight:64, borderRadius:12, borderWidth:1, borderColor:'#E2E8DF', alignItems:'center', justifyContent:'center', gap:5, backgroundColor:WHITE },
  walletColorChoices: { flexDirection:'row', flexWrap:'wrap', gap:9, marginTop:10 },
  walletColorChoice: { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:WHITE },
  walletColorChoiceSelected: { borderColor:INK },
  accountChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1.2, borderColor: '#E2E8DF', flexDirection: 'row', gap: 7, alignItems: 'center' },
  input: { borderRadius: 11, paddingHorizontal: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#DEE5DB', color: INK, fontSize: 12, marginTop: 11 },
  primaryButton: { borderRadius: 16, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, padding: 17, marginTop: 23 },
  accountRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F3F8' },
  addSmall: { flexDirection:'row', alignItems:'center', gap:5, borderRadius:12, backgroundColor:PURPLE, paddingHorizontal:12, paddingVertical:9 },
  dangerButton: { marginTop:12, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderRadius:14, backgroundColor:'#FFF0F0', paddingVertical:15 },
  monthTile: { width:'22.5%', flexGrow:1, alignItems:'center', justifyContent:'center', borderRadius:11, backgroundColor:'#F3F3EC', paddingVertical:16 },
  infoRow: { flexDirection: 'row', gap: 10, backgroundColor: MINT, borderRadius: 12, padding: 14, marginTop: 17, alignItems: 'center' }
});
