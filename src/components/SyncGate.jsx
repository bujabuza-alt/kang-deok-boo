'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/SyncGate.jsx
// 앱 최상단에서 렌더링 전에 동기화 코드가 설정되어 있으면 클라우드의
// 최신 데이터를 먼저 내려받습니다. 동기화 미설정/오프라인/실패 시에는
// 잠깐의 대기 후 로컬 데이터로 그대로 진행합니다(앱이 멈추지 않음).
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getSyncCode, pullAll, isSyncConfigured } from '@/lib/sync';
import { useTheme } from '@/expense/context/ThemeContext';

const PULL_TIMEOUT_MS = 4000;

export function SyncGate({ children }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isSyncConfigured && getSyncCode()) {
        await Promise.race([
          pullAll().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, PULL_TIMEOUT_MS)),
        ]);
      }
      if (!cancelled) setReady(true);
    }

    run();
    return () => {
      cancelled = true;
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
