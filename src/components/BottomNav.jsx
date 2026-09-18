'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/BottomNav.jsx
// 전역 하단 탭바(홈/일정/지출/더보기). 기존에 상단 드래그 정렬 탭 8개 +
// 지출만 별도 라우트로 이동하던 두 가지 네비게이션 방식을 이 하나로 통일합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { Home, ListTodo, Wallet, MoreHorizontal } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const TABS = [
  { id: 'home', Icon: Home, label: '홈' },
  { id: 'todo', Icon: ListTodo, label: '일정' },
  { id: 'expense', Icon: Wallet, label: '지출' },
  { id: 'more', Icon: MoreHorizontal, label: '더보기' },
];

export function BottomNav({ activeTab, onTabChange }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t ${
        lm ? 'bg-white/95 border-slate-200' : 'bg-gray-950/95 border-gray-800'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto flex">
        {TABS.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-14 py-2 text-[11px] font-bold transition-colors ${
                active
                  ? lm ? 'text-indigo-600' : 'text-violet-400'
                  : lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
