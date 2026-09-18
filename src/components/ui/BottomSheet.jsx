'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/BottomSheet.jsx
// 입력 폼용 모달 셸. 모바일에서는 하단에서 올라오는 시트, sm 이상에서는
// 가운데 다이얼로그로 보입니다. 기존에 화면마다 따로 구현되어 있던
// 추가·수정 모달(TodoAddEditModal 등)과 지출 모달(AddExpenseModal 등)의
// 서로 다른 두 규칙을 이 하나로 통일합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { IconButton } from './IconButton';

const MAX_WIDTH = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function BottomSheet({ open, onClose, title, maxWidth = 'md', className = '', children }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${MAX_WIDTH[maxWidth] ?? MAX_WIDTH.md} rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col animate-slide-up sm:animate-fade-in ${
          lm ? 'bg-white' : 'bg-gray-900'
        } ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className={`w-10 h-1 rounded-full mx-auto mt-3 sm:hidden ${lm ? 'bg-slate-200' : 'bg-gray-700'}`} />

        {title && (
          <div className={`flex items-center justify-between px-6 pt-3 pb-4 shrink-0 border-b ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{title}</h2>
            <IconButton icon={X} label="닫기" onClick={onClose} />
          </div>
        )}

        <div className="overflow-y-auto flex flex-col">{children}</div>
      </div>
    </div>
  );
}
