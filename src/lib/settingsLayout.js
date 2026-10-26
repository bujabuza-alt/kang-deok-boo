// ──────────────────────────────────────────────────────────────────────────────
// lib/settingsLayout.js
// 설정 화면 섹션 구성(순서·접힘 여부)을 정규화합니다.
// 새 섹션이 추가되면 저장된 순서 끝에 자동으로 붙습니다.
// ──────────────────────────────────────────────────────────────────────────────

export const SETTINGS_SECTION_IDS = ['theme', 'navTabs', 'expense', 'sync', 'data', 'appInfo'];

export const DEFAULT_SETTINGS_LAYOUT = { order: SETTINGS_SECTION_IDS, collapsed: [] };

export function normalizeSettingsLayout(saved) {
  if (!saved || !Array.isArray(saved.order)) return DEFAULT_SETTINGS_LAYOUT;
  const order = [...new Set(saved.order)].filter((id) => SETTINGS_SECTION_IDS.includes(id));
  SETTINGS_SECTION_IDS.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });
  const collapsed = Array.isArray(saved.collapsed) ? saved.collapsed.filter((id) => SETTINGS_SECTION_IDS.includes(id)) : [];
  return { order, collapsed };
}
