import { formatDuration, formatPace, formatLog, intervalState, intervalTotalMs, summarize } from '@/lib/workout';

describe('formatting', () => {
  test('formatDuration', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  test('formatPace', () => {
    expect(formatPace(1530, 5)).toBe(`5'06"`);
    expect(formatPace(1530, 0)).toBeNull();
  });

  test('formatLog', () => {
    expect(formatLog({ type: 'reps', reps: 12 })).toBe('12회');
    expect(formatLog({ type: 'weight', reps: 10, weight: 12.5 })).toBe('10회 × 12.5kg');
    expect(formatLog({ type: 'run', durationSec: 1530, distanceKm: 5 })).toBe(`25:30 · 5km · 5'06"/km`);
    expect(formatLog({ type: 'run', durationSec: 600, distanceKm: 0 })).toBe('10:00');
  });
});

describe('intervalState', () => {
  const cfg = { prep: 3, work: 20, rest: 10, rounds: 2 };

  test('total excludes rest after last round', () => {
    expect(intervalTotalMs(cfg)).toBe((3 + 20 + 10 + 20) * 1000);
  });

  test('phases and rounds', () => {
    expect(intervalState(0, cfg)).toMatchObject({ phase: 'prep', round: 1, remainingMs: 3000 });
    expect(intervalState(3000, cfg)).toMatchObject({ phase: 'work', round: 1, remainingMs: 20000 });
    expect(intervalState(23000, cfg)).toMatchObject({ phase: 'rest', round: 1, remainingMs: 10000 });
    expect(intervalState(33000, cfg)).toMatchObject({ phase: 'work', round: 2, remainingMs: 20000 });
    expect(intervalState(52999, cfg)).toMatchObject({ phase: 'work', round: 2, remainingMs: 1 });
    expect(intervalState(53000, cfg)).toMatchObject({ phase: 'done', finished: true });
  });

  test('zero rest goes straight to next round', () => {
    expect(intervalState(3000 + 20000, { prep: 3, work: 20, rest: 0, rounds: 3 })).toMatchObject({ phase: 'work', round: 2 });
  });
});

describe('summarize', () => {
  test('sums per exercise from date', () => {
    const logs = [
      { date: '2026-10-01', exerciseId: 'pushup', name: '푸쉬업', type: 'reps', reps: 99 },
      { date: '2026-10-20', exerciseId: 'pushup', name: '푸쉬업', type: 'reps', reps: 10 },
      { date: '2026-10-21', exerciseId: 'pushup', name: '푸쉬업', type: 'reps', reps: 15 },
      { date: '2026-10-21', exerciseId: 'running', name: '러닝', type: 'run', durationSec: 1200, distanceKm: 2.1 },
      { date: '2026-10-22', exerciseId: 'running', name: '러닝', type: 'run', durationSec: 1800, distanceKm: 3.2 },
    ];
    const out = summarize(logs, '2026-10-20');
    expect(out.find((s) => s.exerciseId === 'pushup')).toMatchObject({ sets: 2, reps: 25 });
    expect(out.find((s) => s.exerciseId === 'running')).toMatchObject({ sets: 2, durationSec: 3000, distanceKm: 5.3 });
  });
});
