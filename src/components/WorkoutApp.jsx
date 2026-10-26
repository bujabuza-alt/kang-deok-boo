'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/WorkoutApp.jsx
// '운동' 탭. [기록 | 타이머 | 히스토리] 세 화면으로 나뉩니다.
//  - 기록: 운동을 고르고 횟수 카운터(탭 +1)나 스톱워치로 세트를 저장합니다.
//          횟수형 세트를 저장하면 휴식 타이머가 자동으로 시작됩니다.
//  - 타이머: 간편 카운트다운 / 인터벌(타바타) — WorkoutTimers
//  - 히스토리: 최근 7일 합계와 날짜별 기록 — WorkoutHistory
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Play, Pause, RotateCcw, Flag, SkipForward } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useWorkoutClock, primeAudio, beep } from '@/hooks/useWorkoutClock';
import { EXERCISE_TYPES, formatDuration, formatPace, formatLog } from '@/lib/workout';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { BottomSheet } from './ui/BottomSheet';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Segmented } from './ui/Segmented';
import { WorkoutTimers } from './WorkoutTimers';
import { WorkoutHistory } from './WorkoutHistory';

const VIEWS = [
  { id: 'log', label: '기록' },
  { id: 'timer', label: '타이머' },
  { id: 'history', label: '히스토리' },
];
const REST_OPTIONS = [0, 30, 60, 90, 120]; // 초, 0 = 끔

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function chipCls(lm, active) {
  return `px-3 py-1.5 min-h-9 rounded-full text-xs font-medium border transition-colors ${
    active
      ? lm ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-violet-600 border-violet-600 text-white'
      : lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'
  }`;
}

