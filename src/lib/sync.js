// ──────────────────────────────────────────────────────────────────────────────
// lib/sync.js
// 기기 간 데이터 동기화 엔진.
//
// 로그인 없이, 모든 기기에서 동일한 "동기화 코드"를 입력하면 같은 Firestore
// 문서(syncs/{code}/keys/{key})를 공유하는 방식입니다. 코드를 아는 사람은
// 누구나 해당 데이터를 읽고 쓸 수 있으므로(별도 로그인이 없어 서버에서
// 사용자를 구분할 수 없음), 코드는 짧은 PIN이 아니라 추측하기 어려운
// 긴 랜덤 문자열로 생성합니다. 개인 기기 간 공유 용도로만 사용하세요.
//
// 각 키는 로컬(localStorage)에 즉시 저장되어 오프라인에서도 항상 동작하며,
// 온라인일 때는 Firestore 실시간 리스너(onSnapshot)로 다른 기기의 변경을
// 즉시 받아옵니다. 충돌 시에는 updatedAt이 더 최신인 쪽이 이깁니다
// ("마지막 저장이 우선"). 원격에서 받은 값을 그대로 다시 push하는 걸
// 막기 위해, 마지막으로 동기화된 값을 메모리에 기억해 두고 동일하면
// 업로드를 건너뜁니다(그렇지 않으면 두 기기가 서로 계속 재전송하는
// 핑퐁이 발생할 수 있음).
// ──────────────────────────────────────────────────────────────────────────────
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getDb, isSyncConfigured } from '@/lib/firebaseClient';
import { SYNC_KEYS } from '@/lib/syncKeys';

const CODE_KEY = 'kang-deok-boo-sync-code';
const META_KEY = 'kang-deok-boo-sync-meta';

// 원격에서 온 값이 로컬에 반영되면 이 이벤트가 window에 발생합니다.
// (각 데이터 훅은 이 이벤트를 구독해 화면을 즉시 갱신합니다.)
export const SYNC_EVENT = 'kdb-sync-update';

export { isSyncConfigured };

// ── 동기화 코드 관리 ────────────────────────────────────────────────────────
export function getSyncCode() {
  try {
    return localStorage.getItem(CODE_KEY) || null;
  } catch {
    return null;
  }
}

export function setSyncCode(code) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch (e) {
    console.error('동기화 코드 저장 실패:', e);
  }
}

export function clearSyncCode() {
  try {
    localStorage.removeItem(CODE_KEY);
  } catch (e) {
    console.error('동기화 코드 삭제 실패:', e);
  }
}

// 추측하기 어려운 20자리 랜덤 코드(4자리 x 5그룹)를 생성합니다.
export function generateSyncCode() {
  const bytes = new Uint8Array(15);
  (globalThis.crypto || window.crypto).getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => b.toString(36)).join('').toUpperCase();
  const clean = chars.replace(/[^A-Z0-9]/g, '').slice(0, 20).padEnd(20, '0');
  return clean.match(/.{1,4}/g).join('-');
}

// 사용자가 직접 입력/붙여넣기한 코드를 생성 시 형식(4자리 x 5그룹)으로
// 통일합니다. 대소문자·공백·구분자 차이를 무시하기 위함입니다.
export function normalizeCode(input) {
  const clean = String(input || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean) return '';
  return clean.match(/.{1,4}/g).join('-');
}

// ── 로컬 동기화 메타(키별 마지막 저장 시각) ─────────────────────────────────
function getMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setMetaFor(key, updatedAt) {
  try {
    const meta = getMeta();
    meta[key] = updatedAt;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('동기화 메타 저장 실패:', e);
  }
}

function notifyKeyUpdated(key) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
}

// 이 세션에서 마지막으로 Firestore와 일치한다고 확인된 값(키별). 원격에서
// 받은 값을 화면에 반영했을 때도 채워 넣어서, 그 값이 그대로 다시
// push되는 걸(핑퐁) 막는 용도입니다. 페이지를 새로고침하면 비워집니다.
const lastSyncedValue = {};

