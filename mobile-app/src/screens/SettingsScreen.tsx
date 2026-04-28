import React, {useState} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Radius, Spacing} from '../utils/theme';
import {initials} from '../utils/helpers';
import {
  useShopName,
  useIsPro,
  useLang,
  useTransactions,
  useSetShopName,
  useSetLang,
  useSetPro,
  useClearAll,
} from '../store/useHisaabStore';

const PLANS = [
  {
    key: 'monthly', name: 'Pro Monthly', price: 'Rs 499', period: '/month', hot: true,
    features: ['Unlimited transactions', 'Voice AI (Urdu + English)', 'PDF reports & export', 'WhatsApp auto-reminders', 'Multi-device sync'],
  },
  {
    key: 'yearly', name: 'Pro Yearly', price: 'Rs 3,999', period: '/year', hot: false, badge: 'SAVE 33%',
    features: ['Everything in Monthly', 'Tax summary report', 'Priority support'],
  },
  {
    key: 'lifetime', name: 'Lifetime 🏆', price: 'Rs 9,999', period: ' once', hot: false,
    features: ['Everything forever', 'All future features free', 'Founder badge 🏅'],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  // ✅ Fine-grained subscriptions — each re-renders independently
  const shopName    = useShopName();
  const isPro       = useIsPro();
  const lang        = useLang();
  const transactions = useTransactions();

  // ✅ Action hooks — stable references, never cause re-renders
  const setShopName = useSetShopName();
  const setLang     = useSetLang();
  const setPro      = useSetPro();
  const clearAll    = useClearAll();

  const [editOpen,  setEditOpen]  = useState(false);
  const [newName,   setNewName]   = useState(shopName);
  const [showPlans, setShowPlans] = useState(false);

  const saveName = () => {
    if (newName.trim()) setShopName(newName.trim());
    setEditOpen(false);
  };

  const exportData = async () => {
    const header = 'Type,Amount,Description,Date';
    const rows   = transactions.map(t => `${t.type},${t.amount},"${t.desc}",${t.date}`);
    await Share.share({message: [header, ...rows].join('\n'), title: 'Hisaab Export'});
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL transactions and customers. Cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete All', style: 'destructive', onPress: clearAll},
      ],
    );
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.hdr}><Text style={styles.title}>Settings</Text></View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile banner */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={styles.profBanner}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <View style={styles.profAv}>
            <Text style={styles.profAvTxt}>{initials(shopName)}</Text>
          </View>
          <View>
            <Text style={styles.profName}>{shopName}</Text>
            <Text style={styles.profPlan}>{isPro ? '⭐ Pro Plan — Unlimited' : '🆓 Free Plan · 50 txn/month'}</Text>
          </View>
        </LinearGradient>

        {/* Shop settings */}
        <View style={styles.group}>
          <Text style={styles.groupLbl}>SHOP</Text>
          <TouchableOpacity
            style={[styles.item, styles.itemTop]}
            onPress={() => { setNewName(shopName); setEditOpen(true); }}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.primaryFade}]}><Text>🏪</Text></View>
              <View><Text style={styles.iNm}>Shop Name</Text><Text style={styles.iSb}>{shopName}</Text></View>
            </View>
            <Text style={styles.iR}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.item, styles.itemBot]}
            onPress={() => setLang(lang === 'en' ? 'ur' : 'en')}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.blueFade}]}><Text>🌐</Text></View>
              <View><Text style={styles.iNm}>Language</Text><Text style={styles.iSb}>{lang === 'en' ? 'English' : 'اردو'}</Text></View>
            </View>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeTxt}>{lang === 'en' ? 'EN' : 'UR'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscription */}
        <View style={styles.group}>
          <Text style={styles.groupLbl}>SUBSCRIPTION</Text>
          <TouchableOpacity style={[styles.item, {borderRadius: Radius.lg}]} onPress={() => setShowPlans(true)}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.amberFade}]}><Text>⭐</Text></View>
              <View><Text style={styles.iNm}>Upgrade to Pro</Text><Text style={styles.iSb}>Rs 499/month — Unlimited everything</Text></View>
            </View>
            <View style={styles.proBadge}><Text style={styles.proBadgeTxt}>PRO</Text></View>
          </TouchableOpacity>
        </View>

        {/* Stats summary */}
        <View style={styles.group}>
          <Text style={styles.groupLbl}>USAGE</Text>
          <View style={[styles.item, {borderRadius: Radius.lg, flexDirection: 'row', justifyContent: 'space-around'}]}>
            {[
              {lbl: 'Transactions', val: String(transactions.length)},
              {lbl: 'This Month',   val: String(transactions.filter(t => t.date >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).length)},
              {lbl: 'Limit',        val: isPro ? '∞' : '50'},
            ].map(s => (
              <View key={s.lbl} style={{alignItems: 'center', gap: 4}}>
                <Text style={{fontSize: 20, fontWeight: '800', color: Colors.primary}}>{s.val}</Text>
                <Text style={{fontSize: 9, color: Colors.t3, fontWeight: '600'}}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Data */}
        <View style={styles.group}>
          <Text style={styles.groupLbl}>DATA</Text>
          <TouchableOpacity style={[styles.item, styles.itemTop]} onPress={exportData}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.blueFade}]}><Text>📤</Text></View>
              <View><Text style={styles.iNm}>Export Data</Text><Text style={styles.iSb}>Share as CSV</Text></View>
            </View>
            <Text style={styles.iR}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.item, styles.itemBot]} onPress={confirmClear}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.redFade}]}><Text>🗑️</Text></View>
              <View><Text style={styles.iNm}>Clear All Data</Text><Text style={styles.iSb}>Cannot be undone</Text></View>
            </View>
            <Text style={[styles.iR, {color: Colors.red}]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.group}>
          <Text style={styles.groupLbl}>ABOUT</Text>
          <View style={[styles.item, {borderRadius: Radius.lg}]}>
            <View style={styles.iL}>
              <View style={[styles.iIc, {backgroundColor: Colors.primaryFade}]}><Text>ℹ️</Text></View>
              <View><Text style={styles.iNm}>Hisaab · حساب</Text><Text style={styles.iSb}>Version 1.0.0 · Built with Zustand 🐻</Text></View>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Made with ❤️ for Pakistan{'\n'}حساب — ہر دکاندار کا ڈیجیٹل ساتھی</Text>
        <View style={{height: 24}} />
      </ScrollView>

      {/* Edit name modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.centeredOverlay}>
          <View style={styles.nameModal}>
            <Text style={styles.modalTitle}>Shop Name</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              placeholderTextColor={Colors.t4}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnSec} onPress={() => setEditOpen(false)}>
                <Text style={styles.btnSecTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPri} onPress={saveName} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.btnGrad}>
                  <Text style={styles.btnPriTxt}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Plans modal */}
      <Modal visible={showPlans} transparent animationType="slide" onRequestClose={() => setShowPlans(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Upgrade to Pro ⭐</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PLANS.map(p => (
                <View key={p.key} style={[styles.planCard, p.hot && styles.planCardHot]}>
                  {p.hot && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeTxt}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <Text style={styles.planName}>{p.name}</Text>
                    {p.badge && <View style={styles.saveBadge}><Text style={styles.saveBadgeTxt}>{p.badge}</Text></View>}
                  </View>
                  <Text style={styles.planPrice}>{p.price}<Text style={styles.planPer}>{p.period}</Text></Text>
                  <Text style={styles.planFeats}>{p.features.map(f => `✅ ${f}`).join('\n')}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.jazzcashBtn}
                onPress={() => { Alert.alert('Coming Soon', 'JazzCash payment integration coming soon!'); setShowPlans(false); }}
                activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.btnGrad}>
                  <Text style={styles.btnPriTxt}>Continue with JazzCash →</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.laterBtn} onPress={() => setShowPlans(false)}>
                <Text style={styles.laterTxt}>Maybe later</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          {flex: 1, backgroundColor: Colors.bg},
  hdr:           {paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md},
  title:         {fontSize: 24, fontWeight: '800', color: Colors.t1, letterSpacing: -0.5},
  profBanner:    {marginHorizontal: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: Spacing.xl, overflow: 'hidden'},
  profAv:        {width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center'},
  profAvTxt:     {fontSize: 20, fontWeight: '800', color: '#fff'},
  profName:      {fontSize: 18, fontWeight: '700', color: '#fff'},
  profPlan:      {fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3},
  group:         {marginHorizontal: Spacing.lg, marginBottom: Spacing.xl},
  groupLbl:      {fontSize: 10, fontWeight: '700', color: Colors.t4, letterSpacing: 0.08, marginBottom: 10},
  item:          {backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, marginBottom: 2},
  itemTop:       {borderRadius: `${Radius.lg}px ${Radius.lg}px 4px 4px` as any},
  itemBot:       {borderRadius: '4px 4px ${Radius.lg}px ${Radius.lg}px' as any},
  iL:            {flexDirection: 'row', alignItems: 'center', gap: 12},
  iIc:           {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', fontSize: 16},
  iNm:           {fontSize: 13, fontWeight: '600', color: Colors.t1},
  iSb:           {fontSize: 10, color: Colors.t3, marginTop: 1},
  iR:            {fontSize: 16, color: Colors.t3},
  langBadge:     {backgroundColor: Colors.primaryFade, borderWidth: 1, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5},
  langBadgeTxt:  {fontSize: 11, fontWeight: '700', color: Colors.primary},
  proBadge:      {backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  proBadgeTxt:   {fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.04},
  footer:        {textAlign: 'center', padding: 20, fontSize: 11, color: Colors.t4, lineHeight: 18},
  centeredOverlay:{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center'},
  nameModal:     {backgroundColor: Colors.bg2, borderRadius: Radius.xl, padding: Spacing.xl, width: '85%', borderWidth: 1, borderColor: Colors.border2},
  modalTitle:    {fontSize: 18, fontWeight: '700', color: Colors.t1, marginBottom: 16},
  nameInput:     {backgroundColor: Colors.bg4, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: Radius.md, padding: 13, fontSize: 15, color: Colors.t1, marginBottom: 16},
  overlay:       {flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end'},
  sheet:         {backgroundColor: Colors.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40, borderTopWidth: 1, borderColor: Colors.border2, maxHeight: '88%'},
  handle:        {width: 40, height: 4, backgroundColor: Colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 22},
  sheetTitle:    {fontSize: 20, fontWeight: '700', color: Colors.t1, marginBottom: 20},
  planCard:      {backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.lg, padding: 18, marginBottom: 10, position: 'relative'},
  planCardHot:   {borderColor: Colors.primary, backgroundColor: Colors.primaryFade2},
  planBadge:     {position: 'absolute', top: -10, right: 16, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3},
  planBadgeTxt:  {fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 0.04},
  planName:      {fontSize: 15, fontWeight: '700', color: Colors.t1},
  saveBadge:     {backgroundColor: Colors.primaryFade, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2},
  saveBadgeTxt:  {fontSize: 10, fontWeight: '700', color: Colors.primary},
  planPrice:     {fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: -1, marginVertical: 4},
  planPer:       {fontSize: 13, fontWeight: '500', color: Colors.t3},
  planFeats:     {fontSize: 11, color: Colors.t2, lineHeight: 22},
  jazzcashBtn:   {borderRadius: Radius.lg, overflow: 'hidden', marginTop: 6},
  btnRow:        {flexDirection: 'row', gap: 10},
  btnSec:        {flex: 1, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.lg, padding: 14, alignItems: 'center'},
  btnSecTxt:     {fontSize: 14, fontWeight: '600', color: Colors.t2},
  btnPri:        {flex: 2, borderRadius: Radius.lg, overflow: 'hidden'},
  btnGrad:       {padding: 16, alignItems: 'center'},
  btnPriTxt:     {fontSize: 15, fontWeight: '700', color: '#fff'},
  laterBtn:      {padding: 16, alignItems: 'center'},
  laterTxt:      {fontSize: 13, color: Colors.t3, fontWeight: '600'},
});
