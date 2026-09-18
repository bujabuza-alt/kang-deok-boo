// ──────────────────────────────────────────────────────────────────────────────
// lib/categories.js
// 색상 프리셋(COLOR_PRESETS) 제공. Todo 카테고리 색상 선택 등에서 사용됩니다.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 색상 프리셋 목록.
 * 새 장르를 만들거나 기존 장르의 색상을 변경할 때 사용합니다.
 * Tailwind CSS 클래스는 정적으로 존재해야 하므로 이 파일에서 모두 선언합니다.
 */
export const COLOR_PRESETS = [
  {
    color: 'purple',
    bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200',
    dot: 'bg-purple-500', activeBg: 'bg-purple-600', activeText: 'text-white',
    activeBorder: 'border-purple-700', hoverBg: 'hover:bg-purple-50',
    hoverBorder: 'hover:border-purple-300', chartColor: '#9333ea',
  },
  {
    color: 'rose',
    bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200',
    dot: 'bg-rose-500', activeBg: 'bg-rose-600', activeText: 'text-white',
    activeBorder: 'border-rose-700', hoverBg: 'hover:bg-rose-50',
    hoverBorder: 'hover:border-rose-300', chartColor: '#e11d48',
  },
  {
    color: 'orange',
    bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200',
    dot: 'bg-orange-500', activeBg: 'bg-orange-500', activeText: 'text-white',
    activeBorder: 'border-orange-600', hoverBg: 'hover:bg-orange-50',
    hoverBorder: 'hover:border-orange-300', chartColor: '#ea580c',
  },
  {
    color: 'emerald',
    bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200',
    dot: 'bg-emerald-500', activeBg: 'bg-emerald-600', activeText: 'text-white',
    activeBorder: 'border-emerald-700', hoverBg: 'hover:bg-emerald-50',
    hoverBorder: 'hover:border-emerald-300', chartColor: '#059669',
  },
  {
    color: 'blue',
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    dot: 'bg-blue-500', activeBg: 'bg-blue-600', activeText: 'text-white',
    activeBorder: 'border-blue-700', hoverBg: 'hover:bg-blue-50',
    hoverBorder: 'hover:border-blue-300', chartColor: '#2563eb',
  },
  {
    color: 'pink',
    bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200',
    dot: 'bg-pink-500', activeBg: 'bg-pink-600', activeText: 'text-white',
    activeBorder: 'border-pink-700', hoverBg: 'hover:bg-pink-50',
    hoverBorder: 'hover:border-pink-300', chartColor: '#db2777',
  },
  {
    color: 'teal',
    bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200',
    dot: 'bg-teal-500', activeBg: 'bg-teal-600', activeText: 'text-white',
    activeBorder: 'border-teal-700', hoverBg: 'hover:bg-teal-50',
    hoverBorder: 'hover:border-teal-300', chartColor: '#0d9488',
  },
  {
    color: 'slate',
    bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200',
    dot: 'bg-slate-500', activeBg: 'bg-slate-700', activeText: 'text-white',
    activeBorder: 'border-slate-800', hoverBg: 'hover:bg-slate-100',
    hoverBorder: 'hover:border-slate-400', chartColor: '#475569',
  },
  {
    color: 'indigo',
    bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200',
    dot: 'bg-indigo-500', activeBg: 'bg-indigo-600', activeText: 'text-white',
    activeBorder: 'border-indigo-700', hoverBg: 'hover:bg-indigo-50',
    hoverBorder: 'hover:border-indigo-300', chartColor: '#4f46e5',
  },
  {
    color: 'yellow',
    bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200',
    dot: 'bg-yellow-500', activeBg: 'bg-yellow-500', activeText: 'text-white',
    activeBorder: 'border-yellow-600', hoverBg: 'hover:bg-yellow-50',
    hoverBorder: 'hover:border-yellow-300', chartColor: '#ca8a04',
  },
  {
    color: 'cyan',
    bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200',
    dot: 'bg-cyan-500', activeBg: 'bg-cyan-600', activeText: 'text-white',
    activeBorder: 'border-cyan-700', hoverBg: 'hover:bg-cyan-50',
    hoverBorder: 'hover:border-cyan-300', chartColor: '#0891b2',
  },
  {
    color: 'lime',
    bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200',
    dot: 'bg-lime-500', activeBg: 'bg-lime-600', activeText: 'text-white',
    activeBorder: 'border-lime-700', hoverBg: 'hover:bg-lime-50',
    hoverBorder: 'hover:border-lime-300', chartColor: '#65a30d',
  },
];
