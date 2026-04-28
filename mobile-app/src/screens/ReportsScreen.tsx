import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Radius, Spacing} from '../utils/theme';
import {fmt, fmtTime, today} from '../utils/helpers';
import {useHisaabStore, useFilteredTxns} from '../store/useHisaabStore';

const {width} = Dimensions.get('window');
type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: {key: Period; label: string}[] = [
  {key: 'today', label: 'Today'},
  {key: 'week',  label: 'Week'},
  {key: 'month', label: 'Month'},
  {key: 'all',   label: 'All'},
];

const TXN_IC: Record<string, string> = {sale: '💰', expense: '🧾', credit: '📒'};
const TXN_BG: Record<string, string> = {
  sale:    Colors.primaryFade,
  expense: Colors.redFade,
  credit:  Colors.amberFade,
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('today');

  // ✅ useFilteredTxns is a custom Zustand selector hook
  //    It only re-renders when transactions change — not settings, customers, etc.
  const txns = useFilteredTxns(period);

  // For the bar chart we need raw transactions to compute 7-day history
  const allTxns = useHisaabStore(s => s.transactions);

  const income  = txns.filter(t => t.type === 'sale')   .reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const profit  = income - expense;

  // ── Bar chart data (last 7 days) ──
  const days = Array.from({length: 7}, (_, i) => {
    const d  = new Date(Date.now() - (6 - i) * 86400000);
    const ds = d.toISOString().split('T')[0];
    const inc = allTxns.filter(t => t.date === ds && t.type === 'sale')   .reduce((s, t) => s + t.amount, 0);
    const exp = allTxns.filter(t => t.date === ds && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {ds, inc, exp, lbl: d.toLocaleDateString([], {weekday: 'short'}).slice(0, 2)};
  });
  const maxVal = Math.max(...days.map(d => Math.max(d.inc, d.exp)), 1);

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.hdr}><Text style={styles.title}>Reports</Text></View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period tabs */}
        <View style={styles.tabs}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.tab, period === p.key && styles.tabOn]}
              onPress={() => setPeriod(p.key)}>
              <Text style={[styles.tabTxt, period === p.key && styles.tabTxtOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            {label: 'INCOME',       val: fmt(income),  color: Colors.primary, sub: txns.filter(t=>t.type==='sale').length + ' sales'},
            {label: 'EXPENSES',     val: fmt(expense), color: Colors.red,     sub: txns.filter(t=>t.type==='expense').length + ' items'},
            {label: 'NET PROFIT',   val: fmt(profit),  color: profit >= 0 ? Colors.primary : Colors.red, sub: 'balance'},
            {label: 'TRANSACTIONS', val: String(txns.length), color: Colors.t1, sub: 'total entries'},
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLbl}>{s.label}</Text>
              <Text style={[styles.statVal, {color: s.color}]}>{s.val}</Text>
              <Text style={styles.statSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income vs Expenses — Last 7 days</Text>
          <View style={styles.barsRow}>
            {days.map(d => (
              <View key={d.ds} style={styles.barCol}>
                <View style={styles.barPair}>
                  <View style={[styles.bar, styles.barInc, {height: Math.max((d.inc / maxVal) * BAR_H, d.inc > 0 ? 4 : 0)}]} />
                  <View style={[styles.bar, styles.barExp, {height: Math.max((d.exp / maxVal) * BAR_H, d.exp > 0 ? 4 : 0)}]} />
                </View>
                <Text style={styles.barDay}>{d.lbl}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legItem}><View style={[styles.legDot, {backgroundColor: Colors.primary}]} /><Text style={styles.legTxt}>Income</Text></View>
            <View style={styles.legItem}><View style={[styles.legDot, {backgroundColor: Colors.red}]}     /><Text style={styles.legTxt}>Expenses</Text></View>
          </View>
        </View>

        {/* Transaction list */}
        <View style={styles.secHdr}><Text style={styles.secTitle}>Transactions</Text></View>

        {txns.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIc}>📊</Text>
            <Text style={styles.emptyT}>No data for this period</Text>
          </View>
        ) : (
          [...txns].sort((a, b) => b.time - a.time).map(t => (
            <View key={t.id} style={styles.txnCard}>
              <View style={[styles.txnIc, {backgroundColor: TXN_BG[t.type] || Colors.blueFade}]}>
                <Text style={styles.txnIcTxt}>{TXN_IC[t.type] || '💳'}</Text>
              </View>
              <View style={styles.txnMid}>
                <Text style={styles.txnName}>{t.desc}</Text>
                <Text style={styles.txnMeta}>{fmtTime(t.time)}</Text>
              </View>
              <Text style={[styles.txnAmt, {color: t.type === 'expense' ? Colors.red : Colors.primary}]}>
                {t.type === 'expense' ? '−' : '+'}{fmt(t.amount)}
              </Text>
            </View>
          ))
        )}
        <View style={{height: 24}} />
      </ScrollView>
    </View>
  );
}

const C2 = (width - 32 - 10) / 2;
const BAR_H = 68;

const styles = StyleSheet.create({
  root:       {flex: 1, backgroundColor: Colors.bg},
  hdr:        {paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md},
  title:      {fontSize: 24, fontWeight: '800', color: Colors.t1, letterSpacing: -0.5},
  tabs:       {flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.xl, backgroundColor: Colors.bg4, borderRadius: Radius.md, padding: 4},
  tab:        {flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center'},
  tabOn:      {backgroundColor: Colors.card, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3},
  tabTxt:     {fontSize: 11, fontWeight: '600', color: Colors.t3},
  tabTxtOn:   {color: Colors.primary},
  statsGrid:  {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg},
  statCard:   {width: C2, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 16},
  statLbl:    {fontSize: 9, color: Colors.t4, fontWeight: '700', letterSpacing: 0.06, marginBottom: 6},
  statVal:    {fontSize: 20, fontWeight: '800', letterSpacing: -0.5},
  statSub:    {fontSize: 10, color: Colors.t3, marginTop: 3},
  chartCard:  {backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: 18},
  chartTitle: {fontSize: 12, fontWeight: '700', color: Colors.t2, marginBottom: 16},
  barsRow:    {flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 88},
  barCol:     {flex: 1, alignItems: 'center', gap: 4},
  barPair:    {flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: BAR_H},
  bar:        {width: 9, borderRadius: 3},
  barInc:     {backgroundColor: Colors.primary},
  barExp:     {backgroundColor: Colors.red},
  barDay:     {fontSize: 8, color: Colors.t4},
  legend:     {flexDirection: 'row', gap: 14, marginTop: 10},
  legItem:    {flexDirection: 'row', alignItems: 'center', gap: 5},
  legDot:     {width: 8, height: 8, borderRadius: 2},
  legTxt:     {fontSize: 10, color: Colors.t3},
  secHdr:     {paddingHorizontal: Spacing.lg, marginBottom: 12},
  secTitle:   {fontSize: 13, fontWeight: '700', color: Colors.t1},
  txnCard:    {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border},
  txnIc:      {width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  txnIcTxt:   {fontSize: 18},
  txnMid:     {flex: 1},
  txnName:    {fontSize: 13, fontWeight: '600', color: Colors.t1},
  txnMeta:    {fontSize: 10, color: Colors.t3, marginTop: 2},
  txnAmt:     {fontSize: 14, fontWeight: '700'},
  empty:      {alignItems: 'center', padding: 40},
  emptyIc:    {fontSize: 44, marginBottom: 10, opacity: 0.5},
  emptyT:     {fontSize: 14, fontWeight: '700', color: Colors.t2},
});
