'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/HomeDashboard.jsx
// '홈' 탭. 오늘의 할일/다가오는 알림/이번달 지출을 한눈에 보여주고,
// 하단 탭바에 없는 나머지 기능(식사메뉴/메모/위시리스트/습관/설정)으로
// 바로 이동할 수 있는 바로가기 그리드를 제공합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { ListTodo, Bell, Wallet, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTodos } from '@/hooks/useTodos';
import { useReminders } from '@/hooks/useReminders';
import { ls, fmt } from '@/expense/utils';
import { Card } from './ui/Card';
import { MORE_FEATURES } from './MoreMenu';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HomeDashboard({ onGoTodo, onGoExpense, onOpenMore }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { todos, loaded: todosLoaded } = useTodos();
  const { reminders, loaded: remindersLoaded } = useReminders();

  const today = todayStr();

  const todayTodos = useMemo(
    () => (todosLoaded ? todos.filter((t) => t.date === today && !t.completed) : []),
    [todos, todosLoaded, today]
  );

  const dueReminders = useMemo(
    () => (remindersLoaded ? reminders.filter((r) => !r.done && r.datetime && r.datetime.slice(0, 10) <= today) : []),
    [reminders, remindersLoaded, today]
  );

  const { monthTotal, budget } = useMemo(() => {
    const expenses = ls.get('et_expenses', []);
    const b = ls.get('et_budget', 500000);
    const prefix = today.slice(0, 7);
    const total = expenses
      .filter((e) => e.date.startsWith(prefix))
      .reduce((sum, e) => sum + e.amount, 0);
    return { monthTotal: total, budget: b };
  }, [today]);

  const overBudget = budget > 0 && monthTotal > budget;
  const shortcuts = MORE_FEATURES.filter((f) => f.id !== 'reminders');

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-3">
      <button onClick={onGoTodo} className="w-full text-left">
        <Card className={`flex items-center gap-3 transition-colors ${lm ? 'hover:border-indigo-200' : 'hover:border-violet-700'}`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${lm ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-950/40 text-violet-400'}`}>
            <ListTodo className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>오늘의 할일 {todayTodos.length}개</p>
            <p className={`text-xs truncate ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
              {todayTodos.length === 0 ? '오늘 할 일이 없어요' : todayTodos.slice(0, 2).map((t) => t.title || '(제목 없음)').join(' · ')}
            </p>
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 ${lm ? 'text-slate-300' : 'text-gray-600'}`} />
        </Card>
      </button>

      <button onClick={() => onOpenMore('reminders')} className="w-full text-left">
        <Card className={`flex items-center gap-3 transition-colors ${lm ? 'hover:border-indigo-200' : 'hover:border-violet-700'}`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${lm ? 'bg-rose-50 text-rose-500' : 'bg-rose-950/30 text-rose-400'}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>다가오는 알림 {dueReminders.length}개</p>
            <p className={`text-xs truncate ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
              {dueReminders.length === 0 ? '놓친 알림이 없어요' : dueReminders.slice(0, 2).map((r) => r.title || '(제목 없음)').join(' · ')}
            </p>
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 ${lm ? 'text-slate-300' : 'text-gray-600'}`} />
        </Card>
      </button>

      <button onClick={onGoExpense} className="w-full text-left">
        <Card className={`transition-colors ${lm ? 'hover:border-indigo-200' : 'hover:border-violet-700'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl shrink-0 ${lm ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-950/30 text-emerald-400'}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>이번달 지출</p>
              <p className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
                ₩{fmt(monthTotal)} / ₩{fmt(budget)}
              </p>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${lm ? 'text-slate-300' : 'text-gray-600'}`} />
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
            <div
              className={`h-full rounded-full transition-all ${
                overBudget ? 'bg-rose-500' : lm ? 'bg-indigo-500' : 'bg-violet-500'
              }`}
              style={{ width: `${budget > 0 ? Math.min(100, (monthTotal / budget) * 100) : 0}%` }}
            />
          </div>
        </Card>
      </button>

      <div className="grid grid-cols-4 gap-3 pt-2">
        {shortcuts.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onOpenMore(id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
              lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-900 border-gray-800 hover:border-violet-700'
            }`}
          >
            <Icon className={`w-5 h-5 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
            <span className={`text-[11px] font-medium text-center leading-tight ${lm ? 'text-slate-700' : 'text-gray-200'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
