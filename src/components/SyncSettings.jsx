'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/SyncSettings.jsx
// 설정 탭의 "기기 동기화" 섹션. 동기화 코드를 만들거나(이 기기 데이터를
// 클라우드에 올려 시작점으로 삼음), 다른 기기의 코드를 입력해 연결합니다
// (클라우드 데이터가 더 최신이면 이 기기의 데이터를 덮어씀).
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { RefreshCw, Link2, Unlink, Copy, Check } from 'lucide-react';
import {
  isSyncConfigured,
  getSyncCode,
  clearSyncCode,
  generateSyncCode,
  setSyncCode,
  normalizeCode,
  pushAllLocal,
  connectWithCode,
  pullAll,
} from '@/lib/sync';

export function SyncSettings({ lm, sectionCls, h3Cls, mutedCls }) {
  const [code, setCode] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setCode(getSyncCode());
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCreate = async () => {
    if (code && !window.confirm('새 동기화 코드를 만들면 지금 이 기기의 데이터로 새 동기화 그룹이 시작됩니다. 계속할까요?')) return;
    setBusy(true);
    const newCode = generateSyncCode();
    setSyncCode(newCode);
    const ok = await pushAllLocal();
    setBusy(false);
    setCode(newCode);
    showMsg(ok ? 'success' : 'error', ok ? '동기화 코드를 만들고 현재 데이터를 올렸습니다.' : '일부 데이터 업로드에 실패했습니다. 네트워크를 확인해주세요.');
  };

  const handleConnect = async () => {
    const normalized = normalizeCode(input);
    if (!normalized) return;
    if (!window.confirm('이 코드로 연결하면 클라우드에 더 최신 데이터가 있는 항목은 이 기기의 데이터를 덮어씁니다. 계속할까요?')) return;
    setBusy(true);
    const result = await connectWithCode(normalized);
    setBusy(false);
    if (!result.ok && result.pulledKeys.length === 0) {
      showMsg('error', '연결에 실패했습니다. 코드와 네트워크 연결을 확인해주세요.');
      return;
    }
    showMsg('success', '연결되었습니다. 최신 데이터를 반영하기 위해 새로고침합니다.');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleDisconnect = () => {
    if (!window.confirm('이 기기의 동기화 연결을 해제할까요? 지금까지의 데이터는 이 기기에 그대로 남고, 앞으로만 다른 기기와 공유되지 않습니다.')) return;
    clearSyncCode();
    showMsg('success', '동기화 연결을 해제합니다.');
    // 실시간 수신 연결을 확실히 끊기 위해 새로고침합니다.
    setTimeout(() => window.location.reload(), 800);
  };

  const handleManualSync = async () => {
    setBusy(true);
    const result = await pullAll();
    setBusy(false);
    if (!result.ok && result.pulledKeys.length === 0 && result.failed) {
      showMsg('error', '동기화에 실패했습니다. 네트워크를 확인해주세요.');
      return;
    }
    // 실시간 리스너가 항상 켜져 있어 화면은 이미 최신 상태로 갱신되어
    // 있습니다. 이 버튼은 지금 바로 한 번 더 확인하고 싶을 때 씁니다.
    showMsg('success', result.pulledKeys.length === 0 ? '이미 최신 상태입니다.' : '최신 데이터를 반영했습니다.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 무시 */ }
  };

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center gap-2">
        <Link2 className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
        <h3 className={h3Cls(lm)}>기기 동기화</h3>
      </div>

      {!isSyncConfigured ? (
        <p className={mutedCls(lm)}>
          동기화 백엔드가 아직 구성되지 않았습니다. 관리자가 Firebase 설정을 완료하면 이 기능을 사용할 수 있습니다.
        </p>
      ) : code ? (
        <>
          <p className={mutedCls(lm)}>
            이 동기화 코드를 다른 기기의 설정 탭에서 입력하면 데이터를 실시간으로 함께 씁니다(두 기기 모두 앱이 켜져 있으면 새로고침 없이 자동 반영). 코드를 아는 사람은 누구나 접근할 수 있으니 외부에 공유하지 마세요.
          </p>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-sm ${lm ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-gray-800 border border-gray-700 text-gray-200'}`}>
            <span className="flex-1 break-all">{code}</span>
            <button onClick={handleCopy} aria-label="코드 복사" className={`shrink-0 p-1.5 rounded-lg ${lm ? 'hover:bg-slate-200' : 'hover:bg-gray-700'}`}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={busy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${lm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />지금 동기화
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
            >
              <Unlink className="w-3.5 h-3.5" />연결 해제
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={mutedCls(lm)}>
            모바일과 데스크탑에서 같은 데이터를 보려면, 한 기기에서 동기화 코드를 만들고 다른 기기에서 그 코드를 입력해 연결하세요.
          </p>
          <button
            onClick={handleCreate}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${lm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
          >
            <Link2 className="w-3.5 h-3.5" />이 기기로 동기화 코드 만들기
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="다른 기기의 동기화 코드 입력"
              className={`flex-1 min-w-0 rounded-xl px-3 py-2.5 text-xs font-mono ${lm ? 'bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400' : 'bg-gray-800 border border-gray-700 text-gray-200 placeholder:text-gray-500'}`}
            />
            <button
              onClick={handleConnect}
              disabled={busy || !input.trim()}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${lm ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
            >
              연결
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className={`text-xs font-semibold text-center py-1 px-3 rounded-lg ${msg.type === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
