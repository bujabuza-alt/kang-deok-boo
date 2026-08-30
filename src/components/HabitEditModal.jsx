'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/HabitEditModal.jsx
// 습관 추가·수정 모달.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';

const EMOJI_PRESETS = ['✅', '💧', '🏃', '📖', '🧘', '😴', '🥗', '🚭', '💪', '✍️', '🎸', '🧹'];
const FREQUENCIES = [
  { id: 'daily', label: '매일' },
  { id: 'weekly', label: '매주' },
];

const makeDefaultForm = () => ({ name: '', emoji: '✅', frequency: 'daily' });

export function HabitEditModal({ habit, onSave, onClose }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [form, setForm] = useState(
    habit ? { name: habit.name, emoji: habit.emoji || '✅', frequency: habit.frequency || 'daily' } : makeDefaultForm()
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim(), emoji: form.emoji.trim() || '✅' });
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
          <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{habit ? '습관 수정' : '새 습관'}</h2>
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
              습관 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예: 물 8잔 마시기"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>아이콘</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => set('emoji', emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${
                    form.emoji === emoji
                      ? lm ? 'border-indigo-500 bg-indigo-50' : 'border-violet-500 bg-violet-950/40'
                      : lm ? 'border-slate-200 hover:border-slate-300' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set('emoji', e.target.value)}
              placeholder="직접 이모지를 입력할 수도 있어요"
              maxLength={4}
              className={`${inputCls} text-sm`}
            />
          </div>

          <div>
            <label className={labelCls}>주기</label>
            <div className="flex gap-2">
              {FREQUENCIES.map((f) => {
                const selected = form.frequency === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set('frequency', f.id)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      selected
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                        : lm ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
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
              {habit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
