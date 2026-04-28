import React, {useState, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Radius, Spacing} from '../utils/theme';
import {fmt, today} from '../utils/helpers';

// ✅ Only pull exactly what this screen needs
import {
  useShopName,
  useTransactions,
  useCustomers,
  useDayStats,
  useAddTransaction,
} from '../store/useHisaabStore';

interface Msg {id: string; role: 'user' | 'ai'; text: string; time: string}

const CHIPS = [
  'Aaj ki sale?', 'Balance?', 'Udhar kitna?',
  'Add sale 500', 'Monthly report', 'Top expenses?',
];

const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const nowT = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

export default function AIScreen() {
  const insets = useSafeAreaInsets();

  const shopName    = useShopName();
  const transactions = useTransactions();
  const customers   = useCustomers();
  const stats       = useDayStats();
  const addTxn      = useAddTransaction();

  const [msgs,    setMsgs]    = useState<Msg[]>([{
    id: 'init', role: 'ai', time: nowT(),
    text: 'Assalam-o-Alaikum! 👋\nMain **Hisaab AI** hoon — aapka digital hisaab kitaab assistant.\n\nPooch sakte hain:\n• **Aaj ki sale kitni hai?**\n• **Add sale 500 rupees milk**\n• **Monthly report do**\n• **Balance kya hai?**\n\nUrdu ya English — dono chalti hai! 😊',
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 80);

  const addMsg = (msg: Msg) => { setMsgs(p => [...p, msg]); scrollDown(); };

  const sendMsg = async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt) return;
    setInput('');

    addMsg({id: uid(), role: 'user', text: txt, time: nowT()});
    setLoading(true);

    // ── 1. Try local command first (instant, no API call) ──
    const local = parseLocal(txt);
    if (local) {
      await new Promise(r => setTimeout(r, 420));
      addMsg({id: uid(), role: 'ai', text: local, time: nowT()});
      setLoading(false);
      return;
    }

    // ── 2. Fall back to Claude API ──
    try {
      const ctx = buildContext();
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `You are Hisaab AI, a friendly bilingual (Urdu+English) bookkeeping assistant for Pakistani shopkeepers. Use Roman Urdu naturally. Be concise. Use emojis.\n\nShop data:\n${ctx}`,
          messages: [{role: 'user', content: txt}],
        }),
      });
      const data = await res.json();
      addMsg({id: uid(), role: 'ai', text: data.content?.[0]?.text ?? 'Sorry, kuch masla hua.', time: nowT()});
    } catch {
      addMsg({id: uid(), role: 'ai', text: fallback(), time: nowT()});
    }
    setLoading(false);
  };

  // ── Local command parser ──────────────────────────────
  const parseLocal = (txt: string): string | null => {
    const t = txt.toLowerCase();

    // Add sale: "add sale 500 milk" or "sale 500 doodh"
    const saleM = t.match(/(?:add\s+)?sale\s+(\d+(?:\.\d+)?)\s*(.*)?/);
    if (saleM) {
      const amt = parseFloat(saleM[1]);
      const d   = saleM[2]?.trim() || 'Sale';
      addTxn('sale', amt, d);
      return `✅ Sale add ho gayi!\n**${fmt(amt)}** — ${d}\nNaya balance: **${fmt(stats.balance + amt)}**`;
    }

    // Add expense
    const expM = t.match(/(?:add\s+)?expense\s+(\d+(?:\.\d+)?)\s*(.*)?/);
    if (expM) {
      const amt = parseFloat(expM[1]);
      const d   = expM[2]?.trim() || 'Expense';
      addTxn('expense', amt, d);
      return `✅ Expense add ho gaya!\n**${fmt(amt)}** — ${d}`;
    }

    if (t.includes('sale') || t.includes('kitni') || (t.includes('aaj') && t.includes('income'))) {
      const td = transactions.filter(x => x.date === today());
      const sc = td.filter(x => x.type === 'sale').length;
      return `📊 Aaj ki sale: **${fmt(stats.income)}**\n${sc} transactions\nExpenses: **${fmt(stats.expense)}**\nNet profit: **${fmt(stats.balance)}**`;
    }

    if (t.includes('balance') || t.includes('kitna hai')) {
      return `💰 Aaj ka balance: **${fmt(stats.balance)}**\n↑ Income: ${fmt(stats.income)}\n↓ Expenses: ${fmt(stats.expense)}`;
    }

    if (t.includes('udhar') || t.includes('credit')) {
      const toRecv = customers.filter(c => c.type === 'receive').reduce((s, c) => s + c.amount, 0);
      const cn     = customers.filter(c => c.type === 'receive').length;
      return `📒 Total udhar (to receive): **${fmt(toRecv)}**\nCustomers: ${cn}`;
    }

    if (t.includes('report') || t.includes('summary') || t.includes('monthly')) {
      const allInc = transactions.filter(x => x.type === 'sale').reduce((s, x) => s + x.amount, 0);
      const allExp = transactions.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
      return `📈 **Full Summary**\nTotal Income: ${fmt(allInc)}\nTotal Expenses: ${fmt(allExp)}\nNet Profit: **${fmt(allInc - allExp)}**\nTotal entries: ${transactions.length}`;
    }

    if (t.includes('top expense') || t.includes('zyada expense')) {
      const top = [...transactions]
        .filter(x => x.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      if (!top.length) return 'Koi expense nahi mili abhi tak.';
      return `💸 **Top Expenses:**\n${top.map((t, i) => `${i + 1}. ${t.desc} — **${fmt(t.amount)}**`).join('\n')}`;
    }

    return null;
  };

  const buildContext = () => {
    const allInc = transactions.filter(x => x.type === 'sale').reduce((s, x) => s + x.amount, 0);
    const allExp = transactions.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
    const udhar  = customers.filter(c => c.type === 'receive').reduce((s, c) => s + c.amount, 0);
    return `Shop: ${shopName}. Today income: Rs${stats.income}. Today expenses: Rs${stats.expense}. Net today: Rs${stats.balance}. All-time income: Rs${allInc}. All-time expenses: Rs${allExp}. Total transactions: ${transactions.length}. Udhar to receive: Rs${udhar}. Customers: ${customers.length}.`;
  };

  const fallback = () =>
    `Samajh gaya! 😊 Yeh try karein:\n• **"Add sale 500"**\n• **"Aaj ki sale?"**\n• **"Balance?"**\n• **"Monthly report"**`;

  // ── Render bold text helper ──
  const renderText = (text: string) =>
    text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <Text key={i} style={{fontWeight: '700', color: Colors.primary}}>{part}</Text>
        : <Text key={i}>{part}</Text>
    );

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>

      {/* Header */}
      <View style={styles.hdr}>
        <Text style={styles.title}>Hisaab AI 🤖</Text>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.status}>Online · Urdu & English</Text>
        </View>
      </View>

      {/* Quick chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={{paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 12}}>
        {CHIPS.map(c => (
          <TouchableOpacity key={c} style={styles.chip} onPress={() => sendMsg(c)}>
            <Text style={styles.chipTxt}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          style={styles.msgList}
          contentContainerStyle={{padding: Spacing.lg, gap: 12}}
          showsVerticalScrollIndicator={false}>

          {msgs.map(m => (
            <View key={m.id} style={[styles.bWrap, m.role === 'user' && styles.bWrapUser]}>
              <View style={[styles.bubble, m.role === 'user' ? styles.bubUser : styles.bubAI]}>
                <Text style={[styles.bubTxt, m.role === 'user' && {color: '#fff'}]}>
                  {renderText(m.text)}
                </Text>
              </View>
              <Text style={styles.bTime}>{m.time}</Text>
            </View>
          ))}

          {loading && (
            <View style={styles.bWrap}>
              <View style={[styles.bubAI, {paddingVertical: 14, paddingHorizontal: 18}]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, {paddingBottom: insets.bottom + 12}]}>
          <TouchableOpacity style={styles.micBtn}>
            <Text style={{fontSize: 18}}>🎤</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Yahan likhein ya bolein..."
            placeholderTextColor={Colors.t4}
            onSubmitEditing={() => sendMsg()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMsg()} activeOpacity={0.85}>
            <Text style={styles.sendIc}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      {flex: 1, backgroundColor: Colors.bg},
  hdr:       {backgroundColor: Colors.bg2, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border},
  title:     {fontSize: 20, fontWeight: '700', color: Colors.t1},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4},
  dot:       {width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary},
  status:    {fontSize: 11, color: Colors.t3},
  chipsBar:  {backgroundColor: Colors.bg2, borderBottomWidth: 1, borderColor: Colors.border, maxHeight: 56},
  chip:      {backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8},
  chipTxt:   {fontSize: 11, fontWeight: '600', color: Colors.t2},
  msgList:   {flex: 1},
  bWrap:     {alignItems: 'flex-start'},
  bWrapUser: {alignItems: 'flex-end'},
  bubble:    {maxWidth: '82%', padding: 13},
  bubAI:     {backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 18},
  bubUser:   {backgroundColor: Colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 4, borderBottomLeftRadius: 18},
  bubTxt:    {fontSize: 13, lineHeight: 21, color: Colors.t1},
  bTime:     {fontSize: 9, color: Colors.t4, marginTop: 4, paddingHorizontal: 4},
  inputBar:  {backgroundColor: Colors.bg2, borderTopWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.lg, paddingTop: 12},
  micBtn:    {width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg4, borderWidth: 1.5, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center'},
  textInput: {flex: 1, backgroundColor: Colors.bg4, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11, fontSize: 13, color: Colors.t1, maxHeight: 100},
  sendBtn:   {width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8},
  sendIc:    {fontSize: 20, color: '#fff', fontWeight: '700'},
});
