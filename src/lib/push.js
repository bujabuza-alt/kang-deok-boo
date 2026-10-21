// ──────────────────────────────────────────────────────────────────────────────
// lib/push.js
// 이 기기의 Web Push 구독과 알림 서버(worker/)로의 일정 전송.
// 아이폰은 Safari '홈 화면에 추가'로 설치한 앱(iOS 16.4+)에서만 구독할 수
// 있습니다. 구독은 기기별이라 동기화하지 않습니다. 설정 방법: docs/PUSH_SETUP.md
// ──────────────────────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const SERVER_URL = (process.env.NEXT_PUBLIC_PUSH_SERVER_URL || '').replace(/\/$/, '');

// 구독이 켜지거나 꺼지면 window에 발생합니다(PushScheduler가 구독).
export const PUSH_CHANGE_EVENT = 'kdb-push-change';

// 'unconfigured' | 'needs-install' | 'unsupported' | 'denied' | 'ok'
export function pushStatus() {
  if (!VAPID_PUBLIC_KEY || !SERVER_URL) return 'unconfigured';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'needs-install' : 'unsupported';
  }
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

function base64UrlToBytes(str) {
  const b64 = (str + '='.repeat((4 - (str.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function getSubscription() {
  if (pushStatus() !== 'ok') return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// 반드시 버튼 탭 같은 사용자 동작 안에서 호출해야 합니다(iOS 권한 요청 조건).
export async function subscribePush() {
  if ((await Notification.requestPermission()) !== 'granted') return null;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
  });
  window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
  return sub;
}

export async function unsubscribePush() {
  const sub = await getSubscription();
  if (!sub) return;
  await sendSchedule(sub, []).catch((e) => console.error('알림 일정 삭제 실패:', e));
  await sub.unsubscribe();
  window.dispatchEvent(new Event(PUSH_CHANGE_EVENT));
}

// 이 기기의 예약 알림을 items로 통째로 교체합니다.
export async function sendSchedule(subscription, items) {
  const res = await fetch(`${SERVER_URL}/schedule`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subscription, items }),
  });
  if (!res.ok) throw new Error(`알림 서버 응답 ${res.status}`);
}
