'use client';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { TodoItem } from './TodoItem';
import { DAYS_KO, MONTHS_KO, toDateStr } from '@/lib/todoDate';
import { useTheme } from '@/expense/context/ThemeContext';

const CAL_MODES = [
  { id: 'month', label: '월' },
  { id: 'week', label: '주' },
  { id: 'day', label: '일' },
];

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function TodoCalendarView({ todos, getCategoryById, onToggle, onEdit, onDelete, onAddForDate }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const [calMode, setCalMode] = useState('month');
  const [refDate, setRefDate] = useState(new Date());
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const todosByDate = useMemo(() => {
    const map = {};
    todos.forEach((t) => {
      if (!t.date) return;
      (map[t.date] ||= []).push(t);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return map;
  }, [todos]);

  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const calDays = useMemo(() => {
    const startDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  }, [year, month]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(refDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [refDate]);

  const goPrev = () => {
    const d = new Date(refDate);
    if (calMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (calMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setRefDate(d);
    if (calMode === 'day') setSelectedDate(toDateStr(d));
  };

  const goNext = () => {
    const d = new Date(refDate);
    if (calMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (calMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setRefDate(d);
    if (calMode === 'day') setSelectedDate(toDateStr(d));
  };

  const handleModeChange = (mode) => {
    setCalMode(mode);
    if (mode === 'day') setSelectedDate(toDateStr(refDate));
  };

  const headerLabel = useMemo(() => {
    if (calMode === 'month') return `${year}년 ${MONTHS_KO[month]}`;
    if (calMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
    }
    return `${refDate.getFullYear()}.${refDate.getMonth() + 1}.${refDate.getDate()} (${DAYS_KO[refDate.getDay()]})`;
  }, [calMode, year, month, weekDays, refDate]);

  const panelDate = calMode === 'day' ? toDateStr(refDate) : selectedDate;
  const panelTasks = panelDate ? todosByDate[panelDate] || [] : [];

  return (
    <div className="flex flex-col gap-3">
      {/* 월/주/일 토글 */}
      <div className={`flex gap-1 p-0.5 rounded-xl self-start ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
        {CAL_MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleModeChange(id)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 ${
              calMode === id
                ? lm ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-900 text-violet-400 shadow-sm'
                : lm ? 'text-slate-500 hover:text-slate-700' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className={`rounded-2xl border shadow-sm overflow-hidden ${lm ? 'bg-white border-slate-100' : 'bg-gray-900 border-gray-800'}`}>
        {/* 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={goPrev} className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-gray-800 text-gray-500'}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{headerLabel}</span>
          <button onClick={goNext} className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-gray-800 text-gray-500'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {calMode === 'month' && (
          <>
            <div className={`grid grid-cols-7 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
              {DAYS_KO.map((d, i) => (
                <div
                  key={d}
                  className={`text-center py-2 text-[10px] font-bold ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : lm ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className={`grid grid-cols-7 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
              {calDays.map((day, i) => {
                if (!day) {
                  return <div key={`e-${i}`} className={`min-h-[7vh] border-b border-r ${lm ? 'border-slate-100/80' : 'border-gray-800/80'}`} />;
                }
                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTodos = todosByDate[ds] || [];
                const isToday = ds === todayStr;
                const isSel = ds === selectedDate;
                const dow = new Date(year, month, day).getDay();

                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(isSel ? null : ds)}
                    className={`relative flex flex-col items-center justify-start min-h-[7vh] pt-2 pb-1.5 border-b border-r transition-colors select-none ${
                      lm ? 'border-slate-100/80' : 'border-gray-800/80'
                    } ${isSel ? (lm ? 'bg-indigo-50' : 'bg-violet-950/40') : lm ? 'hover:bg-slate-50' : 'hover:bg-gray-800'}`}
                  >
                    {isToday && (
                      <span className={`absolute top-1.5 left-0 right-0 mx-auto w-6 h-6 rounded-full border ${lm ? 'bg-indigo-100 border-indigo-400/60' : 'bg-violet-900/40 border-violet-500/60'}`} />
                    )}
                    <span
                      className={`relative z-10 text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? lm ? 'text-indigo-600' : 'text-violet-400'
                          : dow === 0
                          ? 'text-red-500'
                          : dow === 6
                          ? 'text-blue-500'
                          : lm ? 'text-slate-700' : 'text-gray-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTodos.length > 0 && (
                      <div className="flex gap-0.5 mt-1 items-center">
                        {dayTodos.slice(0, 3).map((t) => {
                          const cat = getCategoryById(t.categoryId);
                          return (
                            <span
                              key={t.id}
                              className={`w-1.5 h-1.5 rounded-full ${cat?.dot || 'bg-indigo-400'} ${
                                t.completed ? 'opacity-30' : ''
                              }`}
                            />
                          );
                        })}
                        {dayTodos.length > 3 && (
                          <span className={`text-[8px] font-medium ${lm ? 'text-slate-400' : 'text-gray-500'}`}>+{dayTodos.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {calMode === 'week' && (
          <div className={`grid grid-cols-7 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            {weekDays.map((d) => {
              const ds = toDateStr(d);
              const dayTodos = todosByDate[ds] || [];
              const isToday = ds === todayStr;
              const isSel = ds === selectedDate;
              const dow = d.getDay();

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(isSel ? null : ds)}
                  className={`flex flex-col items-center gap-1.5 py-3 border-r last:border-r-0 transition-colors ${
                    lm ? 'border-slate-100/80' : 'border-gray-800/80'
                  } ${isSel ? (lm ? 'bg-indigo-50' : 'bg-violet-950/40') : lm ? 'hover:bg-slate-50' : 'hover:bg-gray-800'}`}
                >
                  <span className={`text-[10px] font-bold ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : lm ? 'text-slate-400' : 'text-gray-500'}`}>
                    {DAYS_KO[dow]}
                  </span>
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? (lm ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white') : lm ? 'text-slate-700' : 'text-gray-300'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex gap-0.5 h-1.5 items-center">
                    {dayTodos.slice(0, 3).map((t) => {
                      const cat = getCategoryById(t.categoryId);
                      return (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${cat?.dot || 'bg-indigo-400'} ${
                            t.completed ? 'opacity-30' : ''
                          }`}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 선택 날짜 할 일 패널 */}
      <section className={`rounded-2xl border shadow-sm p-4 ${lm ? 'bg-white border-slate-100' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-100'}`}>
            <CalendarDays className={`w-4 h-4 ${lm ? 'text-indigo-500' : 'text-violet-400'}`} />
            {panelDate ? `${panelDate} 할 일` : '날짜를 선택하세요'}
          </div>
          {panelDate && (
            <button
              onClick={() => onAddForDate(panelDate)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-700' : 'text-violet-400 hover:text-violet-300'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          )}
        </div>

        {!panelDate ? (
          <p className={`text-xs text-center py-6 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>달력에서 날짜를 선택해 할 일을 확인하세요</p>
        ) : panelTasks.length === 0 ? (
          <p className={`text-xs text-center py-6 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>등록된 할 일이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {panelTasks.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                category={getCategoryById(todo.categoryId)}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
