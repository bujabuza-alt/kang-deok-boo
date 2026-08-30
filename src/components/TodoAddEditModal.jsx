'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TodoAddEditModal.jsx
// 할 일 추가·수정 모달.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PRIORITY_LEVELS, TODO_TYPES } from '@/lib/todoCategories';
import { useTheme } from '@/expense/context/ThemeContext';

const makeDefaultForm = (firstCategoryId, date) => ({
  title: '',
  date: date || new Date().toISOString().split('T')[0],
  time: '',
  categoryId: firstCategoryId || null,
  priority: 'medium',
  todoType: 'daily',
  memo: '',
});

export function TodoAddEditModal({ todo, categories, onSave, onClose }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const firstCategoryId = categories[0]?.id || null;
  const [form, setForm] = useState(makeDefaultForm(firstCategoryId, todo?.date));

  useEffect(() => {
    if (todo?.id) {
      setForm({
        title: todo.title || '',
        date: todo.date || '',
        time: todo.time || '',
        categoryId: todo.categoryId || firstCategoryId,
        priority: todo.priority || 'medium',
        todoType: todo.todoType || 'daily',
        memo: todo.memo || '',
      });
    } else {
      setForm(makeDefaultForm(firstCategoryId, todo?.date));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const isEdit = Boolean(todo?.id);
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

      <div className={`relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col ${lm ? 'bg-white' : 'bg-gray-900'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{isEdit ? '할 일 수정' : '새 할 일 추가'}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">
          {/* 제목 */}
          <div>
            <label className={labelCls}>
              할 일 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="무엇을 해야 하나요?"
              required
              className={inputCls}
            />
          </div>

          {/* 날짜 + 시간 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={`${inputCls} text-sm`}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>시간</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className={`${inputCls} text-sm`}
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className={labelCls}>카테고리</label>
            {categories.length === 0 ? (
              <p className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>카테고리를 먼저 추가해 주세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = form.categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => set('categoryId', cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-150 ${
                        isSelected
                          ? `${cat.activeBg} ${cat.activeText} ${cat.activeBorder} shadow-sm scale-[1.04]`
                          : lm
                            ? `bg-white text-slate-500 border-slate-200 ${cat.hoverBg} ${cat.hoverBorder} hover:text-slate-700`
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 우선순위 */}
          <div>
            <label className={labelCls}>우선순위</label>
            <div className="flex gap-2">
              {PRIORITY_LEVELS.map((p) => {
                const isSelected = form.priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set('priority', p.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      isSelected
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

          {/* 할 일 유형 (일일/주간/월간) */}
          <div>
            <label className={labelCls}>할 일 유형</label>
            <div className="flex gap-2">
              {TODO_TYPES.map((t) => {
                const isSelected = form.todoType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('todoType', t.id)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                        : lm ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className={labelCls}>메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="메모를 남겨보세요 (선택)"
              rows={3}
              className={`${inputCls} resize-none text-sm`}
            />
          </div>

          {/* 저장·취소 */}
          <div className="flex gap-3 pt-2 pb-1">
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
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
