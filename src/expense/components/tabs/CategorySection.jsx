'use client';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Check, X, Pencil, GripVertical, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { uid } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';

function CategoryItemGhost({ name, lm }) {
  return (
    <li className={`flex items-center justify-between p-3 rounded-xl shadow-2xl ring-1 ${lm ? 'bg-indigo-50 ring-indigo-400/50' : 'bg-gray-700 ring-violet-500/50'}`}>
      <GripVertical className={`w-4 h-4 mr-2 shrink-0 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
      <span className={`flex-1 text-sm font-medium ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{name}</span>
    </li>
  );
}

function SortableCategoryItem({
  category, isEditing, editDraft,
  onEditChange, onEditSave, onEditCancel, onStartEdit, onDelete,
  lm,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl overflow-hidden ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2 p-3">
          <input
            autoFocus
            type="text"
            value={editDraft}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  onEditSave();
              if (e.key === 'Escape') onEditCancel();
            }}
            className={`flex-1 border rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-700 border-gray-600 focus:border-violet-500 text-white'}`}
          />
          <button onClick={onEditSave} className={`p-1.5 transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`} aria-label="저장">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={onEditCancel} className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-600 hover:text-gray-400'}`} aria-label="취소">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-3">
          <button
            {...attributes}
            {...listeners}
            className={`p-1 touch-none cursor-grab active:cursor-grabbing mr-2 shrink-0 transition-colors ${lm ? 'text-slate-300 hover:text-slate-500' : 'text-gray-600 hover:text-gray-400'}`}
            aria-label="드래그하여 순서 변경"
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className={`flex-1 text-sm font-medium truncate ${lm ? 'text-slate-700' : 'text-gray-200'}`}>
            {category.name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onStartEdit(category)}
              className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-indigo-600' : 'text-gray-600 hover:text-violet-400'}`}
              aria-label="카테고리 이름 수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-red-500' : 'text-gray-600 hover:text-red-400'}`}
              aria-label="카테고리 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function CategorySection({ categories, onUpdate, onRename }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [isOpen,    setIsOpen]    = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [activeId,  setActiveId]  = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }) => setActiveId(active.id);
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex(c => c.id === active.id);
    const newIdx = categories.findIndex(c => c.id === over.id);
    onUpdate(arrayMove(categories, oldIdx, newIdx));
  };
  const handleDragCancel = () => setActiveId(null);

  const addCategory = () => {
    const v = newName.trim();
    if (!v || categories.some(c => c.name === v)) return;
    onUpdate([...categories, { id: uid(), name: v }]);
    setNewName('');
    setAdding(false);
  };

  const startEdit = (cat) => { setEditingId(cat.id); setEditDraft(cat.name); };
  const saveEdit = () => {
    const v = editDraft.trim();
    if (!v || !editingId) { setEditingId(null); return; }
    const target = categories.find(c => c.id === editingId);
    if (!target) { setEditingId(null); return; }
    if (target.name !== v) onRename(target.name, v);
    setEditingId(null);
  };
  const deleteCategory = (id) => onUpdate(categories.filter(c => c.id !== id));

  const draggedCategory = activeId ? categories.find(c => c.id === activeId) : null;
  const categoryIds     = categories.map(c => c.id);

  const accentBtn = lm ? 'text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100' : 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50';
  const inputCls  = `flex-1 border rounded-xl px-3 py-2 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white placeholder-gray-600'}`;

  return (
    <section className={`rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Tag className={`w-4 h-4 shrink-0 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <h3 className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`}>카테고리 관리</h3>
          {isOpen
            ? <ChevronUp   className={`w-3.5 h-3.5 ml-1 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />
            : <ChevronDown className={`w-3.5 h-3.5 ml-1 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />}
        </button>
        <button
          onClick={() => { setAdding(a => !a); setNewName(''); }}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${accentBtn}`}
        >
          <Plus className="w-3 h-3" />
          추가
        </button>
      </div>

      {isOpen && adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  addCategory();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="새 카테고리 이름"
            className={inputCls}
          />
          <button onClick={addCategory} className={`p-2 transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`} aria-label="추가 확인">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setAdding(false); setNewName(''); }} className={`p-2 transition-colors ${lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-600 hover:text-gray-400'}`} aria-label="추가 취소">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOpen && (
        categories.length === 0 ? (
          <div className={`text-center py-6 text-xs ${lm ? 'text-slate-400' : 'text-gray-600'}`}>
            카테고리를 추가해보세요
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <SortableCategoryItem
                    key={cat.id}
                    category={cat}
                    isEditing={editingId === cat.id}
                    editDraft={editDraft}
                    onEditChange={setEditDraft}
                    onEditSave={saveEdit}
                    onEditCancel={() => setEditingId(null)}
                    onStartEdit={startEdit}
                    onDelete={deleteCategory}
                    lm={lm}
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay>
              {draggedCategory && <CategoryItemGhost name={draggedCategory.name} lm={lm} />}
            </DragOverlay>
          </DndContext>
        )
      )}

      {isOpen && (
        <p className={`text-[10px] text-center pt-0.5 ${lm ? 'text-slate-300' : 'text-gray-600'}`}>
          길게 누르거나 드래그하여 순서를 변경할 수 있습니다
        </p>
      )}
    </section>
  );
}
