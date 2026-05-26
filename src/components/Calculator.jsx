'use client';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

function fmt(n, decimals = 4) {
  const rounded = parseFloat(n.toFixed(decimals));
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: decimals });
}

function PricePer100g() {
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');

  const w = parseFloat(weight);
  const p = parseFloat(price);
  const result = weight && price && w > 0 ? (p / w) * 100 : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">100g당 금액</p>
          <p className="text-xs text-slate-400 mt-0.5">총 중량과 금액을 입력하면 100g당 가격을 계산해요</p>
        </div>
        <button
          onClick={() => { setWeight(''); setPrice(''); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">총 중량 (g)</span>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="500"
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800 w-full"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">총 금액 (원)</span>
          <input
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="12000"
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800 w-full"
          />
        </label>
      </div>

      <div className={`rounded-xl p-4 text-center transition-all ${result !== null ? 'bg-indigo-50' : 'bg-slate-50'}`}>
        {result !== null ? (
          <>
            <p className="text-xs text-indigo-500 mb-1">100g당 금액</p>
            <p className="text-2xl font-bold text-indigo-700 tabular-nums">
              {fmt(result, 1)}원
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {w.toLocaleString()}g ÷ {p.toLocaleString()}원 기준
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">중량과 금액을 입력해주세요</p>
        )}
      </div>
    </div>
  );
}

function PercentCalc() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const av = parseFloat(a);
  const bv = parseFloat(b);
  const result = a && b && bv !== 0 ? (av / bv) * 100 : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">ㄱ은 ㄴ의 몇%?</p>
          <p className="text-xs text-slate-400 mt-0.5">두 값을 입력하면 비율을 계산해요</p>
        </div>
        <button
          onClick={() => { setA(''); setB(''); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">ㄱ (부분)</span>
          <input
            type="number"
            inputMode="decimal"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="3"
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800 w-full"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">ㄴ (전체)</span>
          <input
            type="number"
            inputMode="decimal"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="10"
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-300 text-slate-800 w-full"
          />
        </label>
      </div>

      <div className={`rounded-xl p-4 text-center transition-all ${result !== null ? 'bg-emerald-50' : 'bg-slate-50'}`}>
        {result !== null ? (
          <>
            <p className="text-xs text-emerald-600 mb-1">결과</p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              {fmt(result, 4)}%
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {av.toLocaleString()} ÷ {bv.toLocaleString()} × 100
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">두 값을 입력해주세요</p>
        )}
      </div>
    </div>
  );
}

export function Calculator() {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      <PricePer100g />
      <PercentCalc />
    </div>
  );
}
