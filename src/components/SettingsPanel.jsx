'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/SettingsPanel.jsx
// '설정' 탭. 앱 전체 테마 전환 + 전체 데이터 백업/복원(JSON)을 제공합니다.
// 백업은 로컬 훅이 각각 관리하는 localStorage 키를 한데 모아 내보내고,
// 복원은 다시 써넣은 뒤 새로고침해 모든 탭이 값을 새로 읽도록 합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { DatabaseBackup, Download, Upload, RotateCcw, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';
import { ls, exportJSON } from '@/expense/utils';

// 앱 전체에서 localStorage에 저장하는 키 목록. 새 모듈을 추가하면 여기에도 등록합니다.
const BACKUP_KEYS = [
  { key: 'kang-deok-boo-todos', fallback: [] },
  { key: 'kang-deok-boo-todo-categories', fallback: null },
  { key: 'kang-deok-boo-memos', fallback: [] },
  { key: 'kang-deok-boo-reminders', fallback: [] },
  { key: 'kang-deok-boo-wishlist', fallback: [] },
  { key: 'kang-deok-boo-habits', fallback: [] },
  { key: 'kang-deok-boo-habit-checkins', fallback: {} },
  { key: 'kang-deok-boo-section-order', fallback: null },
  { key: 'et_expenses', fallback: [] },
  { key: 'et_budget', fallback: 500000 },
  { key: 'et_payment_methods', fallback: null },
  { key: 'et_presets', fallback: null },
  { key: 'et_categories', fallback: null },
];

const SECTION_ORDER_KEY = 'kang-deok-boo-section-order';

const sectionCls = (lm) => `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
const h3Cls = (lm) => `text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`;
const mutedCls = (lm) => `text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const lm = theme === 'light';
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const doFullExport = () => {
    const data = { type: 'kdb-full', version: 1, exportedAt: new Date().toISOString() };
    BACKUP_KEYS.forEach(({ key, fallback }) => { data[key] = ls.get(key, fallback); });
    exportJSON(`kang-deok-boo-backup-${today()}.json`, data);
    showMsg('success', '전체 데이터를 내보냈습니다.');
  };

  const doFullImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text());
        if (json.type !== 'kdb-full') { showMsg('error', '지원하지 않는 백업 파일 형식입니다.'); return; }
        if (!window.confirm('전체 데이터를 복원할까요? 현재 데이터는 모두 사라지고, 복원 후 앱이 새로고침됩니다.')) return;
        BACKUP_KEYS.forEach(({ key, fallback }) => {
          if (key in json) ls.set(key, json[key] ?? fallback);
        });
        window.location.reload();
      } catch {
        showMsg('error', '유효하지 않은 JSON 파일입니다.');
      }
    };
    document.body.appendChild(input);
    input.click();
  };

  const resetTabOrder = () => {
    try { localStorage.removeItem(SECTION_ORDER_KEY); } catch (e) { /* 무시 */ }
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      <section className={sectionCls(lm)}>
        <h3 className={h3Cls(lm)}>테마</h3>
        <div className="flex gap-2">
          {[
            { id: 'light', label: '라이트', Icon: Sun },
            { id: 'dark', label: '다크', Icon: Moon },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-xs font-bold transition-all ${
                theme === id
                  ? lm ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-800 border-violet-500 text-violet-400'
                  : lm ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionCls(lm)}>
        <div className="flex items-center gap-2">
          <DatabaseBackup className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <h3 className={h3Cls(lm)}>데이터 관리</h3>
        </div>
        <p className={mutedCls(lm)}>일정·메모·알림·위시리스트·습관·지출을 포함한 앱 전체 데이터를 한 번에 백업하거나 복원합니다.</p>
        <div className="flex gap-2">
          <button
            onClick={doFullExport}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${lm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
          >
            <Download className="w-3.5 h-3.5" />전체 백업
          </button>
          <button
            onClick={doFullImport}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
          >
            <Upload className="w-3.5 h-3.5" />전체 복원
          </button>
        </div>
        {msg && (
          <p className={`text-xs font-semibold text-center py-1 px-3 rounded-lg ${msg.type === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
            {msg.text}
          </p>
        )}
      </section>

      <section className={sectionCls(lm)}>
        <h3 className={h3Cls(lm)}>탭 순서</h3>
        <button
          onClick={resetTabOrder}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />기본 순서로 초기화
        </button>
      </section>

      <section className={sectionCls(lm)}>
        <div className="flex items-center gap-2">
          <Info className={`w-4 h-4 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />
          <h3 className={h3Cls(lm)}>앱 정보</h3>
        </div>
        <p className={mutedCls(lm)}>강덕부 · 빌드 {process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}</p>
      </section>
    </div>
  );
}
