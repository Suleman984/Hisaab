/**
 * ╔══════════════════════════════════════════════════════╗
 *  HISAAB — ZUSTAND STORE
 *  
 *  Why Zustand over useReducer+Context?
 *  ─────────────────────────────────────
 *  ✅ No Provider wrapping needed
 *  ✅ Components only re-render when THEIR slice changes
 *  ✅ Built-in AsyncStorage persistence (persist middleware)
 *  ✅ Immer for safe mutations — write like you're mutating,
 *     Immer produces a new immutable state under the hood
 *  ✅ No action types, no dispatch — just call functions
 *  ✅ Selectors are just hook calls — no mapStateToProps
 *  ✅ Devtools work out of the box
 * ╚══════════════════════════════════════════════════════╝
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid, today, dateStr } from '../utils/helpers';

// ─── Types ────────────────────────────────────────────

export type TxnType = 'sale' | 'expense' | 'credit';
export type CustType = 'receive' | 'pay';

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  desc: string;
  time: number;
  date: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  amount: number;
  type: CustType;
  last: string;
  colorIndex: number;
}

export interface DayStats {
  income: number;
  expense: number;
  balance: number;
  salesCount: number;
  expenseCount: number;
}

// ─── Store Interface ──────────────────────────────────

interface HisaabState {
  // ── Data ──
  shopName: string;
  transactions: Transaction[];
  customers: Customer[];
  lang: 'en' | 'ur';
  isPro: boolean;

  // ── Transaction Actions ──
  addTransaction: (type: TxnType, amount: number, desc: string, customerId?: string) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;

  // ── Customer Actions ──
  addCustomer: (name: string, phone: string, amount: number, type: CustType) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  adjustCustomerBalance: (id: string, amount: number, direction: 'add' | 'subtract') => void;

  // ── Settings Actions ──
  setShopName: (name: string) => void;
  setLang: (lang: 'en' | 'ur') => void;
  setPro: (isPro: boolean) => void;
  clearAll: () => void;

  // ── Computed / Selectors ──
  // (defined as functions so they always read fresh state)
  getDayStats: (date?: string) => DayStats;
  getFilteredTxns: (period: 'today' | 'week' | 'month' | 'all') => Transaction[];
  getTotalUdhar: () => { toReceive: number; toPay: number };
}

// ─── Seed Data ────────────────────────────────────────

const now = Date.now();
const D = 86400000;

const SEED_TXNS: Transaction[] = [
  { id: 's1', type: 'sale',    amount: 1200, desc: 'Rice & Flour',    time: now - 2 * 3600000, date: today() },
  { id: 's2', type: 'expense', amount: 450,  desc: 'Electricity Bill', time: now - 4 * 3600000, date: today() },
  { id: 's3', type: 'sale',    amount: 850,  desc: 'Doodh & Bread',   time: now - 6 * 3600000, date: today() },
  { id: 's4', type: 'sale',    amount: 2200, desc: 'Grocery Bundle',  time: now - D,     date: dateStr(now - D) },
  { id: 's5', type: 'expense', amount: 800,  desc: 'Stock Purchase',  time: now - D,     date: dateStr(now - D) },
  { id: 's6', type: 'sale',    amount: 1500, desc: 'Atta 10kg',       time: now - 2 * D, date: dateStr(now - 2 * D) },
  { id: 's7', type: 'sale',    amount: 650,  desc: 'Cold Drinks',     time: now - 3 * D, date: dateStr(now - 3 * D) },
  { id: 's8', type: 'expense', amount: 300,  desc: 'Packing Material',time: now - 3 * D, date: dateStr(now - 3 * D) },
];

const SEED_CUSTS: Customer[] = [
  { id: 'c1', name: 'Khalid Ahmed', phone: '0301-1234567', amount: 1400, type: 'receive', last: '2 days ago', colorIndex: 0 },
  { id: 'c2', name: 'Sara Khan',    phone: '0322-9876543', amount: 2800, type: 'receive', last: 'Today',      colorIndex: 1 },
  { id: 'c3', name: 'Muhammad Ali', phone: '',             amount: 1000, type: 'pay',     last: '5 days ago', colorIndex: 2 },
];

// ─── Store ────────────────────────────────────────────
//
//  Middleware stack (inside-out):
//  immer  →  makes mutations safe (draft pattern)
//  devtools → Redux DevTools support
//  persist  → AsyncStorage persistence
//
// ─────────────────────────────────────────────────────

export const useHisaabStore = create<HisaabState>()(
  persist(
    devtools(
      immer((set, get) => ({

        // ── Initial State ──────────────────────────
        shopName:     "Ahmed's Store",
        transactions: SEED_TXNS,
        customers:    SEED_CUSTS,
        lang:         'en',
        isPro:        false,

        // ── Transaction Actions ────────────────────

        addTransaction: (type, amount, desc, customerId) =>
          set(state => {
            // Immer lets us push directly — no spread needed!
            state.transactions.unshift({
              id: uid(),
              type,
              amount,
              desc,
              time: Date.now(),
              date: today(),
              ...(customerId ? { customerId } : {}),
            });
          }),

        deleteTransaction: (id) =>
          set(state => {
            const idx = state.transactions.findIndex(t => t.id === id);
            if (idx !== -1) state.transactions.splice(idx, 1);
          }),

        clearTransactions: () =>
          set(state => { state.transactions = []; }),

        // ── Customer Actions ───────────────────────

        addCustomer: (name, phone, amount, type) =>
          set(state => {
            state.customers.unshift({
              id:         uid(),
              name,
              phone,
              amount,
              type,
              last:       'Just now',
              colorIndex: state.customers.length % 5,
            });
          }),

        updateCustomer: (id, patch) =>
          set(state => {
            const c = state.customers.find(c => c.id === id);
            if (c) Object.assign(c, patch);
          }),

        deleteCustomer: (id) =>
          set(state => {
            const idx = state.customers.findIndex(c => c.id === id);
            if (idx !== -1) state.customers.splice(idx, 1);
          }),

        /**
         * adjustCustomerBalance
         * Handles the tricky case where a customer flips
         * from "owes you" to "you owe them" if balance goes negative
         */
        adjustCustomerBalance: (id, amount, direction) =>
          set(state => {
            const c = state.customers.find(c => c.id === id);
            if (!c) return;

            // If receive: add=increase debt, subtract=they paid
            // If pay: add=they gave more, subtract=I paid them back
            const delta = direction === 'add' ? amount : -amount;
            const signed = c.type === 'receive' ? delta : -delta;
            const newAmt = c.amount + signed;

            if (newAmt < 0) {
              // Flip the relationship
              c.type   = c.type === 'receive' ? 'pay' : 'receive';
              c.amount = Math.abs(newAmt);
            } else {
              c.amount = newAmt;
            }
            c.last = 'Just now';
          }),

        // ── Settings Actions ───────────────────────

        setShopName: (name) =>
          set(state => { state.shopName = name; }),

        setLang: (lang) =>
          set(state => { state.lang = lang; }),

        setPro: (isPro) =>
          set(state => { state.isPro = isPro; }),

        clearAll: () =>
          set(state => {
            state.transactions = [];
            state.customers    = [];
          }),

        // ── Computed Selectors ─────────────────────
        //
        //  These read from get() so they always return
        //  fresh values without causing re-renders on
        //  their own (they're just functions).
        //
        //  Usage in component:
        //    const stats = useHisaabStore(s => s.getDayStats())
        //    → component re-renders ONLY when transactions change
        // ──────────────────────────────────────────

        getDayStats: (date = today()) => {
          const txns = get().transactions.filter(t => t.date === date);
          const income  = txns.filter(t => t.type === 'sale')   .reduce((s, t) => s + t.amount, 0);
          const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return {
            income,
            expense,
            balance:      income - expense,
            salesCount:   txns.filter(t => t.type === 'sale').length,
            expenseCount: txns.filter(t => t.type === 'expense').length,
          };
        },

        getFilteredTxns: (period) => {
          const txns = get().transactions;
          const n    = new Date();
          if (period === 'today') {
            return txns.filter(t => t.date === today());
          }
          if (period === 'week') {
            const wa = new Date(n.getTime() - 7 * D).toISOString().split('T')[0];
            return txns.filter(t => t.date >= wa);
          }
          if (period === 'month') {
            const ma = new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0];
            return txns.filter(t => t.date >= ma);
          }
          return txns; // 'all'
        },

        getTotalUdhar: () => {
          const custs = get().customers;
          return {
            toReceive: custs.filter(c => c.type === 'receive').reduce((s, c) => s + c.amount, 0),
            toPay:     custs.filter(c => c.type === 'pay')    .reduce((s, c) => s + c.amount, 0),
          };
        },

      })),
      { name: 'HisaabStore' } // devtools label
    ),

    // ── Persist Config ─────────────────────────────
    {
      name:    'hisaab-storage',          // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),

      // Only persist data — not computed functions
      partialize: (state) => ({
        shopName:     state.shopName,
        transactions: state.transactions,
        customers:    state.customers,
        lang:         state.lang,
        isPro:        state.isPro,
      }),
    }
  )
);

