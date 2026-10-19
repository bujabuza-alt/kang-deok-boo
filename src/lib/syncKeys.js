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
  { key: 'kang-deok-boo-timebox', fallback: {} },
  { key: 'kang-deok-boo-timebox-settings', fallback: null },
  { key: 'kang-deok-boo-nav-tabs', fallback: null },
  { key: 'kang-deok-boo-home-layout', fallback: null },
  { key: 'et_expenses', fallback: [] },
  { key: 'et_budget', fallback: 500000 },
  { key: 'et_payment_methods', fallback: null },
  { key: 'et_presets', fallback: null },
  { key: 'et_categories', fallback: null },
  { key: 'et_budget_history', fallback: {} },
  { key: 'et_carry_start', fallback: null },
  { key: 'et_carry_enabled', fallback: true },
  { key: 'et_category_budgets', fallback: {} },
  { key: 'et_receipts_0', fallback: [] },
  { key: 'et_receipts_1', fallback: [] },
  { key: 'et_receipts_2', fallback: [] },
  { key: 'et_receipts_3', fallback: [] },
  { key: 'et_receipts_4', fallback: [] },
];

export const SYNC_KEY_NAMES = SYNC_KEYS.map((k) => k.key);
