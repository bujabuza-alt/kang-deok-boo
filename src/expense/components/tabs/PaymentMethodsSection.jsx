'use client';
// ──────────────────────────────────────────────────────────────────────────────
// expense/components/tabs/PaymentMethodsSection.jsx
// 결제 수단 관리. 원래 지출 화면 안의 설정 탭에 있던 것을 전역 설정 화면의
// '지출 관리' 섹션으로 옮겨왔습니다 (동작은 그대로, 위치만 변경).
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const accentBtn = (lm) =>
  lm
    ? 'text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
    : 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50';
const inputCls = (lm) =>
  `block w-full border rounded-xl px-3 py-2 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white placeholder-gray-600'}`;
const smallInput = (lm) =>
  `flex-1 border rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-700 border-gray-600 focus:border-violet-500 text-white'}`;
const sectionCls = (lm) => `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
const itemCls = (lm) => `flex items-center justify-between p-3 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`;
const h3Cls = (lm) => `text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`;
const mutedCls = (lm) => (lm ? 'text-slate-400' : 'text-gray-500');
const iconMuted = (lm) =>
  lm ? 'text-slate-400 hover:text-slate-600 disabled:opacity-30' : 'text-gray-600 hover:text-gray-400 disabled:opacity-20';

export default function PaymentMethodsSection({ paymentMethods, onUpdate }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [isOpen, setIsOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newPM, setNewPM] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const movePM = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= paymentMethods.length) return;
    const arr = [...paymentMethods];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onUpdate(arr);
  };

  const addPM = () => {
    const v = newPM.trim();
    if (!v || paymentMethods.includes(v)) return;
    onUpdate([...paymentMethods, v]);
    setNewPM('');
    setAdding(false);
  };

  const removePM = (pm) => {
    if (paymentMethods.length > 1) onUpdate(paymentMethods.filter((p) => p !== pm));
  };
  const startEdit = (pm) => { setEditingId(pm); setEditDraft(pm); };
  const saveEdit = () => {
    const v = editDraft.trim();
    if (!v) { setEditingId(null); return; }
    onUpdate(paymentMethods.map((p) => (p === editingId ? v : p)));
    setEditingId(null);
  };

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center justify-between">
        <button onClick={() => setIsOpen((o) => !o)} className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className={h3Cls(lm)}>결제 수단 관리</h3>
          {isOpen ? <ChevronUp className={`w-3.5 h-3.5 ${mutedCls(lm)}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${mutedCls(lm)}`} />}
        </button>
        <button onClick={() => setAdding((a) => !a)} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${accentBtn(lm)}`}>
          <Plus className="w-3 h-3" />추가
        </button>
      </div>

      {isOpen && adding && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newPM}
            onChange={(e) => setNewPM(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addPM(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="새 결제 수단 이름"
            className={inputCls(lm)}
          />
          <button onClick={addPM} className={`p-2 transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`}><Check className="w-4 h-4" /></button>
          <button onClick={() => { setAdding(false); setNewPM(''); }} className={`p-2 transition-colors ${mutedCls(lm)}`}><X className="w-4 h-4" /></button>
        </div>
      )}

      {isOpen && (
        <ul className="space-y-2">
          {paymentMethods.map((pm, idx) => (
            <li key={pm} className={itemCls(lm)}>
              {editingId === pm ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    className={smallInput(lm)}
                  />
                  <button onClick={saveEdit} className={`p-1.5 transition-colors ${lm ? 'text-indigo-600 hover:text-indigo-500' : 'text-violet-400 hover:text-violet-300'}`}><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className={`p-1.5 transition-colors ${mutedCls(lm)}`}><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <span className={`text-sm font-medium ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{pm}</span>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col mr-1">
                      <button onClick={() => movePM(idx, -1)} disabled={idx === 0} className={`p-0.5 transition-colors ${iconMuted(lm)}`} aria-label="위로"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => movePM(idx, 1)} disabled={idx === paymentMethods.length - 1} className={`p-0.5 transition-colors ${iconMuted(lm)}`} aria-label="아래로"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => startEdit(pm)} className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-indigo-600' : 'text-gray-600 hover:text-violet-400'}`} aria-label="수정"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removePM(pm)} disabled={paymentMethods.length <= 1} className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed' : 'text-gray-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed'}`} aria-label="삭제"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
