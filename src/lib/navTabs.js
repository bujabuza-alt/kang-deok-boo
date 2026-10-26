// ──────────────────────────────────────────────────────────────────────────────
// lib/navTabs.js
// 사용자가 고른 하단 탭 구성(순서·표시 항목)을 정규화합니다.
// '더보기'는 숨긴 기능으로 가는 유일한 길이므로 항상 마지막 칸에 고정합니다.
// ──────────────────────────────────────────────────────────────────────────────

export const MORE_TAB_ID = 'more';
export const MAX_NAV_TABS = 5; // '더보기' 포함
export const DEFAULT_NAV_TABS = ['home', 'expense', 'timebox', 'workout', MORE_TAB_ID];

// saved: 저장된 id 배열, allowedIds: 하단 탭에 올릴 수 있는 id('더보기' 제외)
export function normalizeNavTabs(saved, allowedIds) {
  if (!Array.isArray(saved)) return DEFAULT_NAV_TABS;
  const allowed = new Set(allowedIds);
  const ids = [...new Set(saved)].filter((id) => allowed.has(id)).slice(0, MAX_NAV_TABS - 1);
  return [...ids, MORE_TAB_ID];
}
