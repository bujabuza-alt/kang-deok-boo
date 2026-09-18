'use client';
import { useMemo, useState } from 'react';
import { BookOpen, Bell } from 'lucide-react';
import { TodoApp } from '@/components/TodoApp';
import ExpenseApp from '@/expense/ExpenseApp';
import { HomeDashboard } from '@/components/HomeDashboard';
import { MoreMenu } from '@/components/MoreMenu';
import { BottomNav } from '@/components/BottomNav';
import { useReminders } from '@/hooks/useReminders';
import { useTheme } from '@/context/ThemeContext';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomePage() {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [activeTab, setActiveTab] = useState('home');
  const [moreFeature, setMoreFeature] = useState(null);

  const { reminders, loaded: remindersLoaded } = useReminders();

  // 헤더 알림 배지: 오늘 마감이거나 지난, 아직 완료하지 않은 독립 리마인더 개수.
  const dueReminderCount = useMemo(() => {
    if (!remindersLoaded) return 0;
    const today = todayStr();
    return reminders.filter((r) => !r.done && r.datetime && r.datetime.slice(0, 10) <= today).length;
  }, [reminders, remindersLoaded]);

  const openMoreFeature = (feature) => {
    setActiveTab('more');
    setMoreFeature(feature);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'more') setMoreFeature(null);
  };

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
          <button
            onClick={() => openMoreFeature('reminders')}
            aria-label="알림"
            className={`relative flex items-center justify-center min-w-11 min-h-11 rounded-xl border transition-colors shrink-0 ${
              lm ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600' : 'border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-violet-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            {dueReminderCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {dueReminderCount > 9 ? '9+' : dueReminderCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── 메인 콘텐츠 ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full" style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'home' && (
          <HomeDashboard
            onGoTodo={() => handleTabChange('todo')}
            onGoExpense={() => handleTabChange('expense')}
            onOpenMore={openMoreFeature}
          />
        )}

        {activeTab === 'todo' && <TodoApp />}

        {activeTab === 'expense' && <ExpenseApp />}

        {activeTab === 'more' && <MoreMenu feature={moreFeature} onSelectFeature={setMoreFeature} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
