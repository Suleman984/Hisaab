# Hisaab — Zustand Edition 🐻

Complete React Native app refactored from `useReducer+Context` to **Zustand**.

---

## Why Zustand?

| Feature | useReducer+Context | Zustand |
|---|---|---|
| Provider needed | ✅ Yes — wraps entire app | ❌ No — works anywhere |
| Re-renders | Whole tree on any change | Only subscribed slice |
| Boilerplate | Action types + dispatch | Just call functions |
| Persistence | Manual AsyncStorage | Built-in `persist` middleware |
| DevTools | Manual setup | Built-in `devtools` middleware |
| Mutations | Must spread immutably | Immer handles it |
| Bundle size | 0kb (built-in) | ~1kb |

---

## Store Architecture

```
src/store/useHisaabStore.ts
│
├── State
│   ├── shopName, lang, isPro
│   ├── transactions: Transaction[]
│   └── customers: Customer[]
│
├── Actions (Immer mutations)
│   ├── addTransaction / deleteTransaction
│   ├── addCustomer / updateCustomer / deleteCustomer
│   ├── adjustCustomerBalance   ← handles type-flip logic
│   └── setShopName / setLang / setPro / clearAll
│
├── Computed Selectors
│   ├── getDayStats(date?)       → DayStats
│   ├── getFilteredTxns(period)  → Transaction[]
│   └── getTotalUdhar()          → {toReceive, toPay}
│
└── Middleware Stack
    ├── immer      → safe mutations with draft pattern
    ├── devtools   → Redux DevTools support
    └── persist    → AsyncStorage auto-persistence
```

---

## Slice Hooks (fine-grained subscriptions)

```typescript
// Data hooks — re-render only when their slice changes
const shopName     = useShopName();
const transactions = useTransactions();
const customers    = useCustomers();
const stats        = useDayStats();           // computed
const udhar        = useTotalUdhar();         // computed
const filtered     = useFilteredTxns('week'); // computed

// Action hooks — NEVER cause re-renders (stable refs)
const addTxn    = useAddTransaction();
const addCust   = useAddCustomer();
const setName   = useSetShopName();
const clearAll  = useClearAll();
```

---

## Quick Start

```bash
npm install
npx react-native run-android   # Android
npx react-native run-ios       # iOS (Mac only)
```

### Dependencies added vs old version
```
zustand        ^4.5.2   — state management
immer          ^10.0.3  — immutable mutations
```

### Dependencies removed vs old version
```
(none from React itself — Context/useReducer are built-in)
```

---

## File Structure

```
src/
├── store/
│   └── useHisaabStore.ts     ← THE ENTIRE STATE (one file!)
├── screens/
│   ├── HomeScreen.tsx
│   ├── AIScreen.tsx
│   ├── UdharScreen.tsx
│   ├── ReportsScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   └── AddTransactionSheet.tsx
├── navigation/
│   └── RootNavigator.tsx
└── utils/
    ├── theme.ts
    └── helpers.ts
```

---

Made with ❤️ for Pakistan · حساب
# Hisaab
# Hisaab
