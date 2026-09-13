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
// 온라인일 때만 Firestore로 값을 올리고(push) 내려받습니다(pull).
// 충돌 시에는 updatedAt이 더 최신인 쪽이 이깁니다("마지막 저장이 우선").
// ──────────────────────────────────────────────────────────────────────────────
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { getDb, isSyncConfigured } from '@/lib/firebaseClient';
import { SYNC_KEYS } from '@/lib/syncKeys';

const CODE_KEY = 'kang-deok-boo-sync-code';
const META_KEY = 'kang-deok-boo-sync-meta';

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

// ── 개별 키 push/pull ────────────────────────────────────────────────────────
export async function pushKey(key, rawValue, { updatedAt } = {}) {
  const code = getSyncCode();
  const db = getDb();
  if (!code || !db) return false;
  const iso = updatedAt || new Date().toISOString();
  try {
    await setDoc(doc(db, 'syncs', code, 'keys', key), { value: rawValue, updatedAt: iso });
    setMetaFor(key, iso);
    return true;
  } catch (e) {
    console.warn(`동기화 업로드 실패 (${key}):`, e);
    return false;
  }
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

// 클라우드의 모든 키를 가져와, 클라우드가 더 최신이면 로컬을 덮어씁니다.
// 반환값: { ok, pulledKeys, failed }
export async function pullAll() {
  const code = getSyncCode();
  const db = getDb();
  if (!code || !db) return { ok: false, pulledKeys: [], failed: false };

  const meta = getMeta();
  const pulledKeys = [];
  let anyFailure = false;

  await Promise.all(
    SYNC_KEYS.map(async ({ key }) => {
      try {
        const snap = await getDoc(doc(db, 'syncs', code, 'keys', key));
        if (!snap.exists()) return;
        const { value, updatedAt } = snap.data();
        const localUpdatedAt = meta[key];
        if (!localUpdatedAt || (updatedAt && updatedAt > localUpdatedAt)) {
          localStorage.setItem(key, value);
          setMetaFor(key, updatedAt);
          pulledKeys.push(key);
        }
      } catch (e) {
        anyFailure = true;
        console.warn(`동기화 다운로드 실패 (${key}):`, e);
      }
    })
  );

  return { ok: !anyFailure, pulledKeys, failed: anyFailure };
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
