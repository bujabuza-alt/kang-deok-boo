'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/WishlistApp.jsx
// '위시리스트' 탭. 사고 싶은 것들을 담아두고, 구매완료 시 가계부에도
// 지출로 추가할지 물어봅니다 (et_expenses 키를 직접 읽고 씁니다).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, ShoppingBag, Check, ExternalLink } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';
import { useWishlist } from '@/hooks/useWishlist';
import { getPriorityById } from '@/lib/todoCategories';
import { DEFAULT_PAYMENT_METHODS } from '@/expense/constants';
import { ls, fmt, uid, TODAY } from '@/expense/utils';
import { WishlistEditModal } from './WishlistEditModal';

function addToExpenses(item) {
  const expenses = ls.get('et_expenses', []);
  const paymentMethods = ls.get('et_payment_methods', DEFAULT_PAYMENT_METHODS);
  ls.set('et_expenses', [
    ...expenses,
    {
      id: uid(),
      date: TODAY,
      name: item.name,
      amount: item.price,
      paymentMethod: paymentMethods[0] || DEFAULT_PAYMENT_METHODS[0],
      memo: '위시리스트에서 추가',
    },
  ]);
}

function WishlistRow({ item, lm, onTogglePurchased, onEdit, onDelete }) {
  const priority = getPriorityById(item.priority);
  const purchased = item.purchased;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        purchased
          ? lm ? 'bg-slate-50 border-slate-100' : 'bg-gray-900 border-gray-800'
          : lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-800 border-gray-700 hover:border-violet-700'
      }`}
    >
      <button
        onClick={() => onTogglePurchased(item)}
        aria-label={purchased ? '구매 취소' : '구매 완료'}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          purchased ? 'bg-indigo-600 border-indigo-600' : lm ? 'border-slate-300 hover:border-indigo-400' : 'border-gray-600 hover:border-violet-400'
        }`}
      >
        {purchased && <Check className="w-3 h-3 text-white" />}
      </button>

      {!purchased && <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${priority.dot}`} title={`우선순위: ${priority.label}`} />}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${purchased ? (lm ? 'line-through text-slate-400' : 'line-through text-gray-500') : (lm ? 'text-slate-800' : 'text-gray-100')}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.price != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${purchased ? (lm ? 'bg-slate-100 text-slate-400' : 'bg-gray-800 text-gray-500') : (lm ? 'bg-indigo-50 text-indigo-500' : 'bg-indigo-900/30 text-indigo-400')}`}>
              {fmt(item.price)}원
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`text-[10px] flex items-center gap-0.5 ${lm ? 'text-slate-400 hover:text-indigo-500' : 'text-gray-500 hover:text-violet-400'}`}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              링크
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(item)}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600' : 'hover:bg-gray-700 text-gray-500 hover:text-violet-400'}`}
          aria-label="위시리스트 수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'hover:bg-rose-950/40 text-gray-500 hover:text-rose-400'}`}
          aria-label="위시리스트 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function WishlistApp({ triggerAdd = false, onTriggerAddDone }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { items, loaded, addItem, updateItem, deleteItem, togglePurchased } = useWishlist();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const prevTriggerAdd = useRef(false);

  useEffect(() => {
    if (triggerAdd && !prevTriggerAdd.current) {
      setEditingItem(null);
      setModalOpen(true);
      onTriggerAddDone?.();
    }
    prevTriggerAdd.current = triggerAdd;
  }, [triggerAdd, onTriggerAddDone]);

  const { pending, purchased } = useMemo(() => {
    const pending = items.filter((it) => !it.purchased);
    const purchasedList = items
      .filter((it) => it.purchased)
      .sort((a, b) => new Date(b.purchasedAt || 0) - new Date(a.purchasedAt || 0));
    return { pending, purchased: purchasedList };
  }, [items]);

  const pendingTotal = useMemo(() => pending.reduce((s, it) => s + (it.price || 0), 0), [pending]);

  const handleSave = (data) => {
    if (editingItem?.id) updateItem(editingItem.id, data);
    else addItem(data);
  };

  const handleTogglePurchased = (item) => {
    if (!item.purchased && item.price > 0) {
      if (window.confirm(`"${item.name}"을(를) 지출에도 ${fmt(item.price)}원으로 추가할까요?`)) {
        addToExpenses(item);
      }
    }
    togglePurchased(item.id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) { deleteItem(deleteConfirm); setDeleteConfirm(null); }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
          {pending.length > 0 ? (
            <>미구매 {pending.length}개 · 예상 <span className={`font-bold ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>{fmt(pendingTotal)}</span>원</>
          ) : (
            '사고 싶은 걸 담아보세요'
          )}
        </p>
        <button
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className={`w-10 h-10 mb-3 ${lm ? 'text-slate-200' : 'text-gray-700'}`} />
          <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>아직 담아둔 항목이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {pending.length === 0 ? (
              <p className={`text-xs py-2 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>미구매 항목이 없어요 🎉</p>
            ) : (
              pending.map((item) => (
                <WishlistRow
                  key={item.id}
                  item={item}
                  lm={lm}
                  onTogglePurchased={handleTogglePurchased}
                  onEdit={(it) => { setEditingItem(it); setModalOpen(true); }}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))
            )}
          </div>

          {purchased.length > 0 && (
            <div className={`flex flex-col gap-2 pt-3 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
              <p className={`text-xs font-semibold px-1 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>구매완료 ({purchased.length})</p>
              {purchased.map((item) => (
                <WishlistRow
                  key={item.id}
                  item={item}
                  lm={lm}
                  onTogglePurchased={handleTogglePurchased}
                  onEdit={(it) => { setEditingItem(it); setModalOpen(true); }}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <WishlistEditModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-sm w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-lg font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>위시리스트 삭제</h3>
            <p className={`text-sm mb-6 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>이 항목을 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2.5 rounded-xl border font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