// 세트 간 휴식 타이머. 끝나면 소리·진동 후 저절로 멈춥니다.
function RestBanner({ rest, lm }) {
  const remainingMs = rest.durationMs - rest.elapsedMs;
  const ended = rest.running && remainingMs <= 0;
  useEffect(() => {
    if (!ended) return;
    beep({ long: true, times: 2 });
    rest.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);
  if (!rest.running) return null;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${lm ? 'bg-sky-50 text-sky-800' : 'bg-sky-950/40 text-sky-200'}`}>
      <span className="text-xs font-bold">휴식</span>
      <span className="flex-1 text-2xl font-black tabular-nums">{formatDuration(Math.ceil(Math.max(0, remainingMs) / 1000))}</span>
      <button onClick={() => rest.update({ durationMs: rest.durationMs + 15000 })} className="text-xs font-bold px-2 min-h-11">+15초</button>
      <IconButton icon={SkipForward} label="휴식 건너뛰기" onClick={() => rest.reset()} />
    </div>
  );
}

function RepsPanel({ exercise, lastWeight, restSec, onRestChange, onSave, lm }) {
  const [count, setCount] = useState(0);
  const [weight, setWeight] = useState(lastWeight || 10);
  useEffect(() => { setCount(0); setWeight(lastWeight || 10); }, [exercise.id, lastWeight]);
  const isWeight = exercise.type === 'weight';
  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const stepBtn = `flex-1 min-h-11 rounded-xl text-sm font-bold border ${lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'}`;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCount((c) => c + 1)}
        className={`w-full py-8 rounded-2xl flex flex-col items-center select-none active:scale-[0.98] transition-transform ${
          lm ? 'bg-indigo-50 text-indigo-700' : 'bg-violet-950/40 text-violet-200'
        }`}
      >
        <span className="text-6xl font-black tabular-nums">{count}</span>
        <span className={`text-xs mt-1 ${muted}`}>탭해서 +1</span>
      </button>
      <div className="flex gap-2">
        <button onClick={() => setCount((c) => Math.max(0, c - 1))} className={stepBtn}>−1</button>
        <button onClick={() => setCount((c) => c + 5)} className={stepBtn}>+5</button>
        <button onClick={() => setCount((c) => c + 10)} className={stepBtn}>+10</button>
        <button onClick={() => setCount(0)} className={stepBtn} aria-label="카운트 초기화"><RotateCcw className="w-4 h-4 mx-auto" /></button>
      </div>
      {isWeight && (
        <div className="flex items-center gap-2">
          <span className={`text-xs ${muted}`}>무게</span>
          <IconButton icon={Minus} label="무게 2.5kg 줄이기" onClick={() => setWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10))} />
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value) || 0)}
            className={`w-20 text-center px-2 py-2 rounded-xl border text-sm ${lm ? 'bg-white border-slate-200 text-slate-900' : 'bg-gray-800 border-gray-700 text-white'}`}
          />
          <span className={`text-xs ${muted}`}>kg</span>
          <IconButton icon={Plus} label="무게 2.5kg 늘리기" onClick={() => setWeight((w) => Math.round((w + 2.5) * 10) / 10)} />
        </div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs mr-1 ${muted}`}>저장 후 휴식</span>
        {REST_OPTIONS.map((sec) => (
          <button key={sec} onClick={() => onRestChange(sec)} className={chipCls(lm, restSec === sec)}>
            {sec === 0 ? '끔' : formatDuration(sec)}
          </button>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={count === 0}
        onClick={() => {
          primeAudio();
          onSave(isWeight ? { reps: count, weight } : { reps: count });
          setCount(0);
        }}
      >
        세트 저장
      </Button>
    </div>
  );
}

function StopwatchPanel({ exercise, onSave, lm }) {
  const sw = useWorkoutClock('stopwatch', { laps: [] });
  const [km, setKm] = useState('');
  const isRun = exercise.type === 'run';
  const sec = Math.floor(sw.elapsedMs / 1000);
  const pace = isRun && formatPace(sec, Number(km));
  const muted = lm ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-3">
      <div className={`py-6 rounded-2xl text-center ${lm ? 'bg-indigo-50 text-indigo-700' : 'bg-violet-950/40 text-violet-200'}`}>
        <span className="text-5xl font-black tabular-nums">{formatDuration(sec)}</span>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 flex items-center justify-center gap-1.5"
          onClick={() => { primeAudio(); sw.running ? sw.pause() : sw.start(); }}
        >
          {sw.running ? <><Pause className="w-4 h-4" />일시정지</> : <><Play className="w-4 h-4" />{sw.elapsedMs ? '계속' : '시작'}</>}
        </Button>
        {isRun && (
          <Button variant="secondary" disabled={!sw.running} onClick={() => sw.update({ laps: [...sw.laps, sw.elapsedMs] })} aria-label="랩">
            <Flag className="w-4 h-4" />
          </Button>
        )}
        <Button variant="secondary" disabled={!sw.elapsedMs} onClick={() => sw.reset({ laps: [] })} aria-label="리셋">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      {sw.laps.length > 0 && (
        <ol className={`text-xs space-y-0.5 ${muted}`}>
          {sw.laps.map((t, i) => (
            <li key={i} className="flex justify-between tabular-nums">
              <span>랩 {i + 1}</span>
              <span>{formatDuration((t - (sw.laps[i - 1] || 0)) / 1000)} · 누적 {formatDuration(t / 1000)}</span>
            </li>
          ))}
        </ol>
      )}
      {isRun && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="거리"
            className={`w-24 px-3 py-2 rounded-xl border text-sm ${lm ? 'bg-white border-slate-200 text-slate-900' : 'bg-gray-800 border-gray-700 text-white'}`}
          />
          <span className={`text-xs ${muted}`}>km</span>
          {pace && <span className={`ml-auto text-sm font-bold ${lm ? 'text-indigo-600' : 'text-violet-400'}`}>{pace}/km</span>}
        </div>
      )}
      <Button
        className="w-full"
        disabled={sec === 0}
        onClick={() => {
          onSave(isRun ? { durationSec: sec, distanceKm: Number(km) || 0 } : { durationSec: sec });
          sw.reset({ laps: [] });
          setKm('');
        }}
      >
        기록 저장
      </Button>
    </div>
  );
}

function AddExerciseSheet({ open, onClose, onAdd, lm }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('reps');
  useEffect(() => { if (open) { setName(''); setType('reps'); } }, [open]);
  return (
    <BottomSheet open={open} onClose={onClose} title="운동 추가">
      <div className="p-5 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="운동 이름 (예: 턱걸이)"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${lm ? 'bg-white border-slate-200 focus:border-indigo-400 text-slate-900' : 'bg-gray-800 border-gray-700 focus:border-violet-500 text-white'}`}
        />
        <div className="flex flex-wrap gap-2">
          {EXERCISE_TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} className={chipCls(lm, type === t.id)}>{t.label}</button>
          ))}
        </div>
        <Button className="w-full" disabled={!name.trim()} onClick={() => { onAdd(name.trim(), type); onClose(); }}>추가</Button>
      </div>
    </BottomSheet>
  );
}

