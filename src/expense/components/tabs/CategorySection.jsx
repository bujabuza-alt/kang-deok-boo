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

function CategoryItemGhost({ name }) {
  return (
    <li className="flex items-center justify-between p-3 bg-gray-700 rounded-xl shadow-2xl ring-1 ring-violet-500/50">
      <GripVertical className="w-4 h-4 text-violet-400 mr-2 shrink-0" />
      <span className="flex-1 text-sm text-gray-100 font-medium">{name}</span>
    </li>
  );
}

function SortableCategoryItem({
  category,
  isEditing,
  editDraft,
  onEditChange,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:   isDragging ? 0 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-gray-800 rounded-xl overflow-hidden"
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
            className="flex-1 bg-gray-700 border border-gray-600 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none transition-colors"
          />
          <button
            onClick={onEditSave}
            className="p-1.5 text-violet-400 hover:text-violet-300 transition-colors"
            aria-label="저장"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onEditCancel}
            className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="취소"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-3">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-600 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing mr-2 shrink-0"
            aria-label="드래그하여 순서 변경"
            tabIndex={-1}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <span className="flex-1 text-sm text-gray-200 font-medium truncate">
            {category.name}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onStartEdit(category)}
              className="p-1.5 text-gray-600 hover:text-violet-400 transition-colors"
              aria-label="카테고리 이름 수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
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
  const [isOpen,     setIsOpen]     = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [newName,    setNewName]    = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [editDraft,  setEditDraft]  = useState('');
  const [activeId,   setActiveId]   = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    if (!v) return;
    if (categories.some(c => c.name === v)) return;
    onUpdate([...categories, { id: uid(), name: v }]);
    setNewName('');
    setAdding(false);
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditDraft(cat.name);
  };

  const saveEdit = () => {
    const v = editDraft.trim();
    if (!v || !editingId) { setEditingId(null); return; }
    const target = categories.find(c => c.id === editingId);
    if (!target) { setEditingId(null); return; }
    if (target.name !== v) {
      onRename(target.name, v);
    }
    setEditingId(null);
  };

  const deleteCategory = (id) => onUpdate(categories.filter(c => c.id !== id));

  const draggedCategory = activeId ? categories.find(c => c.id === activeId) : null;
  const categoryIds     = categories.map(c => c.id);

  return (
    <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Tag className="w-4 h-4 text-violet-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-200">카테고리 관리</h3>
          {isOpen
            ? <ChevronUp   className="w-3.5 h-3.5 text-gray-500 ml-1" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-1" />}
        </button>
        <button
          onClick={() => { setAdding(a => !a); setNewName(''); }}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50 px-2.5 py-1.5 rounded-lg transition-all shrink-0"
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
            className="flex-1 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors placeholder-gray-600"
          />
          <button
            onClick={addCategory}
            className="p-2 text-violet-400 hover:text-violet-300 transition-colors"
            aria-label="추가 확인"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setAdding(false); setNewName(''); }}
            className="p-2 text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="추가 취소"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOpen && (
        categories.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-xs">
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
                  />
                ))}
              </ul>
            </SortableContext>

            <DragOverlay>
              {draggedCategory && <CategoryItemGhost name={draggedCategory.name} />}
            </DragOverlay>
          </DndContext>
        )
      )}

      {isOpen && (
        <p className="text-[10px] text-gray-600 text-center pt-0.5">
          길게 누르거나 드래그하여 순서를 변경할 수 있습니다
        </p>
      )}
    </section>
  );
}
