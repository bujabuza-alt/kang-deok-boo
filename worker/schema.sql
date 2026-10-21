-- 알림 서버(D1) 스키마. 여러 번 실행해도 안전합니다.
CREATE TABLE IF NOT EXISTS subs (
  id TEXT PRIMARY KEY,          -- 구독 endpoint의 SHA-256
  subscription TEXT NOT NULL    -- PushSubscription JSON
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub_id TEXT NOT NULL,
  at INTEGER NOT NULL,          -- 보낼 시각(epoch ms)
  payload TEXT NOT NULL         -- { title, body, tag } JSON
);
CREATE INDEX IF NOT EXISTS jobs_at ON jobs(at);
CREATE INDEX IF NOT EXISTS jobs_sub ON jobs(sub_id);
