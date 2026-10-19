'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useNavTabs.js
// 하단 탭 구성(순서·표시 항목)을 localStorage에 저장하고 동기화합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey, SYNC_EVENT } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';
import { DEFAULT_NAV_TABS, normalizeNavTabs } from '@/lib/navTabs';
import { NAV_ITEM_IDS } from '@/components/navItems';

const NAV_TABS_KEY = 'kang-deok-boo-nav-tabs';

export function useNavTabs() {
  const [navTabs, setNavTabs] = useState(DEFAULT_NAV_TABS);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(NAV_TABS_KEY);
      setNavTabs(normalizeNavTabs(stored ? JSON.parse(stored) : null, NAV_ITEM_IDS));
    } catch (e) {
      console.error('Failed to load nav tabs:', e);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useSyncListener(NAV_TABS_KEY, reload);

  const saveNavTabs = useCallback((next) => {
    const normalized = normalizeNavTabs(next, NAV_ITEM_IDS);
    setNavTabs(normalized);
    try {
      const json = JSON.stringify(normalized);
      localStorage.setItem(NAV_TABS_KEY, json);
      pushKey(NAV_TABS_KEY, json);
      // 설정 화면과 하단 탭바가 서로 다른 훅 인스턴스이므로, 같은 기기 안에서도
      // 동기화 이벤트를 흘려 탭바가 즉시 다시 읽도록 합니다.
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: NAV_TABS_KEY } }));
    } catch (e) {
      console.error('Failed to save nav tabs:', e);
    }
  }, []);

  return { navTabs, saveNavTabs };
}
