import { applyRoutines, EMPTY_DAY, DEFAULT_TIMEBOX_SETTINGS } from '@/hooks/useTimebox';
import { buildSchedule } from '@/lib/pushSchedule';

// 2026-11-09는 월요일
const MON = '2026-11-09';
const TUE = '2026-11-10';
const routine = (over = {}) => ({
  id: 'run', text: '운동', weekdays: [1, 3, 5], time: '07:00', length: 2, startDate: '2026-11-01', ...over,
});
const apply = (day, date, routines) => applyRoutines({ ...EMPTY_DAY, ...day }, date, routines, DEFAULT_TIMEBOX_SETTINGS);

describe('applyRoutines', () => {
  test('요일이 맞는 날에만 항목과 칸을 넣음', () => {
    const d = apply({}, MON, [routine()]);
    expect(d.brainDump).toEqual([{ id: `r-run-${MON}`, text: '운동', done: false, time: '07:00' }]);
    expect(Object.keys(d.blocks)).toEqual(['07:00', '07:30']);
    expect(d.blocks['07:00'].itemId).toBe(`r-run-${MON}`);
    expect(d.appliedRoutines).toEqual(['run']);
    expect(apply({}, TUE, [routine()]).brainDump).toEqual([]);
  });

  test('시작일 이전 날에는 넣지 않음', () => {
    expect(apply({}, MON, [routine({ startDate: '2026-11-10' })]).brainDump).toEqual([]);
  });

  test('여러 번 적용해도 한 번만 들어감', () => {
    const once = apply({}, MON, [routine()]);
    expect(apply(once, MON, [routine()])).toEqual(once);
  });

  test('펼친 뒤 지운 루틴은 다시 생기지 않음', () => {
    const deleted = { ...apply({}, MON, [routine()]), brainDump: [], blocks: {} };
    const again = apply(deleted, MON, [routine()]);
    expect(again.brainDump).toEqual([]);
    expect(again.blocks).toEqual({});
  });

  test('찬 칸은 덮어쓰지 않고 항목만 추가', () => {
    const busy = { blocks: { '07:30': { text: '회의', done: false } } };
    const d = apply(busy, MON, [routine()]);
    expect(d.brainDump).toHaveLength(1);
    expect(d.blocks).toEqual(busy.blocks);
  });

  test('시간이 없거나 표시 범위 밖이면 칸 없이 항목만', () => {
    expect(apply({}, MON, [routine({ time: null })]).blocks).toEqual({});
    expect(apply({}, MON, [routine({ time: '05:00' })]).blocks).toEqual({});
    expect(apply({}, MON, [routine({ time: '23:30' })]).blocks).toEqual({});
  });
});

describe('buildSchedule + 루틴', () => {
  test('아직 열어 보지 않은 날의 루틴 칸도 알림', () => {
    const now = new Date(2026, 10, 8, 22).getTime(); // 일요일 밤
    const settings = { ...DEFAULT_TIMEBOX_SETTINGS, notify: { blockLead: 0 }, routines: [routine()] };
    const items = buildSchedule({}, settings, now);
    expect(items.map((i) => [i.at, i.title])).toEqual([[new Date(2026, 10, 9, 7).getTime(), '운동']]);
  });
});
