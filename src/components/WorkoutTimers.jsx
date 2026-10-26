'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/WorkoutTimers.jsx
// '운동' 탭의 타이머 화면.
//  - 간편 타이머: 원탭 프리셋(30초~10분) + ±10초 조절 카운트다운
//  - 인터벌: 운동/휴식 초·라운드 수 설정(타바타 등 프리셋), 단계가 바뀔 때와
//            각 단계 마지막 3초에 소리·진동으로 알려줍니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';
import { useWorkoutClock, primeAudio, beep } from '@/hooks/useWorkoutClock';
import { formatDuration, intervalState, intervalTotalMs } from '@/lib/workout';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Segmented } from './ui/Segmented';

const COUNTDOWN_PRESETS = [30, 60, 120, 180, 300, 600]; // 초
const INTERVAL_PRESETS = [
  { label: '타바타 20/10×8', work: 20, rest: 10, rounds: 8 },
  { label: '30/30×10', work: 30, rest: 30, rounds: 10 },
  { label: '40/20×8', work: 40, rest: 20, rounds: 8 },
];
const PREP_SEC = 3;

const PHASE = {
  prep: { label: '준비', light: 'bg-slate-100 text-slate-700', dark: 'bg-gray-800 text-gray-200' },
  work: { label: '운동', light: 'bg-emerald-50 text-emerald-700', dark: 'bg-emerald-950/40 text-emerald-300' },
  rest: { label: '휴식', light: 'bg-sky-50 text-sky-700', dark: 'bg-sky-950/40 text-sky-300' },
  done: { label: '완료', light: 'bg-indigo-50 text-indigo-700', dark: 'bg-violet-950/40 text-violet-300' },
};

function presetLabel(sec) {
  return sec < 60 ? `${sec}초` : `${sec / 60}분`;
}

