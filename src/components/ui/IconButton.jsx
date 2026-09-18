'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/IconButton.jsx
// 아이콘 전용 버튼. 터치 기기 권장 최소 타겟(44px = tailwind 11)을 강제하고,
// 항상 보이는 것을 기본으로 합니다(호버로만 나타나는 기존 패턴 대체용).
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

const TONE = {
  default: {
    light: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
    dark: 'text-gray-500 hover:text-gray-200 hover:bg-gray-800',
  },
  danger: {
    light: 'text-slate-400 hover:text-rose-500 hover:bg-rose-50',
    dark: 'text-gray-500 hover:text-rose-400 hover:bg-rose-950/30',
  },
  active: {
    light: 'text-amber-500 hover:bg-amber-50',
    dark: 'text-amber-400 hover:bg-amber-950/30',
  },
};

export function IconButton({ icon: Icon, label, tone = 'default', filled = false, className = '', ...props }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const colors = (TONE[tone] ?? TONE.default)[lm ? 'light' : 'dark'];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex items-center justify-center min-w-11 min-h-11 rounded-lg transition-colors shrink-0 ${colors} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} />
    </button>
  );
}
