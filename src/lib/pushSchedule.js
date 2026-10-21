// ──────────────────────────────────────────────────────────────────────────────
// lib/pushSchedule.js
// 타임박스 데이터로 앞으로 보낼 푸시 알림 목록을 계산합니다.
// 아이폰은 앱이 예약 알림을 직접 띄울 수 없어서, 이 목록을 알림 서버
// (worker/)에 올려 두면 서버가 시각에 맞춰 Web Push를 보냅니다.
//   ① 칸 시작: 연속된 같은 일은 한 번, blockLead분 전에
//   ② 미완료 반복: 칸이 끝날 때까지 repeatMinutes분마다(완료 체크 시 중단)
//   ③ 정기 체크인: 표시 시간 범위 안에서 checkinMinutes분마다
// ──────────────────────────────────────────────────────────────────────────────
import { slotKeys } from '@/hooks/useTimebox';

// blockLead: null이면 칸 시작 알림 끔, 0이면 정시
export const DEFAULT_NOTIFY = { blockLead: 0, repeatMinutes: 0, checkinMinutes: 0 };
export const SCHEDULE_WINDOW_MS = 36 * 60 * 60 * 1000;
export const MAX_SCHEDULE_ITEMS = 300;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 같은 텍스트가 연속된 칸을 하나로 묶습니다: [{ start, end, text, keys }]
function blockRuns(blocks) {
  const runs = [];
  Object.keys(blocks).sort().forEach((key) => {
    const last = runs[runs.length - 1];
    const [h, m] = key.split(':').map(Number);
    const startMin = h * 60 + m;
    if (last && last.text === blocks[key].text && last.endMin === startMin) {
      last.keys.push(key);
      last.endMin += 30;
    } else {
      runs.push({ text: blocks[key].text, keys: [key], startMin, endMin: startMin + 30 });
    }
  });
  return runs;
}

export function buildSchedule(days, settings, now = Date.now()) {
  const notify = { ...DEFAULT_NOTIFY, ...settings.notify };
  const end = now + SCHEDULE_WINDOW_MS;
  const items = [];
  const add = (at, title, body, tag) => {
    if (at >= now && at < end) items.push({ at, title, body, tag });
  };

  for (let t = new Date(now); toDateStr(t) <= toDateStr(new Date(end)); t.setDate(t.getDate() + 1)) {
    const date = toDateStr(t);
    const day = days[date] || {};
    const blocks = day.blocks || {};
    // 그날 0시 기준 분 → 시각(ms)
    const at = (minOfDay) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, minOfDay).getTime();

    blockRuns(blocks).forEach((run) => {
      const tag = `block-${date}-${run.keys[0]}`;
      if (notify.blockLead !== null && !blocks[run.keys[0]].done) {
        const lead = notify.blockLead ? `${notify.blockLead}분 후 시작` : '지금 시작';
        add(at(run.startMin - notify.blockLead), run.text, `${run.keys[0]} ${lead}`, tag);
      }
      if (notify.repeatMinutes > 0) {
        for (let m = run.startMin + notify.repeatMinutes; m < run.endMin; m += notify.repeatMinutes) {
          const key = run.keys[Math.floor((m - run.startMin) / 30)];
          if (!blocks[key].done) add(at(m), run.text, '아직 완료하지 않았어요', tag);
        }
      }
    });

    if (notify.checkinMinutes > 0) {
      const brainDump = day.brainDump || [];
      const topLeft = (day.top3 || [])
        .map((id) => id && brainDump.find((i) => i.id === id))
        .filter((i) => i && !i.done)
        .map((i) => i.text);
      const keys = slotKeys(settings);
      const startMin = settings.startHour * 60;
      for (let m = startMin; m < settings.endHour * 60; m += notify.checkinMinutes) {
        const key = keys[Math.floor((m - startMin) / 30)];
        const block = blocks[key];
        const body = block && !block.done
          ? `지금: ${block.text}`
          : topLeft.length ? `남은 Top 3: ${topLeft.join(', ')}` : '지금 할 일을 확인해 보세요';
        // 칸 시작 알림과 같은 시각이면 체크인은 생략
        if (!items.some((i) => i.at === at(m))) add(at(m), '체크인', body, 'checkin');
      }
    }
  }

  return items.sort((a, b) => a.at - b.at).slice(0, MAX_SCHEDULE_ITEMS);
}
