'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useSyncListener.js
// 다른 기기에서 특정 localStorage 키가 실시간 동기화로 갱신될 때마다
// onRemoteUpdate를 호출합니다. (lib/sync.js의 SYNC_EVENT 구독)
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { SYNC_EVENT } from '@/lib/sync';

export function useSyncListener(key, onRemoteUpdate) {
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.key === key) onRemoteUpdate();
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [key, onRemoteUpdate]);
}
