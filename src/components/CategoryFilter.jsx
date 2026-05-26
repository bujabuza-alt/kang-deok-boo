'use client';
import { LayoutList } from 'lucide-react';
import { useGenres } from '@/hooks/useGenres';

export function CategoryFilter({ selected, onSelect, counts }) {
  const { genres } = useGenres();
  const tabs = [{ id: 'all', label: '전체', emoji: null }, ...genres];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((genre) => {
        // 전체 탭이면 모든 카운트의 합, 아니면 해당 장르 카운트
        const count =
          genre.id === 'all'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[genre.id] || 0;
        const active = selected === genre.id;

        return (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              active
                ? 'bg-indigo-600 text-white shadow-md scale-[1.04]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 hover:scale-[1.02]'
            }`}
          >
            {genre.id === 'all' ? (
              <LayoutList className="w-3.5 h-3.5" />
            ) : (
              <span>{genre.emoji}</span>
            )}
            {genre.label}
            {/* 노트 개수 뱃지: 0보다 클 때만 표시 */}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  active ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
