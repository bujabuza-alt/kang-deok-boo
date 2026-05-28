'use client';
import { useState, useEffect, useMemo } from 'react';

import { DEFAULT_PAYMENT_METHODS, DEFAULT_PRESETS, DEFAULT_CATEGORIES } from '@/expense/constants';
import { TODAY, uid, ls, addMonths }                                     from '@/expense/utils';
import { useTheme }                                                       from '@/expense/context/ThemeContext';

import Header          from '@/expense/components/Header';
import BottomNav       from '@/expense/components/BottomNav';
import FAB             from '@/expense/components/FAB';
import AddExpenseModal from '@/expense/components/AddExpenseModal';
import QuickAddModal   from '@/expense/components/QuickAddModal';

import HomeTab     from '@/expense/components/tabs/HomeTab';
import SearchTab   from '@/expense/components/tabs/SearchTab';
import PaymentTab  from '@/expense/components/tabs/PaymentTab';
import AnalysisTab from '@/expense/components/tabs/AnalysisTab';
import SettingsTab from '@/expense/components/tabs/SettingsTab';

export default function ExpenseApp() {
  const now = new Date();
  const { theme, setTheme } = useTheme();
  const lm = theme === 'light';

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [loaded,         setLoaded]         = useState(false);
  const [expenses,       setExpenses]       = useState([]);
  const [budget,         setBudget]         = useState(500000);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [presets,        setPresets]        = useState(DEFAULT_PRESETS);
  const [categories,     setCategories]     = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    setExpenses(ls.get('et_expenses', []));
    setBudget(ls.get('et_budget', 500000));
    setPaymentMethods(ls.get('et_payment_methods', DEFAULT_PAYMENT_METHODS));
    setPresets(ls.get('et_presets', DEFAULT_PRESETS));
    setCategories(ls.get('et_categories', DEFAULT_CATEGORIES));
    setLoaded(true);
  }, []);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft,   setBudgetDraft]   = useState('');
  const [selDate,       setSelDate]       = useState(null);
  const [activeTab,     setActiveTab]     = useState('home');
  const [fabOpen,       setFabOpen]       = useState(false);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const [form, setForm] = useState({
    date:              TODAY,
    name:              '',
    amount:            '',
    paymentMethod:     DEFAULT_PAYMENT_METHODS[0],
    installmentMonths: '1',
    memo:              '',
  });

  const [showEditModal,  setShowEditModal]  = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm,       setEditForm]       = useState({
    date: '', name: '', amount: '', paymentMethod: '', memo: '',
  });

  useEffect(() => { if (loaded) ls.set('et_expenses',        expenses);       }, [expenses,       loaded]);
  useEffect(() => { if (loaded) ls.set('et_budget',          budget);         }, [budget,         loaded]);
  useEffect(() => { if (loaded) ls.set('et_payment_methods', paymentMethods); }, [paymentMethods, loaded]);
  useEffect(() => { if (loaded) ls.set('et_presets',         presets);        }, [presets,        loaded]);
  useEffect(() => { if (loaded) ls.set('et_categories',      categories);     }, [categories,     loaded]);

  useEffect(() => {
    if (loaded && paymentMethods.length > 0) {
      setForm(f => ({ ...f, paymentMethod: paymentMethods[0] }));
    }
  }, [loaded, paymentMethods]);

  const monthExpenses = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return expenses.filter(e => e.date.startsWith(prefix));
  }, [expenses, year, month]);

  const dayTotals = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => { map[e.date] = (map[e.date] || 0) + e.amount; });
    return map;
  }, [monthExpenses]);

  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses]
  );

  const calDays = useMemo(() => {
    const startDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(startDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  const selExpenses = useMemo(
    () => (selDate ? expenses.filter(e => e.date === selDate) : []),
    [expenses, selDate]
  );

  const goPrev = () => {
    setSelDate(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const goNext = () => {
    setSelDate(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const openAddModal = (date = TODAY) => {
    setForm({ date, name: '', amount: '', paymentMethod: paymentMethods[0] ?? '', installmentMonths: '1', memo: '' });
    setShowAddModal(true);
    setFabOpen(false);
  };

  const addExpense = () => {
    const amount       = parseFloat(form.amount);
    const installments = Math.max(1, parseInt(form.installmentMonths, 10) || 1);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;

    if (installments <= 1) {
      setExpenses(prev => [...prev, {
        id: uid(), date: form.date, name: form.name.trim(),
        amount, paymentMethod: form.paymentMethod, memo: form.memo.trim(),
      }]);
    } else {
      const groupId   = uid();
      const perMonth  = Math.floor(amount / installments);
      const remainder = amount - perMonth * installments;
      const userMemo  = form.memo.trim();
      const entries   = Array.from({ length: installments }, (_, i) => ({
        id:                 uid(),
        date:               addMonths(form.date, i),
        name:               form.name.trim(),
        amount:             i === 0 ? perMonth + remainder : perMonth,
        paymentMethod:      form.paymentMethod,
        memo:               userMemo
          ? `${i + 1}/${installments}개월 할부 · ${userMemo}`
          : `${i + 1}/${installments}개월 할부`,
        installmentGroupId: groupId,
      }));
      setExpenses(prev => [...prev, ...entries]);
    }
    setShowAddModal(false);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      date: expense.date, name: expense.name, amount: String(expense.amount),
      paymentMethod: expense.paymentMethod, memo: expense.memo ?? '',
    });
    setShowEditModal(true);
  };

  const updateExpense = () => {
    const amount = parseFloat(editForm.amount);
    if (!editForm.name.trim() || isNaN(amount) || amount <= 0) return;

    const newName = editForm.name.trim();

    if (editingExpense.installmentGroupId) {
      const groupId = editingExpense.installmentGroupId;
      setExpenses(prev => prev.map(e => {
        if (e.id === editingExpense.id)
          return { ...e, date: editForm.date, name: newName, amount, paymentMethod: editForm.paymentMethod, memo: editForm.memo };
        if (e.installmentGroupId === groupId)
          return { ...e, name: newName, amount, paymentMethod: editForm.paymentMethod };
        return e;
      }));
    } else {
      const legacyMatch = editingExpense.name.match(/^(.+) \((\d+)\/(\d+)개월\)$/);
      if (legacyMatch) {
        const [, origBase, , totalStr] = legacyMatch;
        const total        = parseInt(totalStr, 10);
        const newNameMatch = newName.match(/^(.+) \(\d+\/\d+개월\)$/);
        const newBase      = newNameMatch ? newNameMatch[1] : newName;

        setExpenses(prev => prev.map(e => {
          if (e.id === editingExpense.id)
            return { ...e, date: editForm.date, name: newName, amount, paymentMethod: editForm.paymentMethod, memo: editForm.memo };
          const sub = e.name.match(/^(.+) \((\d+)\/(\d+)개월\)$/);
          if (sub && sub[1] === origBase && parseInt(sub[3], 10) === total) {
            const k = parseInt(sub[2], 10);
            return { ...e, name: `${newBase} (${k}/${total}개월)`, paymentMethod: editForm.paymentMethod, amount };
          }
          return e;
        }));
      } else {
        setExpenses(prev => prev.map(e =>
          e.id === editingExpense.id
            ? { ...e, date: editForm.date, name: newName, amount, paymentMethod: editForm.paymentMethod, memo: editForm.memo }
            : e
        ));
      }
    }

    setShowEditModal(false);
    setEditingExpense(null);
  };

  const addPreset = (preset) => {
    setExpenses(prev => [...prev, {
      id: uid(), date: selDate || TODAY,
      name: preset.name, amount: preset.amount, paymentMethod: preset.paymentMethod, memo: '',
    }]);
  };

  const deleteExpense  = (id) => setExpenses(prev => prev.filter(e => e.id !== id));
  const renameCategory = (oldName, newName) => {
    setCategories(prev => prev.map(c => c.name === oldName ? { ...c, name: newName } : c));
    setExpenses(prev => prev.map(e => e.name === oldName ? { ...e, name: newName } : e));
  };

  const saveBudget = () => {
    const val = parseFloat(budgetDraft.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val >= 0) setBudget(val);
    setEditingBudget(false);
    setBudgetDraft('');
  };

  const handleFabToggle  = () => setFabOpen(o => !o);
  const handleGeneralAdd = () => { setFabOpen(false); openAddModal(selDate || TODAY); };
  const handleQuickAdd   = () => { setFabOpen(false); setShowQuickModal(true); };
  const handleTabChange  = (tab) => { setActiveTab(tab); setFabOpen(false); };

  if (!loaded) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${lm ? 'bg-slate-50' : 'bg-gray-950'}`}>
        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${lm ? 'border-indigo-400' : 'border-violet-400'}`} />
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className={`min-h-screen ${lm ? 'bg-slate-50 text-slate-900' : 'bg-gray-950 text-white'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* 헤더: 스크롤 시 상단 고정 */}
      <Header />

      <div
        className="max-w-md mx-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        {activeTab === 'home' && (
          <HomeTab
            budget={budget}            monthTotal={monthTotal}
            editingBudget={editingBudget} budgetDraft={budgetDraft}
            onEditBudgetStart={() => { setEditingBudget(true); setBudgetDraft(String(budget)); }}
            onBudgetDraftChange={setBudgetDraft}
            onSaveBudget={saveBudget}
            onCancelBudgetEdit={() => setEditingBudget(false)}
            year={year} month={month}
            calDays={calDays} dayTotals={dayTotals}
            selDate={selDate} today={TODAY}
            onPrev={goPrev} onNext={goNext}
            onSelectDate={setSelDate}
            selExpenses={selExpenses}
            onOpenAddModal={openAddModal}
            onDeleteExpense={deleteExpense}
            onEditExpense={openEditModal}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            expenses={expenses}
            paymentMethods={paymentMethods}
            onDeleteExpense={deleteExpense}
            onEditExpense={openEditModal}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentTab
            expenses={expenses}
            paymentMethods={paymentMethods}
            onDeleteExpense={deleteExpense}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            expenses={expenses}
            budget={budget}
            year={year}
            month={month}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            paymentMethods={paymentMethods}
            presets={presets}
            onUpdatePaymentMethods={setPaymentMethods}
            onUpdatePresets={setPresets}
            categories={categories}
            onUpdateCategories={setCategories}
            onRenameCategory={renameCategory}
            theme={theme}
            onThemeChange={setTheme}
            expenses={expenses}
            budget={budget}
            onUpdateExpenses={setExpenses}
            onUpdateBudget={setBudget}
          />
        )}
      </div>

      {activeTab === 'home' && (
        <FAB
          isOpen={fabOpen}
          onToggle={handleFabToggle}
          onGeneralAdd={handleGeneralAdd}
          onQuickAdd={handleQuickAdd}
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {showAddModal && (
        <AddExpenseModal
          form={form}
          paymentMethods={paymentMethods}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onFieldChange={(field, value) => setForm(f => ({ ...f, [field]: value }))}
          onSubmit={addExpense}
        />
      )}

      {showEditModal && (
        <AddExpenseModal
          editMode
          editingExpense={editingExpense}
          form={editForm}
          paymentMethods={paymentMethods}
          categories={categories}
          onClose={() => { setShowEditModal(false); setEditingExpense(null); }}
          onFieldChange={(field, value) => setEditForm(f => ({ ...f, [field]: value }))}
          onSubmit={updateExpense}
        />
      )}

      {showQuickModal && (
        <QuickAddModal
          presets={presets}
          selDate={selDate}
          onClose={() => setShowQuickModal(false)}
          onAddPreset={addPreset}
        />
      )}
    </div>
  );
}
