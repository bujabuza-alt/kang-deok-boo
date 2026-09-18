'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/Modal.jsx
// 가운데 정렬 다이얼로그 셸. 짧은 확인창(ConfirmDialog 등) 용도로,
// 폼이 들어가는 큰 입력 모달은 BottomSheet를 사용하세요.
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';

export function Modal({ open, onClose, className = '', children }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in ${lm ? 'bg-white' : 'bg-gray-900'} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
