// ──────────────────────────────────────────────────────────────────────────────
// expense/budget.js
// 월 예산 이월과 '하루 사용 가능 금액' 계산(순수 함수).
//
// 실예산(해당 월에 실제로 쓸 수 있는 예산) = 기본예산 + 이월액
// 이월액 = 지난달 실예산 − 지난달 지출  (초과하면 음수 → 이번달 삭감, 남으면 양수 → 증액)
// 이월은 기능을 처음 켠 달(startKey)부터 계산합니다. 그 이전 기록까지 거슬러
// 올라가면 예산을 쓰지 않던 시절의 지출 때문에 큰 마이너스가 생기기 때문입니다.
// 기본예산은 월별 기록(history)에서 해당 월 이전의 가장 최근 값을 사용해,
// 예산을 바꿔도 지난달 계산이 다시 쓰이지 않게 합니다.
// ──────────────────────────────────────────────────────────────────────────────

export const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

export const prevMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

// history: { 'YYYY-MM': amount } — key 이전(포함) 중 가장 최근 값, 없으면 fallback
export function baseBudgetFor(key, history, fallback) {
  const keys = Object.keys(history || {}).filter((k) => k <= key).sort();
  return keys.length ? history[keys[keys.length - 1]] : fallback;
}

export function monthTotals(expenses) {
  const map = {};
  expenses.forEach((e) => {
    const k = e.date.slice(0, 7);
    map[k] = (map[k] || 0) + e.amount;
  });
  return map;
}

// { base, carryover, effective }
export function effectiveBudgetFor(key, { totals, history, fallback, startKey, enabled }) {
  const base = baseBudgetFor(key, history, fallback);
  if (!enabled || !startKey || key <= startKey) return { base, carryover: 0, effective: base };
  const prev = prevMonthKey(key);
  const carryover = effectiveBudgetFor(prev, { totals, history, fallback, startKey, enabled }).effective - (totals[prev] || 0);
  return { base, carryover, effective: base + carryover };
}

// 오늘 하루 쓸 수 있는 금액 = (실예산 − 어제까지 지출) ÷ 오늘 포함 남은 일수
export function dailyAllowance({ effective, spentBeforeToday, todaySpent, daysLeft }) {
  const perDay = daysLeft > 0 ? Math.max(0, Math.floor((effective - spentBeforeToday) / daysLeft)) : 0;
  return { perDay, todayLeft: perDay - todaySpent };
}

// 화면에서 쓰는 요약값을 한 번에 계산합니다.
export function budgetSummary({ expenses, history, fallback, startKey, enabled, year, month, today }) {
  const key = monthKey(year, month);
  const totals = monthTotals(expenses);
  const { base, carryover, effective } = effectiveBudgetFor(key, { totals, history, fallback, startKey, enabled });
  const spent = totals[key] || 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = today.slice(0, 7);

  let status = 'current';
  if (key < todayKey) status = 'past';
  else if (key > todayKey) status = 'future';

  let perDay = 0;
  let todayLeft = 0;
  let daysLeft = 0;
  if (status === 'current') {
    daysLeft = daysInMonth - Number(today.slice(8, 10)) + 1;
    const monthExp = expenses.filter((e) => e.date.startsWith(key));
    const spentBeforeToday = monthExp.filter((e) => e.date < today).reduce((s, e) => s + e.amount, 0);
    const todaySpent = monthExp.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
    ({ perDay, todayLeft } = dailyAllowance({ effective, spentBeforeToday, todaySpent, daysLeft }));
  } else if (status === 'future') {
    daysLeft = daysInMonth;
    perDay = Math.max(0, Math.floor((effective - spent) / daysInMonth));
  }

  return { key, base, carryover, effective, spent, remaining: effective - spent, perDay, todayLeft, daysLeft, status };
}
