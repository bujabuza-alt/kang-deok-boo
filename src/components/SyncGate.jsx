'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/SyncGate.jsx
// 앱 최상단에서 렌더링 전에 동기화 코드가 설정되어 있으면 클라우드의
// 최신 데이터를 먼저 내려받습니다. 동기화 미설정/오프라인/실패 시에는
// 잠깐의 대기 후 로컬 데이터로 그대로 진행합니다(앱이 멈추지 않음).
// 준비가 끝나면 실시간 리스너를 붙여, 앱이 켜져 있는 동안 다른 기기의
// 변경이 자동으로(새로고침 없이) 반영되도록 합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getSyncCode, pullAll, subscribeAll, isSyncConfigured } from '@/lib/sync';
import { useTheme } from '@/context/ThemeContext';

const PULL_TIMEOUT_MS = 4000;

export function SyncGate({ children }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  // 동기화가 설정되어 있지 않으면 처음부터 준비 완료 상태로 시작해,
  // 동기화를 안 쓰는 사용자는 스피너를 전혀 보지 않고 즉시 앱에 진입합니다.
  const [ready, setReady] = useState(() => !(isSyncConfigured && getSyncCode()));

  useEffect(() => {
    if (!(isSyncConfigured && getSyncCode())) return;

    let cancelled = false;
    let unsubscribe = () => {};

    async function run() {
      await Promise.race([
        pullAll().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, PULL_TIMEOUT_MS)),
      ]);
      if (!cancelled) unsubscribe = subscribeAll();
      if (!cancelled) setReady(true);
    }

    run();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className={`min-h-dvh flex items-center justify-center ${lm ? 'bg-slate-50' : 'bg-gray-950'}`}>
        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${lm ? 'border-indigo-400' : 'border-violet-400'}`} />
      </div>
    );
  }

  return children;
}
