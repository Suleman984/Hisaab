import React, {useState} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Radius, Spacing, AVATAR_COLORS} from '../utils/theme';
import {fmt, fmtTime, initials, getGreeting} from '../utils/helpers';

/**
 * ✅ Zustand benefit demonstrated here:
 *
 * OLD (Context): const { state, getTodayStats } = useApp()
 *   → This component re-renders whenever ANY part of state changes
 *     (customers, settings, language, etc.) — even if unrelated
 *
 * NEW (Zustand): individual slice hooks
 *   → useShopName()  re-renders ONLY when shopName changes
 *   → useDayStats()  re-renders ONLY when transactions change
 *   → No Provider needed anywhere
 */
import {
  useShopName,
  useTransactions,
  useDayStats,
  useAddTransaction,
  TxnType,
} from '../store/useHisaabStore';
import AddTransactionSheet from '../components/AddTransactionSheet';

const TXN_ICONS: Record<string, string> = {sale: '💰', expense: '🧾', credit: '📒'};
const TXN_BG:    Record<string, string> = {
  sale:    Colors.primaryFade,
  expense: Colors.redFade,
  credit:  Colors.amberFade,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // ── Fine-grained Zustand subscriptions ──
  const shopName    = useShopName();          // re-renders only when shopName changes
  const transactions = useTransactions();     // re-renders only when transactions change
  const stats       = useDayStats();          // computed from today's transactions
  const addTxn      = useAddTransaction();    // stable reference — never causes re-render

  const [showAdd,  setShowAdd]  = useState(false);
  const [addType,  setAddType]  = useState<TxnType>('sale');
  const [refreshing, setRefreshing] = useState(false);

  const recent = [...transactions].sort((a, b) => b.time - a.time).slice(0, 10);

  const openAdd = (type: TxnType) => { setAddType(type); setShowAdd(true); };
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }>

        {/* ── Header ── */}
        <View style={styles.hdr}>
          <View>
            <Text style={styles.greet}>{getGreeting()}</Text>
            <Text style={styles.shopName}>{shopName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials(shopName)}</Text>
          </View>
        </View>

        {/* ── Balance Hero Card ── */}
        <LinearGradient
          colors={[Colors.card, Colors.bg3]}
          style={styles.hero}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.heroBg} />
          <Text style={styles.heroLbl}>TODAY'S BALANCE</Text>
          <Text style={styles.heroAmt}>{fmt(stats.balance)}</Text>

          <View style={[styles.heroChg, stats.balance < 0 && styles.heroChgNeg]}>
            <Text style={[styles.heroChgTxt, stats.balance < 0 && {color: Colors.red}]}>
              {stats.balance >= 0 ? '↑' : '↓'} {fmt(Math.abs(stats.balance))} today
            </Text>
          </View>

          <View style={styles.pills}>
            <View style={styles.pill}>
              <Text style={styles.pillLbl}>↑ INCOME</Text>
              <Text style={[styles.pillAmt, {color: Colors.primary}]}>{fmt(stats.income)}</Text>
            </View>
            <View style={[styles.pill, {marginLeft: 10}]}>
              <Text style={styles.pillLbl}>↓ EXPENSES</Text>
              <Text style={[styles.pillAmt, {color: Colors.red}]}>{fmt(stats.expense)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Action Buttons ── */}
        <View style={styles.qaRow}>
          {[
            {label: 'Sale',    icon: '💰', type: 'sale'    as TxnType, bg: Colors.primaryFade, border: 'rgba(0,194,124,.3)'},
            {label: 'Expense', icon: '🧾', type: 'expense' as TxnType, bg: Colors.redFade,     border: 'rgba(255,77,109,.3)'},
            {label: 'Udhar',   icon: '📒', type: 'credit'  as TxnType, bg: Colors.amberFade,   border: 'rgba(255,181,71,.3)'},
            {label: 'Report',  icon: '📊', type: null,                  bg: Colors.blueFade,    border: 'rgba(77,158,255,.3)'},
          ].map(btn => (
            <TouchableOpacity
              key={btn.label}
              style={[styles.qaBtn, {borderColor: btn.border}]}
              onPress={() => btn.type && openAdd(btn.type)}
              activeOpacity={0.75}>
              <View style={[styles.qaIc, {backgroundColor: btn.bg}]}>
                <Text style={styles.qaIcTxt}>{btn.icon}</Text>
              </View>
              <Text style={styles.qaLbl}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.secHdr}>
          <Text style={styles.secTitle}>Recent</Text>
          <Text style={styles.secLink}>View all →</Text>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIc}>📋</Text>
            <Text style={styles.emptyT}>No transactions yet</Text>
            <Text style={styles.emptySb}>Tap Sale or Expense to start</Text>
          </View>
        ) : (
          recent.map(t => (
            <TouchableOpacity key={t.id} style={styles.txnCard} activeOpacity={0.75}>
              <View style={[styles.txnIc, {backgroundColor: TXN_BG[t.type] || Colors.blueFade}]}>
                <Text style={styles.txnIcTxt}>{TXN_ICONS[t.type] || '💳'}</Text>
              </View>
              <View style={styles.txnMid}>
                <Text style={styles.txnName}>{t.desc}</Text>
                <Text style={styles.txnMeta}>{fmtTime(t.time)}</Text>
              </View>
              <Text style={[styles.txnAmt, {color: t.type === 'expense' ? Colors.red : Colors.primary}]}>
                {t.type === 'expense' ? '−' : '+'}{fmt(t.amount)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{height: 24}} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => openAdd('sale')} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGrad}>
          <Text style={styles.fabTxt}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <AddTransactionSheet
        visible={showAdd}
        initialType={addType}
        onClose={() => setShowAdd(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       {flex: 1, backgroundColor: Colors.bg},
  hdr:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md},
  greet:      {fontSize: 12, color: Colors.t3, fontWeight: '500'},
  shopName:   {fontSize: 24, fontWeight: '800', color: Colors.t1, letterSpacing: -0.5, marginTop: 2},
  avatar:     {width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryFade, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarTxt:  {fontSize: 14, fontWeight: '700', color: Colors.primary},
  hero:       {marginHorizontal: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.xxl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border2, overflow: 'hidden'},
  heroBg:     {position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,194,124,0.05)'},
  heroLbl:    {fontSize: 10, color: Colors.t3, fontWeight: '700', letterSpacing: 0.1, marginBottom: 6},
  heroAmt:    {fontSize: 36, fontWeight: '800', color: Colors.t1, letterSpacing: -1.5},
  heroChg:    {flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: Colors.primaryFade, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8},
  heroChgNeg: {backgroundColor: Colors.redFade},
  heroChgTxt: {fontSize: 11, color: Colors.primary, fontWeight: '600'},
  pills:      {flexDirection: 'row', marginTop: 18},
  pill:       {flex: 1, backgroundColor: Colors.bg4, borderRadius: Radius.md, padding: Spacing.md},
  pillLbl:    {fontSize: 9, color: Colors.t4, fontWeight: '700', letterSpacing: 0.06, marginBottom: 4},
  pillAmt:    {fontSize: 16, fontWeight: '700'},
  qaRow:      {flexDirection: 'row', gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.xl},
  qaBtn:      {flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', gap: 6},
  qaIc:       {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  qaIcTxt:    {fontSize: 17},
  qaLbl:      {fontSize: 10, fontWeight: '600', color: Colors.t2},
  secHdr:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: 12},
  secTitle:   {fontSize: 13, fontWeight: '700', color: Colors.t1},
  secLink:    {fontSize: 11, color: Colors.primary, fontWeight: '600'},
  txnCard:    {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border},
  txnIc:      {width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  txnIcTxt:   {fontSize: 18},
  txnMid:     {flex: 1},
  txnName:    {fontSize: 13, fontWeight: '600', color: Colors.t1},
  txnMeta:    {fontSize: 10, color: Colors.t3, marginTop: 2},
  txnAmt:     {fontSize: 14, fontWeight: '700'},
  empty:      {alignItems: 'center', padding: 40},
  emptyIc:    {fontSize: 48, marginBottom: 12, opacity: 0.5},
  emptyT:     {fontSize: 15, fontWeight: '700', color: Colors.t2, marginBottom: 6},
  emptySb:    {fontSize: 12, color: Colors.t4},
  fab:        {position: 'absolute', bottom: 88, right: 20, width: 56, height: 56, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8},
  fabGrad:    {flex: 1, alignItems: 'center', justifyContent: 'center'},
  fabTxt:     {fontSize: 30, color: '#fff', fontWeight: '300', marginTop: -2},
});
