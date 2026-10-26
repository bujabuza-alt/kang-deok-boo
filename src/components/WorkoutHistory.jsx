'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/WorkoutHistory.jsx
// '운동' 탭의 히스토리 화면: 최근 7일 운동별 합계 + 날짜별 기록(최근 30일).
// ──────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { formatDuration, formatLog, summarize } from '@/lib/workout';
import { Card } from './ui/Card';

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateLabel(date) {
  const [y, m, d] = date.split('-').map(Number);
  const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${dow})`;
}

function summaryText(s) {
  if (s.type === 'run') return [formatDuration(s.durationSec), s.distanceKm && `${s.distanceKm}km`].filter(Boolean).join(' · ');
  if (s.type === 'time') return formatDuration(s.durationSec);
  return `총 ${s.reps}회${s.maxWeight ? ` · 최고 ${s.maxWeight}kg` : ''}`;
}

export function WorkoutHistory({ logs, lm }) {
  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const weekSummary = useMemo(() => summarize(logs, dateStr(6)), [logs]);
  const activeDays = useMemo(() => new Set(logs.filter((l) => l.date >= dateStr(6)).map((l) => l.date)).size, [logs]);

  // 최근 30일 기록을 날짜 내림차순으로 묶음
  const byDate = useMemo(() => {
    const from = dateStr(29);
    const map = new Map();
    logs.filter((l) => l.date >= from).forEach((l) => map.set(l.date, [...(map.get(l.date) || []), l]));
    return [...map.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [logs]);

  return (
    <div className="space-y-3">
      <Card>
        <h3 className={`text-sm font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>최근 7일</h3>
        <p className={`text-xs mb-3 ${muted}`}>{activeDays}일 운동</p>
        {weekSummary.length === 0 ? (
          <p className={`text-xs text-center py-3 ${muted}`}>최근 7일 기록이 없어요</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {weekSummary.map((s) => (
              <li key={s.exerciseId} className={`p-3 rounded-xl ${lm ? 'bg-slate-50' : 'bg-gray-800'}`}>
                <p className={`text-xs font-bold ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{s.name}</p>
                <p className={`text-sm font-black mt-0.5 ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>{summaryText(s)}</p>
                <p className={`text-[11px] ${muted}`}>{s.sets}세트</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {byDate.map(([date, items]) => (
        <Card key={date}>
          <h3 className={`text-sm font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>{dateLabel(date)}</h3>
          <ul className="space-y-1">
            {items.map((l) => (
              <li key={l.id} className={`flex justify-between text-sm ${lm ? 'text-slate-600' : 'text-gray-300'}`}>
                <span>{l.name}</span>
                <span className="tabular-nums">{formatLog(l)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
