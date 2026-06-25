'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useTodoCategories.js
// 일정/할 일 탭의 카테고리(라벨) 목록을 localStorage에 저장하고 CRUD를 제공합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_TODO_CATEGORIES } from '@/lib/todoCategories';

const STORAGE_KEY = 'kang-deok-boo-todo-categories';

export function useTodoCategories() {
  const [categories, setCategories] = useState(DEFAULT_TODO_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
    } catch (e) {
      console.error('할 일 카테고리 불러오기 실패:', e);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((nextCategories) => {
    setCategories(nextCategories);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCategories));
    } catch (e) {
      console.error('할 일 카테고리 저장 실패:', e);
    }
  }, []);

  const addCategory = useCallback(
    (category) => {
      const newCategory = {
        ...category,
        id: `todo-cat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      persist([...categories, newCategory]);
      return newCategory;
    },
    [categories, persist]
  );

  const updateCategory = useCallback(
    (id, data) => {
      persist(categories.map((c) => (c.id === id ? { ...c, ...data } : c)));
    },
    [categories, persist]
  );

  const deleteCategory = useCallback(
    (id) => {
      persist(categories.filter((c) => c.id !== id));
    },
    [categories, persist]
  );

  const getCategoryById = useCallback(
    (id) => categories.find((c) => c.id === id) || null,
    [categories]
  );

  const resetCategories = useCallback(() => {
    persist(DEFAULT_TODO_CATEGORIES);
  }, [persist]);

  return {
    categories,
    loaded,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    resetCategories,
  };
}
