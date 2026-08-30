'use client';
import { Check, Pencil, Trash2, Clock } from 'lucide-react';
import { getPriorityById, getTodoTypeById } from '@/lib/todoCategories';
import { formatDateLabel } from '@/lib/todoDate';
import { useTheme } from '@/expense/context/ThemeContext';

export function TodoItem({ todo, category, onToggle, onEdit, onDelete }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const priority = getPriorityById(todo.priority);
  const todoType = getTodoTypeById(todo.todoType);
  const done = todo.completed;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        done
          ? lm ? 'bg-slate-50 border-slate-100' : 'bg-gray-900 border-gray-800'
          : lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-800 border-gray-700 hover:border-violet-700'
      }`}
    >
      <button
        onClick={() => onToggle(todo.id)}
        aria-label={done ? '완료 취소' : '완료 처리'}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          done ? 'bg-indigo-600 border-indigo-600' : lm ? 'border-slate-300 hover:border-indigo-400' : 'border-gray-600 hover:border-violet-400'
        }`}
      >
        {done && <Check className="w-3 h-3 text-white" />}
      </button>

      {!done && (
        <span
          className={`shrink-0 w-1.5 h-1.5 rounded-full ${priority.dot}`}
          title={`우선순위: ${priority.label}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            done ? (lm ? 'line-through text-slate-400' : 'line-through text-gray-500') : (lm ? 'text-slate-800' : 'text-gray-100')
          }`}
        >
          {todo.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              done ? (lm ? 'bg-slate-100 text-slate-400' : 'bg-gray-800 text-gray-500') : (lm ? 'bg-violet-50 text-violet-500' : 'bg-violet-900/30 text-violet-400')
            }`}
          >
            {todoType.label}
          </span>
          {category && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                done ? (lm ? 'bg-slate-100 text-slate-400' : 'bg-gray-800 text-gray-500') : `${category.bg} ${category.text}`
              }`}
            >
              {category.label}
            </span>
          )}
          {todo.date && (
            <span
              className={`text-[10px] flex items-center gap-0.5 ${
                done ? (lm ? 'text-slate-300' : 'text-gray-600') : (lm ? 'text-slate-400' : 'text-gray-500')
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatDateLabel(todo.date)}
              {todo.time && ` ${todo.time}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(todo)}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600' : 'hover:bg-gray-700 text-gray-500 hover:text-violet-400'}`}
          aria-label="할 일 수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className={`p-1.5 rounded-lg transition-colors ${lm ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'hover:bg-rose-950/40 text-gray-500 hover:text-rose-400'}`}
          aria-label="할 일 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