// ─── Slice Hooks (fine-grained subscriptions) ─────────
//
//  Each hook subscribes ONLY to its own slice.
//  e.g. useShopName() won't re-render when transactions change.
//
// ─────────────────────────────────────────────────────

export const useShopName      = () => useHisaabStore(s => s.shopName);
export const useTransactions  = () => useHisaabStore(s => s.transactions);
export const useCustomers     = () => useHisaabStore(s => s.customers);
export const useLang          = () => useHisaabStore(s => s.lang);
export const useIsPro         = () => useHisaabStore(s => s.isPro);

// Action hooks — these NEVER cause re-renders (actions are stable refs)
export const useAddTransaction       = () => useHisaabStore(s => s.addTransaction);
export const useDeleteTransaction    = () => useHisaabStore(s => s.deleteTransaction);
export const useAddCustomer          = () => useHisaabStore(s => s.addCustomer);
export const useUpdateCustomer       = () => useHisaabStore(s => s.updateCustomer);
export const useDeleteCustomer       = () => useHisaabStore(s => s.deleteCustomer);
export const useAdjustCustomerBalance= () => useHisaabStore(s => s.adjustCustomerBalance);
export const useSetShopName          = () => useHisaabStore(s => s.setShopName);
export const useSetLang              = () => useHisaabStore(s => s.setLang);
export const useSetPro               = () => useHisaabStore(s => s.setPro);
export const useClearAll             = () => useHisaabStore(s => s.clearAll);

// Computed selector hooks
export const useDayStats     = (date?: string) => useHisaabStore(s => s.getDayStats(date));
export const useFilteredTxns = (period: 'today' | 'week' | 'month' | 'all') =>
  useHisaabStore(s => s.getFilteredTxns(period));
export const useTotalUdhar   = () => useHisaabStore(s => s.getTotalUdhar());
