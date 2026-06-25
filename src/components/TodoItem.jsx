'use client';
import { Check, Pencil, Trash2, Clock } from 'lucide-react';
import { getPriorityById } from '@/lib/todoCategories';
import { formatDateLabel } from '@/lib/todoDate';

export function TodoItem({ todo, category, onToggle, onEdit, onDelete }) {
  const priority = getPriorityById(todo.priority);
  const done = todo.completed;

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-200'
      }`}
    >
      <button
        onClick={() => onToggle(todo.id)}
        aria-label={done ? '완료 취소' : '완료 처리'}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          done ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
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
            done ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        >
          {todo.title}
        </p>
        {(category || todo.date) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {category && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  done ? 'bg-slate-100 text-slate-400' : `${category.bg} ${category.text}`
                }`}
              >
                {category.label}
              </span>
            )}
            {todo.date && (
              <span
                className={`text-[10px] flex items-center gap-0.5 ${
                  done ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                {formatDateLabel(todo.date)}
                {todo.time && ` ${todo.time}`}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(todo)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
          aria-label="할 일 수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
          aria-label="할 일 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
