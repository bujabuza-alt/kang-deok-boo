'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TodoAddEditModal.jsx
// 할 일 추가·수정 모달.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PRIORITY_LEVELS } from '@/lib/todoCategories';

const makeDefaultForm = (firstCategoryId, date) => ({
  title: '',
  date: date || new Date().toISOString().split('T')[0],
  time: '',
  categoryId: firstCategoryId || null,
  priority: 'medium',
  memo: '',
});

export function TodoAddEditModal({ todo, categories, onSave, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? '할 일 수정' : '새 할 일 추가'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              할 일 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="무엇을 해야 하나요?"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* 날짜 + 시간 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">시간</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">카테고리</label>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">카테고리를 먼저 추가해 주세요.</p>
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
                          : `bg-white text-slate-500 border-slate-200 ${cat.hoverBg} ${cat.hoverBorder} hover:text-slate-700`
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">우선순위</label>
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
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="메모를 남겨보세요 (선택)"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 resize-none text-sm"
            />
          </div>

          {/* 저장·취소 */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
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
