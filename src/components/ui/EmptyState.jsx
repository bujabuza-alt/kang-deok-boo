'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/EmptyState.jsx
// 목록이 비었을 때 보여주는 안내. 여러 화면에서 반복되던
// "아이콘 + 안내문구" 패턴을 표준화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

export function EmptyState({ icon: Icon, message }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className={`w-10 h-10 mb-3 ${lm ? 'text-slate-200' : 'text-gray-700'}`} />}
      <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{message}</p>
    </div>
  );
}
