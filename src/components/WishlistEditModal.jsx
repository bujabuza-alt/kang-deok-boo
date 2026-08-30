'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/WishlistEditModal.jsx
// 위시리스트 항목 추가·수정 모달.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X } from 'lucide-react';
import { PRIORITY_LEVELS } from '@/lib/todoCategories';
import { useTheme } from '@/expense/context/ThemeContext';

const makeDefaultForm = () => ({ name: '', price: '', url: '', memo: '', priority: 'medium' });

export function WishlistEditModal({ item, onSave, onClose }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [form, setForm] = useState(
    item
      ? { name: item.name, price: item.price != null ? String(item.price) : '', url: item.url || '', memo: item.memo || '', priority: item.priority || 'medium' }
      : makeDefaultForm()
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const price = form.price.trim() === '' ? null : Number(form.price);
    onSave({ ...form, name: form.name.trim(), price: Number.isFinite(price) ? price : null });
    onClose();
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
    lm ? 'border-slate-200 text-slate-800 placeholder:text-slate-400' : 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
  }`;
  const labelCls = `block text-sm font-medium mb-1.5 ${lm ? 'text-slate-700' : 'text-gray-300'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col ${lm ? 'bg-white' : 'bg-gray-900'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{item ? '위시리스트 수정' : '새 위시리스트'}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">
          <div>
            <label className={labelCls}>
              이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="갖고 싶은 것"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>예상 가격</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="숫자만 입력 (선택)"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>링크</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https:// (선택)"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>우선순위</label>
            <div className="flex gap-2">
              {PRIORITY_LEVELS.map((p) => {
                const selected = form.priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set('priority', p.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      selected
                        ? `${p.bg} ${p.text} border-current`
                        : lm ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="메모를 남겨보세요 (선택)"
              rows={2}
              className={`${inputCls} resize-none text-sm`}
            />
          </div>

          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {item ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
