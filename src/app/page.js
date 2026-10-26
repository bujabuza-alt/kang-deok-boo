'use client';
import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import ExpenseApp from '@/expense/ExpenseApp';
import { HomeDashboard } from '@/components/HomeDashboard';
import { MoreMenu, FEATURE_COMPONENTS } from '@/components/MoreMenu';
import { BottomNav } from '@/components/BottomNav';
import { TimeboxPlanner } from '@/components/TimeboxPlanner';
import { PushScheduler } from '@/components/PushScheduler';
import { useNavTabs } from '@/hooks/useNavTabs';
import { useTheme } from '@/context/ThemeContext';

export default function HomePage() {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [activeTab, setActiveTab] = useState('home');
  const [moreFeature, setMoreFeature] = useState(null);

  const { navTabs } = useNavTabs();

  // 하단 탭에 올라가 있는 기능이면 그 탭으로, 아니면 '더보기' 안에서 엽니다.
  const openMoreFeature = (feature) => {
    if (navTabs.includes(feature)) {
      setActiveTab(feature);
      setMoreFeature(null);
      return;
    }
    setActiveTab('more');
    setMoreFeature(feature);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'more') setMoreFeature(null);
  };

  // 하단 탭에 직접 올린 기능(메모·운동 등)
  const DirectFeature = FEATURE_COMPONENTS[activeTab];

  return (
    <div className={`min-h-dvh flex flex-col ${lm ? 'bg-slate-50' : 'bg-gray-950'}`}>
      {/* ─── 헤더 ─────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 backdrop-blur border-b ${lm ? 'bg-white/90 border-slate-100' : 'bg-gray-950/90 border-gray-800'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-xl font-bold flex items-center gap-2 min-w-0 ${lm ? 'text-slate-900' : 'text-white'}`}>
            <BookOpen className="w-6 h-6 text-indigo-600 shrink-0" />
            강덕부
          </h1>
        </div>
      </header>

      {/* ─── 메인 콘텐츠 ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full" style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'home' && (
          <HomeDashboard
            onGoExpense={() => handleTabChange('expense')}
            onOpenMore={openMoreFeature}
            onGoTimebox={() => handleTabChange('timebox')}
          />
        )}

        {activeTab === 'expense' && <ExpenseApp />}

        {activeTab === 'timebox' && <TimeboxPlanner />}

        {DirectFeature && <DirectFeature />}

        {activeTab === 'more' && (
          <MoreMenu feature={moreFeature} onSelectFeature={setMoreFeature} navTabs={navTabs} onGoTab={handleTabChange} />
        )}
      </main>

      <BottomNav tabs={navTabs} activeTab={activeTab} onTabChange={handleTabChange} />
      {/* 타임박스 알림 일정을 알림 서버에 올림(화면 없음) */}
      <PushScheduler />
    </div>
  );
}
