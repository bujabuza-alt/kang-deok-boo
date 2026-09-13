'use client';
import { useState, useEffect, useCallback } from 'react';
import { pushKey } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';

const STORAGE_KEY = 'kang-deok-boo-todos';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setTodos(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('Failed to load todos:', e);
    }
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  // 다른 기기에서 동기화로 값이 바뀌면 즉시 반영합니다.
  useSyncListener(STORAGE_KEY, reload);

  const persist = useCallback((nextTodos) => {
    setTodos(nextTodos);
    try {
      const json = JSON.stringify(nextTodos);
      localStorage.setItem(STORAGE_KEY, json);
      pushKey(STORAGE_KEY, json);
    } catch (e) {
      console.error('Failed to save todos:', e);
    }
  }, []);

  const addTodo = useCallback(
    (data) => {
      const todo = {
        title: '',
        memo: '',
        date: '',
        time: '',
        categoryId: null,
        priority: 'medium',
        todoType: 'daily', // 일일/주간/월간 중 하나, 기본값은 일일 할일
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([todo, ...todos]);
      return todo;
    },
    [todos, persist]
  );

  const updateTodo = useCallback(
    (id, data) => {
      persist(
        todos.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t))
      );
    },
    [todos, persist]
  );

  const deleteTodo = useCallback(
    (id) => {
      persist(todos.filter((t) => t.id !== id));
    },
    [todos, persist]
  );

  const toggleTodo = useCallback(
    (id) => {
      persist(
        todos.map((t) =>
          t.id === id
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
            : t
        )
      );
    },
    [todos, persist]
  );

  return { todos, loaded, addTodo, updateTodo, deleteTodo, toggleTodo };
}
