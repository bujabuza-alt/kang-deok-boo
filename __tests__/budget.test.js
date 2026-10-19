import { baseBudgetFor, effectiveBudgetFor, dailyAllowance, monthTotals, budgetSummary, prevMonthKey } from '@/expense/budget';

const exp = (date, amount) => ({ id: date + amount, date, name: '식비', amount });

describe('budget', () => {
  test('prevMonthKey wraps the year', () => {
    expect(prevMonthKey('2026-01')).toBe('2025-12');
    expect(prevMonthKey('2026-10')).toBe('2026-09');
  });

  test('baseBudgetFor uses the latest history entry at or before the month', () => {
    const history = { '2026-08': 300000, '2026-10': 400000 };
    expect(baseBudgetFor('2026-07', history, 500000)).toBe(500000);
    expect(baseBudgetFor('2026-09', history, 500000)).toBe(300000);
    expect(baseBudgetFor('2026-11', history, 500000)).toBe(400000);
  });

  test('carryover: overspending cuts next month, leftover adds to it', () => {
    const ctx = (expenses) => ({ totals: monthTotals(expenses), history: {}, fallback: 100000, startKey: '2026-08', enabled: true });
    // 8월 12만 사용 → 2만 초과 → 9월 실예산 8만
    expect(effectiveBudgetFor('2026-09', ctx([exp('2026-08-03', 120000)])).effective).toBe(80000);
    // 8월 7만 사용 → 3만 남음 → 9월 13만
    expect(effectiveBudgetFor('2026-09', ctx([exp('2026-08-03', 70000)])).carryover).toBe(30000);
    // 9월 실예산 8만 중 9만 사용 → 10월 = 10만 − 1만
    expect(effectiveBudgetFor('2026-10', ctx([exp('2026-08-03', 120000), exp('2026-09-03', 90000)])).effective).toBe(90000);
  });

  test('no carryover at or before the start month, or when disabled', () => {
    const totals = monthTotals([exp('2026-07-01', 999999)]);
    expect(effectiveBudgetFor('2026-08', { totals, history: {}, fallback: 100000, startKey: '2026-08', enabled: true }).carryover).toBe(0);
    expect(effectiveBudgetFor('2026-09', { totals, history: {}, fallback: 100000, startKey: '2026-08', enabled: false }).carryover).toBe(0);
  });

  test('dailyAllowance divides what is left by days including today', () => {
    expect(dailyAllowance({ effective: 310000, spentBeforeToday: 0, todaySpent: 4000, daysLeft: 31 })).toEqual({ perDay: 10000, todayLeft: 6000 });
    expect(dailyAllowance({ effective: 100000, spentBeforeToday: 150000, todaySpent: 0, daysLeft: 3 }).perDay).toBe(0);
    expect(dailyAllowance({ effective: 100000, spentBeforeToday: 50000, todaySpent: 0, daysLeft: 1 }).perDay).toBe(50000);
  });

  test('budgetSummary for the current month', () => {
    const s = budgetSummary({
      expenses: [exp('2026-10-01', 20000), exp('2026-10-19', 5000)],
      history: {}, fallback: 330000, startKey: '2026-10', enabled: true,
      year: 2026, month: 9, today: '2026-10-19',
    });
    expect(s.status).toBe('current');
    expect(s.daysLeft).toBe(13);
    expect(s.perDay).toBe(Math.floor((330000 - 20000) / 13));
    expect(s.todayLeft).toBe(s.perDay - 5000);
    expect(s.remaining).toBe(305000);
  });
});
