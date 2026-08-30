'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/MemoEditModal.jsx
// 메모 추가·수정 모달. 제목/본문 + 체크리스트를 함께 편집합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X, Plus, Trash2, Pin } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';

const makeDefaultForm = () => ({ title: '', body: '', checklist: [], pinned: false });

export function MemoEditModal({ memo, onSave, onClose }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [form, setForm] = useState(
    memo ? { title: memo.title, body: memo.body, checklist: memo.checklist || [], pinned: memo.pinned || false } : makeDefaultForm()
  );
  const [newItem, setNewItem] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addChecklistItem = () => {
    const text = newItem.trim();
    if (!text) return;
    set('checklist', [...form.checklist, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, done: false }]);
    setNewItem('');
  };

  const toggleItem = (id) => {
    set('checklist', form.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  };

  const removeItem = (id) => {
    set('checklist', form.checklist.filter((c) => c.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() && !form.body.trim() && form.checklist.length === 0) return;
    onSave(form);
    onClose();
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
    lm ? 'border-slate-200 text-slate-800 placeholder:text-slate-400' : 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col ${
          lm ? 'bg-white' : 'bg-gray-900'
        }`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{memo ? '메모 수정' : '새 메모'}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => set('pinned', !form.pinned)}
              aria-label={form.pinned ? '고정 해제' : '상단에 고정'}
              className={`p-2 rounded-xl transition-colors ${
                form.pinned
                  ? 'text-amber-500 bg-amber-50'
                  : lm ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <Pin className="w-4 h-4" fill={form.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">
          <input
            type="text"
            autoFocus
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="제목"
            className={`${inputCls} text-base font-semibold`}
          />

          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="내용을 적어보세요"
            rows={4}
            className={`${inputCls} resize-none text-sm`}
          />

          <div>
            <label className={`block text-sm font-medium mb-2 ${lm ? 'text-slate-700' : 'text-gray-300'}`}>체크리스트</label>
            <div className="flex flex-col gap-1.5 mb-2">
              {form.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${lm ? 'border-slate-100 bg-slate-50' : 'border-gray-800 bg-gray-800'}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-label={item.done ? '완료 취소' : '완료 처리'}
                    className={`shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.done ? 'bg-indigo-600 border-indigo-600' : lm ? 'border-slate-300' : 'border-gray-600'
                    }`}
                  >
                    {item.done && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.done ? (lm ? 'line-through text-slate-400' : 'line-through text-gray-500') : (lm ? 'text-slate-700' : 'text-gray-200')}`}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={`p-1 rounded-lg ${lm ? 'text-slate-300 hover:text-rose-500 hover:bg-rose-50' : 'text-gray-600 hover:text-rose-400 hover:bg-rose-950/40'}`}
                    aria-label="항목 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                placeholder="할 일 추가"
                className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  lm ? 'border-slate-200 text-slate-800 placeholder:text-slate-400' : 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
                }`}
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className={`px-3 rounded-xl border transition-colors ${lm ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                aria-label="체크리스트 항목 추가"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${
                lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {memo ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
