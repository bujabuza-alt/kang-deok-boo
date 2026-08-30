'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Utensils, Wallet, GripVertical, ListTodo } from 'lucide-react';
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

const TOP_SECTIONS = [
  { id: 'todo',    label: '일정',    icon: ListTodo },
  { id: 'meal',    label: '식사메뉴', icon: Utensils },
  { id: 'expense', label: '지출',    icon: Wallet },
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

// ─── 드래그 가능한 탭 아이템 ────────────────────────────────────────────────────
function SortableTab({ section, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const Icon = section.icon;

  const grip = (
    <span
      {...listeners}
      {...attributes}
      className="p-1 cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400 shrink-0"
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
          className="flex items-center gap-1 px-2 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all duration-150 -mb-px"
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
            : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {section.label}
      </button>
    </div>
  );
}

export default function HomePage() {
  const [topSection, setTopSection] = useState('todo');
  const [topSections, setTopSections] = useState(TOP_SECTIONS);

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

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* ─── 헤더 ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600 shrink-0" />
                강덕부
              </h1>
            </div>
          </div>
        </div>

        {/* 상단 분류 탭 (드래그로 순서 변경 가능) */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-col gap-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={topSections.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-0 border-b border-slate-100 overflow-x-auto">
                {topSections.map((section) => (
                  <SortableTab
                    key={section.id}
                    section={section}
                    isActive={topSection === section.id}
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
      </main>
    </div>
  );
}
