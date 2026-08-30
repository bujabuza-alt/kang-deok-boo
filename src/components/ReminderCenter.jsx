'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/ReminderCenter.jsx
// '알림' 탭. 인앱 전용 리마인더(OS 푸시 아님) + '일정' 탭에서 날짜/시간이 있는
// 할 일을 자동으로 편입해 오늘 / 예정 / 놓침 3구획으로 보여줍니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react';
import { Bell, Plus, Check, Pencil, Trash2, X, CalendarClock } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { useTodoCategories } from '@/hooks/useTodoCategories';
import { useTheme } from '@/expense/context/ThemeContext';
import { formatDateLabel } from '@/lib/todoDate';

const REPEAT_OPTIONS = [
  { id: 'none', label: '반복 안 함' },
  { id: 'daily', label: '매일' },
  { id: 'weekly', label: '매주' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bucketOf(dateStr) {
  if (!dateStr) return 'upcoming';
  if (dateStr < todayStr()) return 'missed';
  if (dateStr === todayStr()) return 'today';
  return 'upcoming';
}

function splitDatetime(datetime) {
  const [date, time] = (datetime || '').split('T');
  return { date: date || '', time: time || '' };
}

const emptyForm = () => ({ title: '', datetime: '', repeat: 'none', memo: '' });

function ReminderForm({ initial, onSave, onClose }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [form, setForm] = useState(initial || emptyForm());
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.datetime) return;
    onSave(form);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col ${
          lm ? 'bg-white' : 'bg-gray-900'
        }`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>
            {initial ? '알림 수정' : '새 알림'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${lm ? 'text-slate-700' : 'text-gray-300'}`}>
              제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="무엇을 알려드릴까요?"
              required
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                lm ? 'border-slate-200 text-slate-800 placeholder:text-slate-400' : 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${lm ? 'text-slate-700' : 'text-gray-300'}`}>
              날짜·시간 <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(e) => set('datetime', e.target.value)}
              required
              className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${
                lm ? 'border-slate-200 text-slate-800' : 'border-gray-700 bg-gray-800 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${lm ? 'text-slate-700' : 'text-gray-300'}`}>반복</label>
            <div className="flex gap-2">
              {REPEAT_OPTIONS.map((r) => {
                const selected = form.repeat === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => set('repeat', r.id)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      selected
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                        : lm
                          ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${lm ? 'text-slate-700' : 'text-gray-300'}`}>메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="메모를 남겨보세요 (선택)"
              rows={2}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm ${
                lm ? 'border-slate-200 text-slate-800 placeholder:text-slate-400' : 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
              }`}
            />
          </div>

          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${
                lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {initial ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReminderRow({ item, lm, onToggle, onEdit, onDelete }) {
  const { date, time } = splitDatetime(item.datetime);
  const done = item.done;
  const fromTodo = item.source === 'todo';

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        done
          ? lm ? 'bg-slate-50 border-slate-100' : 'bg-gray-900 border-gray-800'
          : lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-800 border-gray-700 hover:border-violet-700'
      }`}
    >
      <button
        onClick={() => !fromTodo && onToggle(item.id)}
        disabled={fromTodo}
        aria-label={done ? '완료 취소' : '완료 처리'}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          done
            ? 'bg-indigo-600 border-indigo-600'
            : lm ? 'border-slate-300 hover:border-indigo-400' : 'border-gray-600 hover:border-violet-400'
        } ${fromTodo ? 'cursor-default opacity-70' : ''}`}
      >
        {done && <Check className="w-3 h-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${done ? (lm ? 'line-through text-slate-400' : 'line-through text-gray-500') : (lm ? 'text-slate-800' : 'text-gray-100')}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {fromTodo && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${lm ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/30 text-violet-400'}`}>
              일정
            </span>
          )}
          {!fromTodo && item.repeat !== 'none' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${lm ? 'bg-indigo-50 text-indigo-500' : 'bg-indigo-900/30 text-indigo-400'}`}>
              {REPEAT_OPTIONS.find((r) => r.id === item.repeat)?.label}
            </span>
          )}
          {date && (
            <span className={`text-[10px] flex items-center gap-0.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
              <CalendarClock className="w-2.5 h-2.5" />
              {formatDateLabel(date)}
              {time && ` ${time}`}
            </span>
          )}
        </div>
      </div>

      {!fromTodo && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(item)}
            className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600' : 'hover:bg-gray-800 text-gray-500 hover:text-violet-400'}`}
            aria-label="알림 수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'hover:bg-rose-950/40 text-gray-500 hover:text-rose-400'}`}
            aria-label="알림 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const SECTIONS = [
  { id: 'missed', label: '놓침', dot: 'bg-rose-500' },
  { id: 'today', label: '오늘', dot: 'bg-indigo-500' },
  { id: 'upcoming', label: '예정', dot: 'bg-slate-400' },
];

export function ReminderCenter({ reminders, loaded, addReminder, updateReminder, deleteReminder, toggleReminder }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { todos, loaded: todosLoaded } = useTodos();
  const { getCategoryById } = useTodoCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // 화면을 켜 둔 채로 자정을 넘기는 경우를 대비해 1분마다 오늘/놓침 경계를 다시 계산합니다.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    const custom = reminders.map((r) => ({ ...r, source: 'custom' }));
    const fromTodos = todos
      .filter((t) => t.date)
      .map((t) => ({
        id: `todo-${t.id}`,
        title: t.title,
        datetime: `${t.date}T${t.time || '00:00'}`,
        done: t.completed,
        source: 'todo',
        categoryLabel: getCategoryById(t.categoryId)?.label,
      }));
    return [...custom, ...fromTodos].sort((a, b) => a.datetime.localeCompare(b.datetime));
  }, [reminders, todos, getCategoryById]);

  const grouped = useMemo(() => {
    const map = { missed: [], today: [], upcoming: [] };
    items.forEach((item) => {
      const { date } = splitDatetime(item.datetime);
      map[bucketOf(date)].push(item);
    });
    return map;
  }, [items]);

  const handleSave = (data) => {
    if (editing?.id) updateReminder(editing.id, data);
    else addReminder(data);
  };

  const isEmpty = items.length === 0;

  if (!loaded || !todosLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
          앱을 열었을 때만 보이는 인앱 리마인더예요.
        </p>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className={`w-10 h-10 mb-3 ${lm ? 'text-slate-200' : 'text-gray-700'}`} />
          <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>아직 등록된 알림이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {SECTIONS.map((section) => {
            const list = grouped[section.id];
            if (list.length === 0) return null;
            return (
              <div key={section.id}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${section.dot}`} />
                  <h3 className={`text-xs font-bold ${lm ? 'text-slate-500' : 'text-gray-400'}`}>
                    {section.label} · {list.length}
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((item) => (
                    <ReminderRow
                      key={item.id}
                      item={item}
                      lm={lm}
                      onToggle={toggleReminder}
                      onEdit={(r) => { setEditing(r); setFormOpen(true); }}
                      onDelete={deleteReminder}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <ReminderForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
