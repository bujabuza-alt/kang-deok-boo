'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/HabitTracker.jsx
// '습관' 탭. 매일/매주 체크하는 루틴을 14일 미니 히트맵 + 연속 달성일수로 보여줍니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, Flame, ListChecks } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';
import { useHabits } from '@/hooks/useHabits';
import { HabitEditModal } from './HabitEditModal';

const HEATMAP_DAYS = 14;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function lastNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

// 오늘(또는 오늘이 아직 안 됐다면 어제)부터 거슬러 올라가며 연속 체크일수를 셉니다.
function computeStreak(map) {
  const today = new Date();
  for (const startOffset of [0, -1]) {
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + startOffset);
    if (map[toDateStr(cursor)]) {
      let streak = 0;
      while (map[toDateStr(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    }
  }
  return 0;
}

function HabitRow({ habit, checkinMap, lm, onToggleToday, onEdit, onDelete }) {
  const dates = useMemo(() => lastNDates(HEATMAP_DAYS), []);
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const streak = useMemo(() => computeStreak(checkinMap), [checkinMap]);
  const doneToday = Boolean(checkinMap[todayStr]);

  return (
    <div className={`group flex flex-col gap-2.5 p-4 rounded-2xl border transition-colors ${lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-900 border-gray-800 hover:border-violet-700'}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{habit.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-400'}`}>
              {habit.frequency === 'weekly' ? '매주' : '매일'}
            </span>
            {streak > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 bg-orange-50 text-orange-500">
                <Flame className="w-2.5 h-2.5" fill="currentColor" />
                {streak}일 연속
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(habit)}
            className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600' : 'hover:bg-gray-800 text-gray-500 hover:text-violet-400'}`}
            aria-label="습관 수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'hover:bg-rose-950/40 text-gray-500 hover:text-rose-400'}`}
            aria-label="습관 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onToggleToday(habit.id)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            doneToday
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : lm ? 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600' : 'bg-gray-800 text-gray-400 hover:bg-violet-950/40 hover:text-violet-400'
          }`}
        >
          {doneToday ? '완료' : '오늘 체크'}
        </button>
      </div>

      <div className="flex gap-1">
        {dates.map((ds) => {
          const checked = Boolean(checkinMap[ds]);
          const isToday = ds === todayStr;
          return (
            <span
              key={ds}
              title={ds}
              className={`flex-1 h-4 rounded-sm ${checked ? 'bg-indigo-500' : lm ? 'bg-slate-100' : 'bg-gray-800'} ${
                isToday ? (lm ? 'ring-1 ring-indigo-400' : 'ring-1 ring-violet-500') : ''
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function HabitTracker() {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { habits, checkins, loaded, addHabit, updateHabit, deleteHabit, toggleCheckin } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSave = (data) => {
    if (editingHabit?.id) updateHabit(editingHabit.id, data);
    else addHabit(data);
  };

  const confirmDelete = () => {
    if (deleteConfirm) { deleteHabit(deleteConfirm); setDeleteConfirm(null); }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>매일·매주 체크하는 나만의 루틴</p>
        <button
          onClick={() => { setEditingHabit(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ListChecks className={`w-10 h-10 mb-3 ${lm ? 'text-slate-200' : 'text-gray-700'}`} />
          <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>아직 등록된 습관이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              checkinMap={checkins[habit.id] || {}}
              lm={lm}
              onToggleToday={toggleCheckin}
              onEdit={(h) => { setEditingHabit(h); setModalOpen(true); }}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <HabitEditModal
          habit={editingHabit}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingHabit(null); }}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-sm w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-lg font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>습관 삭제</h3>
            <p className={`text-sm mb-6 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>이 습관과 체크 기록을 모두 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2.5 rounded-xl border font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
