'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, X, Check, UtensilsCrossed } from 'lucide-react';

const STORAGE_KEY = 'gangdeokbu-meal-menu';

const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', emoji: '🌅' },
  { id: 'lunch', label: '점심', emoji: '☀️' },
  { id: 'dinner', label: '저녁', emoji: '🌙' },
  { id: 'snack', label: '간식', emoji: '🍪' },
];

function useMealMenus() {
  const [menus, setMenus] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMenus(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    setMenus(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const addMenu = useCallback((item) => {
    persist([{ ...item, id: `meal-${Date.now()}`, createdAt: new Date().toISOString() }, ...menus]);
  }, [menus, persist]);

  const updateMenu = useCallback((id, data) => {
    persist(menus.map((m) => (m.id === id ? { ...m, ...data } : m)));
  }, [menus, persist]);

  const deleteMenu = useCallback((id) => {
    persist(menus.filter((m) => m.id !== id));
  }, [menus, persist]);

  return { menus, loaded, addMenu, updateMenu, deleteMenu };
}

function MenuForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [mealType, setMealType] = useState(initial?.mealType || 'lunch');
  const [memo, setMemo] = useState(initial?.memo || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), mealType, memo: memo.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="메뉴 이름"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800"
      />
      <div className="flex gap-2 flex-wrap">
        {MEAL_TYPES.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setMealType(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              mealType === t.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          저장
        </button>
      </div>
    </form>
  );
}

function MenuCard({ item, onEdit, onDelete }) {
  const type = MEAL_TYPES.find((t) => t.id === item.mealType) || MEAL_TYPES[1];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
      <span className="text-2xl shrink-0">{type.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm truncate">{item.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium shrink-0">{type.label}</span>
        </div>
        {item.memo && (
          <p className="text-xs text-slate-400 mt-1 truncate">{item.memo}</p>
        )}
        <p className="text-xs text-slate-300 mt-1">
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function MealMenu() {
  const { menus, loaded, addMenu, updateMenu, deleteMenu } = useMealMenus();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? menus : menus.filter((m) => m.mealType === filter);

  if (!loaded) return null;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
            filter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          📋 전체
          {menus.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${filter === 'all' ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
              {menus.length}
            </span>
          )}
        </button>
        {MEAL_TYPES.map((t) => {
          const count = menus.filter((m) => m.mealType === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                filter === t.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {t.emoji} {t.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${filter === t.id ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 추가 버튼 또는 폼 */}
      {adding ? (
        <MenuForm
          onSave={(data) => { addMenu(data); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          식사메뉴 추가
        </button>
      )}

      {/* 편집 폼 */}
      {editing && (
        <MenuForm
          initial={editing}
          onSave={(data) => { updateMenu(editing.id, data); setEditing(null); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* 메뉴 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <UtensilsCrossed className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium text-slate-400">아직 등록된 식사메뉴가 없어요</p>
          <p className="text-xs text-slate-300 mt-1">위 버튼으로 메뉴를 추가해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onEdit={setEditing}
              onDelete={deleteMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
