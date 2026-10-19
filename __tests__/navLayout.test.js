import { normalizeNavTabs, DEFAULT_NAV_TABS } from '@/lib/navTabs';
import { normalizeHomeLayout, DEFAULT_HOME_LAYOUT, HOME_CARD_IDS } from '@/lib/homeLayout';

const ALLOWED = ['home', 'todo', 'expense', 'timebox', 'memo', 'habits'];

describe('normalizeNavTabs', () => {
  test('falls back to defaults', () => {
    expect(normalizeNavTabs(null, ALLOWED)).toEqual(DEFAULT_NAV_TABS);
  });

  test('drops unknown/duplicate ids, caps at 4 + more, keeps more last', () => {
    expect(normalizeNavTabs(['more', 'memo', 'memo', 'bogus', 'home', 'todo', 'expense', 'timebox'], ALLOWED))
      .toEqual(['memo', 'home', 'todo', 'expense', 'more']);
  });
});

describe('normalizeHomeLayout', () => {
  test('falls back to defaults', () => {
    expect(normalizeHomeLayout(undefined)).toEqual(DEFAULT_HOME_LAYOUT);
  });

  test('keeps saved order and appends missing cards', () => {
    const out = normalizeHomeLayout({ cards: [{ id: 'expense', visible: false, size: 'compact' }, { id: 'nope' }], shortcutStyle: 'list' });
    expect(out.cards[0]).toEqual({ id: 'expense', visible: false, size: 'compact' });
    expect(out.cards.map((c) => c.id).sort()).toEqual([...HOME_CARD_IDS].sort());
    expect(out.shortcutStyle).toBe('list');
  });
});
