// ──────────────────────────────────────────────────────────────────────────────
// lib/todoCategories.js
// 일정/할 일 탭의 기본 카테고리(DEFAULT_TODO_CATEGORIES)와 우선순위(PRIORITY_LEVELS) 정의.
// 실제 카테고리 목록은 useTodoCategories 훅이 localStorage를 통해 관리합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { COLOR_PRESETS } from './categories';

export const DEFAULT_TODO_CATEGORIES = [
  { id: 'work', label: '업무', ...COLOR_PRESETS[8] },
  { id: 'personal', label: '개인', ...COLOR_PRESETS[0] },
  { id: 'appointment', label: '약속', ...COLOR_PRESETS[1] },
  { id: 'health', label: '운동/건강', ...COLOR_PRESETS[3] },
  { id: 'etc', label: '기타', ...COLOR_PRESETS[7] },
];

/**
 * 우선순위 목록. 카테고리와 달리 사용자가 직접 추가/삭제하지 않는 고정 3단계입니다.
 */
export const PRIORITY_LEVELS = [
  { id: 'high', label: '높음', dot: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'medium', label: '보통', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'low', label: '낮음', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50' },
];

export function getPriorityById(id) {
  return PRIORITY_LEVELS.find((p) => p.id === id) || PRIORITY_LEVELS[1];
}
