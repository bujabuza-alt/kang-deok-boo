'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kang-deok-boo-todos';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTodos(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load todos:', e);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((nextTodos) => {
    setTodos(nextTodos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos));
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
