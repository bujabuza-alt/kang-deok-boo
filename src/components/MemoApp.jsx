'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/MemoApp.jsx
// '메모' 탭. 체크리스트를 포함한 메모를 카드 형태로 보여줍니다 (고정 항목 상단).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Pin, Trash2, StickyNote, Search } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';
import { useMemos } from '@/hooks/useMemos';
import { MemoEditModal } from './MemoEditModal';

function MemoCard({ memo, lm, onEdit, onTogglePin, onDelete }) {
  const total = memo.checklist?.length || 0;
  const done = memo.checklist?.filter((c) => c.done).length || 0;

  return (
    <div
      onClick={() => onEdit(memo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onEdit(memo); }}
      className={`group relative flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-colors ${
        lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-900 border-gray-800 hover:border-violet-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-bold truncate flex items-center gap-1 ${lm ? 'text-slate-800' : 'text-gray-100'}`}>
          {memo.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" />}
          {memo.title || '(제목 없음)'}
        </h3>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(memo.id); }}
            aria-label={memo.pinned ? '고정 해제' : '상단에 고정'}
            className={`p-1.5 rounded-lg transition-colors ${memo.pinned ? 'text-amber-500' : lm ? 'text-slate-300 hover:text-amber-500 hover:bg-amber-50' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-950/30'}`}
          >
            <Pin className="w-3.5 h-3.5" fill={memo.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(memo.id); }}
            className={`p-1.5 rounded-lg transition-colors ${lm ? 'text-slate-300 hover:text-rose-500 hover:bg-rose-50' : 'text-gray-600 hover:text-rose-400 hover:bg-rose-950/30'}`}
            aria-label="메모 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {memo.body && (
        <p className={`text-xs line-clamp-3 whitespace-pre-line ${lm ? 'text-slate-500' : 'text-gray-400'}`}>
          {memo.body}
        </p>
      )}

      {total > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className={`text-[10px] font-medium shrink-0 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
            {done}/{total}
          </span>
        </div>
      )}
    </div>
  );
}

export function MemoApp({ triggerAdd = false, onTriggerAddDone }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { memos, loaded, addMemo, updateMemo, deleteMemo, togglePin } = useMemos();

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const prevTriggerAdd = useRef(false);

  useEffect(() => {
    if (triggerAdd && !prevTriggerAdd.current) {
      setEditingMemo(null);
      setModalOpen(true);
      onTriggerAddDone?.();
    }
    prevTriggerAdd.current = triggerAdd;
  }, [triggerAdd, onTriggerAddDone]);

  const filtered = useMemo(() => {
    const list = [...memos].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.checklist || []).some((c) => c.text.toLowerCase().includes(q))
    );
  }, [memos, query]);

  const handleSave = (data) => {
    if (editingMemo?.id) updateMemo(editingMemo.id, data);
    else addMemo(data);
  };

  const confirmDelete = () => {
    if (deleteConfirm) { deleteMemo(deleteConfirm); setDeleteConfirm(null); }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex gap-2 mb-5">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
          <Search className={`w-4 h-4 shrink-0 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메모 검색..."
            className={`flex-1 bg-transparent focus:outline-none text-sm min-w-0 ${lm ? 'text-slate-700 placeholder:text-slate-400' : 'text-gray-100 placeholder:text-gray-500'}`}
          />
        </div>
        <button
          onClick={() => { setEditingMemo(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote className={`w-10 h-10 mb-3 ${lm ? 'text-slate-200' : 'text-gray-700'}`} />
          <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
            {memos.length === 0 ? '아직 등록된 메모가 없어요' : '검색 결과가 없어요'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              lm={lm}
              onEdit={(m) => { setEditingMemo(m); setModalOpen(true); }}
              onTogglePin={togglePin}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <MemoEditModal
          memo={editingMemo}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingMemo(null); }}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={`relative rounded-2xl shadow-2xl p-6 max-w-sm w-full ${lm ? 'bg-white' : 'bg-gray-900'}`}>
            <h3 className={`text-lg font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>메모 삭제</h3>
            <p className={`text-sm mb-6 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>이 메모를 삭제할까요? 되돌릴 수 없어요.</p>
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
