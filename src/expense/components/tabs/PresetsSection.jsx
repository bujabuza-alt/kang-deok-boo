'use client';
// ──────────────────────────────────────────────────────────────────────────────
// expense/components/tabs/PresetsSection.jsx
// 자주 쓰는 항목(빠른 추가 프리셋) 관리. 원래 지출 화면 안의 설정 탭에 있던
// 것을 전역 설정 화면의 '지출 관리' 섹션으로 옮겨왔습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { uid, fmt } from '@/expense/utils';
import { useTheme } from '@/context/ThemeContext';

const accentBtn = (lm) =>
  lm
    ? 'text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
    : 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50';
const sectionCls = (lm) => `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
const labelCls = (lm) => `block text-[10px] font-bold uppercase tracking-widest mb-1 ${lm ? 'text-slate-400' : 'text-gray-500'}`;
const h3Cls = (lm) => `text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`;
const mutedCls = (lm) => (lm ? 'text-slate-400' : 'text-gray-500');
const iconMuted = (lm) =>
  lm ? 'text-slate-400 hover:text-slate-600 disabled:opacity-30' : 'text-gray-600 hover:text-gray-400 disabled:opacity-20';

const EMOJI_OPTIONS = ['🛒', '☕', '🍜', '🚬', '🏪', '🚗', '🍺', '🎮', '👕', '💊', '📚', '🎵', '🍕', '🎬', '✈️', '💇'];
const emptyForm = (pms) => ({ emoji: '🛒', name: '', amount: '', paymentMethod: pms[0] ?? '' });

export default function PresetsSection({ presets, paymentMethods, onUpdate }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(() => emptyForm(paymentMethods));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const isNewValid = newForm.name.trim() && newForm.amount && parseFloat(newForm.amount) > 0;
  const isEditValid = editForm.name?.trim() && editForm.amount && parseFloat(editForm.amount) > 0;

  const addPreset = () => {
    if (!isNewValid) return;
    onUpdate([...presets, { id: uid(), emoji: newForm.emoji || '🛒', name: newForm.name.trim(), amount: parseFloat(newForm.amount), paymentMethod: newForm.paymentMethod || paymentMethods[0] }]);
    setNewForm(emptyForm(paymentMethods));
    setAdding(false);
  };

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ ...p, amount: String(p.amount) }); };
  const saveEdit = () => {
    if (!isEditValid) return;
    onUpdate(presets.map((p) => (p.id === editingId ? { ...p, ...editForm, amount: parseFloat(editForm.amount) } : p)));
    setEditingId(null);
  };
  const removePreset = (id) => onUpdate(presets.filter((p) => p.id !== id));
  const movePreset = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= presets.length) return;
    const arr = [...presets];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onUpdate(arr);
  };

  const formCls = `rounded-xl p-3 space-y-2.5 ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`;
  const inCls = `block w-full border rounded-lg px-2.5 py-2 text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-700 border-gray-600 focus:border-violet-500 text-white placeholder-gray-600'}`;
  const primaryBtn = (disabled) => `flex-1 py-2 text-white text-xs font-bold rounded-lg transition-colors ${disabled ? (lm ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gray-700 text-gray-600 cursor-not-allowed') : lm ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-violet-600 hover:bg-violet-500'}`;
  const cancelBtn = `px-4 py-2 text-xs font-bold rounded-lg transition-colors ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}`;

  const EmojiGrid = ({ value, onChange }) => (
    <div>
      <span className={labelCls(lm)}>이모지</span>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => onChange(em)}
            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${value === em ? (lm ? 'bg-indigo-100 ring-1 ring-indigo-400' : 'bg-violet-700 ring-1 ring-violet-400') : lm ? 'bg-white border border-slate-200 hover:bg-slate-50' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center justify-between">
        <h3 className={h3Cls(lm)}>자주 쓰는 항목</h3>
        <button onClick={() => { setAdding((a) => !a); setNewForm(emptyForm(paymentMethods)); }} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${accentBtn(lm)}`}>
          <Plus className="w-3 h-3" />추가
        </button>
      </div>

      {adding && (
        <div className={formCls}>
          <EmojiGrid value={newForm.emoji} onChange={(v) => setNewForm((f) => ({ ...f, emoji: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelCls(lm)}>카테고리명</span>
              <input autoFocus type="text" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="예: 커피" className={inCls} />
            </div>
            <div>
              <span className={labelCls(lm)}>금액 (원)</span>
              <input type="number" value={newForm.amount} onChange={(e) => setNewForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" min="0" inputMode="numeric" className={inCls} />
            </div>
          </div>
          <div>
            <span className={labelCls(lm)}>결제 수단</span>
            <select value={newForm.paymentMethod} onChange={(e) => setNewForm((f) => ({ ...f, paymentMethod: e.target.value }))} className={`${inCls} appearance-none`}>
              {paymentMethods.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addPreset} disabled={!isNewValid} className={primaryBtn(!isNewValid)}>추가하기</button>
            <button onClick={() => setAdding(false)} className={cancelBtn}>취소</button>
          </div>
        </div>
      )}

      {presets.length === 0 ? (
        <div className={`text-center py-6 text-xs ${mutedCls(lm)}`}>자주 사용하는 지출 항목을 추가해보세요</div>
      ) : (
        <ul className="space-y-2">
          {presets.map((p, idx) => (
            <li key={p.id} className={`rounded-xl overflow-hidden ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`}>
              {editingId === p.id ? (
                <div className="p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className={labelCls(lm)}>카테고리명</span><input autoFocus type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inCls} /></div>
                    <div><span className={labelCls(lm)}>금액 (원)</span><input type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} min="0" inputMode="numeric" className={inCls} /></div>
                  </div>
                  <div>
                    <span className={labelCls(lm)}>결제 수단</span>
                    <select value={editForm.paymentMethod} onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))} className={`${inCls} appearance-none`}>
                      {paymentMethods.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={!isEditValid} className={primaryBtn(!isEditValid)}>저장</button>
                    <button onClick={() => setEditingId(null)} className={cancelBtn}>취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{p.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${lm ? 'text-slate-800' : 'text-gray-100'}`}>{p.name}</p>
                      <p className={`text-[10px] mt-0.5 ${mutedCls(lm)}`}>{p.paymentMethod} · ₩{fmt(p.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col mr-1">
                      <button onClick={() => movePreset(idx, -1)} disabled={idx === 0} className={`p-0.5 transition-colors ${iconMuted(lm)}`} aria-label="위로"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => movePreset(idx, 1)} disabled={idx === presets.length - 1} className={`p-0.5 transition-colors ${iconMuted(lm)}`} aria-label="아래로"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => startEdit(p)} className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-indigo-600' : 'text-gray-600 hover:text-violet-400'}`} aria-label="수정"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removePreset(p.id)} className={`p-1.5 transition-colors ${lm ? 'text-slate-400 hover:text-red-500' : 'text-gray-600 hover:text-red-400'}`} aria-label="삭제"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
