'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useSettingsLayout.js
// 설정 화면 섹션 구성(순서·접힘)을 localStorage에 저장하고 동기화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';
import { DEFAULT_SETTINGS_LAYOUT, normalizeSettingsLayout } from '@/lib/settingsLayout';

const SETTINGS_LAYOUT_KEY = 'kang-deok-boo-settings-layout';

export function useSettingsLayout() {
  const [layout, setLayout] = useState(DEFAULT_SETTINGS_LAYOUT);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_LAYOUT_KEY);
      setLayout(normalizeSettingsLayout(stored ? JSON.parse(stored) : null));
    } catch (e) {
      console.error('Failed to load settings layout:', e);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useSyncListener(SETTINGS_LAYOUT_KEY, reload);

  const saveLayout = useCallback((next) => {
    setLayout(next);
    try {
      const json = JSON.stringify(next);
      localStorage.setItem(SETTINGS_LAYOUT_KEY, json);
      pushKey(SETTINGS_LAYOUT_KEY, json);
    } catch (e) {
      console.error('Failed to save settings layout:', e);
    }
  }, []);

  return { layout, saveLayout };
}
