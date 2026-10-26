'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useWorkouts.js
// '운동' 탭 데이터. 운동 종류와 세트 기록을 localStorage에 저장하고 동기화합니다.
//   { exercises:[{id,name,type,custom?}],
//     logs:[{id,date,at,exerciseId,name,type,reps?,weight?,durationSec?,distanceKm?}] }
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { pushKey } from '@/lib/sync';
import { useSyncListener } from '@/hooks/useSyncListener';
import { DEFAULT_EXERCISES } from '@/lib/workout';

const WORKOUTS_KEY = 'kang-deok-boo-workouts';
const EMPTY = { exercises: DEFAULT_EXERCISES, logs: [] };

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function useWorkouts() {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    try {
      const stored = localStorage.getItem(WORKOUTS_KEY);
      const saved = stored ? JSON.parse(stored) : null;
      setData({
        exercises: Array.isArray(saved?.exercises) ? saved.exercises : DEFAULT_EXERCISES,
        logs: Array.isArray(saved?.logs) ? saved.logs : [],
      });
    } catch (e) {
      console.error('Failed to load workouts:', e);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useSyncListener(WORKOUTS_KEY, reload);

  // fn(data) → 새 data
  const save = (fn) => {
    const next = fn(data);
    setData(next);
    try {
      const json = JSON.stringify(next);
      localStorage.setItem(WORKOUTS_KEY, json);
      pushKey(WORKOUTS_KEY, json);
    } catch (e) {
      console.error('Failed to save workouts:', e);
    }
  };

  const addExercise = (name, type) =>
    save((d) => ({ ...d, exercises: [...d.exercises, { id: newId(), name, type, custom: true }] }));
  const deleteExercise = (id) => save((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }));
  // entry: { date, exerciseId, name, type, reps?, weight?, durationSec?, distanceKm? }
  const addLog = (entry) => save((d) => ({ ...d, logs: [...d.logs, { id: newId(), at: Date.now(), ...entry }] }));
  const deleteLog = (id) => save((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }));

  return { loaded, exercises: data.exercises, logs: data.logs, addExercise, deleteExercise, addLog, deleteLog };
}
