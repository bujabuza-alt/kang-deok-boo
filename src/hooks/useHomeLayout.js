'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useHomeLayout.js
// 홈 화면 카드 구성을 localStorage에 저장하고 동기화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';
import { DEFAULT_HOME_LAYOUT, normalizeHomeLayout } from '@/lib/homeLayout';

const HOME_LAYOUT_KEY = 'kang-deok-boo-home-layout';

export function useHomeLayout() {
  const [layout, setLayout] = useState(DEFAULT_HOME_LAYOUT);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(HOME_LAYOUT_KEY);
      setLayout(normalizeHomeLayout(stored ? JSON.parse(stored) : null));
    } catch (e) {
      console.error('Failed to load home layout:', e);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useSyncListener(HOME_LAYOUT_KEY, reload);

  const saveLayout = useCallback((next) => {
    setLayout(next);
    try {
      const json = JSON.stringify(next);
      localStorage.setItem(HOME_LAYOUT_KEY, json);
      pushKey(HOME_LAYOUT_KEY, json);
    } catch (e) {
      console.error('Failed to save home layout:', e);
    }
  }, []);

  return { layout, saveLayout };
}
