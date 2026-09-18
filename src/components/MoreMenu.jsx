'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/MoreMenu.jsx
// 하단 탭바에 자리가 없는 나머지 기능(알림/식사메뉴/메모/위시리스트/습관/설정)을
// 모아 보여주는 화면. 타일을 고르면 같은 화면 안에서 해당 기능을 렌더링합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { Bell, Utensils, StickyNote, ShoppingBag, Flame, Settings, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useReminders } from '@/hooks/useReminders';
import { ReminderCenter } from './ReminderCenter';
import { MealMenu } from './MealMenu';
import { MemoApp } from './MemoApp';
import { WishlistApp } from './WishlistApp';
import { HabitTracker } from './HabitTracker';
import { SettingsPanel } from './SettingsPanel';
import { IconButton } from './ui/IconButton';

// 홈 대시보드의 바로가기 그리드도 이 목록을 함께 사용합니다.
export const MORE_FEATURES = [
  { id: 'reminders', label: '알림', icon: Bell },
  { id: 'meal', label: '식사메뉴', icon: Utensils },
  { id: 'memo', label: '메모', icon: StickyNote },
  { id: 'wishlist', label: '위시리스트', icon: ShoppingBag },
  { id: 'habits', label: '습관', icon: Flame },
  { id: 'settings', label: '설정', icon: Settings },
];

function ReminderFeature() {
  const { reminders, loaded, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  return (
    <ReminderCenter
      reminders={reminders}
      loaded={loaded}
      addReminder={addReminder}
      updateReminder={updateReminder}
      deleteReminder={deleteReminder}
      toggleReminder={toggleReminder}
    />
  );
}

const FEATURE_COMPONENTS = {
  reminders: ReminderFeature,
  meal: MealMenu,
  memo: MemoApp,
  wishlist: WishlistApp,
  habits: HabitTracker,
  settings: SettingsPanel,
};

// feature/onSelectFeature로 상위(page.js)가 제어합니다 — 헤더의 알림 벨이나
// 홈 대시보드의 바로가기 카드에서도 특정 기능을 바로 열 수 있어야 하기 때문입니다.
export function MoreMenu({ feature, onSelectFeature }) {
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

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6">
      <div className="grid grid-cols-3 gap-3">
        {MORE_FEATURES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelectFeature(id)}
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
