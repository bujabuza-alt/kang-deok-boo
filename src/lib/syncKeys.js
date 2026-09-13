// ──────────────────────────────────────────────────────────────────────────────
// lib/syncKeys.js
// 기기 간 동기화(및 전체 백업/복원) 대상이 되는 localStorage 키 목록입니다.
// 새 모듈을 추가하면 여기에도 등록해야 동기화·백업에 포함됩니다.
// ──────────────────────────────────────────────────────────────────────────────

export const SYNC_KEYS = [
  { key: 'kang-deok-boo-todos', fallback: [] },
  { key: 'kang-deok-boo-todo-categories', fallback: null },
  { key: 'kang-deok-boo-memos', fallback: [] },
  { key: 'kang-deok-boo-reminders', fallback: [] },
  { key: 'kang-deok-boo-wishlist', fallback: [] },
  { key: 'kang-deok-boo-habits', fallback: [] },
  { key: 'kang-deok-boo-habit-checkins', fallback: {} },
  { key: 'kang-deok-boo-section-order', fallback: null },
  { key: 'et_expenses', fallback: [] },
  { key: 'et_budget', fallback: 500000 },
  { key: 'et_payment_methods', fallback: null },
  { key: 'et_presets', fallback: null },
  { key: 'et_categories', fallback: null },
];

export const SYNC_KEY_NAMES = SYNC_KEYS.map((k) => k.key);
