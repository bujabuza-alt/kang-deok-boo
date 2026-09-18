'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/Card.jsx
// 공용 카드 컨테이너. 기존 화면들이 각자 반복하던
// "rounded-2xl border p-4 bg-white/bg-gray-900" 패턴을 표준화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

export function Card({ as: Tag = 'div', className = '', children, ...props }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <Tag
      className={`rounded-2xl border p-4 ${lm ? 'bg-white border-slate-100' : 'bg-gray-900 border-gray-800'} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
