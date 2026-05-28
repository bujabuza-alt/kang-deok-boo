'use client';
import { Check, X } from 'lucide-react';
import { fmt } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

export default function BudgetCard({
  budget, monthTotal,
  editingBudget, budgetDraft,
  onEditStart, onDraftChange, onSave, onCancel,
}) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const pct      = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;
  const barColor = pct < 60 ? 'bg-emerald-500' : pct < 85 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <section className={`rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${lm ? 'text-slate-500' : 'text-gray-400'}`}>월 예산</span>
        {editingBudget ? (
          <div className="flex items-center gap-1.5 flex-1 justify-end ml-4">
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={budgetDraft}
              onChange={e => onDraftChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  onSave();
                if (e.key === 'Escape') onCancel();
              }}
              style={{ boxSizing: 'border-box' }}
              className={`flex-1 max-w-[50%] text-right text-sm px-2 py-1 rounded-lg border outline-none transition-colors ${lm ? 'bg-slate-100 border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
            />
            <button onClick={onSave} className={`transition-colors shrink-0 ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`}>
              <Check className="w-4 h-4" />
            </button>
            <button onClick={onCancel} className={`transition-colors shrink-0 ${lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-600 hover:text-gray-400'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onEditStart}
            className={`text-sm font-bold transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`}
          >
            ₩{fmt(budget)}
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-black ${lm ? 'text-slate-900' : 'text-white'}`}>₩{fmt(monthTotal)}</span>
        <span className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{pct.toFixed(1)}% 사용</span>
      </div>

      <div className={`w-full h-1.5 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {monthTotal > budget && budget > 0 && (
        <p className="text-xs font-semibold text-red-500">
          ⚠ 예산 초과 — ₩{fmt(monthTotal - budget)} 더 사용했습니다
        </p>
      )}
    </section>
  );
}
