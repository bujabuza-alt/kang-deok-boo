'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useReminders.js
// '알림' 탭의 리마인더 목록을 localStorage에 저장하고 CRUD를 제공합니다.
// 인앱 전용 리마인더입니다 (OS 푸시 알림이 아니라, 앱을 열었을 때만 표시됩니다).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kang-deok-boo-reminders';

export function useReminders() {
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReminders(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setReminders(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save reminders:', e);
    }
  }, []);

  const addReminder = useCallback(
    (data) => {
      const reminder = {
        title: '',
        memo: '',
        datetime: '',
        repeat: 'none', // 'none' | 'daily' | 'weekly'
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        done: false,
        createdAt: new Date().toISOString(),
      };
      persist([reminder, ...reminders]);
      return reminder;
    },
    [reminders, persist]
  );

  const updateReminder = useCallback(
    (id, data) => {
      persist(reminders.map((r) => (r.id === id ? { ...r, ...data } : r)));
    },
    [reminders, persist]
  );

  const deleteReminder = useCallback(
    (id) => {
      persist(reminders.filter((r) => r.id !== id));
    },
    [reminders, persist]
  );

  const toggleReminder = useCallback(
    (id) => {
      persist(reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
    },
    [reminders, persist]
  );

  return { reminders, loaded, addReminder, updateReminder, deleteReminder, toggleReminder };
}
