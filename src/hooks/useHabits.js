'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useHabits.js
// '습관' 탭의 습관 목록 + 날짜별 체크 기록을 localStorage에 저장하고 CRUD를 제공합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

const HABITS_KEY = 'kang-deok-boo-habits';
const CHECKINS_KEY = 'kang-deok-boo-habit-checkins';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem(HABITS_KEY);
      if (storedHabits) setHabits(JSON.parse(storedHabits));
      const storedCheckins = localStorage.getItem(CHECKINS_KEY);
      if (storedCheckins) setCheckins(JSON.parse(storedCheckins));
    } catch (e) {
      console.error('Failed to load habits:', e);
    }
    setLoaded(true);
  }, []);

  const persistHabits = useCallback((next) => {
    setHabits(next);
    try {
      localStorage.setItem(HABITS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save habits:', e);
    }
  }, []);

  const persistCheckins = useCallback((next) => {
    setCheckins(next);
    try {
      localStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save habit checkins:', e);
    }
  }, []);

  const addHabit = useCallback(
    (data) => {
      const habit = {
        name: '',
        emoji: '✅',
        frequency: 'daily', // 'daily' | 'weekly'
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
      };
      persistHabits([...habits, habit]);
      return habit;
    },
    [habits, persistHabits]
  );

  const updateHabit = useCallback(
    (id, data) => {
      persistHabits(habits.map((h) => (h.id === id ? { ...h, ...data } : h)));
    },
    [habits, persistHabits]
  );

  const deleteHabit = useCallback(
    (id) => {
      persistHabits(habits.filter((h) => h.id !== id));
      const nextCheckins = { ...checkins };
      delete nextCheckins[id];
      persistCheckins(nextCheckins);
    },
    [habits, checkins, persistHabits, persistCheckins]
  );

  // 특정 날짜(기본값 오늘)의 체크 여부를 토글합니다.
  const toggleCheckin = useCallback(
    (habitId, dateStr = todayStr()) => {
      const habitMap = { ...(checkins[habitId] || {}) };
      if (habitMap[dateStr]) delete habitMap[dateStr];
      else habitMap[dateStr] = true;
      persistCheckins({ ...checkins, [habitId]: habitMap });
    },
    [checkins, persistCheckins]
  );

  return { habits, checkins, loaded, addHabit, updateHabit, deleteHabit, toggleCheckin };
}