function Controls({ clock, onStart }) {
  return (
    <div className="flex gap-2">
      <Button
        className="flex-1 flex items-center justify-center gap-1.5"
        onClick={() => { primeAudio(); clock.running ? clock.pause() : onStart(); }}
      >
        {clock.running ? <><Pause className="w-4 h-4" />일시정지</> : <><Play className="w-4 h-4" />{clock.elapsedMs ? '계속' : '시작'}</>}
      </Button>
      <Button variant="secondary" disabled={!clock.elapsedMs} onClick={() => clock.reset()} aria-label="리셋">
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}

function Countdown({ lm }) {
  const clock = useWorkoutClock('countdown', { durationMs: 60000 });
  const remainingMs = Math.max(0, clock.durationMs - clock.elapsedMs);
  const ended = clock.running && remainingMs === 0;
  const progress = clock.durationMs ? remainingMs / clock.durationMs : 0;

  useEffect(() => {
    if (!ended) return;
    beep({ long: true, times: 3 });
    clock.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  const setDuration = (ms) => clock.reset({ durationMs: Math.max(5000, ms) });
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <Card className="space-y-4">
      <div className="relative w-56 h-56 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="6" className={lm ? 'stroke-slate-100' : 'stroke-gray-800'} />
          <circle
            cx="60" cy="60" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            className={`transition-[stroke-dashoffset] duration-200 ${lm ? 'stroke-indigo-500' : 'stroke-violet-500'}`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-5xl font-black tabular-nums ${lm ? 'text-slate-800' : 'text-white'}`}>
          {formatDuration(Math.ceil(remainingMs / 1000))}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <IconButton icon={Minus} label="10초 줄이기" onClick={() => setDuration(clock.durationMs - 10000)} />
        <span className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>10초</span>
        <IconButton icon={Plus} label="10초 늘리기" onClick={() => setDuration(clock.durationMs + 10000)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {COUNTDOWN_PRESETS.map((sec) => (
          <button
            key={sec}
            onClick={() => { primeAudio(); clock.restart({ durationMs: sec * 1000 }); }}
            className={`min-h-11 rounded-xl text-sm font-bold border ${
              clock.durationMs === sec * 1000
                ? lm ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-800 border-violet-500 text-violet-400'
                : lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'
            }`}
          >
            {presetLabel(sec)}
          </button>
        ))}
      </div>
      <p className={`text-[11px] text-center ${lm ? 'text-slate-400' : 'text-gray-500'}`}>프리셋을 누르면 바로 시작해요</p>
      <Controls clock={clock} onStart={clock.start} />
    </Card>
  );
}

function Stepper({ label, value, onChange, min, step, suffix, lm }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${lm ? 'text-slate-600' : 'text-gray-300'}`}>{label}</span>
      <div className="flex items-center">
        <IconButton icon={Minus} label={`${label} 줄이기`} onClick={() => onChange(Math.max(min, value - step))} />
        <span className={`w-16 text-center text-sm font-bold tabular-nums ${lm ? 'text-slate-800' : 'text-white'}`}>{value}{suffix}</span>
        <IconButton icon={Plus} label={`${label} 늘리기`} onClick={() => onChange(value + step)} />
      </div>
    </div>
  );
}

function Interval({ lm }) {
  const clock = useWorkoutClock('interval', { cfg: { work: 20, rest: 10, rounds: 8 } });
  const cfg = { prep: PREP_SEC, ...clock.cfg };
  const state = intervalState(clock.elapsedMs, cfg);
  const sec = Math.ceil(state.remainingMs / 1000);
  const last = useRef({ phase: null, round: null, sec: null });

  // 단계 전환·마지막 3초·종료 알림(실행 중일 때만)
  useEffect(() => {
    const prev = last.current;
    last.current = { phase: state.phase, round: state.round, sec };
    if (!clock.running) return;
    if (state.finished) {
      beep({ long: true, times: 3 });
      clock.reset();
    } else if (prev.phase === null) {
      return; // 다른 화면에서 돌아온 직후에는 알리지 않음
    } else if (prev.phase !== state.phase || prev.round !== state.round) {
      beep({ long: true });
    } else if (sec !== prev.sec && sec <= 3 && sec > 0) {
      beep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.round, sec, state.finished]);

  const idle = !clock.running && clock.elapsedMs === 0;
  const phase = PHASE[idle ? 'prep' : state.phase];
  const setCfg = (patch) => clock.reset({ cfg: { ...clock.cfg, ...patch } });

  return (
    <Card className="space-y-4">
      <div className={`rounded-2xl py-6 text-center ${lm ? phase.light : phase.dark}`}>
        <p className="text-sm font-bold">{idle ? '대기' : phase.label}</p>
        <p className="text-6xl font-black tabular-nums my-1">
          {formatDuration(idle ? cfg.work : sec)}
        </p>
        <p className="text-xs font-semibold">
          라운드 {idle ? 1 : state.round} / {cfg.rounds} · 총 {formatDuration(intervalTotalMs(cfg) / 1000)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTERVAL_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setCfg({ work: p.work, rest: p.rest, rounds: p.rounds })}
            className={`px-3 py-1.5 min-h-9 rounded-full text-xs font-medium border ${lm ? 'border-slate-200 text-slate-600' : 'border-gray-700 text-gray-300'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div>
        <Stepper label="운동" value={cfg.work} onChange={(v) => setCfg({ work: v })} min={5} step={5} suffix="초" lm={lm} />
        <Stepper label="휴식" value={cfg.rest} onChange={(v) => setCfg({ rest: v })} min={0} step={5} suffix="초" lm={lm} />
        <Stepper label="라운드" value={cfg.rounds} onChange={(v) => setCfg({ rounds: v })} min={1} step={1} suffix="회" lm={lm} />
      </div>
      <Controls clock={clock} onStart={clock.start} />
    </Card>
  );
}

export function WorkoutTimers({ lm }) {
  const [mode, setMode] = useState('countdown');
  return (
    <div className="space-y-3">
      <Segmented
        items={[{ id: 'countdown', label: '간편 타이머' }, { id: 'interval', label: '인터벌' }]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'countdown' ? <Countdown lm={lm} /> : <Interval lm={lm} />}
    </div>
  );
}
