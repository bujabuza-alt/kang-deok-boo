'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/Segmented.jsx
// 화면 안에서 보기를 전환하는 세그먼트 버튼. items: [{ id, label }]
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

export function Segmented({ items, value, onChange }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  return (
    <div className={`flex p-1 rounded-xl ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
      {items.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 min-h-9 rounded-lg text-xs font-bold transition-colors ${
            value === id
              ? lm ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-900 text-violet-400'
              : lm ? 'text-slate-500' : 'text-gray-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
