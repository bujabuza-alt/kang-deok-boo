import { normalizeNavTabs, DEFAULT_NAV_TABS } from '@/lib/navTabs';
import { normalizeHomeLayout, DEFAULT_HOME_LAYOUT, HOME_CARD_IDS } from '@/lib/homeLayout';
import { normalizeSettingsLayout, DEFAULT_SETTINGS_LAYOUT, SETTINGS_SECTION_IDS } from '@/lib/settingsLayout';

const ALLOWED = ['home', 'expense', 'timebox', 'memo', 'workout', 'wishlist'];

describe('normalizeNavTabs', () => {
  test('falls back to defaults', () => {
    expect(normalizeNavTabs(null, ALLOWED)).toEqual(DEFAULT_NAV_TABS);
  });

  test('drops unknown/duplicate ids, caps at 4 + more, keeps more last', () => {
    expect(normalizeNavTabs(['more', 'memo', 'memo', 'todo', 'home', 'workout', 'expense', 'timebox'], ALLOWED))
      .toEqual(['memo', 'home', 'workout', 'expense', 'more']);
  });
});

describe('normalizeHomeLayout', () => {
  test('falls back to defaults', () => {
    expect(normalizeHomeLayout(undefined)).toEqual(DEFAULT_HOME_LAYOUT);
  });

  test('keeps saved order and appends missing cards', () => {
    const out = normalizeHomeLayout({ cards: [{ id: 'expense', visible: false, size: 'compact' }, { id: 'todo' }], shortcutStyle: 'list' });
    expect(out.cards[0]).toEqual({ id: 'expense', visible: false, size: 'compact' });
    expect(out.cards.map((c) => c.id).sort()).toEqual([...HOME_CARD_IDS].sort());
    expect(out.shortcutStyle).toBe('list');
  });
});

describe('normalizeSettingsLayout', () => {
  test('falls back to defaults', () => {
    expect(normalizeSettingsLayout(null)).toEqual(DEFAULT_SETTINGS_LAYOUT);
  });

  test('keeps saved order, drops unknown ids, appends missing sections', () => {
    const out = normalizeSettingsLayout({ order: ['sync', 'bogus', 'sync', 'theme'], collapsed: ['theme', 'bogus'] });
    expect(out.order.slice(0, 2)).toEqual(['sync', 'theme']);
    expect([...out.order].sort()).toEqual([...SETTINGS_SECTION_IDS].sort());
    expect(out.collapsed).toEqual(['theme']);
  });
});
