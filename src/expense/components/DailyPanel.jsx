'use client';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { fmt } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

export default function DailyPanel({ selDate, selExpenses, onAddExpense, onDeleteExpense, onEditExpense }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const total = selExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <section className={`rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`}>{selDate} 지출 내역</h2>
        <button
          onClick={() => onAddExpense(selDate)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${lm ? 'text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100' : 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50'}`}
        >
          <Plus className="w-3 h-3" />
          지출 추가
        </button>
      </div>

      {selExpenses.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">✨</div>
          <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-600'}`}>이 날은 지출이 없어요</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {selExpenses.map(e => (
              <li key={e.id} className={`flex items-center justify-between p-3 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{e.name}</p>
                  <p className={`text-[10px] mt-0.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{e.paymentMethod}</p>
                  {e.memo && (
                    <p className={`text-[10px] mt-0.5 truncate ${lm ? 'text-slate-300' : 'text-gray-600'}`}>{e.memo}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-sm font-bold text-rose-500">₩{fmt(e.amount)}</span>
                  {onEditExpense && (
                    <button
                      onClick={() => onEditExpense(e)}
                      className={`transition-colors ${lm ? 'text-slate-300 hover:text-indigo-600' : 'text-gray-600 hover:text-violet-400'}`}
                      aria-label="편집"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteExpense(e.id)}
                    className={`transition-colors ${lm ? 'text-slate-300 hover:text-red-500' : 'text-gray-700 hover:text-red-400'}`}
                    aria-label="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className={`flex justify-between items-center pt-2 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            <span className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>합계</span>
            <span className="text-base font-black text-rose-500">₩{fmt(total)}</span>
          </div>
        </>
      )}
    </section>
  );
}
