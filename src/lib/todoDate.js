// ──────────────────────────────────────────────────────────────────────────────
// lib/todoDate.js
// 일정/할 일 탭에서 공통으로 쓰는 날짜 포맷 헬퍼.
// ──────────────────────────────────────────────────────────────────────────────
export const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
export const MONTHS_KO = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

export function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → '6월 25일 (목)' */
export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${DAYS_KO[date.getDay()]})`;
}
