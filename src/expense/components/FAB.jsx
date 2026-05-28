'use client';
import { Plus, PenLine, Zap } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';

export default function FAB({ isOpen, onToggle, onGeneralAdd, onQuickAdd }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 animate-fade-in" onClick={onToggle} />
      )}

      <div
        className="fixed right-4 z-40 flex flex-col items-end gap-3"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {isOpen && (
          <>
            <div className="flex items-center gap-2.5 animate-fab-item-2">
              <span className={`text-[11px] px-3 py-1.5 rounded-xl shadow-lg font-semibold whitespace-nowrap border ${lm ? 'bg-white text-slate-700 border-slate-200' : 'bg-gray-800 text-gray-200 border-gray-700/60'}`}>
                빠른 추가
              </span>
              <button
                onClick={onQuickAdd}
                className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-90 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/30 transition-all"
                aria-label="빠른 추가"
              >
                <Zap className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 animate-fab-item-1">
              <span className={`text-[11px] px-3 py-1.5 rounded-xl shadow-lg font-semibold whitespace-nowrap border ${lm ? 'bg-white text-slate-700 border-slate-200' : 'bg-gray-800 text-gray-200 border-gray-700/60'}`}>
                일반 추가
              </span>
              <button
                onClick={onGeneralAdd}
                className={`w-12 h-12 active:scale-90 rounded-2xl flex items-center justify-center shadow-xl transition-all ${lm ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200/60' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/50'}`}
                aria-label="일반 추가"
              >
                <PenLine className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        )}

        <button
          onClick={onToggle}
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            shadow-2xl transition-all duration-300 active:scale-90
            ${isOpen
              ? `rotate-45 ${lm ? 'bg-slate-200 hover:bg-slate-300' : 'bg-gray-700 hover:bg-gray-600'}`
              : lm ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200/50' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/60'}
          `}
          aria-label={isOpen ? '닫기' : '지출 추가'}
        >
          <Plus className={`w-7 h-7 ${lm && isOpen ? 'text-slate-600' : 'text-white'}`} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
