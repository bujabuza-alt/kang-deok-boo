'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS, DAYS } from '@/expense/constants';
import { compact } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

export default function CalendarView({
  year, month, calDays, dayTotals, selDate, today,
  onPrev, onNext, onSelectDate,
}) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <section className={`rounded-2xl overflow-hidden ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onPrev}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-gray-800 text-gray-400'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{year}년 {MONTHS[month]}</span>
        <button
          onClick={onNext}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-gray-800 text-gray-400'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className={`grid grid-cols-7 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center py-2 text-[10px] font-bold ${
              i === 0
                ? lm ? 'text-red-500'  : 'text-red-400'
                : i === 6
                  ? lm ? 'text-blue-500' : 'text-sky-400'
                  : lm ? 'text-slate-400' : 'text-gray-600'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
        {calDays.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`e-${i}`}
                className={`min-h-[7vh] border-b border-r ${lm ? 'border-slate-100/80' : 'border-gray-800/40'}`}
              />
            );
          }

          const ds      = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const total   = dayTotals[ds] || 0;
          const isToday = ds === today;
          const isSel   = ds === selDate;
          const dow     = new Date(year, month, day).getDay();

          return (
            <button
              key={ds}
              onClick={() => onSelectDate(isSel ? null : ds)}
              className={`
                relative flex flex-col items-center justify-start
                min-h-[7vh] pt-2 pb-1.5
                border-b border-r transition-colors select-none
                ${lm ? 'border-slate-100/80' : 'border-gray-800/40'}
                ${isSel
                  ? lm ? 'bg-indigo-50' : 'bg-violet-950/60'
                  : lm ? 'hover:bg-slate-50' : 'hover:bg-gray-800/50'}
              `}
            >
              {isToday && (
                <span className={`absolute top-1.5 left-0 right-0 mx-auto w-6 h-6 rounded-full border ${lm ? 'bg-indigo-100 border-indigo-400/60' : 'bg-violet-600/20 border-violet-500/60'}`} />
              )}
              <span className={`
                relative z-10 text-xs font-semibold
                w-6 h-6 flex items-center justify-center rounded-full
                ${isToday
                  ? lm ? 'text-indigo-600' : 'text-violet-300'
                  : dow === 0
                    ? lm ? 'text-red-500'  : 'text-red-400'
                    : dow === 6
                      ? lm ? 'text-blue-500' : 'text-sky-400'
                      : lm ? 'text-slate-700' : 'text-gray-300'}
              `}>
                {day}
              </span>
              {total > 0 ? (
                <span className="text-[9px] text-rose-500 font-bold leading-tight mt-0.5">
                  {compact(total)}
                </span>
              ) : (
                <span className="w-1 h-1 rounded-full bg-emerald-500/70 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className={`flex items-center gap-4 px-4 py-2.5 border-t ${lm ? 'border-slate-100 bg-slate-50/50' : 'border-gray-800'}`}>
        <div className={`flex items-center gap-1.5 text-[10px] ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 inline-block" />
          지출 없음
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
          <span className="text-rose-500 font-bold text-[9px]">1,000</span>
          지출 있음
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
          <span className={`w-3 h-3 rounded-full border inline-block ${lm ? 'border-indigo-400/60' : 'border-violet-500/60'}`} />
          오늘
        </div>
      </div>
    </section>
  );
}
