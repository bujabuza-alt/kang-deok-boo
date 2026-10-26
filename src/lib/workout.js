// ──────────────────────────────────────────────────────────────────────────────
// lib/workout.js
// '운동' 탭의 순수 계산: 기본 운동 목록, 시간·페이스 표기, 인터벌 타이머 단계,
// 기간별 합계.
//   type: 'reps'(횟수) | 'weight'(횟수+무게) | 'time'(시간) | 'run'(시간+거리)
// ──────────────────────────────────────────────────────────────────────────────

export const EXERCISE_TYPES = [
  { id: 'reps', label: '횟수' },
  { id: 'weight', label: '횟수+무게' },
  { id: 'time', label: '시간' },
  { id: 'run', label: '시간+거리' },
];

export const DEFAULT_EXERCISES = [
  { id: 'pushup', name: '푸쉬업', type: 'reps' },
  { id: 'burpee', name: '버피', type: 'reps' },
  { id: 'squat', name: '스쿼트', type: 'reps' },
  { id: 'dumbbell', name: '덤벨', type: 'weight' },
  { id: 'plank', name: '플랭크', type: 'time' },
  { id: 'running', name: '러닝', type: 'run' },
];

// 초 → 'm:ss' 또는 'h:mm:ss'
export function formatDuration(totalSec) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// 1km당 페이스(5'06")
export function formatPace(durationSec, distanceKm) {
  if (!durationSec || !distanceKm) return null;
  const per = Math.round(durationSec / distanceKm);
  return `${Math.floor(per / 60)}'${String(per % 60).padStart(2, '0')}"`;
}

// 기록 한 줄 표기
export function formatLog(log) {
  if (log.type === 'weight') return `${log.reps}회 × ${log.weight}kg`;
  if (log.type === 'time') return formatDuration(log.durationSec);
  if (log.type === 'run') {
    const pace = formatPace(log.durationSec, log.distanceKm);
    return [formatDuration(log.durationSec), log.distanceKm && `${log.distanceKm}km`, pace && `${pace}/km`].filter(Boolean).join(' · ');
  }
  return `${log.reps}회`;
}

// 인터벌 타이머: 준비(prep) → [운동(work) → 휴식(rest)] × rounds (마지막 라운드 뒤 휴식 없음). 단위는 초.
export function intervalTotalMs({ prep, work, rest, rounds }) {
  return (prep + rounds * work + (rounds - 1) * rest) * 1000;
}

export function intervalState(elapsedMs, { prep, work, rest, rounds }) {
  let t = elapsedMs;
  if (t < prep * 1000) return { phase: 'prep', round: 1, remainingMs: prep * 1000 - t, finished: false };
  t -= prep * 1000;
  const cycle = (work + rest) * 1000;
  if (t >= intervalTotalMs({ prep: 0, work, rest, rounds })) return { phase: 'done', round: rounds, remainingMs: 0, finished: true };
  const round = Math.floor(t / cycle) + 1;
  const within = t - (round - 1) * cycle;
  if (within < work * 1000) return { phase: 'work', round, remainingMs: work * 1000 - within, finished: false };
  return { phase: 'rest', round, remainingMs: cycle - within, finished: false };
}

// fromDate(포함) 이후 기록을 운동별로 합산: [{ exerciseId, name, type, sets, reps, durationSec, distanceKm, maxWeight }]
export function summarize(logs, fromDate) {
  const byId = new Map();
  logs
    .filter((l) => l.date >= fromDate)
    .forEach((l) => {
      const s = byId.get(l.exerciseId) || {
        exerciseId: l.exerciseId, name: l.name, type: l.type, sets: 0, reps: 0, durationSec: 0, distanceKm: 0, maxWeight: 0,
      };
      s.sets += 1;
      s.reps += l.reps || 0;
      s.durationSec += l.durationSec || 0;
      s.distanceKm = Math.round((s.distanceKm + (l.distanceKm || 0)) * 100) / 100;
      s.maxWeight = Math.max(s.maxWeight, l.weight || 0);
      byId.set(l.exerciseId, s);
    });
  return [...byId.values()];
}
