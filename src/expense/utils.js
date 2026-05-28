const _toDateStr = (d) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const toDateStr = _toDateStr;

export const TODAY = _toDateStr(new Date());

export const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);

export const compact = (n) => {
  if (n >= 10000) {
    const wan = n / 10000;
    return `${n % 10000 === 0 ? wan : wan.toFixed(1)}만`;
  }
  return fmt(n);
};

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const addMonths = (dateStr, months) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const rawMonth  = m - 1 + months;
  const targetYear = y + Math.floor(rawMonth / 12);
  const targetMo   = rawMonth % 12;
  const lastDay    = new Date(targetYear, targetMo + 1, 0).getDate();
  const day        = Math.min(d, lastDay);
  return `${targetYear}-${String(targetMo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const exportJSON = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const ls = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* 무시 */ }
  },
};
