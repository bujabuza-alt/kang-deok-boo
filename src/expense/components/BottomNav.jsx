'use client';
import { Home, Search, CreditCard, BarChart2, Settings } from 'lucide-react';
import { useTheme } from '@/expense/context/ThemeContext';

const TABS = [
  { id: 'home',     Icon: Home,       label: '홈'      },
  { id: 'search',   Icon: Search,     label: '검색'    },
  { id: 'payment',  Icon: CreditCard, label: '결제수단' },
  { id: 'analysis', Icon: BarChart2,  label: '분석'    },
  { id: 'settings', Icon: Settings,   label: '설정'    },
];

export default function BottomNav({ activeTab, onTabChange }) {
  const { theme } = useTheme();
  const lm = theme === 'light';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t ${lm ? 'bg-white/95 border-slate-200' : 'bg-gray-950/95 border-gray-700'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-2.5
              text-[10px] font-bold transition-colors
              ${activeTab === id
                ? lm ? 'text-indigo-600'  : 'text-violet-400'
                : lm ? 'text-slate-400 hover:text-slate-600' : 'text-gray-600 hover:text-gray-400'}
            `}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
