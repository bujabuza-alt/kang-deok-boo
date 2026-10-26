import { toggleBlockDone, EMPTY_DAY } from '@/hooks/useTimebox';

const day = (blocks, brainDump) => ({ ...EMPTY_DAY, brainDump, blocks });
const item = (id, text, done = false) => ({ id, text, done });

describe('toggleBlockDone', () => {
  test('single block done → item done, undone → item undone', () => {
    const d1 = toggleBlockDone(day({ '09:00': { text: '보고서', itemId: 'a', done: false } }, [item('a', '보고서')]), '09:00');
    expect(d1.blocks['09:00'].done).toBe(true);
    expect(d1.brainDump[0].done).toBe(true);
    const d2 = toggleBlockDone(d1, '09:00');
    expect(d2.brainDump[0].done).toBe(false);
  });

  test('item is done only when every block of it is done', () => {
    const start = day(
      { '09:00': { text: '보고서', itemId: 'a', done: false }, '14:00': { text: '보고서', itemId: 'a', done: false } },
      [item('a', '보고서')]
    );
    const d1 = toggleBlockDone(start, '09:00');
    expect(d1.brainDump[0].done).toBe(false);
    const d2 = toggleBlockDone(d1, '14:00');
    expect(d2.brainDump[0].done).toBe(true);
    expect(toggleBlockDone(d2, '09:00').brainDump[0].done).toBe(false);
  });

  test('matches by text when itemId points to another day', () => {
    const d = toggleBlockDone(day({ '09:00': { text: '운동', itemId: 'other-day', done: false } }, [item('b', '운동')]), '09:00');
    expect(d.brainDump[0].done).toBe(true);
  });

  test('leaves unrelated items alone', () => {
    const d = toggleBlockDone(
      day({ '09:00': { text: '보고서', itemId: 'a', done: false } }, [item('a', '보고서'), item('c', '청소', true)]),
      '09:00'
    );
    expect(d.brainDump[1]).toEqual(item('c', '청소', true));
  });

  test('free-text block with no matching item changes nothing in brain dump', () => {
    const start = day({ '09:00': { text: '산책', done: false } }, [item('a', '보고서')]);
    expect(toggleBlockDone(start, '09:00').brainDump).toEqual(start.brainDump);
  });
});
