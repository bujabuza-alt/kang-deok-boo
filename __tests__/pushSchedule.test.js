import { buildSchedule, SCHEDULE_WINDOW_MS } from '@/lib/pushSchedule';

const settings = (notify) => ({ startHour: 6, endHour: 24, notify });
const time = (h, m = 0, d = 21) => new Date(2026, 9, d, h, m).getTime();
const NOW = time(8);

describe('buildSchedule', () => {
  test('연속된 같은 칸은 한 번만, 미리 알림 분만큼 앞당겨 알림', () => {
    const days = {
      '2026-10-21': {
        blocks: {
          '09:00': { text: '보고서', done: false },
          '09:30': { text: '보고서', done: false },
          '10:00': { text: '운동', done: false },
        },
      },
    };
    const items = buildSchedule(days, settings({ blockLead: 5 }), NOW);
    expect(items.map((i) => [i.at, i.title])).toEqual([
      [time(8, 55), '보고서'],
      [time(9, 55), '운동'],
    ]);
  });

  test('이미 지난 칸과 끈 경우는 알림 없음', () => {
    const days = { '2026-10-21': { blocks: { '07:00': { text: '아침', done: false } } } };
    expect(buildSchedule(days, settings({ blockLead: 0 }), NOW)).toEqual([]);
    const later = { '2026-10-21': { blocks: { '09:00': { text: 'A', done: false } } } };
    expect(buildSchedule(later, settings({ blockLead: null }), NOW)).toEqual([]);
  });

  test('미완료 반복은 칸이 끝날 때까지, 완료된 칸 구간은 건너뜀', () => {
    const days = {
      '2026-10-21': {
        blocks: {
          '09:00': { text: '보고서', done: false },
          '09:30': { text: '보고서', done: true },
        },
      },
    };
    const items = buildSchedule(days, settings({ blockLead: null, repeatMinutes: 15 }), NOW);
    expect(items.map((i) => i.at)).toEqual([time(9, 15)]);
  });

  test('체크인은 표시 시간 범위 안에서만, 현재 칸 내용을 본문에', () => {
    const days = {
      '2026-10-21': {
        brainDump: [{ id: 'a', text: '청소', done: false }],
        top3: ['a', null, null],
        blocks: { '21:00': { text: '독서', done: false } },
      },
    };
    const s = { startHour: 20, endHour: 22, notify: { blockLead: null, checkinMinutes: 60 } };
    const items = buildSchedule(days, s, NOW);
    const today = items.filter((i) => i.at < time(24));
    expect(today.map((i) => [i.at, i.body])).toEqual([
      [time(20), '남은 Top 3: 청소'],
      [time(21), '지금: 독서'],
    ]);
  });

  test('36시간 이후 알림은 포함하지 않음', () => {
    const items = buildSchedule({}, settings({ blockLead: null, checkinMinutes: 30 }), NOW);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.at >= NOW && i.at < NOW + SCHEDULE_WINDOW_MS)).toBe(true);
    expect(items.some((i) => i.at === time(6, 0, 22))).toBe(true);
  });
});
