'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Utensils, Wallet, GripVertical, ListTodo, Bell, StickyNote, Settings } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MealMenu } from '@/components/MealMenu';
import { TodoApp } from '@/components/TodoApp';
import { ReminderCenter } from '@/components/ReminderCenter';
import { MemoApp } from '@/components/MemoApp';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useReminders } from '@/hooks/useReminders';
import { useTheme } from '@/expense/context/ThemeContext';

const TOP_SECTIONS = [
  { id: 'todo',      label: '일정',    icon: ListTodo },
  { id: 'meal',      label: '식사메뉴', icon: Utensils },
  { id: 'expense',   label: '지출',    icon: Wallet },
  { id: 'reminders', label: '알림',    icon: Bell },
  { id: 'memo',      label: '메모',    icon: StickyNote },
  { id: 'settings',  label: '설정',    icon: Settings },
];

// 상단 탭 순서를 기기에 저장해 다음 방문 시에도 동일한 순서로 보여주기 위한 키.
const SECTION_ORDER_KEY = 'kang-deok-boo-section-order';

// 저장된 순서(id 배열)를 기준으로 TOP_SECTIONS를 재배열합니다.
// 새 탭이 추가된 경우를 대비해, 저장된 목록에 없는 항목은 뒤에 그대로 붙입니다.
function loadSectionOrder() {
  try {
    const stored = localStorage.getItem(SECTION_ORDER_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        const ordered = ids.map((id) => TOP_SECTIONS.find((s) => s.id === id)).filter(Boolean);
        const missing = TOP_SECTIONS.filter((s) => !ids.includes(s.id));
        return [...ordered, ...missing];
      }
    }
  } catch (e) {
    console.error('탭 순서 불러오기 실패:', e);
  }
  return TOP_SECTIONS;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── 드래그 가능한 탭 아이템 ────────────────────────────────────────────────────
function SortableTab({ section, isActive, lm, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const Icon = section.icon;

  const grip = (
    <span
      {...listeners}
      {...attributes}
      className={`p-1 cursor-grab active:cursor-grabbing touch-none shrink-0 ${lm ? 'text-slate-300 hover:text-slate-400' : 'text-gray-700 hover:text-gray-500'}`}
      aria-label="탭 순서 변경"
    >
      <GripVertical className="w-3 h-3" />
    </span>
  );

  if (section.id === 'expense') {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center">
        {grip}
        <Link
          href="/expense"
          className={`flex items-center gap-1 px-2 py-2 text-sm font-semibold border-b-2 border-transparent transition-all duration-150 -mb-px ${lm ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {section.label}
        </Link>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {grip}
      <button
        onClick={onClick}
        className={`flex items-center gap-1 px-2 py-2 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px ${
          isActive
            ? 'border-indigo-600 text-indigo-600'
            : lm ? 'border-transparent text-slate-500 hover:text-slate-700' : 'border-transparent text-gray-400 hover:text-gray-200'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {section.label}
      </button>
    </div>
  );
}

export default function HomePage() {
  const { theme } = useTheme();
  const lm = theme === 'light';

  const [topSection, setTopSection] = useState('todo');
  const [topSections, setTopSections] = useState(TOP_SECTIONS);
  const { reminders, loaded: remindersLoaded, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();

  // 최초 마운트 시 저장된 탭 순서를 불러옵니다 (localStorage는 클라이언트에서만 접근 가능).
  useEffect(() => {
    setTopSections(loadSectionOrder());
  }, []);

  const persistSectionOrder = useCallback((sections) => {
    try {
      localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(sections.map((s) => s.id)));
    } catch (e) {
      console.error('탭 순서 저장 실패:', e);
    }
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleSectionDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setTopSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        persistSectionOrder(next);
        return next;
      });
    }
  };

  // 헤더 알림 배지: 오늘 마감이거나 지난, 아직 완료하지 않은 독립 리마인더 개수.
  const dueReminderCount = useMemo(() => {
    if (!remindersLoaded) return 0;
    const today = todayStr();
    return reminders.filter((r) => !r.done && r.datetime && r.datetime.slice(0, 10) <= today).length;
  }, [reminders, remindersLoaded]);

  return (
    <div className={`min-h-dvh flex flex-col ${lm ? 'bg-slate-50' : 'bg-gray-950'}`}>
      {/* ─── 헤더 ─────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 backdrop-blur border-b ${lm ? 'bg-white/90 border-slate-100' : 'bg-gray-950/90 border-gray-800'}`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h1 className={`text-xl font-bold flex items-center gap-2 ${lm ? 'text-slate-900' : 'text-white'}`}>
                <BookOpen className="w-6 h-6 text-indigo-600 shrink-0" />
                강덕부
              </h1>
            </div>
            <button
              onClick={() => setTopSection('reminders')}
              aria-label="알림"
              className={`relative p-2 rounded-xl border transition-colors shrink-0 ${lm ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600' : 'border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-violet-400'}`}
            >
              <Bell className="w-4 h-4" />
              {dueReminderCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {dueReminderCount > 9 ? '9+' : dueReminderCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 상단 분류 탭 (드래그로 순서 변경 가능) */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-col gap-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={topSections.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
              <div className={`flex gap-0 border-b overflow-x-auto ${lm ? 'border-slate-100' : 'border-gray-800'}`}>
                {topSections.map((section) => (
                  <SortableTab
                    key={section.id}
                    section={section}
                    isActive={topSection === section.id}
                    lm={lm}
                    onClick={() => setTopSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </header>

      {/* ─── 메인 콘텐츠 ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full">
        {topSection === 'meal' && <MealMenu />}

        {topSection === 'todo' && <TodoApp />}

        {topSection === 'reminders' && (
          <ReminderCenter
            reminders={reminders}
            loaded={remindersLoaded}
            addReminder={addReminder}
            updateReminder={updateReminder}
            deleteReminder={deleteReminder}
            toggleReminder={toggleReminder}
          />
        )}

        {topSection === 'memo' && <MemoApp />}

        {topSection === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
