'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TodoApp.jsx
// '일정' 탭 메인 컨테이너.
// - 목록(Sort) / 캘린더(Calendar) 뷰 전환
// - 할 일 유형(일일/주간/월간) 필터 + 카테고리 필터
// - 할 일 추가·수정 / 카테고리 관리 모달
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Settings2, List, Calendar as CalendarIcon, LayoutList } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { useTodoCategories } from '@/hooks/useTodoCategories';
import { TODO_TYPES } from '@/lib/todoCategories';
import { TodoListView } from './TodoListView';
import { TodoCalendarView } from './TodoCalendarView';
import { TodoAddEditModal } from './TodoAddEditModal';
import { TodoCategoryManager } from './TodoCategoryManager';
import { useTheme } from '@/expense/context/ThemeContext';

const VIEW_MODES = [
  { id: 'sort', label: '목록', icon: List },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
];

// 마지막으로 선택한 카테고리 필터를 저장해 다음 실행 시 기본값으로 사용하기 위한 키.
const LAST_CATEGORY_KEY = 'kang-deok-boo-todo-last-category';

export function TodoApp({ triggerAdd = false, onTriggerAddDone }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { todos, loaded: todosLoaded, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const {
    categories,
    loaded: categoriesLoaded,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    resetCategories,
  } = useTodoCategories();

  const [viewMode, setViewMode] = useState('sort');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const prevTriggerAdd = useRef(false);

  useEffect(() => {
    if (triggerAdd && !prevTriggerAdd.current) {
      setEditingTodo(null);
      setModalOpen(true);
      onTriggerAddDone?.();
    }
    prevTriggerAdd.current = triggerAdd;
  }, [triggerAdd, onTriggerAddDone]);

  // 최초 마운트 시 마지막으로 선택했던 카테고리를 불러와 기본값으로 사용합니다.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_CATEGORY_KEY);
      if (stored) setSelectedCategory(stored);
    } catch (e) {
      console.error('마지막 선택 카테고리 불러오기 실패:', e);
    }
  }, []);

  const handleSelectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    try {
      localStorage.setItem(LAST_CATEGORY_KEY, categoryId);
    } catch (e) {
      console.error('마지막 선택 카테고리 저장 실패:', e);
    }
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((c) => { counts[c.id] = 0; });
    todos.forEach((t) => {
      if (t.categoryId && counts[t.categoryId] !== undefined) counts[t.categoryId]++;
    });
    return counts;
  }, [todos, categories]);

  // 일일·주간·월간 유형별 할 일 개수 (필터 칩에 표시)
  const typeCounts = useMemo(() => {
    const counts = { daily: 0, weekly: 0, monthly: 0 };
    todos.forEach((t) => {
      const type = t.todoType || 'daily';
      if (counts[type] !== undefined) counts[type]++;
    });
    return counts;
  }, [todos]);

  const filteredTodos = useMemo(() => {
    let result = todos;
    if (selectedType !== 'all') {
      result = result.filter((t) => (t.todoType || 'daily') === selectedType);
    }
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.categoryId === selectedCategory);
    }
    return result;
  }, [todos, selectedCategory, selectedType]);

  const handleOpenAdd = useCallback((date) => {
    setEditingTodo(date ? { date } : null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((todo) => {
    setEditingTodo(todo);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (data) => {
      if (editingTodo?.id) updateTodo(editingTodo.id, data);
      else addTodo(data);
    },
    [editingTodo, addTodo, updateTodo]
  );

  const handleDelete = useCallback((id) => setDeleteConfirm(id), []);
  const confirmDelete = () => {
    if (deleteConfirm) { deleteTodo(deleteConfirm); setDeleteConfirm(null); }
  };

  const incompleteCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);

  if (!todosLoaded || !categoriesLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-4">
      {/* 헤더: 진행 현황 + 카테고리 관리 + 추가 */}
      <div className="flex items-center justify-between mb-4">
        <p className={`text-sm ${lm ? 'text-slate-500' : 'text-gray-500'}`}>
          진행 중 <span className={`font-bold ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>{incompleteCount}</span>개 · 전체 {todos.length}개
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryManagerOpen(true)}
            title="카테고리 관리"
            className={`p-2 rounded-xl border transition-colors ${lm ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200' : 'border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-violet-400'}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
      </div>

      {/* 뷰 모드 전환 */}
      <div className={`inline-flex gap-1 p-0.5 rounded-xl mb-3 ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
        {VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 ${
              viewMode === id
                ? lm ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-900 text-violet-400 shadow-sm'
                : lm ? 'text-slate-500 hover:text-slate-700' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 할 일 유형 필터 (일일/주간/월간) */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
            selectedType === 'all'
              ? lm ? 'bg-slate-800 text-white shadow-md scale-[1.04]' : 'bg-gray-100 text-gray-900 shadow-md scale-[1.04]'
              : lm ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800'
          }`}
        >
          전체보기
        </button>
        {TODO_TYPES.map((type) => {
          const active = selectedType === type.id;
          const count = typeCounts[type.id] || 0;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                active
                  ? lm ? 'bg-indigo-600 text-white shadow-md scale-[1.04]' : 'bg-violet-600 text-white shadow-md scale-[1.04]'
                  : lm
                    ? 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-violet-950/30 hover:border-violet-800 hover:text-violet-400'
              }`}
            >
              {type.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-white/25 text-white' : lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        <button
          onClick={() => handleSelectCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
            selectedCategory === 'all'
              ? lm ? 'bg-indigo-600 text-white shadow-md scale-[1.04]' : 'bg-violet-600 text-white shadow-md scale-[1.04]'
              : lm
                ? 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-violet-950/30 hover:border-violet-800 hover:text-violet-400'
          }`}
        >
          <LayoutList className="w-3.5 h-3.5" />
          전체
        </button>
        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                active
                  ? `${cat.activeBg} ${cat.activeText} shadow-md scale-[1.04]`
                  : lm ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? 'bg-white/70' : cat.dot}`} />
              {cat.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? 'bg-white/25 text-white' : lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 본문: 목록 / 캘린더 (전환 시 부드러운 페이드) */}
      <div key={viewMode} className="animate-fadein">
        {viewMode === 'sort' ? (
          <TodoListView
            todos={filteredTodos}
            getCategoryById={getCategoryById}
            onToggle={toggleTodo}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <TodoCalendarView
            todos={filteredTodos}
            getCategoryById={getCategoryById}
            onToggle={toggleTodo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddForDate={handleOpenAdd}
          />
        )}
      </div>

      {/* 추가·수정 모달 */}
      {modalOpen && (
        <TodoAddEditModal
          todo={editingTodo}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTodo(null); }}
        />
      )}

      {/* 카테고리 관리 모달 */}
      {categoryManagerOpen && (
        <TodoCategoryManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onReset={resetCategories}
          onClose={() => setCategoryManagerOpen(false)}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-sm w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-lg font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>할 일 삭제</h3>
            <p className={`text-sm mb-6 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>이 할 일을 삭제할까요? 되돌릴 수 없어요.</p>
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
