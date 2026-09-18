'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/Button.jsx
// 공용 버튼. variant로 primary/secondary/danger 톤만 결정하고, 나머지 스타일은
// 기존 화면들이 이미 쓰던 indigo(light)/violet(dark) 색상 관례를 그대로 따릅니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

const VARIANTS = {
  primary: {
    light: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    dark: 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm',
  },
  secondary: {
    light: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
    dark: 'border border-gray-700 text-gray-300 hover:bg-gray-800',
  },
  danger: {
    light: 'bg-rose-500 hover:bg-rose-600 text-white',
    dark: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const colors = VARIANTS[variant][lm ? 'light' : 'dark'];

  return (
    <button
      {...props}
      className={`min-h-11 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors} ${className}`}
    >
      {children}
    </button>
  );
}
