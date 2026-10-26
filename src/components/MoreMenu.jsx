'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/MoreMenu.jsx
// 하단 탭바에 올리지 않은 나머지 화면을 모아 보여주는 화면. 기능 타일을 고르면
// 같은 화면 안에서 해당 기능을 렌더링하고, 주 화면(홈/지출 등) 타일은 그 탭으로 이동합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { MealMenu } from './MealMenu';
import { MemoApp } from './MemoApp';
import { WishlistApp } from './WishlistApp';
import { WorkoutApp } from './WorkoutApp';
import { SettingsPanel } from './SettingsPanel';
import { IconButton } from './ui/IconButton';
import { MORE_FEATURES, MAIN_TABS } from './navItems';

export { MORE_FEATURES };

// 하단 탭에 직접 올린 기능은 page.js가 이 목록으로 바로 렌더링합니다.
export const FEATURE_COMPONENTS = {
  meal: MealMenu,
  memo: MemoApp,
  wishlist: WishlistApp,
  workout: WorkoutApp,
  settings: SettingsPanel,
};

// feature/onSelectFeature로 상위(page.js)가 제어합니다 — 홈 대시보드의
// 바로가기 카드에서도 특정 기능을 바로 열 수 있어야 하기 때문입니다.
export function MoreMenu({ feature, onSelectFeature, navTabs = [], onGoTab }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  if (feature) {
    const Feature = FEATURE_COMPONENTS[feature];
    const meta = MORE_FEATURES.find((f) => f.id === feature);
    return (
      <div>
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pt-2 flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="더보기로" onClick={() => onSelectFeature(null)} />
          <h2 className={`text-base font-bold ${lm ? 'text-slate-800' : 'text-white'}`}>{meta?.label}</h2>
        </div>
        {Feature && <Feature />}
      </div>
    );
  }

  // 하단 탭에 이미 있는 화면은 빼고 보여줍니다.
  const hiddenMain = MAIN_TABS.filter((t) => !navTabs.includes(t.id)).map((t) => ({ ...t, main: true }));
  const hiddenFeatures = MORE_FEATURES.filter((f) => !navTabs.includes(f.id));

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="grid grid-cols-3 gap-3">
        {[...hiddenMain, ...hiddenFeatures].map(({ id, label, icon: Icon, main }) => (
          <button
            key={id}
            onClick={() => (main ? onGoTab(id) : onSelectFeature(id))}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
              lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-900 border-gray-800 hover:border-violet-700'
            }`}
          >
            <Icon className={`w-6 h-6 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
            <span className={`text-xs font-medium ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
