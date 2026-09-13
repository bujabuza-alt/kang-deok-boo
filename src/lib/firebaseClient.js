// ──────────────────────────────────────────────────────────────────────────────
// lib/firebaseClient.js
// Firebase 앱 + Firestore(lite) 초기화. 환경변수가 설정되지 않은 경우
// (관리자가 아직 동기화 백엔드를 구성하지 않은 경우) null을 반환해
// 앱이 동기화 없이 로컬 전용으로 정상 동작하도록 합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isSyncConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let dbInstance = null;

export function getDb() {
  if (!isSyncConfigured) return null;
  if (dbInstance) return dbInstance;
  try {
    const app = getApps()[0] || initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (e) {
    console.error('Firebase 초기화 실패:', e);
    return null;
  }
}
