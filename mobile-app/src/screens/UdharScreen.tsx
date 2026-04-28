import React, {useState} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Radius, Spacing, AVATAR_COLORS} from '../utils/theme';
import {fmt, initials} from '../utils/helpers';
import {
  useCustomers,
  useShopName,
  useAddCustomer,
  useDeleteCustomer,
  useAdjustCustomerBalance,
  useTotalUdhar,
  Customer,
} from '../store/useHisaabStore';

export default function UdharScreen() {
  const insets = useSafeAreaInsets();

  // ✅ Each hook is a separate fine-grained subscription
  const customers  = useCustomers();
  const shopName   = useShopName();
  const udhar      = useTotalUdhar();
  const addCust    = useAddCustomer();
  const deleteCust = useDeleteCustomer();
  const adjustBal  = useAdjustCustomerBalance();

  const [showAdd,   setShowAdd]   = useState(false);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [custType,  setCustType]  = useState<'receive' | 'pay'>('receive');

  const handleSave = () => {
    if (!name.trim()) return;
    addCust(name.trim(), phone.trim(), parseFloat(amount) || 0, custType);
    setName(''); setPhone(''); setAmount('');
    setShowAdd(false);
  };

  const confirmDelete = (c: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Remove ${c.name} from udhar book?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => deleteCust(c.id)},
      ],
    );
  };

  const sendWA = (c?: Customer) => {
    const msg = c
      ? `Assalam-o-Alaikum ${c.name}! Aapka ${fmt(c.amount)} ka udhar baaki hai. Meherbani farma ke ada kar dein. — ${shopName}`
      : `Assalam-o-Alaikum! Aapka udhar baaki hai. Meherbani farma ke ada kar dein. — ${shopName}`;
    const num = c?.phone?.replace(/\D/g, '');
    const url = num && num.length >= 10
      ? `https://wa.me/92${num.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  const renderCustomer = (c: Customer) => {
    const [bg, fg] = AVATAR_COLORS[c.colorIndex % AVATAR_COLORS.length];
    const isRecv   = c.type === 'receive';
    return (
      <TouchableOpacity key={c.id} style={styles.custCard} activeOpacity={0.8} onLongPress={() => confirmDelete(c)}>
        <View style={styles.custInner}>
          <View style={styles.custL}>
            <View style={[styles.custAv, {backgroundColor: bg}]}>
              <Text style={[styles.custAvTxt, {color: fg}]}>{initials(c.name)}</Text>
            </View>
            <View>
              <Text style={styles.custName}>{c.name}</Text>
              <Text style={styles.custMeta}>{c.phone || 'No phone'} · {c.last}</Text>
            </View>
          </View>
          <View style={styles.custR}>
            <Text style={[styles.custAmt, {color: isRecv ? Colors.red : Colors.primary}]}>
              {fmt(c.amount)}
            </Text>
            <Text style={[styles.custType, {color: isRecv ? Colors.red : Colors.primary}]}>
              {isRecv ? 'owes you' : 'you owe'}
            </Text>
          </View>
        </View>

        {/* Quick action row */}
        <View style={styles.custActions}>
          <TouchableOpacity
            style={styles.custAction}
            onPress={() => adjustBal(c.id, 100, isRecv ? 'subtract' : 'add')}>
            <Text style={[styles.custActionTxt, {color: Colors.primary}]}>+ Paid Rs 100</Text>
          </TouchableOpacity>
          {c.phone ? (
            <TouchableOpacity style={styles.custAction} onPress={() => sendWA(c)}>
              <Text style={[styles.custActionTxt, {color: '#25D366'}]}>📲 WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.hdr}>
        <View>
          <Text style={styles.title}>Udhar Book</Text>
          <Text style={styles.sub}>Credit tracker · حساب کتاب</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnTxt}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={styles.summRow}>
          <View style={[styles.sumCard, styles.sumRed]}>
            <Text style={[styles.sumLbl, {color: Colors.red}]}>TO RECEIVE</Text>
            <Text style={[styles.sumAmt, {color: Colors.red}]}>{fmt(udhar.toReceive)}</Text>
            <Text style={styles.sumCnt}>{customers.filter(c => c.type === 'receive').length} customers</Text>
          </View>
          <View style={[styles.sumCard, styles.sumGreen]}>
            <Text style={[styles.sumLbl, {color: Colors.primary}]}>TO PAY</Text>
            <Text style={[styles.sumAmt, {color: Colors.primary}]}>{fmt(udhar.toPay)}</Text>
            <Text style={styles.sumCnt}>{customers.filter(c => c.type === 'pay').length} vendors</Text>
          </View>
        </View>

        {/* Bulk WA reminder */}
        {customers.filter(c => c.type === 'receive').length > 0 && (
          <TouchableOpacity onPress={() => sendWA()} activeOpacity={0.85}>
            <LinearGradient colors={['#1FAD4A', '#128C3C']} style={styles.waStrip}>
              <View>
                <Text style={styles.waTxt}>Send WhatsApp Reminders</Text>
                <Text style={styles.waSub}>Notify all customers with dues</Text>
              </View>
              <Text style={{fontSize: 28}}>📲</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.secHdr}>
          <Text style={styles.secTitle}>Customers & Vendors</Text>
          <Text style={styles.secSub}>Long press to delete</Text>
        </View>

        {customers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIc}>👥</Text>
            <Text style={styles.emptyT}>No credit records</Text>
            <Text style={styles.emptySb}>Tap + Add to track udhar</Text>
          </View>
        ) : customers.map(renderCustomer)}

        <View style={{height: 24}} />
      </ScrollView>

      {/* Add Customer Sheet */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAdd(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.sheet}>
                  <View style={styles.handle} />
                  <Text style={styles.sheetTitle}>Add Customer</Text>
                  {[
                    {label: 'FULL NAME',          val: name,   set: setName,   ph: 'e.g. Khalid Ahmed',  kb: 'default'     as const},
                    {label: 'PHONE (OPTIONAL)',    val: phone,  set: setPhone,  ph: '03xx-xxxxxxx',       kb: 'phone-pad'   as const},
                    {label: 'AMOUNT (RS)',         val: amount, set: setAmount, ph: '0',                  kb: 'decimal-pad' as const},
                  ].map(f => (
                    <View style={styles.field} key={f.label}>
                      <Text style={styles.lbl}>{f.label}</Text>
                      <TextInput
                        style={styles.input}
                        value={f.val}
                        onChangeText={f.set}
                        placeholder={f.ph}
                        placeholderTextColor={Colors.t4}
                        keyboardType={f.kb}
                      />
                    </View>
                  ))}
                  <View style={styles.field}>
                    <Text style={styles.lbl}>TYPE</Text>
                    <View style={styles.typeRow}>
                      {([['receive', 'They owe me'], ['pay', 'I owe them']] as const).map(([k, l]) => (
                        <TouchableOpacity
                          key={k}
                          style={[styles.typeOpt, custType === k && styles.typeOptOn]}
                          onPress={() => setCustType(k)}>
                          <Text style={[styles.typeOptTxt, custType === k && {color: Colors.primary}]}>{l}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.btnSec} onPress={() => setShowAdd(false)}>
                      <Text style={styles.btnSecTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnPri} onPress={handleSave} activeOpacity={0.85}>
                      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.btnGrad}>
                        <Text style={styles.btnPriTxt}>Save Customer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        {flex: 1, backgroundColor: Colors.bg},
  hdr:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md},
  title:       {fontSize: 24, fontWeight: '800', color: Colors.t1, letterSpacing: -0.5},
  sub:         {fontSize: 11, color: Colors.t3, marginTop: 2},
  addBtn:      {backgroundColor: Colors.primaryFade, borderWidth: 1.5, borderColor: 'rgba(0,194,124,.4)', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16},
  addBtnTxt:   {fontSize: 13, fontWeight: '700', color: Colors.primary},
  summRow:     {flexDirection: 'row', gap: 10, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg},
  sumCard:     {flex: 1, borderRadius: Radius.lg, padding: 16, borderWidth: 1},
  sumRed:      {backgroundColor: Colors.redFade,      borderColor: 'rgba(255,77,109,.2)'},
  sumGreen:    {backgroundColor: Colors.primaryFade2, borderColor: 'rgba(0,194,124,.2)'},
  sumLbl:      {fontSize: 9, fontWeight: '700', letterSpacing: 0.08, marginBottom: 6},
  sumAmt:      {fontSize: 22, fontWeight: '800', letterSpacing: -0.5},
  sumCnt:      {fontSize: 10, color: Colors.t3, marginTop: 3},
  waStrip:     {marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  waTxt:       {fontSize: 13, fontWeight: '700', color: '#fff'},
  waSub:       {fontSize: 10, color: 'rgba(255,255,255,.7)', marginTop: 2},
  secHdr:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: 12},
  secTitle:    {fontSize: 13, fontWeight: '700', color: Colors.t1},
  secSub:      {fontSize: 10, color: Colors.t4},
  custCard:    {backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden'},
  custInner:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14},
  custL:       {flexDirection: 'row', alignItems: 'center', gap: 12},
  custAv:      {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  custAvTxt:   {fontSize: 14, fontWeight: '700'},
  custName:    {fontSize: 13, fontWeight: '600', color: Colors.t1},
  custMeta:    {fontSize: 10, color: Colors.t3, marginTop: 2},
  custR:       {alignItems: 'flex-end'},
  custAmt:     {fontSize: 15, fontWeight: '700'},
  custType:    {fontSize: 9, fontWeight: '600', marginTop: 3},
  custActions: {flexDirection: 'row', borderTopWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg4},
  custAction:  {flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderColor: Colors.border},
  custActionTxt:{fontSize: 11, fontWeight: '600'},
  empty:       {alignItems: 'center', padding: 50},
  emptyIc:     {fontSize: 48, marginBottom: 12, opacity: 0.5},
  emptyT:      {fontSize: 15, fontWeight: '700', color: Colors.t2, marginBottom: 6},
  emptySb:     {fontSize: 12, color: Colors.t4},
  overlay:     {flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end'},
  sheet:       {backgroundColor: Colors.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 44, borderTopWidth: 1, borderColor: Colors.border2},
  handle:      {width: 40, height: 4, backgroundColor: Colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 22},
  sheetTitle:  {fontSize: 20, fontWeight: '700', color: Colors.t1, marginBottom: 20},
  field:       {marginBottom: 16},
  lbl:         {fontSize: 11, fontWeight: '600', color: Colors.t3, letterSpacing: 0.04, marginBottom: 7},
  input:       {backgroundColor: Colors.bg4, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: Radius.md, padding: 13, fontSize: 15, color: Colors.t1},
  typeRow:     {flexDirection: 'row', gap: 10},
  typeOpt:     {flex: 1, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg4, alignItems: 'center'},
  typeOptOn:   {borderColor: Colors.primary, backgroundColor: Colors.primaryFade},
  typeOptTxt:  {fontSize: 12, fontWeight: '600', color: Colors.t3},
  btnRow:      {flexDirection: 'row', gap: 10, marginTop: 4},
  btnSec:      {flex: 1, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.lg, padding: 16, alignItems: 'center'},
  btnSecTxt:   {fontSize: 14, fontWeight: '600', color: Colors.t2},
  btnPri:      {flex: 2, borderRadius: Radius.lg, overflow: 'hidden'},
  btnGrad:     {padding: 16, alignItems: 'center'},
  btnPriTxt:   {fontSize: 15, fontWeight: '700', color: '#fff'},
});
