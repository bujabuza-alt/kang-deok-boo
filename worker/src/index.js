// ──────────────────────────────────────────────────────────────────────────────
// worker/src/index.js
// 강덕부 알림 서버. 앱이 올려 둔 예약 알림을 1분마다 확인해 시각이 된
// 것을 Web Push로 보냅니다(아이폰은 앱 혼자서 예약 알림을 띄울 수 없음).
//   POST /schedule { subscription, items:[{ at, title, body, tag }] }
//     → 그 기기(구독)의 예약 알림을 통째로 교체. items가 비면 구독도 삭제.
// ──────────────────────────────────────────────────────────────────────────────
import { buildPushPayload } from '@block65/webcrypto-web-push';

const MAX_ITEMS = 300;
// 서버가 잠시 멈췄다 돌아와도 오래 지난 알림은 보내지 않습니다.
const STALE_MS = 10 * 60 * 1000;
// 임의 주소로 요청을 보내는 데 악용되지 않도록 알려진 푸시 서비스만 허용
const PUSH_HOSTS = ['web.push.apple.com', 'fcm.googleapis.com', 'updates.push.services.mozilla.com', '.notify.windows.com'];

function corsHeaders(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  return allowed.includes(origin)
    ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' }
    : {};
}

function isValidSubscription(sub) {
  try {
    const { protocol, hostname } = new URL(sub.endpoint);
    return (
      protocol === 'https:' &&
      PUSH_HOSTS.some((h) => (h.startsWith('.') ? hostname.endsWith(h) : hostname === h)) &&
      typeof sub.keys?.p256dh === 'string' &&
      typeof sub.keys?.auth === 'string'
    );
  } catch {
    return false;
  }
}

async function subId(endpoint) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function saveSchedule({ subscription, items }, env) {
  if (!isValidSubscription(subscription) || !Array.isArray(items) || items.length > MAX_ITEMS) return 400;
  const valid = items.every((i) => Number.isFinite(i.at) && typeof i.title === 'string' && typeof i.body === 'string');
  if (!valid) return 400;

  const id = await subId(subscription.endpoint);
  const statements = [env.DB.prepare('DELETE FROM jobs WHERE sub_id = ?').bind(id)];
  if (items.length === 0) {
    statements.push(env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(id));
  } else {
    statements.push(
      env.DB.prepare('INSERT OR REPLACE INTO subs (id, subscription) VALUES (?, ?)').bind(id, JSON.stringify(subscription))
    );
    items.forEach(({ at, title, body, tag }) => {
      const payload = JSON.stringify({ title: title.slice(0, 200), body: body.slice(0, 500), tag: tag ? String(tag).slice(0, 100) : undefined });
      statements.push(env.DB.prepare('INSERT INTO jobs (sub_id, at, payload) VALUES (?, ?, ?)').bind(id, at, payload));
    });
  }
  await env.DB.batch(statements);
  return 204;
}

async function sendDue(env) {
  const now = Date.now();
  const { results } = await env.DB.prepare(
    'SELECT jobs.id, jobs.sub_id, jobs.at, jobs.payload, subs.subscription FROM jobs JOIN subs ON subs.id = jobs.sub_id WHERE jobs.at <= ? ORDER BY jobs.at LIMIT 200'
  ).bind(now).all();

  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
  const gone = new Set();
  await Promise.all(
    results.map(async (job) => {
      if (job.at < now - STALE_MS || gone.has(job.sub_id)) return;
      try {
        const payload = await buildPushPayload({ data: job.payload, options: { ttl: 600, urgency: 'high' } }, JSON.parse(job.subscription), vapid);
        const res = await fetch(JSON.parse(job.subscription).endpoint, payload);
        // 404/410: 앱 삭제나 알림 해제로 구독이 사라짐
        if (res.status === 404 || res.status === 410) gone.add(job.sub_id);
        else if (!res.ok) console.error('push failed', res.status, await res.text());
      } catch (e) {
        console.error('push error', e);
      }
    })
  );

  const statements = results.map((job) => env.DB.prepare('DELETE FROM jobs WHERE id = ?').bind(job.id));
  gone.forEach((id) => {
    statements.push(env.DB.prepare('DELETE FROM jobs WHERE sub_id = ?').bind(id));
    statements.push(env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(id));
  });
  if (statements.length) await env.DB.batch(statements);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || url.pathname !== '/schedule') return new Response('Not found', { status: 404, headers: cors });
    if (!cors['access-control-allow-origin']) return new Response('Forbidden', { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad request', { status: 400, headers: cors });
    }
    const status = await saveSchedule(body, env);
    return new Response(null, { status, headers: cors });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env));
  },
};
