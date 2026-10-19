'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/NavTabsSection.jsx
// 설정 화면의 '하단 탭 구성'. 드래그로 순서를 바꾸고 눈 아이콘으로 하단 탭에
// 보일 화면을 고릅니다. '더보기'는 항상 마지막 칸에 고정되고, 숨긴 화면은
// '더보기' 안에서 열 수 있습니다.
// ──────────────────────────────────────────────────────────────────────────────
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, PanelBottom } from 'lucide-react';
import { useNavTabs } from '@/hooks/useNavTabs';
import { DEFAULT_NAV_TABS, MAX_NAV_TABS, MORE_TAB_ID } from '@/lib/navTabs';
import { NAV_ITEMS } from './navItems';

function SortableRow({ item, visible, canShow, onToggle, lm }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const Icon = item.icon;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${lm ? 'bg-slate-50 border border-slate-100' : 'bg-gray-800'} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className={`p-1 touch-none cursor-grab active:cursor-grabbing ${lm ? 'text-slate-300' : 'text-gray-600'}`}
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Icon className={`w-4 h-4 ${visible ? (lm ? 'text-indigo-600' : 'text-violet-400') : lm ? 'text-slate-300' : 'text-gray-600'}`} />
      <span className={`flex-1 text-sm font-medium ${visible ? (lm ? 'text-slate-700' : 'text-gray-200') : lm ? 'text-slate-400' : 'text-gray-500'}`}>
        {item.label}
      </span>
      <button
        onClick={onToggle}
        disabled={!visible && !canShow}
        className={`p-1.5 disabled:opacity-30 ${visible ? (lm ? 'text-indigo-600' : 'text-violet-400') : lm ? 'text-slate-400' : 'text-gray-500'}`}
        aria-label={visible ? `${item.label} 하단 탭에서 숨기기` : `${item.label} 하단 탭에 표시`}
      >
        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </li>
  );
}

export function NavTabsSection({ sectionCls, h3Cls, mutedCls, lm }) {
  const { navTabs, saveNavTabs } = useNavTabs();

  const visibleIds = navTabs.filter((id) => id !== MORE_TAB_ID);
  const order = [...visibleIds, ...NAV_ITEMS.map((t) => t.id).filter((id) => !visibleIds.includes(id))];
  const itemById = Object.fromEntries(NAV_ITEMS.map((t) => [t.id, t]));
  const canShow = visibleIds.length < MAX_NAV_TABS - 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const save = (nextOrder, nextVisible) => saveNavTabs(nextOrder.filter((id) => nextVisible.includes(id)));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    save(arrayMove(order, order.indexOf(active.id), order.indexOf(over.id)), visibleIds);
  };

  const toggle = (id) => {
    if (visibleIds.includes(id)) {
      if (visibleIds.length <= 1) return; // 최소 한 개는 남김
      save(order, visibleIds.filter((v) => v !== id));
    } else if (canShow) {
      save(order, [...visibleIds, id]);
    }
  };

  return (
    <section className={sectionCls(lm)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PanelBottom className={`w-4 h-4 ${lm ? 'text-indigo-600' : 'text-violet-400'}`} />
          <h3 className={h3Cls(lm)}>하단 탭 구성</h3>
        </div>
        <button
          onClick={() => saveNavTabs(DEFAULT_NAV_TABS)}
          className={`text-xs px-2.5 py-1.5 rounded-lg ${lm ? 'bg-slate-100 text-slate-600' : 'bg-gray-800 text-gray-400'}`}
        >
          기본값으로
        </button>
      </div>
      <p className={mutedCls(lm)}>
        드래그로 순서를 바꾸고, 눈 아이콘으로 표시할 화면을 고르세요(최대 {MAX_NAV_TABS - 1}개). 숨긴 화면은 &apos;더보기&apos;에서 열 수 있습니다.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {order.map((id) => (
              <SortableRow
                key={id}
                item={itemById[id]}
                visible={visibleIds.includes(id)}
                canShow={canShow}
                onToggle={() => toggle(id)}
                lm={lm}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
