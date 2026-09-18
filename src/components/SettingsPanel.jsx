'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/SettingsPanel.jsx
// '설정' 화면. 테마, 지출 관리(결제수단/프리셋/카테고리), 기기 동기화,
// 전체 데이터 백업/복원, 앱 정보를 한 화면에 모읍니다. 원래 지출 화면 안에
// 따로 있던 설정 탭(테마 3종·지출 전용 백업)을 이 화면 하나로 통합했습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { DatabaseBackup, Download, Upload, Sun, Moon, Info, Wallet, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ls, exportJSON } from '@/expense/utils';
import { SYNC_KEYS } from '@/lib/syncKeys';
import { SyncSettings } from '@/components/SyncSettings';
import { useExpenseSettingsData } from '@/expense/useExpenseSettingsData';
import CategorySection from '@/expense/components/tabs/CategorySection';
import PaymentMethodsSection from '@/expense/components/tabs/PaymentMethodsSection';
import PresetsSection from '@/expense/components/tabs/PresetsSection';

// 앱 전체에서 localStorage에 저장하는 키 목록 (동기화 대상과 동일).
const BACKUP_KEYS = SYNC_KEYS;

const sectionCls = (lm) => `rounded-2xl p-4 space-y-3 ${lm ? 'bg-white shadow-sm border border-slate-100' : 'bg-gray-900'}`;
const h3Cls = (lm) => `text-sm font-bold ${lm ? 'text-slate-800' : 'text-gray-200'}`;
const mutedCls = (lm) => `text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 예전 지출 트래커 전용 백업 포맷들을 { expenses, budget, paymentMethods, presets, categories }
// 형태로 정규화합니다. 통합 이전에 내려받은 백업 파일도 계속 복원할 수 있도록 합니다.
function normalizeLegacyExpenseBackup(json) {
  if (json.type === 'full') return json;
  if (Array.isArray(json.expenses)) return { ...json, type: 'full' };
  if (json.data && Array.isArray(json.data.expenses)) return { type: 'full', ...json.data };
  if (Array.isArray(json.records)) return { type: 'full', expenses: json.records, ...json };
  return null;
}

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const lm = theme === 'light';
  const [msg, setMsg] = useState(null);

  const {
    loaded: expenseLoaded,
    expenses, budget, paymentMethods, presets, categories,
    setExpenses, setBudget, setPaymentMethods, setPresets, setCategories,
    renameCategory,
  } = useExpenseSettingsData();

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

        if (json.type === 'kdb-full') {
          if (!window.confirm('전체 데이터를 복원할까요? 현재 데이터는 모두 사라지고, 복원 후 앱이 새로고침됩니다.')) return;
          BACKUP_KEYS.forEach(({ key, fallback }) => { if (key in json) ls.set(key, json[key] ?? fallback); });
          window.location.reload();
          return;
        }

        const legacy = normalizeLegacyExpenseBackup(json);
        if (legacy) {
          if (!window.confirm('지출 데이터를 복원할까요? 현재 지출 데이터는 모두 사라지고, 복원 후 앱이 새로고침됩니다.')) return;
          if (Array.isArray(legacy.expenses)) ls.set('et_expenses', legacy.expenses);
          if (typeof legacy.budget === 'number') ls.set('et_budget', legacy.budget);
          if (Array.isArray(legacy.paymentMethods)) ls.set('et_payment_methods', legacy.paymentMethods);
          if (Array.isArray(legacy.presets)) ls.set('et_presets', legacy.presets);
          if (Array.isArray(legacy.categories)) ls.set('et_categories', legacy.categories);
          window.location.reload();
          return;
        }

        showMsg('error', '지원하지 않는 백업 파일 형식입니다.');
      } catch {
        showMsg('error', '유효하지 않은 JSON 파일입니다.');
      }
    };
    document.body.appendChild(input);
    input.click();
  };

  const ITEMS = [
    { label: '지출 내역', type: 'expenses', data: expenses, validate: Array.isArray, onImport: setExpenses },
    { label: '예산', type: 'budget', data: budget, validate: (v) => typeof v === 'number', onImport: setBudget },
    { label: '결제 수단', type: 'payment-methods', data: paymentMethods, validate: Array.isArray, onImport: setPaymentMethods },
    { label: '자주 쓰는 항목', type: 'presets', data: presets, validate: Array.isArray, onImport: setPresets },
    { label: '카테고리', type: 'categories', data: categories, validate: Array.isArray, onImport: setCategories },
  ];

  const doItemExport = (type, data) =>
    exportJSON(`et-${type}-${today()}.json`, { type, version: 1, exportedAt: new Date().toISOString(), data });

  const doItemImport = (item) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text());
        if (!item.validate(json.data)) { showMsg('error', `${item.label} 파일 형식이 맞지 않습니다.`); return; }
        if (!window.confirm(`기존 ${item.label}을 덮어쓸까요?`)) return;
        item.onImport(json.data);
        showMsg('success', `${item.label}을 불러왔습니다.`);
      } catch {
        showMsg('error', '유효하지 않은 JSON 파일입니다.');
      }
    };
    document.body.appendChild(input);
    input.click();
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
          <Wallet className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <h3 className={h3Cls(lm)}>지출 관리</h3>
        </div>
        {expenseLoaded ? (
          <div className="space-y-3">
            <CategorySection categories={categories} onUpdate={setCategories} onRename={renameCategory} />
            <PaymentMethodsSection paymentMethods={paymentMethods} onUpdate={setPaymentMethods} />
            <PresetsSection presets={presets} paymentMethods={paymentMethods} onUpdate={setPresets} />
          </div>
        ) : (
          <p className={mutedCls(lm)}>불러오는 중...</p>
        )}
      </section>

      <SyncSettings lm={lm} sectionCls={sectionCls} h3Cls={h3Cls} mutedCls={mutedCls} />

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

        {expenseLoaded && (
          <div className={`pt-2 border-t ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
            <p className={`text-[10px] mb-2 ${lm ? 'text-slate-400' : 'text-gray-600'}`}>지출 데이터만 항목별로 백업/복원</p>
            <ul className="space-y-2">
              {ITEMS.map((item) => (
                <li key={item.type} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'}`}>
                  <span className={`text-sm font-medium ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => doItemExport(item.type, item.data)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${lm ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-violet-900/30 text-violet-400 hover:bg-violet-900/50'}`}
                      aria-label={`${item.label} 저장`}
                    >
                      <Download className="w-3 h-3" />저장
                    </button>
                    <button
                      onClick={() => doItemImport(item)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${lm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      aria-label={`${item.label} 불러오기`}
                    >
                      <Upload className="w-3 h-3" />불러오기
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {msg && (
          <p className={`text-xs font-semibold text-center py-1 px-3 rounded-lg ${msg.type === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
            {msg.text}
          </p>
        )}
      </section>

      <AppInfoSection lm={lm} />
    </div>
  );
}

function AppInfoSection({ lm }) {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
  const [swBuildId, setSwBuildId] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkVersion = () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      setSwBuildId('SW 없음');
      return;
    }
    setChecking(true);
    const onMessage = (event) => {
      if (event.data?.type === 'BUILD_ID') {
        setSwBuildId(event.data.buildId);
        setChecking(false);
        navigator.serviceWorker.removeEventListener('message', onMessage);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.controller.postMessage({ type: 'GET_BUILD_ID' });
  };

  const isMatch = swBuildId && swBuildId !== 'SW 없음' && swBuildId === buildId;

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center gap-2">
        <Info className={`w-4 h-4 ${lm ? 'text-slate-400' : 'text-gray-500'}`} />
        <h3 className={h3Cls(lm)}>앱 정보</h3>
      </div>
      <p className={mutedCls(lm)}>강덕부 · 빌드 {buildId}</p>
      <button
        onClick={checkVersion}
        disabled={checking}
        className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />최신 버전인지 확인
      </button>
      {swBuildId && (
        <p className={`text-xs text-center font-semibold ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
          {isMatch ? '✓ 최신 버전입니다' : swBuildId === 'SW 없음' ? '서비스 워커가 아직 등록되지 않았습니다' : `⚠ 새 버전이 있어요 (${swBuildId})`}
        </p>
      )}
    </section>
  );
}
