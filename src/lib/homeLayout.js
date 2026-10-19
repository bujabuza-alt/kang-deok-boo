// ──────────────────────────────────────────────────────────────────────────────
// lib/homeLayout.js
// 홈 화면 카드 구성(순서·표시 여부·크기)과 바로가기 표시 방식을 정규화합니다.
// 새 카드가 추가되면 저장된 구성 끝에 자동으로 붙습니다.
// ──────────────────────────────────────────────────────────────────────────────

export const HOME_CARD_IDS = ['todo', 'reminders', 'expense', 'timebox', 'shortcuts'];

export const DEFAULT_HOME_LAYOUT = {
  cards: HOME_CARD_IDS.map((id) => ({ id, visible: true, size: 'full' })),
  shortcutStyle: 'grid', // 'grid' | 'list'
};

export function normalizeHomeLayout(saved) {
  if (!saved || !Array.isArray(saved.cards)) return DEFAULT_HOME_LAYOUT;
  const seen = new Set();
  const cards = saved.cards
    .filter((c) => HOME_CARD_IDS.includes(c?.id) && !seen.has(c.id) && seen.add(c.id))
    .map((c) => ({ id: c.id, visible: c.visible !== false, size: c.size === 'compact' ? 'compact' : 'full' }));
  HOME_CARD_IDS.forEach((id) => {
    if (!seen.has(id)) cards.push({ id, visible: true, size: 'full' });
  });
  return { cards, shortcutStyle: saved.shortcutStyle === 'list' ? 'list' : 'grid' };
}
