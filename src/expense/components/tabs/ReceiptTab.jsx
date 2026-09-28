'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, Receipt, X, Trash2, Loader2 } from 'lucide-react';
import { TODAY, uid } from '@/expense/utils';
import { RECEIPT_KEYS, PER_SHARD, MAX_RECEIPTS, loadShards, saveShard, compressImage } from '@/expense/receipts';
import { SYNC_EVENT } from '@/lib/sync';
import { useTheme } from '@/context/ThemeContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const fmtMonth = (key) => {
  const [y, m] = key.split('-');
  return `${y}년 ${parseInt(m)}월`;
};

export default function ReceiptTab() {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [shards,     setShards]     = useState(loadShards);
  const [pending,    setPending]    = useState(null); // 저장 전 { image, date, memo }
  const [processing, setProcessing] = useState(false);
  const [viewing,    setViewing]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef(null);

  // 다른 기기에서 동기화로 값이 바뀌면 즉시 반영합니다.
  useEffect(() => {
    const handler = (e) => {
      if (RECEIPT_KEYS.includes(e.detail?.key)) setShards(loadShards());
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  const receipts = useMemo(
    () => Object.values(shards).flat().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [shards]
  );

  const monthGroups = useMemo(() => {
    const map = {};
    receipts.forEach(r => {
      const key = r.date.slice(0, 7);
      (map[key] ||= []).push(r);
    });
    return Object.entries(map);
  }, [receipts]);

  const full = receipts.length >= MAX_RECEIPTS;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      const image = await compressImage(file);
      setPending({ image, date: TODAY, memo: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const savePending = () => {
    const key = RECEIPT_KEYS.find(k => shards[k].length < PER_SHARD);
    if (!key) return;
    const list = [...shards[key], { id: uid(), date: pending.date, memo: pending.memo.trim(), image: pending.image }];
    try {
      saveShard(key, list);
    } catch {
      alert('저장 공간이 부족합니다. 오래된 영수증을 삭제한 뒤 다시 시도해주세요.');
      return;
    }
    setShards(s => ({ ...s, [key]: list }));
    setPending(null);
  };

  const deleteViewing = () => {
    const key = RECEIPT_KEYS.find(k => shards[k].some(r => r.id === viewing.id));
    if (key) {
      const list = shards[key].filter(r => r.id !== viewing.id);
      saveShard(key, list);
      setShards(s => ({ ...s, [key]: list }));
    }
    setConfirmDel(false);
    setViewing(null);
  };

  const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm outline-none border ${lm ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400' : 'bg-gray-800 border-gray-700 text-white focus:border-violet-500'}`;

  return (
    <div>
      <div className="space-y-4">
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${lm ? 'bg-white border-slate-100 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <div>
            <p className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>영수증 보관함</p>
            <p className={`text-xs mt-0.5 ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
              {receipts.length} / {MAX_RECEIPTS}장
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={full || processing}
            className={`flex items-center gap-1.5 px-4 min-h-11 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 ${lm ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {full ? '가득 참' : '영수증 추가'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className={`w-10 h-10 mx-auto mb-3 ${lm ? 'text-slate-300' : 'text-gray-700'}`} />
            <p className={`text-sm ${lm ? 'text-slate-400' : 'text-gray-500'}`}>저장된 영수증이 없습니다</p>
          </div>
        ) : (
          monthGroups.map(([month, items]) => (
            <div key={month}>
              <p className={`text-xs font-bold mb-2 ${lm ? 'text-slate-500' : 'text-gray-400'}`}>{fmtMonth(month)}</p>
              <div className="grid grid-cols-3 gap-2">
                {items.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setViewing(r)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border ${lm ? 'border-slate-200 bg-slate-100' : 'border-gray-800 bg-gray-900'}`}
                  >
                    <img src={r.image} alt={r.memo || '영수증'} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] text-left text-white bg-black/50 truncate">
                      {r.date.slice(5)}{r.memo ? ` · ${r.memo}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setPending(null)}>
          <div
            className={`w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up px-5 pt-4 ${lm ? 'bg-white' : 'bg-gray-900'}`}
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${lm ? 'bg-slate-200' : 'bg-gray-700'}`} />
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${lm ? 'text-slate-900' : 'text-white'}`}>영수증 저장</h3>
              <button onClick={() => setPending(null)} className={lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={pending.image} alt="미리보기" className="w-full max-h-64 object-contain rounded-xl mb-4 bg-black/5" />
            <div className="space-y-3">
              <input
                type="date"
                value={pending.date}
                onChange={e => setPending(p => ({ ...p, date: e.target.value || TODAY }))}
                className={inputCls}
              />
              <input
                type="text"
                value={pending.memo}
                onChange={e => setPending(p => ({ ...p, memo: e.target.value }))}
                placeholder="메모 (예: 마트 장보기)"
                className={inputCls}
              />
              <button
                onClick={savePending}
                className={`w-full min-h-12 rounded-xl text-sm font-bold text-white ${lm ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-violet-600 hover:bg-violet-700'}`}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setViewing(null)}>
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="min-w-0">
              <p className="text-sm font-bold">{viewing.date}</p>
              {viewing.memo && <p className="text-xs text-gray-300 truncate">{viewing.memo}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setConfirmDel(true)} className="p-2.5 text-red-400 hover:text-red-300">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setViewing(null)} className="p-2.5 text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            <img src={viewing.image} alt={viewing.memo || '영수증'} className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDel}
        title="영수증을 삭제할까요?"
        message="삭제한 영수증은 되돌릴 수 없습니다."
        onConfirm={deleteViewing}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}
