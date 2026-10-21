'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TimeboxNotifySettings.jsx
// 타임박스 설정(⚙) 안의 알림 설정. 이 기기에서 푸시 알림을 켜고 끄며,
// 칸 시작 / 미완료 반복 / 정기 체크인 간격을 고릅니다(간격은 기기 간 동기화).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { DEFAULT_NOTIFY } from '@/lib/pushSchedule';
import { pushStatus, getSubscription, subscribePush, unsubscribePush } from '@/lib/push';
import { Button } from './ui/Button';

const OPTIONS = [
  {
    key: 'blockLead',
    label: '칸 시작 알림',
    choices: [[null, '끔'], [0, '정시'], [5, '5분 전'], [10, '10분 전']],
  },
  {
    key: 'repeatMinutes',
    label: '미완료 반복 (칸이 끝날 때까지)',
    choices: [[0, '끔'], [10, '10분'], [15, '15분'], [30, '30분']],
  },
  {
    key: 'checkinMinutes',
    label: '정기 체크인 (표시 시간 동안)',
    choices: [[0, '끔'], [30, '30분'], [60, '1시간'], [120, '2시간']],
  },
];

const STATUS_TEXT = {
  unconfigured: '알림 서버가 아직 설정되지 않았어요. docs/PUSH_SETUP.md를 참고해 주세요.',
  'needs-install': '아이폰은 Safari 공유 버튼 → "홈 화면에 추가"로 설치한 앱에서만 알림을 받을 수 있어요.',
  unsupported: '이 브라우저는 푸시 알림을 지원하지 않아요.',
  denied: '알림 권한이 꺼져 있어요. 설정 앱 → 알림 → 강덕부에서 허용해 주세요.',
};

export function TimeboxNotifySettings({ settings, saveSettings, lm }) {
  const notify = { ...DEFAULT_NOTIFY, ...settings.notify };
  const [status, setStatus] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(pushStatus());
    getSubscription().then((s) => setSubscribed(!!s)).catch(() => {});
  }, []);

  const toggle = async () => {
    setBusy(true);
    setError('');
    try {
      if (subscribed) {
        await unsubscribePush();
        setSubscribed(false);
      } else {
        setSubscribed(!!(await subscribePush()));
      }
    } catch (e) {
      console.error('알림 설정 실패:', e);
      setError('알림을 설정하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
    setStatus(pushStatus());
    setBusy(false);
  };

  const muted = lm ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`pt-3 mt-3 border-t space-y-3 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-bold ${lm ? 'text-slate-700' : 'text-gray-200'}`}>알림</span>
        {status === 'ok' && (
          <Button variant={subscribed ? 'secondary' : 'primary'} disabled={busy} onClick={toggle} className="flex items-center gap-1.5">
            {subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {subscribed ? '이 기기 알림 끄기' : '이 기기에서 알림 켜기'}
          </Button>
        )}
      </div>
      {status && status !== 'ok' && <p className={`text-xs ${muted}`}>{STATUS_TEXT[status]}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {OPTIONS.map(({ key, label, choices }) => (
        <div key={key}>
          <p className={`text-xs mb-1.5 ${muted}`}>{label}</p>
          <div className="flex gap-2">
            {choices.map(([value, text]) => (
              <button
                key={text}
                onClick={() => saveSettings({ ...settings, notify: { ...notify, [key]: value } })}
                className={`flex-1 min-h-11 rounded-xl text-xs font-bold border ${
                  notify[key] === value
                    ? lm ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-800 border-violet-500 text-violet-400'
                    : lm ? 'border-slate-200 text-slate-500' : 'border-gray-700 text-gray-400'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
