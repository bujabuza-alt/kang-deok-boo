'use client';
import { Check, X } from 'lucide-react';
import { fmt, fmtInput, parseInput } from '@/expense/utils';
import { useTheme } from '@/context/ThemeContext';

const signed = (n) => `${n >= 0 ? '+' : '−'}₩${fmt(Math.abs(n))}`;

export default function BudgetCard({
  summary, carryEnabled, onToggleCarry,
  editingBudget, budgetDraft,
  onEditStart, onDraftChange, onSave, onCancel,
}) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const { base, carryover, effective: budget, spent: monthTotal, remaining, perDay, todayLeft, daysLeft, status } = summary;
  const muted = lm ? 'text-slate-400' : 'text-gray-500';

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
              value={fmtInput(budgetDraft)}
              onChange={e => onDraftChange(parseInput(e.target.value))}
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
            ₩{fmt(base)}
          </button>
        )}
      </div>

      <div className={`flex items-center justify-between text-[11px] ${muted}`}>
        <span>
          {carryEnabled ? (
            <>
              이월 <span className={carryover < 0 ? 'text-red-500 font-semibold' : carryover > 0 ? 'text-emerald-500 font-semibold' : ''}>{signed(carryover)}</span>
              {' '}→ 실예산 <span className={`font-semibold ${lm ? 'text-slate-700' : 'text-gray-200'}`}>₩{fmt(budget)}</span>
            </>
          ) : '예산 이월 꺼짐'}
        </span>
        <button
          onClick={onToggleCarry}
          className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
            carryEnabled
              ? lm ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-900/30 text-violet-400'
              : lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-500'
          }`}
        >
          이월 {carryEnabled ? 'ON' : 'OFF'}
        </button>
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

      {status === 'current' && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`rounded-xl px-3 py-2 ${lm ? 'bg-slate-50' : 'bg-gray-800'}`}>
            <p className={`text-[10px] ${muted}`}>오늘 사용 가능 · {daysLeft}일 남음</p>
            <p className={`text-base font-black ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>₩{fmt(perDay)}</p>
          </div>
          <div className={`rounded-xl px-3 py-2 ${lm ? 'bg-slate-50' : 'bg-gray-800'}`}>
            <p className={`text-[10px] ${muted}`}>오늘 남은 금액</p>
            <p className={`text-base font-black ${todayLeft < 0 ? 'text-red-500' : lm ? 'text-slate-800' : 'text-white'}`}>
              {todayLeft < 0 ? '−' : ''}₩{fmt(Math.abs(todayLeft))}
            </p>
          </div>
        </div>
      )}

      {status === 'future' && (
        <p className={`text-xs ${muted}`}>하루 평균 ₩{fmt(perDay)}씩 쓸 수 있어요</p>
      )}

      {remaining < 0 && budget > 0 && (
        <p className="text-xs font-semibold text-red-500">
          ⚠ 예산 초과 — ₩{fmt(-remaining)} 더 사용했습니다{carryEnabled ? (status === 'past' ? ' → 다음달 예산에서 차감' : ' (다음달 예산에서 차감 예정)') : ''}
        </p>
      )}

      {status === 'past' && carryEnabled && remaining >= 0 && budget > 0 && (
        <p className="text-xs font-semibold text-emerald-500">₩{fmt(remaining)} 남김 → 다음달 예산에 추가</p>
      )}
    </section>
  );
}
