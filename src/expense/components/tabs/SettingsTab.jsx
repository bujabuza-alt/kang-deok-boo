'use client';
import { useState } from 'react';
import {
  Plus, Trash2, Check, X, Pencil, ChevronUp, ChevronDown,
  Download, Upload, DatabaseBackup, RotateCcw,
} from 'lucide-react';
import { uid, fmt, exportJSON } from '@/expense/utils';
import { useTheme } from '@/expense/context/ThemeContext';
import CategorySection from './CategorySection';

/* ── 공통 스타일 헬퍼 ───────────────────────────────────────────── */
const accentBtn  = (lm) => lm
  ? 'text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
  : 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50';

const inputCls   = (lm) => `block w-full border rounded-xl px-3 py-2 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white placeholder-gray-600'}`;
const smallInput = (lm) => `flex-1 border rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-700 border-gray-600 focus:border-violet-500 text-white'}`;
const sectionCls = (lm) => `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
const itemCls    = (lm) => `flex items-center justify-between p-3 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`;
const labelCls   = (lm) => `block text-[10px] font-bold uppercase tracking-widest mb-1 ${lm ? 'text-slate-400' : 'text-gray-500'}`;
const h3Cls      = (lm) => `text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`;
const mutedCls   = (lm) => lm ? 'text-slate-400' : 'text-gray-500';
const iconMuted  = (lm) => lm ? 'text-slate-400 hover:text-slate-600 disabled:opacity-30' : 'text-gray-600 hover:text-gray-400 disabled:opacity-20';


/* ── 결제 수단 ─────────────────────────────────────────────────── */
function PaymentMethodsSection({ paymentMethods, onUpdate, lm }) {
  const [isOpen,    setIsOpen]    = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [newPM,     setNewPM]     = useState('');
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

  const removePM  = (pm) => { if (paymentMethods.length > 1) onUpdate(paymentMethods.filter(p => p !== pm)); };
  const startEdit = (pm) => { setEditingId(pm); setEditDraft(pm); };
  const saveEdit  = () => {
    const v = editDraft.trim();
    if (!v) { setEditingId(null); return; }
    onUpdate(paymentMethods.map(p => p === editingId ? v : p));
    setEditingId(null);
  };

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center justify-between">
        <button onClick={() => setIsOpen(o => !o)} className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className={h3Cls(lm)}>결제 수단 관리</h3>
          {isOpen ? <ChevronUp className={`w-3.5 h-3.5 ${mutedCls(lm)}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${mutedCls(lm)}`} />}
        </button>
        <button onClick={() => setAdding(a => !a)} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${accentBtn(lm)}`}>
          <Plus className="w-3 h-3" />추가
        </button>
      </div>

      {isOpen && adding && (
        <div className="flex gap-2">
          <input autoFocus type="text" value={newPM} onChange={e => setNewPM(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPM(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="새 결제 수단 이름" className={inputCls(lm)} />
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
                  <input autoFocus type="text" value={editDraft} onChange={e => setEditDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    className={smallInput(lm)} />
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


/* ── 자주 쓰는 항목 ────────────────────────────────────────────── */
const EMOJI_OPTIONS = ['🛒','☕','🍜','🚬','🏪','🚗','🍺','🎮','👕','💊','📚','🎵','🍕','🎬','✈️','💇'];
const emptyForm = (pms) => ({ emoji: '🛒', name: '', amount: '', paymentMethod: pms[0] ?? '' });

function PresetsSection({ presets, paymentMethods, onUpdate, lm }) {
  const [adding,    setAdding]    = useState(false);
  const [newForm,   setNewForm]   = useState(() => emptyForm(paymentMethods));
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState({});

  const isNewValid  = newForm.name.trim() && newForm.amount && parseFloat(newForm.amount) > 0;
  const isEditValid = editForm.name?.trim() && editForm.amount && parseFloat(editForm.amount) > 0;

  const addPreset = () => {
    if (!isNewValid) return;
    onUpdate([...presets, { id: uid(), emoji: newForm.emoji || '🛒', name: newForm.name.trim(), amount: parseFloat(newForm.amount), paymentMethod: newForm.paymentMethod || paymentMethods[0] }]);
    setNewForm(emptyForm(paymentMethods));
    setAdding(false);
  };

  const startEdit = (p) => { setEditingId(p.id); setEditForm({ ...p, amount: String(p.amount) }); };
  const saveEdit  = () => {
    if (!isEditValid) return;
    onUpdate(presets.map(p => p.id === editingId ? { ...p, ...editForm, amount: parseFloat(editForm.amount) } : p));
    setEditingId(null);
  };
  const removePreset = (id) => onUpdate(presets.filter(p => p.id !== id));
  const movePreset   = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= presets.length) return;
    const arr = [...presets]; [arr[idx], arr[next]] = [arr[next], arr[idx]]; onUpdate(arr);
  };

  const formCls = `rounded-xl p-3 space-y-2.5 ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`;
  const inCls   = `block w-full border rounded-lg px-2.5 py-2 text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900 placeholder-slate-300' : 'bg-gray-700 border-gray-600 focus:border-violet-500 text-white placeholder-gray-600'}`;
  const primaryBtn = (disabled) => `flex-1 py-2 text-white text-xs font-bold rounded-lg transition-colors ${disabled ? lm ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gray-700 text-gray-600 cursor-not-allowed' : lm ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-violet-600 hover:bg-violet-500'}`;
  const cancelBtn = `px-4 py-2 text-xs font-bold rounded-lg transition-colors ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}`;

  const EmojiGrid = ({ value, onChange }) => (
    <div>
      <span className={labelCls(lm)}>이모지</span>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map(em => (
          <button key={em} type="button" onClick={() => onChange(em)}
            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${value === em ? lm ? 'bg-indigo-100 ring-1 ring-indigo-400' : 'bg-violet-700 ring-1 ring-violet-400' : lm ? 'bg-white border border-slate-200 hover:bg-slate-50' : 'bg-gray-700 hover:bg-gray-600'}`}>
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
        <button onClick={() => { setAdding(a => !a); setNewForm(emptyForm(paymentMethods)); }} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${accentBtn(lm)}`}>
          <Plus className="w-3 h-3" />추가
        </button>
      </div>

      {adding && (
        <div className={formCls}>
          <EmojiGrid value={newForm.emoji} onChange={v => setNewForm(f => ({ ...f, emoji: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelCls(lm)}>카테고리명</span>
              <input autoFocus type="text" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 커피" className={inCls} />
            </div>
            <div>
              <span className={labelCls(lm)}>금액 (원)</span>
              <input type="number" value={newForm.amount} onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" min="0" inputMode="numeric" className={inCls} />
            </div>
          </div>
          <div>
            <span className={labelCls(lm)}>결제 수단</span>
            <select value={newForm.paymentMethod} onChange={e => setNewForm(f => ({ ...f, paymentMethod: e.target.value }))} className={`${inCls} appearance-none`}>
              {paymentMethods.map(pm => <option key={pm} value={pm}>{pm}</option>)}
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
                    <div><span className={labelCls(lm)}>카테고리명</span><input autoFocus type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inCls} /></div>
                    <div><span className={labelCls(lm)}>금액 (원)</span><input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} min="0" inputMode="numeric" className={inCls} /></div>
                  </div>
                  <div>
                    <span className={labelCls(lm)}>결제 수단</span>
                    <select value={editForm.paymentMethod} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))} className={`${inCls} appearance-none`}>
                      {paymentMethods.map(pm => <option key={pm} value={pm}>{pm}</option>)}
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


/* ── 테마 설정 ─────────────────────────────────────────────────── */
function ThemeSection({ theme, onThemeChange, lm }) {
  const THEMES = [
    { id: 'light',  emoji: '☀️', label: '라이트', style: null },
    { id: 'dark',   emoji: '🌙', label: '다크',   style: null },
    { id: 'japan',  emoji: '🌸', label: '재팬',   style: theme === 'japan' ? { backgroundColor: '#FCE2E1', borderColor: '#C96480', color: '#C96480' } : null },
  ];

  return (
    <section className={sectionCls(lm)}>
      <h3 className={h3Cls(lm)}>테마 설정</h3>
      <div className="flex gap-2">
        {THEMES.map(({ id, emoji, label, style }) => (
          <button
            key={id}
            onClick={() => onThemeChange(id)}
            style={style ?? undefined}
            className={`
              flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2
              text-xs font-bold transition-all
              ${theme === id && !style
                ? lm
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                  : 'bg-gray-800 border-violet-500 text-violet-400'
                : theme !== id
                  ? lm
                    ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                  : ''}
            `}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      {theme === 'japan' && (
        <p className="text-[10px] text-center" style={{ color: '#C96480' }}>
          벚꽃 핑크 · 화지(和紙) 테마가 적용되었습니다
        </p>
      )}
    </section>
  );
}


/* ── 데이터 관리 ────────────────────────────────────────────────── */
function DataManagementSection({
  expenses, budget, paymentMethods, presets, categories,
  onUpdateExpenses, onUpdateBudget, onUpdatePaymentMethods, onUpdatePresets, onUpdateCategories,
  lm,
}) {
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const doExport = (type, data) =>
    exportJSON(`et-${type}-${today()}.json`, { type, version: 1, exportedAt: new Date().toISOString(), data });

  const doFullExport = () =>
    exportJSON(`et-backup-${today()}.json`, {
      type: 'full', version: 1, exportedAt: new Date().toISOString(),
      expenses, budget, paymentMethods, presets, categories,
    });

  const triggerImport = (callback) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        callback(JSON.parse(text));
      } catch {
        showMsg('error', '유효하지 않은 JSON 파일입니다.');
      }
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const ITEMS = [
    {
      label: '지출 내역',
      type:  'expenses',
      data:  expenses,
      onImport: (json) => {
        if (!Array.isArray(json.data)) { showMsg('error', '지출 내역 파일 형식이 맞지 않습니다.'); return; }
        if (!window.confirm('기존 지출 내역을 덮어쓸까요?')) return;
        onUpdateExpenses(json.data);
        showMsg('success', '지출 내역을 불러왔습니다.');
      },
    },
    {
      label: '예산',
      type:  'budget',
      data:  budget,
      onImport: (json) => {
        if (typeof json.data !== 'number') { showMsg('error', '예산 파일 형식이 맞지 않습니다.'); return; }
        onUpdateBudget(json.data);
        showMsg('success', '예산을 불러왔습니다.');
      },
    },
    {
      label: '결제 수단',
      type:  'payment-methods',
      data:  paymentMethods,
      onImport: (json) => {
        if (!Array.isArray(json.data)) { showMsg('error', '결제 수단 파일 형식이 맞지 않습니다.'); return; }
        if (!window.confirm('기존 결제 수단을 덮어쓸까요?')) return;
        onUpdatePaymentMethods(json.data);
        showMsg('success', '결제 수단을 불러왔습니다.');
      },
    },
    {
      label: '자주 쓰는 항목',
      type:  'presets',
      data:  presets,
      onImport: (json) => {
        if (!Array.isArray(json.data)) { showMsg('error', '프리셋 파일 형식이 맞지 않습니다.'); return; }
        if (!window.confirm('기존 프리셋을 덮어쓸까요?')) return;
        onUpdatePresets(json.data);
        showMsg('success', '자주 쓰는 항목을 불러왔습니다.');
      },
    },
    {
      label: '카테고리',
      type:  'categories',
      data:  categories,
      onImport: (json) => {
        if (!Array.isArray(json.data)) { showMsg('error', '카테고리 파일 형식이 맞지 않습니다.'); return; }
        if (!window.confirm('기존 카테고리를 덮어쓸까요?')) return;
        onUpdateCategories(json.data);
        showMsg('success', '카테고리를 불러왔습니다.');
      },
    },
  ];

  const doFullImport = () => {
    triggerImport((json) => {
      if (json.type !== 'full') { showMsg('error', '전체 백업 파일이 아닙니다.'); return; }
      if (!window.confirm('전체 데이터를 복원할까요? 현재 데이터는 모두 사라집니다.')) return;
      if (Array.isArray(json.expenses))        onUpdateExpenses(json.expenses);
      if (typeof json.budget === 'number')     onUpdateBudget(json.budget);
      if (Array.isArray(json.paymentMethods))  onUpdatePaymentMethods(json.paymentMethods);
      if (Array.isArray(json.presets))         onUpdatePresets(json.presets);
      if (Array.isArray(json.categories))      onUpdateCategories(json.categories);
      showMsg('success', '전체 데이터를 복원했습니다.');
    });
  };

  const saveBtnCls = `flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${lm ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-violet-900/30 text-violet-400 hover:bg-violet-900/50'}`;
  const loadBtnCls = `flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${lm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`;

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center gap-2">
        <DatabaseBackup className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
        <h3 className={h3Cls(lm)}>데이터 관리</h3>
      </div>

      <ul className="space-y-2">
        {ITEMS.map(({ label, type, data, onImport }) => (
          <li key={type} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`}>
            <span className={`text-sm font-medium ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{label}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => doExport(type, data)} className={saveBtnCls} aria-label={`${label} 저장`}>
                <Download className="w-3 h-3" />저장
              </button>
              <button onClick={() => triggerImport(onImport)} className={loadBtnCls} aria-label={`${label} 불러오기`}>
                <Upload className="w-3 h-3" />불러오기
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className={`pt-2 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
        <p className={`text-[10px] mb-2 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>전체 데이터 한 번에 처리</p>
        <div className="flex gap-2">
          <button
            onClick={doFullExport}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${lm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
          >
            <DatabaseBackup className="w-3.5 h-3.5" />전체 백업
          </button>
          <button
            onClick={doFullImport}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />전체 복원
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-xs font-semibold text-center py-1 px-3 rounded-lg ${msg.type === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}


/* ── 메인 컴포넌트 ─────────────────────────────────────────────── */
export default function SettingsTab({
  paymentMethods, presets, onUpdatePaymentMethods, onUpdatePresets,
  categories, onUpdateCategories, onRenameCategory,
  theme, onThemeChange,
  expenses, budget, onUpdateExpenses, onUpdateBudget,
}) {
  const { theme: ctxTheme } = useTheme();
  const lm = ctxTheme === 'light';

  return (
    <div className="space-y-4">
      <ThemeSection theme={theme} onThemeChange={onThemeChange} lm={lm} />
      <CategorySection
        categories={categories}
        onUpdate={onUpdateCategories}
        onRename={onRenameCategory}
      />
      <PaymentMethodsSection
        paymentMethods={paymentMethods}
        onUpdate={onUpdatePaymentMethods}
        lm={lm}
      />
      <PresetsSection
        presets={presets}
        paymentMethods={paymentMethods}
        onUpdate={onUpdatePresets}
        lm={lm}
      />
      <DataManagementSection
        expenses={expenses}
        budget={budget}
        paymentMethods={paymentMethods}
        presets={presets}
        categories={categories}
        onUpdateExpenses={onUpdateExpenses}
        onUpdateBudget={onUpdateBudget}
        onUpdatePaymentMethods={onUpdatePaymentMethods}
        onUpdatePresets={onUpdatePresets}
        onUpdateCategories={onUpdateCategories}
        lm={lm}
      />
    </div>
  );
}
