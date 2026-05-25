// ─────────────────────────────────────────────────────────────────────────────
// Service Worker – 캐시 무효화 전략
//
// BUILD_ID_PLACEHOLDER는 GitHub Actions 배포 시 sed로 실제 빌드 ID(SHA+타임스탬프)로
// 교체됩니다. 매 배포마다 CACHE_NAME이 바뀌어 → 구버전 캐시 자동 삭제.
// ─────────────────────────────────────────────────────────────────────────────
const BUILD_ID = 'BUILD_ID_PLACEHOLDER';
const CACHE_NAME = `kang-deok-boo-${BUILD_ID}`;

// HTML 탐색 요청은 프리캐시하지 않음 (Network-First로 항상 최신 버전 보장)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ── install: 정적 에셋 프리캐시 + 즉시 활성화 대기 ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting(); // 대기 없이 즉시 활성화
});

// ── activate: 구버전 캐시 전부 삭제 + 모든 탭 즉시 제어 ──────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // 새 SW가 즉시 모든 탭 제어권 획득
  );
});

// ── fetch: 요청 유형별 캐싱 전략 ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const { request } = event;
  const url = new URL(request.url);

  // ① HTML 탐색 요청 → Network-First: 항상 최신 HTML을 우선 시도
  //    오프라인이면 캐시 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ② Next.js 빌드 산출물(_next/static/) → Cache-First: 파일명에 해시 포함
  //    → 내용이 바뀌면 URL 자체가 달라지므로 영구 캐시 안전
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // ③ 기타(아이콘, 매니페스트 등) → Network-First + Cache 폴백
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque')
          return response;
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── message: 페이지로부터 제어 메시지 수신 ───────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_BUILD_ID') {
    event.source?.postMessage({ type: 'BUILD_ID', buildId: BUILD_ID });
  }
});