// ── 개별 키 push/pull ────────────────────────────────────────────────────────
export async function pushKey(key, rawValue, { updatedAt } = {}) {
  const code = getSyncCode();
  const db = getDb();
  if (!code || !db) return false;
  if (lastSyncedValue[key] === rawValue) return true; // 변경 없음 → 업로드 생략
  const iso = updatedAt || new Date().toISOString();
  try {
    await setDoc(doc(db, 'syncs', code, 'keys', key), { value: rawValue, updatedAt: iso });
    setMetaFor(key, iso);
    lastSyncedValue[key] = rawValue;
    return true;
  } catch (e) {
    console.warn(`동기화 업로드 실패 (${key}):`, e);
    return false;
  }
}

// 원격(클라우드)에서 받은 값이 로컬보다 최신이면 로컬에 반영합니다.
// 반영했으면 true를 반환합니다.
function applyRemoteValue(key, value, updatedAt) {
  const meta = getMeta();
  const localUpdatedAt = meta[key];
  if (localUpdatedAt && updatedAt && updatedAt <= localUpdatedAt) return false;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`동기화 값 저장 실패 (${key}):`, e);
    return false;
  }
  setMetaFor(key, updatedAt);
  lastSyncedValue[key] = value;
  notifyKeyUpdated(key);
  return true;
}

// 로컬에 저장된 값을 그대로(문자열) 클라우드로 올립니다. 새 동기화 코드를
// 만들 때, 현재 기기의 데이터를 시작점으로 삼기 위해 사용합니다.
export async function pushAllLocal() {
  const now = new Date().toISOString();
  const results = await Promise.all(
    SYNC_KEYS.map(({ key }) => {
      let raw;
      try {
        raw = localStorage.getItem(key);
      } catch {
        raw = null;
      }
      if (raw === null) return Promise.resolve(true);
      return pushKey(key, raw, { updatedAt: now });
    })
  );
  return results.every(Boolean);
}

// 클라우드의 모든 키를 한 번 가져와, 클라우드가 더 최신이면 로컬을
// 덮어씁니다(앱 시작 시 1회 호출). 반환값: { ok, pulledKeys, failed }
export async function pullAll() {
  const code = getSyncCode();
  const db = getDb();
  if (!code || !db) return { ok: false, pulledKeys: [], failed: false };

  const pulledKeys = [];
  let anyFailure = false;

  await Promise.all(
    SYNC_KEYS.map(async ({ key }) => {
      try {
        const snap = await getDoc(doc(db, 'syncs', code, 'keys', key));
        if (!snap.exists()) return;
        const { value, updatedAt } = snap.data();
        if (applyRemoteValue(key, value, updatedAt)) pulledKeys.push(key);
      } catch (e) {
        anyFailure = true;
        console.warn(`동기화 다운로드 실패 (${key}):`, e);
      }
    })
  );

  return { ok: !anyFailure, pulledKeys, failed: anyFailure };
}

// 모든 동기화 키에 실시간 리스너를 붙입니다. 다른 기기가 값을 바꾸면
// 몇 초 내로 로컬에 반영되고 SYNC_EVENT가 발생합니다. 앱이 켜져 있는
// 동안 계속 유지하고, 반환된 함수를 호출하면 구독을 해제합니다.
export function subscribeAll() {
  const code = getSyncCode();
  const db = getDb();
  if (!code || !db) return () => {};

  const unsubs = SYNC_KEYS.map(({ key }) =>
    onSnapshot(
      doc(db, 'syncs', code, 'keys', key),
      (snap) => {
        if (!snap.exists()) return;
        const { value, updatedAt } = snap.data();
        applyRemoteValue(key, value, updatedAt);
      },
      (e) => console.warn(`실시간 동기화 수신 실패 (${key}):`, e)
    )
  );

  return () => unsubs.forEach((unsub) => unsub());
}

// 다른 기기의 코드를 입력해 연결할 때 사용합니다. 코드를 저장하고 즉시
// 클라우드 데이터를 내려받습니다(클라우드가 더 최신인 키만 덮어씀).
export async function connectWithCode(code) {
  setSyncCode(code);
  // 새로 연결하는 기기이므로 로컬 메타를 비워, 클라우드에 값이 있다면
  // 무조건 우선 적용되도록 합니다.
  try {
    localStorage.removeItem(META_KEY);
  } catch { /* 무시 */ }
  return pullAll();
}
