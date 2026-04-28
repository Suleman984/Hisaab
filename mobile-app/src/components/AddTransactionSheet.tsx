import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Animated, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {Colors, Radius, Spacing} from '../utils/theme';
import {useAddTransaction, useAddCustomer, TxnType} from '../store/useHisaabStore';

interface Props {
  visible: boolean;
  initialType: TxnType;
  onClose: () => void;
}

const TYPE_CONFIG = {
  sale:    {label: '💰 Sale',    color: Colors.primary, bg: Colors.primaryFade},
  expense: {label: '🧾 Expense', color: Colors.red,     bg: Colors.redFade},
  credit:  {label: '📒 Udhar',   color: Colors.amber,   bg: Colors.amberFade},
};

export default function AddTransactionSheet({visible, initialType, onClose}: Props) {
  // ✅ Only subscribing to actions — zero re-renders from store changes
  const addTransaction = useAddTransaction();
  const addCustomer    = useAddCustomer();

  const [type,       setType]       = useState<TxnType>(initialType);
  const [amount,     setAmount]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [custName,   setCustName]   = useState('');
  const [creditType, setCreditType] = useState<'give' | 'take'>('give');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount(''); setDesc(''); setCustName('');
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 68, friction: 12,
      }).start();
    }
  }, [visible, initialType]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {toValue: 400, duration: 220, useNativeDriver: true})
      .start(onClose);
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const fallback = {sale: 'Sale', expense: 'Expense', credit: 'Udhar'};
    const d = desc.trim() || fallback[type];

    if (type === 'credit') {
      if (!custName.trim()) return;
      // Add customer record
      addCustomer(
        custName.trim(), '',
        amt,
        creditType === 'give' ? 'receive' : 'pay',
      );
      // Also log it as a transaction for history
      addTransaction('credit', amt, `Udhar: ${custName.trim()} — ${d}`);
    } else {
      addTransaction(type, amt, d);
    }

    handleClose();
  };

  if (!visible) return null;

  const cfg = TYPE_CONFIG[type];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}>
              <Animated.View style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}>
                <View style={styles.handle} />
                <Text style={styles.title}>
                  {cfg.label}
                </Text>

                {/* Type tabs */}
                <View style={styles.tabs}>
                  {(Object.entries(TYPE_CONFIG) as [TxnType, typeof TYPE_CONFIG.sale][]).map(([k, v]) => (
                    <TouchableOpacity
                      key={k}
                      style={[styles.tab, type === k && {backgroundColor: v.bg, borderColor: v.color}]}
                      onPress={() => setType(k)}>
                      <Text style={[styles.tabTxt, type === k && {color: v.color}]}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount */}
                <View style={styles.field}>
                  <Text style={styles.lbl}>AMOUNT (RS)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.t4}
                    autoFocus
                  />
                </View>

                {/* Description */}
                <View style={styles.field}>
                  <Text style={styles.lbl}>DESCRIPTION</Text>
                  <TextInput
                    style={styles.input}
                    value={desc}
                    onChangeText={setDesc}
                    placeholder="e.g. Rice 5kg, Electricity bill..."
                    placeholderTextColor={Colors.t4}
                  />
                </View>

                {/* Credit-specific fields */}
                {type === 'credit' && (
                  <>
                    <View style={styles.field}>
                      <Text style={styles.lbl}>CUSTOMER NAME</Text>
                      <TextInput
                        style={styles.input}
                        value={custName}
                        onChangeText={setCustName}
                        placeholder="Customer or vendor name"
                        placeholderTextColor={Colors.t4}
                      />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.lbl}>DIRECTION</Text>
                      <View style={styles.dRow}>
                        {([['give', 'They owe me'], ['take', 'I owe them']] as const).map(([k, l]) => (
                          <TouchableOpacity
                            key={k}
                            style={[styles.dOpt, creditType === k && styles.dOptOn]}
                            onPress={() => setCreditType(k)}>
                            <Text style={[styles.dOptTxt, creditType === k && {color: Colors.primary}]}>{l}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {/* Buttons */}
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnSec} onPress={handleClose}>
                    <Text style={styles.btnSecTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPri} onPress={handleSave} activeOpacity={0.85}>
                    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.btnGrad}>
                      <Text style={styles.btnPriTxt}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   {flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end'},
  sheet:     {backgroundColor: Colors.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 44, borderTopWidth: 1, borderColor: Colors.border2},
  handle:    {width: 40, height: 4, backgroundColor: Colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 22},
  title:     {fontSize: 20, fontWeight: '700', color: Colors.t1, marginBottom: 20},
  tabs:      {flexDirection: 'row', gap: 8, marginBottom: 20},
  tab:       {flex: 1, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg4, alignItems: 'center'},
  tabTxt:    {fontSize: 12, fontWeight: '600', color: Colors.t3},
  field:     {marginBottom: 16},
  lbl:       {fontSize: 11, fontWeight: '600', color: Colors.t3, letterSpacing: 0.04, marginBottom: 7},
  input:     {backgroundColor: Colors.bg4, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: Radius.md, padding: 13, fontSize: 15, color: Colors.t1},
  dRow:      {flexDirection: 'row', gap: 10},
  dOpt:      {flex: 1, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg4, alignItems: 'center'},
  dOptOn:    {borderColor: Colors.primary, backgroundColor: Colors.primaryFade},
  dOptTxt:   {fontSize: 12, fontWeight: '600', color: Colors.t3},
  btnRow:    {flexDirection: 'row', gap: 10, marginTop: 4},
  btnSec:    {flex: 1, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.lg, padding: 16, alignItems: 'center'},
  btnSecTxt: {fontSize: 14, fontWeight: '600', color: Colors.t2},
  btnPri:    {flex: 2, borderRadius: Radius.lg, overflow: 'hidden'},
  btnGrad:   {padding: 16, alignItems: 'center'},
  btnPriTxt: {fontSize: 15, fontWeight: '700', color: '#fff'},
});
