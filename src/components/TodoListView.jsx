'use client';
import { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import { TodoItem } from './TodoItem';

// 날짜 없는 일정은 정렬 시 항상 맨 뒤로 보냅니다.
function dateTimeKey(todo) {
  if (!todo.date) return '9999-99-99 99:99';
  return `${todo.date} ${todo.time || '00:00'}`;
}

export function TodoListView({ todos, getCategoryById, onToggle, onEdit, onDelete }) {
  const { incomplete, completed } = useMemo(() => {
    const incomplete = todos
      .filter((t) => !t.completed)
      .sort((a, b) => dateTimeKey(a).localeCompare(dateTimeKey(b)));
    const completed = todos
      .filter((t) => t.completed)
      .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));
    return { incomplete, completed };
  }, [todos]);

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ListChecks className="w-10 h-10 text-slate-200 mb-3" />
        <p className="text-sm text-slate-400">아직 등록된 할 일이 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {incomplete.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">진행 중인 할 일이 없어요 🎉</p>
        ) : (
          incomplete.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              category={getCategoryById(todo.categoryId)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {completed.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 px-1">완료됨 ({completed.length})</p>
          {completed.map((todo) => (
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
    </div>
  );
}
