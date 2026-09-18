'use client';
// ──────────────────────────────────────────────────────────────────────────────
// expense/components/ExpenseSubNav.jsx
// 지출 화면 내부의 2차 네비게이션(홈/검색/결제수단/분석). 전역 하단 탭바가
// 화면 간 이동을 담당하게 되면서, 기존의 전용 하단 탭바+헤더 대신
// 콘텐츠 상단의 세그먼트 컨트롤로 대체합니다. 설정은 전역 설정 화면으로
// 이동했으므로 여기엔 포함하지 않습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { Home, Search, CreditCard, BarChart2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const TABS = [
  { id: 'home', Icon: Home, label: '홈' },
  { id: 'search', Icon: Search, label: '검색' },
  { id: 'payment', Icon: CreditCard, label: '결제수단' },
  { id: 'analysis', Icon: BarChart2, label: '분석' },
];

export default function ExpenseSubNav({ activeTab, onTabChange }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <div className={`flex gap-1 p-1 rounded-xl mb-4 ${lm ? 'bg-slate-100' : 'bg-gray-900'}`}>
      {TABS.map(({ id, Icon, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-11 rounded-lg text-sm font-semibold transition-colors ${
              active
                ? lm ? 'bg-white text-indigo-600 shadow-sm' : 'bg-gray-800 text-violet-400 shadow-sm'
                : lm ? 'text-slate-500 hover:text-slate-700' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
