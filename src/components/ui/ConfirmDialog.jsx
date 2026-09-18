'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ui/ConfirmDialog.jsx
// 삭제 등 되돌릴 수 없는 동작을 확인받는 다이얼로그. TodoApp/HabitTracker/
// WishlistApp/MemoApp에 거의 동일하게 복붙되어 있던 확인창을 표준화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useTheme } from '@/context/ThemeContext';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  danger = true,
  onConfirm,
  onCancel,
}) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <Modal open={open} onClose={onCancel} className="p-6">
      <h3 className={`text-lg font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>{title}</h3>
      {message && <p className={`text-sm mb-6 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>{message}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
