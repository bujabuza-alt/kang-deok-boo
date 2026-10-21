'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/PushScheduler.jsx
// 화면에 그리는 것 없이, 타임박스 데이터나 알림 설정이 바뀔 때마다(그리고
// 앱을 다시 열 때마다) 앞으로 36시간의 알림 일정을 알림 서버에 올립니다.
// 완료 체크를 하면 다시 올라가면서 그 칸의 반복 알림이 빠집니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useTimebox } from '@/hooks/useTimebox';
import { buildSchedule } from '@/lib/pushSchedule';
import { getSubscription, sendSchedule, PUSH_CHANGE_EVENT } from '@/lib/push';

export function PushScheduler() {
  const { loaded, days, settings } = useTimebox();
  const [subscription, setSubscription] = useState(null);
  const [visibleAt, setVisibleAt] = useState(0);
  const lastSent = useRef('');

  useEffect(() => {
    const refresh = () => getSubscription().then(setSubscription).catch(() => setSubscription(null));
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      refresh();
      setVisibleAt(Date.now());
    };
    refresh();
    window.addEventListener(PUSH_CHANGE_EVENT, refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(PUSH_CHANGE_EVENT, refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !subscription) return;
    const t = setTimeout(() => {
      const items = buildSchedule(days, settings);
      const body = JSON.stringify({ endpoint: subscription.endpoint, items });
      if (body === lastSent.current) return;
      sendSchedule(subscription.toJSON(), items)
        .then(() => { lastSent.current = body; })
        .catch((e) => console.error('알림 일정 전송 실패:', e));
    }, 2000);
    return () => clearTimeout(t);
  }, [loaded, subscription, days, settings, visibleAt]);

  return null;
}
