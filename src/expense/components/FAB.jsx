'use client';
import { Plus, PenLine, Zap } from 'lucide-react';

export default function FAB({ isOpen, onToggle, onGeneralAdd, onQuickAdd }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 animate-fade-in"
          onClick={onToggle}
        />
      )}

      <div
        className="fixed right-4 z-40 flex flex-col items-end gap-3"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {isOpen && (
          <>
            <div className="flex items-center gap-2.5 animate-fab-item-2">
              <span className="bg-gray-800 text-[11px] text-gray-200 px-3 py-1.5 rounded-xl shadow-lg font-semibold whitespace-nowrap border border-gray-700/60">
                빠른 추가
              </span>
              <button
                onClick={onQuickAdd}
                className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-90 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950/50 transition-all"
                aria-label="빠른 추가"
              >
                <Zap className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 animate-fab-item-1">
              <span className="bg-gray-800 text-[11px] text-gray-200 px-3 py-1.5 rounded-xl shadow-lg font-semibold whitespace-nowrap border border-gray-700/60">
                일반 추가
              </span>
              <button
                onClick={onGeneralAdd}
                className="w-12 h-12 bg-violet-600 hover:bg-violet-500 active:scale-90 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-950/50 transition-all"
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
              ? 'bg-gray-700 hover:bg-gray-600 rotate-45'
              : 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/60'}
          `}
          aria-label={isOpen ? '닫기' : '지출 추가'}
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
