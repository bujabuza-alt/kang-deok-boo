'use client';
import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { fmt }    from '@/expense/utils';
import { MONTHS } from '@/expense/constants';
import { useTheme } from '@/expense/context/ThemeContext';

const PALETTE = [
  'bg-violet-500', 'bg-blue-500',   'bg-emerald-500', 'bg-amber-400',
  'bg-rose-500',   'bg-sky-500',    'bg-orange-500',  'bg-pink-500',
  'bg-teal-500',   'bg-indigo-500', 'bg-lime-500',    'bg-cyan-500',
];

export default function AnalysisTab({ expenses, budget, year, month }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const monthExpenses = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return expenses.filter(e => e.date.startsWith(prefix));
  }, [expenses, year, month]);

  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses]
  );

  const categories = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      map[e.name] = (map[e.name] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, amount]) => ({
        name,
        amount,
        pct:       monthTotal > 0 ? (amount / monthTotal) * 100 : 0,
        budgetPct: budget > 0     ? (amount / budget)     * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, monthTotal, budget]);

  const budgetPct = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;
  const barColor  =
    budgetPct < 60 ? 'bg-emerald-500' :
    budgetPct < 85 ? 'bg-amber-400'   : 'bg-red-500';

  const cardCls = `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;

  return (
    <div className="space-y-4">
      <section className={cardCls}>
        <div className="flex items-center gap-2">
          <BarChart2 className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <span className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{year}년 {MONTHS[month]} 분석</span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-black ${lm ? 'text-slate-900' : 'text-white'}`}>₩{fmt(monthTotal)}</span>
          {budget > 0 && (
            <span className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>예산 ₩{fmt(budget)}</span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className={`w-full h-2 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className={`flex justify-between text-[10px] ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
            <span>{budgetPct.toFixed(1)}% 사용</span>
            {budget > 0 && (
              <span>
                {monthTotal <= budget
                  ? `₩${fmt(budget - monthTotal)} 남음`
                  : `₩${fmt(monthTotal - budget)} 초과`}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className={`rounded-2xl p-4 space-y-4 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`}>
        <h3 className={`text-sm font-bold ${lm ? 'text-slate-700' : 'text-gray-300'}`}>카테고리별 지출 비중</h3>

        {categories.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📊</div>
            <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-600'}`}>이번 달 지출 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map(({ name, amount, pct, budgetPct: bpct }, idx) => {
              const color = PALETTE[idx % PALETTE.length];
              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                      <span className={`text-sm font-medium truncate ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-rose-500">₩{fmt(amount)}</span>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {budget > 0 && (
                    <p className={`text-[10px] pl-4 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
                      전체 예산의 {bpct.toFixed(1)}% 차지
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
