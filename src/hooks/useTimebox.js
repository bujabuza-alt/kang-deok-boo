'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useTimebox.js
// '타임박스' 탭 데이터. 날짜별로 브레인 덤프 / Top 3 / 30분 단위 타임박스 /
// 하루 회고를 저장합니다.
//   days: { 'YYYY-MM-DD': { brainDump:[{id,text,done}], top3:[id|null x3],
//                           blocks:{ 'HH:MM': { text, itemId?, done } }, reflection } }
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey, SYNC_EVENT } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';

const TIMEBOX_KEY = 'kang-deok-boo-timebox';
const SETTINGS_KEY = 'kang-deok-boo-timebox-settings';

export const DEFAULT_TIMEBOX_SETTINGS = { startHour: 6, endHour: 24 };
export const EMPTY_DAY = { brainDump: [], top3: [null, null, null], blocks: {}, reflection: '' };

// startHour~endHour 사이의 30분 슬롯 키 목록('06:00', '06:30', ...)
export function slotKeys({ startHour, endHour }) {
  const keys = [];
  for (let h = startHour; h < endHour; h++) {
    const hh = String(h).padStart(2, '0');
    keys.push(`${hh}:00`, `${hh}:30`);
  }
  return keys;
}

export function currentSlotKey(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${date.getMinutes() < 30 ? '00' : '30'}`;
}

// 칸 완료를 토글하고, 그 칸과 같은 항목인 브레인 덤프 항목의 완료 여부를 맞춥니다.
// 같은 항목 = itemId가 같거나 텍스트가 같음(다른 날 할 일을 고르면 itemId가 다른 날 것이라서).
// 그 항목으로 배치된 그날의 칸이 모두 완료여야 완료, 하나라도 미완료면 미완료입니다.
export function toggleBlockDone(day, key) {
  const blocks = { ...day.blocks, [key]: { ...day.blocks[key], done: !day.blocks[key].done } };
  const toggled = blocks[key];
  const matches = (item, block) => item.id === block.itemId || item.text === block.text;
  const brainDump = day.brainDump.map((item) => {
    if (!matches(item, toggled)) return item;
    const done = Object.values(blocks).filter((b) => matches(item, b)).every((b) => b.done);
    return done === item.done ? item : { ...item, done };
  });
  return { ...day, blocks, brainDump };
}

function read(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return fallback;
  }
}

function write(key, value) {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
    pushKey(key, json);
    // 타임박스 탭과 알림 일정(PushScheduler)이 서로 다른 훅 인스턴스이므로,
    // 같은 기기 안에서도 동기화 이벤트를 흘려 즉시 다시 읽도록 합니다.
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export function useTimebox() {
  const [days, setDays] = useState({});
  const [settings, setSettings] = useState(DEFAULT_TIMEBOX_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const reloadDays = useCallback(() => setDays(read(TIMEBOX_KEY, {})), []);
  const reloadSettings = useCallback(
    () => setSettings({ ...DEFAULT_TIMEBOX_SETTINGS, ...read(SETTINGS_KEY, {}) }),
    []
  );

  useEffect(() => {
    reloadDays();
    reloadSettings();
    setLoaded(true);
  }, [reloadDays, reloadSettings]);

  useSyncListener(TIMEBOX_KEY, reloadDays);
  useSyncListener(SETTINGS_KEY, reloadSettings);

  const getDay = useCallback((date) => ({ ...EMPTY_DAY, ...days[date] }), [days]);

  // fn(day) → 새 day
  const updateDay = useCallback(
    (date, fn) => {
      const next = { ...days, [date]: fn({ ...EMPTY_DAY, ...days[date] }) };
      setDays(next);
      write(TIMEBOX_KEY, next);
    },
    [days]
  );

  const saveSettings = useCallback((next) => {
    setSettings(next);
    write(SETTINGS_KEY, next);
  }, []);

  return { loaded, settings, days, getDay, updateDay, saveSettings };
}
