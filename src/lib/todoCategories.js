// ──────────────────────────────────────────────────────────────────────────────
// lib/todoCategories.js
// 우선순위(PRIORITY_LEVELS) 정의. 위시리스트에서 사용합니다.
// ──────────────────────────────────────────────────────────────────────────────

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
