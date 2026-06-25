'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TodoCategoryManager.jsx
// 일정/할 일 탭의 카테고리(라벨) 관리 모달.
// - 카테고리 추가 / 수정(이름·색상) / 삭제
// - 변경 내용은 useTodoCategories 훅을 통해 localStorage에 자동 저장됩니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, RotateCcw } from 'lucide-react';
import { COLOR_PRESETS } from '@/lib/categories';

function ColorDot({ preset, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.color}
      className={`w-7 h-7 rounded-full transition-all duration-150 ${preset.activeBg} ${
        selected ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : 'hover:scale-110'
      }`}
    />
  );
}

function CategoryCard({ category, onSave, onDelete, isOnly }) {
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [colorPreset, setColorPreset] = useState(
    COLOR_PRESETS.find((p) => p.color === category.color) || COLOR_PRESETS[0]
  );
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave(category.id, { label: label.trim(), ...colorPreset });
    setDirty(false);
    setExpanded(false);
  };

  const handleCancel = () => {
    setLabel(category.label);
    setColorPreset(COLOR_PRESETS.find((p) => p.color === category.color) || COLOR_PRESETS[0]);
    setDirty(false);
    setExpanded(false);
  };

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
        expanded ? 'border-indigo-200 shadow-md' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <div className={`w-3 h-3 rounded-full shrink-0 ${category.dot}`} />
        <span className="flex-1 font-medium text-slate-800 text-sm">{category.label}</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
            expanded ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
          aria-label={expanded ? '접기' : '수정'}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(category.id)}
          disabled={isOnly}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="카테고리 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">카테고리 이름</label>
            <input
              type="text"
              value={label}
              onChange={(e) => { setLabel(e.target.value); setDirty(true); }}
              placeholder="카테고리 이름"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">색상</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <ColorDot
                  key={preset.color}
                  preset={preset}
                  selected={colorPreset.color === preset.color}
                  onClick={() => { setColorPreset(preset); setDirty(true); }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || !label.trim()}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCategoryForm({ onAdd, onCancel }) {
  const [label, setLabel] = useState('');
  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[8]); // indigo 기본값

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({ label: label.trim(), ...colorPreset });
  };

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 flex flex-col gap-4">
      <h4 className="text-sm font-semibold text-indigo-700">새 카테고리 추가</h4>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">카테고리 이름 *</label>
        <input
          autoFocus
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="예: 공부, 집안일, 병원..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">색상</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <ColorDot
              key={preset.color}
              preset={preset}
              selected={colorPreset.color === preset.color}
              onClick={() => setColorPreset(preset)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!label.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          카테고리 추가
        </button>
      </div>
    </div>
  );
}

export function TodoCategoryManager({ categories, onAdd, onUpdate, onDelete, onReset, onClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAdd = (category) => {
    onAdd(category);
    setShowAddForm(false);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">카테고리 관리</h2>
            <p className="text-xs text-slate-400 mt-0.5">할 일 카테고리를 자유롭게 편집하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSave={onUpdate}
              onDelete={(id) => setDeleteConfirm(id)}
              isOnly={categories.length === 1}
            />
          ))}

          {showAddForm ? (
            <AddCategoryForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              새 카테고리 추가
            </button>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            기본값으로 초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            완료
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full">
            <h3 className="text-base font-bold text-slate-800 mb-1">카테고리 삭제</h3>
            <p className="text-sm text-slate-500 mb-5">
              이 카테고리를 삭제할까요?<br />
              <span className="text-amber-600 font-medium">해당 카테고리로 등록된 할 일은 유지되지만, 카테고리 정보가 표시되지 않을 수 있습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full">
            <h3 className="text-base font-bold text-slate-800 mb-1">기본값으로 초기화</h3>
            <p className="text-sm text-slate-500 mb-5">
              모든 카테고리를 기본값으로 되돌릴까요?<br />
              <span className="text-rose-600 font-medium">사용자가 추가·수정한 카테고리는 모두 삭제됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
