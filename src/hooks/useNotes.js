'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kang-deok-boo';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setNotes(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load notes:', e);
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((nextNotes) => {
    setNotes(nextNotes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
  }, []);

  const addNote = useCallback(
    (data) => {
      const note = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([note, ...notes]);
      return note;
    },
    [notes, persist]
  );

  const updateNote = useCallback(
    (id, data) => {
      persist(
        notes.map((n) =>
          n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
        )
      );
    },
    [notes, persist]
  );

  const deleteNote = useCallback(
    (id) => {
      persist(notes.filter((n) => n.id !== id));
    },
    [notes, persist]
  );

  return { notes, loaded, addNote, updateNote, deleteNote };
}
