// ──────────────────────────────────────────────────────────────────────────────
// expense/receipts.js
// 영수증 이미지 저장소. 이미지는 압축한 JPEG dataURL로 localStorage에 두고
// 기존 동기화(Firestore)로 기기 간 공유합니다.
//
// 용량 제약 때문에 두 가지를 지킵니다.
// - localStorage(오리진 전체 약 5MB): 장당 dataURL을 MAX_IMAGE_CHARS 이하로
//   압축해 100장이 약 3.5MB 안에 들어가게 합니다.
// - Firestore 문서(키 1개) 1MB 한도: 한 키에 모두 넣지 않고 고정된 5개
//   키(키당 최대 20장)로 나눠 저장합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { pushKey } from '@/lib/sync';
import { ls } from './utils';

export const RECEIPT_KEYS = ['et_receipts_0', 'et_receipts_1', 'et_receipts_2', 'et_receipts_3', 'et_receipts_4'];
export const PER_SHARD    = 20;
export const MAX_RECEIPTS = RECEIPT_KEYS.length * PER_SHARD;

const MAX_IMAGE_CHARS = 35000;
const MAX_EDGE        = 1000;

// { [key]: receipt[] }
export const loadShards = () =>
  Object.fromEntries(RECEIPT_KEYS.map(k => [k, ls.get(k, [])]));

// ls.set과 달리 저장 실패(용량 초과)를 호출자에게 알립니다.
export function saveShard(key, list) {
  const json = JSON.stringify(list);
  localStorage.setItem(key, json);
  pushKey(key, json);
}

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다')); };
  img.src = url;
});

// 긴 변을 MAX_EDGE 이하로 줄이고 흑백으로 바꾼 뒤, dataURL이
// MAX_IMAGE_CHARS 이하가 될 때까지 품질 → 크기 순으로 낮춥니다.
export async function compressImage(file) {
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));

  for (;;) {
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = y;
    }
    ctx.putImageData(data, 0, 0);

    for (let q = 0.7; q >= 0.3; q -= 0.1) {
      const url = canvas.toDataURL('image/jpeg', q);
      if (url.length <= MAX_IMAGE_CHARS) return url;
    }
    scale *= 0.85;
  }
}
