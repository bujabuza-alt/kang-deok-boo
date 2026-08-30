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
import { useTheme } from '@/expense/context/ThemeContext';

function ColorDot({ preset, selected, onClick, lm }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.color}
      className={`w-7 h-7 rounded-full transition-all duration-150 ${preset.activeBg} ${
        selected ? `ring-2 ring-offset-2 scale-110 ${lm ? 'ring-slate-700 ring-offset-white' : 'ring-gray-300 ring-offset-gray-900'}` : 'hover:scale-110'
      }`}
    />
  );
}

function CategoryCard({ category, onSave, onDelete, isOnly, lm }) {
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
        expanded ? (lm ? 'border-indigo-200 shadow-md' : 'border-violet-700 shadow-md') : lm ? 'border-slate-100' : 'border-gray-800'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 ${lm ? 'bg-white' : 'bg-gray-900'}`}>
        <div className={`w-3 h-3 rounded-full shrink-0 ${category.dot}`} />
        <span className={`flex-1 font-medium text-sm ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{category.label}</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
            expanded
              ? lm ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-900/30 text-violet-400'
              : lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'
          }`}
          aria-label={expanded ? '접기' : '수정'}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(category.id)}
          disabled={isOnly}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${lm ? 'hover:bg-rose-50 text-slate-300 hover:text-rose-500' : 'hover:bg-rose-950/40 text-gray-600 hover:text-rose-400'}`}
          aria-label="카테고리 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className={`px-4 pb-4 pt-2 border-t flex flex-col gap-4 ${lm ? 'bg-slate-50 border-slate-100' : 'bg-gray-800 border-gray-800'}`}>
          <div>
            <label className={`block text-xs font-medium mb-1 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>카테고리 이름</label>
            <input
              type="text"
              value={label}
              onChange={(e) => { setLabel(e.target.value); setDirty(true); }}
              placeholder="카테고리 이름"
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${lm ? 'border-slate-200 bg-white text-slate-800' : 'border-gray-700 bg-gray-900 text-white'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-2 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>색상</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <ColorDot
                  key={preset.color}
                  preset={preset}
                  selected={colorPreset.color === preset.color}
                  onClick={() => { setColorPreset(preset); setDirty(true); }}
                  lm={lm}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-white' : 'border-gray-700 text-gray-300 hover:bg-gray-900'}`}
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

function AddCategoryForm({ onAdd, onCancel, lm }) {
  const [label, setLabel] = useState('');
  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[8]); // indigo 기본값

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({ label: label.trim(), ...colorPreset });
  };

  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-4 ${lm ? 'border-indigo-200 bg-indigo-50/50' : 'border-violet-800 bg-violet-950/20'}`}>
      <h4 className={`text-sm font-semibold ${lm ? 'text-indigo-700' : 'text-violet-400'}`}>새 카테고리 추가</h4>

      <div>
        <label className={`block text-xs font-medium mb-1 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>카테고리 이름 *</label>
        <input
          autoFocus
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="예: 공부, 집안일, 병원..."
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${lm ? 'border-slate-200 bg-white text-slate-800' : 'border-gray-700 bg-gray-900 text-white'}`}
        />
      </div>

      <div>
        <label className={`block text-xs font-medium mb-2 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>색상</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <ColorDot
              key={preset.color}
              preset={preset}
              selected={colorPreset.color === preset.color}
              onClick={() => setColorPreset(preset)}
              lm={lm}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-white' : 'border-gray-700 text-gray-300 hover:bg-gray-900'}`}
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
  const { theme } = useTheme();
  const lm = theme === 'light';
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

      <div className={`relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col ${lm ? 'bg-white' : 'bg-gray-900'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
          <div>
            <h2 className={`text-lg font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>카테고리 관리</h2>
            <p className={`text-xs mt-0.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>할 일 카테고리를 자유롭게 편집하세요</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${lm ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-200'}`}
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
              lm={lm}
            />
          ))}

          {showAddForm ? (
            <AddCategoryForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} lm={lm} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className={`w-full py-3 rounded-xl border-2 border-dashed transition-all duration-150 flex items-center justify-center gap-2 text-sm font-medium ${
                lm ? 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50' : 'border-gray-700 text-gray-500 hover:border-violet-600 hover:text-violet-400 hover:bg-violet-950/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              새 카테고리 추가
            </button>
          )}
        </div>

        <div className={`px-4 py-3 border-t flex items-center justify-between shrink-0 ${lm ? 'border-slate-100 bg-slate-50' : 'border-gray-800 bg-gray-800'}`}>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${lm ? 'text-slate-400 hover:text-rose-500' : 'text-gray-500 hover:text-rose-400'}`}
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
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-xs w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-base font-bold mb-1 ${lm ? 'text-slate-800' : 'text-white'}`}>카테고리 삭제</h3>
            <p className={`text-sm mb-5 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>
              이 카테고리를 삭제할까요?<br />
              <span className="text-amber-500 font-medium">해당 카테고리로 등록된 할 일은 유지되지만, 카테고리 정보가 표시되지 않을 수 있습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
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
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-xs w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-base font-bold mb-1 ${lm ? 'text-slate-800' : 'text-white'}`}>기본값으로 초기화</h3>
            <p className={`text-sm mb-5 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>
              모든 카테고리를 기본값으로 되돌릴까요?<br />
              <span className="text-rose-500 font-medium">사용자가 추가·수정한 카테고리는 모두 삭제됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${lm ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
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