function LogView({ workouts, lm }) {
  const { exercises, logs, addExercise, deleteExercise, addLog, deleteLog } = workouts;
  const [selectedId, setSelectedId] = useState(exercises[0]?.id);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rest = useWorkoutClock('rest', { durationMs: 60000, restSec: 60 });
  const today = todayStr();
  const muted = lm ? 'text-slate-400' : 'text-gray-500';

  const exercise = exercises.find((e) => e.id === selectedId) || exercises[0];
  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const lastWeight = useMemo(
    () => [...logs].reverse().find((l) => l.exerciseId === exercise?.id && l.weight)?.weight,
    [logs, exercise?.id]
  );

  // 오늘 기록을 운동별로 묶음(처음 기록한 순서)
  const groups = useMemo(() => {
    const map = new Map();
    todayLogs.forEach((l) => map.set(l.exerciseId, [...(map.get(l.exerciseId) || []), l]));
    return [...map.values()];
  }, [todayLogs]);

  const save = (fields) => {
    addLog({ date: today, exerciseId: exercise.id, name: exercise.name, type: exercise.type, ...fields });
    if (fields.reps && rest.restSec > 0) rest.restart({ durationMs: rest.restSec * 1000 });
  };

  if (!exercise) return null;

  return (
    <div className="space-y-3">
      <RestBanner rest={rest} lm={lm} />
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          {exercises.map((e) => (
            <button key={e.id} onClick={() => setSelectedId(e.id)} className={chipCls(lm, e.id === exercise.id)}>{e.name}</button>
          ))}
          <button onClick={() => setAdding(true)} className={`${chipCls(lm, false)} flex items-center gap-1`}>
            <Plus className="w-3 h-3" />추가
          </button>
        </div>
        {exercise.type === 'reps' || exercise.type === 'weight' ? (
          <RepsPanel
            exercise={exercise}
            lastWeight={lastWeight}
            restSec={rest.restSec}
            onRestChange={(sec) => rest.update({ restSec: sec })}
            onSave={save}
            lm={lm}
          />
        ) : (
          <StopwatchPanel exercise={exercise} onSave={save} lm={lm} />
        )}
        {exercise.custom && (
          <button onClick={() => setConfirmDelete(true)} className={`mt-3 text-xs min-h-11 ${muted}`}>
            &apos;{exercise.name}&apos; 운동 삭제
          </button>
        )}
      </Card>

      <Card>
        <h3 className={`text-sm font-bold mb-2 ${lm ? 'text-slate-800' : 'text-white'}`}>오늘 기록</h3>
        {groups.length === 0 ? (
          <p className={`text-xs text-center py-3 ${muted}`}>아직 기록이 없어요</p>
        ) : (
          <div className="space-y-3">
            {groups.map((items) => {
              const totalReps = items.reduce((sum, l) => sum + (l.reps || 0), 0);
              return (
                <div key={items[0].exerciseId}>
                  <p className={`text-xs font-bold ${lm ? 'text-slate-700' : 'text-gray-200'}`}>
                    {items[0].name} <span className={`font-normal ${muted}`}>{items.length}세트{totalReps ? ` · 총 ${totalReps}회` : ''}</span>
                  </p>
                  <ul>
                    {items.map((l, i) => (
                      <li key={l.id} className={`flex items-center text-sm ${lm ? 'text-slate-600' : 'text-gray-300'}`}>
                        <span className={`w-12 text-xs ${muted}`}>{i + 1}세트</span>
                        <span className="flex-1 tabular-nums">{formatLog(l)}</span>
                        <IconButton icon={Trash2} label="기록 삭제" tone="danger" onClick={() => deleteLog(l.id)} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AddExerciseSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(name, type) => addExercise(name, type)}
        lm={lm}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="운동 삭제"
        message={`'${exercise.name}'을(를) 운동 목록에서 뺄까요? 지난 기록은 남아요.`}
        onConfirm={() => { deleteExercise(exercise.id); setSelectedId(exercises[0]?.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export function WorkoutApp() {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const workouts = useWorkouts();
  const [view, setView] = useState('log');

  if (!workouts.loaded) return null;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">
      <Segmented items={VIEWS} value={view} onChange={setView} />
      {view === 'log' && <LogView workouts={workouts} lm={lm} />}
      {view === 'timer' && <WorkoutTimers lm={lm} />}
      {view === 'history' && <WorkoutHistory logs={workouts.logs} lm={lm} />}
    </div>
  );
}
