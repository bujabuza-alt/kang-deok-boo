'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useTimebox.js
// '타임박스' 탭 데이터. 날짜별로 브레인 덤프 / Top 3 / 30분 단위 타임박스 /
// 하루 회고를 저장합니다.
//   days: { 'YYYY-MM-DD': { brainDump:[{id,text,done,time?}], top3:[id|null x3],
//                           blocks:{ 'HH:MM': { text, itemId?, done } }, reflection,
//                           appliedRoutines:[routineId] } }
// 일정은 그날의 브레인 덤프 항목(+시간이 있으면 칸)으로 바로 들어갑니다.
// 루틴은 설정(settings.routines)에 두고, 요일이 맞는 날을 읽을 때 그날 항목으로
// 펼칩니다(applyRoutines). 펼친 루틴은 appliedRoutines에 남아 지워도 다시 생기지 않습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey, SYNC_EVENT } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';

const TIMEBOX_KEY = 'kang-deok-boo-timebox';
const SETTINGS_KEY = 'kang-deok-boo-timebox-settings';

export const DEFAULT_TIMEBOX_SETTINGS = { startHour: 6, endHour: 24 };
export const EMPTY_DAY = { brainDump: [], top3: [null, null, null], blocks: {}, reflection: '', appliedRoutines: [] };

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

// 루틴 항목 id는 (루틴, 날짜)마다 하나로 정해 같은 날 두 번 들어가지 않게 합니다.
export const routineItemId = (routineId, date) => `r-${routineId}-${date}`;
export const isRoutineItem = (item) => item.id.startsWith('r-');

// routines: [{ id, text, weekdays:[0..6], time:'HH:MM'|null, length, startDate }]
// 요일이 맞고 시작일 이후이며 이 날 아직 펼치지 않은 루틴을 브레인 덤프에 넣고,
// 시간이 있으면 그 칸들이 표시 범위 안에 있고 모두 비어 있을 때만 칸에도 배치합니다.
export function applyRoutines(day, date, routines = [], settings = DEFAULT_TIMEBOX_SETTINGS) {
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const applied = day.appliedRoutines || [];
  const due = routines.filter((r) => r.weekdays.includes(dow) && date >= r.startDate && !applied.includes(r.id));
  if (due.length === 0) return day;

  const slots = slotKeys(settings);
  const brainDump = [...day.brainDump];
  const blocks = { ...day.blocks };
  due.forEach((r) => {
    const id = routineItemId(r.id, date);
    if (!brainDump.some((i) => i.id === id)) {
      brainDump.push({ id, text: r.text, done: false, ...(r.time && { time: r.time }) });
    }
    if (!r.time) return;
    const start = slots.indexOf(r.time);
    const keys = start === -1 ? [] : slots.slice(start, start + r.length);
    if (keys.length === r.length && keys.every((k) => !blocks[k])) {
      keys.forEach((k) => { blocks[k] = { text: r.text, itemId: id, done: false }; });
    }
  });
  return { ...day, brainDump, blocks, appliedRoutines: [...applied, ...due.map((r) => r.id)] };
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

  const getDay = useCallback(
    (date) => applyRoutines({ ...EMPTY_DAY, ...days[date] }, date, settings.routines, settings),
    [days, settings]
  );

  // fn(day) → 새 day. 루틴을 펼친 상태를 기준으로 고치므로, 그날을 처음 고칠 때 루틴도 함께 저장됩니다.
  const updateDay = useCallback(
    (date, fn) => {
      const next = { ...days, [date]: fn(getDay(date)) };
      setDays(next);
      write(TIMEBOX_KEY, next);
    },
    [days, getDay]
  );

  const saveSettings = useCallback((next) => {
    setSettings(next);
    write(SETTINGS_KEY, next);
  }, []);

  return { loaded, settings, days, getDay, updateDay, saveSettings };
}
