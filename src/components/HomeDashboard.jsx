'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/HomeDashboard.jsx
// '홈' 탭. 오늘의 할일/다가오는 알림/이번달 지출/오늘의 타임박스를 한눈에 보여주고,
// 하단 탭바에 없는 나머지 기능(식사메뉴/메모/위시리스트/습관/설정)으로
// 바로 이동할 수 있는 바로가기를 제공합니다.
// '편집'을 누르면 카드 순서·표시 여부·크기(자세히/간단히)와 바로가기 표시 방식을
// 사용자가 직접 바꿀 수 있습니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ListTodo, Bell, Wallet, CalendarClock, ChevronRight, GripVertical, Eye, EyeOff, SlidersHorizontal,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTodos } from '@/hooks/useTodos';
import { useReminders } from '@/hooks/useReminders';
import { useTimebox, currentSlotKey } from '@/hooks/useTimebox';
import { useHomeLayout } from '@/hooks/useHomeLayout';
import { DEFAULT_HOME_LAYOUT } from '@/lib/homeLayout';
import { fmt } from '@/expense/utils';
import { getBudgetSummary } from '@/expense/bridge';
import { Card } from './ui/Card';
import { MORE_FEATURES } from './MoreMenu';

const CARD_LABELS = {
  todo: '오늘의 할일',
  reminders: '다가오는 알림',
  expense: '이번달 지출',
  timebox: '오늘의 타임박스',
  shortcuts: '바로가기',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 카드 공통 틀: compact면 한 줄 요약만, full이면 children(상세)까지 보여줍니다.
function SummaryCard({ lm, icon: Icon, iconCls, title, subtitle, onClick, compact, children }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className={`transition-colors ${compact ? '!py-2.5' : ''} ${lm ? 'hover:border-indigo-200' : 'hover:border-violet-700'}`}>
        <div className="flex items-center gap-3">
          <div className={`${compact ? 'p-1.5' : 'p-2.5'} rounded-xl shrink-0 ${iconCls}`}>
            <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <div className={`flex-1 min-w-0 ${compact ? 'flex items-baseline gap-2' : ''}`}>
            <p className={`text-sm font-bold shrink-0 ${lm ? 'text-slate-800' : 'text-white'}`}>{title}</p>
            <p className={`text-xs truncate ${lm ? 'text-slate-400' : 'text-gray-500'}`}>{subtitle}</p>
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 ${lm ? 'text-slate-300' : 'text-gray-600'}`} />
        </div>
        {!compact && children}
      </Card>
    </button>
  );
}

function SortableLayoutRow({ card, lm, shortcutStyle, onToggleVisible, onToggleSize, onToggleStyle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const chip = (active) =>
    `text-[11px] px-2 py-1 rounded-lg font-semibold ${
      active
        ? lm ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-900/30 text-violet-400'
        : lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-400'
    }`;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${lm ? 'bg-white border-slate-100' : 'bg-gray-900 border-gray-800'} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className={`p-1 touch-none cursor-grab active:cursor-grabbing ${lm ? 'text-slate-300' : 'text-gray-600'}`}
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className={`flex-1 text-sm font-medium ${card.visible ? (lm ? 'text-slate-700' : 'text-gray-200') : lm ? 'text-slate-300' : 'text-gray-600'}`}>
        {CARD_LABELS[card.id]}
      </span>
      {card.id === 'shortcuts' ? (
        <button onClick={onToggleStyle} className={chip(true)} aria-label="바로가기 표시 방식 변경">
          {shortcutStyle === 'grid' ? '그리드' : '목록'}
        </button>
      ) : (
        <button onClick={onToggleSize} className={chip(card.size === 'full')} aria-label="카드 크기 변경">
          {card.size === 'full' ? '자세히' : '간단히'}
        </button>
      )}
      <button
        onClick={onToggleVisible}
        className={`p-1.5 ${card.visible ? (lm ? 'text-indigo-600' : 'text-violet-400') : lm ? 'text-slate-400' : 'text-gray-500'}`}
        aria-label={card.visible ? `${CARD_LABELS[card.id]} 숨기기` : `${CARD_LABELS[card.id]} 표시`}
      >
        {card.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </li>
  );
}

function LayoutEditor({ lm, layout, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = layout.cards.map((c) => c.id);
  const patch = (id, fn) => onChange({ ...layout, cards: layout.cards.map((c) => (c.id === id ? fn(c) : c)) });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onChange({ ...layout, cards: arrayMove(layout.cards, ids.indexOf(active.id), ids.indexOf(over.id)) });
  };

  return (
    <div className="space-y-2">
      <p className={`text-xs ${lm ? 'text-slate-400' : 'text-gray-500'}`}>
        드래그로 순서를 바꾸고, 크기(자세히/간단히)와 표시 여부를 고르세요.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {layout.cards.map((card) => (
              <SortableLayoutRow
                key={card.id}
                card={card}
                lm={lm}
                shortcutStyle={layout.shortcutStyle}
                onToggleVisible={() => patch(card.id, (c) => ({ ...c, visible: !c.visible }))}
                onToggleSize={() => patch(card.id, (c) => ({ ...c, size: c.size === 'full' ? 'compact' : 'full' }))}
                onToggleStyle={() => onChange({ ...layout, shortcutStyle: layout.shortcutStyle === 'grid' ? 'list' : 'grid' })}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        onClick={() => onChange(DEFAULT_HOME_LAYOUT)}
        className={`w-full text-xs py-2 rounded-xl ${lm ? 'bg-slate-100 text-slate-500' : 'bg-gray-800 text-gray-400'}`}
      >
        기본값으로
      </button>
    </div>
  );
}

export function HomeDashboard({ onGoTodo, onGoExpense, onGoTimebox, onOpenMore }) {
  const { theme } = useTheme();
  const lm = theme === 'light';
  const { todos, loaded: todosLoaded } = useTodos();
  const { reminders, loaded: remindersLoaded } = useReminders();
  const { getDay } = useTimebox();
  const { layout, saveLayout } = useHomeLayout();
  const [editing, setEditing] = useState(false);

  const today = todayStr();
  const muted = lm ? 'text-slate-400' : 'text-gray-500';
  const body = lm ? 'text-slate-600' : 'text-gray-300';

  const todayTodos = useMemo(
    () => (todosLoaded ? todos.filter((t) => t.date === today && !t.completed) : []),
    [todos, todosLoaded, today]
  );

  const dueReminders = useMemo(
    () => (remindersLoaded ? reminders.filter((r) => !r.done && r.datetime && r.datetime.slice(0, 10) <= today) : []),
    [reminders, remindersLoaded, today]
  );

  // localStorage 값이라 서버 렌더와 어긋나지 않도록 마운트 후에 읽습니다.
  const [budget, setBudget] = useState(null);
  useEffect(() => { setBudget(getBudgetSummary(today)); }, [today]);
  const overBudget = budget && budget.effective > 0 && budget.spent > budget.effective;

  const timebox = getDay(today);
  const topItems = timebox.top3
    .map((id) => timebox.brainDump.find((i) => i.id === id))
    .filter(Boolean);
  const nowBlock = timebox.blocks[currentSlotKey()];

  const shortcuts = MORE_FEATURES.filter((f) => f.id !== 'reminders');

  const bulletList = (items) =>
    items.length > 0 && (
      <ul className={`mt-2 pl-12 space-y-0.5 text-xs ${body}`}>
        {items.slice(0, 3).map((t, i) => <li key={i} className="truncate">· {t}</li>)}
        {items.length > 3 && <li className={muted}>외 {items.length - 3}개</li>}
      </ul>
    );

  const renderCard = ({ id, size }) => {
    const compact = size === 'compact';
    switch (id) {
      case 'todo':
        return (
          <SummaryCard
            key={id} lm={lm} compact={compact} onClick={onGoTodo}
            icon={ListTodo} iconCls={lm ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-950/40 text-violet-400'}
            title={`오늘의 할일 ${todayTodos.length}개`}
            subtitle={todayTodos.length === 0 ? '오늘 할 일이 없어요' : compact ? todayTodos[0].title || '(제목 없음)' : ''}
          >
            {bulletList(todayTodos.map((t) => t.title || '(제목 없음)'))}
          </SummaryCard>
        );
      case 'reminders':
        return (
          <SummaryCard
            key={id} lm={lm} compact={compact} onClick={() => onOpenMore('reminders')}
            icon={Bell} iconCls={lm ? 'bg-rose-50 text-rose-500' : 'bg-rose-950/30 text-rose-400'}
            title={`다가오는 알림 ${dueReminders.length}개`}
            subtitle={dueReminders.length === 0 ? '놓친 알림이 없어요' : compact ? dueReminders[0].title || '(제목 없음)' : ''}
          >
            {bulletList(dueReminders.map((r) => r.title || '(제목 없음)'))}
          </SummaryCard>
        );
      case 'expense':
        if (!budget) return null;
        return (
          <SummaryCard
            key={id} lm={lm} compact={compact} onClick={onGoExpense}
            icon={Wallet} iconCls={lm ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-950/30 text-emerald-400'}
            title="이번달 지출"
            subtitle={compact ? `오늘 ₩${fmt(budget.perDay)} 사용 가능` : `₩${fmt(budget.spent)} / ₩${fmt(budget.effective)}`}
          >
            <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${lm ? 'bg-slate-100' : 'bg-gray-800'}`}>
              <div
                className={`h-full rounded-full transition-all ${overBudget ? 'bg-rose-500' : lm ? 'bg-indigo-500' : 'bg-violet-500'}`}
                style={{ width: `${budget.effective > 0 ? Math.min(100, (budget.spent / budget.effective) * 100) : 0}%` }}
              />
            </div>
            <div className={`mt-2 flex justify-between text-xs ${muted}`}>
              <span>
                오늘 쓸 수 있는 금액 <b className={lm ? 'text-indigo-600' : 'text-violet-400'}>₩{fmt(budget.perDay)}</b>
              </span>
              <span>남은 {budget.daysLeft}일</span>
            </div>
          </SummaryCard>
        );
      case 'timebox':
        return (
          <SummaryCard
            key={id} lm={lm} compact={compact} onClick={onGoTimebox}
            icon={CalendarClock} iconCls={lm ? 'bg-amber-50 text-amber-600' : 'bg-amber-950/30 text-amber-400'}
            title="오늘의 타임박스"
            subtitle={
              compact
                ? nowBlock ? `지금: ${nowBlock.text}` : `Top 3 ${topItems.filter((i) => i.done).length}/${topItems.length} 완료`
                : topItems.length === 0 ? 'Top 3를 정해보세요' : `Top 3 ${topItems.filter((i) => i.done).length}/${topItems.length} 완료`
            }
          >
            {topItems.length > 0 && (
              <ol className={`mt-2 pl-12 space-y-0.5 text-xs ${body}`}>
                {topItems.map((i, idx) => (
                  <li key={i.id} className={`truncate ${i.done ? `line-through ${muted}` : ''}`}>{idx + 1}. {i.text}</li>
                ))}
              </ol>
            )}
            {nowBlock && (
              <p className={`mt-2 pl-12 text-xs font-semibold ${lm ? 'text-amber-700' : 'text-amber-300'}`}>
                지금 {currentSlotKey()} · {nowBlock.text}
              </p>
            )}
          </SummaryCard>
        );
      case 'shortcuts':
        return layout.shortcutStyle === 'list' ? (
          <Card key={id} className="!p-1">
            {shortcuts.map(({ id: fid, label, icon: Icon }) => (
              <button
                key={fid}
                onClick={() => onOpenMore(fid)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${lm ? 'hover:bg-slate-50' : 'hover:bg-gray-800'}`}
              >
                <Icon className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
                <span className={`flex-1 text-sm ${lm ? 'text-slate-700' : 'text-gray-200'}`}>{label}</span>
                <ChevronRight className={`w-4 h-4 ${lm ? 'text-slate-300' : 'text-gray-600'}`} />
              </button>
            ))}
          </Card>
        ) : (
          <div key={id} className="grid grid-cols-4 gap-3 pt-2">
            {shortcuts.map(({ id: fid, label, icon: Icon }) => (
              <button
                key={fid}
                onClick={() => onOpenMore(fid)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
                  lm ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-gray-900 border-gray-800 hover:border-violet-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
                <span className={`text-[11px] font-medium text-center leading-tight ${lm ? 'text-slate-700' : 'text-gray-200'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-3">
      <div className="flex justify-end -mt-2">
        <button
          onClick={() => setEditing((v) => !v)}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
            editing
              ? lm ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white'
              : lm ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {editing ? '완료' : '편집'}
        </button>
      </div>

      {editing ? (
        <LayoutEditor lm={lm} layout={layout} onChange={saveLayout} />
      ) : (
        layout.cards.filter((c) => c.visible).map(renderCard)
      )}
    </div>
  );
}
