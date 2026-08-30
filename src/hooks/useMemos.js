'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useMemos.js
// '메모' 탭의 메모(체크리스트 포함) 목록을 localStorage에 저장하고 CRUD를 제공합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kang-deok-boo-memos';

export function useMemos() {
  const [memos, setMemos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMemos(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load memos:', e);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setMemos(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save memos:', e);
    }
  }, []);

  const addMemo = useCallback(
    (data) => {
      const memo = {
        title: '',
        body: '',
        checklist: [],
        pinned: false,
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([memo, ...memos]);
      return memo;
    },
    [memos, persist]
  );

  const updateMemo = useCallback(
    (id, data) => {
      persist(
        memos.map((m) => (m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m))
      );
    },
    [memos, persist]
  );

  const deleteMemo = useCallback(
    (id) => {
      persist(memos.filter((m) => m.id !== id));
    },
    [memos, persist]
  );

  const togglePin = useCallback(
    (id) => {
      persist(memos.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)));
    },
    [memos, persist]
  );

  return { memos, loaded, addMemo, updateMemo, deleteMemo, togglePin };
}
