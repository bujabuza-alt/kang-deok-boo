'use client';
import { useState } from 'react';

const MODES = [
  { id: 'price100g', label: '100g당 금액' },
  { id: 'percent', label: '백분율' },
];

function ResultBox({ result, children }) {
  return (
    <div className={`rounded-2xl p-5 text-center transition-all duration-200 ${result ? 'bg-indigo-600' : 'bg-slate-100'}`}>
      {result ? children : <p className="text-sm text-slate-400">위에 값을 입력하면 계산돼요</p>}
    </div>
  );
}

function NumInput({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-base focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition"
      />
    </label>
  );
}

function PricePer100g() {
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');

  const p = parseFloat(price);
  const w = parseFloat(weight);
  const result = p > 0 && w > 0 ? ((p / w) * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500 leading-relaxed">
        총 금액과 총 중량을 입력하면 <strong className="text-slate-700">100g당 금액</strong>을 계산합니다.
      </p>
      <NumInput label="총 중량 (g)" value={weight} onChange={setWeight} placeholder="예: 500" />
      <NumInput label="총 금액 (원)" value={price} onChange={setPrice} placeholder="예: 8900" />
      <ResultBox result={result}>
        <p className="text-sm text-indigo-200 mb-1">100g당 금액</p>
        <p className="text-3xl font-bold text-white tracking-tight">
          {result && Number(result).toLocaleString()}원
        </p>
        {weight && price && (
          <p className="text-xs text-indigo-300 mt-1.5">
            {Number(w).toLocaleString()}g · {Number(p).toLocaleString()}원 기준
          </p>
        )}
      </ResultBox>
    </div>
  );
}

function PercentCalc() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const av = parseFloat(a);
  const bv = parseFloat(b);
  const result = av > 0 && bv > 0 ? ((av / bv) * 100).toFixed(2) : null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500 leading-relaxed">
        <strong className="text-slate-700">ㄱ</strong>은 <strong className="text-slate-700">ㄴ</strong>의 몇 %인지 계산합니다.
      </p>
      <NumInput label="ㄱ (비교할 값)" value={a} onChange={setA} placeholder="예: 25" />
      <NumInput label="ㄴ (기준 값)" value={b} onChange={setB} placeholder="예: 100" />
      <ResultBox result={result}>
        <p className="text-sm text-indigo-200 mb-1">결과</p>
        <p className="text-3xl font-bold text-white tracking-tight">{result}%</p>
        {a && b && (
          <p className="text-xs text-indigo-300 mt-1.5">
            {Number(av).toLocaleString()}은 {Number(bv).toLocaleString()}의 {result}%
          </p>
        )}
      </ResultBox>
    </div>
  );
}

export function Calculator() {
  const [mode, setMode] = useState('price100g');

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
      <div className="flex gap-1 p-0.5 bg-slate-100 rounded-xl self-start">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-150 ${
              mode === m.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {mode === 'price100g' && <PricePer100g />}
        {mode === 'percent' && <PercentCalc />}
      </div>
    </div>
  );
}
