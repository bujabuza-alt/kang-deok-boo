'use client';
// ──────────────────────────────────────────────────────────────────────────────
// expense/useExpenseSettingsData.js
// 전역 설정 화면의 '지출 관리' 섹션이 지출 화면(ExpenseApp)과 같은 localStorage
// 데이터(et_*)를 읽고 쓰기 위한 훅. ExpenseApp이 소유한 React state를 직접
// 공유할 수 없는 별도 화면이므로, useTodos 등 다른 기능 훅과 같은
// reload + useSyncListener 패턴으로 localStorage를 직접 다룹니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PAYMENT_METHODS, DEFAULT_PRESETS, DEFAULT_CATEGORIES } from './constants';
import { ls } from './utils';
import { useSyncListener } from '@/hooks/useSyncListener';

export function useExpenseSettingsData() {
  const [loaded, setLoaded] = useState(false);
  const [expenses, setExpensesState] = useState([]);
  const [budget, setBudgetState] = useState(500000);
  const [paymentMethods, setPaymentMethodsState] = useState(DEFAULT_PAYMENT_METHODS);
  const [presets, setPresetsState] = useState(DEFAULT_PRESETS);
  const [categories, setCategoriesState] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    setExpensesState(ls.get('et_expenses', []));
    setBudgetState(ls.get('et_budget', 500000));
    setPaymentMethodsState(ls.get('et_payment_methods', DEFAULT_PAYMENT_METHODS));
    setPresetsState(ls.get('et_presets', DEFAULT_PRESETS));
    setCategoriesState(ls.get('et_categories', DEFAULT_CATEGORIES));
    setLoaded(true);
  }, []);

  useSyncListener('et_expenses', useCallback(() => setExpensesState(ls.get('et_expenses', [])), []));
  useSyncListener('et_budget', useCallback(() => setBudgetState(ls.get('et_budget', 500000)), []));
  useSyncListener('et_payment_methods', useCallback(() => setPaymentMethodsState(ls.get('et_payment_methods', DEFAULT_PAYMENT_METHODS)), []));
  useSyncListener('et_presets', useCallback(() => setPresetsState(ls.get('et_presets', DEFAULT_PRESETS)), []));
  useSyncListener('et_categories', useCallback(() => setCategoriesState(ls.get('et_categories', DEFAULT_CATEGORIES)), []));

  const setExpenses = useCallback((next) => { setExpensesState(next); ls.set('et_expenses', next); }, []);
  const setBudget = useCallback((next) => { setBudgetState(next); ls.set('et_budget', next); }, []);
  const setPaymentMethods = useCallback((next) => { setPaymentMethodsState(next); ls.set('et_payment_methods', next); }, []);
  const setPresets = useCallback((next) => { setPresetsState(next); ls.set('et_presets', next); }, []);
  const setCategories = useCallback((next) => { setCategoriesState(next); ls.set('et_categories', next); }, []);

  // 카테고리 이름을 바꾸면 이미 기록된 지출의 카테고리명도 함께 바꿔줍니다
  // (ExpenseApp이 기존에 하던 동작을 그대로 이식).
  const renameCategory = useCallback(
    (oldName, newName) => {
      setCategories(categories.map((c) => (c.name === oldName ? { ...c, name: newName } : c)));
      setExpenses(expenses.map((e) => (e.name === oldName ? { ...e, name: newName } : e)));
    },
    [categories, expenses, setCategories, setExpenses]
  );

  return {
    loaded,
    expenses, budget, paymentMethods, presets, categories,
    setExpenses, setBudget, setPaymentMethods, setPresets, setCategories,
    renameCategory,
  };
}
