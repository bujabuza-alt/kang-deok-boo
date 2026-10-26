'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useWorkoutClock.js
// 운동 타이머·스톱워치가 공통으로 쓰는 시계. 시작 시각을 기준으로 경과 시간을
// 계산하므로 화면이 꺼지거나 다른 탭에 다녀와도 정확하고, 상태를 이 기기의
// localStorage에 저장해 탭을 옮기거나 새로고침해도 이어서 갑니다(기기 간 동기화 X).
//   { running, startedAt, baseMs, ...data } — data에는 타이머 길이 등 설정을 함께 둡니다.
// 실행 중에는 화면이 꺼지지 않도록 Wake Lock을 요청합니다(지원하는 브라우저만).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

const PREFIX = 'kang-deok-boo-workout-clock-';

function readClock(key, initialData) {
  try {
    const stored = localStorage.getItem(PREFIX + key);
    if (stored) return { ...initialData, ...JSON.parse(stored) };
  } catch { /* 무시 */ }
  return { running: false, startedAt: 0, baseMs: 0, ...initialData };
}

export function useWorkoutClock(key, initialData = {}) {
  const [clock, setClock] = useState({ running: false, startedAt: 0, baseMs: 0, ...initialData });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setClock(readClock(key, initialData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // fn(clock) → 새 clock
  const save = (fn) => {
    const next = fn(clock);
    setClock(next);
    setNow(Date.now());
    try { localStorage.setItem(PREFIX + key, JSON.stringify(next)); } catch { /* 무시 */ }
  };

  useEffect(() => {
    if (!clock.running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [clock.running]);

  useEffect(() => {
    if (!clock.running || !navigator.wakeLock) return undefined;
    let lock = null;
    let cancelled = false;
    const request = () => navigator.wakeLock.request('screen').then((l) => {
      if (cancelled) l.release(); else lock = l;
    }).catch(() => {});
    request();
    // 다른 앱에 다녀오면 Wake Lock이 풀리므로 다시 요청합니다.
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [clock.running]);

  const elapsedMs = clock.baseMs + (clock.running ? Math.max(0, now - clock.startedAt) : 0);

  const start = () => save((c) => (c.running ? c : { ...c, running: true, startedAt: Date.now() }));
  const pause = () => save((c) => (c.running ? { ...c, running: false, baseMs: c.baseMs + Date.now() - c.startedAt } : c));
  // patch로 설정(data)도 함께 바꿀 수 있습니다.
  const reset = (patch = {}) => save((c) => ({ ...c, ...patch, running: false, startedAt: 0, baseMs: 0 }));
  const restart = (patch = {}) => save((c) => ({ ...c, ...patch, running: true, startedAt: Date.now(), baseMs: 0 }));
  const update = (patch) => save((c) => ({ ...c, ...patch }));

  return { ...clock, elapsedMs, start, pause, reset, restart, update };
}

// ─── 알림음·진동 ────────────────────────────────────────────────────────────
// iOS는 사용자 탭 안에서 오디오를 한 번 깨워야 이후에 소리를 낼 수 있어,
// 시작 버튼을 누를 때 primeAudio()를 호출합니다.
let audioCtx = null;

export function primeAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* 무시 */ }
}

// long: 단계 전환·종료용 긴 소리, 아니면 카운트다운용 짧은 소리
export function beep({ long = false, times = 1 } = {}) {
  try {
    navigator.vibrate?.(long ? Array.from({ length: times * 2 - 1 }, (_, i) => (i % 2 ? 100 : 300)) : 80);
  } catch { /* 무시 */ }
  if (!audioCtx) return;
  for (let i = 0; i < times; i++) {
    const t = audioCtx.currentTime + i * 0.35;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = long ? 880 : 660;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (long ? 0.3 : 0.12));
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + (long ? 0.3 : 0.12));
  }
}
